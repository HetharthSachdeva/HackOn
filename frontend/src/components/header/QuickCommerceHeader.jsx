import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from "../../api/supabaseClient";
import { userSignOut, setUserAuthentication, resetOrders, resetCancelOrders, resetReturnOrders } from "../../redux/amazonSlice";
import { useCart } from "../../context/userCartContext";
import Location from "./location";

export default function QuickCommerceHeader({ isAIMode, setIsAIMode, onAISearch }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const localCartProducts = useSelector((state) => state.amazon.localCartProducts);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const { cartTotalQty } = useCart();

    const [totalQty, setTotalQty] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            recog.lang = 'en-IN';

            recog.onstart = () => {
                setIsListening(true);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            recog.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recog.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setSearchQuery(transcript);
            };

            setRecognition(recog);
        }
    }, []);

    const toggleVoiceSearch = () => {
        if (!recognition) {
            alert("🎤 Voice search is not supported in this browser. Please try Google Chrome or Microsoft Edge.");
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

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
        <div className={`sticky top-0 z-50 w-full border-b transition-colors duration-500 ${isAIMode ? 'border-fuchsia-500/20 bg-[#060608]/80' : 'border-white/5 bg-[#08080a]/80'} backdrop-blur-xl`}>
            <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
                
                {/* ── Logo ── */}
                <Link to="/" className="group flex flex-shrink-0 items-center gap-2.5">
                    <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#FF9900] to-[#FF5500] shadow-[0_0_15px_rgba(255,153,0,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,153,0,0.5)]">
                        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        <svg className="h-5 w-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <span className="hidden font-outfit text-xl font-black tracking-wide text-white transition-colors group-hover:text-[#FF9900] sm:block">Amazon Now</span>
                </Link>

                <div className="hidden flex-shrink-0 md:block ml-2">
                    <Location />
                </div>

                {/* ── Search Bar ── */}
                <div className={`hidden max-w-xl flex-1 px-3 transition-all duration-500 lg:block xl:max-w-2xl mx-auto ${isAIMode ? 'scale-[1.01]' : 'scale-100'}`}>
                    <div className="relative group">
                        {/* Animated glow background that fades in during AI mode */}
                        <div className={`absolute -inset-0.5 rounded-[18px] bg-gradient-to-r from-[#FF9900] via-fuchsia-500 to-violet-600 opacity-0 blur transition duration-500 ${isAIMode ? 'opacity-40 group-hover:opacity-60 animate-pulse' : ''}`}></div>
                        
                        <form onSubmit={handleSearch} className={`relative flex items-center overflow-hidden rounded-2xl transition-colors duration-500 ${isAIMode ? 'bg-[#0b0612] ring-1 ring-fuchsia-500/50' : 'bg-[#141414] ring-1 ring-white/10 focus-within:bg-[#1a1a1a] focus-within:ring-white/25 hover:ring-white/20'}`}>
                            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center transition-colors duration-500 ${isAIMode ? 'text-fuchsia-400' : 'text-gray-500'}`}>
                                {isAIMode ? (
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                )}
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isAIMode ? "Ask AI: 'movie night snacks under ₹1500'" : "Search snacks, drinks, produce..."}
                                className={`h-11 w-full bg-transparent text-sm text-white outline-none transition-colors duration-500 ${isAIMode ? 'placeholder-fuchsia-400/50' : 'placeholder-gray-500'}`}
                            />
                            {!isAIMode && (
                                <div className="mr-3 hidden flex-shrink-0 items-center gap-1 text-[10px] font-bold text-gray-500 xl:flex">
                                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">⌘</kbd>
                                    <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans">K</kbd>
                                </div>
                            )}

                            {/* Voice Search Button */}
                            <button
                                type="button"
                                onClick={toggleVoiceSearch}
                                className={`mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                    isListening 
                                        ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500 animate-pulse' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white active:scale-90'
                                }`}
                                title={isListening ? "Listening... Click to stop" : "Search with your voice"}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsAIMode && setIsAIMode(!isAIMode)}
                                title={isAIMode ? "Disable AI Mode" : "Enable AI Mode"}
                                className={`mr-2 flex flex-shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-300 ${isAIMode ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-gray-200' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                            >
                                {isAIMode ? (
                                    <>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        Exit AI
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        AI
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    
                    {/* Orders Icon */}
                    <Link to="/orders" className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white">
                        <svg className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </Link>

                    {/* Cart Icon */}
                    <Link to="/cart" className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-all hover:bg-white/10 hover:text-white">
                        <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#FF9900] text-[10px] font-black text-black shadow-lg shadow-[#FF9900]/40">{cartCount}</span>}
                    </Link>

                    <div className="mx-1 hidden h-6 w-px bg-white/10 md:block"></div>

                    {/* Auth */}
                    {userInfo ? (
                        <div className="group relative">
                            <button className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/20">
                                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-[#FF9900] to-[#FF5500] shadow-inner">
                                    <span className="text-[11px] font-black tracking-wider text-black">{userInfo.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="hidden tracking-wide md:inline">{userInfo.name?.split(' ')[0]}</span>
                                <svg className="hidden h-3 w-3 text-gray-500 transition-transform group-hover:rotate-180 md:block" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            
                            {/* Dropdown menu */}
                            <div className="pointer-events-none invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                                <div className="w-56 overflow-hidden rounded-2xl bg-[#111111] p-1.5 shadow-2xl ring-1 ring-white/10">
                                    <div className="mb-1 border-b border-white/5 px-4 py-3">
                                        <p className="truncate text-sm font-bold text-white">{userInfo.name}</p>
                                        <p className="truncate text-xs text-gray-500">{userInfo.email || 'user@example.com'}</p>
                                    </div>
                                    <Link to="/orders" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/5 hover:text-white">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        My Orders
                                    </Link>
                                    <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-red-500/10 hover:text-red-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link to="/signIn">
                            <button className="rounded-full bg-white px-5 py-2 text-sm font-extrabold tracking-wide text-black transition-transform hover:scale-105">Log In</button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
