import React, { useState, useEffect } from 'react';
import ProductReplacePanel from './ProductReplacePanel';
import { useCart } from '../../context/userCartContext';
import { useSelector } from 'react-redux';
import axios from 'axios';


const AIBundleCard = ({ bundle, onOptimize }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showReplacePanel, setShowReplacePanel] = useState(false);
    const [bundleProducts, setBundleProducts] = useState(bundle.products);
    const [bundleCost, setBundleCost] = useState(bundle.totalCost);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [activeOptimize, setActiveOptimize] = useState('cheapest');
    const [detailModalProduct, setDetailModalProduct] = useState(null);


    const { userCart, updateUserCart, addToCartBackend } = useCart();
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);

    const discountFactor = Number(bundle.totalCost) > 0 ? (Number(bundle.savings) / Number(bundle.totalCost)) : 0.1;
    const currentSavings = bundleCost * discountFactor;
    const tax = Math.max(0, (bundleCost - currentSavings) * 0.06);
    const finalTotal = Math.max(0, bundleCost - currentSavings + tax);

    const updateQuantity = (productIdx, delta) => {
        const updatedProducts = bundleProducts.map((p, idx) => {
            if (idx === productIdx) {
                const newQty = Math.max(1, (p.quantity || 1) + delta);
                return { ...p, quantity: newQty };
            }
            return p;
        });

        // Calculate new total cost based on unit price * quantity
        const newCost = updatedProducts.reduce((sum, p) => sum + (parseFloat(p.price) * (p.quantity || 1)), 0);

        setBundleProducts(updatedProducts);
        setBundleCost(newCost);
    };

    const handleReplaceProduct = (product) => {
        setSelectedProduct(product);
        setShowReplacePanel(true);
    };

    const handleSelectAlternative = (alternative) => {
        // Update bundle with new product, maintaining the existing quantity
        const updatedProducts = bundleProducts.map(p => 
            p.name === selectedProduct.name ? { ...alternative.product, quantity: selectedProduct.quantity || 1 } : p
        );
        
        // Calculate new total cost
        const newCost = updatedProducts.reduce((sum, p) => sum + (parseFloat(p.price) * (p.quantity || 1)), 0);
        
        setBundleProducts(updatedProducts);
        setBundleCost(newCost);
        setShowReplacePanel(false);
        
        // Show success message
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-[#FF9900] text-black font-bold px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `✅ Replaced! New total: ₹${newCost.toFixed(2)}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }, 300);
    };

    const handleAddAllToCart = async () => {
        if (!authenticated) {
            alert('🔒 Please sign in to add items to your cart!');
            return;
        }

        setIsAddingToCart(true);

        try {
            // Add each bundle product to cart sequentially with its selected quantity
            for (const product of bundleProducts) {
                await addToCartBackend(product.id, product.quantity || 1);
            }

            // Show success message
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-[#FF9900] text-black px-8 py-4 rounded-2xl shadow-2xl z-50 animate-slide-down flex items-center gap-3';
            toast.innerHTML = `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                     <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                    <div class="font-bold">Bundle Added!</div>
                    <div class="text-sm opacity-80">${bundleProducts.reduce((sum, p) => sum + (p.quantity || 1), 0)} items added to cart</div>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);

        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('❌ Sorry, couldn\'t add to cart. Please try again!');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleAddSingleToCart = async (product) => {
        if (!authenticated) {
            alert('🔒 Please sign in to add items to your cart!');
            return;
        }

        try {
            await addToCartBackend(product.id, product.quantity || 1);

            // Show toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `✅ ${product.name.substring(0, 30)}... added!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error adding to cart');
        }
    };

    return (
        <>
            <div className="mx-auto max-w-[1500px] px-6 py-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* ── Left column ── */}
                    <div className="lg:col-span-2">
                        {/* Heading */}
                        <div className="mb-6">
                            <h1 className="flex items-center gap-3 text-4xl font-black text-white">
                                <span className="text-[#FF9900]">✨</span> AI Generated Bundle
                            </h1>
                            <p className="mt-2 text-sm text-gray-400">
                                We've curated the perfect selection based on your recent searches and preferences.
                            </p>
                        </div>

                        {/* Stat tiles */}
                        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Total Cost</p>
                                <p className="mt-2 text-2xl font-black text-white">₹{Number(finalTotal).toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border-2 border-[#FF9900] bg-[#FF9900]/5 p-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF9900]">You Save</p>
                                <p className="mt-2 text-2xl font-black text-[#FF9900]">₹{Number(currentSavings).toFixed(2)}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Delivery Time</p>
                                <p className="mt-2 text-2xl font-black text-white">~{bundle.deliveryETA}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">AI Match</p>
                                <p className="mt-2 text-2xl font-black text-white">{bundle.confidence}%</p>
                            </div>
                        </div>

                        {/* Included items */}
                        <p className="mb-3 font-mono text-sm uppercase tracking-[0.2em] text-gray-400">Included Items</p>
                        <div className="mb-4 border-b border-white/10" />
                        <div className="space-y-4">
                            {bundleProducts.map((product, idx) => (
                                <div key={idx} className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#141414] p-1.5">
                                        <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="truncate font-bold text-white">{product.name}</h4>
                                            <button
                                                onClick={() => setDetailModalProduct({ asin: product.id, rationale: product.rationale })}
                                                className="text-gray-400 hover:text-[#FF9900] transition active:scale-90 flex-shrink-0"
                                                title="View Product Insights"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.0} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-1.5 flex items-baseline gap-2">
                                            {product.originalPrice && product.originalPrice !== product.price && (
                                                <span className="text-sm text-gray-600 line-through">
                                                    ₹{(parseFloat(product.originalPrice) * (product.quantity || 1)).toFixed(2)}
                                                </span>
                                            )}
                                            <span className="font-bold text-[#FF9900]">
                                                ₹{(parseFloat(product.price) * (product.quantity || 1)).toFixed(2)}
                                            </span>
                                            {(product.quantity || 1) > 1 && (
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    (₹{parseFloat(product.price).toFixed(2)} each)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quantity stepper like in the cart */}
                                    <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
                                        <button
                                            onClick={() => updateQuantity(idx, -1)}
                                            className="grid h-8 w-8 place-items-center rounded-md text-gray-300 transition hover:bg-white/10 hover:text-white"
                                            aria-label="Decrease quantity"
                                        >
                                            −
                                        </button>
                                        <span className="w-8 text-center font-semibold text-white">{product.quantity || 1}</span>
                                        <button
                                            onClick={() => updateQuantity(idx, 1)}
                                            className="grid h-8 w-8 place-items-center rounded-md text-gray-300 transition hover:bg-white/10 hover:text-white"
                                            aria-label="Increase quantity"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleReplaceProduct(product)}
                                        className="flex flex-shrink-0 items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-gray-200 transition hover:border-[#FF9900] hover:text-[#FF9900]"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Replace
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Optimize bundle */}
                        <div className="mt-8 rounded-xl border border-white/10 bg-[#0d0d0d] p-5">
                            <h3 className="mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-[0.2em] text-gray-300">
                                <svg className="h-4 w-4 text-[#FF9900]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                                Optimize Your Bundle
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {['Cheapest', 'Healthiest', 'Most Popular', 'High Protein', 'Vegan'].map((label) => {
                                    const key = label.toLowerCase();
                                    const on = activeOptimize === key;
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => { setActiveOptimize(key); onOptimize(key); }}
                                            className={`rounded-full px-5 py-2 font-mono text-xs uppercase tracking-wider transition ${
                                                on ? 'border border-[#FF9900] bg-[#FF9900]/10 text-[#FF9900]' : 'border border-white/15 text-gray-300 hover:border-white/40 hover:text-white'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: Bundle Summary ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 overflow-hidden rounded-2xl border-t-2 border-[#FF9900] bg-[#0f0f0f] p-6 ring-1 ring-white/10">
                            <h2 className="text-2xl font-black text-white">Bundle Summary</h2>

                            <div className="mt-6 space-y-3 text-sm">
                                <div className="flex justify-between text-gray-300">
                                    <span>Items Total ({bundleProducts.reduce((sum, p) => sum + (p.quantity || 1), 0)} items)</span>
                                    <span className="font-semibold text-white">₹{Number(bundleCost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Bundle Discount</span>
                                    <span className="font-semibold text-[#FF9900]">-₹{Number(currentSavings).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Tax (6%)</span>
                                    <span className="font-semibold text-white">₹{Number(tax).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-300">
                                    <span className="flex items-center gap-1">Delivery Fee <span className="text-gray-600">ⓘ</span></span>
                                    <span className="font-bold text-[#FF9900]">FREE</span>
                                </div>
                            </div>

                            <div className="my-5 border-t border-white/10" />

                            <div className="flex items-center justify-between">
                                <span className="text-lg text-gray-300">Total</span>
                                <span className="text-3xl font-black text-white">₹{Number(finalTotal).toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleAddAllToCart}
                                disabled={isAddingToCart}
                                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF9900] py-3 font-bold text-black transition hover:bg-[#ffae33] ${isAddingToCart ? 'opacity-70' : ''}`}
                            >
                                {isAddingToCart ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                                        Adding…
                                    </>
                                ) : (
                                    <>
                                        Add Bundle to Cart
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </>
                                )}
                            </button>

                            <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">
                                🔒 Secure Encrypted Checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replace Product Side Panel */}
            {showReplacePanel && (
                <ProductReplacePanel
                    product={selectedProduct}
                    onClose={() => setShowReplacePanel(false)}
                    onSelect={handleSelectAlternative}
                />
            )}

            {/* Product Detail Modal */}
            {detailModalProduct && (
                <ProductDetailModal
                    asin={detailModalProduct.asin}
                    rationale={detailModalProduct.rationale}
                    onClose={() => setDetailModalProduct(null)}
                />
            )}

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slide-down { from { opacity: 0; transform: translateY(-100px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
                .animate-slide-down { animation: slide-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>
        </>
    );
};

// --- Product Detail Modal Component ---
const ProductDetailModal = ({ asin, rationale, onClose }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchDetail = async () => {
            try {
                const { data } = await axios.get(`http://localhost:8000/api/v1/catalog/products/${asin}`);
                if (isMounted) {
                    setProduct(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching product detail:", err);
                if (isMounted) {
                    setError("Could not load product details.");
                    setLoading(false);
                }
            }
        };
        fetchDetail();
        return () => { isMounted = false; };
    }, [asin]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl transition-all duration-300 ring-1 ring-white/5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-white transition text-2xl font-light"
                    aria-label="Close dialog"
                >
                    &times;
                </button>

                {/* AI Rationale Banner */}
                <div className="mb-6 rounded-xl border border-[#FF9900]/30 bg-[#FF9900]/5 p-4 shadow-[inset_0_0_12px_rgba(255,153,0,0.02)]">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#FF9900] mb-1.5 flex items-center gap-1.5 font-bold">
                        <span>✨</span> AI Rationale
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed italic">
                        "{rationale || 'Selected based on your preferences.'}"
                    </p>
                </div>

                {loading ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF9900] border-t-transparent" />
                        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Loading details...</p>
                    </div>
                ) : error ? (
                    <p className="text-center text-sm text-red-400 py-8 font-mono">{error}</p>
                ) : (
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Left: Product Image */}
                        <div className="h-32 w-32 mx-auto sm:mx-0 flex-shrink-0 overflow-hidden rounded-xl bg-[#141414] p-3 border border-white/5 flex items-center justify-center">
                            <img src={product.img_url || `https://placehold.co/200x200/141414/FF9900?text=${encodeURIComponent(product.title.slice(0, 8))}`} alt={product.title} className="h-full w-full object-contain" />
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            <h3 
                                className="text-lg font-bold text-white leading-snug"
                                style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                title={product.title}
                            >
                                {product.title}
                            </h3>
                            <p className="mt-1 font-mono text-xs text-gray-500">{product.category}</p>
                            
                            <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                                <span className="text-2xl font-black text-[#FF9900]">₹{Number(product.price).toFixed(2)}</span>
                                {product.unit_size && (
                                    <span className="rounded bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-gray-400">
                                        {product.unit_size}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 flex flex-col gap-2 font-mono text-xs text-gray-400">
                                <div className="flex items-center justify-center sm:justify-start gap-1">
                                    <span className="text-[#FF9900] text-sm">★</span>
                                    <span className="text-white font-bold">{product.stars?.toFixed(1) || 'N/A'}</span>
                                    <span className="text-gray-600">({product.reviews || 0} reviews)</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span>⏱️ Delivery:</span>
                                    <span className="text-green-400 font-bold">{product.delivery_time_mins || 10} mins</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <span>📦 Stock:</span>
                                    <span className={product.in_stock ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                        {product.in_stock ? `${product.stock_qty || 10} in stock` : 'Out of stock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end border-t border-white/5 pt-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 px-6 py-2.5 text-xs font-mono uppercase text-gray-300 transition hover:text-white active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIBundleCard;
