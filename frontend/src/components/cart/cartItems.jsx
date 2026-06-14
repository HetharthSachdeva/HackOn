import React, { useState, useEffect, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProduct, resetCart, increaseQuantity, decreaseQuantity, addToCart } from '../../redux/amazonSlice';
import { useNavigate, useRouteLoaderData, Link, ScrollRestoration, Await } from 'react-router-dom';
import { useCart } from '../../context/userCartContext';
import CartProduct from './cartProduct';

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

    const handleCategoryClick = (category, title) => navigate(`/${category}/${title}`);

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
        <div className="min-h-screen w-full bg-[#0a0a0a]">
            <ScrollRestoration />
            <div className="mx-auto max-w-[1500px] px-6 py-10">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* ── Left: items + suggestions ── */}
                    <div className="lg:col-span-2">
                        <h1 className="mb-6 text-4xl font-black text-white">Shopping Cart</h1>

                        <div className="space-y-4">
                            {items.map((product, index) => (
                                <CartProduct
                                    key={index}
                                    product={product}
                                    handleCategoryClick={handleCategoryClick}
                                    handleDecreaseQuantity={() => usingFirebase ? handleDecreaseQuantity(product) : dispatch(decreaseQuantity(product.title))}
                                    handleIncreaseQuantity={() => usingFirebase ? handleIncreaseQuantity(product) : dispatch(increaseQuantity(product.title))}
                                    handleDeleteProduct={() => usingFirebase ? handleDeleteProduct(product) : dispatch(deleteProduct(product.title))}
                                />
                            ))}
                        </div>

                        {/* AI Bundle Generator in Cart */}
                        {authenticated && (
                            <AIBundleCartGenerator />
                        )}

                        {/* You might also like */}
                        <div className="mt-12">
                            <h2 className="mb-1 font-mono text-sm uppercase tracking-[0.2em] text-gray-400">You might also like</h2>
                            <div className="mb-5 border-b border-white/10" />
                            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                                {suggestions.map((product, i) => (
                                    <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d]">
                                        <Link to={`/allProducts/${product.title}`}>
                                            <div className="flex h-36 items-center justify-center bg-[#141414] p-3">
                                                <img src={product.thumbnail} alt={product.title} className="max-h-full max-w-full object-contain" />
                                            </div>
                                        </Link>
                                        <div className="p-3">
                                            <p className="line-clamp-1 text-sm font-bold text-white">{product.title}</p>
                                            <p className="mt-0.5 text-sm font-bold text-[#FF9900]">₹{parseFloat(product.price || 0).toFixed(2)}</p>
                                            <button
                                                onClick={() => handleSuggestedAdd(product)}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-white/15 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-200 transition hover:border-[#FF9900] hover:text-[#FF9900]"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                Add
                                            </button>
                                        </div>
                                    </div>
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
                                <Link to="/checkout">
                                    <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF9900] py-3 font-bold text-black transition hover:bg-[#ffae33]">
                                        Proceed to Checkout <span>→</span>
                                    </button>
                                </Link>
                            ) : (
                                <Link to="/signIn">
                                    <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF9900] py-3 font-bold text-black transition hover:bg-[#ffae33]">
                                        Proceed to Checkout <span>→</span>
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
