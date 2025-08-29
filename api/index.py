# Backend Python Code (main.py)
import os
import io
import json
import base64
import pickle
from datetime import datetime
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from dotenv import load_dotenv
import google.generativeai as genai
import gspread
import hashlib

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

# Konfigurasi Google OAuth
CLIENT_SECRETS_FILE = "credentials.json"
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]
REDIRECT_URI = f"{BACKEND_URL}/api/auth/callback"

SPREADSHEET_NAME = "Analisis Resume AI"

job_description_text = ""

# ==============================================================================
# FUNGSI-FUNGSI HELPER
# ==============================================================================
def save_credentials(creds):
    try:
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    except Exception as e:
        print(f"Error saving credentials: {e}")

def load_credentials():
    try:
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                return pickle.load(token)
    except Exception as e:
        print(f"Error loading credentials: {e}")
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

def get_google_services():
    creds = load_credentials()
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(GoogleRequest())
            except Exception as e:
                print(f"Error refreshing credentials: {e}")
                raise HTTPException(status_code=401, detail="Token expired. Please login again.")
        else:
            raise HTTPException(status_code=401, detail="User not authenticated")
    
    save_credentials(creds)
    
    try:
        gmail = build('gmail', 'v1', credentials=creds)
        drive = build('drive', 'v3', credentials=creds)
        gc = gspread.authorize(creds)
        return gmail, drive, gc
    except Exception as e:
        print(f"Error building Google services: {e}")
        raise HTTPException(status_code=500, detail="Failed to connect to Google services")

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

def ensure_spreadsheet_exists(gc):
    """Pastikan spreadsheet ada, jika tidak buat baru"""
    try:
        spreadsheet = gc.open(SPREADSHEET_NAME)
        return spreadsheet
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"Spreadsheet '{SPREADSHEET_NAME}' tidak ditemukan, membuat yang baru...")
        try:
            # Buat spreadsheet baru
            spreadsheet = gc.create(SPREADSHEET_NAME)
            sheet = spreadsheet.sheet1
            
            # Tambahkan header
            headers = [
                'Waktu', 'Drive Link', 'Nama', 'Email', 'Nomor Telepon',
                'Pendidikan Terakhir', 'Kekuatan', 'Kekurangan', 
                'Risk Factor', 'Reward Factor', 'Overall Fit', 'Justifikasi'
            ]
            sheet.append_row(headers)
            
            print(f"Spreadsheet '{SPREADSHEET_NAME}' berhasil dibuat!")
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
        model = genai.GenerativeModel('gemini-1.5-flash')
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
            flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=REDIRECT_URI)
            
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
    try:
        flow = Flow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES, redirect_uri=REDIRECT_URI)
        flow.fetch_token(authorization_response=str(request.url))
        save_credentials(flow.credentials)
        return RedirectResponse(url="http://localhost:3000")
    except Exception as e:
        print(f"Auth callback error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

@app.post("/api/logout")
async def logout():
    """Logout user dan hapus credentials"""
    try:
        success = clear_credentials()
        if success:
            return JSONResponse(content={"message": "Logout berhasil"})
        else:
            return JSONResponse(content={"message": "Logout gagal, tapi credentials mungkin sudah dihapus"})
    except Exception as e:
        print(f"Logout error: {e}")
        # Return success even if there's an error to ensure frontend can logout
        return JSONResponse(content={"message": "Logout selesai"})

@app.get("/api/auth-status")
async def get_auth_status():
    """Check authentication status"""
    try:
        is_authenticated = check_auth_status()
        return JSONResponse(content={"authenticated": is_authenticated})
    except Exception as e:
        print(f"Auth status check error: {e}")
        return JSONResponse(content={"authenticated": False})

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
async def start_screening():
    if not job_description_text:
        raise HTTPException(status_code=400, detail="Deskripsi pekerjaan belum di-upload.")
    
    try:
        gmail, drive, gc = get_google_services()
        spreadsheet = ensure_spreadsheet_exists(gc)
        sheet = spreadsheet.sheet1
        
        # Pastikan headers termasuk CV_Hash ada
        ensure_headers_exist(sheet)
        
        # Dapatkan hash CV yang sudah ada
        existing_hashes = get_existing_hashes(sheet)
        
        # Query Gmail untuk email dengan resume
        results = gmail.users().messages().list(
            userId='me', 
            q='subject:cv-ui/ux OR subject:cv-uiux OR subject:cv OR subject:resume has:attachment filename:pdf'
        ).execute()
        
        messages = results.get('messages', [])
        if not messages:
            return JSONResponse(content={
                "message": "Tidak ada email dengan resume ditemukan.", 
                "results": []
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
            "total_emails": len(messages)
        })

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Terjadi error tak terduga di start_screening: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/get-results")
async def get_results():
    try:
        _, _, gc = get_google_services()
        spreadsheet = ensure_spreadsheet_exists(gc)
        sheet = spreadsheet.sheet1
        
        # Ambil semua data
        all_records = sheet.get_all_records()
        
        # Hapus kolom CV_Hash dari hasil yang dikembalikan ke frontend
        filtered_records = []
        for record in all_records:
            filtered_record = {k: v for k, v in record.items() if k != 'CV_Hash'}
            filtered_records.append(filtered_record)
        
        return JSONResponse(content={"results": filtered_records})
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in get_results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch results: {str(e)}")

@app.delete("/api/clear-results")
async def clear_results():
    try:
        _, _, gc = get_google_services()
        spreadsheet = ensure_spreadsheet_exists(gc)
        sheet = spreadsheet.sheet1
        
        # Hapus semua data kecuali header
        sheet.clear()
        headers = [
            'Waktu', 'Drive Link', 'Nama', 'Email', 'Nomor Telepon',
            'Pendidikan Terakhir', 'Kekuatan', 'Kekurangan', 
            'Risk Factor', 'Reward Factor', 'Overall Fit', 'Justifikasi', 'CV_Hash'
        ]
        sheet.append_row(headers)
        
        return JSONResponse(content={"message": "Semua data berhasil dihapus."})
        
    except Exception as e:
        print(f"Error in clear_results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear results: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Server is running"}