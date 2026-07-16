import React from 'react';

export default function CareersBanner({ setPage }) {
  return (
    <section className="section partner-banner">
      <div className="si reveal visible" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <div className="s-tag" style={{ background: '#E1F5EE', color: 'var(--gd)' }}>Partner With Us</div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', color: 'var(--gd)' }}>
          Want to earn more? Join Kaamoo!
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--muted)', marginBottom: '24px' }}>
          Are you an experienced plumber, electrician, cook, driver, or technician? 
          Join Deoghar's leading service team, get regular jobs, and earn a steady income.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => setPage('worker')}>
          <i className="ti ti-briefcase"></i>Explore Careers / Join as Partner
        </button>
      </div>
    </section>
  );
}
