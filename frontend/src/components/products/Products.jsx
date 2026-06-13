import React, { useState, useMemo } from 'react';
import { ScrollRestoration, useNavigate, Link, useSearchParams, useRouteLoaderData, useParams } from 'react-router-dom';
import Product from './Product';

const Products = () => {
  const navigate = useNavigate();
  const data = useRouteLoaderData("root");
  const productsData = data.data.products;
  const uniqueCategories = Array.from(new Set(productsData.map((p) => p.category)));
  const { category } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  // ── Price bounds from data ──
  const priceBounds = useMemo(() => {
    const prices = productsData.map((p) => p.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [productsData]);

  const [maxPrice, setMaxPrice] = useState(priceBounds.max);
  const [starRange, setStarRange] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [delivery, setDelivery] = useState('standard');
  const [sortOrder, setSortOrder] = useState('default');

  // ── Search filter ──
  let filtered = productsData;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = productsData.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  // ── Category filter ──
  const categoryProducts = category ? filtered.filter((p) => p.category === category) : filtered;

  // Brands available in current view
  const availableBrands = useMemo(
    () => Array.from(new Set(categoryProducts.map((p) => p.brand))).slice(0, 8),
    [categoryProducts]
  );

  // ── Apply price / star / brand ──
  const result = categoryProducts.filter((p) => {
    const priceOk = p.price <= maxPrice;
    const starOk = starRange ? p.rating >= parseFloat(starRange) : true;
    const brandOk = selectedBrands.length ? selectedBrands.includes(p.brand) : true;
    return priceOk && starOk && brandOk;
  });

  // ── Sorting ──
  const sortedProducts = [...result];
  if (sortOrder === 'lowToHigh') sortedProducts.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'highToLow') sortedProducts.sort((a, b) => b.price - a.price);
  else if (sortOrder === 'avgReview') sortedProducts.sort((a, b) => b.rating - a.rating);

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const resetPrice = () => setMaxPrice(priceBounds.max);
  const resetBrands = () => setSelectedBrands([]);

  // Decorative chart + slider fill
  const chartPath = "M0,30 L10,22 L20,26 L30,12 L40,18 L50,6 L60,16 L70,10 L80,20 L90,8 L100,24 L100,40 L0,40 Z";
  const pricePct = ((maxPrice - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100;

  return (
    <div className="min-h-screen w-full bg-[#f6f6f9] px-4 py-6 sm:px-6">
      <ScrollRestoration />

      {/* ── Category Pills ── */}
      <div className="mx-auto mb-6 max-w-[1400px]">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => navigate('/allProducts')}
            className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              !category
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-violet-300'
            }`}
          >
            All Categories
          </button>
          {uniqueCategories.map((item) => (
            <button
              key={item}
              onClick={() => navigate(`/${item}`)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all ${
                category === item
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-violet-300'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row">
        {/* ── Filter Sidebar ── */}
        <aside className="w-full flex-shrink-0 space-y-5 lg:w-72">
          {/* Price Range */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Price Range</h3>
              <button onClick={resetPrice} className="text-xs font-semibold text-gray-400 hover:text-violet-600">Reset</button>
            </div>
            <p className="mt-1 text-xs text-gray-400">The average price is ₹{Math.round((priceBounds.min + priceBounds.max) / 2)}</p>

            {/* Decorative chart */}
            <div className="relative mt-4 h-16 w-full overflow-hidden">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.35)" />
                    <stop offset="100%" stopColor="rgba(124,58,237,0.02)" />
                  </linearGradient>
                </defs>
                <path d={chartPath} fill="url(#priceFill)" stroke="#7c3aed" strokeWidth="0.8" />
              </svg>
            </div>

            {/* Range slider */}
            <div className="relative mt-2 px-1">
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="price-slider w-full"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-bold text-white">₹{priceBounds.min}</span>
              <span className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-bold text-white">₹{maxPrice}</span>
            </div>
          </div>

          {/* Star Rating */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-base font-bold text-gray-900">Star Rating</h3>
            {['4.5', '4', '3', '2'].map((rate) => (
              <button
                key={rate}
                onClick={() => setStarRange((prev) => (prev === rate ? '' : rate))}
                className={`mb-1.5 flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                  starRange === rate ? 'bg-violet-50 ring-1 ring-violet-200' : 'hover:bg-gray-50'
                }`}
              >
                <span className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= Math.floor(parseFloat(rate)) ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  ))}
                </span>
                <span className="text-xs font-semibold text-gray-500">{rate} & up</span>
              </button>
            ))}
          </div>

          {/* Brand */}
          {availableBrands.length > 0 && (
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Brand</h3>
                <button onClick={resetBrands} className="text-xs font-semibold text-gray-400 hover:text-violet-600">Reset</button>
              </div>
              <div className="mt-3 space-y-1">
                {availableBrands.map((brand) => {
                  const checked = selectedBrands.includes(brand);
                  return (
                    <label key={brand} className="flex cursor-pointer items-center justify-between rounded-xl px-2 py-2 hover:bg-gray-50">
                      <span className="text-sm font-medium capitalize text-gray-700">{brand}</span>
                      <span
                        onClick={(e) => { e.preventDefault(); toggleBrand(brand); }}
                        className={`grid h-5 w-5 place-items-center rounded-md border-2 transition ${
                          checked ? 'border-violet-600 bg-violet-600' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {checked && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Options */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 text-base font-bold text-gray-900">Delivery Options</h3>
            <div className="flex gap-2 rounded-full bg-gray-100 p-1">
              {[{ id: 'standard', label: 'Standard' }, { id: 'pickup', label: 'Pick Up' }].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDelivery(opt.id)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                    delivery === opt.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Product Grid ── */}
        <main className="flex-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                {searchQuery ? `Results for "${searchQuery}"` : category ? <span className="capitalize">{category}</span> : 'All Products'}
              </h1>
              <p className="text-sm text-gray-400">{sortedProducts.length} items found</p>
            </div>
            <select
              onChange={(e) => setSortOrder(e.target.value)}
              value={sortOrder}
              className="rounded-full border-0 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm ring-1 ring-gray-200 focus:ring-violet-300"
            >
              <option value="default">Sort: Featured</option>
              <option value="lowToHigh">Price: Low to High</option>
              <option value="highToLow">Price: High to Low</option>
              <option value="avgReview">Top Rated</option>
            </select>
          </div>

          {sortedProducts.length > 0 ? (
            <Product productsData={sortedProducts} />
          ) : (
            <div className="rounded-3xl bg-white py-24 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-700">No products found</p>
              <p className="mt-2 text-gray-500">
                Try adjusting your filters or{' '}
                <Link to="/allProducts" className="font-semibold text-violet-600 hover:underline">browse all products</Link>
              </p>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .price-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(to right, #7c3aed 0%, #7c3aed ${pricePct}%, #e5e7eb ${pricePct}%, #e5e7eb 100%);
          outline: none;
        }
        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          background: #111827;
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        }
        .price-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 9999px;
          background: #111827;
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Products;
