import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useCart } from '../../context/userCartContext';
import { useLocation, useNavigate } from 'react-router-dom';

const AIBundleCartGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [bundleData, setBundleData] = useState(null);

    // Bundle selection states
    const [selections, setSelections] = useState({});
    const [quantities, setQuantities] = useState({});
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [detailModalProduct, setDetailModalProduct] = useState(null);


    const userInfo = useSelector((state) => state.amazon.userInfo);
    const { addToCartBackend } = useCart();
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlPrompt = params.get('aiPrompt');
        if (urlPrompt) {
            const decoded = decodeURIComponent(urlPrompt);
            setPrompt(decoded);
            navigate('/cart', { replace: true });
            handleGenerate(null, decoded);
        }
    }, [location.search]);

    const handleGenerate = async (e, overridePrompt) => {
        e?.preventDefault();
        const finalPrompt = overridePrompt || prompt.trim();
        if (!finalPrompt) return;

        setIsGenerating(true);
        setError(null);
        setBundleData(null);

        try {
            const headers = userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
            const { data } = await axios.post(
                'http://localhost:8000/api/v1/ai/cart-from-intent',
                { prompt: finalPrompt, max_items: 6 },
                { headers }
            );

            const mappedBundle = {
                title: data.explanation || `${finalPrompt} — AI Bundle`,
                confidence: data.used_semantic ? 96 : 82,
                components: (data.components || []).map((comp) => ({
                    name: comp.component_name,
                    options: comp.options.map((item) => ({
                        id: item.asin,
                        name: item.title,
                        price: parseFloat(item.unit_price || 0).toFixed(2),
                        quantity: item.quantity || 1,
                        image: item.img_url || `https://placehold.co/200x200/141414/FF9900?text=${encodeURIComponent(item.title.slice(0, 8))}`,
                        rationale: item.rationale,
                    }))
                }))
            };

            setBundleData(mappedBundle);

            // Initialize selections
            const initSel = {};
            const initQty = {};
            mappedBundle.components.forEach((comp, i) => {
                if (comp.options && comp.options.length > 0) {
                    initSel[i] = comp.options[0].id;
                    comp.options.forEach(opt => {
                        initQty[opt.id] = opt.quantity;
                    });
                }
            });
            setSelections(initSel);
            setQuantities(initQty);

        } catch (err) {
            console.error('AI bundle error:', err);
            setError(err.response?.data?.detail || 'Could not generate bundle. Try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const updateQuantity = (productId, delta) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) + delta)
        }));
    };

    const handleAddSelectionsToCart = async () => {
        if (!bundleData) return;
        setIsAddingToCart(true);

        const selectedProducts = bundleData.components.map((comp, i) => {
            return comp.options.find(o => o.id === selections[i]);
        }).filter(Boolean);

        try {
            for (const product of selectedProducts) {
                await addToCartBackend(product.id, quantities[product.id] || 1);
            }
            
            // Clear bundle after adding
            setBundleData(null);
            setPrompt('');
            
            // Show toast
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-[#FF9900] text-black px-6 py-3 rounded-lg shadow-lg z-50 font-bold';
            toast.innerHTML = `✅ Added ${selectedProducts.length} bundle items to your cart!`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('❌ Sorry, couldn\'t add to cart. Please try again!');
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className="mt-12 rounded-2xl border border-[#FF9900]/30 bg-[#111111] overflow-hidden shadow-[0_0_30px_rgba(255,153,0,0.05)]">
            {/* Header / Input Area */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#FF9900]/10 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">✨</span>
                    <h2 className="text-xl font-black text-white">AI Bundle Generator</h2>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                    Tell us what you need, and our AI will curate the perfect mix-and-match bundle directly into your cart.
                </p>
                
                <form onSubmit={handleGenerate} className="relative flex items-center">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Snacks and drinks for a movie night with 5 friends..."
                        className="w-full rounded-xl bg-black/50 border border-white/10 px-5 py-4 text-white placeholder-gray-600 outline-none focus:border-[#FF9900] transition"
                    />
                    <button
                        type="submit"
                        disabled={isGenerating || !prompt.trim()}
                        className="absolute right-2 rounded-lg bg-[#FF9900] px-6 py-2.5 font-bold text-black transition hover:bg-[#ffae33] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Curating...' : 'Generate Bundle'}
                    </button>
                </form>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            </div>

            {/* Generated Bundle Area */}
            {bundleData && (
                <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2">{bundleData.title}</h3>
                    <p className="text-sm text-[#FF9900] mb-6 font-mono tracking-widest uppercase">
                        Select your preferred options <span className="text-[10px] text-gray-500 lowercase normal-case ml-2">(Click again to omit)</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {bundleData.components.map((comp, compIdx) => (
                            <div key={compIdx} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                                <div className="bg-white/5 px-4 py-2 font-mono text-xs uppercase tracking-wider text-gray-300 border-b border-white/5">
                                    {comp.name}
                                </div>
                                <div className="p-3 space-y-2">
                                    {comp.options?.map(opt => {
                                        const isSelected = selections[compIdx] === opt.id;
                                        const qty = quantities[opt.id];
                                        return (
                                            <div 
                                                key={opt.id} 
                                                onClick={() => setSelections(prev => ({...prev, [compIdx]: prev[compIdx] === opt.id ? null : opt.id}))}
                                                className={`cursor-pointer flex items-center gap-3 rounded-lg p-2.5 transition border ${isSelected ? 'border-[#FF9900] bg-[#FF9900]/10' : 'border-transparent hover:bg-white/5'}`}
                                            >
                                                <div className="h-12 w-12 flex-shrink-0 rounded bg-[#141414] p-1">
                                                    <img src={opt.image} alt={opt.name} className="h-full w-full object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h4 className={`truncate text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{opt.name}</h4>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDetailModalProduct({ asin: opt.id, rationale: opt.rationale });
                                                            }}
                                                            className="text-gray-500 hover:text-[#FF9900] transition active:scale-90 flex-shrink-0"
                                                            title="View Product Insights"
                                                        >
                                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="mt-1 flex items-baseline gap-2">
                                                        <span className={`font-bold text-xs ${isSelected ? 'text-[#FF9900]' : 'text-gray-500'}`}>
                                                            ₹{(parseFloat(opt.price) * qty).toFixed(2)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                            {qty}x
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Quantity Stepper */}
                                                <div 
                                                    className="flex flex-shrink-0 items-center gap-1 rounded bg-black p-1 ring-1 ring-white/10" 
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        if (!isSelected) setSelections(prev => ({...prev, [compIdx]: opt.id}));
                                                    }}
                                                >
                                                    <button onClick={() => updateQuantity(opt.id, -1)} className="h-6 w-6 rounded text-gray-400 hover:bg-white/20 hover:text-white transition">−</button>
                                                    <span className="w-5 text-center text-xs font-semibold text-white">{qty}</span>
                                                    <button onClick={() => updateQuantity(opt.id, 1)} className="h-6 w-6 rounded text-gray-400 hover:bg-white/20 hover:text-white transition">+</button>
                                                </div>
                                                
                                                <div className={`ml-2 h-4 w-4 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-[#FF9900]' : 'border-gray-600'}`}>
                                                    {isSelected && <div className="h-2 w-2 rounded-full bg-[#FF9900]" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                        <button
                            onClick={handleAddSelectionsToCart}
                            disabled={isAddingToCart}
                            className="flex items-center gap-2 rounded-xl bg-[#FF9900] px-8 py-3.5 font-bold text-black transition hover:bg-[#ffae33] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isAddingToCart ? 'Adding to Cart...' : 'Add Selected Bundle to Cart 🛒'}
                        </button>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {detailModalProduct && (
                <ProductDetailModal
                    asin={detailModalProduct.asin}
                    rationale={detailModalProduct.rationale}
                    onClose={() => setDetailModalProduct(null)}
                />
            )}
        </div>
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

export default AIBundleCartGenerator;
