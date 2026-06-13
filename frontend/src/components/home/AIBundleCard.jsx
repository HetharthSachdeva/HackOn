import React, { useState } from 'react';
import ProductReplacePanel from './ProductReplacePanel';
import { useCart } from '../../context/userCartContext';
import { useSelector } from 'react-redux';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase.config';

const AIBundleCard = ({ bundle, onOptimize }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showReplacePanel, setShowReplacePanel] = useState(false);
    const [bundleProducts, setBundleProducts] = useState(bundle.products);
    const [bundleCost, setBundleCost] = useState(bundle.totalCost);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const { userCart, updateUserCart } = useCart();
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);

    const handleReplaceProduct = (product) => {
        setSelectedProduct(product);
        setShowReplacePanel(true);
    };

    const handleSelectAlternative = (alternative) => {
        // Update bundle with new product
        const updatedProducts = bundleProducts.map(p => 
            p.name === selectedProduct.name ? alternative.product : p
        );
        
        // Calculate new total cost
        const newCost = updatedProducts.reduce((sum, p) => sum + p.price, 0);
        
        setBundleProducts(updatedProducts);
        setBundleCost(newCost);
        setShowReplacePanel(false);
        
        // Show success message
        setTimeout(() => {
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-lime-400 text-black font-bold px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
            toast.innerHTML = `✅ Replaced! New total: $${newCost}`;
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
            let updatedCart = [...userCart];

            // Add each bundle product to cart (treating each as 1 item regardless of quantity in bundle)
            bundleProducts.forEach((product) => {
                console.log('Adding product to cart:', product); // Debug log
                const productTitle = product.name || product.title || 'Unknown Product';
                const existingProduct = updatedCart.find(item => item.title === productTitle);
                
                if (existingProduct) {
                    // Increment quantity by 1 (not by product.quantity)
                    updatedCart = updatedCart.map(item =>
                        item.title === productTitle
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    // Add new product with quantity 1 - using 'title' field for cart compatibility
                    const cartItem = {
                        id: `bundle-${Date.now()}-${Math.random()}`, // Generate unique ID
                        title: productTitle, // Cart component uses 'title' field - THIS IS CRITICAL
                        price: product.price,
                        oldPrice: product.originalPrice || product.price,
                        quantity: 1, // Always add as 1 item
                        image: product.image,
                        thumbnail: product.image,
                        category: 'bundle',
                        rating: product.rating || 4.5,
                        stock: 100,
                        brand: 'Bundle Item',
                        description: `Part of AI recommended bundle`
                    };
                    console.log('Cart item being added:', cartItem); // Debug log
                    updatedCart.push(cartItem);
                }
            });

            // Update Firebase
            const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
            await setDoc(userCartRef, { cart: updatedCart });

            // Update local cart state
            updateUserCart(updatedCart);

            // Show success message
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-lime-400 text-black px-8 py-4 rounded-2xl shadow-2xl z-50 animate-slide-down flex items-center gap-3';
            toast.innerHTML = `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <div>
                    <div class="font-bold">Bundle Added!</div>
                    <div class="text-sm opacity-80">${bundleProducts.length} items added to cart</div>
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
            const existingProduct = userCart.find(item => item.name === product.name);
            let updatedCart;

            if (existingProduct) {
                updatedCart = userCart.map(item =>
                    item.name === product.name
                        ? { ...item, quantity: item.quantity + product.quantity }
                        : item
                );
            } else {
                updatedCart = [...userCart, {
                    id: Date.now() + Math.random(),
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice || product.price,
                    quantity: product.quantity,
                    image: product.image,
                    category: 'bundle',
                    rating: product.rating || 4.5,
                    stock: 100
                }];
            }

            // Update Firebase
            const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
            await setDoc(userCartRef, { cart: updatedCart });
            updateUserCart(updatedCart);

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
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Bundle Summary Card */}
                <div className="bg-[#151c2b] rounded-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
                    {/* Header */}
                    <div className="relative bg-[#0e1420] p-8 text-white overflow-hidden">
                        {/* Animated glow accents */}
                        <div className="absolute inset-0 opacity-100">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-lime-400/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl animate-pulse delay-1000"></div>
                        </div>

                        <div className="relative z-10">
                            {/* AI Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400/15 ring-1 ring-lime-400/30 rounded-full mb-4">
                                <svg className="w-5 h-5 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                                <span className="text-sm font-bold text-lime-300">AI Generated Bundle</span>
                            </div>

                            {/* Bundle Title */}
                            <h2 className="text-3xl md:text-4xl font-black mb-6 text-white">
                                {bundle.title}
                            </h2>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
                                    <p className="text-sm text-gray-400 mb-1">Total Cost</p>
                                    <p className="text-3xl font-black text-white">${bundleCost}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
                                    <p className="text-sm text-gray-400 mb-1">You Save</p>
                                    <p className="text-3xl font-black text-lime-400">${bundle.savings}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
                                    <p className="text-sm text-gray-400 mb-1">Delivery</p>
                                    <p className="text-3xl font-black text-white">{bundle.deliveryETA}</p>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10">
                                    <p className="text-sm text-gray-400 mb-1">AI Match</p>
                                    <p className="text-3xl font-black text-lime-400">{bundle.confidence}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Section */}
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">Bundle Items ({bundleProducts.length})</h3>
                            <button 
                                onClick={handleAddAllToCart}
                                disabled={isAddingToCart}
                                className={`
                                    px-6 py-3 bg-lime-400 text-black
                                    rounded-full font-bold shadow-lg shadow-lime-400/20 hover:bg-lime-300
                                    transition-all duration-200 flex items-center gap-2
                                    ${isAddingToCart ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}
                                `}
                            >
                                {isAddingToCart ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Add All to Cart
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Product Cards - Horizontal Scroll */}
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {bundleProducts.map((product, idx) => (
                                <div
                                    key={idx}
                                    className="flex-shrink-0 w-64 bg-[#0e1420] rounded-2xl ring-1 ring-white/5 hover:ring-lime-400/40 transition-all duration-300 group"
                                >
                                    {/* Product Image */}
                                    <div className="relative bg-[#0b1120] rounded-t-2xl p-4 h-48 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {/* Quantity Badge */}
                                        <div className="absolute top-3 right-3 bg-lime-400 text-black text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                            x{product.quantity}
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-white mb-2 line-clamp-2 min-h-[48px]">
                                            {product.name}
                                        </h4>

                                        {/* Price */}
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-2xl font-black text-white">
                                                ${product.price}
                                            </span>
                                            {product.originalPrice && (
                                                <span className="text-sm text-gray-500 line-through">
                                                    ${product.originalPrice}
                                                </span>
                                            )}
                                        </div>

                                        {/* Replace Button */}
                                        <button
                                            onClick={() => handleReplaceProduct(product)}
                                            className="w-full py-3 bg-white/5 text-gray-300 font-bold rounded-xl ring-1 ring-white/10 hover:bg-lime-400/10 hover:text-lime-300 hover:ring-lime-400/30 transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Replace
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optimize Bundle Section */}
                    <div className="px-8 pb-8">
                        <div className="bg-[#0e1420] rounded-2xl p-6 ring-1 ring-white/5">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <svg className="w-6 h-6 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Optimize Your Bundle
                            </h3>
                            
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: 'Cheapest', icon: '💰' },
                                    { label: 'Healthiest', icon: '🥗' },
                                    { label: 'Most Popular', icon: '⭐' },
                                    { label: 'Student Budget', icon: '🎓' },
                                    { label: 'Premium', icon: '👑' }
                                ].map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => onOptimize(option.label.toLowerCase())}
                                        className="
                                            px-6 py-3 bg-[#151c2b] text-gray-300 ring-1 ring-white/10
                                            rounded-full font-bold
                                            hover:bg-lime-400 hover:text-black hover:ring-transparent
                                            hover:scale-105 transition-all duration-200
                                            flex items-center gap-2
                                        "
                                    >
                                        <span className="text-xl">{option.icon}</span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
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

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-down {
                    from { 
                        opacity: 0; 
                        transform: translateY(-100px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                .animate-slide-down {
                    animation: slide-down 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </>
    );
};

export default AIBundleCard;
