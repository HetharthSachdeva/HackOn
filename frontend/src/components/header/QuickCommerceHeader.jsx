import React, { useEffect, useState } from "react";
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
    const { cartTotalQty } = useCart();

    const [totalQty, setTotalQty] = useState(0);
    const [deliveryTime] = useState(12);
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
        signOut(auth).then(() => {
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
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => onAISearch && onAISearch(searchQuery), 100);
            } else {
                onAISearch && onAISearch(searchQuery);
            }
        } else {
            navigate(`/allProducts?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const cartCount = cartTotalQty > 0 ? cartTotalQty : totalQty;

    return (
        <div className="sticky top-0 z-50 w-full bg-[#0b1120]/95 backdrop-blur-md border-b border-white/5">
            <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <h1 className="text-2xl font-black tracking-tight">
                            <span className="text-lime-400">Zip</span><span className="text-white">Dash</span>
                        </h1>
                    </Link>

                    {/* Delivery address pill */}
                    <div className="hidden items-center gap-3 rounded-2xl bg-[#151c2b] px-4 py-2 ring-1 ring-white/5 lg:flex">
                        <div className="flex items-center gap-2">
                            <span className="text-lime-400">📍</span>
                            <p className="max-w-[120px] truncate text-xs font-semibold leading-tight text-gray-300">
                                {userInfo?.address || '123 Main St, Apt 4B'}
                            </p>
                        </div>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-lime-400" />
                            <p className="whitespace-nowrap text-xs font-bold text-lime-400">Delivering in {deliveryTime} mins</p>
                        </div>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <div className={`relative flex items-center rounded-full bg-[#151c2b] ring-1 transition-all ${isAIMode ? 'ring-2 ring-violet-500/60' : 'ring-white/10 focus-within:ring-lime-400/40'}`}>
                            <svg className="ml-4 h-4 w-4 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={isAIMode ? "Ask AI: 'snacks for movie night under $20'" : "Search for snacks, drinks, essentials..."}
                                className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setIsAIMode && setIsAIMode(!isAIMode)}
                                title={isAIMode ? "Disable AI Mode" : "Enable AI Mode"}
                                className={`mr-1.5 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                    isAIMode ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white' : 'bg-white/5 text-gray-400 hover:text-lime-300'
                                }`}
                            >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                AI
                            </button>
                        </div>
                    </form>

                    {/* Nav actions */}
                    <div className="hidden items-center gap-5 md:flex">
                        <Link to="/orders" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 transition hover:text-lime-300">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            Orders
                        </Link>
                        <Link to="/cart" className="flex items-center gap-1.5 text-sm font-medium text-gray-300 transition hover:text-lime-300">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            Saved
                        </Link>
                    </div>

                    {/* Cart */}
                    <Link to="/cart" className="relative flex items-center gap-1.5 text-sm font-medium text-gray-300 transition hover:text-lime-300">
                        <div className="relative">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {cartCount > 0 && (
                                <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-lime-400 text-[11px] font-black text-black">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="hidden lg:inline">Cart</span>
                    </Link>

                    {/* Avatar / Auth */}
                    {userInfo ? (
                        <div className="group relative">
                            <div className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-lime-400 to-lime-500 font-black text-black ring-2 ring-white/10">
                                {userInfo.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="invisible absolute right-0 top-12 z-50 w-40 rounded-xl bg-[#151c2b] p-2 opacity-0 ring-1 ring-white/10 transition-all group-hover:visible group-hover:opacity-100">
                                <p className="px-3 py-1 text-xs text-gray-400">Hi, {userInfo.name}</p>
                                <button onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-200 hover:bg-white/5 hover:text-lime-300">
                                    Sign out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/signIn">
                            <button className="rounded-full bg-lime-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-lime-300">
                                Login
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
