import React, { useState, useEffect } from 'react';
import { ScrollRestoration, Link, useRouteLoaderData, useParams } from 'react-router-dom';
import { star, halfStar, emptyStar, offers, delivery, cod, exchange, delivered, transaction } from "../../assets/index";
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, buyNow } from '../../redux/amazonSlice';
import { db } from '../../firebase/firebase.config';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/userCartContext';

const ProductDetails = () => {
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const userInfo = useSelector((state) => state.amazon.userInfo);
  const data = useRouteLoaderData("root");
  const productsData = data.data.products;
  const { userCart, updateUserCart } = useCart(); // Get the userCart and updateUserCart function from the userCartContext
  const { title } = useParams(); // Get the "title" parameter from the URL

  // Find the product based on the title from the URL parameters
  const product = productsData.find((product) =>
    product.title === title);

  const [cartButton, setCartButton] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Automatically change images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product.images.length]);

  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
  };

  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Function to handle quantity change
  const handleQuantityChange = (event) => {
    const newQuantity = parseInt(event.target.value, 10);
    setSelectedQuantity(newQuantity);
  };

  // Function to save a product to Firebase cart
  const saveProductToFirsebase = async (product) => {
    const productWithDefaultQuantity = {
      ...product,
      quantity: selectedQuantity,
    };
    const cartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
    const snap = await getDoc(cartRef);
    if (snap.exists()) {
      const cart = snap.data().cart || [];
      const existingProductIndex = cart.findIndex(
        (item) => item.title === product.title
      );
      if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += selectedQuantity;
      } else {
        cart.push(productWithDefaultQuantity);
      }
      await setDoc(cartRef, { cart: cart }, { merge: true });
      updateUserCart(cart); // Update the user's cart in context to reflect the change
    }
    else {
      await setDoc(cartRef, { cart: [productWithDefaultQuantity] }, { merge: true });
      // Update the user's cart in context to reflect the change immeditely in our website
      updateUserCart([...userCart, productWithDefaultQuantity]);
    }
  }

  // Function to handle Add to Cart button click
  const handleAddToCart = (product) => {
    // If user is not authenticated, add to Redux cart
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
        quantity: selectedQuantity,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock
      }));
    }
    else {
      // If user is authenticated, save to Firebase cart
      saveProductToFirsebase(product);
    }
  }

  // function to handle Buy Now button
  const handleBuyNow = (product) => {
    if (authenticated) {
      dispatch(buyNow({
        id: product.id,
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        images: product.images,
        thumbnail: product.thumbnail,
        brand: product.brand,
        quantity: selectedQuantity,
        discountPercentage: product.discountPercentage,
        rating: product.rating,
        stock: product.stock
      }));
    }
  }

  return (
    <div className='py-5 flex bg-[#0b1120] justify-between'>
      <ScrollRestoration />
      <div className='w-[5%] ml-1'>
        {product.images.map((item, index) => (
          <div key={index} className='border-[1px] border-white/10 rounded-lg mb-5'
            onClick={() => handleImageClick(index)}>
            <img src={item} alt="allImages" className='rounded-lg' />
          </div>
        ))}
      </div>

      <div className='w-[38%]  '><img src={product.images[currentImageIndex]} className='w-full h-[85%]' alt="productImage" /></div>

      <div className='w-[35%] ' >
        <h1 className='text-[26px] font-bold text-white'>{product.title}</h1>
        <p className='text-gray-400 capitalize '>Brand : {product.brand}</p>
        <div className='flex border-b-[1px] border-white/10 pb-1 text-gray-400'>
          <span>{product.rating}&nbsp;</span>
          <span className='flex items-center '>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <img
                key={starIndex}
                className='w-4 h-4'
                src={starIndex <= product.rating ? star : (starIndex - 0.5 <= product.rating ? halfStar : emptyStar)}
                alt={`star-${starIndex}`}
              />
            ))}
          </span>
          <span className='text-gray-400 ml-10'>{product.stock} ratings</span>
        </div>
        <div className='border-b-[1px] border-white/10 pb-2'>
          <div className='flex items-center mt-1 text-[#FF9900]'>
            <p className='font-medium mb-1'>&nbsp;$&nbsp;</p>
            <span className='text-[26px] font-medium'>{product.price}</span>
            <span className='text-gray-400'>&nbsp;({product.discountPercentage}% Off)</span>
          </div>
          <p className='text-gray-400'>No Cost EMI available</p>
        </div>
        <div className='border-b-[1px] border-white/10 pb-4'>
          <div className='flex pt-3 pb-2'>
            <img className="w-7 h-7" src={offers} alt="offers" />
            <span className='ml-5 font-semibold text-lg text-white' >Offers</span>
          </div>
          <div className='flex justify-between'>
            <div className='w-[30%] border-2 border-white/10 rounded-lg p-2 text-gray-400'>
              <p className='font-bold text-white'>No Cost EMI</p>
              <p>EMI interest savings on Amazon Pay ICICI…</p>
            </div>
            <div className='w-[30%] border-2 border-white/10 rounded-lg p-2 text-gray-400'>
              <p className='font-bold text-white'>Bank Offers</p>
              <p>Upto $1,750.00 discount on select Credit Cards, HDFC…</p>
            </div>
            <div className='w-[30%] border-2 border-white/10 rounded-lg p-2 text-gray-400'>
              <p className='font-bold text-white'>Partner Offers</p>
              <p>Get GST invoice and save up to 28% on business purchases.</p>
            </div>
          </div>
        </div>
        <div className='w-full flex items-center justify-around border-b-[1px] border-white/10  pt-4 pb-2'>
          <div className='w-[18%] flex flex-col gap-2 items-center'>
            <img src={delivery} alt="delivery" className='w-9 h-9' />
            <p className='text-gray-400 text-xs'>Free Delivery</p>
          </div>
          <div className='w-[18%] flex flex-col gap-2 items-center'>
            <img src={cod} alt="cod" className='w-9 h-9' />
            <p className='text-gray-400 text-xs'>Pay on Delivery</p>
          </div>
          <div className='w-[18%] flex flex-col gap-2 items-center'>
            <img src={exchange} alt="exchange" className='w-9 h-9' />
            <p className='text-gray-400 text-xs text-center'>7 days Replacement</p>
          </div>
          <div className='w-[18%] flex flex-col gap-2 items-center'>
            <img src={delivered} alt="delivered" className='w-9 h-9' />
            <span className='text-gray-400 text-xs text-center'>Amazon Delivered</span>
          </div>
          <div className='w-[18%] flex flex-col gap-2 items-center '>
            <img src={transaction} alt="transaction" className='w-9 h-9' />
            <p className='text-gray-400 text-xs text-center'>Secure Transaction</p>
          </div>
        </div>
        <div className='pt-2'>
          <span className='font-bold text-white'>About this item</span>
          <div className='ml-2 text-gray-400'>{product.description}</div>
        </div>
      </div>

      <div className='w-[20%] h-[380px] bg-[#151c2b] ring-1 ring-white/5 border-[0.066rem] border-white/10 rounded-lg p-5 mr-1'>
        <div className='flex items-center mt-1'>
          <span className='text-[26px] font-medium text-[#FF9900]'>$&nbsp;{product.price}</span>
          <span className='text-gray-400'>&nbsp;({product.discountPercentage}% Off)</span>
        </div>
        <span className='text-gray-400'>Delivery&nbsp;</span><span className='text-gray-400'>within Two Days.</span>
        <p className='text-[#FF9900] text-xl font-bold pt-4'>In stock.</p>
        <p className='pt-3 text-gray-400'>Sold by <span className='text-gray-400 capitalize '>{product.brand}</span> and <span className='text-gray-400'>Fulfilled by Amazon.</span></p>
        <div className='pt-3 text-gray-400'>
          <span>Quantity: </span>
          <select className='bg-[#0e1420] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 border-[1px] border-white/10 rounded-md ' value={selectedQuantity} onChange={handleQuantityChange}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
        {cartButton
          ? <Link to="/cart">
            <button className={`pt-2 w-full text-center text-white rounded-2xl  bg-white/5 ring-1 ring-white/10 hover:bg-white/10 p-[4px] mt-3 active:ring-2 active:ring-offset-1 active:ring-[#FF9900]`}>
              Go to Cart
            </button>
          </Link>
          : <button
            onClick={() => {
              handleAddToCart(product);
              setCartButton(true);
            }}
            className={`pt-2 w-full text-center bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10 rounded-2xl p-[4px] mt-3  active:ring-2 active:ring-offset-1 active:ring-[#FF9900]`}>
            Add to Cart
          </button>}
        {
          authenticated
            ? <Link to="/checkout">
              <button
                onClick={() => handleBuyNow(product)}
                className={`pt-2 w-full text-center text-black font-bold rounded-2xl bg-[#FF9900] hover:bg-[#FFB145] p-[4px] mt-3  active:ring-2 active:ring-offset-1 active:ring-[#FF9900]`}>
                Buy Now
              </button>
            </Link>
            : <Link to="/signIn">
              <button
                className={`pt-2 w-full text-center text-black font-bold rounded-2xl bg-[#FF9900] hover:bg-[#FFB145] p-[4px] mt-3  active:ring-2 active:ring-offset-1 active:ring-[#FF9900]`}>
                Buy Now
              </button>
            </Link>
        }

        <p className='text-gray-400 pt-3'>Secure transaction</p>
      </div>
    </div>
  )
}

export default ProductDetails;



