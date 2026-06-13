import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import AIBundleCard from './AIBundleCard';
import QuickCommerceHero from './QuickCommerceHero';
import ProductsSlider from "./ProductsSlider";
import { ScrollRestoration } from 'react-router-dom';

const Home = () => {
  const { isAIMode, aiSearchQuery, handleAISearch } = useOutletContext();
  const [showBundle, setShowBundle] = useState(false);
  const [bundleData, setBundleData] = useState(null);

  // Watch for AI search queries
  useEffect(() => {
    if (isAIMode && aiSearchQuery) {
      // Simulate AI bundle generation
      console.log('AI Searching for:', aiSearchQuery);
      setShowBundle(false); // Reset first
      
      setTimeout(() => {
        setBundleData({
          title: 'Healthy Breakfast Bundle for 7 Days',
          totalCost: 945,
          savings: 155,
          deliveryETA: '12 min',
          confidence: 94,
          products: [
            {
              name: 'Whole Wheat Bread (2 packs)',
              price: 85,
              originalPrice: 100,
              quantity: 2,
              image: 'https://via.placeholder.com/200?text=Bread'
            },
            {
              name: 'Fresh Milk - 1L (7 packs)',
              price: 350,
              originalPrice: 420,
              quantity: 7,
              image: 'https://via.placeholder.com/200?text=Milk'
            },
            {
              name: 'Farm Fresh Eggs (2 dozen)',
              price: 180,
              originalPrice: 200,
              quantity: 24,
              image: 'https://via.placeholder.com/200?text=Eggs'
            },
            {
              name: 'Organic Oats - 1kg',
              price: 120,
              originalPrice: 150,
              quantity: 1,
              image: 'https://via.placeholder.com/200?text=Oats'
            },
            {
              name: 'Mixed Fruits Pack',
              price: 210,
              originalPrice: 250,
              quantity: 1,
              image: 'https://via.placeholder.com/200?text=Fruits'
            }
          ]
        });
        setShowBundle(true);
      }, 1500);
    } else {
      setShowBundle(false);
    }
  }, [isAIMode, aiSearchQuery]);

  const handleOptimize = (type) => {
    console.log('Optimizing for:', type);
    // Simulate bundle optimization
  };

  return (
    <div className="min-h-screen bg-[#0b1120]">
      {/* AI Mode Suggestions Banner */}
      {isAIMode && (
        <div className="border-b border-white/5 bg-[#0e1420] py-5">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#FF9900]/15 text-[#FF9900]">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              <span className="text-lg font-bold text-white">AI Mode Active</span>
              <span className="ml-1 rounded-full bg-[#FF9900]/15 px-2 py-0.5 text-xs font-bold text-[#FFB145]">BETA</span>
            </div>
            <p className="mb-3 text-sm text-gray-400">Try these AI-powered bundle suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                '🥗 Healthy breakfast under $15',
                '🎂 Party supplies for 20 people',
                '💪 Fitness supplements bundle',
                '👶 Baby essentials kit'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAISearch(suggestion.substring(2))}
                  className="rounded-full bg-[#151c2b] px-4 py-2 text-sm text-gray-300 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:text-[#FFB145] hover:ring-[#FF9900]/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {showBundle && isAIMode ? (
        // AI Mode: Show Bundle
        <div className="animate-fade-in">
          <AIBundleCard 
            bundle={bundleData}
            onOptimize={handleOptimize}
          />
        </div>
      ) : (
        // Normal Mode: Show Standard Quick-Commerce
        <div>
          <QuickCommerceHero />
          <ProductsSlider />
        </div>
      )}

      <ScrollRestoration />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Home;

