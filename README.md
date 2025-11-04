<div align="center">
  <img src="https://raw.githubusercontent/agustamayasa/screeningcv2/main/public/rekruta1.jpg" alt="Rekruta Logo" width="400"/>
</div>

<h1 align="center">Rekruta: Asisten Screening CV Berbasis AI</h1>

<div align="center">
  <p>
    <strong>Otomatiskan Screening Ratusan CV dalam Hitungan Menit</strong>
  </p>
  <p>
    Biarkan AI menganalisis, memfilter, dan memberi peringkat kandidat terbaik langsung dari Gmail & Google Drive Anda, sementara Anda fokus pada hal terpenting: wawancara.
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
    <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=nextdotjs" alt="Next.js">
    <img src="https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi" alt="FastAPI">
    <img src="https://img.shields.io/badge/Google_Gemini-AI-blue?logo=google" alt="Google Gemini">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss" alt="Tailwind CSS">
  </p>
</div>

---

## 🚀 Fitur Utama

**Rekruta** adalah platform *full-stack* yang dirancang untuk mengotomatiskan dan mempercepat proses rekrutmen awal dengan mengintegrasikan kekuatan AI generatif ke dalam alur kerja Google Workspace Anda.

* **🔐 Otentikasi Google (OAuth 2.0):** Login dengan aman dan cepat menggunakan akun Google Anda. Aplikasi ini mendapatkan izin untuk membaca Gmail, mengelola file di Google Drive, dan mengedit Google Sheets atas nama Anda.
* **⚙️ Konfigurasi Screening Dinamis:** Atur lowongan pekerjaan yang sedang dibuka. Tentukan **Posisi Pekerjaan** (digunakan untuk penamaan folder & file) dan **Subjek Email** yang spesifik untuk memindai CV yang relevan di inbox Anda.
* **📄 Unggah Deskripsi Pekerjaan:** Unggah deskripsi pekerjaan (JD) dalam format PDF. Teks dari JD ini akan diekstrak dan digunakan oleh AI sebagai "kriteria" utama untuk menilai setiap CV.
* **📨 Pemindai Gmail Otomatis:** Saat analisis dimulai, Rekruta secara otomatis memindai inbox Gmail Anda mencari email yang cocok dengan kriteria subjek yang telah Anda tentukan dan memiliki lampiran PDF.
* **🧠 Analisis CV Berbasis AI (Google Gemini):**
    * Setiap CV yang ditemukan akan diekstrak teksnya.
    * Teks CV dan teks Deskripsi Pekerjaan dikirim ke **Google Gemini API** untuk dianalisis.
    * AI akan mengembalikan data terstruktur dalam format JSON, berisi:
        * Nama, Email, dan Nomor Telepon kandidat.
        * Pendidikan terakhir.
        * Daftar **Kekuatan** & **Kekurangan** yang relevan dengan JD.
        * Faktor **Risiko** (Risk Factor) dan **Keuntungan** (Reward Factor).
        * **Skor Kecocokan (Overall Fit)** (0-100).
        * **Justifikasi** mendalam untuk skor yang diberikan.
* **☁️ Integrasi Google Drive:** Setiap file CV (PDF) yang diproses secara otomatis diunggah ke folder khusus di Google Drive Anda (`AI Resume Screening > Screening - [Nama Posisi] > CV`), lengkap dengan link yang dapat dibagikan.
* **📊 Integrasi Google Sheets:** Semua hasil analisis dari AI (skor, justifikasi, data kontak, link Drive, dll.) secara otomatis dimasukkan sebagai baris baru ke dalam Google Sheet yang dibuat khusus untuk lowongan tersebut.
* **🖥️ Dashboard Hasil Interaktif:**
    * Lihat semua kandidat yang telah dianalisis dalam tabel yang rapi.
    * **Pencarian:** Cari kandidat berdasarkan nama, email, atau keahlian.
    * **Sortir:** Urutkan kandidat berdasarkan Skor Kecocokan, Nama, atau Tanggal.
    * **Paginasi:** Navigasi mudah untuk ratusan hasil.
    * **Modal Detail:** Klik tombol "Detail" untuk melihat laporan analisis lengkap untuk setiap kandidat dalam modal *pop-up* yang bersih.
* **🔄 Deteksi Duplikat:** Aplikasi membuat *hash* unik untuk setiap CV yang diproses untuk mencegah pemrosesan dan penduplikasian data yang sama di Google Sheets.
* **📡 Streaming Progres Real-time (SSE):** Tonton proses screening secara langsung! Backend menggunakan *Server-Sent Events (SSE)* untuk mengirim pembaruan status ke frontend, mulai dari "Mencari email..." hingga "Memproses CV: [nama file]..." dan "Selesai".

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun dengan arsitektur *full-stack* modern yang memisahkan frontend dan backend.

### Frontend
* **Framework:** [Next.js 15](https://nextjs.org/) (menggunakan App Router)
* **Bahasa:** JavaScript (React)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Manajemen State:** React Hooks (`useState`, `useEffect`)
* **Fetch Data:** [Axios](https://axios-http.com/) (untuk permintaan API) & `fetch` native (untuk streaming SSE)

### Backend (Serverless API)
* **Framework:** [FastAPI (Python)](https://fastapi.tiangolo.com/)
* **Bahasa:** Python 3.10+
* **AI:** [Google Gemini API](https://ai.google.dev/) (`google-generativeai`)
* **Google APIs:**
    * [Google API Python Client](https://github.com/googleapis/google-api-python-client)
    * [Google Auth OAuthlib](https://google-auth-oauthlib.readthedocs.io/) (untuk alur OAuth 2.0)
    * [gspread](https://docs.gspread.org/) (untuk interaksi Google Sheets)
* **Ekstraksi PDF:** [pdfplumber](https://github.com/jsvine/pdfplumber)
* **Deployment:** Dikonfigurasi untuk Vercel (sebagai Serverless Functions)

---

## 📂 Struktur Proyek

Berikut adalah gambaran umum dari struktur file dan direktori dalam proyek ini:

Reviewing Formatting Issues

I'm now carefully examining the Markdown formatting to identify and rectify any errors. The goal is to ensure all elements are correctly enclosed within the appropriate Markdown syntax. I'm focusing on the "outside the markdown area" issue, prioritizing comprehensive and easily copied code blocks.

Addressing Code Block Integration

I've tackled the problematic code block, ensuring the complete text is now wrapped in a single, easily copyable Markdown code block. I've verified that the original HTML tags are still present, within the block. The key change is the single, unified block to remedy the copying issue.

Tentu, ini adalah file README.md lengkap yang telah diperbaiki formatnya, berada dalam satu blok kode sehingga mudah Anda salin:

Markdown
<div align="center">
  <img src="https://raw.githubusercontent/agustamayasa/screeningcv2/main/public/rekruta1.jpg" alt="Rekruta Logo" width="400"/>
</div>

<h1 align="center">Rekruta: Asisten Screening CV Berbasis AI</h1>

<div align="center">
  <p>
    <strong>Otomatiskan Screening Ratusan CV dalam Hitungan Menit</strong>
  </p>
  <p>
    Biarkan AI menganalisis, memfilter, dan memberi peringkat kandidat terbaik langsung dari Gmail & Google Drive Anda, sementara Anda fokus pada hal terpenting: wawancara.
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
    <img src="https://img.shields.io/badge/Next.js-15.5-black?logo=nextdotjs" alt="Next.js">
    <img src="https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi" alt="FastAPI">
    <img src="https://img.shields.io/badge/Google_Gemini-AI-blue?logo=google" alt="Google Gemini">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-blue?logo=tailwindcss" alt="Tailwind CSS">
  </p>
</div>

---

## 🚀 Fitur Utama

**Rekruta** adalah platform *full-stack* yang dirancang untuk mengotomatiskan dan mempercepat proses rekrutmen awal dengan mengintegrasikan kekuatan AI generatif ke dalam alur kerja Google Workspace Anda.

* **🔐 Otentikasi Google (OAuth 2.0):** Login dengan aman dan cepat menggunakan akun Google Anda. Aplikasi ini mendapatkan izin untuk membaca Gmail, mengelola file di Google Drive, dan mengedit Google Sheets atas nama Anda.
* **⚙️ Konfigurasi Screening Dinamis:** Atur lowongan pekerjaan yang sedang dibuka. Tentukan **Posisi Pekerjaan** (digunakan untuk penamaan folder & file) dan **Subjek Email** yang spesifik untuk memindai CV yang relevan di inbox Anda.
* **📄 Unggah Deskripsi Pekerjaan:** Unggah deskripsi pekerjaan (JD) dalam format PDF. Teks dari JD ini akan diekstrak dan digunakan oleh AI sebagai "kriteria" utama untuk menilai setiap CV.
* **📨 Pemindai Gmail Otomatis:** Saat analisis dimulai, Rekruta secara otomatis memindai inbox Gmail Anda mencari email yang cocok dengan kriteria subjek yang telah Anda tentukan dan memiliki lampiran PDF.
* **🧠 Analisis CV Berbasis AI (Google Gemini):**
    * Setiap CV yang ditemukan akan diekstrak teksnya.
    * Teks CV dan teks Deskripsi Pekerjaan dikirim ke **Google Gemini API** untuk dianalisis.
    * AI akan mengembalikan data terstruktur dalam format JSON, berisi:
        * Nama, Email, dan Nomor Telepon kandidat.
        * Pendidikan terakhir.
        * Daftar **Kekuatan** & **Kekurangan** yang relevan dengan JD.
        * Faktor **Risiko** (Risk Factor) dan **Keuntungan** (Reward Factor).
        * **Skor Kecocokan (Overall Fit)** (0-100).
        * **Justifikasi** mendalam untuk skor yang diberikan.
* **☁️ Integrasi Google Drive:** Setiap file CV (PDF) yang diproses secara otomatis diunggah ke folder khusus di Google Drive Anda (`AI Resume Screening > Screening - [Nama Posisi] > CV`), lengkap dengan link yang dapat dibagikan.
* **📊 Integrasi Google Sheets:** Semua hasil analisis dari AI (skor, justifikasi, data kontak, link Drive, dll.) secara otomatis dimasukkan sebagai baris baru ke dalam Google Sheet yang dibuat khusus untuk lowongan tersebut.
* **🖥️ Dashboard Hasil Interaktif:**
    * Lihat semua kandidat yang telah dianalisis dalam tabel yang rapi.
    * **Pencarian:** Cari kandidat berdasarkan nama, email, atau keahlian.
    * **Sortir:** Urutkan kandidat berdasarkan Skor Kecocokan, Nama, atau Tanggal.
    * **Paginasi:** Navigasi mudah untuk ratusan hasil.
    * **Modal Detail:** Klik tombol "Detail" untuk melihat laporan analisis lengkap untuk setiap kandidat dalam modal *pop-up* yang bersih.
* **🔄 Deteksi Duplikat:** Aplikasi membuat *hash* unik untuk setiap CV yang diproses untuk mencegah pemrosesan dan penduplikasian data yang sama di Google Sheets.
* **📡 Streaming Progres Real-time (SSE):** Tonton proses screening secara langsung! Backend menggunakan *Server-Sent Events (SSE)* untuk mengirim pembaruan status ke frontend, mulai dari "Mencari email..." hingga "Memproses CV: [nama file]..." dan "Selesai".

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun dengan arsitektur *full-stack* modern yang memisahkan frontend dan backend.

### Frontend
* **Framework:** [Next.js 15](https://nextjs.org/) (menggunakan App Router)
* **Bahasa:** JavaScript (React)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Manajemen State:** React Hooks (`useState`, `useEffect`)
* **Fetch Data:** [Axios](https://axios-http.com/) (untuk permintaan API) & `fetch` native (untuk streaming SSE)

### Backend (Serverless API)
* **Framework:** [FastAPI (Python)](https://fastapi.tiangolo.com/)
* **Bahasa:** Python 3.10+
* **AI:** [Google Gemini API](https://ai.google.dev/) (`google-generativeai`)
* **Google APIs:**
    * [Google API Python Client](https://github.com/googleapis/google-api-python-client)
    * [Google Auth OAuthlib](https://google-auth-oauthlib.readthedocs.io/) (untuk alur OAuth 2.0)
    * [gspread](https://docs.gspread.org/) (untuk interaksi Google Sheets)
* **Ekstraksi PDF:** [pdfplumber](https://github.com/jsvine/pdfplumber)
* **Deployment:** Dikonfigurasi untuk Vercel (sebagai Serverless Functions)

---

## 📂 Struktur Proyek

Berikut adalah gambaran umum dari struktur file dan direktori dalam proyek ini:

/ ├── api/ │ └── index.py # Backend: Semua logika API FastAPI (Python) │ ├── app/ │ ├── (landing)/ │ │ └── page.js # Frontend: Halaman landing (app/page.js) │ ├── screening/ │ │ └── page.js # Frontend: Halaman aplikasi/dashboard utama (app/screening/page.js) │ ├── globals.css # CSS Global & setup Tailwind │ ├── layout.js # Layout root Next.js │ └── page.module.css # CSS Modules (jika digunakan) │ ├── public/ │ ├── templates/ │ │ └── ...docx # Template JD untuk diunduh pengguna │ ├── logo.jpg │ ├── rekruta1.jpg │ └── ... (aset statis lainnya) │ ├── .env.example # Contoh variabel lingkungan untuk frontend & backend ├── .gitignore ├── jsconfig.json ├── next.config.mjs ├── package.json # Dependensi frontend (Node.js) ├── postcss.config.mjs ├── requirements.txt # Dependensi backend (Python) ├── vercel.json # Konfigurasi Vercel (untuk rewrite API) └── README.md #

---

## 📋 Prasyarat

Sebelum Anda memulai, pastikan Anda memiliki:

* [Node.js](https://nodejs.org/en) (v18 atau lebih baru)
* [Python](https://www.python.org/downloads/) (v3.10 atau lebih baru) & `pip`
* Akun Google
* Sebuah **Proyek Google Cloud** dengan:
    1.  **Gmail API** diaktifkan
    2.  **Google Drive API** diaktifkan
    3.  **Google Sheets API** diaktifkan
* Kredensial **OAuth 2.0 Client ID** (download file `credentials.json`)
* Sebuah **API Key** untuk **Google Gemini (Generative AI)**

---

## ⚙️ Instalasi & Konfigurasi

Ikuti langkah-langkah ini untuk menjalankan proyek di lingkungan lokal Anda.

### 1. Backend (FastAPI)

1.  **Clone Repository:**
    ```bash
    git clone [https://github.com/agustamayasa/screeningcv2.git](https://github.com/agustamayasa/screeningcv2.git)
    cd screeningcv2
    ```

2.  **Siapkan Kredensial Google:**
    * Buka [Google Cloud Console](https://console.cloud.google.com/) dan navigasi ke proyek Anda.
    * Buka "APIs & Services" > "Credentials".
    * Buat "OAuth 2.0 Client ID" untuk "Web application".
    * Tambahkan `http://localhost:3000` (URL Frontend) sebagai *Authorized JavaScript origins*.
    * Tambahkan `http://localhost:8000/api/auth/callback` (URL Callback Backend) sebagai *Authorized redirect URIs*.
    * Download file JSON kredensial dan **ganti namanya menjadi `credentials.json`**.
    * **PENTING:** Tempatkan file `credentials.json` di **root direktori** proyek. (File ini sudah ada di `.gitignore` untuk keamanan).

3.  **Buat Virtual Environment Python:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Di Windows, gunakan: venv\Scripts\activate
    ```

4.  **Install Dependensi Python:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Buat File `.env`:**
    * Buat file bernama `.env` di **root direktori**.
    * File ini akan digunakan oleh `api/index.py`.
    * Tambahkan API key dan URL Anda:
    ```.env
    # Dapatkan dari [https://ai.google.dev/](https://ai.google.dev/)
    GEMINI_API_KEY=AIzaSy...

    # URL tempat frontend Anda akan berjalan
    FRONTEND_URL=http://localhost:3000

    # URL tempat backend FastAPI Anda akan berjalan
    BACKEND_URL=http://localhost:8000

    # Opsi lain untuk kredensial (jika tidak menggunakan file credentials.json)
    # Anda bisa encode file credentials.json Anda ke Base64 dan paste di sini
    # GOOGLE_CREDENTIALS_BASE64=ey...
    ```

### 2. Frontend (Next.js)

1.  **Install Dependensi Node.js:**
    (Pastikan Anda berada di root direktori `screeningcv2`)
    ```bash
    npm install
    # atau
    # yarn install
    # atau
    # pnpm install
    ```

2.  **Buat File `.env.local`:**
    * Buat file bernama `.env.local` di **root direktori**.
    * File ini akan digunakan oleh Next.js.
    * Arahkan ke URL API backend Anda:
    ```.env.local
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

---

## ධ Menjalankan Proyek

Anda perlu menjalankan dua server secara bersamaan di terminal yang terpisah.

1.  **Terminal 1: Jalankan Backend (FastAPI)**
    (Pastikan venv Anda aktif)
    ```bash
    uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload
    ```
    Server backend Anda sekarang berjalan di `http://localhost:8000`.

2.  **Terminal 2: Jalankan Frontend (Next.js)**
    ```bash
    npm run dev
    ```
    Server frontend Anda sekarang berjalan di `http://localhost:3000`.

3.  **Buka Aplikasi:**
    Buka `http://localhost:3000` di browser Anda untuk melihat halaman landing, atau langsung ke `http://localhost:3000/screening` untuk menggunakan aplikasi.

---

## 💡 Contoh Penggunaan

1.  Buka `http://localhost:3000/screening`.
2.  Anda akan diarahkan ke halaman login Google. Setujui izin yang diminta.
3.  Setelah dialihkan kembali ke halaman screening, Anda sekarang sudah login.
4.  **Langkah 1: Konfigurasi**
    * Masukkan **Nama Posisi Pekerjaan** (misal: "Frontend Developer").
    * Masukkan **Format Subjek Email** yang ingin Anda pindai (misal: "Lamaran Frontend", "CV UI/UX"). Anda bisa menambahkan beberapa.
    * Klik **Simpan Konfigurasi**.
5.  **Langkah 2: Unggah JD**
    * Klik area unggah atau seret file PDF Deskripsi Pekerjaan Anda.
    * Klik **Unggah Deskripsi Pekerjaan**.
6.  **Langkah 3: Mulai Analisis**
    * Setelah konfigurasi disimpan dan JD diunggah, tombol **Mulai Analisis AI** akan aktif.
    * Klik tombol tersebut.
    * Perhatikan *progress bar* dan status yang diperbarui secara *real-time* saat AI memindai email, menganalisis CV, dan menyimpan hasilnya.
7.  **Langkah 4: Tinjau Hasil**
    * Hasil akan muncul secara otomatis di tabel dashboard di bawah.
    * Gunakan pencarian, sortir, atau klik "Detail" untuk melihat analisis lengkap.
    * Buka Google Sheets dan Google Drive Anda untuk melihat file spreadsheet dan folder CV yang telah dibuat secara otomatis.

---

## 🤝 Berkontribusi

Kontribusi sangat kami hargai! Jika Anda ingin berkontribusi pada proyek ini, silakan ikuti langkah-langkah berikut:

1.  **Fork** repository ini.
2.  Buat *branch* fitur baru (`git checkout -b fitur/NamaFitur`).
3.  Lakukan perubahan Anda dan **Commit** (`git commit -m 'Menambahkan fitur A'`).
4.  **Push** ke *branch* Anda (`git push origin fitur/NamaFitur`).
5.  Buka **Pull Request**.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk detail lebih lanjut (jika ada) atau lihat di bawah ini.
