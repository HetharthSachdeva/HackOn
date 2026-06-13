import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { correct } from '../../assets/index';
import { deleteProduct, resetCart, increaseQuantity, decreaseQuantity } from '../../redux/amazonSlice';
import { useNavigate, useRouteLoaderData, Link, ScrollRestoration } from 'react-router-dom';
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase.config";
import { useCart } from '../../context/userCartContext';
import CartProduct from './cartProduct';

const CartItems = () => {
    const navigate = useNavigate();
    const data = useRouteLoaderData("root");
    const productsData = data.data.products;
    const dispatch = useDispatch();
    const localCartProducts = useSelector((state) => state.amazon.localCartProducts);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);
    const { userCart, updateUserCart, cartTotalQty, cartTotalPrice } = useCart();
    const [totalQty, setTotalQty] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const cartRef = useRef(null);
    const [productDivHeight, setProductDivHeight] = useState(0);

    useEffect(() => {
        let allPrice = 0;
        let allQty = 0;
        localCartProducts.forEach((product) => {
            allPrice += product.quantity * product.price;
            allQty += product.quantity;
        });
        setTotalPrice(allPrice);
        setTotalQty(allQty);
        // Function to update cart height
        const updateCartHeight = () => {
            if (cartRef.current) {
                const cartHeight = cartRef.current.clientHeight;
                const setHeight = cartHeight + 8;
                setProductDivHeight(setHeight);
            }
        };
        // Call the function when cart items change
        updateCartHeight();

    }, [localCartProducts, userCart]);

    const handleCategoryClick = (category, title) => {
        navigate(`/${category}/${title}`); // Navigate to the products page with the selected category as a URL parameter
    };

    // Function to decrease the quantity of a product in the user's Firebase cart
    const handleDecreaseQuantity = async (productTitle) => {
        const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
        const docSnapshot = await getDoc(userCartRef);
        if (docSnapshot.exists()) {
            const userCartData = docSnapshot.data().cart;
            const productIndex = userCartData.findIndex(product => product.title === productTitle);
            if (productIndex !== -1) {
                if (userCartData[productIndex].quantity > 1) {
                    userCartData[productIndex].quantity -= 1;
                    await setDoc(userCartRef, { cart: userCartData }, { merge: true });
                    const updatedUserCart = userCart.map(product =>
                        product.title === productTitle
                            ? { ...product, quantity: product.quantity - 1 }
                            : product
                    );
                    updateUserCart(updatedUserCart);
                }
            }
        }
    };

    // Function to increase the quantity of a product in the user's Firebase cart
    const handleIncreaseQuantity = async (productTitle) => {
        const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
        const docSnapshot = await getDoc(userCartRef);
        if (docSnapshot.exists()) {
            const userCartData = docSnapshot.data().cart;
            const productIndex = userCartData.findIndex(product => product.title === productTitle);
            if (productIndex !== -1) {
                userCartData[productIndex].quantity += 1;
                await setDoc(userCartRef, { cart: userCartData }, { merge: true });
                const updatedUserCart = userCart.map(product =>
                    product.title === productTitle
                        ? { ...product, quantity: product.quantity + 1 }
                        : product
                );
                updateUserCart(updatedUserCart);
            }
        }
    };

    // Function to delete a product from the user's Firebase cart
    const handleDeleteProduct = async (productTitle) => {
        const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
        const docSnapshot = await getDoc(userCartRef);
        if (docSnapshot.exists()) {
            const userCartData = docSnapshot.data().cart;
            const updatedCart = userCartData.filter(product => product.title !== productTitle);
            await updateDoc(userCartRef, { cart: updatedCart });
            const updatedUserCart = userCart.filter(product => product.title !== productTitle);
            updateUserCart(updatedUserCart);
        }
    };

    // Function to clear the cartItem
    const handleClearCart = async () => {
        if (authenticated) {
            const userCartRef = doc(collection(db, 'users', userInfo.email, 'cart'), userInfo.id);
            await setDoc(userCartRef, { cart: [] }, { merge: true });
            updateUserCart([]);
        } else {
            // If user is not signed in, only clear the Redux cart
            dispatch(resetCart());
        }
    };

    return (
        <div className='mx-auto flex max-w-[1400px] flex-row gap-5 px-4 sm:px-6'>
            <ScrollRestoration />
            <div className=' w-[74%] flex flex-col gap-6 my-10' >
                <div className='w-full rounded-2xl bg-[#151c2b] py-7 px-5 ring-1 ring-white/5' >
                    <h1 className='text-3xl font-black text-white mb-3'>Shopping Cart</h1>
                    <hr className='border-white/10' />
                    {userCart.length > 0
                        ?
                        <div ref={cartRef}>
                            {
                                userCart.map((product, index) => (
                                    <CartProduct
                                        key={index}
                                        product={product}
                                        handleCategoryClick={handleCategoryClick}
                                        handleDecreaseQuantity={() => handleDecreaseQuantity(product.title)}
                                        handleIncreaseQuantity={() => handleIncreaseQuantity(product.title)}
                                        handleDeleteProduct={() => handleDeleteProduct(product.title)}
                                      />
                                ))
                            }
                        </div>
                        :
                        <div ref={cartRef}>
                            {
                                localCartProducts.map((product, index) => (
                                    <CartProduct
                                        key={index}
                                        product={product}
                                        handleCategoryClick={handleCategoryClick}
                                        handleDecreaseQuantity={() => dispatch(decreaseQuantity(product.title))}
                                        handleIncreaseQuantity={() => dispatch(increaseQuantity(product.title))}
                                        handleDeleteProduct={() => dispatch(deleteProduct(product.title))}
                                      />
                                ))
                            }
                        </div>
                    }
                    <div className='mt-4 flex justify-between'>
                        <button onClick={() => handleClearCart()}
                            className='w-[200px] rounded-lg bg-white/5 py-2 text-sm font-semibold text-gray-300 ring-1 ring-white/10 transition hover:text-red-400 hover:ring-red-400/30'>
                            Clear Cart</button>
                        <div className='flex items-baseline justify-end text-[22px] font-medium text-gray-300'>SubTotal ({userCart.length > 0 ? cartTotalQty : totalQty} items) :&nbsp;
                            <span className='text-[24px] font-black text-white'>${userCart.length > 0 ? cartTotalPrice : totalPrice}.00</span>
                        </div>
                    </div>
                </div>
                <p className='px-2 text-sm text-gray-500'>
                    Prices and availability are subject to change. Your cart is a temporary place to store items and reflects each item's most recent price.
                </p>
            </div>
            <div className=' w-[22%] flex flex-col gap-5 my-10 '>
                <div className='w-full rounded-2xl bg-[#151c2b] py-6 px-5 ring-1 ring-white/5'>
                    <div className='flex flex-row gap-2 '>
                        <span className='text-lime-400'>✓</span>
                        <span className='text-[13px] text-lime-300'>Part of your order qualifies for FREE Delivery.
                            <span className='text-gray-500'> Select this at checkout.</span>
                        </span>
                    </div>
                    <div className='mt-4 flex items-baseline text-[18px] font-medium text-gray-300'>SubTotal ({userCart.length > 0 ? cartTotalQty : totalQty} items) :&nbsp;
                        <span className='text-[18px] font-black text-white'>${userCart.length > 0 ? cartTotalPrice : totalPrice}.00</span>
                    </div>
                    {
                        authenticated
                            ? <Link to="/checkout">
                                <button className={`mt-3 w-full rounded-full bg-lime-400 py-2.5 text-center font-bold text-black transition hover:bg-lime-300`}>
                                    Proceed to Buy
                                </button>
                            </Link>
                            : <Link to="/signIn">
                                <button className={`mt-3 w-full rounded-full bg-lime-400 py-2.5 text-center font-bold text-black transition hover:bg-lime-300`}>
                                    Proceed to Buy
                                </button>
                            </Link>
                    }
                    <div className='mt-4 flex items-center justify-center rounded-lg border border-white/10 py-2 text-sm text-gray-400'>EMI Available</div>
                </div>
                <div className='w-full rounded-2xl bg-[#151c2b] ring-1 ring-white/5' >
                    <h1 className='mx-3 pt-3 font-bold text-white'>You might also like</h1>
                    <div style={{ height: productDivHeight }} className='custom-scrollbar ml-3 flex flex-col gap-4 overflow-y-hidden py-3 hover:overflow-y-scroll '>
                        {productsData.map((product, index) => (
                            <div className='flex flex-row gap-2' key={index} >
                                <Link to={`/allProducts/${product.title}`}>
                                    <img className='h-16 w-16 rounded-lg bg-[#0e1420] object-contain p-1' src={product.thumbnail} alt="productImage" />
                                </Link>
                                <div className=''>
                                    <Link to={`/${product.category}/${product.title}`}>
                                        <p className='text-sm font-semibold text-gray-200 hover:text-lime-300'>{product.title.substring(0, 18)}</p>
                                    </Link>
                                    <p className='mt-1 text-[18px] font-bold text-lime-400'>${product.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CartItems;



