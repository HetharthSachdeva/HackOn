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
      await axios.post(`/api/v1/orders/${item.uniqueNumber}/cancel`, {
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
    <div className='min-h-screen relative font-sans bg-[#0a0a0a] text-white overflow-hidden py-12 px-4 sm:px-8 lg:px-16'>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 opacity-[0.05] blur-[150px]">
        <div className="h-[800px] w-[800px] rounded-full bg-[#FF9900]" />
      </div>

      <div className='mx-auto max-w-7xl relative z-10'>
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6">Your Orders</h1>
          
          {/* Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
            {[
              { id: 'orders', label: 'Active Orders', state: showOrders, onClick: () => { setShowOrders(true); setShowCancelOrders(false); setShowReturnOrders(false); } },
              { id: 'cancelled', label: 'Cancelled', state: showCancelOrders, onClick: () => { setShowOrders(false); setShowCancelOrders(true); setShowReturnOrders(false); } },
              { id: 'returned', label: 'Returned', state: showReturnOrders, onClick: () => { setShowOrders(false); setShowCancelOrders(false); setShowReturnOrders(true); } }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`relative px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
                  tab.state 
                    ? 'bg-[#FF9900] text-black shadow-[0_0_15px_rgba(255,153,0,0.3)]' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[50vh]">
          {showOrders && <OrderDetails ordersData={reversedOrders} reversedOrders={reversedOrders} handleCancelOrder={handleCancelOrder} handleReturnOrder={handleReturnOrder} />}
          {showCancelOrders && <OrderDetails ordersData={reversedCancelOrders} />}
          {showReturnOrders && <OrderDetails ordersData={reversedReturnOrders} />}
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
};
export default Orders;


