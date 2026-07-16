import React from 'react';

export default function Hero({ setPage, onQuickSelect }) {
  const quickItems = [
    { n: 'Plumber', e: '🔧' },
    { n: 'Electrician', e: '⚡' },
    { n: 'Cook', e: '🍳' },
    { n: 'Maid', e: '🧹' },
    { n: 'Driver', e: '🚗' },
    { n: 'Painter', e: '🎨' },
    { n: 'Beautician', e: '💅' },
    { n: 'Photographer', e: '📷' }
  ];

  return (
    <section className="hero">
      <div className="hero-gradient"></div>
      <div className="hero-circle hc1"></div>
      <div className="hero-circle hc2"></div>
      <div className="hero-inner">
        <div>
          <div className="hero-tag">
            <span className="pulse-red"></span>Live 24/7 Doorstep Service in Deoghar
          </div>
          <h1>
            Ek Call,<br />
            <span className="green">Har Kaam</span><br />
            <span className="amber">Done.</span>
          </h1>
          <p className="hero-sub">
            Verified plumbers, electricians, cooks, drivers and 30+ services at your doorstep. 
            Fixed price. Time guarantee. No surprises.
          </p>
          <div className="hero-btns">
            <button className="btn btn-primary btn-lg" onClick={() => setPage('booking')}>
              <i className="ti ti-calendar-check"></i>Book a Service
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => setPage('services')}>
              <i className="ti ti-search"></i>Explore Services
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-n">50+</div>
              <div className="stat-l">Verified workers</div>
            </div>
            <div>
              <div className="stat-n">200+</div>
              <div className="stat-l">Jobs done</div>
            </div>
            <div>
              <div className="stat-n">4.8★</div>
              <div className="stat-l">Avg rating</div>
            </div>
          </div>
        </div>

        <div className="hero-card reveal visible">
          <div className="hc-label">What do you need today?</div>
          <div className="quick-grid">
            {quickItems.map((item) => (
              <div key={item.n} className="quick-item" onClick={() => onQuickSelect(item.n)}>
                <div className="qi">{item.e}</div>
                <div className="qn">{item.n}</div>
              </div>
            ))}
            <div className="quick-item" onClick={() => setPage('services')}>
              <div className="qi">➕</div>
              <div className="qn">More…</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={() => setPage('booking')}>
            Book Now — Free, No Advance
          </button>
        </div>
      </div>
    </section>
  );
}
