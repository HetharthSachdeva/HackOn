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
    <div className="min-h-screen bg-[#fafafa]">
      {/* AI Mode Suggestions Banner */}
      {isAIMode && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="font-bold text-lg">AI Mode Active</span>
            </div>
            <p className="text-sm mb-3 opacity-90">Try these AI-powered bundle suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                '🥗 Healthy breakfast under ₹1000',
                '🎂 Party supplies for 20 people',
                '💪 Fitness supplements bundle',
                '👶 Baby essentials kit'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAISearch(suggestion.substring(2))}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-sm hover:bg-white/30 transition-all duration-200 hover:scale-105"
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

