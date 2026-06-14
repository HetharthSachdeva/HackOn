import React, { Suspense } from 'react';
import { Link, useRouteLoaderData, useNavigate, Await } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/amazonSlice';
import { useCart } from '../../context/userCartContext';
import './scrollbar.css';

const DealCard = ({ product, onAdd }) => {
  const price = parseFloat(product.price || 0);
  const discountPercentage = parseFloat(product.discountPercentage || 0);
  const hasDiscount = discountPercentage > 0;
  const finalPrice = hasDiscount ? price * (1 - discountPercentage / 100) : price;
  const sku = '#' + (product.brand || product.category || 'SKU').replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() + '-' + String(product.id ?? 0).padStart(2, '0');

  return (
    <div className="group relative flex flex-col rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent p-1 ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-[0_0_40px_-10px_rgba(255,153,0,0.3)]">
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#FF9900]/0 via-[#FF9900]/0 to-[#FF9900]/0 opacity-0 transition-opacity duration-500 group-hover:from-[#FF9900]/15 group-hover:via-transparent group-hover:opacity-100 blur-xl" />
      
      {/* Inner card container */}
      <div className="flex h-full flex-col rounded-[22px] bg-[#09090b]/90 p-4 backdrop-blur-xl relative overflow-hidden transition-colors duration-500 group-hover:bg-[#09090b]/80">
        
        {/* Subtle top reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Image panel with WHITE background to hide harsh image borders */}
        <Link to={`/allProducts/${product.title}`} className="relative block">
          <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#0e0e11] ring-1 ring-white/5 p-4 transition-transform duration-500 group-hover:scale-[1.02]">
            {hasDiscount && (
              <span className="absolute right-3 top-3 z-10 rounded-full border border-[#FF9900] bg-[#FF9900] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-lg">
                {discountPercentage.toFixed(0)}% OFF
              </span>
            )}
            
            <img
              src={product.thumbnail}
              alt={product.title}
              loading="lazy"
              className="relative z-10 max-h-[90%] max-w-[90%] object-contain drop-shadow-md transition-all duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-1"
            />
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col pt-5">
          <div className="flex items-center justify-between">
            <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF9900] transition-colors duration-300 group-hover:bg-[#FF9900]/10">{product.category}</span>
            <span className="font-mono text-[10px] tracking-wider text-gray-500">{sku}</span>
          </div>

          <Link to={`/allProducts/${product.title}`} className="mt-3 block">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug text-white transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">{product.title}</h3>
          </Link>
          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{product.brand || 'Premium Quality'}</p>

          <div className="flex-1" />

          <div className="mt-5 flex items-end justify-between border-t border-white/5 pt-4 transition-colors duration-300 group-hover:border-white/10">
            <div>
               <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-0.5">Price</p>
               <div className="flex items-baseline gap-2">
                 <span className="text-xl font-black text-white">₹{finalPrice.toFixed(2)}</span>
                 {hasDiscount && <span className="text-xs text-gray-600 line-through decoration-red-500/50 decoration-wavy">₹{price.toFixed(2)}</span>}
               </div>
            </div>

            <button
              onClick={() => onAdd(product)}
              className="group/btn relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#FF9900] px-4 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-black transition-all duration-300 hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:-rotate-12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                ADD
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import axios from 'axios';

const ProductsSliderContent = ({ productsData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.amazon.userInfo);
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const { addToCartBackend } = useCart();

  const [recommendedDeals, setRecommendedDeals] = React.useState([]);

  React.useEffect(() => {
    if (authenticated && userInfo?.token) {
      axios.get('http://localhost:8000/api/v1/recommendations/for-you?limit=8', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      }).then(res => {
         const mapped = (res.data || []).map(p => ({
            id: p.asin, title: p.title, price: p.price,
            thumbnail: p.img_url, category: p.category, brand: p.unit_size || 'Q-Commerce',
            discountPercentage: 10, stock: p.stock_qty || 1
         }));
         setRecommendedDeals(mapped);
      }).catch(err => console.error("Failed to load recommendations", err));
    }
  }, [authenticated, userInfo]);

  // Prefer discounted products for "deals" if not authenticated
  const deals = [...productsData].sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)).slice(0, 8);
  const featuredThumbs = productsData.slice(0, 7);
  
  const displayDeals = recommendedDeals.length > 0 ? recommendedDeals : deals;
  const headingText = recommendedDeals.length > 0 ? "Recommended For You" : "Today's Deals";

  const handleAdd = async (product) => {
    if (!authenticated) {
      dispatch(addToCart({
        id: product.id, title: product.title, price: product.price, description: product.description,
        category: product.category, images: product.images, thumbnail: product.thumbnail, brand: product.brand,
        quantity: 1, discountPercentage: product.discountPercentage, rating: product.rating, stock: product.stock,
      }));
    } else {
      await addToCartBackend(product.id, 1);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-white">{headingText}</h2>
            <span className="flex items-center gap-1 rounded bg-[#FF9900] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black">🔥 Hot</span>
          </div>
          <p className="mt-3 max-w-xl text-sm text-gray-500">
            {recommendedDeals.length > 0 ? "Curated specifically for your tastes and past orders." : "High-performance picks and daily essentials at reduced rates."}
          </p>
        </div>
        <button onClick={() => navigate('/allProducts')} className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-gray-300 transition hover:text-[#FF9900]">
          Shop all deals
          <span>→</span>
        </button>
      </div>

      {/* Featured partner banner */}
      <div className="relative mt-6 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#15110a] via-[#0d0d0d] to-[#0d0d0d] p-6">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div className="flex h-full items-center gap-4 px-6">
            {featuredThumbs.map((p, i) => (
              <div key={i} className="flex h-28 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                <img src={p.thumbnail} alt="" loading="lazy" className="max-h-[80%] max-w-[80%] object-contain blur-[1px]" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#FF9900]">Featured Partner</p>
          <h3 className="mt-1 text-2xl font-black text-white">Bulk Fluid Dynamics</h3>
          <button onClick={() => navigate('/allProducts')} className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-gray-300 hover:text-[#FF9900]">Shop all →</button>
        </div>
      </div>

      {/* Deal grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {displayDeals.map((product, i) => (
          <DealCard key={i} product={product} onAdd={handleAdd} />
        ))}
      </div>
    </div>
  );
};

const ProductsSlider = () => {
  const data = useRouteLoaderData("root");

  return (
    <section className="bg-[#0a0a0a] py-12">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900]"></div></div>}>
        <Await resolve={data.data}>
          {(resolvedData) => <ProductsSliderContent productsData={resolvedData.products} />}
        </Await>
      </Suspense>
    </section>
  );
};

export default ProductsSlider;
