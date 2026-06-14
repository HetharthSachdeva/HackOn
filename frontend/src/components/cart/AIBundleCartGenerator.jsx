import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useCart } from '../../context/userCartContext';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';

const AIBundleCartGenerator = () => {
    const { aiImage: image, setAiImage: setImage } = useOutletContext();
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
        
        const stateImage = location.state?.aiImage;
        const statePrompt = location.state?.aiPrompt;

        if (urlPrompt || stateImage || statePrompt) {
            const finalPrompt = statePrompt || (urlPrompt ? decodeURIComponent(urlPrompt) : '');
            if (finalPrompt) {
                setPrompt(finalPrompt);
            }
            if (stateImage) {
                setImage(stateImage);
            } else {
                setImage(null); // Clear any previous image if doing a fresh text-only search from header
            }
            // Clear URL and navigation state immediately
            navigate('/cart', { replace: true, state: null });
            
            // Only auto-trigger search if it is a text-only query (no image uploaded)
            if (!stateImage && finalPrompt) {
                handleGenerate(null, finalPrompt, null);
            }
        }
    }, [location.search, location.state]);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async (e, overridePrompt, overrideImage) => {
        e?.preventDefault();
        const finalPrompt = overridePrompt !== undefined ? overridePrompt : prompt.trim();
        const finalImage = overrideImage !== undefined ? overrideImage : image;

        if (!finalPrompt && !finalImage) return;

        setIsGenerating(true);
        setError(null);
        setBundleData(null);

        try {
            const headers = userInfo?.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
            const { data } = await axios.post(
                'http://localhost:8000/api/v1/ai/cart-from-intent',
                { 
                    prompt: finalPrompt || null, 
                    image: finalImage || null,
                    max_items: 6 
                },
                { headers }
            );

            const mappedPrompt = finalPrompt || "Visual Snap-to-Cart";
            const mappedBundle = {
                title: data.explanation || `${mappedPrompt} — AI Bundle`,
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
            mappedBundle.components.forEach((comp) => {
                if (comp.options && comp.options.length > 0) {
                    // Pre-select the first option by default
                    initSel[comp.options[0].id] = true;
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

    const getSelectedBundleTotal = () => {
        if (!bundleData) return 0;
        let total = 0;
        bundleData.components.forEach((comp) => {
            comp.options.forEach((opt) => {
                if (selections[opt.id]) {
                    const qty = quantities[opt.id] || 1;
                    total += parseFloat(opt.price || 0) * qty;
                }
            });
        });
        return total;
    };

    const handleAddSelectionsToCart = async () => {
        if (!bundleData) return;
        setIsAddingToCart(true);

        const selectedProducts = [];
        bundleData.components.forEach((comp) => {
            comp.options.forEach((opt) => {
                if (selections[opt.id]) {
                    selectedProducts.push(opt);
                }
            });
        });

        try {
            for (const product of selectedProducts) {
                await addToCartBackend(product.id, quantities[product.id] || 1);
            }
            
            // Clear bundle after adding
            setBundleData(null);
            setPrompt('');
            setImage(null);
            
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
                
                <form onSubmit={handleGenerate} className="relative flex items-center w-full">
                    {image && (
                        <div className="absolute left-3 flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-1.5 z-10">
                            <img src={image} alt="Upload preview" className="h-8 w-8 object-cover rounded-md" />
                            <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-0.5 transition"
                                title="Remove image"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={image ? "Add helper text (optional)..." : "e.g. Snacks and drinks for a movie night with 5 friends..."}
                        className={`w-full rounded-xl bg-black/50 border border-white/10 py-4 pr-60 text-white placeholder-gray-600 outline-none focus:border-[#FF9900] transition ${image ? 'pl-20' : 'pl-5'}`}
                    />
                    
                    {/* Image Upload/Camera Trigger */}
                    <div className="absolute right-48 flex items-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="cart-image-upload"
                        />
                        <label
                            htmlFor="cart-image-upload"
                            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-[#FF9900] transition active:scale-95"
                            title="Add image (handwritten list or product photo)"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating || (!prompt.trim() && !image)}
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
                                        const isSelected = !!selections[opt.id];
                                        const qty = quantities[opt.id];
                                        return (
                                            <div 
                                                key={opt.id} 
                                                onClick={() => setSelections(prev => ({...prev, [opt.id]: !prev[opt.id]}))}
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
                                                        if (!isSelected) setSelections(prev => ({...prev, [opt.id]: true}));
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

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 pt-6 gap-4">
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Bundle Summary</span>
                            <div className="mt-1 flex items-baseline gap-3">
                                <span className="text-2xl font-black text-white">₹{getSelectedBundleTotal().toFixed(2)}</span>
                                <span className="text-xs text-gray-400 font-mono">
                                    ({Object.values(selections).filter(Boolean).length} items selected)
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleAddSelectionsToCart}
                            disabled={isAddingToCart || Object.values(selections).filter(Boolean).length === 0}
                            className="flex items-center gap-2 rounded-xl bg-[#FF9900] px-8 py-3.5 font-bold text-black transition hover:bg-[#ffae33] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                        >
                            {isAddingToCart ? 'Adding to Cart...' : 'Add Selected to Cart 🛒'}
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
