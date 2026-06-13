import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/amazonSlice';
import { db } from '../../firebase/firebase.config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/userCartContext';

const ProductCard = ({ product, onAdd }) => {
  const [added, setAdded] = useState(false);
  const hasDiscount = product.discountPercentage > 0;
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
  const inStock = (product.stock ?? 0) > 0;
  const sku = (product.brand || product.category || 'SKU')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase() + (product.id ?? '');

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group flex flex-col rounded-2xl bg-[#0d0d0f] p-3 ring-1 ring-white/10 transition-all duration-300 hover:ring-white/25 hover:shadow-[0_20px_50px_-20px_rgba(255,153,0,0.25)]">
      {/* Image panel */}
      <Link to={`${product.title}`} className="block">
        <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-[#161618] to-[#0c0c0e] ring-1 ring-white/5">
          <img
            className="max-h-[78%] max-w-[78%] object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
            src={product.thumbnail}
            alt={product.title}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col px-2 pt-5">
        {/* Brand + status dot */}
        <div className="flex items-start justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">
            {product.brand || product.category}
          </p>
          <span
            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${inStock ? 'bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.9)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]'}`}
          />
        </div>

        {/* SKU code */}
        <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-[#FF9900]">{sku}</p>

        {/* Title */}
        <Link to={`${product.title}`}>
          <h3 className="mt-1 line-clamp-1 text-2xl font-black leading-tight text-white transition-colors group-hover:text-gray-200">
            {product.title}
          </h3>
        </Link>

        {/* Subtitle (category) */}
        <p className="mt-0.5 text-sm capitalize text-gray-500">{product.category}</p>

        {/* Divider */}
        <div className="my-4 border-t border-white/10" />

        {/* Availability + price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">
              {inStock ? 'Available' : 'Out of stock'}
            </p>
            <p className="mt-1 font-mono text-sm text-gray-300">
              <span className="text-white">${finalPrice.toFixed(2)}</span>
              {hasDiscount && <span className="ml-2 text-xs text-gray-600 line-through">${product.price.toFixed(2)}</span>}
            </p>
          </div>
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-gray-400">
            {product.stock ?? 0} <span className="text-gray-600">PCS</span>
          </p>
        </div>

        {/* ADD button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 font-mono text-sm uppercase tracking-[0.2em] transition-all duration-200 ${
              !inStock
                ? 'cursor-not-allowed border-white/5 text-gray-600'
                : added
                ? 'border-[#FF9900] bg-[#FF9900] text-black'
                : 'border-white/15 text-gray-200 hover:border-[#FF9900] hover:text-[#FF9900]'
            }`}
          >
            {added ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Added
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Product = (props) => {
  const { productsData } = props;
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.amazon.userInfo);
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const { userCart, updateUserCart } = useCart();

  const saveProductToFirsebase = async (product) => {
    const productWithDefaultQuantity = { ...product, quantity: 1 };
    const cartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      const cart = snap.data().cart || [];
      const idx = cart.findIndex((item) => item.title === product.title);
      if (idx !== -1) cart[idx].quantity += 1;
      else cart.push(productWithDefaultQuantity);
      await setDoc(cartRef, { cart: cart }, { merge: true });
      updateUserCart(cart);
    } else {
      await setDoc(cartRef, { cart: [productWithDefaultQuantity] }, { merge: true });
      updateUserCart([...userCart, productWithDefaultQuantity]);
    }
  };

  const handleButton = async (product) => {
    if (!authenticated) {
      dispatch(addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        images: product.images,
        thumbnail: product.thumbnail,
        brand: product.brand,
        quantity: 1,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock,
      }));
    } else {
      await saveProductToFirsebase(product);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {productsData.map((product, index) => (
        <ProductCard key={index} product={product} onAdd={handleButton} />
      ))}
    </div>
  );
};

export default Product;
