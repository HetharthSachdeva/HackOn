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
    <div>
      <div className=" mx-auto bg-[#0d0d0d] ring-1 ring-white/5 border-[1px] border-white/10 rounded-lg mt-3">
        <div className=" mt-2 px-[18px]">
          <h3 className=" text-xl font-semibold pt-2 mb-3 text-white">Order Summary</h3>
          <div className="flex justify-between mb-[2px] text-sm text-gray-400">
            <p>Total Items:</p>
            <p>{product ? productQty : cartTotalQty}</p>
          </div>
          <div className="flex justify-between mb-[2px] text-sm text-gray-400">
            <p>Total Price:</p>
            <p>${product ? productTotalPrice.toFixed(2) : cartTotalPrice.toFixed(2)}</p>
          </div>
          <div className="flex justify-between mb-[2px] text-sm text-gray-400">
            <p>Delivery:</p>
            <p>${deliveryCharges}.00</p>
          </div>
          <div className="text-xl font-semibold flex justify-between py-2 border-t border-white/10 text-[#FF9900]">
            <p>Order Total:</p>
            <p>${product ? (productTotalPrice + deliveryCharges).toFixed(2) : (cartTotalPrice + deliveryCharges).toFixed(2)}</p>
          </div>

          {selectedAddress &&
            <div >
              <h3 className="border-t border-white/10 text-lg font-semibold py-2 text-white">Selected Address</h3>
              <div className="mb-2 text-sm text-gray-400">
                <p className='font-semibold text-white'>Name : {selectedAddress.name}</p>
                <span>{selectedAddress.address}, {selectedAddress.area}, {selectedAddress.landmark}, {selectedAddress.city}, {selectedAddress.pincode}, {selectedAddress.state}, {selectedAddress.country}</span>
              </div>
            </div>
          }

          {selectedPayment &&
            <div >
              <h3 className="border-t border-white/10 text-lg font-semibold py-2 text-white">Selected Payment Method</h3>
              <div className="mb-2 text-sm text-gray-400">
                <p className='font-semibold capitalize'> {selectedPayment}</p>
              </div>
            </div>
          }
        </div>

        <div className='mx-[18px] border-t border-white/10'>
          {(selectedAddress && selectedPayment) &&
            <button className="w-full text-center text-sm rounded-lg bg-[#FF9900] text-black font-bold hover:bg-[#FFB145] p-[7px] mt-2 active:ring-2 active:ring-offset-1 active:ring-[#FF9900]"
              onClick={makePayment}
            >
              Place your order
            </button>
          }
          <p className="text-xs text-gray-400  my-2 text-center">
            By placing your order, you agree to Amazon's
            <a href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200522700" className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> privacy notice </a>
            and
            <a href="https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940" className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> conditions of use</a>.
          </p>
        </div>

        <div className="flex justify-between border-t border-white/10 rounded-br-lg rounded-bl-lg bg-[#141414]">
          <p onClick={toggleDeliveryInfo} className="pl-[18px] my-4 text-xs tracking-wide text-[#FF9900] hover:underline hover:text-[#FFB145] hover:cursor-pointer">
            How are delivery costs calculated?
          </p>
        </div>
      </div>

      {
        deliveryInfo &&
        <div ref={deliveryInfoRef} className="border border-white/10 bg-[#0d0d0d] ring-1 ring-white/5 mt-2 w-[400px]">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-[#141414] ">
                <th className="px-2 py-1 border border-white/10 text-xs text-gray-300">Shipping Speed</th>
                <th className="px-2 py-1 border border-white/10 text-xs text-gray-300">Prime Members</th>
                <th className="px-2 py-1 border border-white/10 text-xs text-gray-300">Prime Lite Members</th>
                <th className="px-2 py-1 border border-white/10 text-xs text-gray-300">Non-Prime Members</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#141414]">
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Same-Day Delivery</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$175</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$175</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">One-Day Delivery</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$150</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$150</td>
              </tr>
              <tr className="bg-[#141414]">
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Two-Day Delivery</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$120</td>
              </tr>
              <tr>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">No-Rush Delivery</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">N.A</td>
              </tr>
              <tr className="bg-[#141414]">
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Standard Delivery**</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">Free</td>
                <td className="px-2 py-1 border border-white/10 text-xs text-gray-300">$40</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-gray-400 mt-2 p-2">
            **Standard Delivery charges are free for non-Prime members for orders $499 or more.
          </p>
          <div className='flex justify-end relative'>
            <button className='text-sm text-[#FF9900] hover:text-[#FFB145] absolute -top-5 right-1' onClick={toggleDeliveryInfo}>Close</button>
          </div>
        </div>
      }
    </div>
  )
}

export default OrderSummary;


