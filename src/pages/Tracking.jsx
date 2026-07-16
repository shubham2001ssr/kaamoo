import React, { useState } from 'react';
import { db, fbReady, collection, getDocs, query, where, doc, updateDoc } from '../firebase';
import { CONFIG } from '../data/config';

export default function Tracking() {
  const [refInput, setRefInput] = useState('');
  const [mobInput, setMobInput] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [assignedWorker, setAssignedWorker] = useState(null);

  const fetchWorkerDetails = async (workerId) => {
    if (!workerId || workerId === 'auto') return null;
    
    // Check in local storage first
    try {
      const localWorkers = JSON.parse(localStorage.getItem('km_workers') || '[]');
      const localW = localWorkers.find(w => w.id === workerId);
      if (localW) return localW;
    } catch (e) {
      console.warn('Error reading local workers:', e);
    }

    // Check Firebase
    if (fbReady && db) {
      try {
        const qSnap = await getDocs(query(collection(db, 'workers'), where('id', '==', workerId)));
        if (!qSnap.empty) {
          return qSnap.docs[0].data();
        }
      } catch (e) {
        console.warn('Error fetching worker from Firebase:', e);
      }
    }
    return null;
  };

  const handleTrack = async () => {
    if (!refInput.trim()) {
      setError('Please enter a booking reference (e.g. KMO-1001) ⚠️');
      return;
    }
    if (!/^\d{10}$/.test(mobInput.trim())) {
      setError('Please enter a valid 10-digit mobile number ⚠️');
      return;
    }

    setLoading(true);
    setError('');
    setBooking(null);
    setAssignedWorker(null);

    const ref = refInput.trim().toUpperCase();
    const mobile = mobInput.trim();

    let foundBooking = null;

    // Check local storage first
    try {
      const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      const match = localB.find(b => b.ref === ref && b.mobile === mobile);
      if (match) {
        foundBooking = match;
      }
    } catch (e) {
      console.warn('Error reading local bookings:', e);
    }

    // Check Firebase if not found or to keep in sync
    if (fbReady && db) {
      try {
        const qSnap = await getDocs(query(
          collection(db, 'bookings'), 
          where('ref', '==', ref), 
          where('mobile', '==', mobile)
        ));
        if (!qSnap.empty) {
          const docData = qSnap.docs[0].data();
          foundBooking = { docId: qSnap.docs[0].id, ...docData };
        }
      } catch (e) {
        console.error('Firebase tracking query error:', e);
      }
    }

    if (foundBooking) {
      setBooking(foundBooking);
      if (foundBooking.workerId && foundBooking.workerId !== 'auto') {
        const wDetails = await fetchWorkerDetails(foundBooking.workerId);
        setAssignedWorker(wDetails);
      }
    } else {
      setError('No matching booking found. Please check your Reference and Mobile Number. ❌');
    }
    setLoading(false);
  };

  const simulatePayment = async () => {
    if (!booking) return;
    setPayLoading(true);

    const updatedBooking = {
      ...booking,
      status: 'Confirmed',
      paymentStatus: 'Paid'
    };

    let updatedInFirebase = false;

    // Update in Firebase
    if (fbReady && db && booking.docId) {
      try {
        const bDocRef = doc(db, 'bookings', booking.docId);
        await updateDoc(bDocRef, {
          status: 'Confirmed',
          paymentStatus: 'Paid'
        });
        updatedInFirebase = true;
      } catch (e) {
        console.error('Firebase status update failed:', e);
      }
    }

    // Always update in LocalStorage for sync
    try {
      const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      const idx = localB.findIndex(b => b.ref === booking.ref);
      if (idx !== -1) {
        localB[idx].status = 'Confirmed';
        localB[idx].paymentStatus = 'Paid';
        localStorage.setItem('km_bookings', JSON.stringify(localB));
      }
    } catch (e) {
      console.error('Local storage update failed:', e);
    }

    setBooking(updatedBooking);
    setPayLoading(false);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText('kaamoowebsite@okaxis');
    alert('UPI ID copied to clipboard! ✅');
  };

  const downloadInvoice = () => {
    if (!booking) return;
    const w = assignedWorker || { name: 'Auto-Assigned Partner', skill: booking.service, rate: 'Fixed rate' };
    
    // Compile structured address text
    let fullAddr = booking.address;
    if (booking.addressFlat) {
      fullAddr = `${booking.addressFlat}, ${booking.addressStreet}, Near ${booking.addressLandmark}, ${booking.addressArea} - ${booking.addressPincode}`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice - ${booking.ref}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#18181A;background:#fff;max-width:700px;margin:0 auto}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start}
      .logo{font-size:26px;font-weight:800;color:#1D9E75}
      .logo b{color:#F5A623}
      .inv-info{text-align:right;font-size:13px;color:#6B6968;line-height:1.5}
      .inv-title{font-size:22px;font-weight:800;color:#085041;margin-top:12px}
      hr{border:none;border-top:1.5px solid #E2DED8;margin:24px 0}
      .sec-title{font-size:14px;font-weight:700;color:#085041;text-transform:uppercase;margin-bottom:12px;letter-spacing:0.5px}
      .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;font-size:13px;line-height:1.6}
      .details-grid div strong{color:#18181A}
      .details-grid div span{color:#6B6968;display:block}
      table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
      th{background:#E1F5EE;color:#085041;padding:10px 14px;text-align:left;font-weight:700}
      td{padding:12px 14px;border-bottom:1px solid #E2DED8}
      .total-row td{font-weight:700;border-top:2px solid #085041;border-bottom:none;font-size:15px;color:#085041}
      .footer{margin-top:48px;text-align:center;font-size:11px;color:#6B6968;border-top:1px solid #E2DED8;padding-top:14px}
      @media print{body{padding:0} .print-btn{display:none}}
      .print-btn{background:#1D9E75;color:#fff;border:none;padding:10px 20px;font-size:14px;font-weight:600;border-radius:6px;cursor:pointer;margin-bottom:20px}
    </style></head><body>
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save to PDF</button>
    <div class="hdr">
      <div>
        <div class="logo">Kaam<b>oo</b></div>
        <div style="font-size:12px;color:#6B6968;margin-top:4px">Doorstep Services in Deoghar</div>
      </div>
      <div class="inv-info">
        <div class="inv-title">TAX INVOICE</div>
        <strong>Booking Ref:</strong> ${booking.ref}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}<br>
        <strong>Payment Status:</strong> ${booking.paymentStatus || 'Paid'}<br>
      </div>
    </div>
    <hr>
    <div class="details-grid">
      <div>
        <div class="sec-title">Customer Details</div>
        <strong>${booking.name}</strong>
        <span>Mobile: ${booking.mobile}</span>
        <span>Address: ${fullAddr}</span>
      </div>
      <div>
        <div class="sec-title">Assigned Partner</div>
        <strong>${w.name}</strong>
        <span>Service: ${booking.service}</span>
        <span>Availability Hours: ${w.hours || '7 AM – 9 PM'}</span>
      </div>
    </div>
    <hr>
    <div class="sec-title">Service Details</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Date & Time</th>
          <th style="text-align:right">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${booking.service} Service</strong><br>
            <span style="font-size:11px;color:#6B6968">${booking.details || 'General maintenance check'}</span>
          </td>
          <td>${booking.reqDate} (${booking.time})</td>
          <td style="text-align:right">₹${booking.totalCost || 350}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total Paid Amount</td>
          <td style="text-align:right">₹${booking.totalCost || 350}</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:20px;font-size:12px;color:#6B6968;background:#F8F6F1;padding:12px;border-radius:8px">
      ✓ This invoice includes <strong>3-Day Free Repair Guarantee</strong>. If the exact same issue returns within 3 days, Kaamoo will fix it free.
    </div>
    <div class="footer">
      Kaamoo — Ek Call, Har Kaam | Deoghar, Jharkhand, India | kaamoowebsite@gmail.com
    </div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Pending':
        return 'We have received your service request and will confirm a worker within 30 minutes.';
      case 'Awaiting Payment':
        return 'Your booking request is approved! Please pay the service cost to confirm your doorstep booking.';
      case 'Confirmed':
        return 'Payment confirmed! Your worker has been assigned and will arrive at the scheduled time.';
      case 'Completed':
        return 'Service completed! Thank you for choosing Kaamoo.';
      case 'Cancelled':
        return 'This booking was cancelled.';
      default:
        return 'Loading status...';
    }
  };

  const getStepClass = (stepName) => {
    if (!booking) return '';
    const status = booking.status;
    const stages = ['Pending', 'Awaiting Payment', 'Confirmed', 'Completed'];
    const currentIdx = stages.indexOf(status);
    const targetIdx = stages.indexOf(stepName);

    if (status === 'Cancelled') return '';
    if (currentIdx >= targetIdx) return 'done';
    if (status === 'Pending' && stepName === 'Pending') return 'curr';
    if (status === 'Awaiting Payment' && stepName === 'Awaiting Payment') return 'curr';
    return '';
  };

  return (
    <div className="page active" id="page-tracking">
      <div className="form-page">
        <div className="form-wrap">
          <div className="form-hdr reveal visible">
            <div className="s-tag">Tracking</div>
            <h2>Track Booking</h2>
            <p>Enter your details to check booking status, pay, and download receipts.</p>
          </div>

          <div className="form-card reveal visible" style={{ marginBottom: '24px' }}>
            <div className="g2">
              <div className="field">
                <label>Booking Reference</label>
                <input 
                  placeholder="e.g. KMO-1001" 
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Mobile Number</label>
                <input 
                  type="tel" 
                  maxLength="10" 
                  placeholder="10 digit number" 
                  value={mobInput}
                  onChange={(e) => setMobInput(e.target.value)}
                />
              </div>
            </div>
            {error && <p style={{ color: 'var(--r)', fontSize: '13px', marginBottom: '14px' }}>{error}</p>}
            <button 
              className="btn btn-primary btn-full" 
              onClick={handleTrack}
              disabled={loading}
            >
              {loading ? (
                <span className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block' }}></span>
              ) : (
                <><i className="ti ti-radar"></i> Track Booking Status</>
              )}
            </button>
          </div>

          {booking && (
            <div className="form-card reveal visible" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Ref: {booking.ref}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Service: {booking.service}</p>
                </div>
                <div>
                  <span 
                    className="badge" 
                    style={{ 
                      background: booking.status === 'Confirmed' ? 'var(--gl)' : booking.status === 'Completed' ? 'var(--gl)' : 'var(--al)',
                      color: booking.status === 'Confirmed' ? 'var(--gd)' : booking.status === 'Completed' ? 'var(--gd)' : 'var(--ad)',
                      fontSize: '12px'
                    }}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              {booking.status !== 'Cancelled' ? (
                <div className="step-dots" style={{ marginBottom: '24px' }}>
                  <div className={`dot ${getStepClass('Pending')}`} title="Request Sent"></div>
                  <div className={`dot ${getStepClass('Awaiting Payment')}`} title="Approved & Ready"></div>
                  <div className={`dot ${getStepClass('Confirmed')}`} title="Confirmed"></div>
                  <div className={`dot ${getStepClass('Completed')}`} title="Completed"></div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'var(--rl)', color: 'var(--r)', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 600 }}>
                  ⚠️ This booking has been cancelled.
                </div>
              )}

              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px', background: 'var(--bg)', padding: '12px', borderRadius: '8px' }}>
                <strong>Status Update:</strong> {getStatusText(booking.status)}
              </p>

              {booking.status === 'Awaiting Payment' && (
                <div style={{ padding: '20px', border: '1.5px solid var(--a)', background: '#FFFBF0', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--ad)', fontSize: '15px', fontWeight: 800, marginBottom: '6px' }}>💳 Secure Payment Gateway (UPI)</h4>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
                    Pay the approved service cost of <strong>₹{booking.totalCost || 350}</strong> to finalize worker assignment.
                  </p>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', border: '1px solid var(--border)', marginBottom: '10px' }}>
                      {/* Visual SVG QR Code Mock */}
                      <svg width="140" height="140" viewBox="0 0 29 29" style={{ display: 'block', margin: '0 auto', shapeRendering: 'crispEdges' }}>
                        <rect width="29" height="29" fill="white"/>
                        <path d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0zm2 2h3v3H2zm20-22h3v3h-3zM2 2h3v3H2zm5 5h1v1H7zm6 0h1v1h-1zm2 0h1v1h-1zM2 13h1v1H2zm3 0h1v1H5zm6 0h2v1h-2zm4 0h1v1h-1zm6 0h1v1h-1zm4 0h1v1h-1zm-6 2h1v1h-1zm4 0h1v1h-1zM9 17h1v1H9zm4 0h1v1h-1zm5 0h1v1h-1zm5 0h1v1h-1zm3 0h1v1h-1zm-9 2h1v1h-1zm6 0h1v1h-1zM0 9h1v1H0zm4 0h1v1H4zm6 0h1v1h-1zm4 0h2v1h-2zm6 0h1v1h-1zm5 0h1v1h-1zm-9 2h1v1h-1zm4 0h1v1h-1zm6 0h1v1h-1zM9 15h1v1H9zm15 0h1v1h-1zm-9 2h1v1h-1zm6 0h1v1h-1z" fill="#085041"/>
                      </svg>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '6px' }}>Scan with GPay, PhonePe or Paytm</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <code style={{ background: 'var(--bg)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>kaamoowebsite@okaxis</code>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }} onClick={copyUpi}>Copy UPI ID</button>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-full" 
                    onClick={simulatePayment}
                    disabled={payLoading}
                  >
                    {payLoading ? (
                      <span className="loader-ring" style={{ width: '18px', height: '18px', borderWidth: '2px', display: 'inline-block' }}></span>
                    ) : (
                      'Confirm Payment (UPI Verified)'
                    )}
                  </button>
                </div>
              )}

              <div className="summary-box" style={{ textAlign: 'left', fontSize: '13px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gd)', marginBottom: '8px' }}>Job Details</h4>
                <strong>Customer:</strong> {booking.name} (+{booking.mobile})<br />
                <strong>Service:</strong> {booking.service} {booking.details ? `(${booking.details})` : ''}<br />
                <strong>Date & Time:</strong> {booking.reqDate} ({booking.time})<br />
                <strong>Address:</strong> {booking.addressFlat ? `${booking.addressFlat}, ${booking.addressStreet}, Near ${booking.addressLandmark}, ${booking.addressArea} - ${booking.addressPincode}` : booking.address}<br />
                <strong>Total Price:</strong> ₹{booking.totalCost || 'Awaiting approval'}
              </div>

              {assignedWorker && (
                <div style={{ display: 'flex', gap: '14px', background: 'var(--gl)', border: '1px solid rgba(29,158,117,0.2)', padding: '16px', borderRadius: '12px', marginTop: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '32px' }}>👷</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gd)' }}>Assigned Professional: {assignedWorker.name}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                      Skill: {assignedWorker.skill} | Rating: ★{assignedWorker.rating || '4.8'} ({assignedWorker.experience || '3'} yrs exp)
                    </p>
                    <a href={`tel:+91${assignedWorker.mobile}`} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px', marginTop: '6px', borderRadius: '6px' }}>
                      📞 Call Worker
                    </a>
                  </div>
                </div>
              )}

              {(booking.status === 'Confirmed' || booking.status === 'Completed') && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={downloadInvoice}>
                    📄 Download Tax Invoice (PDF)
                  </button>
                  <button 
                    className="btn btn-wa" 
                    onClick={() => {
                      const msg = `🙏 Namaste! Mera Kaamoo Booking (Ref: *${booking.ref}*) confirm ho gaya hai. Pls check.`;
                      window.open(`https://wa.me/${CONFIG.KAAMOO_WA}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                  >
                    💬 WhatsApp Support
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
