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
    <div className='min-h-screen w-full bg-[#0a0a0a]'>
      {/* header */}
      <div className='relative mx-5 flex flex-row items-center justify-around border-b border-white/10 pb-3 pt-[18px]'>
        <Link to="/">
          <div onClick={() => dispatch(resetBuyNowProduct())} className="flex h-12 cursor-pointer items-center px-2">
            <h1 className="text-2xl font-black tracking-tight"><span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span></h1>
          </div>
        </Link>
        <div className=''>
          <h1 className='text-[28px] font-bold text-white'>Checkout</h1>
        </div>
      </div>

      {/* addresssForm or userAddress and PaymentMethod */}
      <div className='mx-auto mt-3 flex max-w-[1400px] flex-row justify-center gap-6 px-5'>
        <div className='w-[61%] '>

          {
            showAddressForm || userAddress.length === 0
              ? <AddressForm setShowAddressForm={setShowAddressForm} />
              : <UserAddresses setShowAddressForm={setShowAddressForm} />
          }
          <div className='mt-3 border-b border-white/10'></div>

          <PaymentMethod />
          <div className='mt-3 border-b border-white/10'></div>

        </div>

        {/* OrderSummary */}
        <div className='sticky top-3 h-full w-[22%]'>
          <OrderSummary />
        </div>

      </div>
    </div>
  )
}

export default Checkout;


