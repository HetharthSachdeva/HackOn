import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../redux/amazonSlice';
import { db } from '../../firebase/firebase.config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/userCartContext';

const ProductCard = ({ product, onAdd }) => {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const hasDiscount = product.discountPercentage > 0;
  const finalPrice = hasDiscount
    ? product.price * (1 - product.discountPercentage / 100)
    : product.price;
  const isPremium = finalPrice >= 100;
  const eta = Math.floor(Math.random() * 8) + 8; // 8-15 mins
  const subtitle = product.brand || (product.description || '').slice(0, 24);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-[#151c2b] p-3 ring-1 ring-white/5 transition-all duration-300 hover:-translate-y-1 hover:ring-[#FF9900]/40">
      {/* Image */}
      <Link to={`${product.title}`} className="relative block">
        <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-[#0e1420]">
          {/* Delivery ETA */}
          <span className="absolute left-3 top-3 z-10 flex items-center gap-1 text-xs font-bold text-[#FFB145]">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {eta}m
          </span>
          <img
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-110"
            src={product.thumbnail}
            alt={product.title}
          />
        </div>
      </Link>

      {/* Favourite */}
      <button
        onClick={() => setLiked((v) => !v)}
        className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/30 backdrop-blur transition hover:scale-110"
        aria-label="Save"
      >
        <svg
          className={`h-4 w-4 transition-colors ${liked ? 'fill-[#FF9900] text-[#FF9900]' : 'fill-none text-gray-300'}`}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col px-1 pt-4">
        {isPremium && (
          <span className="mb-2 w-fit rounded-md bg-[#FF9900]/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#FFB145] ring-1 ring-[#FF9900]/30">
            PREMIUM
          </span>
        )}
        <Link to={`${product.title}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-bold leading-tight text-white transition-colors group-hover:text-[#FFB145]">
            {product.title}
          </h3>
        </Link>
        <p className="mt-1 truncate text-xs capitalize text-gray-500">{subtitle}</p>

        {/* Price + Add */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">${finalPrice.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className={`grid h-9 w-9 place-items-center rounded-full text-black shadow-lg transition-all duration-200 hover:scale-110 ${
              added ? 'bg-white' : 'bg-[#FF9900] hover:bg-[#FFB145]'
            }`}
            aria-label="Add to cart"
          >
            {added ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
