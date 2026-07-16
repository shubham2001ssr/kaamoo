import React, { useState, useEffect } from 'react';
import { SVCS } from '../data/servicesData';
import { CONFIG } from '../data/config';
import { db, fbReady, collection, addDoc, getDocs, query, where } from '../firebase';

export default function Booking({ selectedService, setSelectedService, setPage, addBookingToState }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    addressFlat: '',
    addressStreet: '',
    addressLandmark: '',
    addressArea: '',
    addressPincode: '',
    date: '',
    budget: 'Not sure',
    time: 'Flexible',
    details: '',
    payment: 'UPI / GPay / PhonePe',
    otherService: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  // Advanced worker selections
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [pickedWorkerId, setPickedWorkerId] = useState('auto'); // 'auto' or worker ID
  const [bookedSlots, setBookedSlots] = useState([]); // slots blocked for this worker on this date
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Load available workers for selected service
  useEffect(() => {
    if (!selectedService) return;

    const fetchWorkers = async () => {
      setLoadingWorkers(true);
      let list = [];

      // Check local storage workers first
      try {
        const localW = JSON.parse(localStorage.getItem('km_workers') || '[]');
        const match = localW.filter(w => w.skill.toLowerCase() === selectedService.toLowerCase() && w.status === 'Active');
        list = [...match];
      } catch (e) {
        console.warn('Error reading local workers:', e);
      }

      // Check Firebase
      if (fbReady && db) {
        try {
          const qSnap = await getDocs(query(
            collection(db, 'workers'), 
            where('skill', '==', selectedService),
            where('status', '==', 'Active')
          ));
          const fbWorkers = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Merge lists uniquely by ID
          fbWorkers.forEach(fw => {
            if (!list.some(lw => lw.id === fw.id)) {
              list.push(fw);
            }
          });
        } catch (e) {
          console.warn('Error querying Firebase workers:', e);
        }
      }

      setAvailableWorkers(list);
      setPickedWorkerId('auto'); // reset to auto assign
      setBookedSlots([]); // reset blockouts
      setLoadingWorkers(false);
    };

    fetchWorkers();
  }, [selectedService]);

  // Load booked slots when date or picked worker changes
  useEffect(() => {
    if (pickedWorkerId === 'auto' || !formData.date) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      let slots = [];

      // Check local storage bookings
      try {
        const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
        const matches = localB.filter(b => 
          b.workerId === pickedWorkerId && 
          b.reqDate === formData.date && 
          b.status !== 'Cancelled'
        );
        matches.forEach(m => slots.push(m.time));
      } catch (e) {
        console.warn('Error reading local bookings:', e);
      }

      // Check Firebase bookings
      if (fbReady && db) {
        try {
          const qSnap = await getDocs(query(
            collection(db, 'bookings'),
            where('workerId', '==', pickedWorkerId),
            where('reqDate', '==', formData.date)
          ));
          qSnap.docs.forEach(doc => {
            const data = doc.data();
            if (data.status !== 'Cancelled') {
              slots.push(data.time);
            }
          });
        } catch (e) {
          console.warn('Error fetching booked slots from Firebase:', e);
        }
      }

      // Remove duplicates
      const uniqueSlots = [...new Set(slots)];
      setBookedSlots(uniqueSlots);

      // Reset picked slot if it's now booked/disabled
      if (uniqueSlots.includes(formData.time)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    };

    fetchBookedSlots();
  }, [pickedWorkerId, formData.date]);

  useEffect(() => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('b_date');
    if (dateInput) dateInput.min = today;
  }, [step]);

  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim() || formData.name.trim().length <= 1) errs.name = true;
    if (!/^\d{10}$/.test(formData.mobile.trim())) errs.mobile = true;
    if (!formData.addressFlat.trim()) errs.addressFlat = true;
    if (!formData.addressStreet.trim()) errs.addressStreet = true;
    if (!formData.addressLandmark.trim()) errs.addressLandmark = true;
    if (!formData.addressArea.trim()) errs.addressArea = true;
    if (!/^\d{6}$/.test(formData.addressPincode.trim())) errs.addressPincode = true;
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!selectedService) errs.service = true;
    if (selectedService === 'Other' && !formData.otherService.trim()) errs.otherService = true;
    if (!formData.date) errs.date = true;
    if (!formData.time) errs.time = true; // must pick an available time slot
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleInputChange = (field, val) => {
    setFormData({ ...formData, [field]: val });
    if (errors[field]) {
      setErrors({ ...errors, [field]: false });
    }
  };

  const handleServiceSelect = (svc) => {
    setSelectedService(svc);
    if (errors.service) {
      setErrors({ ...errors, [service]: false });
    }
  };

  const getSavedBookingsCount = () => {
    try {
      const b = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      return b.length;
    } catch {
      return 0;
    }
  };

  const submitBooking = async () => {
    setLoading(true);
    const finalService = selectedService === 'Other' ? formData.otherService : selectedService;
    const count = getSavedBookingsCount();
    const ref = `KMO-${1000 + count + 1}`;
    setBookingRef(ref);

    // Combine structured address
    const fullAddress = `${formData.addressFlat}, ${formData.addressStreet}, Near ${formData.addressLandmark}, ${formData.addressArea} - ${formData.addressPincode}`;

    const entry = {
      ref,
      name: formData.name,
      mobile: formData.mobile,
      address: fullAddress,
      addressFlat: formData.addressFlat,
      addressStreet: formData.addressStreet,
      addressLandmark: formData.addressLandmark,
      addressArea: formData.addressArea,
      addressPincode: formData.addressPincode,
      service: finalService,
      workerId: pickedWorkerId,
      reqDate: formData.date,
      time: formData.time,
      budget: formData.budget,
      details: formData.details,
      paymentPreference: formData.payment,
      paymentStatus: 'Unpaid',
      status: 'Pending',
      totalCost: 350, // default base fee, updated by admin on approval
      createdAt: new Date().toISOString()
    };

    let saved = false;
    if (fbReady && db) {
      try {
        await addDoc(collection(db, 'bookings'), entry);
        saved = true;
      } catch (e) {
        console.warn('Firebase write failed, fallback to local storage:', e);
      }
    }

    if (!saved) {
      try {
        const localBookings = JSON.parse(localStorage.getItem('km_bookings') || '[]');
        localBookings.push(entry);
        localStorage.setItem('km_bookings', JSON.stringify(localBookings));
        setShowNotice(true);
      } catch (e) {
        console.error('LocalStorage write failed:', e);
      }
    }

    if (CONFIG.GOOGLE_SHEETS_URL) {
      try {
        await fetch(CONFIG.GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking', ...entry })
        });
      } catch (e) {
        console.warn('Google Sheets sync failed:', e);
      }
    }

    if (addBookingToState) {
      addBookingToState(entry);
    }

    window._lastBooking = entry;
    setLoading(false);
    setSuccess(true);
  };

  const sendBookWA = () => {
    const finalService = selectedService === 'Other' ? formData.otherService : selectedService;
    const msg = `Namaste! Mera Booking Request send ho gaya hai. Ref: *${bookingRef}*, Service: *${finalService}*, Date: *${formData.date}*. Please verify.`;
    window.open(`https://wa.me/${CONFIG.KAAMOO_WA}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (success) {
    const finalService = selectedService === 'Other' ? formData.otherService : selectedService;
    return (
      <div className="page active" id="page-booking">
        <div className="form-page">
          <div className="form-wrap">
            <div className="form-card success-panel" style={{ display: 'block' }}>
              <div className="s-icon">🎉</div>
              <div className="s-title" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gd)', marginBottom: '8px' }}>
                Request Sent!
              </div>
              <p className="s-sub" style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '10px' }}>
                Your booking reference number is:
              </p>
              <div className="ref-badge" id="bookRef">{bookingRef}</div>
              
              <div style={{ padding: '16px', background: 'var(--al)', borderRadius: '12px', border: '1px solid var(--a)', color: 'var(--ad)', fontSize: '13px', margin: '18px 0', textAlign: 'left', lineHeight: '1.6' }}>
                <strong>⚠️ Verification Pending:</strong><br />
                Kaamoo Admin details check karega. Approve hote hi status change hoga. Please track your status using **Track Booking** tab. Once approved, you pay online to confirm.
              </div>

              <div className="summary-box" style={{ margin: '14px 0', textAlign: 'left' }}>
                <strong>Service:</strong> {finalService}<br />
                <strong>Date & Time:</strong> {formData.date} ({formData.time})<br />
                <strong>Cost:</strong> ₹350 (Base rate)<br />
                <strong>Worker Option:</strong> {pickedWorkerId === 'auto' ? 'Auto-Assign' : 'Request specific worker'}
              </div>

              {showNotice && (
                <div className="firebase-notice show" style={{ background: 'var(--al)', color: 'var(--ad)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                  ℹ️ Saved locally (Firebase fallback).
                </div>
              )}

              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '18px' }}>
                You can track or pay for this booking via the top menu **Track Booking**.
              </p>
              <div className="btn-row">
                <button className="btn btn-wa" onClick={sendBookWA}>
                  💬 WhatsApp Support
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
    <div className="page active" id="page-booking">
      <div className="form-page">
        <div className="form-wrap">
          <div className="form-hdr reveal visible">
            <div className="s-tag">Book a Service</div>
            <h2>Service Request</h2>
            <p>Fill the form — we confirm within 30 minutes on WhatsApp.</p>
          </div>
          <div className="form-card reveal visible" id="bookCard">
            <div className="step-dots">
              <div className={`dot ${step > 1 ? 'done' : step === 1 ? 'curr' : ''}`} id="bd1"></div>
              <div className={`dot ${step > 2 ? 'done' : step === 2 ? 'curr' : ''}`} id="bd2"></div>
              <div className={`dot ${step === 3 ? 'curr' : ''}`} id="bd3"></div>
            </div>

            {step === 1 && (
              <div id="bs1">
                <div className="f-section">Your Details</div>
                <div className="g2">
                  <div className={`field ${errors.name ? 'err' : ''}`} id="bf-name">
                    <label>Full Name <span className="req">*</span></label>
                    <input 
                      id="b_name" 
                      placeholder="Aapka naam" 
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    <div className="err-msg">Name required</div>
                  </div>
                  <div className={`field ${errors.mobile ? 'err' : ''}`} id="bf-mob">
                    <label>Mobile <span className="req">*</span></label>
                    <input 
                      id="b_mob" 
                      type="tel" 
                      maxLength="10" 
                      placeholder="10 digit number" 
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                    />
                    <div className="err-msg">Valid 10-digit number</div>
                  </div>
                </div>

                <div className="f-section">Step 2: Service Address Details</div>
                <div style={{ background: 'var(--al)', padding: '10px 14px', borderRadius: '8px', color: 'var(--ad)', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                  ℹ️ Pls write accurate address details to help our service partner find your location easily.
                </div>

                <div className="g2">
                  <div className={`field ${errors.addressFlat ? 'err' : ''}`}>
                    <label>Flat / House No. / Building <span className="req">*</span></label>
                    <input 
                      placeholder="e.g. Flat 302, Green Villa" 
                      value={formData.addressFlat}
                      onChange={(e) => handleInputChange('addressFlat', e.target.value)}
                    />
                    <div className="err-msg">Flat details required</div>
                  </div>
                  <div className={`field ${errors.addressStreet ? 'err' : ''}`}>
                    <label>Street / Locality / Road <span className="req">*</span></label>
                    <input 
                      placeholder="e.g. VIP Road, Jasidih" 
                      value={formData.addressStreet}
                      onChange={(e) => handleInputChange('addressStreet', e.target.value)}
                    />
                    <div className="err-msg">Street details required</div>
                  </div>
                </div>

                <div className={`field ${errors.addressLandmark ? 'err' : ''}`}>
                  <label>Nearest Landmark <span className="req">*</span></label>
                  <input 
                    placeholder="e.g. Opposite Durga Mandir, Near Post Office" 
                    value={formData.addressLandmark}
                    onChange={(e) => handleInputChange('addressLandmark', e.target.value)}
                  />
                  <div className="err-msg">Landmark details required</div>
                </div>

                <div className="g2">
                  <div className={`field ${errors.addressArea ? 'err' : ''}`}>
                    <label>Area / Mohalla / Ward <span className="req">*</span></label>
                    <input 
                      placeholder="e.g. Castairs Town, Ward 12" 
                      value={formData.addressArea}
                      onChange={(e) => handleInputChange('addressArea', e.target.value)}
                    />
                    <div className="err-msg">Area details required</div>
                  </div>
                  <div className={`field ${errors.addressPincode ? 'err' : ''}`}>
                    <label>6-Digit PIN Code <span className="req">*</span></label>
                    <input 
                      type="tel" 
                      maxLength="6"
                      placeholder="e.g. 814112" 
                      value={formData.addressPincode}
                      onChange={(e) => handleInputChange('addressPincode', e.target.value.replace(/\D/g, ''))}
                    />
                    <div className="err-msg">Valid 6-digit pin code</div>
                  </div>
                </div>

                <button className="btn btn-primary btn-full" style={{ padding: '13px', marginTop: '6px' }} onClick={handleNext}>
                  Continue <i className="ti ti-arrow-right"></i>
                </button>
              </div>
            )}

            {step === 2 && (
              <div id="bs2">
                <div className="f-section">Select Service <span className="req">*</span></div>
                <div className="svc-pick-grid" id="bSvcGrid">
                  {SVCS.map((s) => (
                    <div 
                      key={s.n} 
                      className={`svc-opt ${selectedService === s.n ? 'picked' : ''}`}
                      onClick={() => handleServiceSelect(s.n)}
                    >
                      <div className="so">{s.e}</div>
                      <div className="sn">{s.n}</div>
                    </div>
                  ))}
                </div>
                
                {selectedService === 'Other' && (
                  <div id="bOtherBox" style={{ marginTop: '10px' }}>
                    <div className={`field ${errors.otherService ? 'err' : ''}`}>
                      <label>Describe what you need <span className="req">*</span></label>
                      <input 
                        id="b_other" 
                        placeholder="Kya chahiye aapko..." 
                        value={formData.otherService}
                        onChange={(e) => handleInputChange('otherService', e.target.value)}
                      />
                      <div className="err-msg">Service description required</div>
                    </div>
                  </div>
                )}
                {errors.service && (
                  <p id="bSvcErr" style={{ fontSize: '12px', color: 'var(--r)', display: 'block', marginTop: '6px' }}>
                    Please select a service
                  </p>
                )}

                {selectedService && selectedService !== 'Other' && (
                  <>
                    <div className="f-section">Select Service Professional</div>
                    {loadingWorkers ? (
                      <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Loading available workers...</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div 
                          className={`cb-item ${pickedWorkerId === 'auto' ? 'picked' : ''}`}
                          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', border: pickedWorkerId === 'auto' ? '1.5px solid var(--g)' : '1.5px solid var(--border)' }}
                          onClick={() => setPickedWorkerId('auto')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="radio" checked={pickedWorkerId === 'auto'} readOnly style={{ accentColor: 'var(--g)' }} />
                            <div>
                              <strong>⚡ Auto-Assign (Recommended)</strong>
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Kaamoo assigns the best available nearby professional</div>
                            </div>
                          </div>
                        </div>

                        {availableWorkers.length > 0 ? (
                          availableWorkers.map((w) => (
                            <div 
                              key={w.id} 
                              className="cb-item"
                              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', border: pickedWorkerId === w.id ? '1.5px solid var(--g)' : '1.5px solid var(--border)', padding: '10px 14px' }}
                              onClick={() => setPickedWorkerId(w.id)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="radio" checked={pickedWorkerId === w.id} readOnly style={{ accentColor: 'var(--g)' }} />
                                <div>
                                  <strong>{w.name}</strong>
                                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                                    Rating: ★{w.rating || '4.8'} | Exp: {w.experience || '3'} Yrs | Rate: ₹{w.rate}+
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', paddingLeft: '6px' }}>
                            No specific worker matching this category currently online. Auto-assign fallback will match you.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                <div className="f-section" style={{ marginTop: '18px' }}>When do you need it?</div>
                <div className="g2">
                  <div className={`field ${errors.date ? 'err' : ''}`} id="bf-date">
                    <label>Date <span className="req">*</span></label>
                    <input 
                      id="b_date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                    <div className="err-msg">Date required</div>
                  </div>
                  <div className="field">
                    <label>Budget <span className="hint">(optional)</span></label>
                    <select 
                      id="b_budget"
                      value={formData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                    >
                      <option>Not sure</option>
                      <option>Under ₹500</option>
                      <option>₹500–₹1,000</option>
                      <option>₹1,000–₹3,000</option>
                      <option>₹3,000–₹10,000</option>
                      <option>₹10,000+</option>
                    </select>
                  </div>
                </div>
                
                <div className="field">
                  <label>Select Time Slot <span className="req">*</span></label>
                  {pickedWorkerId !== 'auto' && formData.date && bookedSlots.length > 0 && (
                    <div style={{ fontSize: '12px', background: 'var(--rl)', color: 'var(--r)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px', fontWeight: 600 }}>
                      ⚠️ Cross-out slots are already booked for this worker on this date.
                    </div>
                  )}
                  <div className="time-opts" id="bTimeOpts">
                    {[
                      { label: '🌅 Morning', val: 'Morning 7–10am', hint: '7–10am' },
                      { label: '☀️ Afternoon', val: 'Afternoon 10am–2pm', hint: '10am–2pm' },
                      { label: '🌤 Evening', val: 'Evening 2–6pm', hint: '2–6pm' },
                      { label: '🕐 Flexible', val: 'Flexible', hint: 'Anytime' },
                      { label: '🚨 URGENT', val: 'URGENT — now', hint: 'Right now' },
                      { label: '🌆 Night', val: 'Night 6–9pm', hint: '6–9pm' }
                    ].map((t) => {
                      const isBooked = bookedSlots.includes(t.val);
                      return (
                        <div 
                          key={t.val} 
                          className={`t-opt ${formData.time === t.val ? 'picked' : ''}`}
                          style={isBooked ? { opacity: 0.35, pointerEvents: 'none', textDecoration: 'line-through', background: '#ccc' } : {}}
                          onClick={() => !isBooked && handleInputChange('time', t.val)}
                        >
                          {t.label}<br /><small>{t.hint}</small>
                        </div>
                      );
                    })}
                  </div>
                  {errors.time && (
                    <p style={{ fontSize: '12px', color: 'var(--r)', marginTop: '4px' }}>Please pick an available time slot</p>
                  )}
                </div>

                <div className="field" style={{ marginTop: '12px' }}>
                  <label>Job details <span className="hint">(more detail = better match)</span></label>
                  <textarea 
                    id="b_details" 
                    placeholder="Describe the problem..."
                    value={formData.details}
                    onChange={(e) => handleInputChange('details', e.target.value)}
                  ></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={handleBack}>
                    <i className="ti ti-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2, padding: '12px' }} onClick={handleNext}>
                    Continue <i className="ti ti-arrow-right"></i>
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div id="bs3">
                <div className="f-section">Confirm Your Booking Request</div>
                <div className="summary-box" id="bSummaryBox">
                  <strong>Name:</strong> {formData.name}<br />
                  <strong>Mobile:</strong> {formData.mobile}<br />
                  <strong>Service:</strong> {selectedService === 'Other' ? formData.otherService : selectedService}<br />
                  <strong>Assigned:</strong> {pickedWorkerId === 'auto' ? 'Auto-Assign' : availableWorkers.find(w => w.id === pickedWorkerId)?.name || 'Auto-Assign'}<br />
                  <strong>Date:</strong> {formData.date}<br />
                  <strong>Time Slot:</strong> {formData.time}<br />
                  <strong>Location:</strong> {formData.addressFlat}, {formData.addressStreet}, Near {formData.addressLandmark}, {formData.addressArea} - {formData.addressPincode}
                </div>
                <div className="field">
                  <label>Payment Preference</label>
                  <select 
                    id="b_pay"
                    value={formData.payment}
                    onChange={(e) => handleInputChange('payment', e.target.value)}
                  >
                    <option>UPI / GPay / PhonePe</option>
                    <option>Cash</option>
                    <option>Any</option>
                  </select>
                </div>
                <div className="guarantee">
                  ✓ Verified worker assigned within 30 min<br />
                  ✓ Worker photo sent before arrival<br />
                  ✓ Price confirmed before work starts<br />
                  ✓ 3-day free repair guarantee included
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={handleBack}>
                    <i className="ti ti-arrow-left"></i> Back
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2, padding: '12px' }} 
                    onClick={submitBooking}
                    disabled={loading}
                    id="bBtn"
                  >
                    {loading ? (
                      <span className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block' }}></span>
                    ) : (
                      <><i className="ti ti-check"></i> Submit Service Request</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
