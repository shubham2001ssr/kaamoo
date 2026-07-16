import React from 'react';
import { CONFIG } from '../data/config';

export default function FloatingContact() {
  const openWA = () => {
    window.open(`https://wa.me/${CONFIG.KAAMOO_WA}?text=Namaste Kaamoo! Mujhe service chahiye.`, '_blank');
  };

  return (
    <div className="floating-contact">
      <div className="fc-badge">
        <span className="pulse-red"></span>Live 24/7 Support
      </div>
      <div className="fc-buttons">
        <a href={`tel:+${CONFIG.KAAMOO_WA}`} className="fc-btn call" title="Call Us 24/7">
          <i className="ti ti-phone"></i>
        </a>
        <button onClick={openWA} className="fc-btn wa" title="WhatsApp Us" style={{ border: 'none' }}>
          <i className="ti ti-brand-whatsapp"></i>
        </button>
      </div>
      <div className="fc-main-trigger">
        <i class="ti ti-headset"></i>
      </div>
    </div>
  );
}
