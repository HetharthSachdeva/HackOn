import React, { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProduct, resetCart, increaseQuantity, decreaseQuantity, addToCart } from '../../redux/amazonSlice';
import { useNavigate, useRouteLoaderData, Link, ScrollRestoration, Await } from 'react-router-dom';
import { useCart } from '../../context/userCartContext';
import CartProduct from './cartProduct';
import { motion } from 'framer-motion';

import AIBundleCartGenerator from './AIBundleCartGenerator';

const FREE_DELIVERY_THRESHOLD = 29;
const DELIVERY_FEE = 4.99;
const TAX_RATE = 0.06;

const CartItemsContent = ({ productsData }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const localCartProducts = useSelector((state) => state.amazon.localCartProducts);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);
    const { 
        userCart, 
        updateUserCart, 
        cartTotalQty, 
        cartTotalPrice,
        addToCartBackend,
        updateCartItemQtyBackend,
        deleteCartItemBackend
    } = useCart();
    const [totalQty, setTotalQty] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        let allPrice = 0, allQty = 0;
        localCartProducts.forEach((p) => { allPrice += p.quantity * p.price; allQty += p.quantity; });
        setTotalPrice(allPrice);
        setTotalQty(allQty);
    }, [localCartProducts, userCart]);

    const usingFirebase = userCart.length > 0;
    const items = usingFirebase ? userCart : localCartProducts;
    const itemCount = usingFirebase ? cartTotalQty : totalQty;
    const subtotal = usingFirebase ? cartTotalPrice : totalPrice;

    const tax = subtotal * TAX_RATE;
    const freeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
    const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
    const remainingForFree = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);
    const progressPct = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
    const total = subtotal + tax + deliveryFee;

    const handleCategoryClick = (category, title) => navigate(`/${category}/${encodeURIComponent(title)}`);

    const handleDecreaseQuantity = async (product) => {
        if (product.quantity > 1) {
            await updateCartItemQtyBackend(product.asin, product.quantity - 1);
        }
    };

    const handleIncreaseQuantity = async (product) => {
        await updateCartItemQtyBackend(product.asin, product.quantity + 1);
    };

    const handleDeleteProduct = async (product) => {
        await deleteCartItemBackend(product.asin);
    };

    const handleSuggestedAdd = async (product) => {
        if (!authenticated) {
            dispatch(addToCart({
                id: product.id, title: product.title, price: product.price, description: product.description,
                category: product.category, images: product.images, thumbnail: product.thumbnail, brand: product.brand,
                quantity: 1, discountPercentage: product.discountPercentage, rating: product.rating, stock: product.stock,
            }));
            return;
        }
        await addToCartBackend(product.id || product.asin, 1);
    };

    const suggestions = (productsData || []).slice(0, 4);

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] blur-[150px]">
                <div className="h-[800px] w-[800px] rounded-full bg-[#FF9900]" />
            </div>

            <ScrollRestoration />
            <div className="mx-auto max-w-[1500px] px-6 py-12 relative z-10">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                    {/* ── Left: items + suggestions ── */}
                    <div className="lg:col-span-2">
                        <h1 className="mb-8 text-4xl sm:text-5xl font-black text-white">Shopping Cart</h1>

                        <div className="space-y-4">
                            {items.map((product, index) => (
                                <motion.div
                                    key={product.id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                >
                                    <CartProduct
                                        product={product}
                                        handleCategoryClick={handleCategoryClick}
                                        handleDecreaseQuantity={() => usingFirebase ? handleDecreaseQuantity(product) : dispatch(decreaseQuantity(product.title))}
                                        handleIncreaseQuantity={() => usingFirebase ? handleIncreaseQuantity(product) : dispatch(increaseQuantity(product.title))}
                                        handleDeleteProduct={() => usingFirebase ? handleDeleteProduct(product) : dispatch(deleteProduct(product.title))}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* AI Bundle Generator in Cart */}
                        {authenticated && (
                            <div className="mt-8">
                                <AIBundleCartGenerator />
                            </div>
                        )}

                        {/* You might also like */}
                        <div className="mt-16">
                            <h2 className="mb-2 font-mono text-sm uppercase tracking-[0.2em] text-[#FF9900] font-bold flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                You might also like
                            </h2>
                            <div className="mb-6 border-b border-white/5" />
                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                                {suggestions.map((product, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: i * 0.1 }}
                                        className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d0d] hover:border-white/20 hover:shadow-lg transition-all group"
                                    >
                                        <Link to={`/allProducts/${encodeURIComponent(product.title)}`} className="block relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="flex h-40 items-center justify-center bg-[#141414] p-4 group-hover:scale-105 transition-transform duration-500">
                                                <img src={product.thumbnail} alt={product.title} className="max-h-full max-w-full object-contain drop-shadow-xl" />
                                            </div>
                                        </Link>
                                        <div className="p-4 relative z-20">
                                            <p className="line-clamp-1 text-sm font-bold text-white group-hover:text-[#FF9900] transition-colors">{product.title}</p>
                                            <p className="mt-1 text-sm font-black text-gray-300">₹{parseFloat(product.price || 0).toFixed(2)}</p>
                                            <button
                                                onClick={() => handleSuggestedAdd(product)}
                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 font-mono text-[10px] uppercase tracking-widest font-bold text-white transition hover:bg-[#FF9900] hover:text-black hover:shadow-[0_0_15px_rgba(255,153,0,0.3)] active:scale-95"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                                Add
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: order summary ── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 overflow-hidden rounded-2xl border-t-2 border-[#FF9900] bg-[#0f0f0f] p-6 ring-1 ring-white/10">
                            <h2 className="text-2xl font-black text-white">Order Summary</h2>

                            <div className="mt-6 space-y-3 text-sm">
                                <div className="flex justify-between text-gray-300">
                                    <span>Subtotal ({itemCount} items)</span>
                                    <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Tax</span>
                                    <span className="font-semibold text-white">₹{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-300">
                                    <span className="flex items-center gap-1">Delivery Fee <span className="text-gray-600">ⓘ</span></span>
                                    <span className="flex items-center gap-2">
                                        {!freeDelivery && <span className="text-gray-600 line-through">₹{DELIVERY_FEE.toFixed(2)}</span>}
                                        {freeDelivery ? <span className="font-bold text-[#FF9900]">FREE</span> : <span className="font-semibold text-white">₹{DELIVERY_FEE.toFixed(2)}</span>}
                                    </span>
                                </div>

                                {/* Free delivery progress */}
                                <div className="pt-1">
                                    <div className="mb-1.5 flex justify-between font-mono text-[11px] text-gray-500">
                                        <span>{freeDelivery ? 'You unlocked Free Delivery' : `Add ₹${remainingForFree.toFixed(2)} for Free Delivery`}</span>
                                        <span className="text-[#FF9900]">{progressPct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full rounded-full bg-gradient-to-r from-[#FF9900] to-[#ffae33] transition-all" style={{ width: `${progressPct}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="my-5 border-t border-white/10" />

                            <div className="flex items-center justify-between">
                                <span className="text-lg text-gray-300">Total</span>
                                <span className="text-3xl font-black text-white">₹{total.toFixed(2)}</span>
                            </div>

                            {authenticated ? (
                                <Link to="/checkout" className="block mt-8">
                                    <button className="flex w-full relative overflow-hidden items-center justify-center gap-3 rounded-xl bg-[#FF9900] py-4 font-mono text-base font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98]">
                                        Proceed to Checkout
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                </Link>
                            ) : (
                                <Link to="/signIn" className="block mt-8">
                                    <button className="flex w-full relative overflow-hidden items-center justify-center gap-3 rounded-xl bg-[#FF9900] py-4 font-mono text-base font-black uppercase tracking-[0.2em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98]">
                                        Sign In to Checkout
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                </Link>
                            )}

                            <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-gray-500">
                                🔒 Secure Encrypted Checkout
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CartItems = () => {
    const data = useRouteLoaderData("root");

    return (
        <Suspense fallback={<div className="flex min-h-[50vh] w-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900]"></div></div>}>
            <Await resolve={data?.data}>
                {(resolvedData) => <CartItemsContent productsData={resolvedData?.products || []} />}
            </Await>
        </Suspense>
    );
};

export default CartItems;
