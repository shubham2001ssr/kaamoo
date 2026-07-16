import React from 'react';

export default function Reviews() {
  const reviews = [
    {
      stars: '★★★★★',
      text: '"Pehli baar kisi service ne time pe aaya. Plumber bilkul sahi waqt pe aaya aur kaam bhi perfect tha. Highly recommend Kaamoo!"',
      author: 'Ramesh Sharma',
      loc: 'Ward 5, Deoghar',
      avatar: 'R'
    },
    {
      stars: '★★★★★',
      text: '"Cook ki zaroorat thi achanak — Kaamoo ne 1 ghante mein bhej diya. Khana bhi bahut accha tha! Aur price bilkul jo bataya tha wahi liya."',
      author: 'Sunita Agarwal',
      loc: 'Naya Tola, Deoghar',
      avatar: 'S'
    },
    {
      stars: '★★★★☆',
      text: '"Event ke liye photographer dhundh raha tha — Kaamoo ne sahi rate pe ek din mein arrange kar diya. Bahut acchi service hai."',
      author: 'Vikash Kumar',
      loc: 'Station Road, Deoghar',
      avatar: 'V'
    }
  ];

  return (
    <section className="section" style={{ background: '#FEF9EE' }}>
      <div className="si">
        <div className="s-hdr reveal visible">
          <div className="s-tag">Reviews</div>
          <h2 className="s-title">What Deoghar says</h2>
        </div>
        <div className="review-grid reveal visible">
          {reviews.map((r, idx) => (
            <div key={idx} className="review-card">
              <div className="stars">{r.stars}</div>
              <div className="review-text">{r.text}</div>
              <div className="review-author">
                <div className="avatar">{r.avatar}</div>
                <div>
                  <div className="r-name">{r.author}</div>
                  <div className="r-loc">{r.loc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
