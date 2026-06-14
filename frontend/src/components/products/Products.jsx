import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { ScrollRestoration, useNavigate, Link, useSearchParams, useRouteLoaderData, useParams, Await } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Product from './Product';

const ProductsContent = ({ productsData }) => {
  const navigate = useNavigate();
  const uniqueCategories = Array.from(new Set(productsData.map((p) => p.category)));
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  const priceBounds = useMemo(() => {
    const prices = productsData.map((p) => p.price);
    if (prices.length === 0) return { min: 0, max: 1000 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [productsData]);

  const [maxPrice, setMaxPrice] = useState(priceBounds.max);
  const [quickFilters, setQuickFilters] = useState({ organic: false, trending: false, onSale: false });
  const [speed, setSpeed] = useState('dash');
  const [sortOrder, setSortOrder] = useState('default');
  const [visibleCount, setVisibleCount] = useState(12);

  // ── Semantic Search State ──
  const [semanticResults, setSemanticResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // ── Personalized Feed State ──
  const [personalizedResults, setPersonalizedResults] = useState(null);

  // Reset visible count whenever the filtered/sorted result changes
  useEffect(() => { setVisibleCount(12); }, [category, searchQuery, maxPrice, quickFilters, sortOrder]);

  const { userInfo, isAuthenticated } = useSelector((state) => state.amazon);
  
  // Fetch semantic search from backend
  useEffect(() => {
    if (searchQuery) {
      if (isAuthenticated) {
        import('../../api/api').then(({ trackEvent }) => {
          trackEvent('search', null, searchQuery, userInfo.token);
        });
      }
      setIsSearching(true);
      import('axios').then(axios => {
        const headers = (isAuthenticated && userInfo?.token) ? { Authorization: `Bearer ${userInfo.token}` } : {};
        axios.default.post('/api/v1/ai/semantic-search', { q: searchQuery, limit: 50 }, { headers })
          .then(response => {
             const hits = response.data.items || [];
             const isSemantic = response.data.used_semantic;
             const mappedHits = hits.map(p => ({
                id: p.asin,
                title: p.title,
                category: p.category,
                price: p.price,
                thumbnail: p.img_url,
                images: p.img_url ? [p.img_url] : [],
                rating: p.stars || 0.0,
                brand: p.unit_size || "Q-Commerce",
                description: `Category: ${p.category}. Tags: ${p.tags}. Delivery in ${p.delivery_time_mins} mins.`,
                stock: p.stock_qty || 0,
                discountPercentage: 10,
             }));

             // HYBRID MERGE: Put exact text matches first, then pad with semantic matches
             const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
             const tokenizedResults = productsData.filter((p) => {
               const title = (p.title || '').toLowerCase();
               const cat = (p.category || '').toLowerCase();
               const brand = (p.brand || '').toLowerCase();
               const desc = (p.description || '').toLowerCase();
               return tokens.every(t => title.includes(t) || cat.includes(t) || brand.includes(t) || desc.includes(t));
             });

             const exactAsins = new Set(tokenizedResults.map(i => i.id || i.asin));
             const semanticOnlyItems = mappedHits.filter(i => !exactAsins.has(i.id));

             setSemanticResults([...tokenizedResults, ...semanticOnlyItems]);
          })
          .catch(err => console.error("Semantic search failed:", err))
          .finally(() => setIsSearching(false));
      });
    } else {
      setSemanticResults(null);
    }
  }, [searchQuery, productsData, isAuthenticated, userInfo]);

  // Fetch personalized feed
  useEffect(() => {
    if (!searchQuery && !category) {
      import('axios').then(axios => {
        const fetchUrl = (isAuthenticated && userInfo?.token) 
          ? '/api/v1/recommendations/for-you?limit=50'
          : '/api/v1/recommendations/trending?limit=50';
          
        const headers = (isAuthenticated && userInfo?.token) 
          ? { Authorization: `Bearer ${userInfo.token}` } 
          : {};

        axios.default.get(fetchUrl, { headers })
          .then(response => {
             const hits = response.data || [];
             const mappedHits = hits.map(p => ({
                id: p.asin,
                title: p.title,
                category: p.category,
                price: p.price,
                thumbnail: p.img_url,
                images: p.img_url ? [p.img_url] : [],
                rating: p.stars || 0.0,
                brand: p.unit_size || "Q-Commerce",
                description: `Category: ${p.category}. Tags: ${p.tags}. Delivery in ${p.delivery_time_mins} mins.`,
                stock: p.stock_qty || 0,
                discountPercentage: 10,
             }));
             
             // Pad with the rest of productsData so users can still scroll all items
             const recommendedAsins = new Set(mappedHits.map(i => i.id));
             const rest = productsData.filter(i => !recommendedAsins.has(i.id || i.asin));
             
             setPersonalizedResults([...mappedHits, ...rest]);
          })
          .catch(err => {
             console.error("Personalized feed failed:", err);
             setPersonalizedResults(null);
          });
      });
    } else {
      setPersonalizedResults(null);
    }
  }, [searchQuery, category, isAuthenticated, userInfo, productsData]);

  // ── Search & Filter ──
  let filtered = productsData;
  if (searchQuery) {
    if (semanticResults) {
      filtered = semanticResults;
    } else {
      // Fallback frontend token search while loading or if failed
      const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
      filtered = productsData.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return tokens.every(t => title.includes(t) || cat.includes(t) || brand.includes(t) || desc.includes(t));
      });
    }
  } else if (!category && personalizedResults) {
    // Show personalized blended feed if no search and no category
    filtered = personalizedResults;
  }

  const categoryProducts = category ? filtered.filter((p) => p.category === category) : filtered;

  // ── Apply price + quick filters ──
  const result = categoryProducts.filter((p) => {
    if (p.price > maxPrice) return false;
    if (quickFilters.trending && p.rating < 4.5) return false;
    if (quickFilters.onSale && !(p.discountPercentage > 0)) return false;
    return true;
  });

  const sortedProducts = [...result];
  if (sortOrder === 'lowToHigh') sortedProducts.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'highToLow') sortedProducts.sort((a, b) => b.price - a.price);
  else if (sortOrder === 'avgReview') sortedProducts.sort((a, b) => b.rating - a.rating);

  const toggleFilter = (key) => setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  const pricePct = priceBounds.max === priceBounds.min ? 100 : ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;

  // Bar chart heights (decorative)
  const bars = [30, 45, 35, 60, 80, 95, 70, 50, 40, 28, 20, 15];

  const quickFilterList = [
    { key: 'organic', label: 'Organic', icon: '🌿' },
    { key: 'trending', label: 'Trending', icon: '🔥' },
    { key: 'onSale', label: 'On Sale', icon: '🏷️' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] px-4 py-6 sm:px-6">
      <ScrollRestoration />

      {/* ── Category Pills ── */}
      <div className="mx-auto mb-6 max-w-[1400px]">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => navigate('/allProducts')}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition-all ${
              !category ? 'bg-[#FF9900] text-black shadow-lg shadow-[#FF9900]/20' : 'bg-[#0d0d0d] text-gray-300 ring-1 ring-white/5 hover:ring-[#FF9900]/30'
            }`}
          >
            All
          </button>
          {uniqueCategories.map((item) => (
            <button
              key={item}
              onClick={() => navigate(`/${item}`)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold capitalize transition-all ${
                category === item ? 'bg-[#FF9900] text-black shadow-lg shadow-[#FF9900]/20' : 'bg-[#0d0d0d] text-gray-300 ring-1 ring-white/5 hover:ring-[#FF9900]/30'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row">
        {/* ── Sidebar ── */}
        <aside className="w-full flex-shrink-0 space-y-5 lg:w-72">
          {/* Price Range */}
          <div className="rounded-2xl bg-[#0d0d0d] p-5 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Price Range</h3>
              <button onClick={() => setMaxPrice(priceBounds.max)} className="text-xs font-semibold text-gray-500 hover:text-[#FFB145]">Reset</button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Average price: ${Math.round((priceBounds.min + priceBounds.max) / 2)}</p>

            {/* Bar chart */}
            <div className="mt-4 flex h-20 items-end justify-center gap-1.5">
              {bars.map((h, i) => {
                const active = (i / bars.length) * 100 <= pricePct;
                return (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-2 rounded-full transition-colors ${active ? 'bg-[#FF9900]' : 'bg-white/10'}`}
                  />
                );
              })}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="price-slider mt-3 w-full"
            />

            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-[#141414] px-3 py-1 text-xs font-bold text-gray-300">₹{priceBounds.min}</span>
              <span className="rounded-full bg-[#141414] px-3 py-1 text-xs font-bold text-gray-300">₹{maxPrice}</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="rounded-2xl bg-[#0d0d0d] p-5 ring-1 ring-white/5">
            <h3 className="mb-3 font-bold text-white">Quick Filters</h3>
            {quickFilterList.map((f) => {
              const checked = quickFilters[f.key];
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="mb-1 flex w-full items-center justify-between rounded-xl px-2 py-2 transition hover:bg-white/5"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <span>{f.icon}</span> {f.label}
                  </span>
                  <span className={`grid h-5 w-5 place-items-center rounded-md border-2 transition ${checked ? 'border-[#FF9900] bg-[#FF9900]' : 'border-white/15 bg-transparent'}`}>
                    {checked && (
                      <svg className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Speed */}
          <div className="rounded-2xl bg-[#0d0d0d] p-5 ring-1 ring-white/5">
            <h3 className="mb-3 font-bold text-white">Speed</h3>
            <div className="flex gap-2 rounded-full bg-[#141414] p-1">
              {[{ id: 'dash', label: 'Dash (10m)' }, { id: 'standard', label: 'Standard' }].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSpeed(opt.id)}
                  className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
                    speed === opt.id ? 'bg-[#FF9900] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-white">
                {searchQuery ? `Results for "${searchQuery}"` : category ? <span className="capitalize">{category}</span> : personalizedResults ? (isAuthenticated ? 'Recommended for You' : 'Trending Products') : 'All Products'}
              </h1>
              <p className="text-sm text-gray-500">{sortedProducts.length} items · delivered in minutes</p>
            </div>
            <select
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
              className="rounded-full border-0 bg-[#0d0d0d] px-4 py-2.5 text-sm font-semibold text-gray-300 ring-1 ring-white/10 focus:ring-[#FF9900]/40"
            >
              <option value="default">Sort: Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="avgReview">Top Rated</option>
            </select>
          </div>

          {sortedProducts.length > 0 ? (
            <>
              <Product productsData={sortedProducts.slice(0, visibleCount)} />

              {/* Load More */}
              {visibleCount < sortedProducts.length && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  {/* progress text */}
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-300">{Math.min(visibleCount, sortedProducts.length)}</span> of{' '}
                    <span className="font-semibold text-gray-300">{sortedProducts.length}</span> products
                  </p>
                  {/* progress bar */}
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF9900] to-[#ffb733] transition-all duration-500"
                      style={{ width: `${(visibleCount / sortedProducts.length) * 100}%` }}
                    />
                  </div>
                  <button
                    id="load-more-btn"
                    onClick={() => setVisibleCount((c) => c + 12)}
                    className="group mt-1 flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0d0d0d] px-8 py-3 text-sm font-bold text-gray-200 ring-1 ring-white/5 transition-all hover:border-[#FF9900]/50 hover:text-[#FF9900] hover:shadow-[0_0_24px_-4px_rgba(255,153,0,0.3)]"
                  >
                    <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More
                  </button>
                </div>
              )}

              {/* All loaded indicator */}
              {visibleCount >= sortedProducts.length && sortedProducts.length > 12 && (
                <p className="mt-8 text-center text-xs font-semibold uppercase tracking-widest text-gray-600">
                  ✓ All {sortedProducts.length} products loaded
                </p>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-[#0d0d0d] py-24 text-center ring-1 ring-white/5">
              <p className="text-2xl font-bold text-white">No products found</p>
              <p className="mt-2 text-gray-400">
                Try adjusting your filters or{' '}
                <Link to="/allProducts" className="font-semibold text-[#FFB145] hover:underline">browse all products</Link>
              </p>
            </div>
          )}

          {/* ── Flash Deal Banner ── */}
          <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-violet-500 to-[#FF9900] p-8">
            <div className="relative z-10 max-w-lg">
              <span className="inline-block rounded-md bg-black/30 px-3 py-1 text-xs font-bold tracking-wider text-[#FFD9A6] backdrop-blur">
                FLASH DEAL
              </span>
              <h2 className="mt-4 text-3xl font-black text-white md:text-4xl">Late Night Cravings?</h2>
              <p className="mt-2 text-sm text-white/90">
                Get 20% off all snacks and energy drinks between 10PM and 2AM. Dash delivered.
              </p>
              <button
                onClick={() => navigate('/allProducts')}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 transition hover:scale-105"
              >
                Shop Now
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
            </div>
            <div className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 text-[12rem] opacity-20 md:block">🛍️</div>
          </div>
        </main>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .price-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(to right, #FF9900 0%, #FF9900 ${pricePct}%, rgba(255,255,255,0.1) ${pricePct}%, rgba(255,255,255,0.1) 100%);
          outline: none;
        }
        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #FF9900;
          border: 3px solid #0a0a0a;
          box-shadow: 0 0 0 1px rgba(255,153,0,0.5);
          cursor: pointer;
        }
        .price-slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: #FF9900;
          border: 3px solid #0a0a0a;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

const Products = () => {
  const data = useRouteLoaderData("root");

  return (
    <Suspense fallback={<div className="flex justify-center py-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900]"></div></div>}>
      <Await resolve={data.data}>
        {(resolvedData) => <ProductsContent productsData={resolvedData.products} />}
      </Await>
    </Suspense>
  );
};

export default Products;
