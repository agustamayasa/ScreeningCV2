import os
import io
import json
import base64
import pickle
from datetime import datetime
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
import google.generativeai as genai
import gspread
import hashlib
from pydantic import BaseModel
from typing import List, Optional

# ==============================================================================
# KONFIGURASI DAN SETUP AWAL
# ==============================================================================
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
load_dotenv()

# --- Logika untuk memuat kredensial ---
# Dilakukan sekali saat aplikasi dimulai
creds_info = None
creds_b64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
if creds_b64:
    # Jika ada env var (di server hosting), decode dan gunakan
    print("Memuat kredensial dari environment variable...")
    creds_json_str = base64.b64decode(creds_b64).decode('utf-8')
    creds_info = json.loads(creds_json_str)
else:
    print("Memuat kredensial dari file lokal (credentials.json)...")

# Konfigurasi Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise SystemExit("GEMINI_API_KEY tidak ditemukan di file .env")
genai.configure(api_key=GEMINI_API_KEY)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]
REDIRECT_URI = f"{BACKEND_URL}/api/auth/callback"

# Global variables untuk menyimpan konfigurasi screening
job_description_text = ""
job_position_name = ""
email_subjects = []

# ==============================================================================
# PYDANTIC MODELS
# ==============================================================================
class ScreeningConfig(BaseModel):
    job_position: str
    email_subjects: List[str]

class JobDescriptionResponse(BaseModel):
    message: str
    preview: str

# ==============================================================================
# FUNGSI-FUNGSI HELPER
# ==============================================================================
def credentials_to_dict(credentials):
    """Mengubah objek Credentials menjadi dictionary yang aman untuk JSON."""
    return {'token': credentials.token,
            'refresh_token': credentials.refresh_token,
            'token_uri': credentials.token_uri,
            'client_id': credentials.client_id,
            'client_secret': credentials.client_secret,
            'scopes': credentials.scopes}

def get_creds_from_cookie(request: Request) -> Credentials | None:
    """Membaca dan memvalidasi kredensial dari cookie."""
    token_str = request.cookies.get("auth_token")
    if not token_str:
        return None
    
    try:
        token_dict = json.loads(token_str)
        creds = Credentials(**token_dict)
        # Periksa apakah token valid atau bisa di-refresh
        if creds and creds.valid:
            return creds
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())
            return creds
        return None
    except (json.JSONDecodeError, TypeError):
        return None

def clear_credentials():
    """Hapus file token untuk logout"""
    try:
        if os.path.exists('token.pickle'):
            os.remove('token.pickle')
            print("Credentials cleared successfully")
        return True
    except Exception as e:
        print(f"Error clearing credentials: {e}")
        return False

def get_google_services(request: Request):
    """Mendapatkan service Google menggunakan kredensial dari cookie."""
    creds = get_creds_from_cookie(request)
    if not creds:
        raise HTTPException(status_code=401, detail="User not authenticated")
    
    # Simpan kembali token yang mungkin sudah di-refresh ke cookie
    refreshed_creds_dict = credentials_to_dict(creds)
    
    gmail = build('gmail', 'v1', credentials=creds)
    drive = build('drive', 'v3', credentials=creds)
    gc = gspread.authorize(creds)
    
    return gmail, drive, gc, refreshed_creds_dict

def generate_spreadsheet_name(job_position: str) -> str:
    """Generate nama spreadsheet berdasarkan posisi pekerjaan"""
    if not job_position.strip():
        return "Analisis Resume AI"
    
    # Bersihkan nama posisi dari karakter yang tidak valid
    clean_position = "".join(c for c in job_position if c.isalnum() or c in (' ', '-', '_')).strip()
    return f"Analisis Resume AI - {clean_position}"

def check_auth_status():
    """Periksa apakah user sudah login dan kredensial masih valid"""
    try:
        creds = load_credentials()
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(GoogleRequest())
                    save_credentials(creds)
                    return True
                except Exception as e:
                    print(f"Error refreshing credentials: {e}")
                    return False
            else:
                return False
        return True
    except Exception as e:
        print(f"Error checking auth status: {e}")
        return False

def ensure_spreadsheet_exists(gc, spreadsheet_name: str):
    """Pastikan spreadsheet ada, jika tidak buat baru"""
    try:
        spreadsheet = gc.open(spreadsheet_name)
        print(f"Spreadsheet '{spreadsheet_name}' ditemukan")
        return spreadsheet
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"Spreadsheet '{spreadsheet_name}' tidak ditemukan, membuat yang baru...")
        try:
            # Buat spreadsheet baru
            spreadsheet = gc.create(spreadsheet_name)
            sheet = spreadsheet.sheet1
            
            # Tambahkan header
            headers = [
                'Waktu', 'Drive Link', 'Nama', 'Email', 'Nomor Telepon',
                'Pendidikan Terakhir', 'Kekuatan', 'Kekurangan', 
                'Risk Factor', 'Reward Factor', 'Overall Fit', 'Justifikasi', 'CV_Hash'
            ]
            sheet.append_row(headers)
            
            print(f"Spreadsheet '{spreadsheet_name}' berhasil dibuat!")
            return spreadsheet
        except Exception as e:
            print(f"Error creating spreadsheet: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create spreadsheet: {str(e)}")

def upload_to_drive(drive, file_data, filename):
    """Upload file ke Google Drive dan return link"""
    try:
        # Buat file metadata
        file_metadata = {
            'name': f"CV_{filename}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
            'parents': []  # Bisa ditambahkan folder ID jika ingin simpan di folder tertentu
        }
        
        # Upload file
        media = io.BytesIO(file_data)
        
        # Import googleapiclient.http
        from googleapiclient.http import MediaIoBaseUpload
        media_upload = MediaIoBaseUpload(media, mimetype='application/pdf')
        
        file = drive.files().create(
            body=file_metadata,
            media_body=media_upload,
            fields='id'
        ).execute()
        
        file_id = file.get('id')
        
        # Set file permission menjadi readable
        drive.permissions().create(
            fileId=file_id,
            body={'role': 'reader', 'type': 'anyone'}
        ).execute()
        
        # Return Google Drive link
        drive_link = f"https://drive.google.com/file/d/{file_id}/view"
        return drive_link
        
    except Exception as e:
        print(f"Error uploading to Drive: {e}")
        return None

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Gagal mengekstrak PDF: {e}")
        return ""
    return text.strip()

def analyze_with_gemini(job_desc: str, resume_text: str) -> dict:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        Sebagai seorang HR Specialist yang berpengalaman, analisis resume pelamar berikut dengan detail dan objektif berdasarkan deskripsi pekerjaan yang diberikan.

        INSTRUKSI ANALISIS:
        1. Baca resume dengan teliti dan ekstrak informasi penting
        2. Bandingkan dengan requirements job description
        3. Berikan penilaian yang objektif dan konstruktif
        4. Fokus pada relevansi dan potensi kandidat

        FORMAT OUTPUT (JSON ONLY, NO MARKDOWN):
        {{
            "nama": "Nama lengkap pelamar (wajib diisi dari resume)",
            "email": "Email pelamar jika tersedia, jika tidak ada tulis 'Tidak tercantum'",
            "nomor_telepon": "Nomor telepon jika tersedia, jika tidak ada tulis 'Tidak tercantum', Gunakan format contoh +6289836718275",
            "pendidikan_terakhir": "Jenjang dan jurusan pendidikan terakhir (Rubah Seluruhnya Gunakan bahasa indonesia dengan Format contoh: S1 Informatika)",
            "kekuatan": "3-4 kekuatan utama kandidat yang relevan dengan posisi (maksimal 200 kata)",
            "kekurangan": "Area yang perlu ditingkatkan atau gap yang ditemukan (maksimal 150 kata)",
            "risk_factor": "Potensi risiko dalam merekrut kandidat ini (maksimal 150 kata)",
            "reward_factor": "Potensi manfaat dan value yang akan dibawa kandidat (maksimal 150 kata)",
            "overall_fit": 85,
            "justifikasi": "Penjelasan detail mengapa memberikan score tersebut (maksimal 200 kata)"
        }}

        KRITERIA PENILAIAN:
        - Overall Fit Score (0-100):
          * 90-100: Sangat sesuai, kandidat ideal
          * 80-89: Sesuai dengan sedikit gap
          * 70-79: Cukup sesuai tapi ada beberapa kekurangan
          * 60-69: Kurang sesuai, banyak gap
          * <60: Tidak sesuai

        DESKRIPSI PEKERJAAN:
        {job_desc[:2000]}

        RESUME PELAMAR:
        {resume_text[:5000]}

        Berikan analisis yang profesional, jujur, dan membantu dalam proses seleksi.
        """
        
        response = model.generate_content(prompt)
        
        # Bersihkan response text
        cleaned_text = response.text.strip()
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text.replace('```json', '').replace('```', '').strip()
        elif cleaned_text.startswith('```'):
            cleaned_text = cleaned_text.replace('```', '').strip()
        
        # Parse JSON
        result = json.loads(cleaned_text)
        
        # Validasi dan set default values
        default_values = {
            'nama': 'Tidak tercantum',
            'email': 'Tidak tercantum',
            'nomor_telepon': 'Tidak tercantum',
            'pendidikan_terakhir': 'Tidak tercantum',
            'kekuatan': 'Tidak dapat dianalisis',
            'kekurangan': 'Tidak dapat dianalisis',
            'risk_factor': 'Tidak dapat dianalisis',
            'reward_factor': 'Tidak dapat dianalisis',
            'overall_fit': 0,
            'justifikasi': 'Tidak dapat dianalisis'
        }
        
        for field, default_value in default_values.items():
            if field not in result or result[field] == '':
                result[field] = default_value
        
        # Pastikan overall_fit adalah integer
        if isinstance(result['overall_fit'], str):
            try:
                result['overall_fit'] = int(''.join(filter(str.isdigit, result['overall_fit']))) or 0
            except:
                result['overall_fit'] = 0
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {response.text if 'response' in locals() else 'No response'}")
        return None
    except Exception as e:
        print(f"Error dari Gemini API: {e}")
        return None

def create_cv_hash(filename, resume_text):
    """Membuat hash unik berdasarkan filename dan isi CV untuk deteksi duplikasi"""
    content = f"{filename}:{resume_text[:1000]}"  # Gunakan 1000 karakter pertama
    return hashlib.md5(content.encode()).hexdigest()

def get_existing_hashes(sheet):
    """Mengambil semua hash CV yang sudah ada di spreadsheet"""
    try:
        all_records = sheet.get_all_records()
        existing_hashes = set()
        
        for record in all_records:
            cv_hash = record.get('CV_Hash', '')
            if cv_hash:
                existing_hashes.add(cv_hash)
        
        return existing_hashes
    except Exception as e:
        print(f"Error getting existing hashes: {e}")
        return set()

def ensure_headers_exist(sheet):
    """Memastikan header kolom termasuk CV_Hash ada di spreadsheet"""
    try:
        headers = sheet.row_values(1)
        required_headers = [
            'Waktu', 'Drive Link', 'Nama', 'Email', 'Nomor Telepon',
            'Pendidikan Terakhir', 'Kekuatan', 'Kekurangan', 
            'Risk Factor', 'Reward Factor', 'Overall Fit', 'Justifikasi', 'CV_Hash'
        ]
        
        if not headers or len(headers) != len(required_headers):
            sheet.clear()
            sheet.append_row(required_headers)
            print("Headers updated with new columns")
            
    except Exception as e:
        print(f"Error ensuring headers: {e}")

def build_gmail_query(email_subjects: List[str]) -> str:
    """Membangun query Gmail berdasarkan subjek email yang diinput"""
    if not email_subjects:
        # Default query jika tidak ada subjek yang dispecified
        return 'subject:cv OR subject:resume has:attachment filename:pdf'
    
    # Bangun query dengan OR untuk setiap subjek
    subject_queries = []
    for subject in email_subjects:
        subject = subject.strip()
        if subject:
            # Escape special characters jika perlu
            subject_queries.append(f'subject:{subject}')
    
    if not subject_queries:
        return 'subject:cv OR subject:resume has:attachment filename:pdf'
    
    # Gabungkan semua subjek dengan OR dan tambahkan filter attachment
    query = ' OR '.join(subject_queries) + ' has:attachment filename:pdf'
    return query

def check_spreadsheet_exists(gc, spreadsheet_name: str) -> bool:
    """Periksa apakah spreadsheet dengan nama tertentu sudah ada"""
    try:
        gc.open(spreadsheet_name)
        return True
    except gspread.exceptions.SpreadsheetNotFound:
        return False

def get_spreadsheet_url(gc, spreadsheet_name: str) -> str:
    """Mendapatkan URL spreadsheet berdasarkan nama"""
    try:
        spreadsheet = gc.open(spreadsheet_name)
        return f"https://docs.google.com/spreadsheets/d/{spreadsheet.id}/edit"
    except gspread.exceptions.SpreadsheetNotFound:
        return ""
# ==============================================================================
# ENDPOINTS API
# ==============================================================================
@app.get("/")
def root():
    return {"message": "AI Resume Screening API is running!"}

@app.get("/api/login")
def login():
    """
    Memulai alur otentikasi Google.
    Fleksibel untuk development (file) dan production (env var).
    """
    try:
        if creds_info:
            # Jika creds_info ada (dari env var), gunakan from_client_config
            flow = Flow.from_client_config(creds_info, scopes=SCOPES, redirect_uri=REDIRECT_URI)
        else:
            # Jika tidak, gunakan file lokal (untuk development)
            flow = Flow.from_client_secrets_file("credentials.json", scopes=SCOPES, redirect_uri=REDIRECT_URI)
            
        authorization_url, _ = flow.authorization_url(access_type='offline', include_granted_scopes='true')
        return RedirectResponse(url=authorization_url)
        
    except FileNotFoundError:
        # Error jika file tidak ditemukan di lokal dan env var juga tidak ada
        raise HTTPException(status_code=500, detail="File credentials.json tidak ditemukan dan environment variable tidak diatur.")
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Gagal menginisialisasi alur login.")

@app.get("/api/auth/callback")
async def auth_callback(request: Request):
    """Menangani callback, menukar kode dengan token, dan MENYIMPANNYA DI COOKIE."""
    try:
        # Logika inisialisasi flow tetap sama
        if creds_info:
            flow = Flow.from_client_config(creds_info, scopes=SCOPES, redirect_uri=REDIRECT_URI)
        else:
            flow = Flow.from_client_secrets_file("credentials.json", scopes=SCOPES, redirect_uri=REDIRECT_URI)

        flow.fetch_token(authorization_response=str(request.url))
        
        # --- PERUBAHAN UTAMA DI SINI ---
        credentials = flow.credentials
        creds_dict = credentials_to_dict(credentials)
        
        # Buat respons redirect dan atur cookie di dalamnya
        response = RedirectResponse(url=FRONTEND_URL)
        response.set_cookie(
            key="auth_token", 
            value=json.dumps(creds_dict), 
            httponly=True,       # Cookie tidak bisa diakses oleh JavaScript
            secure=True,         # Hanya dikirim melalui HTTPS
            samesite="Lax",      # Perlindungan CSRF
            max_age=60*60*24*7   # Cookie berlaku selama 7 hari
        )
        return response
        # -----------------------------

    except Exception as e:
        print(f"Authentication callback error: {e}")
        raise HTTPException(status_code=400, detail="Authentication failed")

@app.post("/api/logout")
async def logout():
    """Logout user dan hapus credentials"""
    try:
        success = clear_credentials()
        
        # Buat response dan hapus cookie
        response = JSONResponse(content={"message": "Logout berhasil"})
        response.delete_cookie(key="auth_token")
        
        return response
    except Exception as e:
        print(f"Logout error: {e}")
        # Return success even if there's an error to ensure frontend can logout
        response = JSONResponse(content={"message": "Logout selesai"})
        response.delete_cookie(key="auth_token")
        return response

@app.get("/api/auth-status")
async def get_auth_status(request: Request):
    """Check authentication status"""
    try:
        creds = get_creds_from_cookie(request)
        is_authenticated = creds is not None
        return JSONResponse(content={"authenticated": is_authenticated})
    except Exception as e:
        print(f"Auth status check error: {e}")
        return JSONResponse(content={"authenticated": False})

@app.post("/api/set-screening-config")
async def set_screening_config(config: ScreeningConfig, request: Request):
    """Set konfigurasi screening: nama posisi dan subjek email"""
    global job_position_name, email_subjects
    
    try:
        job_position_name = config.job_position.strip()
        email_subjects = [subject.strip() for subject in config.email_subjects if subject.strip()]
        
        if not job_position_name:
            raise HTTPException(status_code=400, detail="Nama posisi pekerjaan tidak boleh kosong")
        
        if not email_subjects:
            raise HTTPException(status_code=400, detail="Minimal satu subjek email harus diisi")
        
        # Coba dapatkan URL spreadsheet
        spreadsheet_url = ""
        try:
            _, _, gc, _ = get_google_services(request=request)
            spreadsheet_name = generate_spreadsheet_name(job_position_name)
            spreadsheet_url = get_spreadsheet_url(gc, spreadsheet_name)
        except:
            pass
        
        return JSONResponse(content={
            "message": "Konfigurasi screening berhasil disimpan",
            "job_position": job_position_name,
            "email_subjects": email_subjects,
            "spreadsheet_name": generate_spreadsheet_name(job_position_name),
            "spreadsheet_url": spreadsheet_url
        })
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error setting screening config: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to set configuration: {str(e)}")

@app.get("/api/get-screening-config")
async def get_screening_config(request: Request):
    """Mendapatkan konfigurasi screening saat ini"""
    spreadsheet_url = ""
    if job_position_name and isLoggedIn:  # Hanya cek URL jika sudah login dan ada posisi
        try:
            _, _, gc, _ = get_google_services(request=request)
            spreadsheet_name = generate_spreadsheet_name(job_position_name)
            spreadsheet_url = get_spreadsheet_url(gc, spreadsheet_name)
        except:
            pass  # Ignore error jika belum login atau spreadsheet belum ada
    
    return JSONResponse(content={
        "job_position": job_position_name,
        "email_subjects": email_subjects,
        "spreadsheet_name": generate_spreadsheet_name(job_position_name) if job_position_name else "",
        "spreadsheet_url": spreadsheet_url,
        "has_job_description": bool(job_description_text)
    })

@app.post("/api/upload-job-description")
async def upload_job_description(file: UploadFile = File(...)):
    global job_description_text
    
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File harus berformat PDF")
        
        pdf_bytes = await file.read()
        job_description_text = extract_text_from_pdf_bytes(pdf_bytes)
        
        if not job_description_text:
            raise HTTPException(status_code=400, detail="Gagal mengekstrak teks dari PDF atau PDF kosong")
        
        return {"message": "Deskripsi pekerjaan berhasil diekstrak.", "preview": job_description_text[:500] + "..."}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/start-screening")
async def start_screening(request: Request):
    global job_description_text, job_position_name, email_subjects
    
    if not job_description_text:
        raise HTTPException(status_code=400, detail="Deskripsi pekerjaan belum di-upload.")
    
    if not job_position_name:
        raise HTTPException(status_code=400, detail="Nama posisi pekerjaan belum diset. Gunakan endpoint /api/set-screening-config terlebih dahulu.")
    
    if not email_subjects:
        raise HTTPException(status_code=400, detail="Subjek email belum diset. Gunakan endpoint /api/set-screening-config terlebih dahulu.")
    
    try:
        gmail, drive, gc, refreshed_creds = get_google_services(request=request)
        
        # Generate nama spreadsheet berdasarkan posisi pekerjaan
        spreadsheet_name = generate_spreadsheet_name(job_position_name)
        spreadsheet = ensure_spreadsheet_exists(gc, spreadsheet_name)
        sheet = spreadsheet.sheet1
        
        # Pastikan headers termasuk CV_Hash ada
        ensure_headers_exist(sheet)
        
        # Dapatkan hash CV yang sudah ada
        existing_hashes = get_existing_hashes(sheet)
        
        # Build query berdasarkan subjek email yang diinput
        gmail_query = build_gmail_query(email_subjects)
        print(f"Gmail query: {gmail_query}")
        
        # Query Gmail untuk email dengan resume
        results = gmail.users().messages().list(
            userId='me', 
            q=gmail_query
        ).execute()
        
        messages = results.get('messages', [])
        if not messages:
            return JSONResponse(content={
                "message": "Tidak ada email dengan resume ditemukan untuk subjek yang ditentukan.", 
                "results": [],
                "spreadsheet_name": spreadsheet_name,
                "gmail_query_used": gmail_query
            })
        
        processed_results = []
        processed_count = 0
        skipped_count = 0
        
        for message in messages[:50]:  # Proses maksimal 50 email untuk menghindari timeout
            try:
                msg = gmail.users().messages().get(userId='me', id=message['id']).execute()
                
                # Periksa apakah email memiliki attachments
                payload = msg['payload']
                parts = payload.get('parts', [])
                if not parts:
                    continue
                
                for part in parts:
                    filename = part.get('filename', '')
                    if filename and filename.lower().endswith('.pdf'):
                        try:
                            attachment_id = part['body']['attachmentId']
                            attachment = gmail.users().messages().attachments().get(
                                userId='me', 
                                messageId=message['id'], 
                                id=attachment_id
                            ).execute()
                            
                            file_data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
                            resume_text = extract_text_from_pdf_bytes(file_data)
                            
                            if not resume_text:
                                print(f"Gagal ekstrak teks dari {filename}")
                                continue
                            
                            # Buat hash untuk CV ini
                            cv_hash = create_cv_hash(filename, resume_text)
                            
                            # Periksa apakah CV sudah pernah diproses
                            if cv_hash in existing_hashes:
                                print(f"CV {filename} sudah pernah diproses, skip.")
                                skipped_count += 1
                                continue
                            
                            # Upload ke Google Drive
                            drive_link = upload_to_drive(drive, file_data, filename)
                            if not drive_link:
                                drive_link = "Gagal upload ke Drive"
                            
                            analysis_result = analyze_with_gemini(job_description_text, resume_text)
                            if not analysis_result:
                                print(f"Gagal analisis {filename}")
                                continue
                            
                            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            row_to_insert = [
                                current_time,
                                drive_link,
                                analysis_result.get('nama', 'Tidak tercantum'),
                                analysis_result.get('email', 'Tidak tercantum'),
                                analysis_result.get('nomor_telepon', 'Tidak tercantum'),
                                analysis_result.get('pendidikan_terakhir', 'Tidak tercantum'),
                                analysis_result.get('kekuatan', 'Tidak dapat dianalisis'),
                                analysis_result.get('kekurangan', 'Tidak dapat dianalisis'),
                                analysis_result.get('risk_factor', 'Tidak dapat dianalisis'),
                                analysis_result.get('reward_factor', 'Tidak dapat dianalisis'),
                                analysis_result.get('overall_fit', 0),
                                analysis_result.get('justifikasi', 'Tidak dapat dianalisis'),
                                cv_hash  # Tambahkan hash sebagai kolom terakhir
                            ]
                            
                            sheet.append_row(row_to_insert)
                            existing_hashes.add(cv_hash)  # Tambahkan ke set agar tidak diproses lagi dalam sesi ini
                            
                            processed_results.append({
                                "Waktu": current_time,
                                "Drive Link": drive_link,
                                "Nama": analysis_result.get('nama', 'Tidak tercantum'),
                                "Email": analysis_result.get('email', 'Tidak tercantum'),
                                "Nomor Telepon": analysis_result.get('nomor_telepon', 'Tidak tercantum'),
                                "Pendidikan Terakhir": analysis_result.get('pendidikan_terakhir', 'Tidak tercantum'),
                                "Kekuatan": analysis_result.get('kekuatan', 'Tidak dapat dianalisis'),
                                "Kekurangan": analysis_result.get('kekurangan', 'Tidak dapat dianalisis'),
                                "Risk Factor": analysis_result.get('risk_factor', 'Tidak dapat dianalisis'),
                                "Reward Factor": analysis_result.get('reward_factor', 'Tidak dapat dianalisis'),
                                "Overall Fit": analysis_result.get('overall_fit', 0),
                                "Justifikasi": analysis_result.get('justifikasi', 'Tidak dapat dianalisis')
                            })
                            processed_count += 1
                            print(f"Berhasil proses: {filename}")
                            
                        except Exception as e:
                            print(f"Error processing attachment {filename}: {e}")
                            continue
                            
            except Exception as e:
                print(f"Error processing message {message['id']}: {e}")
                continue

        message = f"{processed_count} resume baru berhasil diproses, {skipped_count} resume sudah ada sebelumnya dari {len(messages)} email."
        
        return JSONResponse(content={
            "message": message, 
            "results": processed_results,
            "processed_count": processed_count,
            "skipped_count": skipped_count,
            "total_emails": len(messages),
            "spreadsheet_name": spreadsheet_name,
            "gmail_query_used": gmail_query
        })

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Terjadi error tak terduga di start_screening: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/get-results")
async def get_results(request: Request):
    global job_position_name
    
    try:
        _, _, gc, _ = get_google_services(request=request)
        
        # Jika tidak ada nama posisi yang diset, gunakan spreadsheet default
        if not job_position_name:
            spreadsheet_name = "Analisis Resume AI"
        else:
            spreadsheet_name = generate_spreadsheet_name(job_position_name)
        
        spreadsheet = ensure_spreadsheet_exists(gc, spreadsheet_name)
        sheet = spreadsheet.sheet1
        
        # Ambil semua data
        all_records = sheet.get_all_records()
        
        # Hapus kolom CV_Hash dari hasil yang dikembalikan ke frontend
        filtered_records = []
        for record in all_records:
            filtered_record = {k: v for k, v in record.items() if k != 'CV_Hash'}
            filtered_records.append(filtered_record)
        
        return JSONResponse(content={
            "results": filtered_records,
            "spreadsheet_name": spreadsheet_name
        })
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in get_results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch results: {str(e)}")

# Di file backend FastAPI Anda (main.py)

@app.delete("/api/clear-results")
async def clear_results(request: Request):
    global job_position_name
    
    try:
        _, _, gc, _ = get_google_services(request=request)
        
        if not job_position_name:
            spreadsheet_name = "Analisis Resume AI"
        else:
            spreadsheet_name = generate_spreadsheet_name(job_position_name)
            
        spreadsheet = ensure_spreadsheet_exists(gc, spreadsheet_name)
        sheet = spreadsheet.sheet1
        
        # --- PERBAIKAN: Kosongkan isi cell, bukan hapus baris ---
        row_count = sheet.row_count
        col_count = sheet.col_count

        if row_count > 1:
            # Ambil range mulai dari baris ke-2 sampai akhir, semua kolom
            cell_range = f"A2:{gspread.utils.rowcol_to_a1(row_count, col_count)}"
            
            # Isi semua dengan string kosong
            empty_values = [["" for _ in range(col_count)] for _ in range(row_count - 1)]
            
            sheet.update(cell_range, empty_values)
        
        return JSONResponse(content={
            "message": f"Isi data pada spreadsheet '{spreadsheet_name}' berhasil dikosongkan (header tetap).",
            "spreadsheet_name": spreadsheet_name
        })
        
    except Exception as e:
        print(f"Error in clear_results: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal menghapus data: {str(e)}")


@app.get("/api/list-spreadsheets")
async def list_spreadsheets(request: Request):
    """Menampilkan daftar spreadsheet yang ada"""
    try:
        _, _, gc, _ = get_google_services(request=request)
        
        # Cari semua spreadsheet yang dimulai dengan "Analisis Resume AI"
        all_spreadsheets = []
        try:
            spreadsheet_list = gc.list_spreadsheet_files()
            for spreadsheet_info in spreadsheet_list:
                name = spreadsheet_info.get('name', '')
                if name.startswith('Analisis Resume AI'):
                    all_spreadsheets.append({
                        'name': name,
                        'id': spreadsheet_info.get('id', ''),
                        'url': f"https://docs.google.com/spreadsheets/d/{spreadsheet_info.get('id', '')}/edit"
                    })
        except Exception as e:
            print(f"Error listing spreadsheets: {e}")
        
        return JSONResponse(content={
            "spreadsheets": all_spreadsheets,
            "current_spreadsheet": generate_spreadsheet_name(job_position_name) if job_position_name else "Belum diset"
        })
        
    except Exception as e:
        print(f"Error in list_spreadsheets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list spreadsheets: {str(e)}")

@app.get("/api/health")
def health_check():
    return {
        "status": "ok", 
        "message": "Server is running",
        "current_job_position": job_position_name or "Belum diset",
        "email_subjects_count": len(email_subjects),
        "has_job_description": bool(job_description_text)
    }