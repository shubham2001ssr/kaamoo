import React, { useState, useEffect, useRef } from 'react';
import { CONFIG } from '../data/config';
import { db, fbReady, collection, addDoc } from '../firebase';

export default function Careers({ setPage, addWorkerToState }) {
  const [success, setSuccess] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    backup: '',
    aadhar: '',
    emergencyName: '',
    relation: '',
    address: '',
    skill: '',
    otherSkills: [],
    area: '',
    hours: '',
    dayoff: 'No fixed day off',
    rate: '',
    upi: '',
    agree: false
  });
  
  const [errors, setErrors] = useState({});
  const canvasRef = useRef(null);
  const [sigMark, setSigMark] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Setup canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth || 640;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#18181A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDrawing = (e) => {
      e.preventDefault();
      setIsDrawing(true);
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setSigMark(true);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
    };

    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth || 640;
        ctx.strokeStyle = '#18181A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
      window.removeEventListener('resize', handleResize);
    };
  }, [success, isDrawing]);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigMark(false);
    setSignatureData('');
  };

  const handleInputChange = (field, val) => {
    setFormData({ ...formData, [field]: val });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const handleCheckboxChange = (skillName, checked) => {
    let list = [...formData.otherSkills];
    if (checked) {
      list.push(skillName);
    } else {
      list = list.filter((s) => s !== skillName);
    }
    setFormData({ ...formData, otherSkills: list });
  };

  const fmtAadhar = (val) => {
    const v = val.replace(/\D/g, '').substring(0, 12);
    const formatted = v.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    handleInputChange('aadhar', formatted);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length <= 1) errs.name = true;
    if (!/^\d{10}$/.test(formData.mobile.trim())) errs.mobile = true;
    if (formData.aadhar.replace(/\s/g, '').length !== 12) errs.aadhar = true;
    if (!formData.emergencyName.trim() || formData.emergencyName.trim().length <= 1) errs.emergencyName = true;
    if (!formData.relation) errs.relation = true;
    if (!formData.address.trim() || formData.address.trim().length <= 2) errs.address = true;
    if (!formData.skill) errs.skill = true;
    if (!formData.area.trim() || formData.area.trim().length <= 2) errs.area = true;
    if (!formData.hours) errs.hours = true;
    if (!formData.rate || parseInt(formData.rate) <= 0) errs.rate = true;
    
    if (!sigMark) errs.signature = true;
    if (!formData.agree) errs.agree = true;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getSavedWorkersCount = () => {
    try {
      const w = JSON.parse(localStorage.getItem('km_workers') || '[]');
      return w.length;
    } catch {
      return 0;
    }
  };

  const submitApplication = async () => {
    if (!validate()) return;
    setLoading(true);

    const canvas = canvasRef.current;
    const sigDataUrl = canvas ? canvas.toDataURL() : '';
    setSignatureData(sigDataUrl);

    const count = getSavedWorkersCount();
    const id = `DSW-${100 + count + 1}`;
    setWorkerId(id);

    const entry = {
      id,
      name: formData.name,
      mobile: formData.mobile,
      backup: formData.backup,
      aadhar: formData.aadhar,
      emergencyName: formData.emergencyName,
      relation: formData.relation,
      address: formData.address,
      skill: formData.skill,
      otherSkills: formData.otherSkills.join(', '),
      area: formData.area,
      hours: formData.hours,
      dayOff: formData.dayoff,
      rate: formData.rate,
      upi: formData.upi,
      signature: sigDataUrl,
      status: 'Active',
      joinDate: new Date().toISOString()
    };

    let saved = false;
    if (fbReady && db) {
      try {
        await addDoc(collection(db, 'workers'), entry);
        saved = true;
      } catch (e) {
        console.warn('Firebase worker registration failed, fallback to local storage:', e);
      }
    }

    if (!saved) {
      try {
        const localWorkers = JSON.parse(localStorage.getItem('km_workers') || '[]');
        localWorkers.push(entry);
        localStorage.setItem('km_workers', JSON.stringify(localWorkers));
        setShowNotice(true);
      } catch (e) {
        console.error('LocalStorage write failed:', e);
      }
    }

    if (CONFIG.GOOGLE_SHEETS_URL) {
      try {
        const cleanEntry = { ...entry, signature: '[Signed Digitally]' };
        await fetch(CONFIG.GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'worker', ...cleanEntry })
        });
      } catch (e) {
        console.warn('Google Sheets sync failed:', e);
      }
    }

    if (addWorkerToState) {
      addWorkerToState(entry);
    }

    window._lastWorker = entry;
    setLoading(false);
    setSuccess(true);
  };

  const downloadPDF = () => {
    const w = window._lastWorker;
    if (!w) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:Arial,sans-serif;padding:48px;color:#18181A;max-width:680px;margin:0 auto}
    h1{color:#085041;font-size:26px;margin-bottom:4px}.sub{color:#6B6968;font-size:13px;margin-bottom:20px}
    hr{border:none;border-top:2px solid #1D9E75;margin:18px 0}
    .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #E2DED8;font-size:13px}
    .k{color:#6B6968}.v{font-weight:600}h3{color:#085041;margin:22px 0 10px;font-size:15px}
    li{padding:3px 0;font-size:13px;line-height:1.65}
    .badge{background:#E1F5EE;color:#085041;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;display:inline-block;margin-bottom:14px}
    .sig-section{display:flex;gap:32px;margin-top:28px}
    .sig-box{flex:1;border:1px solid #ccc;padding:14px;border-radius:8px}
    .sig-label{font-size:11px;color:#6B6968;margin-bottom:6px}
    img{max-width:200px;max-height:70px;border-bottom:1px solid #ccc}
    .footer{margin-top:36px;text-align:center;font-size:11px;color:#6B6968;border-top:1px solid #E2DED8;padding-top:14px}
    </style></head><body>
    <h1>Kaamoo</h1><div class="sub">Worker Agreement & Registration Certificate</div>
    <div class="badge">Worker ID: ${w.id}</div><hr>
    <h3>Worker Details</h3>
    <div class="row"><span class="k">Full Name</span><span class="v">${w.name}</span></div>
    <div class="row"><span class="k">Mobile</span><span class="v">${w.mobile}</span></div>
    <div class="row"><span class="k">Aadhar No.</span><span class="v">${w.aadhar}</span></div>
    <div class="row"><span class="k">Address</span><span class="v">${w.address}</span></div>
    <div class="row"><span class="k">Main Skill</span><span class="v">${w.skill}</span></div>
    <div class="row"><span class="k">Other Skills</span><span class="v">${w.otherSkills || '—'}</span></div>
    <div class="row"><span class="k">Service Area</span><span class="v">${w.area}</span></div>
    <div class="row"><span class="k">Available Hours</span><span class="v">${w.hours}</span></div>
    <div class="row"><span class="k">Starting Rate</span><span class="v">₹${w.rate}+</span></div>
    <div class="row"><span class="k">Emergency Contact</span><span class="v">${w.emergencyName} (${w.relation})</span></div>
    <div class="row"><span class="k">Registration Date</span><span class="v">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    <hr><h3>Agreement Terms</h3>
    <ul>
      <li>I will arrive on time. If late, I will inform Kaamoo FIRST — not the customer directly.</li>
      <li>I will NOT take the customer's contact directly. All work comes through Kaamoo only.</li>
      <li>I will not charge more than the agreed price. Extra material must be communicated first.</li>
      <li>I will behave respectfully at all times, especially in homes with women and elderly.</li>
      <li>If work has a problem within 3 days, I will return and fix it FREE of charge.</li>
      <li>3 complaints = permanent removal from platform. No exceptions.</li>
      <li>2 no-shows = warning. 3rd no-show = removal from platform.</li>
      <li>Commission: 15% of every job goes to Kaamoo. My payment within 24 hours.</li>
      <li>Taking customer directly (bypassing Kaamoo) = immediate removal + no payment for that job.</li>
    </ul>
    <div class="sig-section">
      <div class="sig-box"><div class="sig-label">Worker's Digital Signature</div><img src="${w.signature}"></div>
      <div class="sig-box"><div class="sig-label">Kaamoo Representative Signature</div><div style="height:60px;border-bottom:1px solid #ccc"></div><div style="font-size:11px;color:#6B6968;margin-top:6px">Date: ${new Date().toLocaleDateString('en-IN')}</div></div>
    </div>
    <div class="footer">Kaamoo — Ek Call, Har Kaam | Deoghar, Jharkhand, India | kaamoowebsite@gmail.com<br>This is a legally binding digital agreement signed on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.</div>
    </body></html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `Kaamoo_Agreement_${w.id}.html`
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sendWorkerWA = () => {
    const msg = `🙏 Kaamoo Worker Registration\n\nWorker ID: *${workerId}*\nNaam: ${formData.name}\nSkill: ${formData.skill}\n\nRegistration done. Kaamoo team contact karegi.`;
    window.open(`https://wa.me/${CONFIG.KAAMOO_WA}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (success) {
    return (
      <div className="page active" id="page-worker">
        <div className="form-page">
          <div className="form-wrap">
            <div className="form-card success-panel" style={{ display: 'block' }}>
              <div className="s-icon">🎉</div>
              <div className="s-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd)', marginBottom: '8px' }}>
                Application Submitted!
              </div>
              <p className="s-sub">Your Partner ID:</p>
              <div className="ref-badge" id="workerIdBadge">{workerId}</div>
              <div className="summary-box" style={{ margin: '14px 0', textAlign: 'left' }} id="wSummary">
                <strong>Worker ID:</strong> {workerId}<br />
                <strong>Name:</strong> {formData.name}<br />
                <strong>Skill:</strong> {formData.skill}<br />
                <strong>Area:</strong> {formData.area}<br />
                <strong>Rate:</strong> ₹{formData.rate}+<br />
                <strong>Joined:</strong> {new Date().toLocaleDateString('en-IN')}
              </div>
              {showNotice && (
                <div className="firebase-notice show" style={{ background: 'var(--al)', color: 'var(--ad)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                  ℹ️ Saved locally (Firebase fallback).
                </div>
              )}
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '18px' }}>
                Kaamoo verification team will contact you on WhatsApp soon.
              </p>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={downloadPDF}>
                  📄 Download Registration Certificate
                </button>
                <button className="btn btn-wa" onClick={sendWorkerWA}>
                  💬 WhatsApp Us
                </button>
                <button className="btn btn-outline" onClick={() => setPage('home')}>
                  🏠 Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="page-worker">
      <div className="form-page">
        <div className="form-wrap">
          <div className="form-hdr reveal visible">
            <div className="s-tag">Careers</div>
            <h2>Join as Partner</h2>
            <p>Register on Kaamoo and get regular, well-paying work — verified, fair, on time.</p>
          </div>

          <div className="form-card reveal visible" id="workerCard">
            <div className="f-section">Personal Details</div>
            <div className="g2">
              <div className={`field ${errors.name ? 'err' : ''}`} id="wf-name">
                <label>Full Name <span className="req">*</span></label>
                <input 
                  placeholder="Poora naam" 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
                <div className="err-msg">Naam zaroori hai</div>
              </div>
              <div className={`field ${errors.mobile ? 'err' : ''}`} id="wf-mob">
                <label>Mobile <span className="req">*</span></label>
                <input 
                  type="tel" 
                  maxLength="10" 
                  placeholder="10 digit"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                />
                <div className="err-msg">Valid number chahiye</div>
              </div>
            </div>
            
            <div className="g2">
              <div className="field">
                <label>Backup Number <span className="hint">(family)</span></label>
                <input 
                  placeholder="Family ka number" 
                  maxLength="10"
                  value={formData.backup}
                  onChange={(e) => handleInputChange('backup', e.target.value)}
                />
              </div>
              <div className={`field ${errors.aadhar ? 'err' : ''}`} id="wf-aadhar">
                <label>Aadhar Number <span className="req">*</span></label>
                <input 
                  placeholder="XXXX XXXX XXXX" 
                  maxLength="14" 
                  value={formData.aadhar}
                  onChange={(e) => fmtAadhar(e.target.value)}
                />
                <div className="err-msg">Valid 12-digit Aadhar</div>
              </div>
            </div>

            <div className="g2">
              <div className={`field ${errors.emergencyName ? 'err' : ''}`} id="wf-emname">
                <label>Emergency Contact <span className="req">*</span></label>
                <input 
                  placeholder="Unka naam"
                  value={formData.emergencyName}
                  onChange={(e) => handleInputChange('emergencyName', e.target.value)}
                />
                <div className="err-msg">Emergency contact zaroori</div>
              </div>
              <div className={`field ${errors.relation ? 'err' : ''}`} id="wf-rel">
                <label>Relation <span className="req">*</span></label>
                <select 
                  value={formData.relation}
                  onChange={(e) => handleInputChange('relation', e.target.value)}
                >
                  <option value="">Select</option>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Husband</option>
                  <option>Wife</option>
                  <option>Brother</option>
                  <option>Sister</option>
                  <option>Son</option>
                  <option>Daughter</option>
                  <option>Other</option>
                </select>
                <div className="err-msg">Select karein</div>
              </div>
            </div>
            
            <div className={`field ${errors.address ? 'err' : ''}`} id="wf-addr">
              <label>Address / Mohalla <span className="req">*</span></label>
              <input 
                placeholder="Mohalla, Ward, Deoghar"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
              <div className="err-msg">Address zaroori hai</div>
            </div>

            <div className="f-section">Work Details</div>
            <div className={`field ${errors.skill ? 'err' : ''}`} id="wf-skill">
              <label>Main Skill <span className="req">*</span></label>
              <select 
                value={formData.skill}
                onChange={(e) => handleInputChange('skill', e.target.value)}
              >
                <option value="">Apna kaam chunein</option>
                <option>Plumber</option>
                <option>Electrician</option>
                <option>Cook</option>
                <option>Maid / Cleaner</option>
                <option>Driver</option>
                <option>Painter</option>
                <option>Carpenter</option>
                <option>Beautician</option>
                <option>Photographer</option>
                <option>Event Helper</option>
                <option>Movers & Packers</option>
                <option>Guard / Bouncer</option>
                <option>Delivery Person</option>
                <option>AC / Fridge Repair</option>
                <option>Pest Control</option>
                <option>Gardener</option>
                <option>Car Wash</option>
                <option>Other</option>
              </select>
              <div className="err-msg">Skill select karein</div>
            </div>

            <div className="field">
              <label>Other Skills <span className="hint">(optional)</span></label>
              <div className="cb-group" id="wOtherSkills">
                {['Plumber', 'Electrician', 'Cook', 'Maid', 'Driver', 'Painter', 'AC Repair', 'Delivery'].map((s) => (
                  <label key={s} className="cb-item">
                    <input 
                      type="checkbox" 
                      value={s}
                      checked={formData.otherSkills.includes(s)}
                      onChange={(e) => handleCheckboxChange(s, e.target.checked)}
                    /> {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="g2">
              <div className={`field ${errors.area ? 'err' : ''}`} id="wf-area">
                <label>Area Can Serve <span className="req">*</span></label>
                <input 
                  placeholder="Deoghar, Jasidih..."
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                />
                <div className="err-msg">Area zaroori hai</div>
              </div>
              <div className={`field ${errors.hours ? 'err' : ''}`} id="wf-hours">
                <label>Available Hours <span className="req">*</span></label>
                <select 
                  value={formData.hours}
                  onChange={(e) => handleInputChange('hours', e.target.value)}
                >
                  <option value="">Select timing</option>
                  <option>6am–6pm</option>
                  <option>7am–7pm</option>
                  <option>8am–8pm</option>
                  <option>9am–6pm</option>
                  <option>Full day flexible</option>
                  <option>Evening 4–9pm</option>
                </select>
                <div className="err-msg">Timing select karein</div>
              </div>
            </div>

            <div className="g2">
              <div className="field">
                <label>Day Off</label>
                <select 
                  value={formData.dayoff}
                  onChange={(e) => handleInputChange('dayoff', e.target.value)}
                >
                  <option>No fixed day off</option>
                  <option>Sunday</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                </select>
              </div>
              <div className={`field ${errors.rate ? 'err' : ''}`} id="wf-rate">
                <label>Starting Rate ₹ <span className="req">*</span></label>
                <input 
                  type="number" 
                  placeholder="e.g. 300" 
                  min="50"
                  value={formData.rate}
                  onChange={(e) => handleInputChange('rate', e.target.value)}
                />
                <div className="err-msg">Rate zaroori hai</div>
              </div>
            </div>

            <div className="field">
              <label>UPI ID / Bank Account</label>
              <input 
                placeholder="yourname@upi ya bank account"
                value={formData.upi}
                onChange={(e) => handleInputChange('upi', e.target.value)}
              />
            </div>

            <div className="f-section">Worker Agreement</div>
            <div className="agree-box">
              <h4>Kaamoo Worker Agreement — Poora padhein / Please read fully</h4>
              <ul>
                <li>Main time pe kaam pe aaunga/aaungi. Late hone par Kaamoo ko pehle inform karunga/karungi.</li>
                <li>Customer ka number seedha nahi lunga/lungi — sab kaam Kaamoo ke zariye aayega.</li>
                <li>Tay rate se zyada main nahi maangunga/maangungi.</li>
                <li>Main sabke saath izzat se pesh aaunga/aaungi.</li>
                <li>3 din mein koi problem aaye toh free mein theek karunga/karungi.</li>
                <li>3 complaints = platform se permanent removal.</li>
                <li>2 no-shows = warning. 3rd no-show = removal.</li>
                <li>Commission: 15% Kaamoo ka. Mera payment 24 ghante mein.</li>
                <li>Customer ko bypass karna = turant removal + payment nahi.</li>
              </ul>
            </div>

            <div className="f-section">Digital Signature</div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
              Neeche box mein apna signature karein (finger se ya mouse se)
            </p>
            <div className="sig-wrap">
              <canvas ref={canvasRef} height="130"></canvas>
              {!sigMark && (
                <div className="sig-placeholder" id="sigHint">✍️ Sign here</div>
              )}
              <button className="sig-clear" onClick={clearSig}>Clear</button>
            </div>
            {errors.signature && (
              <p id="sigErr" style={{ fontSize: '12px', color: 'var(--r)', marginTop: '4px', display: 'block' }}>
                Signature zaroori hai
              </p>
            )}

            <div className="agree-check">
              <input 
                type="checkbox" 
                id="w_agree"
                checked={formData.agree}
                onChange={(e) => handleInputChange('agree', e.target.checked)}
              />
              <label htmlFor="w_agree">
                Maine upar diya agreement poora padh liya hai aur main Kaamoo ke saare rules follow karne ka vachan deta/deti hoon. I have read the full agreement and agree to follow all rules.
              </label>
            </div>
            {errors.agree && (
              <p style={{ fontSize: '12px', color: 'var(--r)', marginBottom: '8px', display: 'block' }}>
                Agreement se agree karna zaroori hai ⚠️
              </p>
            )}

            <div className="firebase-notice show" style={{ background: 'var(--gl)', color: 'var(--gd)', padding: '10px', borderRadius: '8px', marginBottom: '14px', border: '1px solid rgba(29,158,117,0.2)' }}>
              ✓ Direct connection to database — safe & secure
            </div>

            <button 
              className="btn btn-primary btn-full" 
              style={{ padding: '14px' }}
              onClick={submitApplication}
              disabled={loading}
              id="wBtn"
            >
              {loading ? (
                <span className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block' }}></span>
              ) : (
                <><i className="ti ti-user-check"></i> Register as Kaamoo Partner</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
