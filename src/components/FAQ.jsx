import React, { useState } from 'react';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: 'Is Kaamoo service really available 24/7?',
      a: 'Yes! We provide round-the-clock doorstep services in Deoghar. While regular services are booked between 7 AM and 9 PM, emergency bookings (like urgent pipe leaks or electrical failures) can be requested anytime 24/7 by calling us directly.'
    },
    {
      q: 'How do you guarantee worker safety and trust?',
      a: 'Every service professional registered with Kaamoo undergoes mandatory Aadhar identification checks and signs a strict digital agreement. We verify details before assignment so you know exactly who is entering your home.'
    },
    {
      q: 'Are there any hidden costs?',
      a: 'No hidden charges! Our rates are transparent and confirmed before the worker starts the job. You pay exactly the agreed amount after the service is completed.'
    },
    {
      q: 'What if the issue returns after the repair?',
      a: 'We offer a 3-Day Free Repair Guarantee. If the exact same problem returns within 3 days of the service, we will send the worker back to resolve it at absolutely zero extra cost to you.'
    }
  ];

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="section" style={{ background: 'var(--white)' }}>
      <div className="si">
        <div className="s-hdr reveal visible" style={{ textAlign: 'center' }}>
          <div className="s-tag">FAQ</div>
          <h2 className="s-title">Frequently Asked Questions</h2>
          <p className="s-sub" style={{ margin: '0 auto' }}>
            Quick answers to common questions about our 24/7 doorstep services in Deoghar.
          </p>
        </div>
        <div className="faq-accordion reveal visible" style={{ maxWidth: '800px', margin: '32px auto 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => toggle(idx)}>
                <div className="faq-q">
                  <span>{faq.q}</span>
                  <i className="ti ti-chevron-down"></i>
                </div>
                <div className="faq-a">
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
