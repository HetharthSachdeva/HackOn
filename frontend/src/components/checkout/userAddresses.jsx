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
            await axios.delete(`http://localhost:8000/api/v1/addresses/${address.id}`, {
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
        <div >
            <p className='text-lg font-semibold text-white'>1 &nbsp; Select a delivery address</p>
            <div className='w-full flex justify-end'>
                <div className='w-[96%] bg-[#0d0d0d] ring-1 ring-white/5 border-[1px] border-white/10 rounded-lg mt-1 px-4 py-2'>
                    <div className='flex flex-row justify-between border-b border-white/10'>
                        <p className='text-lg font-semibold text-white'>Your addresses</p>
                        <button onClick={() => { setShowAddressForm(true) }} className='text-lg font-semibold text-[#FF9900] hover:text-[#FFB145] hover:underline'>Add new address</button>
                    </div>
                    {
                        userAddress.map((address, index) => (
                            <label key={index} className="flex items-start my-5 mx-3 text-gray-300">
                                <input
                                    type="radio"
                                    name="selectedAddress"
                                    value={index}
                                    onChange={() => handleAddressSelect(index)}
                                />
                                <span className="text-sm capitalize -mt-1 ml-2">
                                    <span className='font-semibold text-white'>{address.name}</span>
                                    <span> {address.address}</span>
                                    <span>, {address.area}</span>
                                    <span>, {address.landmark}</span>
                                    <span>, {address.city} </span>
                                    <span>, {address.pincode}</span>
                                    <span>, State : {address.state}</span>
                                    <span>, Country : {address.country}</span>
                                    <span>, Mobile Number : {address.mobile} &nbsp;</span>
                                    <button onClick={() => deleteAddressFromBackend(index)} className='text-[#FF9900] hover:text-[#FFB145] hover:underline'>Delete this address</button>
                                </span>
                            </label>
                        ))}
                </div>
            </div>
        </div>
    )
}

export default UserAddresses;


