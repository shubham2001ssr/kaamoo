import React, { useState } from 'react';

export default function Navbar({ activePage, setPage }) {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = (pageId) => {
    setPage(pageId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => navigate('home')}>
            Kaam<b>oo</b>
          </div>
          <div className="nav-links">
            <div className={`nl ${activePage === 'home' ? 'on' : ''}`} onClick={() => navigate('home')}>Home</div>
            <div className={`nl ${activePage === 'services' ? 'on' : ''}`} onClick={() => navigate('services')}>Services</div>
            <div className={`nl ${activePage === 'booking' ? 'on' : ''}`} onClick={() => navigate('booking')}>Book Now</div>
            <div className={`nl ${activePage === 'tracking' ? 'on' : ''}`} onClick={() => navigate('tracking')}>Track Booking</div>
            <div className={`nl ${activePage === 'about' ? 'on' : ''}`} onClick={() => navigate('about')}>About</div>
            <div className={`nl ${activePage === 'contact' ? 'on' : ''}`} onClick={() => navigate('contact')}>Contact</div>
            <button className="nav-book" onClick={() => navigate('admin')}>Admin ↗</button>
          </div>
          <div className="ham" onClick={() => setIsOpen(!isOpen)} id="ham">
            <span style={isOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}></span>
            <span style={isOpen ? { opacity: 0 } : {}}></span>
            <span style={isOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}}></span>
          </div>
        </div>
      </nav>

      <div className={`mob-menu ${isOpen ? 'open' : ''}`} id="mobMenu">
        <div className="mob-link" onClick={() => navigate('home')}>🏠 Home</div>
        <div className="mob-link" onClick={() => navigate('services')}>🔧 Services</div>
        <div className="mob-link" onClick={() => navigate('booking')}>📅 Book Now</div>
        <div className="mob-link" onClick={() => navigate('tracking')}>🔍 Track Booking</div>
        <div className="mob-link" onClick={() => navigate('about')}>ℹ️ About Us</div>
        <div className="mob-link" onClick={() => navigate('contact')}>📞 Contact</div>
        <div className="mob-link" onClick={() => navigate('admin')} style={{ color: 'var(--g)', fontWeight: 600 }}>🔐 Admin</div>
      </div>
    </>
  );
}
