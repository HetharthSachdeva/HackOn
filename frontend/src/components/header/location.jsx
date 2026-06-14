import React, { useEffect, useState, useRef } from "react";
import { location, required } from '../../assets';
import axios from "axios";
import { RotatingLines } from "react-loader-spinner";

const Location = () => {
    const [selectedLocation, setSelectedLocation] = useState(false);
    const [userZipCode, setUserZipCode] = useState('');
    const [locationName, setLocationName] = useState(null);
    const [warning, setWarning] = useState("");
    const [autoLocationWarning, setAutoLocationWarning] = useState("");
    const [loading, setLoading] = useState(false);
    const [autoLocationLoading, setAutoLocationLoading] = useState(false);

    // NEW — manual free-text address
    const [manualAddress, setManualAddress] = useState('');
    const [manualWarning, setManualWarning] = useState('');

    useEffect(() => {
        const storedLocationName = localStorage.getItem("locationName");
        const storedUserZipCode = localStorage.getItem("userZipCode");
        if (storedLocationName) {
            setLocationName(storedLocationName);
            setUserZipCode(storedUserZipCode || '');
        }
    }, []);

    const locationRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (locationRef.current && !locationRef.current.contains(e.target)) {
                setSelectedLocation(false);
                setWarning("");
                setAutoLocationWarning("");
                setManualWarning("");
            }
        };
        document.body.addEventListener("mousedown", handler);
        return () => document.body.removeEventListener("mousedown", handler);
    }, []);

    async function fetchLocationData(zip) {
        try {
            const response = await axios.get(`https://api.postalpincode.in/pincode/${zip}`);
            if (response.data[0].PostOffice != null) {
                const locationCity = response.data[0].PostOffice[0].District;
                const locationPincode = response.data[0].PostOffice[0].Pincode;
                setLocationName(locationCity);
                setUserZipCode(locationPincode);
                setWarning("");
                setLoading(false);
                setSelectedLocation(false);
                localStorage.setItem("locationName", locationCity);
                localStorage.setItem("userZipCode", locationPincode);
            } else {
                setLoading(false);
                setUserZipCode("");
                setWarning("Location not found");
            }
        } catch (error) {
            setLoading(false);
            setUserZipCode("");
            setWarning(error.message);
        }
    }

    const validate = () => {
        const reqPincode = /^[0-9]{6}$/;
        if (userZipCode === "") { setWarning("Please enter a ZIP or postal code."); return false; }
        if (!reqPincode.test(userZipCode)) { setWarning("Please enter a valid 6-digit ZIP code."); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        fetchLocationData(userZipCode);
    };

    // NEW — save a manually typed address
    const handleSaveManual = (e) => {
        e.preventDefault();
        const addr = manualAddress.trim();
        if (addr.length < 4) { setManualWarning("Please enter a more complete address."); return; }
        setLocationName(addr);
        setUserZipCode('');
        localStorage.setItem("locationName", addr);
        localStorage.removeItem("userZipCode");
        setManualAddress('');
        setManualWarning('');
        setSelectedLocation(false);
    };

    function getLocation() {
        setWarning("");
        setAutoLocationWarning("");
        setAutoLocationLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    try {
                        const response = await axios.get(
                            `https://secure.geonames.org/findNearbyPostalCodesJSON?lat=${latitude}&lng=${longitude}&username=kumardinesh1908`
                        );
                        if (response.data.postalCodes[0] != null) {
                            const locationPincode = response.data.postalCodes[0].postalCode;
                            const locationCity = response.data.postalCodes[0].placeName;
                            setLocationName(locationCity);
                            setUserZipCode(locationPincode);
                            setAutoLocationLoading(false);
                            setSelectedLocation(false);
                            localStorage.setItem("locationName", locationCity);
                            localStorage.setItem("userZipCode", locationPincode);
                        } else {
                            setAutoLocationLoading(false);
                            setAutoLocationWarning("Location not found");
                        }
                    } catch (error) {
                        setAutoLocationLoading(false);
                        setAutoLocationWarning(error.message);
                    }
                },
                (error) => {
                    setAutoLocationLoading(false);
                    setAutoLocationWarning(error.message);
                }
            );
        } else {
            setAutoLocationLoading(false);
            setAutoLocationWarning("Geolocation is not supported by this browser.");
        }
    }

    return (
        <div>
            <button
                type="button"
                className="flex h-10 max-w-[190px] items-center gap-2 rounded-full bg-white/5 px-3 text-left text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                onClick={() => setSelectedLocation(!selectedLocation)}
            >
                <img className="h-4 w-4 opacity-80" src={location} alt="locationIcon" />
                <div className="flex min-w-0 flex-col items-start text-[11px] font-medium leading-tight">
                    {locationName ? 'Deliver to' : 'Hello'}
                    <span className="max-w-[130px] truncate text-xs font-bold text-white">
                        {locationName ? `${locationName}${userZipCode ? ' ' + userZipCode : ''}` : 'Select location'}
                    </span>
                </div>
            </button>

            {selectedLocation &&
                <div className="fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div ref={locationRef} className="w-[340px] overflow-hidden rounded-2xl bg-[#0d0d0d] text-white ring-1 ring-white/10">
                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-white/10 bg-[#141414] p-4 font-bold">
                            <svg className="h-5 w-5 text-[#FF9900]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                            Choose your location
                        </div>

                        <div className="p-4">
                            {/* 1) Manual address (NEW) */}
                            <form onSubmit={handleSaveManual} className="flex flex-col gap-2">
                                <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-gray-400">Enter your address</label>
                                <textarea
                                    rows={2}
                                    value={manualAddress}
                                    placeholder="Flat / House no, street, area, city…"
                                    onChange={(e) => { setManualAddress(e.target.value); setManualWarning(''); }}
                                    className="w-full resize-none rounded-lg border border-white/10 bg-[#141414] p-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-[#FF9900]/50"
                                />
                                {manualWarning && (
                                    <div className="flex items-center gap-1 text-xs text-red-400">
                                        <img src={required} className="h-3.5 w-3.5" alt="warning" /> {manualWarning}
                                    </div>
                                )}
                                <button className="rounded-lg bg-[#FF9900] py-2 text-sm font-bold text-black transition hover:bg-[#ffae33]">
                                    Save address
                                </button>
                            </form>

                            {/* divider */}
                            <div className="my-4 flex items-center gap-3">
                                <hr className="flex-1 border-white/10" />
                                <span className="font-mono text-xs text-gray-500">or by pincode</span>
                                <hr className="flex-1 border-white/10" />
                            </div>

                            {/* 2) Pincode lookup */}
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={userZipCode}
                                    placeholder="6-digit ZIP code"
                                    className="w-[65%] rounded-lg border border-white/10 bg-[#141414] p-2 text-sm font-medium text-white placeholder-gray-600 outline-none focus:border-[#FF9900]/50"
                                    onChange={(e) => { setUserZipCode(e.target.value); setWarning(""); setAutoLocationWarning(""); }}
                                />
                                <button className="w-[35%] rounded-lg border border-white/10 bg-white/5 p-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10">Apply</button>
                            </form>
                            {loading && <div className="mt-2 flex justify-center"><RotatingLines strokeColor="#FF9900" strokeWidth="5" animationDuration="0.75" width="40" visible /></div>}
                            {warning && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                                    <img src={required} className="h-3.5 w-3.5" alt="warning" /> {warning}
                                </div>
                            )}

                            {/* 3) Auto-detect */}
                            <button
                                type="button"
                                onClick={getLocation}
                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/10"
                            >
                                <svg className="h-4 w-4 text-[#FF9900]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Auto-detect my location
                            </button>
                            {autoLocationLoading && <div className="mt-2 flex justify-center"><RotatingLines strokeColor="#FF9900" strokeWidth="5" animationDuration="0.75" width="40" visible /></div>}
                            {autoLocationWarning && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                                    <img src={required} className="h-3.5 w-3.5" alt="warning" /> {autoLocationWarning}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default Location;
