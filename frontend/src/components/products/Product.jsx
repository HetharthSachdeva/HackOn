import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/amazonSlice';
import { db } from '../../firebase/firebase.config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/userCartContext';

const ProductCard = ({ product, onAdd }) => {
  const [liked, setLiked] = useState(false);
  const hasDiscount = product.discountPercentage > 0;
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
  const isTopItem = product.rating >= 4.7;

  return (
    <div className="group relative flex flex-col rounded-3xl bg-white p-3 shadow-[0_4px_20px_-8px_rgba(99,102,241,0.15)] ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(99,102,241,0.3)]">
      {/* Favourite */}
      <button
        onClick={() => setLiked((v) => !v)}
        className="absolute right-5 top-5 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md ring-1 ring-gray-100 backdrop-blur transition hover:scale-110"
        aria-label="Add to favourites"
      >
        <svg
          className={`h-4 w-4 transition-colors ${liked ? 'fill-violet-600 text-violet-600' : 'fill-none text-gray-400'}`}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Image */}
      <Link to={`${product.title}`} className="relative block">
        <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
          <img
            className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-110"
            src={product.thumbnail}
            alt={product.title}
          />
          {isTopItem && (
            <span className="absolute bottom-3 left-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-gray-800 shadow">
              Top item
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <Link to={`${product.title}`}>
          <h3 className="line-clamp-1 text-[15px] font-bold text-gray-800 transition-colors group-hover:text-violet-600">
            {product.title}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
          <span className="flex items-center gap-0.5 font-semibold text-amber-500">
            {product.rating} <span>★</span>
          </span>
          <span>·</span>
          <span className="capitalize">{product.brand}</span>
        </div>

        {/* Price pill row */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
          )}
          <button
            onClick={() => onAdd(product)}
            className="group/btn inline-flex items-center gap-2 rounded-full border-2 border-violet-200 px-5 py-2 text-sm font-bold text-violet-700 transition-all duration-200 hover:border-transparent hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:text-white hover:shadow-lg"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            ₹{finalPrice.toFixed(2)}
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

  // Save a product to Firebase cart
  const saveProductToFirsebase = async (product) => {
    const productWithDefaultQuantity = { ...product, quantity: 1 };
    const cartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      const cart = snap.data().cart || [];
      const existingProductIndex = cart.findIndex((item) => item.title === product.title);
      if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += 1;
      } else {
        cart.push(productWithDefaultQuantity);
      }
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
