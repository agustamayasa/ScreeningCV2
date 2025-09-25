import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const HomePage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Navbar Component
  const Navbar = () => (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Rekruta
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              Contact
            </button>
            <Link href="/screening">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Mulai Screening
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link href="/screening">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Mulai Screening
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  // Hero Section Component
  const HeroSection = () => (
    <section id="hero" className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30">
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-80 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-violet-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-80 w-96 h-96 bg-gradient-to-r from-violet-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-8 leading-tight">
            Otomatiskan Screening{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Ratusan CV
            </span>{' '}
            dalam Hitungan Menit
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Rekruta adalah asisten rekrutmen AI Anda. Biarkan teknologi kami menganalisis, memfilter, dan memberi peringkat kandidat terbaik langsung dari Gmail & Google Drive Anda, sementara Anda fokus pada hal terpenting: wawancara.
          </p>

          <button 
            onClick={() => scrollToSection('screening-configuration')}
            className="group bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center space-x-3"
          >
            <span>Coba Gratis Sekarang</span>
            <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );

  // Features Section Component
  const FeaturesSection = () => {
    const features = [
      {
        icon: (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ),
        title: "Analisis CV Langsung dari Inbox",
        description: "Secara otomatis mendeteksi dan memproses lampiran CV dari email yang masuk tanpa perlu mengunduh satu per satu."
      },
      {
        icon: (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        ),
        title: "Hubungkan Folder Kandidat Anda",
        description: "Sinkronkan folder Google Drive berisi CV dan biarkan AI kami bekerja untuk menyusun daftar kandidat potensial."
      },
      {
        icon: (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM11 7h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h4v2h-4v-2zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2z"/>
          </svg>
        ),
        title: "Laporan Hasil Otomatis",
        description: "Hasil screening, peringkat kandidat, dan informasi kontak diekspor secara rapi ke Google Sheets untuk kemudahan pelacakan."
      }
    ];

    return (
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Semua yang Anda Butuhkan dalam{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Satu Platform Cerdas
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 rounded-2xl bg-gradient-to-br from-white to-slate-50/50 border border-slate-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-violet-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // About Section Component
  const AboutSection = () => (
    <section id="about" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image/Illustration */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-blue-100 to-violet-100 rounded-3xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">AI-Powered Recruitment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-8">
              Tentang{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Rekruta
              </span>
            </h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                Rekruta lahir dari visi untuk mengubah cara dunia melakukan rekrutmen. Kami percaya bahwa teknologi AI dapat memberdayakan tim HR untuk membuat keputusan yang lebih adil, cepat, dan berbasis data.
              </p>
              <p>
                Dengan mengintegrasikan langsung ke ekosistem Google yang sudah Anda gunakan sehari-hari, Rekruta menghilangkan hambatan teknis dan memberikan solusi yang seamless untuk proses screening kandidat.
              </p>
              <p>
                Misi kami adalah membantu setiap perusahaan, dari startup hingga enterprise, untuk menemukan talenta terbaik dengan efisiensi yang belum pernah ada sebelumnya.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Contact Section Component
  const ContactSection = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      company: '',
      message: ''
    });

    const handleSubmit = () => {
      // Handle form submission here
      console.log('Form submitted:', formData);
      alert('Terima kasih! Pesan Anda telah terkirim.');
    };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Get in Touch{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                with Us
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-6">
                Punya pertanyaan atau butuh demo?
              </h3>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Tim kami siap membantu Anda mengoptimalkan proses rekrutmen dengan teknologi AI terdepan. Jangan ragu untuk menghubungi kami.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Email</p>
                    <p className="text-slate-600">hello@rekruta.id</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Alamat</p>
                    <p className="text-slate-600">Jakarta, Indonesia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-8 rounded-3xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Perusahaan
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pesan Anda
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Kirim Pesan
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Screening Configuration Section (Target for CTA)
  const ScreeningConfigSection = () => (
    <section id="screening-configuration" className="py-24 bg-gradient-to-br from-blue-600 to-violet-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          Siap Memulai?
        </h2>
        <p className="text-xl mb-12 opacity-90">
          Bergabunglah dengan ratusan perusahaan yang sudah merasakan efisiensi rekrutmen dengan Rekruta
        </p>
        <Link href="/screening">
          <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center space-x-3">
            <span>Mulai Screening Gratis</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </Link>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <ScreeningConfigSection />
      <ContactSection />
    </div>
  );
};

export default HomePage;