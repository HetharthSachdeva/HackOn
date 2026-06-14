import React, { useState } from "react";
import { useAddress } from '../../context/userAddressContext';
// import CardDetails from "./cardDetails";

const PaymentMethod = () => {
    const { updateSelectedPayment } = useAddress();

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    const handleSelectPaymentMethod = (event) => {
        setSelectedPaymentMethod(event.target.value);
        updateSelectedPayment(event.target.value);
    };

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF9900] text-black text-lg">2</span>
                Select a Payment Method
            </h2>
            
            <div className="bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-[#141414] p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Payment Options</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 font-medium">
                    {[
                        { id: 'card', label: 'Credit or Debit Card', icon: '💳' },
                        { id: 'upi', label: 'UPI Apps', icon: '📱' },
                        { id: 'emi', label: 'EMI', icon: '🏦' },
                        { id: 'cod', label: 'Cash on Delivery', icon: '💵' }
                    ].map(method => (
                        <label 
                            key={method.id} 
                            className="relative flex items-center cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-[#FF9900]/50 transition-colors has-[:checked]:border-[#FF9900] has-[:checked]:bg-[#FF9900]/5"
                        >
                            <input 
                                type="radio" 
                                name="paymentMethod" 
                                value={method.id} 
                                onChange={handleSelectPaymentMethod}
                                className="h-4 w-4 accent-[#FF9900]"
                            />
                            <div className="ml-4 flex items-center gap-3">
                                <span className="text-2xl">{method.icon}</span>
                                <span className="text-white">{method.label}</span>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="px-6 pb-6 pt-2">
                    <p className="text-xs font-mono tracking-wider text-gray-500 uppercase flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Secure transaction. Cash, UPI, and Cards accepted.
                    </p>
                </div>
            </div>
        </div>
    );
};


export default PaymentMethod;


