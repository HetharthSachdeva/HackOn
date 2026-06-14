import React, { useState, useEffect, Suspense } from 'react';
import { ScrollRestoration, Link, useRouteLoaderData, useParams, Await } from 'react-router-dom';
import { star, halfStar, emptyStar, offers, delivery, cod, exchange, delivered, transaction } from "../../assets/index";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, buyNow } from '../../redux/amazonSlice';
import axios from 'axios';
import { useCart } from '../../context/userCartContext';

const ProductDetailsContent = ({ productsData }) => {
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const userInfo = useSelector((state) => state.amazon.userInfo);
  const { userCart, updateUserCart } = useCart();
  const { title } = useParams();

  const initialProduct = productsData.find((p) => p.title === title);
  const [product, setProduct] = useState(initialProduct || null);
  const [isLoading, setIsLoading] = useState(!initialProduct);

  useEffect(() => {
    let isMounted = true;
    if (!initialProduct) {
      setIsLoading(true);
      axios.get(`/api/v1/catalog/search?q=${encodeURIComponent(title)}`)
        .then((response) => {
          if (!isMounted) return;
          const items = response.data.items || [];
          const found = items.find((p) => p.title === title);
          if (found) {
            setProduct({
              id: found.asin,
              title: found.title,
              category: found.category,
              price: found.price,
              thumbnail: found.img_url,
              images: found.img_url ? [found.img_url] : [],
              rating: found.stars || 0.0,
              brand: found.unit_size || "Q-Commerce",
              description: `Category: ${found.category}. Tags: ${found.tags}. Delivery in ${found.delivery_time_mins} mins.`,
              stock: found.stock_qty || 0,
              discountPercentage: 10,
            });
          }
        })
        .catch(err => console.error("Error fetching missing product:", err))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => { isMounted = false; };
  }, [title, initialProduct]);

  const [cartButton, setCartButton] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!product || !product.images) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product]);

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-white min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mb-4"></div>
        <div className="text-xl font-bold tracking-widest uppercase text-gray-500">Loading Product...</div>
      </div>
    );
  }

  if (!product) {
    return <div className="py-32 flex items-center justify-center text-white text-3xl font-black tracking-widest uppercase min-h-screen bg-[#0a0a0a]">Product not found</div>;
  }

  const handleImageClick = (index) => setCurrentImageIndex(index);
  const handleQuantityChange = (event) => setSelectedQuantity(parseInt(event.target.value, 10));

  const saveProductToBackend = async (product) => {
    try {
      const response = await axios.post("/api/v1/cart/items", {
        asin: product.id,
        quantity: selectedQuantity
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const mappedItems = (response.data.items || []).map((item) => {
        const prod = item.product || {};
        return {
          id: item.asin, title: prod.title || "Unknown Product", price: prod.price ? parseFloat(prod.price) : 0.0,
          thumbnail: prod.img_url || "", images: prod.img_url ? [prod.img_url] : [],
          brand: prod.unit_size || "Q-Commerce", quantity: item.quantity, category: prod.category || "",
          description: prod.tags || "", rating: prod.stars || 0.0, stock: prod.stock_qty || 0, discountPercentage: 10,
        };
      });
      updateUserCart(mappedItems);
    } catch (error) {
      console.error("Error saving product to backend cart:", error);
    }
  }

  const handleAddToCart = (product) => {
    if (!authenticated) {
      dispatch(addToCart({
        id: product.id, title: product.title, price: product.price, description: product.description,
        category: product.category, images: product.images, thumbnail: product.thumbnail, brand: product.brand,
        quantity: selectedQuantity, discountPercentage: product.discountPercentage, rating: product.rating, stock: product.stock
      }));
    } else {
      saveProductToBackend(product);
    }
  }

  const handleBuyNow = (product) => {
    if (authenticated) {
      dispatch(buyNow({
        id: product.id, title: product.title, price: product.price, description: product.description,
        category: product.category, images: product.images, thumbnail: product.thumbnail, brand: product.brand,
        quantity: selectedQuantity, discountPercentage: product.discountPercentage, rating: product.rating, stock: product.stock
      }));
    }
  }

  return (
    <div className='min-h-screen bg-[#0a0a0a] px-4 py-12 sm:px-8 lg:px-16 relative overflow-hidden font-sans'>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/3 top-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.07] blur-[150px]">
         <div className="h-[800px] w-[800px] rounded-full bg-[#FF9900]" />
      </div>

      <ScrollRestoration />
      
      <div className='mx-auto max-w-[1600px] relative z-10'>
        {/* Breadcrumb / Top bar */}
        <div className="mb-12 flex flex-wrap items-center text-sm font-mono uppercase tracking-[0.2em] text-gray-500">
          <Link to="/" className="hover:text-[#FF9900] transition-colors">Home</Link>
          <span className="mx-4 opacity-30">/</span>
          <Link to={`/${product.category}`} className="hover:text-[#FF9900] transition-colors">{product.category}</Link>
          <span className="mx-4 opacity-30">/</span>
          <span className="text-gray-300 line-clamp-1 max-w-lg">{product.title}</span>
        </div>

        <div className='flex flex-col lg:flex-row gap-16 xl:gap-24'>
          
          {/* LEFT COLUMN: Images & Description */}
          <div className='flex-1 flex flex-col gap-16'>
            
            <div className='flex gap-6 h-auto lg:h-[700px]'>
              {/* Thumbnails */}
              <div className='flex flex-col gap-4 overflow-y-auto no-scrollbar w-24 flex-shrink-0'>
                {product.images.map((item, index) => (
                  <button 
                    key={index} 
                    onClick={() => handleImageClick(index)}
                    className={`relative overflow-hidden rounded-2xl bg-[#0e0e11] ring-1 transition-all duration-300 aspect-square flex-shrink-0 ${
                      currentImageIndex === index 
                        ? 'ring-[#FF9900] ring-2 opacity-100 scale-100 shadow-[0_0_20px_rgba(255,153,0,0.2)]' 
                        : 'ring-white/10 opacity-50 hover:opacity-100 hover:scale-105 hover:ring-white/30'
                    }`}
                  >
                    <img src={item} alt="" className='h-full w-full object-contain p-3' />
                  </button>
                ))}
              </div>
              
              {/* Main Image */}
              <div className='relative flex-1 rounded-[2.5rem] bg-[#0e0e11] ring-1 ring-white/5 overflow-hidden flex items-center justify-center p-12 group transition-colors duration-500 hover:ring-white/10'>
                 <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="h-80 w-80 rounded-full bg-[#FF9900]/5 blur-[100px] transition-all duration-700 group-hover:scale-[1.8] group-hover:bg-[#FF9900]/10" />
                 </div>
                 {product.discountPercentage > 0 && (
                   <span className="absolute left-8 top-8 z-10 rounded-full bg-[#FF9900] px-5 py-2 font-mono text-sm font-black uppercase tracking-widest text-black shadow-xl">
                     {product.discountPercentage.toFixed(0)}% OFF
                   </span>
                 )}
                 <img 
                   src={product.images[currentImageIndex]} 
                   className='relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_40px_50px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-3' 
                   alt="productImage" 
                 />
              </div>
            </div>

            {/* Description & Features Below Image */}
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-12 bg-white/[0.02] rounded-[2.5rem] p-10 ring-1 ring-white/5'>
              <div className='xl:col-span-2'>
                <h3 className="text-lg font-bold uppercase tracking-[0.25em] text-white mb-6 flex items-center gap-4">
                  <span className="h-px w-10 bg-[#FF9900] inline-block"></span>
                  About this item
                </h3>
                <p className='text-gray-400 leading-[2] text-xl font-medium'>{product.description || "Experience premium quality and exceptional performance with this carefully curated product designed for modern needs. Features industry-leading materials and rigorous testing for maximum durability."}</p>
              </div>

              <div className='flex flex-col gap-6 xl:border-l xl:border-white/5 xl:pl-12 justify-center'>
                 {[
                   { icon: delivery, title: "Fast Delivery", subtitle: "Within 24hrs" },
                   { icon: cod, title: "Pay on Delivery", subtitle: "Available" },
                   { icon: exchange, title: "7 Days Return", subtitle: "Easy policies" }
                 ].map((feat, idx) => (
                   <div key={idx} className="flex items-center gap-5 group/feat">
                      <div className="h-14 w-14 rounded-2xl bg-[#141414] ring-1 ring-white/5 flex items-center justify-center shadow-inner transition-all duration-300 group-hover/feat:bg-[#1a1a1a] group-hover/feat:scale-110 group-hover/feat:ring-white/20">
                        <img src={feat.icon} alt={feat.title} className='w-6 h-6 opacity-80 group-hover/feat:opacity-100' />
                      </div>
                      <div>
                        <p className='text-sm font-mono uppercase tracking-[0.1em] font-bold text-gray-300 mb-1'>{feat.title}</p>
                        <p className='text-xs font-mono tracking-wider text-gray-500'>{feat.subtitle}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Title, Rating & Checkout Box */}
          <div className='lg:w-[480px] xl:w-[550px] flex-shrink-0 flex flex-col gap-10'>
            
            {/* Title & Rating */}
            <div>
              <div className="inline-block rounded-full bg-[#FF9900]/10 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF9900] ring-1 ring-[#FF9900]/30 mb-6">
                 {product.brand || product.category}
              </div>
              
              <h1 className='text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.15] text-white mb-8 transition-colors duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:to-gray-400'>
                 {product.title}
              </h1>
              
              <div className='flex flex-wrap items-center gap-5'>
                <div className='flex items-center bg-[#FF9900] px-4 py-2 rounded-full shadow-[0_0_15px_rgba(255,153,0,0.3)]'>
                  <span className="font-black text-black mr-2 text-base">{product.rating?.toFixed(1) || '4.5'}</span>
                  <span className='flex items-center'>
                    {[1, 2, 3, 4, 5].map((starIndex) => (
                      <img key={starIndex} className='w-4 h-4 mr-0.5 brightness-0' src={starIndex <= product.rating ? star : (starIndex - 0.5 <= product.rating ? halfStar : emptyStar)} alt={`star`} />
                    ))}
                  </span>
                </div>
                <span className='text-base text-gray-400 font-mono'>{product.stock * 10 || 124} Reviews</span>
                <span className="text-gray-600 text-lg">•</span>
                <span className='text-base text-green-400 font-mono uppercase tracking-widest font-bold'>In Stock</span>
              </div>
            </div>

            {/* Checkout Box */}
            <div className='sticky top-32 rounded-[2.5rem] bg-[#0d0d0f] ring-1 ring-white/10 p-10 xl:p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] transition-all duration-500 hover:ring-white/20'>
              
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="mb-10 pb-10 border-b border-white/5">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">Total Price</p>
                <div className='flex items-end gap-4'>
                  <span className='text-6xl font-black text-white tracking-tight'>₹{product.price}</span>
                  {product.discountPercentage > 0 && (
                     <span className='text-2xl font-bold text-gray-600 line-through decoration-red-500/50 mb-1'>₹{(parseFloat(product.price) / (1 - product.discountPercentage/100)).toFixed(2)}</span>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-400 font-mono tracking-wide bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/5">Inclusive of all taxes</p>
              </div>

              <div className='mb-10'>
                <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-4">Quantity</label>
                <div className="relative group/qty">
                  <select 
                    className='w-full bg-[#141414] text-white font-bold text-xl border-none ring-1 ring-white/10 rounded-2xl focus:ring-[#FF9900]/50 cursor-pointer appearance-none px-6 py-5 transition-all hover:bg-[#1a1a1a]' 
                    value={selectedQuantity} 
                    onChange={handleQuantityChange}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num} className="bg-[#141414]">{num}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-gray-400 group-hover/qty:text-white transition-colors">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {cartButton ? (
                  <Link to="/cart" className="block">
                    <button className="w-full relative overflow-hidden rounded-2xl bg-[#141414] px-8 py-6 font-mono text-base font-bold uppercase tracking-[0.2em] text-white ring-1 ring-white/20 transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98]">
                      Go to Cart
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      handleAddToCart(product);
                      setCartButton(true);
                    }}
                    className="w-full relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6 font-mono text-base font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Add to Cart
                  </button>
                )}

                <Link to={authenticated ? "/checkout" : "/signIn"} className="block" onClick={(e) => {
                  if (authenticated) handleBuyNow(product);
                }}>
                  <button className="w-full relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#FF9900] px-8 py-6 font-mono text-base font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:shadow-[0_0_40px_rgba(255,153,0,0.5)] hover:bg-[#ffb145] hover:scale-[1.02] active:scale-[0.98]">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Buy Now
                  </button>
                </Link>
              </div>

              <div className="mt-8 pt-6">
                 <p className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-[0.1em] font-bold text-gray-500">
                    <svg className="h-5 w-5 text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    100% Secure Transaction
                 </p>
              </div>

            </div>
          </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

const ProductDetails = () => {
  const data = useRouteLoaderData("root");

  return (
    <Suspense fallback={<div className="flex justify-center py-32"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900]"></div></div>}>
      <Await resolve={data.data}>
        {(resolvedData) => <ProductDetailsContent productsData={resolvedData.products} />}
      </Await>
    </Suspense>
  );
};

export default ProductDetails;



