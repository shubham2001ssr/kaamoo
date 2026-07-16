import React from 'react';
import { CATS, SVCS } from '../data/servicesData';

export default function CategoryShowcase({ onCategoryClick }) {
  return (
    <section className="section" style={{ background: 'var(--white)', paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="si">
        <div className="s-hdr reveal visible">
          <div className="s-tag">Service Categories</div>
          <h2 className="s-title">Explore by Category</h2>
          <p class="s-sub">We offer 30+ services grouped into 4 main categories. Choose a category to see details.</p>
        </div>
        <div className="cat-showcase-grid reveal visible" id="catShowcaseGrid">
          {CATS.map((c) => {
            const sampleSvcs = SVCS.filter((s) => s.c === c.id).slice(0, 4);
            return (
              <div key={c.id} className="cat-card" onClick={() => onCategoryClick(c.id)}>
                <div>
                  <div className="cat-card-hdr">
                    <div className="cat-card-icon" style={{ background: c.g, color: c.t }}>
                      {c.e}
                    </div>
                    <h3>{c.n}</h3>
                  </div>
                  <div className="cat-card-desc">{c.d}</div>
                  <div className="cat-card-list">
                    {sampleSvcs.map((s) => (
                      <span key={s.n} className="cat-list-tag">
                        {s.e} {s.n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="cat-card-btn">
                  Explore Category <i className="ti ti-arrow-right"></i>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
