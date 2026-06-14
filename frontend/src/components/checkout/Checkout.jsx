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

  useEffect(() => {
    setShowAddressForm(userAddress.length === 0);
  }, [userAddress]);

  return (
    <div className='w-full bg-[#0a0a0a] relative overflow-hidden'>
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] blur-[150px]">
          <div className="h-[800px] w-[800px] rounded-full bg-[#FF9900]" />
      </div>

      {/* Main Content */}
      <div className='mx-auto mt-8 mb-20 max-w-[1300px] px-6 relative z-10'>
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


