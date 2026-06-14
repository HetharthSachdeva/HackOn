import React, { useState,useEffect } from 'react';
import { useDispatch } from "react-redux";
import { Link } from 'react-router-dom';
import { logoBlack } from '../../assets/index';
import { resetBuyNowProduct } from '../../redux/amazonSlice';
import { useAddress } from '../../context/userAddressContext';
import AddressForm from './addressForm';
import UserAddresses from './userAddresses';
import PaymentMethod from './paymentMethod';
import OrderSummary from './OrderSummary';


const Checkout = () => {
  const dispatch = useDispatch();
  const { userAddress } = useAddress();
  const [showAddressForm, setShowAddressForm] = useState(userAddress.length === 0);

  // Use useEffect to update showAddressForm when userAddress changes
  useEffect(() => {
    setShowAddressForm(userAddress.length === 0);
  }, [userAddress]);

  return (
    <div className='min-h-screen w-full bg-[#0a0a0a] relative overflow-hidden'>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] blur-[150px]">
          <div className="h-[800px] w-[800px] rounded-full bg-[#FF9900]" />
      </div>

      {/* header */}
      <div className='relative z-10 border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between'>
        <Link to="/">
          <div onClick={() => dispatch(resetBuyNowProduct())} className="flex h-10 cursor-pointer items-center">
            <h1 className="text-2xl font-black tracking-tight"><span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span></h1>
          </div>
        </Link>
        <div>
          <h1 className='text-2xl font-black text-white uppercase tracking-widest'>Checkout</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className='mx-auto mt-8 max-w-[1300px] px-6 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-10'>
          
          {/* Left Column - Forms */}
          <div className='lg:col-span-8 flex flex-col gap-8'>
            {
              showAddressForm || userAddress.length === 0
                ? <AddressForm setShowAddressForm={setShowAddressForm} />
                : <UserAddresses setShowAddressForm={setShowAddressForm} />
            }
            <div className='border-b border-white/10'></div>
            
            <PaymentMethod />
            <div className='border-b border-white/10 mb-8'></div>
          </div>

          {/* Right Column - Order Summary */}
          <div className='lg:col-span-4'>
            <div className='sticky top-8'>
              <OrderSummary />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Checkout;


