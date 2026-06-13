import React, { useState, useEffect } from 'react';
import { useOutletContext, ScrollRestoration } from 'react-router-dom';
import AIBundleCard from './AIBundleCard';
import QuickCommerceHero from './QuickCommerceHero';
import ProductsSlider from "./ProductsSlider";

// Pixel grid spelling "AI" — 1 = dim square (backdrop), 2 = glowing orange (letter)
const GRID_PATTERN = [
  [1, 2, 1, 1, 2, 2, 2],
  [2, 1, 2, 1, 1, 2, 1],
  [2, 2, 2, 1, 1, 2, 1],
  [2, 1, 2, 1, 1, 2, 1],
  [2, 1, 2, 1, 2, 2, 2],
];

const Home = () => {
  const { isAIMode, aiSearchQuery, aiSearchNonce, handleAISearch } = useOutletContext();
  const [showBundle, setShowBundle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bundleData, setBundleData] = useState(null);

  useEffect(() => {
    if (isAIMode && aiSearchNonce > 0 && aiSearchQuery) {
      setShowBundle(false);
      setIsGenerating(true);
      const t = setTimeout(() => {
        const q = aiSearchQuery.trim();
        const title = q.charAt(0).toUpperCase() + q.slice(1);
        setBundleData({
          title: `${title} — AI Bundle`,
          totalCost: 945, savings: 155, deliveryETA: '12 min', confidence: 94,
          products: [
            { name: 'Whole Wheat Bread (2 packs)', price: 85, originalPrice: 100, quantity: 2, image: 'https://via.placeholder.com/200?text=Bread' },
            { name: 'Fresh Milk - 1L (7 packs)', price: 350, originalPrice: 420, quantity: 7, image: 'https://via.placeholder.com/200?text=Milk' },
            { name: 'Farm Fresh Eggs (2 dozen)', price: 180, originalPrice: 200, quantity: 24, image: 'https://via.placeholder.com/200?text=Eggs' },
            { name: 'Organic Oats - 1kg', price: 120, originalPrice: 150, quantity: 1, image: 'https://via.placeholder.com/200?text=Oats' },
            { name: 'Mixed Fruits Pack', price: 210, originalPrice: 250, quantity: 1, image: 'https://via.placeholder.com/200?text=Fruits' },
          ],
        });
        setIsGenerating(false);
        setShowBundle(true);
      }, 1800);
      return () => clearTimeout(t);
    } else {
      setShowBundle(false);
      setIsGenerating(false);
    }
  }, [isAIMode, aiSearchNonce, aiSearchQuery]);

  const handleOptimize = (type) => console.log('Optimizing for:', type);

  // ── Normal mode ──
  if (!isAIMode) {
    return (
      <div className="relative min-h-screen bg-[#0a0a0a]">
        <div className="relative z-10 ai-enter">
          <QuickCommerceHero />
          <ProductsSlider />
        </div>
        <ScrollRestoration />
        <style jsx>{`
          @keyframes ai-enter { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
          .ai-enter { animation: ai-enter 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        `}</style>
      </div>
    );
  }

  // ── AI mode — SupplyChain AI two-panel terminal ──
  return (
    <div className="relative min-h-screen bg-[#080809] transition-colors duration-700">
      <ScrollRestoration />

      {isGenerating ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#FF9900]/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#FF9900] border-r-[#ff7a00]" />
          </div>
          <p className="mt-6 animate-pulse font-mono text-sm uppercase tracking-[0.2em] text-[#FFB145]">Curating your bundle…</p>
        </div>
      ) : showBundle ? (
        <div className="ai-enter px-4 py-8">
          <AIBundleCard bundle={bundleData} onOptimize={handleOptimize} />
        </div>
      ) : (
        <>
          {/* Two-panel hero */}
          <div className="ai-enter grid min-h-[78vh] grid-cols-1 md:grid-cols-2">
            {/* Left panel — glow + animated grid */}
            <div className="relative overflow-hidden border-b border-white/5 md:border-b-0 md:border-r">
              {/* orange radial glow */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: 'radial-gradient(600px circle at 30% 55%, rgba(255,122,0,0.18), transparent 60%)' }}
              />
              <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#ff7a00]/10 blur-3xl" />

              {/* animated grid spelling "AI" */}
              <div className="relative flex h-full min-h-[40vh] items-center justify-center p-10">
                <div className="flex flex-col gap-2">
                  {GRID_PATTERN.map((row, r) => (
                    <div key={r} className="flex gap-2">
                      {row.map((cell, c) => {
                        if (cell === 0) return <div key={c} className="h-10 w-10" />;
                        const glow = cell === 2;
                        return (
                          <div
                            key={c}
                            className={`h-10 w-10 rounded-lg border transition-all ${
                              glow
                                ? 'border-[#FF9900] bg-[#FF9900]/5 shadow-[0_0_20px_rgba(255,153,0,0.65)] ai-cell'
                                : 'border-white/[0.06]'
                            }`}
                            style={glow ? { animationDelay: `${(r + c) * 0.12}s` } : undefined}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel — content */}
            <div className="flex flex-col justify-between p-8 md:p-12">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#FF9900]">Warehouse</p>
                <h1 className="mt-3 text-4xl font-black leading-[1.05] text-white md:text-5xl">
                  Immediate<br />availability
                </h1>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-400">
                  One of our strengths is the wide availability of parts in stock, including discontinued brands.
                </p>
                <ul className="mt-6 space-y-3 font-mono text-sm text-gray-300">
                  {['Fast and efficient delivery', 'Experienced and qualified staff', 'Wide availability of obsolete products'].map((t) => (
                    <li key={t} className="flex items-start gap-3"><span className="mt-0.5 text-[#FF9900]">•</span>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Bottom stats */}
              <div className="mt-10 border-t border-white/10 pt-6">
                <div className="flex items-end gap-12">
                  <div>
                    <p className="text-3xl font-black text-white">10 min</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">Avg. Delivery</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-[#FF9900]">4.8★</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">Customer Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Thin footer bar */}
          <div className="flex flex-col items-center justify-between gap-2 border-t border-white/5 px-6 py-5 font-mono text-[11px] text-gray-500 md:flex-row">
            <p>© {new Date().getFullYear()} ZipDash Logistics AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#FF9900]">Privacy Policy</a>
              <a href="#" className="hover:text-[#FF9900]">Terms of Service</a>
              <a href="#" className="hover:text-[#FF9900]">API Status</a>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes ai-enter { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .ai-enter { animation: ai-enter 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ai-cell-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(255,153,0,0.65); } 50% { opacity: 0.5; box-shadow: 0 0 6px rgba(255,153,0,0.3); } }
        .ai-cell { animation: ai-cell-pulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Home;
