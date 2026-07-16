import React from 'react';
import Hero from '../components/Hero';
import CategoryShowcase from '../components/CategoryShowcase';
import HowItWorks from '../components/HowItWorks';
import Reviews from '../components/Reviews';
import FAQ from '../components/FAQ';
import CareersBanner from '../components/CareersBanner';

export default function Home({ setPage, onQuickSelect, onCategoryClick }) {
  return (
    <div className="page active" id="page-home">
      <Hero setPage={setPage} onQuickSelect={onQuickSelect} />
      
      <CategoryShowcase onCategoryClick={onCategoryClick} />
      
      <HowItWorks />
      
      <Reviews />
      
      <FAQ />
      
      <CareersBanner setPage={setPage} />
    </div>
  );
}
