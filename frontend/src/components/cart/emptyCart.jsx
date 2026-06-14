import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AIBundleCartGenerator from './AIBundleCartGenerator';

const EmptyCart = () => {
    const authenticated = useSelector((state) => state.amazon.isAuthenticated);

    return (
        <div className='mx-auto my-12 w-full max-w-4xl space-y-8'>
            <div className='flex flex-col items-center gap-6 rounded-3xl bg-[#0d0d0d] px-6 py-12 text-center ring-1 ring-white/5'>
                <div className='grid h-28 w-28 place-items-center rounded-full bg-[#FF9900]/10 text-6xl'>🛒</div>
                <h1 className='text-3xl font-black text-white'>Your cart is empty</h1>
                <p className='max-w-md text-gray-400'>
                    Add your favourite snacks, drinks and essentials and get them dashed to your door in minutes.
                </p>
                <Link to="/allProducts">
                    <button className='rounded-full bg-[#FF9900] px-8 py-3 font-bold text-black transition hover:bg-[#FFB145]'>
                        Start shopping
                    </button>
                </Link>
            </div>

            {authenticated && (
                <AIBundleCartGenerator />
            )}
        </div>
    )
}

export default EmptyCart
