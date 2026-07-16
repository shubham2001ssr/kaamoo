import React, { useState } from 'react';
import { CONFIG } from '../data/config';
import { db, fbReady, collection, addDoc } from '../firebase';

export default function Contact({ addMessageToState }) {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, val) => {
    setFormData({ ...formData, [field]: val });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length <= 1) errs.name = true;
    if (!/^\d{10}$/.test(formData.mobile.trim())) errs.mobile = true;
    if (!formData.subject) errs.subject = true;
    if (!formData.message.trim() || formData.message.trim().length <= 5) errs.message = true;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitContact = async () => {
    if (!validate()) return;
    setLoading(true);

    const entry = {
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      createdAt: new Date().toISOString()
    };

    let saved = false;
    if (fbReady && db) {
      try {
        await addDoc(collection(db, 'contacts'), entry);
        saved = true;
      } catch (e) {
        console.warn('Firebase write failed, fallback to local storage:', e);
      }
    }

    // Always push to local storage list as fallback / mirror
    try {
      const localMsgs = JSON.parse(localStorage.getItem('km_messages') || '[]');
      localMsgs.push(entry);
      localStorage.setItem('km_messages', JSON.stringify(localMsgs));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }

    if (CONFIG.GOOGLE_SHEETS_URL) {
      try {
        await fetch(CONFIG.GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'message', ...entry })
        });
      } catch (e) {
        console.warn('Google Sheets sync failed:', e);
      }
    }

    if (addMessageToState) {
      addMessageToState(entry);
    }

    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="page active" id="page-contact">
      <section className="section">
        <div className="si">
          <div className="contact-grid reveal visible">
            <div>
              <div className="s-tag">Contact Us</div>
              <h2 className="s-title" style={{ marginTop: '12px' }}>Get in touch</h2>
              <p style={{ fontSize: '15px', color: 'var(--muted)', marginBottom: '28px', lineHeight: 1.7 }}>
                Question, complaint, or want to partner? We reply within 2 hours.
              </p>
              
              <div className="c-item">
                <div className="c-icon">📞</div>
                <div>
                  <div className="c-label">Phone / WhatsApp</div>
                  <div className="c-val">+{CONFIG.KAAMOO_WA}</div>
                </div>
              </div>
              
              <div className="c-item">
                <div className="c-icon">📧</div>
                <div>
                  <div className="c-label">Email</div>
                  <div className="c-val">{CONFIG.EMAIL}</div>
                </div>
              </div>
              
              <div className="c-item">
                <div className="c-icon">📍</div>
                <div>
                  <div className="c-label">Location</div>
                  <div className="c-val">{CONFIG.LOCATION_FULL}</div>
                </div>
              </div>
              
              <div className="c-item">
                <div className="c-icon">⏰</div>
                <div>
                  <div className="c-label">Working Hours</div>
                  <div className="c-val">{CONFIG.WORKING_HOURS}</div>
                </div>
              </div>
            </div>

            <div className="form-card">
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '18px' }}>Send a message</h3>
              
              {!success ? (
                <div id="contactForm">
                  <div className="g2">
                    <div className={`field ${errors.name ? 'err' : ''}`} id="cf-name">
                      <label>Name <span className="req">*</span></label>
                      <input 
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                      <div className="err-msg">Name required</div>
                    </div>
                    <div className={`field ${errors.mobile ? 'err' : ''}`} id="cf-mob">
                      <label>Mobile <span className="req">*</span></label>
                      <input 
                        type="tel" 
                        maxLength="10" 
                        placeholder="10 digit"
                        value={formData.mobile}
                        onChange={(e) => handleInputChange('mobile', e.target.value)}
                      />
                      <div className="err-msg">Valid number</div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Email <span className="hint">(optional)</span></label>
                    <input 
                      type="email" 
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className={`field ${errors.subject ? 'err' : ''}`} id="cf-subj">
                    <label>Subject <span className="req">*</span></label>
                    <select 
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                    >
                      <option value="">Select topic</option>
                      <option>Service Inquiry</option>
                      <option>Complaint</option>
                      <option>Worker Issue</option>
                      <option>Partnership</option>
                      <option>Feedback</option>
                      <option>Other</option>
                    </select>
                    <div className="err-msg">Select a subject</div>
                  </div>
                  <div className={`field ${errors.message ? 'err' : ''}`} id="cf-msg">
                    <label>Message <span className="req">*</span></label>
                    <textarea 
                      placeholder="Your message..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    ></textarea>
                    <div className="err-msg">Message required</div>
                  </div>
                  <button 
                    className="btn btn-primary btn-full" 
                    style={{ padding: '13px' }} 
                    onClick={submitContact}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block' }}></span>
                    ) : (
                      <><i className="ti ti-send"></i> Send Message</>
                    )}
                  </button>
                </div>
              ) : (
                <div id="contactDone" style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '44px', marginBottom: '12px' }}>✅</div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--gd)', marginBottom: '8px' }}>
                    Message sent!
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                    We'll reply on WhatsApp within 2 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
