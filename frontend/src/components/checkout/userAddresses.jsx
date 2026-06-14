import React from 'react';
import { useSelector } from "react-redux";
import { useAddress } from '../../context/userAddressContext';
import axios from 'axios';


const UserAddresses = ({ setShowAddressForm }) => {
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const { userAddress, updateUserAddress, updateSelectedAddress } = useAddress();

    // Function to find the index of selected address
    const handleAddressSelect = (index) => {
        const selectedAddress = userAddress[index];   // Get the updated selected address
        updateSelectedAddress(selectedAddress);       // Pass the updated selected address to the context
    };

    // function to delete selected address from backend
    const deleteAddressFromBackend = async (addressIndex) => {
        const address = userAddress[addressIndex];
        if (!address || !address.id) return;
        try {
            await axios.delete(`/api/v1/addresses/${address.id}`, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            updateSelectedAddress(null);  // Update the selected address to null after deletion
            // Update the userAddresses state to reflect the change immediately on the UI
            const updatedUserAddresses = userAddress.filter((_, index) => index !== addressIndex);
            updateUserAddress(updatedUserAddresses);
        } catch (error) {
            console.error('Error deleting address from backend:', error);
            alert("Failed to delete address: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF9900] text-black text-lg">1</span>
                Select a Delivery Address
            </h2>
            
            <div className="bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl shadow-xl overflow-hidden">
                <div className="flex flex-row justify-between items-center bg-[#141414] p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">Your Addresses</h3>
                    <button 
                        onClick={() => setShowAddressForm(true)} 
                        className="text-sm font-mono uppercase tracking-wider text-[#FF9900] hover:text-[#FFB145] transition-colors"
                    >
                        + Add New Address
                    </button>
                </div>
                
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userAddress.map((address, index) => (
                        <label 
                            key={index} 
                            className="relative flex cursor-pointer rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-[#FF9900]/50 transition-colors has-[:checked]:border-[#FF9900] has-[:checked]:bg-[#FF9900]/5"
                        >
                            <div className="flex items-start gap-4">
                                <input
                                    type="radio"
                                    name="selectedAddress"
                                    value={index}
                                    onChange={() => handleAddressSelect(index)}
                                    className="mt-1 h-4 w-4 accent-[#FF9900]"
                                />
                                <div className="flex flex-col gap-1 text-sm text-gray-400">
                                    <span className="font-bold text-white text-base">{address.name}</span>
                                    <span>{address.address}, {address.area}</span>
                                    <span>{address.city}, {address.state} {address.pincode}</span>
                                    <span>{address.country}</span>
                                    <span className="mt-1 font-mono text-gray-300">📞 {address.mobile}</span>
                                    
                                    <button 
                                        onClick={(e) => { e.preventDefault(); deleteAddressFromBackend(index); }} 
                                        className="mt-3 text-xs font-mono uppercase tracking-wider text-red-500 hover:text-red-400 self-start transition-colors"
                                    >
                                        Delete Address
                                    </button>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default UserAddresses;


