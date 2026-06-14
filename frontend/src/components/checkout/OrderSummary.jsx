import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../context/userCartContext';
import { useAddress } from '../../context/userAddressContext';
import { useOrders } from '../../context/userOrderContext';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { resetBuyNowProduct, addToOrders } from '../../redux/amazonSlice';
import { useNavigate } from 'react-router-dom';
// import { loadStripe } from "@stripe/stripe-js";

const OrderSummary = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.amazon.orders);
  const { userCart } = useCart();
  const { updateUserOrders } = useOrders();
  const userInfo = useSelector((state) => state.amazon.userInfo);
  // getting product from BuyNow option in ProductDetails
  const product = useSelector((state) => state.amazon.buyNowProduct);
  if (product) {
    var productQty = product.quantity;
    var productPrice = product.price;
    var productTotalPrice = productPrice * productQty;
  }
  // getting all cart products
  const { cartTotalQty, cartTotalPrice, updateUserCart } = useCart(); //userCart, updateUserCart,
  const { selectedAddress, selectedPayment } = useAddress();

  let deliveryCharges = 0;
  if ((productTotalPrice || cartTotalPrice) < 499) {
    deliveryCharges = 40;
  }

  const [deliveryInfo, setDeliveryInfo] = useState(false);
  const deliveryInfoRef = useRef(null);

  const toggleDeliveryInfo = () => {
    setDeliveryInfo(!deliveryInfo);
  };

  // Function to reset buyNowProduct
  const resetBuyNow = () => {
    dispatch(resetBuyNowProduct());
  };

  useEffect(() => {
    // Add a popstate event listener when the component mounts
    window.addEventListener('popstate', resetBuyNow);
    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', resetBuyNow);
    };
  }, [dispatch]);

  const generateUniqueNumber = () => {
    // Generate a timestamp-based unique number (for example)
    const timestamp = new Date().getTime();
    const randomDigits = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomDigits}`;
  };

  const makePayment = async () => {
      try {
          // If it's a "Buy Now" product, add it to the backend cart first
          if (product) {
              await axios.post("http://localhost:8000/api/v1/cart/items", {
                  asin: product.id,
                  quantity: product.quantity
              }, {
                  headers: { Authorization: `Bearer ${userInfo.token}` }
              });
          }

          // Place the order
          await axios.post("http://localhost:8000/api/v1/orders", {
              address_id: selectedAddress.id,
              payment_provider: selectedPayment === "card" ? "mock_card" : "cod",
              slot_type: "express"
          }, {
              headers: { Authorization: `Bearer ${userInfo.token}` }
          });

          // Fetch updated orders to sync context state
          const ordersRes = await axios.get("http://localhost:8000/api/v1/orders", {
              headers: { Authorization: `Bearer ${userInfo.token}` }
          });
          const mappedOrders = [];
          (ordersRes.data || []).forEach(order => {
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
                  mappedOrders.push({
                      date: order.created_at,
                      price: parseFloat(item.line_total),
                      uniqueNumber: order.id,
                      thumbnail: item.img_url_snapshot || "",
                      title: item.title_snapshot || "Unknown Item",
                      quantity: item.quantity,
                      category: "Groceries & Kitchen",
                      paymentMethod: order.payment?.provider || "cod",
                      address: frontendAddr
                  });
              });
          });

          dispatch(addToOrders(mappedOrders));
          updateUserOrders(mappedOrders);

          // Clear cart context
          updateUserCart([]);
          resetBuyNow();
          navigate("/orders");
      } catch (error) {
          console.error("Checkout order placement failed:", error);
          alert("Order placement failed: " + (error.response?.data?.detail || error.message));
      }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8">
          <h3 className="text-2xl font-black text-white mb-6">Order Summary</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Items ({product ? productQty : cartTotalQty}):</span>
              <span className="font-semibold text-white">₹{product ? productTotalPrice.toFixed(2) : cartTotalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Delivery Fee:</span>
              {deliveryCharges === 0 ? (
                <span className="font-bold text-[#FF9900]">FREE</span>
              ) : (
                <span className="font-semibold text-white">₹{deliveryCharges.toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="my-5 border-t border-white/10"></div>

          <div className="flex items-center justify-between">
            <span className="text-lg text-gray-300">Order Total</span>
            <span className="text-3xl font-black text-[#FF9900]">
              ₹{product ? (productTotalPrice + deliveryCharges).toFixed(2) : (cartTotalPrice + deliveryCharges).toFixed(2)}
            </span>
          </div>

          {selectedAddress && (
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF9900] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Shipping To
              </h4>
              <p className="text-sm font-semibold text-white">{selectedAddress.name}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {selectedAddress.address}, {selectedAddress.area}<br/>
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
              </p>
            </div>
          )}

          {selectedPayment && (
            <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF9900] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                Payment Method
              </h4>
              <p className="text-sm font-semibold text-white capitalize">{selectedPayment}</p>
            </div>
          )}
        </div>

        <div className="bg-[#141414] p-6 border-t border-white/10">
          {(selectedAddress && selectedPayment) ? (
            <button 
              onClick={makePayment}
              className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#FF9900] px-6 py-4 font-mono text-sm font-black uppercase tracking-[0.1em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Place Your Order
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          ) : (
            <button disabled className="w-full rounded-xl bg-gray-800 px-6 py-4 font-mono text-sm font-black uppercase tracking-[0.1em] text-gray-500 cursor-not-allowed">
              Complete details above
            </button>
          )}
          
          <p className="mt-4 text-center text-xs text-gray-500 leading-relaxed">
            By placing your order, you agree to Amazon's <br/>
            <a href="#" className="text-[#FF9900] hover:underline">Privacy Notice</a> and <a href="#" className="text-[#FF9900] hover:underline">Conditions of Use</a>.
          </p>
        </div>
      </div>

      <button onClick={toggleDeliveryInfo} className="text-xs font-mono tracking-wider text-gray-400 hover:text-[#FF9900] text-center w-full transition-colors flex items-center justify-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        How are delivery costs calculated?
      </button>

      {deliveryInfo && (
        <div ref={deliveryInfoRef} className="rounded-xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl animate-fade-in-up">
          <div className="bg-[#141414] p-3 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-sm font-bold text-white">Delivery Costs</h4>
            <button onClick={toggleDeliveryInfo} className="text-gray-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="bg-white/[0.02] font-mono uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Speed</th>
                  <th className="px-4 py-3">Prime</th>
                  <th className="px-4 py-3">Non-Prime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-3 text-white">Same-Day</td>
                  <td className="px-4 py-3 text-green-400 font-bold">Free</td>
                  <td className="px-4 py-3">₹175</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-white">One-Day</td>
                  <td className="px-4 py-3 text-green-400 font-bold">Free</td>
                  <td className="px-4 py-3">₹150</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-white">Standard**</td>
                  <td className="px-4 py-3 text-green-400 font-bold">Free</td>
                  <td className="px-4 py-3">₹40</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-white/[0.02] border-t border-white/5 text-[10px] text-gray-500">
            **Standard Delivery is free for non-Prime members for orders ₹499 or more.
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderSummary;


