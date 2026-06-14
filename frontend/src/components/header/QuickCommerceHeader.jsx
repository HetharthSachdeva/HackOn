import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from "../../api/supabaseClient";
import { userSignOut, setUserAuthentication, resetOrders, resetCancelOrders, resetReturnOrders } from "../../redux/amazonSlice";
import { useCart } from "../../context/userCartContext";

export default function QuickCommerceHeader({ isAIMode, setIsAIMode, onAISearch }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const localCartProducts = useSelector((state) => state.amazon.localCartProducts);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const { cartTotalQty } = useCart();

    const [totalQty, setTotalQty] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearchQuery = params.get('search');
        setSearchQuery(urlSearchQuery ? decodeURIComponent(urlSearchQuery) : '');
    }, [location.search]);

    useEffect(() => {
        let allQty = 0;
        localCartProducts.forEach((product) => { allQty += product.quantity; });
        setTotalQty(allQty);
    }, [localCartProducts]);

    const handleLogout = () => {
        supabase.auth.signOut().then(() => {
            dispatch(userSignOut());
            dispatch(setUserAuthentication(false));
            dispatch(resetOrders());
            dispatch(resetCancelOrders());
            dispatch(resetReturnOrders());
        }).catch((error) => alert(error.message));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        if (isAIMode) {
            navigate(`/cart?aiPrompt=${encodeURIComponent(searchQuery)}`);
        } else {
            navigate(`/allProducts?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const cartCount = cartTotalQty > 0 ? cartTotalQty : totalQty;


    return (
        <div className={`sticky top-0 z-50 w-full border-b transition-colors duration-500 ${isAIMode ? 'border-violet-500/20 bg-[#0a0a0a]/95' : 'border-white/5 bg-[#0a0a0a]/95'} backdrop-blur-md`}>
            <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3">
                {/* Logo */}
                <Link to="/" className="flex flex-shrink-0 items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#FF9900] to-[#ff7a00] text-black">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    <span className="font-mono text-lg font-black uppercase tracking-wider text-white">Amazon Now</span>
                </Link>

                {/* Search */}
                <div className={`hidden flex-1 max-w-md transition-all duration-500 md:block ${isAIMode ? 'ai-search-wrap scale-[1.02]' : ''}`}>
                    <form onSubmit={handleSearch} className="relative flex items-center rounded-full bg-[#161616] ring-1 ring-white/10 focus-within:ring-white/25">
                        <svg className="ml-4 h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isAIMode ? "Ask AI: 'snacks for movie night under ₹1500'" : "Search snacks, drinks, produce..."}
                            className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setIsAIMode && setIsAIMode(!isAIMode)}
                            title={isAIMode ? "Disable AI Mode" : "Enable AI Mode"}
                            className={`mr-1.5 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${isAIMode ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white' : 'bg-white/5 text-gray-400 hover:text-[#FF9900]'}`}
                        >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            AI
                        </button>
                    </form>
                </div>

                <Link to="/cart" className="ml-auto relative flex items-center gap-1.5 text-sm text-gray-300 transition hover:text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-[#FF9900] text-[10px] font-black text-black">{cartCount}</span>}
                </Link>

                {/* Auth */}
                {userInfo ? (
                    <div className="group relative">
                        <button className="flex items-center gap-1.5 rounded-md border border-white/15 px-4 py-1.5 text-sm font-semibold text-white transition hover:border-white/40">
                            <svg className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </button>
                        <div className="invisible absolute right-0 top-10 z-50 w-56 rounded-lg bg-[#161616] p-2 opacity-0 ring-1 ring-white/10 transition-all group-hover:visible group-hover:opacity-100 flex flex-col gap-0.5">
                            {/* User Profile Info Header */}
                            <div className="px-3 py-2 border-b border-white/5 mb-1 text-left min-w-0">
                                <p className="text-sm font-bold text-white truncate">{userInfo.name || 'User'}</p>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{userInfo.email}</p>
                            </div>
                            <Link to="/orders" className="w-full rounded px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-[#FF9900]">My Orders</Link>
                            <button onClick={handleLogout} className="w-full rounded px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-[#FF9900]">Sign out</button>
                        </div>
                    </div>
                ) : (
                    <Link to="/signIn">
                        <button className="rounded-md border border-white/15 px-4 py-1.5 text-sm font-semibold text-white transition hover:border-white/40">Login</button>
                    </Link>
                )}

                {/* Download App */}
                <button className="hidden items-center gap-2 rounded-md bg-[#FF9900] px-4 py-1.5 text-sm font-bold text-black transition hover:bg-[#ffae33] sm:flex">
                    Download App
                    <span>→</span>
                </button>
            </div>

            <style>{`
                .ai-search-wrap form { box-shadow: 0 0 22px rgba(167,139,250,0.45); }
                .ai-search-wrap { border-radius: 9999px; padding: 2px; background: linear-gradient(90deg,#7c3aed,#d946ef,#22d3ee,#7c3aed); background-size: 300% 100%; animation: ai-border 3s linear infinite; }
                @keyframes ai-border { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
            `}</style>
        </div>
    );
}
