'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // New state for configuration forms
  const [jobPosition, setJobPosition] = useState('');
  const [emailSubjects, setEmailSubjects] = useState(['']);
  const [configStatus, setConfigStatus] = useState('');
  const [isConfigSaved, setIsConfigSaved] = useState(false);
  const [currentSpreadsheetName, setCurrentSpreadsheetName] = useState('');

  // Fungsi untuk menangani error dengan lebih baik
  const handleApiError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail || error.message;
      
      switch (status) {
        case 401:
          setIsLoggedIn(false);
          return 'Sesi expired, silakan login kembali.';
        case 404:
          return 'Resource tidak ditemukan. Mungkin spreadsheet belum dibuat.';
        case 500:
          return `Server error: ${detail}`;
        default:
          return `Error ${status}: ${detail}`;
      }
    } else if (error.request) {
      return 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
    } else {
      return error.message || defaultMessage;
    }
  };

  const checkAuthStatus = async () => {
    try {
      setIsCheckingAuth(true);
      const response = await axios.get(`${API_BASE_URL}/api/auth-status`);
      setIsLoggedIn(response.data.authenticated);
      
      if (response.data.authenticated) {
        await fetchScreeningConfig();
        await fetchResults();
      }
    } catch (error) {
      setIsLoggedIn(false);
      const errorMessage = handleApiError(error, "Gagal mengambil status autentikasi");
      setError(errorMessage);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const fetchScreeningConfig = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/get-screening-config`);
      const config = response.data;
      
      setJobPosition(config.job_position || '');
      setEmailSubjects(config.email_subjects.length > 0 ? config.email_subjects : ['']);
      setCurrentSpreadsheetName(config.spreadsheet_name || '');
      setIsConfigSaved(config.job_position && config.email_subjects.length > 0);
      
      if (config.has_job_description) {
        setUploadStatus('Sukses: Deskripsi pekerjaan sudah tersedia');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchResults = async () => {
    if (!isLoggedIn) return;
    
    try {
      setError('');
      const response = await axios.get(`${API_BASE_URL}/api/get-results`);
      setResults(response.data.results || []);
      setCurrentSpreadsheetName(response.data.spreadsheet_name || '');
    } catch (error) {
      const errorMessage = handleApiError(error, "Gagal mengambil hasil");
      
      if (error.response?.status === 401) {
        setIsLoggedIn(false);
        setResults([]);
      } else {
        setError(errorMessage);
      }
    }
  };

  const testServerConnection = async () => {
    try {
      await axios.get(`${API_BASE_URL}/api/health`);
      console.log('Server connection: OK');
    } catch (error) {
      console.error('Server connection failed:', error);
      setError('Tidak dapat terhubung ke server. Pastikan FastAPI berjalan di http://localhost:8000');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call backend logout endpoint
      await axios.post(`${API_BASE_URL}/api/logout`);
      
      // Clear client-side state
      setIsLoggedIn(false);
      setResults([]);
      setUploadStatus('');
      setScreeningStatus('');
      setSelectedFile(null);
      setError('');
      setSelectedCandidate(null);
      setJobPosition('');
      setEmailSubjects(['']);
      setConfigStatus('');
      setIsConfigSaved(false);
      setCurrentSpreadsheetName('');
      
      // Show success message briefly
      setScreeningStatus('Logout berhasil!');
      setTimeout(() => {
        setScreeningStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setIsLoggedIn(false);
      setResults([]);
      setUploadStatus('');
      setScreeningStatus('');
      setSelectedFile(null);
      setError('');
      setSelectedCandidate(null);
      setJobPosition('');
      setEmailSubjects(['']);
      setConfigStatus('');
      setIsConfigSaved(false);
      setCurrentSpreadsheetName('');
      
      // Show that logout completed
      setScreeningStatus('Logout selesai!');
      setTimeout(() => {
        setScreeningStatus('');
      }, 3000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // New functions for configuration
  const handleSaveConfig = async () => {
    if (!jobPosition.trim()) {
      setConfigStatus('Nama posisi pekerjaan tidak boleh kosong');
      return;
    }
    const validSubjects = emailSubjects.filter(subject => subject.trim() !== '');
    if (validSubjects.length === 0) {
      setConfigStatus('Minimal satu subjek email harus diisi');
      return;
    }

    try {
      setConfigStatus('Menyimpan konfigurasi...');
      const response = await axios.post(`${API_BASE_URL}/api/set-screening-config`, {
        job_position: jobPosition.trim(),
        email_subjects: validSubjects
      });

      setIsConfigSaved(true);
      // Update nama dan URL dari response
      setCurrentSpreadsheetName(response.data.spreadsheet_name);
      setCurrentSpreadsheetUrl(response.data.spreadsheet_url); // <-- Simpan URL
      
      setConfigStatus(`Konfigurasi berhasil disimpan!`);
      
      setTimeout(() => setConfigStatus(''), 5000);
    } catch (error) {
      const errorMessage = handleApiError(error, 'Gagal menyimpan konfigurasi');
      setConfigStatus(`Error: ${errorMessage}`);
    }
  };

  const addEmailSubject = () => {
    setEmailSubjects([...emailSubjects, '']);
  };

  const removeEmailSubject = (index) => {
    if (emailSubjects.length > 1) {
      const newSubjects = emailSubjects.filter((_, i) => i !== index);
      setEmailSubjects(newSubjects);
    }
  };

  const updateEmailSubject = (index, value) => {
    const newSubjects = [...emailSubjects];
    newSubjects[index] = value;
    setEmailSubjects(newSubjects);
  };

  useEffect(() => {
    testServerConnection();
    checkAuthStatus();
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setUploadStatus('');
    setError('');
    
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('File harus berformat PDF');
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(file);
      setUploadStatus('');
      setError('');
    } else {
      setError('File harus berformat PDF');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Pilih file PDF terlebih dahulu');
      return;
    }

    if (!isConfigSaved) {
      setError('Simpan konfigurasi screening terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploadStatus('Mengupload...');
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload-job-description`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      setUploadStatus(`Sukses: ${response.data.message}`);
    } catch (error) {
      const errorMessage = handleApiError(error, 'Gagal mengupload file');
      setUploadStatus(`Gagal: ${errorMessage}`);
    }
  };

  const handleStartScreening = async () => {
    if (!uploadStatus.includes('Sukses')) {
      setError('Upload deskripsi pekerjaan terlebih dahulu');
      return;
    }

    if (!isConfigSaved) {
      setError('Simpan konfigurasi screening terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setScreeningStatus('Memulai proses screening...');
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/start-screening`, {}, {
        timeout: 120000,
      });
      
      setScreeningStatus(`${response.data.message}`);
      
      setTimeout(async () => {
        await fetchResults();
        setScreeningStatus(prev => prev + ' Data berhasil diperbarui!');
      }, 2000);
      
    } catch (error) {
      const errorMessage = handleApiError(error, 'Gagal melakukan screening');
      
      if (error.response?.status === 401) {
        setScreeningStatus('Sesi expired, mengarahkan ke login...');
        setTimeout(() => {
          window.location.href = `${API_BASE_URL}/api/login`;
        }, 2000);
      } else {
        setScreeningStatus(`${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/login`;
  };

  const handleClearResults = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua data hasil screening?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/clear-results`);
      setScreeningStatus(`${response.data.message}`);
      setResults([]);
    } catch (error) {
      const errorMessage = handleApiError(error, 'Gagal menghapus data');
      setError(errorMessage);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">CV Screening</h1>
                <p className="text-sm text-gray-500">AI-Powered Recruitment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Connected</span>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-lg hover:bg-red-50 hover:border-red-400 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <>
                        <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging out...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Login with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Configuration Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Screening Configuration</h2>
              <p className="text-sm text-gray-600">Setup job position and email criteria</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Position Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="jobPosition" className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Posisi Pekerjaan
                </label>
                <input
                  type="text"
                  id="jobPosition"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g., UI/UX Designer, Frontend Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nama ini akan digunakan untuk penamaan spreadsheet
                </p>
              </div>
            </div>

            {/* Email Subjects Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format Subjek Email yang Diterima
                </label>
                <div className="space-y-2">
                  {emailSubjects.map((subject, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => updateEmailSubject(index, e.target.value)}
                        placeholder="e.g., cv-ui/ux, resume-frontend"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                      {emailSubjects.length > 1 && (
                        <button
                          onClick={() => removeEmailSubject(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addEmailSubject}
                  className="mt-2 inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Subjek Email
                </button>
                
                <p className="text-xs text-gray-500 mt-1">
                  Email dengan subjek ini akan di-scan untuk mencari CV
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Status and Save Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                    {/* 4. Ubah JSX untuk menampilkan link secara kondisional */}
                    {currentSpreadsheetUrl ? (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Spreadsheet:</span>{' '}
                        <a
                          href={currentSpreadsheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                          title="Buka di Google Sheets"
                        >
                          {currentSpreadsheetName}
                        </a>
                      </p>
                    ) : currentSpreadsheetName && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Spreadsheet:</span> {currentSpreadsheetName}
                      </p>
                    )}
                {configStatus && (
                  <div className={`mt-2 p-3 rounded-lg text-sm font-medium ${
                    configStatus.includes('berhasil') || configStatus.includes('Sukses')
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : configStatus.includes('Error') || configStatus.includes('kosong')
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {configStatus}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleSaveConfig}
                disabled={!jobPosition.trim() || emailSubjects.every(s => !s.trim())}
                className="ml-4 bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center"
              >
                {isConfigSaved ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Config
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3m1 0h4" />
                    </svg>
                    Save Config
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Process Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Job Description Upload</h2>
                <p className="text-sm text-gray-600">Upload PDF file containing job requirements</p>
              </div>
            </div>

            {/* Configuration Reminder */}
            {!isConfigSaved && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-amber-700 text-sm">Simpan konfigurasi screening terlebih dahulu</p>
                </div>
              </div>
            )}

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : selectedFile
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <svg className="w-12 h-12 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">Click to upload</span>
                      <span className="text-gray-600"> or drag and drop</span>
                    </label>
                    <p className="text-sm text-gray-500">PDF files only</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !isConfigSaved}
              className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              Upload Job Description
            </button>

            {/* Upload Status */}
            {uploadStatus && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                uploadStatus.includes('Sukses') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : uploadStatus.includes('Gagal')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {uploadStatus}
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
                <p className="text-sm text-gray-600">Process CVs with intelligent screening</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Prerequisites Check */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Prerequisites</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${isConfigSaved ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm ${isConfigSaved ? 'text-green-700' : 'text-gray-600'}`}>
                      Screening configuration saved
                    </span>
                  </div>
                  <div className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${uploadStatus.includes('Sukses') ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-sm ${uploadStatus.includes('Sukses') ? 'text-green-700' : 'text-gray-600'}`}>
                      Job description uploaded
                    </span>
                  </div>
                </div>
              </div>

              {/* Process Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Process Overview</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Scan Gmail for CV attachments
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Extract and analyze text content
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Upload CVs to Google Drive
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Generate compatibility scores
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleStartScreening}
                  disabled={isLoading || !uploadStatus.includes('Sukses') || !isConfigSaved}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start AI Analysis
                    </>
                  )}
                </button>

                {results.length > 0 && (
                  <button
                    onClick={handleClearResults}
                    disabled={isLoading}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Data
                  </button>
                )}
              </div>

              {/* Screening Status */}
              {screeningStatus && (
                <div className={`p-3 rounded-lg text-sm font-medium ${
                  screeningStatus.includes('berhasil') || screeningStatus.includes('Sukses')
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : screeningStatus.includes('Error') || screeningStatus.includes('Gagal')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {screeningStatus}
                </div>
              )}
            </div>
          </div>
        </div>

                {/* Results Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
                <p className="text-sm text-gray-600">
                  {results.length > 0 ? `${results.length} candidates analyzed` : 'No data available'}
                </p>
              </div>
            </div>

            {results.length > 0 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-200 rounded mr-2"></div>
                  <span className="text-gray-600">High Match (80%+)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-200 rounded mr-2"></div>
                  <span className="text-gray-600">Medium Match (60-79%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-200 rounded mr-2"></div>
                  <span className="text-gray-600">Low Match (&lt;60%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Results Content */}
          {!isLoggedIn ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">Please login with your Google account to view analysis results.</p>
              <button
                onClick={handleLogin}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Login with Google
              </button>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1800px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-2 font-medium text-gray-900 w-48">Candidate</th>
                      
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-48">Education</th>
                      <th className="text-center py-4 px-4 font-medium text-gray-900 w-32">Match Score</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-48">Strengths</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-48">Weaknesses</th>

                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-48">Analysis</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-32">CV Link</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-32">Date</th>
                      <th className="text-left py-4 px-4 font-medium text-gray-900 w-24">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        {/* Candidate Info */}
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate" title={result.Nama || 'N/A'}>
                                {result.Nama || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm space-y-1">
                            {result.Email && result.Email !== 'Tidak tercantum' ? (
                              <a 
                                href={`mailto:${result.Email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline block truncate"
                                title={result.Email}
                              >
                                {result.Email.length > 25 ? `${result.Email.substring(0, 25)}...` : result.Email}
                              </a>
                            ) : (
                              <span className="text-gray-400 block">No email</span>
                            )}
                            {result['Nomor Telepon'] && result['Nomor Telepon'] !== 'Tidak tercantum' ? (
                              <a 
                                href={`https://wa.me/${result['Nomor Telepon']}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline block"
                                title={result['Nomor Telepon']}
                              >
                                {result['Nomor Telepon']}
                              </a>
                            ) : (
                              <span className="text-gray-400 block">No phone</span>
                            )}
                          </div>
                        </td>

                        

                        {/* Education */}
                        <td className="py-4 px-4">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-sm text-gray-900 line-clamp-2 cursor-help" 
                              title={result['Pendidikan Terakhir'] || 'N/A'}
                            >
                              {result['Pendidikan Terakhir'] ? 
                                (result['Pendidikan Terakhir'].length > 50 ? 
                                  `${result['Pendidikan Terakhir'].substring(0, 50)}...` : 
                                  result['Pendidikan Terakhir']) : 
                                'N/A'
                              }
                            </p>
                          </div>
                        </td>

                        {/* Match Score */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreBadgeColor(result['Overall Fit'] || 0)}`}>
                              {result['Overall Fit'] || 0}%
                            </div>
                          </div>
                        </td>

                        {/* Strengths */}
                        <td className="py-4 px-4">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-sm text-gray-900 line-clamp-3 cursor-help" 
                              title={result.Kekuatan || 'N/A'}
                            >
                              {result.Kekuatan ? 
                                (result.Kekuatan.length > 80 ? 
                                  `${result.Kekuatan.substring(0, 80)}...` : 
                                  result.Kekuatan) : 
                                'N/A'
                              }
                            </p>
                          </div>
                        </td>

                        {/* Weaknesses */}
                        <td className="py-4 px-4">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-sm text-gray-900 line-clamp-3 cursor-help" 
                              title={result.Kekurangan || 'N/A'}
                            >
                              {result.Kekurangan ? 
                                (result.Kekurangan.length > 80 ? 
                                  `${result.Kekurangan.substring(0, 80)}...` : 
                                  result.Kekurangan) : 
                                'N/A'
                              }
                            </p>
                          </div>
                        </td>

                        

                        {/* Analysis */}
                        <td className="py-4 px-4">
                          <div className="max-w-[180px]">
                            <p 
                              className="text-sm text-gray-900 line-clamp-3 cursor-help" 
                              title={result.Justifikasi || 'N/A'}
                            >
                              {result.Justifikasi ? 
                                (result.Justifikasi.length > 80 ? 
                                  `${result.Justifikasi.substring(0, 80)}...` : 
                                  result.Justifikasi) : 
                                'N/A'
                              }
                            </p>
                          </div>
                        </td>

                        {/* CV Link */}
                        <td className="py-4 px-4">
                          {result['Drive Link'] && result['Drive Link'] !== 'Gagal upload ke Drive' ? (
                            <a 
                              href={result['Drive Link']}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              View CV
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No link</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-500">
                            {result.Waktu ? (
                              <div>
                                <p>{new Date(result.Waktu).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(result.Waktu).toLocaleTimeString()}
                                </p>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </div>
                        </td>

                        {/* Details Button */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => {
                              // You need to add this state: const [selectedCandidate, setSelectedCandidate] = useState(null);
                              if (typeof setSelectedCandidate === 'function') {
                                setSelectedCandidate(result);
                              } else {
                                console.log('Selected candidate:', result);
                                alert('Please add selectedCandidate state to your component');
                              }
                            }}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detail Modal */}
              {(typeof selectedCandidate !== 'undefined' && selectedCandidate) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600 font-semibold text-lg">
                              {(selectedCandidate.Nama || 'N/A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                              {selectedCandidate.Nama || 'N/A'}
                            </h2>
                            <p className="text-sm text-gray-600">Candidate Details</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getScoreBadgeColor(selectedCandidate['Overall Fit'] || 0)}`}>
                            {selectedCandidate['Overall Fit'] || 0}% Match
                          </div>
                          <button
                            onClick={() => {
                              if (typeof setSelectedCandidate === 'function') {
                                setSelectedCandidate(null);
                              } else {
                                console.log('Close modal');
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 space-y-6">
                      {/* Contact Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedCandidate.Email && selectedCandidate.Email !== 'Tidak tercantum' ? (
                                <a href={`mailto:${selectedCandidate.Email}`} className="text-blue-600 hover:underline">
                                  {selectedCandidate.Email}
                                </a>
                              ) : (
                                'Not available'
                              )}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Phone Number</label>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedCandidate['Nomor Telepon'] && selectedCandidate['Nomor Telepon'] !== 'Tidak tercantum' ? (
                                <a href={`tel:${selectedCandidate['Nomor Telepon']}`} className="text-blue-600 hover:underline">
                                  {selectedCandidate['Nomor Telepon']}
                                </a>
                              ) : (
                                'Not available'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Education */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {selectedCandidate['Pendidikan Terakhir'] || 'No education information available'}
                          </p>
                        </div>
                      </div>

                      {/* Analysis Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Strengths</h3>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {selectedCandidate.Kekuatan || 'No strengths data available'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Weaknesses</h3>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {selectedCandidate.Kekurangan || 'No weaknesses data available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Risk Factors</h3>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {selectedCandidate['Risk Factor'] || 'No risk factors data available'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Reward Factors</h3>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-gray-900 leading-relaxed">
                              {selectedCandidate['Reward Factor'] || 'No reward factors data available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Analysis */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Detailed Analysis</h3>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                            {selectedCandidate.Justifikasi || 'No analysis data available'}
                          </p>
                        </div>
                      </div>

                      {/* CV Link and Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">CV Document</h3>
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            {selectedCandidate['Drive Link'] && selectedCandidate['Drive Link'] !== 'Gagal upload ke Drive' ? (
                              <a 
                                href={selectedCandidate['Drive Link']}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Open CV Document
                              </a>
                            ) : (
                              <p className="text-gray-400 text-sm">CV document not available</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Analysis Date</h3>
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            {selectedCandidate.Waktu ? (
                              <div className="text-sm text-gray-900">
                                <p className="font-medium">
                                  {new Date(selectedCandidate.Waktu).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-gray-600 mt-1">
                                  {new Date(selectedCandidate.Waktu).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">Date not available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Data</h3>
              <p className="text-gray-600 mb-4">Start the screening process to see candidate analysis results here.</p>
              <div className="text-sm text-gray-500">
                <p>💡 <strong>Tip:</strong> Make sure your Gmail contains emails with subjects including "resume" or "cv" with PDF attachments.</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{results.length}</p>
                  <p className="text-sm text-gray-600">Total CVs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {results.filter(r => (r['Overall Fit'] || 0) >= 80).length}
                  </p>
                  <p className="text-sm text-gray-600">High Match</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {results.filter(r => (r['Overall Fit'] || 0) >= 60 && (r['Overall Fit'] || 0) < 80).length}
                  </p>
                  <p className="text-sm text-gray-600">Medium Match</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r['Overall Fit'] || 0), 0) / results.length) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Custom styles for line clamping */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}