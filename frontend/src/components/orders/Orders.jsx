import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../context/userOrderContext';
import { addToOrders, addTocancelOrders, addToreturnOrders } from '../../redux/amazonSlice';
import axios from 'axios';
import OrderDetails from './orderDetails';

const Orders = () => {
  const dispatch = useDispatch();
  const { userOrders, updateUserOrders, fetchOrders } = useOrders();
  const orders = useSelector((state) => state.amazon.orders);
  const cancelOrders = useSelector((state) => state.amazon.cancelOrders);
  const returnOrders = useSelector((state) => state.amazon.returnOrders);
  const authenticated = useSelector((state) => state.amazon.isAuthenticated);
  const userInfo = useSelector((state) => state.amazon.userInfo);

  // Reverse the orders array
  const reversedOrders = [...orders].reverse();
  const reversedCancelOrders = [...cancelOrders].reverse();
  const reversedReturnOrders = [...returnOrders].reverse();

  const [showOrders, setShowOrders] = useState(true);
  const [showCancelOrders, setShowCancelOrders] = useState(false);
  const [showReturnOrders, setShowReturnOrders] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate

  // Use useEffect to navigate when isAuthenticated is false
  useEffect(() => {
    if (!authenticated) {
      navigate('/signIn');
    }
  }, [authenticated, navigate]);

  // Load returned orders from localStorage on mount
  useEffect(() => {
    if (userInfo && userInfo.id) {
      const storedReturns = JSON.parse(localStorage.getItem(`returns_${userInfo.id}`) || "[]");
      dispatch(addToreturnOrders(storedReturns));
    }
  }, [userInfo, dispatch]);

  const handleCancelOrder = async (item) => {
    try {
      await axios.post(`http://localhost:8000/api/v1/orders/${item.uniqueNumber}/cancel`, {
        reason: "User cancelled"
      }, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });
      await fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert("Failed to cancel order: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleReturnOrder = async (item) => {
    try {
      const currentReturns = JSON.parse(localStorage.getItem(`returns_${userInfo.id}`) || "[]");
      currentReturns.push(item);
      localStorage.setItem(`returns_${userInfo.id}`, JSON.stringify(currentReturns));
      dispatch(addToreturnOrders(currentReturns));

      const updatedUserOrders = userOrders.filter(order => order.uniqueNumber !== item.uniqueNumber);
      updateUserOrders(updatedUserOrders);
      dispatch(addToOrders(updatedUserOrders));
    } catch (error) {
      console.error('Error saving return order:', error);
    }
  };

  return (
    <div className='w-full relative py-6 flex flex-col gap-5 bg-[#0a0a0a] '>
      <div className='w-full h-10 flex gap-7 pl-[8%] mdl:pl-[15%] text-base mdl:text-2xl'>
        <p className={`font-semibold cursor-pointer border-r-2 border-white/10 pr-3 mdl:pr-6 ${showOrders ? "text-[#FF9900]" : "text-gray-400"}`} onClick={() => {
          setShowOrders(true);
          setShowCancelOrders(false);
          setShowReturnOrders(false);
        }}>Your Orders</p>
        <p className={`font-semibold cursor-pointer border-r-2 border-white/10 pr-3 mdl:pr-6 ${showCancelOrders ? "text-[#FF9900]" : "text-gray-400"}`} onClick={() => {
          setShowOrders(false);
          setShowCancelOrders(true);
          setShowReturnOrders(false);
        }}>Cancelled Orders</p>
        <p className={`font-semibold cursor-pointer ${showReturnOrders ? "text-[#FF9900]" : "text-gray-400"}`} onClick={() => {
          setShowOrders(false);
          setShowCancelOrders(false);
          setShowReturnOrders(true);
        }}>Returned Orders</p>
      </div>

      {showOrders && <OrderDetails ordersData={reversedOrders} reversedOrders={reversedOrders} handleCancelOrder={handleCancelOrder} handleReturnOrder={handleReturnOrder} />}
      {showCancelOrders && <OrderDetails ordersData={reversedCancelOrders} />}
      {showReturnOrders && <OrderDetails ordersData={reversedReturnOrders} />}

    </div >
  )
};
export default Orders;


