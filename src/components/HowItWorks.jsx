import React from 'react';

export default function HowItWorks() {
  const steps = [
    { n: '01', num: 1, t: 'Submit Request', d: 'Fill our form or WhatsApp us. Tell us what you need, when, and where in Deoghar.' },
    { n: '02', num: 2, t: 'We Confirm Fast', d: 'Within 30 minutes, we send worker\'s name, photo, and confirmed arrival time.' },
    { n: '03', num: 3, t: 'Worker Arrives', d: 'Verified worker comes on time. Price was fixed upfront — zero surprises.' },
    { n: '04', num: 4, t: 'Pay & Rate', d: 'Pay after work is done. Rate the worker. 3-day warranty is always included.' }
  ];

  return (
    <section className="section how-section">
      <div className="si">
        <div className="s-hdr reveal visible">
          <div className="s-tag">How It Works</div>
          <h2 className="s-title">Simple as 1-2-3-4</h2>
          <p className="s-sub">From request to done — the whole process is smooth and transparent.</p>
        </div>
        <div className="steps reveal visible">
          {steps.map((step) => (
            <div key={step.n} className="step" data-n={step.n}>
              <div className="step-num">{step.num}</div>
              <h3>{step.t}</h3>
              <p>{step.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
