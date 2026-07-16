import React, { useState } from 'react';
import { CATS, SVCS } from '../data/servicesData';

export default function Services({ onSelectService }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase().trim());
  };

  // Filter categories and services based on search query
  const filteredCategories = CATS.map((c) => {
    const catSvcs = SVCS.filter((s) => s.c === c.id && s.n.toLowerCase().includes(searchQuery));
    return { ...c, services: catSvcs };
  }).filter((c) => c.services.length > 0);

  // Filter Other category
  const otherServices = SVCS.filter((s) => s.c === 'Other' && s.n.toLowerCase().includes(searchQuery));

  return (
    <div className="page active" id="page-services">
      <section className="section">
        <div className="si">
          <div className="s-hdr reveal visible">
            <div className="s-tag">Our Catalog</div>
            <h2 class="s-title">Find the Service You Need</h2>
            <p className="s-sub">Search our catalog of verified services with fixed transparent pricing in Deoghar.</p>
          </div>
          
          {/* Search Input */}
          <div className="services-search-wrap reveal visible">
            <div className="search-bar-wrap">
              <i className="ti ti-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search service (e.g. plumber, driver, DJ)..." 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="categorized-services reveal visible" id="categorizedServices">
            {filteredCategories.map((c) => (
              <div key={c.id} className="cat-section" id={`cat-sec-${c.id}`}>
                <div className="cat-section-hdr">
                  <span style={{ background: c.g, color: c.t, width: '40px', height: '40px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.e}
                  </span>
                  &nbsp;{c.n}
                </div>
                <div className="svc-grid">
                  {c.services.map((s) => (
                    <div key={s.n} className="svc-card" onClick={() => onSelectService(s.n)}>
                      <div className="se">{s.e}</div>
                      <div className="sn">{s.n}</div>
                      <div className="sr">{s.r}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {otherServices.length > 0 && (
              <div className="cat-section" id="cat-sec-Other">
                <div className="cat-section-hdr">
                  <span style={{ background: 'var(--gl)', color: 'var(--gd)', width: '40px', height: '40px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    ➕
                  </span>
                  &nbsp;Other Services
                </div>
                <div className="svc-grid">
                  {otherServices.map((s) => (
                    <div key={s.n} className="svc-card" onClick={() => onSelectService(s.n)}>
                      <div className="se">{s.e}</div>
                      <div className="sn">{s.n}</div>
                      <div className="sr">{s.r}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredCategories.length === 0 && otherServices.length === 0 && (
              <div className="empty-state">No services match your search query.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
