import React, { useState, useEffect } from 'react';
import { useOutletContext, ScrollRestoration, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
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
  const userInfo = useSelector((state) => state.amazon.userInfo);

  const [showBundle, setShowBundle] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bundleData, setBundleData] = useState(null);
  const [error, setError] = useState(null);

  const fetchBundle = async (query) => {
    setShowBundle(false);
    setError(null);
    setIsGenerating(true);

    try {
      const headers = userInfo?.token
        ? { Authorization: `Bearer ${userInfo.token}` }
        : {};

      const { data } = await axios.post(
        'http://localhost:8000/api/v1/ai/cart-from-intent',
        { prompt: query, max_items: 6, apply_to_cart: false },
        { headers }
      );

      // Map IntentToCartResponse → AIBundleCard bundle shape
      const subtotal = parseFloat(data.subtotal || 0);
      const savings = data.budget ? Math.max(0, parseFloat(data.budget) - subtotal) : (subtotal * 0.1);

      setBundleData({
        title: data.explanation || `${query} — AI Bundle`,
        totalCost: subtotal,
        savings: savings.toFixed(2),
        deliveryETA: '10 min',
        confidence: data.used_semantic ? 96 : 82,
        products: (data.items || []).map((item) => ({
          id: item.asin,
          name: item.title,
          price: parseFloat(item.unit_price || 0).toFixed(2),
          originalPrice: (parseFloat(item.unit_price || 0) * 1.1).toFixed(2),
          quantity: item.quantity,
          image: item.img_url || `https://placehold.co/200x200/141414/FF9900?text=${encodeURIComponent(item.title.slice(0,8))}`,
          rationale: item.rationale,
        })),
      });
      setShowBundle(true);
    } catch (err) {
      console.error('AI bundle error:', err);
      setError(err.response?.data?.detail || 'Could not generate bundle. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isAIMode && aiSearchNonce > 0 && aiSearchQuery) {
      fetchBundle(aiSearchQuery.trim());
    } else {
      setShowBundle(false);
      setIsGenerating(false);
      setError(null);
    }
  }, [isAIMode, aiSearchNonce, aiSearchQuery]);

  const handleOptimize = (type) => {
    if (!aiSearchQuery) return;
    fetchBundle(`${aiSearchQuery.trim()}, optimized for ${type}`);
  };

  // ── Normal mode ──
  if (!isAIMode) {
    return (
      <div className="relative min-h-screen bg-[#0a0a0a]">
        <div className="relative z-10 ai-enter">
          <QuickCommerceHero />
          <ProductsSlider />
        </div>
        <ScrollRestoration />
        <style>{`
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
          <p className="mt-2 font-mono text-xs text-gray-600">Searching catalog · Ranking matches · Asking AI</p>
        </div>
      ) : error ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-2xl">⚠️</div>
          <p className="font-mono text-sm uppercase tracking-widest text-red-400">Bundle generation failed</p>
          <p className="max-w-sm text-sm text-gray-500">{error}</p>
          <button
            onClick={() => aiSearchQuery && fetchBundle(aiSearchQuery.trim())}
            className="mt-2 rounded-full border border-white/15 px-6 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 transition hover:border-[#FF9900] hover:text-[#FF9900]"
          >
            Try Again
          </button>
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

      <style>{`
        @keyframes ai-enter { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .ai-enter { animation: ai-enter 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes ai-cell-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(255,153,0,0.65); } 50% { opacity: 0.5; box-shadow: 0 0 6px rgba(255,153,0,0.3); } }
        .ai-cell { animation: ai-cell-pulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Home;
