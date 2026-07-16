import React, { useState, useEffect } from 'react';
import { CONFIG } from '../data/config';
import { db, fbReady, collection, getDocs, query, orderBy, doc, updateDoc, addDoc, deleteDoc } from '../firebase';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  
  const [bookings, setBookings] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [messages, setMessages] = useState([]);
  
  const [searchBookings, setSearchBookings] = useState('');
  const [searchWorkers, setSearchWorkers] = useState('');
  
  const [firebaseConnected, setFirebaseConnected] = useState(false);

  // Worker CRUD Form State
  const [workerMode, setWorkerMode] = useState('list'); // 'list', 'add', 'edit'
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    mobile: '',
    skill: '',
    rate: '',
    experience: '3',
    rating: '4.8',
    area: 'Deoghar',
    hours: 'Full day flexible',
    status: 'Active',
    aadhar: '',
    upi: ''
  });

  // Booking Approval Dialog State
  const [approvingBooking, setApprovingBooking] = useState(null);
  const [assignPrice, setAssignPrice] = useState(350);
  const [assignWorkerId, setAssignWorkerId] = useState('auto');

  const loadLocalData = () => {
    try {
      const b = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      const w = JSON.parse(localStorage.getItem('km_workers') || '[]');
      const m = JSON.parse(localStorage.getItem('km_messages') || '[]');
      setBookings(b.reverse());
      setWorkers(w.reverse());
      setMessages(m.reverse());
    } catch (e) {
      console.error('Error loading local storage data:', e);
    }
  };

  const loadFirebaseData = async () => {
    if (fbReady && db) {
      try {
        const [bs, ws, ms] = await Promise.all([
          getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'workers'), orderBy('joinDate', 'desc'))),
          getDocs(query(collection(db, 'contacts'), orderBy('createdAt', 'desc')))
        ]);

        const fbB = bs.docs.map(d => ({ docId: d.id, ...d.data() }));
        const fbW = ws.docs.map(d => ({ docId: d.id, ...d.data() }));
        const fbM = ms.docs.map(d => ({ docId: d.id, ...d.data() }));

        // Merge with local storage uniquely
        const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
        const localW = JSON.parse(localStorage.getItem('km_workers') || '[]');
        const localM = JSON.parse(localStorage.getItem('km_messages') || '[]');

        // Filter out items from local storage that are already in firebase
        const uniqueLocalB = localB.filter(lb => !fbB.some(fb => fb.ref === lb.ref));
        const uniqueLocalW = localW.filter(lw => !fbW.some(fw => fw.id === lw.id));

        setBookings([...fbB, ...uniqueLocalB]);
        setWorkers([...fbW, ...uniqueLocalW]);
        setMessages([...fbM, ...localM]);
        setFirebaseConnected(true);
      } catch (e) {
        console.warn('Firebase query failed, using local storage fallback:', e);
        loadLocalData();
        setFirebaseConnected(false);
      }
    } else {
      loadLocalData();
      setFirebaseConnected(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadFirebaseData();
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (password === CONFIG.ADMIN_PWD) {
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Wrong password ❌');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
  };

  // --- BOOKING STATE OPERATIONS ---
  const handleOpenApprove = (booking) => {
    setApprovingBooking(booking);
    setAssignPrice(booking.totalCost || 350);
    setAssignWorkerId('auto');
  };

  const handleConfirmApprove = async () => {
    if (!approvingBooking) return;
    
    const updatedStatus = {
      status: 'Awaiting Payment',
      totalCost: parseInt(assignPrice) || 350,
      workerId: assignWorkerId
    };

    let updatedInFirebase = false;

    if (fbReady && db && approvingBooking.docId) {
      try {
        const docRef = doc(db, 'bookings', approvingBooking.docId);
        await updateDoc(docRef, updatedStatus);
        updatedInFirebase = true;
      } catch (e) {
        console.error('Firebase update failed:', e);
      }
    }

    // Always update locally
    try {
      const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      const idx = localB.findIndex(b => b.ref === approvingBooking.ref);
      if (idx !== -1) {
        localB[idx] = { ...localB[idx], ...updatedStatus };
        localStorage.setItem('km_bookings', JSON.stringify(localB));
      }
    } catch (e) {
      console.error('Local update failed:', e);
    }

    setApprovingBooking(null);
    loadFirebaseData();
  };

  const handleUpdateBookingStatus = async (booking, newStatus, payStatus = 'Unpaid') => {
    const fieldsToUpdate = {
      status: newStatus,
      paymentStatus: payStatus
    };

    if (fbReady && db && booking.docId) {
      try {
        const docRef = doc(db, 'bookings', booking.docId);
        await updateDoc(docRef, fieldsToUpdate);
      } catch (e) {
        console.error('Firebase update failed:', e);
      }
    }

    try {
      const localB = JSON.parse(localStorage.getItem('km_bookings') || '[]');
      const idx = localB.findIndex(b => b.ref === booking.ref);
      if (idx !== -1) {
        localB[idx] = { ...localB[idx], ...fieldsToUpdate };
        localStorage.setItem('km_bookings', JSON.stringify(localB));
      }
    } catch (e) {
      console.error('Local update failed:', e);
    }

    loadFirebaseData();
  };

  // --- WORKER CRUD OPERATIONS ---
  const handleOpenAddWorker = () => {
    setWorkerForm({
      name: '',
      mobile: '',
      skill: 'Plumber',
      rate: '300',
      experience: '3',
      rating: '4.8',
      area: 'Deoghar',
      hours: 'Full day flexible',
      status: 'Active',
      aadhar: '',
      upi: ''
    });
    setWorkerMode('add');
  };

  const handleOpenEditWorker = (worker) => {
    setSelectedWorker(worker);
    setWorkerForm({
      name: worker.name || '',
      mobile: worker.mobile || '',
      skill: worker.skill || '',
      rate: worker.rate || '',
      experience: worker.experience || '3',
      rating: worker.rating || '4.8',
      area: worker.area || 'Deoghar',
      hours: worker.hours || 'Full day flexible',
      status: worker.status || 'Active',
      aadhar: worker.aadhar || '',
      upi: worker.upi || ''
    });
    setWorkerMode('edit');
  };

  const handleSaveWorker = async () => {
    if (!workerForm.name.trim() || !workerForm.mobile.trim() || !workerForm.rate) {
      alert('Please fill out Name, Mobile and Rate ⚠️');
      return;
    }

    const count = workers.length;
    const workerId = selectedWorker ? selectedWorker.id : `DSW-${100 + count + 1}`;

    const workerData = {
      id: workerId,
      name: workerForm.name,
      mobile: workerForm.mobile,
      skill: workerForm.skill,
      rate: workerForm.rate,
      experience: workerForm.experience,
      rating: workerForm.rating,
      area: workerForm.area,
      hours: workerForm.hours,
      status: workerForm.status,
      aadhar: workerForm.aadhar,
      upi: workerForm.upi,
      joinDate: selectedWorker ? (selectedWorker.joinDate || new Date().toISOString()) : new Date().toISOString()
    };

    let saved = false;

    if (fbReady && db) {
      try {
        if (selectedWorker && selectedWorker.docId) {
          const docRef = doc(db, 'workers', selectedWorker.docId);
          await updateDoc(docRef, workerData);
        } else {
          await addDoc(collection(db, 'workers'), workerData);
        }
        saved = true;
      } catch (e) {
        console.error('Firebase save failed:', e);
      }
    }

    // Always mirror to local storage
    try {
      const localW = JSON.parse(localStorage.getItem('km_workers') || '[]');
      if (selectedWorker) {
        const idx = localW.findIndex(w => w.id === selectedWorker.id);
        if (idx !== -1) {
          localW[idx] = workerData;
        }
      } else {
        localW.push(workerData);
      }
      localStorage.setItem('km_workers', JSON.stringify(localW));
    } catch (e) {
      console.error('Local storage save failed:', e);
    }

    setWorkerMode('list');
    setSelectedWorker(null);
    loadFirebaseData();
  };

  const handleDeleteWorker = async (worker) => {
    if (!window.confirm(`Are you sure you want to delete worker ${worker.name}?`)) return;

    if (fbReady && db && worker.docId) {
      try {
        const docRef = doc(db, 'workers', worker.docId);
        await deleteDoc(docRef);
      } catch (e) {
        console.error('Firebase delete failed:', e);
      }
    }

    try {
      const localW = JSON.parse(localStorage.getItem('km_workers') || '[]');
      const filtered = localW.filter(w => w.id !== worker.id);
      localStorage.setItem('km_workers', JSON.stringify(filtered));
    } catch (e) {
      console.error('Local delete failed:', e);
    }

    loadFirebaseData();
  };

  const handleApproveApplicant = async (worker) => {
    const updatedStatus = { status: 'Active' };
    
    if (fbReady && db && worker.docId) {
      try {
        const docRef = doc(db, 'workers', worker.docId);
        await updateDoc(docRef, updatedStatus);
      } catch (e) {
        console.error('Firebase approve failed:', e);
      }
    }

    try {
      const localW = JSON.parse(localStorage.getItem('km_workers') || '[]');
      const idx = localW.findIndex(w => w.id === worker.id);
      if (idx !== -1) {
        localW[idx].status = 'Active';
        localStorage.setItem('km_workers', JSON.stringify(localW));
      }
    } catch (e) {
      console.error('Local approve failed:', e);
    }

    loadFirebaseData();
  };

  const getKPIs = () => {
    const totalBookings = bookings.length;
    const activeWorkers = workers.filter(w => w.status === 'Active').length;
    const pendingJobs = bookings.filter(b => b.status === 'Pending').length;
    
    // Revenue from Confirmed/Completed bookings
    const validBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed');
    const revenue = validBookings.reduce((acc, b) => acc + (b.totalCost || 350), 0);
    const commission = Math.round(revenue * 0.15);
    const messageCount = messages.length;

    return { totalBookings, activeWorkers, pendingJobs, revenue, commission, messageCount };
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr || '—';
    }
  };

  const filteredBookings = bookings.filter(b => 
    Object.values(b).some(val => String(val).toLowerCase().includes(searchBookings.toLowerCase()))
  );

  const filteredWorkers = workers.filter(w => 
    Object.values(w).some(val => String(val).toLowerCase().includes(searchWorkers.toLowerCase()))
  );

  const kpis = getKPIs();

  if (!isLoggedIn) {
    return (
      <div className="page active" id="page-admin">
        <div className="admin-page">
          <div className="admin-inner">
            <div id="adminLogin" className="login-card">
              <div className="form-card">
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px', textAlign: 'center' }}>Admin Login</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', textAlign: 'center', marginBottom: '20px' }}>Kaamoo Business Dashboard</p>
                <div className="field">
                  <label>Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  {error && <p style={{ color: 'var(--r)', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
                </div>
                <button className="btn btn-primary btn-full" style={{ padding: '13px', marginTop: '4px' }} onClick={handleLogin}>
                  Login to Dashboard
                </button>
                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
                  Use the password specified in config.js
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="page-admin">
      <div className="admin-page">
        <div className="admin-inner">
          <div id="adminDash">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Kaamoo Dashboard</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div 
                  id="fbStatus" 
                  style={{ 
                    fontSize: '12px', 
                    padding: '4px 12px', 
                    borderRadius: '20px', 
                    background: firebaseConnected ? 'var(--gl)' : 'var(--al)', 
                    color: firebaseConnected ? 'var(--gd)' : 'var(--ad)' 
                  }}
                >
                  {firebaseConnected ? '🔥 Firebase connected' : '⚡ Local mode'}
                </div>
                <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={loadFirebaseData}>
                  <i className="ti ti-refresh"></i> Refresh
                </button>
                <button className="btn" style={{ padding: '8px 16px', fontSize: '13px', background: 'var(--r)', color: '#fff' }} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">Total Bookings</div>
                <div className="kpi-val green">{kpis.totalBookings}</div>
                <div className="kpi-note">All time</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Active Workers</div>
                <div className="kpi-val green">{kpis.activeWorkers}</div>
                <div className="kpi-note">Registered</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Pending Jobs</div>
                <div className="kpi-val amber">{kpis.pendingJobs}</div>
                <div className="kpi-note">Need assignment</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Est. Revenue ₹</div>
                <div className="kpi-val green">₹{kpis.revenue.toLocaleString('en-IN')}</div>
                <div className="kpi-note">Awaiting + Confirmed</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Your Commission ₹</div>
                <div className="kpi-val green">₹{kpis.commission.toLocaleString('en-IN')}</div>
                <div className="kpi-note">15% of revenue</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Messages</div>
                <div className="kpi-val">{kpis.messageCount}</div>
                <div className="kpi-note">Contact inquiries</div>
              </div>
            </div>

            <div className="admin-tabs">
              <div className={`a-tab ${activeTab === 'bookings' ? 'on' : ''}`} onClick={() => setActiveTab('bookings')}>📋 Bookings</div>
              <div className={`a-tab ${activeTab === 'workers' ? 'on' : ''}`} onClick={() => setActiveTab('workers')}>👷 Workers</div>
              <div className={`a-tab ${activeTab === 'messages' ? 'on' : ''}`} onClick={() => setActiveTab('messages')}>📞 Messages</div>
              <div className={`a-tab ${activeTab === 'setup' ? 'on' : ''}`} onClick={() => setActiveTab('setup')}>⚙️ Firebase Setup</div>
            </div>

            {/* --- BOOKINGS MANAGER TAB --- */}
            {activeTab === 'bookings' && (
              <div className="a-content on">
                {approvingBooking && (
                  <div style={{ background: 'var(--white)', padding: '20px', borderRadius: '12px', border: '2.5px solid var(--g)', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gd)', marginBottom: '12px' }}>Approve Booking & Request Payment</h3>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px' }}>
                      Customer: {approvingBooking.name} | Service: {approvingBooking.service}
                    </p>
                    <div className="g2">
                      <div className="field">
                        <label>Approved Price (₹)</label>
                        <input 
                          type="number" 
                          value={assignPrice} 
                          onChange={(e) => setAssignPrice(e.target.value)} 
                        />
                      </div>
                      <div className="field">
                        <label>Assign Worker</label>
                        <select 
                          value={assignWorkerId} 
                          onChange={(e) => setAssignWorkerId(e.target.value)}
                        >
                          <option value="auto">Auto-Assign (Admin matching)</option>
                          {workers
                            .filter(w => w.status === 'Active' && w.skill === approvingBooking.service)
                            .map(w => (
                              <option key={w.id} value={w.id}>{w.name} ({w.experience} Yrs Exp)</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => setApprovingBooking(null)}>Cancel</button>
                      <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={handleConfirmApprove}>Confirm & Request Payment</button>
                    </div>
                  </div>
                )}

                <input 
                  className="search" 
                  placeholder="🔍 Search bookings..." 
                  value={searchBookings}
                  onChange={(e) => setSearchBookings(e.target.value)}
                />
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Date & Time</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((b, idx) => (
                          <tr key={idx}>
                            <td><strong>{b.ref || '—'}</strong></td>
                            <td>{b.reqDate}<br /><small>{b.time}</small></td>
                            <td>{b.name}<br /><small>{b.mobile}</small></td>
                            <td>{b.service}</td>
                            <td>{b.addressFlat ? `${b.addressFlat}, Near ${b.addressLandmark}` : b.address}</td>
                            <td>₹{b.totalCost || '—'}</td>
                            <td>
                              <span 
                                className={`badge ${
                                  b.status === 'Completed' ? 'badge-green' : 
                                  b.status === 'Confirmed' ? 'badge-green' : 
                                  b.status === 'Awaiting Payment' ? 'badge-amber' : 
                                  b.status === 'Cancelled' ? 'badge-red' : 'badge-amber'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {b.status === 'Pending' && (
                                  <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleOpenApprove(b)}>Approve</button>
                                )}
                                {b.status === 'Awaiting Payment' && (
                                  <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', background: 'var(--a)' }} onClick={() => handleUpdateBookingStatus(b, 'Confirmed', 'Paid')}>Confirm Pay</button>
                                )}
                                {b.status === 'Confirmed' && (
                                  <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', background: 'var(--gd)' }} onClick={() => handleUpdateBookingStatus(b, 'Completed', b.paymentStatus)}>Complete</button>
                                )}
                                {b.status !== 'Completed' && b.status !== 'Cancelled' && (
                                  <button className="btn" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', background: 'var(--r)', color: '#fff' }} onClick={() => handleUpdateBookingStatus(b, 'Cancelled', b.paymentStatus)}>Cancel</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8"><div className="empty-state">No bookings found.</div></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- WORKERS MANAGER TAB --- */}
            {activeTab === 'workers' && (
              <div className="a-content on">
                {workerMode !== 'list' ? (
                  <div className="form-card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
                      {workerMode === 'add' ? 'Add New Worker' : 'Edit Worker details'}
                    </h3>
                    <div className="g2">
                      <div className="field">
                        <label>Worker Name</label>
                        <input 
                          placeholder="Name" 
                          value={workerForm.name} 
                          onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} 
                        />
                      </div>
                      <div className="field">
                        <label>Mobile Number</label>
                        <input 
                          placeholder="10 digit number" 
                          maxLength="10"
                          value={workerForm.mobile} 
                          onChange={(e) => setWorkerForm({ ...workerForm, mobile: e.target.value.replace(/\D/g, '') })} 
                        />
                      </div>
                    </div>
                    
                    <div className="g3">
                      <div className="field">
                        <label>Main Skill</label>
                        <select 
                          value={workerForm.skill} 
                          onChange={(e) => setWorkerForm({ ...workerForm, skill: e.target.value })} 
                        >
                          <option>Plumber</option>
                          <option>Electrician</option>
                          <option>Cook</option>
                          <option>Maid / Cleaner</option>
                          <option>Driver</option>
                          <option>Painter</option>
                          <option>Carpenter</option>
                          <option>Beautician</option>
                          <option>Photographer</option>
                          <option>AC / Fridge Repair</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Rate (Starting ₹)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 300"
                          value={workerForm.rate} 
                          onChange={(e) => setWorkerForm({ ...workerForm, rate: e.target.value })} 
                        />
                      </div>
                      <div className="field">
                        <label>Experience (Yrs)</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 5"
                          value={workerForm.experience} 
                          onChange={(e) => setWorkerForm({ ...workerForm, experience: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div className="g3">
                      <div className="field">
                        <label>Rating</label>
                        <input 
                          placeholder="e.g. 4.8"
                          value={workerForm.rating} 
                          onChange={(e) => setWorkerForm({ ...workerForm, rating: e.target.value })} 
                        />
                      </div>
                      <div className="field">
                        <label>Area Can Serve</label>
                        <input 
                          placeholder="e.g. Deoghar"
                          value={workerForm.area} 
                          onChange={(e) => setWorkerForm({ ...workerForm, area: e.target.value })} 
                        />
                      </div>
                      <div className="field">
                        <label>Status</label>
                        <select 
                          value={workerForm.status} 
                          onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })} 
                        >
                          <option>Active</option>
                          <option>Applicant</option>
                          <option>Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="g2">
                      <div className="field">
                        <label>Aadhar Number (Optional)</label>
                        <input 
                          placeholder="XXXX XXXX XXXX" 
                          maxLength="14"
                          value={workerForm.aadhar} 
                          onChange={(e) => setWorkerForm({ ...workerForm, aadhar: e.target.value })} 
                        />
                      </div>
                      <div className="field">
                        <label>UPI ID / Account (Optional)</label>
                        <input 
                          placeholder="UPI ID"
                          value={workerForm.upi} 
                          onChange={(e) => setWorkerForm({ ...workerForm, upi: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <button className="btn btn-outline" style={{ padding: '8px 16px' }} onClick={() => setWorkerMode('list')}>Back to List</button>
                      <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={handleSaveWorker}>Save Worker</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <input 
                        className="search" 
                        placeholder="🔍 Search workers..." 
                        value={searchWorkers}
                        onChange={(e) => setSearchWorkers(e.target.value)}
                        style={{ marginBottom: 0 }}
                      />
                      <button className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }} onClick={handleOpenAddWorker}>
                        ➕ Add New Worker
                      </button>
                    </div>
                    <div className="tbl-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Worker ID</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Skill</th>
                            <th>Area</th>
                            <th>Rate</th>
                            <th>Experience</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWorkers.length > 0 ? (
                            filteredWorkers.map((w, idx) => (
                              <tr key={idx}>
                                <td><strong>{w.id || '—'}</strong></td>
                                <td>{w.name}</td>
                                <td>{w.mobile}</td>
                                <td>{w.skill}</td>
                                <td>{w.area}</td>
                                <td>₹{w.rate}+</td>
                                <td>{w.experience || '—'} Yrs</td>
                                <td>
                                  <span 
                                    className={`badge ${
                                      w.status === 'Active' ? 'badge-green' : 
                                      w.status === 'Applicant' ? 'badge-amber' : 'badge-red'
                                    }`}
                                  >
                                    {w.status}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    {w.status === 'Applicant' && (
                                      <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleApproveApplicant(w)}>Approve</button>
                                    )}
                                    <button className="btn btn-outline" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleOpenEditWorker(w)}>Edit</button>
                                    <button className="btn" style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', background: 'var(--r)', color: '#fff' }} onClick={() => handleDeleteWorker(w)}>Delete</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9"><div className="empty-state">No workers found.</div></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* --- INBOUND MESSAGES TAB --- */}
            {activeTab === 'messages' && (
              <div className="a-content on">
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Subject</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.length > 0 ? (
                        messages.map((m, idx) => (
                          <tr key={idx}>
                            <td>{formatDate(m.createdAt)}</td>
                            <td>{m.name}</td>
                            <td>{m.mobile}</td>
                            <td>{m.subject}</td>
                            <td>{(m.message || '').substring(0, 100)}...</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5"><div className="empty-state">No messages found.</div></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- FIREBASE SETUP TAB --- */}
            {activeTab === 'setup' && (
              <div className="a-content on">
                <div className="form-card">
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>🔥 Firebase Setup Guide</h3>
                  <div style={{ fontSize: '14px', lineHeight: 2, color: 'var(--muted)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>Follow these steps to connect your website to Firebase (free forever up to 50k reads/day):</p>
                    <p><strong>Step 1</strong> — Go to <strong>console.firebase.google.com</strong></p>
                    <p><strong>Step 2</strong> — Click "Add project" → Name it "kaamoo"</p>
                    <p><strong>Step 3</strong> — Click the Web icon (&lt;/&gt;) → Register app as "kaamoo-web"</p>
                    <p><strong>Step 4</strong> — Copy the firebaseConfig object shown</p>
                    <p><strong>Step 5</strong> — In your React project, paste your configuration in `src/firebase.js` inside the config file.</p>
                    <p><strong>Step 6</strong> — In Firebase → Firestore Database → Create database → Start in test mode</p>
                    <p><strong>Step 7</strong> — Done! All bookings, workers, messages now save to Firebase cloud ✅</p>
                  </div>
                  <div style={{ background: 'var(--gl)', borderRadius: '10px', padding: '14px', marginTop: '16px', fontSize: '13px', color: 'var(--gd)' }}>
                    ✓ Free tier: 50,000 reads + 20,000 writes per day<br />
                    ✓ Auto-scales to lakhs of users<br />
                    ✓ Real-time updates — admin sees data instantly<br />
                    ✓ No server needed — runs from browser
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
