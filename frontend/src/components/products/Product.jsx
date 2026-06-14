import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/amazonSlice';
import axios from 'axios';
import { useCart } from '../../context/userCartContext';

const ProductCard = ({ product, onAdd }) => {
  const [added, setAdded] = useState(false);
  const price = parseFloat(product.price || 0);
  const discountPercentage = parseFloat(product.discountPercentage || 0);
  const hasDiscount = discountPercentage > 0;
  const finalPrice = hasDiscount
    ? price * (1 - discountPercentage / 100)
    : price;
  const inStock = (product.stock ?? 0) > 0;

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group relative flex flex-col rounded-3xl bg-gradient-to-b from-white/[0.05] to-transparent p-1 ring-1 ring-white/10 transition-all duration-500 hover:ring-white/30 hover:shadow-[0_0_40px_-10px_rgba(255,153,0,0.3)]">
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#FF9900]/0 via-[#FF9900]/0 to-[#FF9900]/0 opacity-0 transition-opacity duration-500 group-hover:from-[#FF9900]/15 group-hover:via-transparent group-hover:opacity-100 blur-xl" />
      
      {/* Inner card container */}
      <div className="flex h-full flex-col rounded-[22px] bg-[#09090b]/90 p-4 backdrop-blur-xl relative overflow-hidden transition-colors duration-500 group-hover:bg-[#09090b]/80">
        
        {/* Subtle top reflection */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        
        {/* Image panel */}
        <Link to={`${product.title}`} className="relative block">
          <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-[#0e0e11] ring-1 ring-white/5 p-4 transition-transform duration-500 group-hover:scale-[1.02]">
            {/* Spotlight behind image */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="h-32 w-32 rounded-full bg-[#FF9900]/10 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#FF9900]/20" />
            </div>
            
            {hasDiscount && (
              <span className="absolute left-3 top-3 z-10 rounded-full border border-[#FF9900]/30 bg-[#FF9900]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#FF9900] backdrop-blur-md">
                -{discountPercentage.toFixed(0)}%
              </span>
            )}
            
            <img
              className="relative z-10 max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-2 group-hover:rotate-2"
              src={product.thumbnail}
              alt={product.title}
            />
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-1 flex-col pt-5">
          {/* Brand + status dot */}
          <div className="flex items-start justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500 transition-colors duration-300 group-hover:text-[#FF9900]/70">
              {product.brand || product.category}
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-gray-500">
                {inStock ? 'In Stock' : 'Sold Out'}
              </span>
              <span
                className={`relative flex h-2 w-2 ${inStock ? 'text-green-500' : 'text-red-500'}`}
              >
                {inStock && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
            </div>
          </div>

          {/* Title */}
          <Link to={`${product.title}`} className="mt-2 block">
            <h3 className="line-clamp-2 text-xl font-bold leading-snug text-white transition-colors duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">
              {product.title}
            </h3>
          </Link>

          {/* Category */}
          <p className="mt-1 text-xs capitalize text-gray-500">{product.category}</p>

          <div className="flex-1" />

          {/* Bottom Row */}
          <div className="mt-6 flex items-end justify-between border-t border-white/5 pt-4 transition-colors duration-300 group-hover:border-white/10">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-0.5">
                Price
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">₹{finalPrice.toFixed(2)}</span>
                {hasDiscount && <span className="text-xs text-gray-600 line-through decoration-red-500/50 decoration-wavy">₹{price.toFixed(2)}</span>}
              </div>
            </div>

            {/* ADD button */}
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className={`group/btn relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl px-5 font-mono text-xs uppercase tracking-[0.15em] font-bold transition-all duration-300 ${
                !inStock
                  ? 'cursor-not-allowed bg-white/5 text-gray-600'
                  : added
                  ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                  : 'bg-[#FF9900] text-black hover:bg-white hover:text-black hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Product = (props) => {
  const { productsData } = props;
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.amazon.userInfo);
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const { userCart, updateUserCart } = useCart();

  // Save a product to Backend cart
  const saveProductToBackend = async (product) => {
    try {
      const response = await axios.post("http://localhost:8000/api/v1/cart/items", {
        asin: product.id,
        quantity: 1
      }, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      const mappedItems = (response.data.items || []).map((item) => {
        const prod = item.product || {};
        return {
          id: item.asin,
          title: prod.title || "Unknown Product",
          price: prod.price ? parseFloat(prod.price) : 0.0,
          thumbnail: prod.img_url || "",
          images: prod.img_url ? [prod.img_url] : [],
          brand: prod.unit_size || "Q-Commerce",
          quantity: item.quantity,
          category: prod.category || "",
          description: prod.tags || "",
          rating: prod.stars || 0.0,
          stock: prod.stock_qty || 0,
          discountPercentage: 10,
        };
      });
      updateUserCart(mappedItems);
    } catch (error) {
      console.error("Error saving product to backend cart:", error);
    }
  };

  const handleButton = async (product) => {
    if (!authenticated) {
      dispatch(addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        images: product.images,
        thumbnail: product.thumbnail,
        brand: product.brand,
        quantity: 1,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock,
      }));
    } else {
      await saveProductToBackend(product);
      import('../../api/api').then(({ trackEvent }) => {
        trackEvent('cart_add', product.id, null, userInfo.token);
      });
    }
  };

  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {productsData.map((product, index) => (
        <ProductCard key={index} product={product} onAdd={handleButton} />
      ))}
    </div>
  );
};

export default Product;
