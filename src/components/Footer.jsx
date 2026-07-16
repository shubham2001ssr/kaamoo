import React from 'react';
import { CONFIG } from '../data/config';

export default function Footer({ setPage }) {
  const openWA = () => {
    window.open(`https://wa.me/${CONFIG.KAAMOO_WA}?text=Namaste Kaamoo! Mujhe service chahiye.`, '_blank');
  };

  const navigate = (pageId) => {
    setPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="f-logo" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
              Kaam<b>oo</b>
            </div>
            <p className="f-desc">
              Deoghar's one-stop service platform. Verified workers, fixed prices, time guarantee.
              <br />
              Ek Call, Har Kaam.
            </p>
            <div className="social-row">
              <div className="s-btn" onClick={openWA} title="WhatsApp">💬</div>
              <div className="s-btn" title="Facebook">📘</div>
              <div className="s-btn" title="Instagram">📸</div>
            </div>
          </div>
          
          <div className="f-col">
            <h4>Services</h4>
            <a onClick={() => navigate('services')}>Plumber</a>
            <a onClick={() => navigate('services')}>Electrician</a>
            <a onClick={() => navigate('services')}>Cook / Maid</a>
            <a onClick={() => navigate('services')}>Driver</a>
            <a onClick={() => navigate('services')}>All Services →</a>
          </div>
          
          <div className="f-col">
            <h4>Company</h4>
            <a onClick={() => navigate('about')}>About Us</a>
            <a onClick={() => navigate('worker')}>Careers</a>
            <a onClick={() => navigate('tracking')}>Track Booking</a>
            <a onClick={() => navigate('contact')}>Contact</a>
          </div>
          
          <div className="f-col">
            <h4>Contact</h4>
            <a>+{CONFIG.KAAMOO_WA}</a>
            <a>{CONFIG.EMAIL}</a>
            <a>{CONFIG.LOCATION_TEXT}</a>
            <a>{CONFIG.WORKING_HOURS}</a>
          </div>
        </div>
        
        <div className="f-bottom">
          <span>© {new Date().getFullYear()} Kaamoo. All rights reserved.</span>
          <span>Made with ❤️ in {CONFIG.LOCATION_TEXT}</span>
        </div>
      </div>
    </footer>
  );
}
