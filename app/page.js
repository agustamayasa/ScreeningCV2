"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';

const HomePage = () => {
  const [activeSection, setActiveSection] = useState('home');

useEffect(() => {
  const handleScroll = () => {
    const sections = ['home', 'features', 'about', 'contact'];
    const scrollPosition = window.scrollY + 100; // offset untuk navbar

    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i]);
      if (element && scrollPosition >= element.offsetTop) {
        setActiveSection(sections[i]);
        break;
      }
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Set initial active section
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  // Intersection Observer for active menu tracking
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    const sections = ['home', 'features', 'about', 'contact'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    const offsetTop = element.offsetTop - 80; // offset untuk navbar
    window.scrollTo({
      top: offsetTop,
      behavior: 'smooth'
    });
  }
};

  // Navbar Component
  const Navbar = () => {
  const menuItems = [
    { name: 'Home', id: 'home' },
    { name: 'Features', id: 'features' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' }
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
              <img
                src="./rekruta1.jpg"
                alt="RekrutAI Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`font-medium transition-colors duration-200 ${
                  activeSection === item.id
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                {item.name}
              </button>
            ))}
            <Link 
              href="/screening"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Mulai Screening
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link 
              href="/screening"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-lg text-sm"
            >
              Mulai
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

  // Hero Section Component
  const HeroSection = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      setIsVisible(true);
    }, []);

    return (
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Aurora Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-violet-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-800 mb-8 leading-tight">
              Otomatiskan Screening{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Ratusan CV
              </span>{' '}
              dalam Hitungan Menit
            </h1>
            
            <p className="text-xl sm:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Rekruta adalah asisten rekrutmen AI Anda. Biarkan teknologi kami menganalisis, memfilter, dan memberi peringkat kandidat terbaik langsung dari Gmail & Google Drive Anda, sementara Anda fokus pada hal terpenting: wawancara.
            </p>

            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button
                onClick={() => scrollToSection('features')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-xl rounded-2xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 group"
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Coba Gratis Sekarang
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Features Section Component
  const FeaturesSection = () => {
    const [visibleCards, setVisibleCards] = useState([]);

    useEffect(() => {
      const timer = setInterval(() => {
        setVisibleCards(prev => {
          if (prev.length < 4) {
            return [...prev, prev.length];
          }
          clearInterval(timer);
          return prev;
        });
      }, 200);

      return () => clearInterval(timer);
    }, []);

    const features = [
      {
        icon: (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        ),
        title: 'Login Cepat dengan Akun Google',
        description: 'Masuk dengan aman dan cepat menggunakan akun Google Anda. Tidak perlu mengingat password baru, langsung hubungkan semua layanan Google Anda dalam satu platform terpadu.'
      },
      {
        icon: (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.9.732-1.636 1.636-1.636h.273L12 9.545l10.091-5.724h.273c.904 0 1.636.732 1.636 1.636z"/>
          </svg>
        ),
        title: 'Analisis CV Langsung dari Inbox',
        description: 'Secara otomatis mendeteksi dan memproses lampiran CV dari email yang masuk tanpa perlu mengunduh atau memindahkannya satu per satu.'
      },
      {
        icon: (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.01 2C6.5 2 2.01 6.5 2.01 12s4.49 10 9.99 10c5.51 0 10-4.5 10-10S17.52 2 12.01 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        ),
        title: 'Hubungkan Folder Kandidat Anda',
        description: 'Sinkronkan folder Google Drive berisi CV dan biarkan AI kami bekerja untuk menyusun daftar kandidat potensial secara otomatis.'
      },
      {
        icon: (
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.14,7.5A2.86,2.86,0,0,1,22,10.36V19.5A2.86,2.86,0,0,1,19.14,22.36H4.86A2.86,2.86,0,0,1,2,19.5V4.5A2.86,2.86,0,0,1,4.86,1.64H14a2.86,2.86,0,0,1,2.86,2.86V7.5Z"/>
          </svg>
        ),
        title: 'Laporan Hasil Otomatis',
        description: 'Hasil screening, peringkat kandidat, dan informasi kontak diekspor secara rapi ke Google Sheets untuk kemudahan pelacakan dan kolaborasi tim.'
      }
    ];

    return (
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-6">
              Semua yang Anda Butuhkan dalam{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Satu Platform Cerdas
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Platform terintegrasi yang menghubungkan semua tools Google Workspace Anda untuk proses rekrutmen yang lebih efisien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:scale-105 transition-all duration-500 ${
                  visibleCards.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // About Section Component
  const AboutSection = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.3 }
      );

      const aboutElement = document.getElementById('about');
      if (aboutElement) observer.observe(aboutElement);

      return () => observer.disconnect();
    }, []);

    return (
      <section id="about" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="relative">
                <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-violet-100 rounded-3xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium">AI-Powered Recruitment</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-8">
                Tentang{' '}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Rekruta
                </span>
              </h2>
              
              <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                <p>
                  Rekruta lahir dari visi untuk memberdayakan tim HR dengan teknologi AI terdepan. Kami percaya bahwa proses rekrutmen harus lebih adil, cepat, dan berbasis data.
                </p>
                
                <p>
                  Dengan mengintegrasikan langsung ke dalam ekosistem Google yang sudah Anda gunakan sehari-hari, Rekruta menghilangkan gesekan dalam proses screening CV dan memungkinkan Anda fokus pada aspek yang paling penting: membangun hubungan dengan kandidat terbaik.
                </p>
                
                <p>
                  Misi kami sederhana namun ambisius: mengubah cara dunia merekrut talenta terbaik dengan menggabungkan kecerdasan buatan yang canggih dengan kemudahan penggunaan yang luar biasa.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
                  <div className="text-slate-600">Waktu Tersimpan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-600 mb-2">10x</div>
                  <div className="text-slate-600">Lebih Cepat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Contact Section Component
  const ContactSection = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      company: '',
      message: ''
    });

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.3 }
      );

      const contactElement = document.getElementById('contact');
      if (contactElement) observer.observe(contactElement);

      return () => observer.disconnect();
    }, []);

    const handleInputChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('Form submitted:', formData);
      // Handle form submission here
      alert('Pesan Anda telah dikirim! Tim kami akan menghubungi Anda segera.');
      setFormData({ name: '', email: '', company: '', message: '' });
    };

    return (
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-6">
              Get in Touch{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                with Us
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Siap untuk merevolusi proses rekrutmen Anda? Mari diskusikan bagaimana Rekruta dapat membantu tim Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-6">
                    Punya pertanyaan atau butuh demo?
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed mb-8">
                    Tim kami siap membantu Anda memahami bagaimana Rekruta dapat mengoptimalkan proses rekrutmen di perusahaan Anda. Jangan ragu untuk menghubungi kami!
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Email</div>
                      <div className="text-slate-600">hello@rekruta.com</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Alamat</div>
                      <div className="text-slate-600">Jakarta, Indonesia</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Response Time</div>
                      <div className="text-slate-600">24 jam</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="PT. Technology Solutions"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                    Pesan Anda
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Ceritakan kebutuhan rekrutmen Anda atau ajukan pertanyaan tentang Rekruta..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Footer Component
  const Footer = () => {
    return (
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <span className="ml-3 text-2xl font-bold">Rekruta</span>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                Platform rekrutmen cerdas yang mengotomatiskan screening CV menggunakan AI dan terintegrasi dengan ekosistem Google.
              </p>
              <div className="flex space-x-4 mt-6">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.085.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001 12.017 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => scrollToSection('home')}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('about')}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('contact')}
                    className="text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2024 Rekruta. All rights reserved. Made with ❤️ for better recruitment.
            </p>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default HomePage;