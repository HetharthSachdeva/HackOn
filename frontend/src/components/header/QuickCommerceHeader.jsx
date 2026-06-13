import React, { useEffect, useState } from "react";
import { shopping } from "../../assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { getAuth, signOut } from "firebase/auth";
import { userSignOut, setUserAuthentication, resetOrders, resetCancelOrders, resetReturnOrders } from "../../redux/amazonSlice";
import { useCart } from "../../context/userCartContext";

export default function QuickCommerceHeader({ isAIMode, setIsAIMode, onAISearch }) {
    const auth = getAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const localCartProducts = useSelector((state) => state.amazon.localCartProducts);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);
    const { cartTotalQty } = useCart();

    const [totalQty, setTotalQty] = useState(0);
    const [deliveryTime, setDeliveryTime] = useState('8 mins');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Get current search query from URL if exists
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearchQuery = params.get('search');
        if (urlSearchQuery) {
            setSearchQuery(decodeURIComponent(urlSearchQuery));
        } else {
            setSearchQuery('');
        }
    }, [location.search]);

    useEffect(() => {
        let allQty = 0;
        localCartProducts.forEach((product) => {
            allQty += product.quantity;
        });
        setTotalQty(allQty);
    }, [localCartProducts]);

    const handleLogout = () => {
        signOut(auth).then(() => {
            dispatch(userSignOut());
            dispatch(setUserAuthentication(false));
            dispatch(resetOrders());
            dispatch(resetCancelOrders());
            dispatch(resetReturnOrders());
        }).catch((error) => {
            alert(error.message);
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        
        if (searchQuery.trim()) {
            // If AI Mode is active, navigate to homepage and trigger AI search
            if (isAIMode) {
                // If not on homepage, navigate there first
                if (location.pathname !== '/') {
                    navigate('/');
                    // Small delay to ensure homepage loads before triggering search
                    setTimeout(() => {
                        if (onAISearch) {
                            onAISearch(searchQuery);
                        }
                    }, 100);
                } else {
                    // Already on homepage, trigger AI search immediately
                    if (onAISearch) {
                        onAISearch(searchQuery);
                    }
                }
            } else {
                // Normal search - navigate to products page with search query
                navigate(`/allProducts?search=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    return (
        <div className="w-full sticky top-0 z-50 shadow-lg">
            {/* Main Header */}
            <div className="bg-white border-b border-violet-100">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <Link to="/">
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <div className="text-4xl group-hover:scale-110 transition-transform">⚡</div>
                                <div>
                                    <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                        QuickShop
                                    </h1>
                                    <p className="text-xs text-gray-600 font-semibold -mt-1">Instant Delivery</p>
                                </div>
                            </div>
                        </Link>

                        {/* Delivery Location & Time */}
                        <div className="hidden md:flex items-center gap-2 bg-violet-50 px-4 py-2 rounded-full border border-violet-200 hover:border-violet-400 transition cursor-pointer">
                            <div className="text-2xl">📍</div>
                            <div>
                                <p className="text-xs text-gray-600 font-semibold">Delivery in</p>
                                <p className="text-sm font-black text-violet-600">{deliveryTime}</p>
                            </div>
                            <div className="text-xs text-violet-600 font-bold ml-2">▼</div>
                        </div>

                        {/* Unified Search Bar with AI Mode */}
                        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl relative">
                            {/* AI Mode Glow Effect */}
                            {isAIMode && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            )}
                            
                            <div className={`
                                relative w-full flex items-center gap-2 rounded-full transition-all duration-300
                                ${isAIMode 
                                    ? 'ring-4 ring-purple-400/40 shadow-2xl shadow-purple-500/30 bg-white pl-4' 
                                    : 'bg-white border-2 border-violet-200'
                                }
                            `}>
                                {/* AI Mode Icon (shown when active) */}
                                {isAIMode && (
                                    <div className="flex-shrink-0 animate-pulse">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-md opacity-60"></div>
                                            <svg className="w-6 h-6 relative z-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                                
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder={isAIMode 
                                        ? "✨ Ask AI anything: 'Healthy breakfast for a week under ₹1000'"
                                        : "Search for groceries, electronics, essentials..."
                                    }
                                    className={`
                                        w-full py-3 px-4 rounded-full outline-none bg-transparent
                                        ${isAIMode 
                                            ? 'text-base font-medium placeholder-purple-500/70' 
                                            : 'text-sm placeholder-gray-400'
                                        }
                                    `}
                                />
                                
                                {/* Right Side Icons */}
                                <div className="flex items-center gap-1 pr-2">
                                    {/* Voice Search */}
                                    <button
                                        type="button"
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Voice search"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                        </svg>
                                    </button>
                                    
                                    {/* Camera Search */}
                                    <button
                                        type="button"
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        title="Image search"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                    
                                    {/* Divider */}
                                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                    
                                    {/* Search Submit Button */}
                                    <button 
                                        type="submit"
                                        className={`
                                            p-2.5 rounded-full transition-all shadow-md hover:shadow-lg
                                            ${isAIMode
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-110'
                                                : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:scale-110'
                                            }
                                            text-white
                                        `}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Prominent AI Mode Toggle - Outside search bar */}
                            <button
                                type="button"
                                onClick={() => setIsAIMode && setIsAIMode(!isAIMode)}
                                className={`
                                    ml-3 flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm 
                                    transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105
                                    ${isAIMode
                                        ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white ring-4 ring-purple-300/50 animate-pulse-slow'
                                        : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-purple-600 hover:to-pink-600'
                                    }
                                `}
                                title={isAIMode ? "Disable AI Mode" : "Enable AI Mode for Smart Bundles"}
                            >
                                {isAIMode ? (
                                    <>
                                        <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                        </svg>
                                        <span>AI ON</span>
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                        </svg>
                                        <span>AI Mode</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* User Account */}
                            {userInfo ? (
                                <div className="hidden md:flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-full transition">
                                    <div className="w-8 h-8 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                                        {userInfo.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Hello,</p>
                                        <p className="text-sm font-bold text-gray-800 -mt-1">{userInfo.name}</p>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/signIn">
                                    <button className="hidden md:block bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-6 py-2 rounded-full font-bold hover:shadow-lg hover:scale-105 transition">
                                        Login
                                    </button>
                                </Link>
                            )}

                            {/* Cart */}
                            <Link to="/cart">
                                <div className="relative cursor-pointer hover:scale-110 transition">
                                    <div className="bg-gradient-to-r from-violet-500 to-indigo-500 p-3 rounded-full shadow-lg">
                                        <img className="w-6 h-6 invert" src={shopping} alt="cart" />
                                    </div>
                                    {(cartTotalQty > 0 || totalQty > 0) && (
                                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                                            {cartTotalQty > 0 ? cartTotalQty : totalQty}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            {/* Logout */}
                            {userInfo && (
                                <button
                                    onClick={handleLogout}
                                    className="hidden md:block text-gray-600 hover:text-red-600 transition"
                                    title="Logout"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="lg:hidden mt-3">
                        <div className="flex gap-2 items-center">
                            <div className={`
                                relative flex-1 transition-all duration-300
                                ${isAIMode 
                                    ? 'ring-2 ring-purple-400/40 rounded-full' 
                                    : ''
                                }
                            `}>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={isAIMode ? "✨ Ask AI..." : "Search..."}
                                    className={`
                                        w-full px-4 py-2 pr-10 rounded-full outline-none text-sm
                                        ${isAIMode
                                            ? 'border-2 border-purple-400 placeholder-purple-500/70'
                                            : 'border-2 border-violet-200 focus:border-violet-500'
                                        }
                                    `}
                                />
                                <button 
                                    type="submit"
                                    className={`
                                        absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                                        ${isAIMode ? 'text-purple-500' : 'text-violet-500'}
                                    `}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Mobile AI Mode Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsAIMode && setIsAIMode(!isAIMode)}
                                className={`
                                    flex items-center gap-1 px-3 py-2 rounded-full font-bold text-xs
                                    transition-all duration-300 shadow-md whitespace-nowrap
                                    ${isAIMode
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-2 ring-purple-300'
                                        : 'bg-gray-800 text-white'
                                    }
                                `}
                            >
                                {isAIMode ? (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                        </svg>
                                        <span>AI ON</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                                        </svg>
                                        <span>AI</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Quick Links Bar */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-2 px-4 overflow-x-auto">
                <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm font-semibold whitespace-nowrap">
                    <Link to="/groceries" className="hover:underline flex items-center gap-1">
                        <span>🥬</span> Vegetables
                    </Link>
                    <Link to="/groceries" className="hover:underline flex items-center gap-1">
                        <span>🥛</span> Dairy
                    </Link>
                    <Link to="/beauty" className="hover:underline flex items-center gap-1">
                        <span>🧴</span> Personal Care
                    </Link>
                    <Link to="/home-decoration" className="hover:underline flex items-center gap-1">
                        <span>🏠</span> Home
                    </Link>
                    <Link to="/smartphones" className="hover:underline flex items-center gap-1">
                        <span>📱</span> Electronics
                    </Link>
                    <Link to="/groceries" className="hover:underline flex items-center gap-1">
                        <span>🍿</span> Snacks
                    </Link>
                    <Link to="/allProducts" className="hover:underline flex items-center gap-1 animate-pulse">
                        <span>🔥</span> View All
                    </Link>
                </div>
            </div>
            
            {/* CSS Animations */}
            <style jsx="true">{`
                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}

