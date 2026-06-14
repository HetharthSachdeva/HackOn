import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { addToOrders, addTocancelOrders } from '../redux/amazonSlice';


const UserOrdersContext = createContext();

export const UserOrdersProvider = ({ children }) => {
    const [userOrders, setUserOrders] = useState([]);
    const [userCancelOrders, setUserCancelOrders] = useState([]);
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);
    const dispatch = useDispatch();

    const fetchOrders = async () => {
        if (authenticated && userInfo && userInfo.token) {
            try {
                const response = await axios.get("/api/v1/orders", {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
                const mappedOrders = [];
                const mappedCancelled = [];
                (response.data || []).forEach(order => {
                    const addr = order.address_snapshot || {};
                    const frontendAddr = {
                        name: addr.recipient_name || "Jane Doe",
                        mobile: addr.phone || "",
                        address: addr.line1 || "",
                        area: addr.line2 || "",
                        landmark: addr.landmark || "",
                        city: addr.city || "",
                        pincode: addr.pincode || "",
                        state: addr.state || "",
                        country: "India",
                    };

                    (order.items || []).forEach(item => {
                        const mappedItem = {
                            date: order.created_at,
                            price: parseFloat(item.line_total),
                            uniqueNumber: order.id,
                            thumbnail: item.img_url_snapshot || "",
                            title: item.title_snapshot || "Unknown Item",
                            quantity: item.quantity,
                            category: "Groceries & Kitchen", // fallback category
                            paymentMethod: order.payment?.provider || "cod",
                            address: frontendAddr,
                            status: order.status
                        };

                        if (order.status === "cancelled") {
                            mappedCancelled.push(mappedItem);
                        } else {
                            mappedOrders.push(mappedItem);
                        }
                    });
                });
                setUserOrders(mappedOrders);
                setUserCancelOrders(mappedCancelled);
                dispatch(addToOrders(mappedOrders));
                dispatch(addTocancelOrders(mappedCancelled));
            } catch (error) {
                console.error('Error fetching user Orders data from backend:', error);
            }
        } else {
            setUserOrders([]); // reset the userOrders if user is not authenticated
            setUserCancelOrders([]);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [authenticated, userInfo]);

    // Function to update the userOrders
    const updateUserOrders = (updatedOrders) => {
        setUserOrders(updatedOrders);
    };

    return (
        <UserOrdersContext.Provider value={{ userOrders, userCancelOrders, fetchOrders, updateUserOrders }}>
            {children}
        </UserOrdersContext.Provider>
    );
};

// custom hook to use it anywhere in app
export const useOrders = () => {
    return useContext(UserOrdersContext);
};
