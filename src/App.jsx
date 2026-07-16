import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FloatingContact from './components/FloatingContact';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Careers from './pages/Careers';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Tracking from './pages/Tracking';

export default function App() {
  const [activePage, setPage] = useState('home');
  const [selectedService, setSelectedService] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // SPA Hash Router Listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validPages = ['home', 'services', 'booking', 'tracking', 'worker', 'about', 'contact', 'admin'];
      if (validPages.includes(hash)) {
        setPage(hash);
      } else if (!hash) {
        setPage('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // check on load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Simulate page loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (pageId) => {
    window.location.hash = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickSelect = (svcName) => {
    setSelectedService(svcName);
    navigateTo('booking');
  };

  const handleCategoryClick = (catId) => {
    navigateTo('services');
    setTimeout(() => {
      const sec = document.getElementById(`cat-sec-${catId}`);
      if (sec) {
        const navHeight = 80;
        const offsetTop = sec.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
        
        const hdr = sec.querySelector('.cat-section-hdr');
        if (hdr) {
          hdr.style.transition = 'color 0.3s ease, border-color 0.3s ease';
          hdr.style.color = 'var(--g)';
          hdr.style.borderColor = 'var(--g)';
          setTimeout(() => {
            hdr.style.color = '';
            hdr.style.borderColor = '';
          }, 1500);
        }
      }
    }, 200); // slightly increased delay to ensure page mounted before scrolling
  };

  return (
    <>
      {isLoading && (
        <div className="loader-overlay" id="loader">
          <div className="loader-ring"></div>
          <div className="loader-text">Loading Kaamoo...</div>
        </div>
      )}

      <div className="toast" id="toast"></div>

      <Navbar activePage={activePage} setPage={navigateTo} />

      <main>
        {activePage === 'home' && (
          <Home 
            setPage={navigateTo} 
            onQuickSelect={handleQuickSelect} 
            onCategoryClick={handleCategoryClick} 
          />
        )}
        {activePage === 'services' && (
          <Services onSelectService={handleQuickSelect} />
        )}
        {activePage === 'booking' && (
          <Booking 
            selectedService={selectedService} 
            setSelectedService={setSelectedService} 
            setPage={navigateTo} 
          />
        )}
        {activePage === 'tracking' && (
          <Tracking />
        )}
        {activePage === 'worker' && (
          <Careers setPage={navigateTo} />
        )}
        {activePage === 'about' && (
          <About />
        )}
        {activePage === 'contact' && (
          <Contact />
        )}
        {activePage === 'admin' && (
          <Admin />
        )}
      </main>

      <FloatingContact />
      
      <Footer setPage={navigateTo} />
    </>
  );
}
