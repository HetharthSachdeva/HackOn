import React, { useState } from 'react';
import { countryList, states } from "../../constants/index";
import { RotatingLines } from "react-loader-spinner";
import { motion } from "framer-motion";
import axios from 'axios';
import { useSelector } from "react-redux";
import { useAddress } from '../../context/userAddressContext';


const AddressForm = ({ setShowAddressForm }) => {
    const userInfo = useSelector((state) => state.amazon.userInfo);
    const { updateUserAddress } = useAddress();

    //  States to hold user addresses
    const [nameInput, setNameInput] = useState("");
    const [addressInput, setAddressInput] = useState("");
    const [mobileInput, setMobileInput] = useState("");
    const [pincodeInput, setPincodeInput] = useState("");
    const [cityInput, setCityInput] = useState("");
    const [areaInput, setAreaInput] = useState("");
    const [landmarkInput, setLandmarkInput] = useState('');
    const [stateInput, setStateInput] = useState("");
    const countryInput = "India";

    //  states to show error during form submission
    const [nameError, setNameError] = useState("");
    const [mobileError, setMobileError] = useState("");
    const [pincodeError, setPincodeError] = useState("");
    const [cityError, setCityError] = useState("");
    const [addressError, setAddressError] = useState("");
    const [stateError, setStateError] = useState("");

    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // function to validate user Input of address
    const validate = () => {
        // Regular expressions for input validation
        const reqName = /^[A-Za-z\s]+$/;
        const reqCity = /^[A-Za-z\s]+$/;
        const reqMobile = /^[0-9]{10}$/;
        const reqPincode = /^[0-9]{6}$/;
        let isValid = true;

        // Validate name - 1
        if (nameInput === "") {
            setNameError("Please enter a name.");
            isValid = false;
        }
        // Validate name - 2
        if (nameInput.length > 0) {
            if (!reqName.test(nameInput)) {
                setNameError("Please enter a valid name.");
                isValid = false;
            }
        }
        // Validate mobile number - 1 
        if (mobileInput === "") {
            setMobileError("Please enter a phone number so we can call if there are any issues with delivery.");
            isValid = false;
        }
        // Validate mobile number - 2
        if (mobileInput.length > 0) {
            if (!reqMobile.test(mobileInput)) {
                setMobileError("Please enter a valid phone number");
                isValid = false;
            }
        }
        // Validate pincode - 1
        if (pincodeInput === "") {
            setPincodeError("Please enter a ZIP or postal code.");
            isValid = false;
        }
        // Validate pincode - 2
        if (pincodeInput.length > 0) {
            if (!reqPincode.test(pincodeInput)) {
                setPincodeError("Please enter a valid ZIP or postal code.");
                isValid = false;
            }
        }
        // Validate city - 1
        if (cityInput === "") {
            setCityError("Please enter a city name.");
            isValid = false;
        }
        // Validate city - 2
        if (cityInput.length > 0) {
            if (!reqCity.test(cityInput)) {
                setCityError("Please enter a valid city name.");
                isValid = false;
            }
        }
        // Validate address - 1
        if (addressInput === "") {
            setAddressError("Please enter an address.");
            isValid = false;
        }
        // validate state
        if (stateInput === "") {
            setStateError("please select your state");
            isValid = false;
        }

        return isValid;
    }

    // function to save a user's shipping address to Backend.
    const saveShippingAddressToBackend = async (shippingAddress) => {
        try {
            // Map the frontend address fields to backend schema
            const payload = {
                label: "Shipping",
                recipient_name: shippingAddress.name,
                phone: shippingAddress.mobile,
                line1: shippingAddress.address,
                line2: shippingAddress.area || null,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                landmark: shippingAddress.landmark || null,
                is_default: false
            };

            await axios.post("http://localhost:8000/api/v1/addresses", payload, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });

            // Re-fetch all addresses to sync frontend context
            const response = await axios.get("http://localhost:8000/api/v1/addresses", {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });
            const mapped = (response.data || []).map(addr => ({
                name: addr.recipient_name,
                mobile: addr.phone,
                address: addr.line1,
                area: addr.line2 || "",
                landmark: addr.landmark || "",
                city: addr.city,
                pincode: addr.pincode,
                state: addr.state,
                country: "India",
                id: addr.id
            }));

            updateUserAddress(mapped);
            setLoading(false);
            setSuccessMsg("Shipping address saved successfully");
            setShowAddressForm(false);
        } catch (error) {
            setLoading(false);
            setErrorMsg(error.response?.data?.detail || error.message);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = validate();
        if (!isValid) {
            return;
        }
        const shippingAddress = {
            name: nameInput,
            mobile: mobileInput,
            address: addressInput,
            area: areaInput,
            landmark: landmarkInput,
            city: cityInput,
            pincode: pincodeInput,
            state: stateInput,
            country: countryInput,
        };
        setLoading(true);
        await saveShippingAddressToBackend(shippingAddress);
        setNameInput("");
        setMobileInput("");
        setAddressInput("");
        setAreaInput("");
        setLandmarkInput("");
        setPincodeInput("");
        setCityInput("");
        setStateInput("");
    }

    return (
        <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF9900] text-black text-lg">1</span>
                Add New Shipping Address
            </h2>
            
            <div className="bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Full Name</span>
                            <input 
                                onChange={(e) => { setNameInput(e.target.value); setNameError(""); }} 
                                value={nameInput} 
                                type="text" 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                                placeholder="Jane Doe"
                            />
                            {nameError && <span className="text-xs text-red-500 mt-1">{nameError}</span>}
                        </label>
                        
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Mobile Number</span>
                            <input 
                                onChange={(e) => { setMobileInput(e.target.value); setMobileError(""); }} 
                                value={mobileInput} 
                                type="tel" 
                                maxLength="10" 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                                placeholder="10-digit number"
                            />
                            {mobileError && <span className="text-xs text-red-500 mt-1">{mobileError}</span>}
                        </label>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Address Line 1</span>
                        <input 
                            onChange={(e) => { setAddressInput(e.target.value); setAddressError(""); }} 
                            value={addressInput} 
                            type="text" 
                            className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                            placeholder="Flat, House no., Building, Apartment"
                        />
                        {addressError && <span className="text-xs text-red-500 mt-1">{addressError}</span>}
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Area / Street</span>
                        <input 
                            onChange={(e) => setAreaInput(e.target.value)} 
                            value={areaInput} 
                            type="text" 
                            className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                            placeholder="Sector, Village, Street Name"
                        />
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Landmark</span>
                            <input 
                                onChange={(e) => setLandmarkInput(e.target.value)} 
                                value={landmarkInput} 
                                type="text" 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                                placeholder="E.g. Near Apollo Hospital"
                            />
                        </label>
                        
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Pincode</span>
                            <input 
                                onChange={(e) => { setPincodeInput(e.target.value); setPincodeError(""); }} 
                                value={pincodeInput} 
                                type="tel" 
                                maxLength="6" 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                                placeholder="6 digits"
                            />
                            {pincodeError && <span className="text-xs text-red-500 mt-1">{pincodeError}</span>}
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Town/City</span>
                            <input 
                                onChange={(e) => { setCityInput(e.target.value); setCityError(""); }} 
                                value={cityInput} 
                                type="text" 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all"
                            />
                            {cityError && <span className="text-xs text-red-500 mt-1">{cityError}</span>}
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">State</span>
                            <select 
                                value={stateInput} 
                                onChange={(e) => { setStateInput(e.target.value); setStateError(""); }} 
                                className="bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 rounded-lg px-4 py-3 outline-none transition-all cursor-pointer"
                            >
                                <option value="" disabled>Select State</option>
                                {states.map((item, index) => (
                                    <option value={item} key={index}>{item}</option>
                                ))}
                            </select>
                            {stateError && <span className="text-xs text-red-500 mt-1">{stateError}</span>}
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Country</span>
                            <select 
                                defaultValue="India"
                                className="bg-[#141414] text-gray-400 ring-1 ring-white/10 rounded-lg px-4 py-3 outline-none opacity-80 cursor-not-allowed"
                            >
                                <option value="India" disabled>India</option>
                            </select>
                        </label>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row items-center gap-4">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="relative flex w-full md:w-auto items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#FF9900] px-8 py-4 font-mono text-sm font-black uppercase tracking-[0.1em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                        >
                            {loading ? "Saving..." : "Save Address"}
                        </button>
                        
                        {loading && (
                            <RotatingLines strokeColor="#febd69" strokeWidth="5" animationDuration="0.75" width="30" visible={true} />
                        )}
                        
                        {successMsg && (
                            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-green-400">
                                {successMsg}
                            </motion.p>
                        )}
                        {errorMsg && (
                            <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-red-500">
                                {errorMsg}
                            </motion.p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddressForm;


