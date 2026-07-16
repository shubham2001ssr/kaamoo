import React from 'react';

export default function About() {
  return (
    <div className="page active" id="page-about">
      <div className="about-hero">
        <h1>About Kaamoo</h1>
        <p>Born in Deoghar, built for every Indian city — one platform, every service, zero compromise.</p>
      </div>
      <section className="section">
        <div className="si">
          <div className="mission-grid reveal visible">
            <div>
              <div className="s-tag">Our Mission</div>
              <h2 className="s-title" style={{ marginTop: '12px' }}>We solve the real problem</h2>
              <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.8, marginBottom: '14px' }}>
                In every small city, people struggle to find reliable plumbers, cooks, and electricians. 
                They call 5 people, 3 don't pick up, 1 comes late, and 1 overcharges. We built Kaamoo to end that frustration.
              </p>
              <p style={{ fontSize: '16px', color: 'var(--muted)', lineHeight: 1.8 }}>
                Started in Deoghar, Jharkhand — we are building for Tier 2 and 3 cities where Urban Company doesn't go. 
                One platform, every service, every family.
              </p>
            </div>
            <div style={{ background: 'var(--gd)', borderRadius: 'var(--radius-lg)', padding: '36px', color: '#fff' }}>
              <h3 style={{ fontSize: '22px', marginBottom: '20px' }}>The Kaamoo Promise</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🎯</span>
                  <div>
                    <strong>One Number</strong>
                    <p style={{ fontSize: '13px', opacity: .7, marginTop: '3px' }}>Call once — we handle everything else</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🛡️</span>
                  <div>
                    <strong>Verified Workers</strong>
                    <p style={{ fontSize: '13px', opacity: .7, marginTop: '3px' }}>Aadhar checked, agreement signed</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>💰</span>
                  <div>
                    <strong>Fixed Prices</strong>
                    <p style={{ fontSize: '13px', opacity: .7, marginTop: '3px' }}>No bargaining, no surprises, ever</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🔄</span>
                  <div>
                    <strong>3-Day Guarantee</strong>
                    <p style={{ fontSize: '13px', opacity: .7, marginTop: '3px' }}>Problem returns? We fix free</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="values-grid reveal visible" style={{ marginTop: '56px' }}>
            <div className="val-card">
              <div className="val-icon">🤝</div>
              <div className="val-title">Trust First</div>
              <div className="val-desc">Every action we take builds trust between customers and workers.</div>
            </div>
            <div className="val-card">
              <div className="val-icon">⚡</div>
              <div className="val-title">Speed</div>
              <div className="val-desc">30-min confirmation. Same-day service when possible.</div>
            </div>
            <div className="val-card">
              <div className="val-icon">❤️</div>
              <div className="val-title">Worker Welfare</div>
              <div className="val-desc">Fair pay, on time. Workers are our biggest strength.</div>
            </div>
            <div className="val-card">
              <div className="val-icon">🌱</div>
              <div className="val-title">Local First</div>
              <div className="val-desc">Built for Tier 2-3 cities. Rooted in Deoghar.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
