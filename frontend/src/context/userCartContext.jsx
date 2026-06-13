import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';


const UserCartContext = createContext();

export const UserCartProvider = ({ children }) => {
    const [userCart, setUserCart] = useState([]);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);

    const mapBackendCart = (cartData) => {
        return (cartData.items || []).map((item) => {
            const prod = item.product || {};
            return {
                id: item.asin,
                asin: item.asin,
                title: prod.title || "Unknown Product",
                price: prod.price ? parseFloat(prod.price) : 0.0,
                thumbnail: prod.img_url || "",
                images: prod.img_url ? [prod.img_url] : [],
                brand: prod.unit_size || "Q-Commerce",
                quantity: item.quantity,
                category: prod.category || "",
                description: prod.tags || "",
                rating: prod.stars || 0.0,
                stock: prod.stock_qty || 0,
                discountPercentage: 10,
            };
        });
    };

    const fetchCart = async () => {
        if (authenticated && userInfo && userInfo.token) {
            try {
                const response = await axios.get("http://localhost:8000/api/v1/cart", {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
                setUserCart(mapBackendCart(response.data));
            } catch (error) {
                console.error('Error fetching user cart data from backend:', error);
            }
        } else {
            setUserCart([]);
        }
    };

    useEffect(() => {
        fetchCart();
    }, [authenticated, userInfo]);

    const addToCartBackend = async (asin, quantity) => {
        if (!authenticated || !userInfo?.token) return;
        try {
            const response = await axios.post("http://localhost:8000/api/v1/cart/items", {
                asin,
                quantity
            }, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            setUserCart(mapBackendCart(response.data));
        } catch (error) {
            console.error('Error adding item to backend cart:', error);
        }
    };

    const updateCartItemQtyBackend = async (asin, quantity) => {
        if (!authenticated || !userInfo?.token) return;
        try {
            const response = await axios.put(`http://localhost:8000/api/v1/cart/items/${asin}`, {
                quantity
            }, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            setUserCart(mapBackendCart(response.data));
        } catch (error) {
            console.error('Error updating item qty in backend cart:', error);
        }
    };

    const deleteCartItemBackend = async (asin) => {
        if (!authenticated || !userInfo?.token) return;
        try {
            const response = await axios.delete(`http://localhost:8000/api/v1/cart/items/${asin}`, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            setUserCart(mapBackendCart(response.data));
        } catch (error) {
            console.error('Error deleting item from backend cart:', error);
        }
    };

    const clearCartBackend = async () => {
        if (!authenticated || !userInfo?.token) return;
        try {
            const response = await axios.delete("http://localhost:8000/api/v1/cart", {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            setUserCart(mapBackendCart(response.data));
        } catch (error) {
            console.error('Error clearing backend cart:', error);
        }
    };

    // Function to update the userCart in the cartItem
    const updateUserCart = (updatedCart) => {
        setUserCart(updatedCart);
    };

    const [cartTotalQty, setCartTotalQty] = useState(0);
    const [cartTotalPrice, setCartTotalPrice] = useState(0);

    useEffect(() => {
        let allPrice = 0;
        let allQty = 0;
        if (userCart.length > 0 && authenticated) {
            userCart.forEach((product) => {
                allPrice += product.quantity * product.price;
                allQty += product.quantity;
            });
            setCartTotalPrice(allPrice);
            setCartTotalQty(allQty);
        }
        else{
            setCartTotalQty(0);
            setCartTotalPrice(0);
        }
    }, [userCart, authenticated]);

    return (
        <UserCartContext.Provider value={{
            userCart,
            updateUserCart,
            cartTotalQty,
            cartTotalPrice,
            addToCartBackend,
            updateCartItemQtyBackend,
            deleteCartItemBackend,
            clearCartBackend,
            fetchCart
        }}>
            {children}
        </UserCartContext.Provider>
    );
};

// custom hook to use it anywhere in app
export const useCart = () => {
    return useContext(UserCartContext);
};
