import React, { useState } from 'react';
import { logoBlack } from '../../assets';
import { Link } from 'react-router-dom';
import { i, right } from '../../assets';
import { RotatingLines } from "react-loader-spinner";
import { supabase } from '../../api/supabaseClient';

const CreateAccount = () => {
    const [nameInput, setNameInput] = useState("");
    const [mobileInput, setMobileInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);

    const [nameError, setNameError] = useState("");
    const [mobileError, setMobileError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [firebaseError, setFirebaseError] = useState("");

    // Function to validate user input
    const validate = () => {
        // Regular expressions for input validation
        const reqName = /^[A-Za-z\s]+$/;
        const reqEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const reqMobile = /^[0-9]{10}$/;
        const reqPassword = /^.{6,}$/;
        let isValid = true;

        // Validate name
        if (!reqName.test(nameInput)) {
            setNameError("Enter your name");
            isValid = false;
        }
        if (mobileInput === "") {
            setMobileError("");
            isValid = true;
        }
        // Validate mobile number
        if (mobileInput) {
            if (!reqMobile.test(mobileInput)) {
                setMobileError("Enter a valid mobile number");
                isValid = false;
            }
        }
        // Validate email
        if (!reqEmail.test(emailInput)) {
            setEmailError("Enter a valid email address");
            isValid = false;
        }
        // Validate password
        if (!reqPassword.test(passwordInput)) {
            setPasswordError("Enter your password");
            isValid = false;
        }
        return isValid;
    }

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        const isValid = validate();
        if (!isValid) {
            return;
        }
        setLoading(true);
        
        supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
            options: {
                data: {
                    full_name: nameInput,
                    phone: mobileInput
                }
            }
        })
        .then(({ data, error }) => {
            setLoading(false);
            if (error) {
                if (error.message.includes("already registered")) {
                    setFirebaseError("Email already in use. Try another one.");
                } else {
                    setFirebaseError(error.message);
                }
                return;
            }
            setSuccessMsg(true);
        })
        .catch((err) => {
            setLoading(false);
            setFirebaseError("Failed to create an account. Please try again later.");
        });

        // Reset input fields
        setEmailInput("");
        setMobileInput("");
        setNameInput("");
        setPasswordInput("");
    };

    return (
        <div className='min-h-screen bg-[#0a0a0a] w-full flex flex-col relative overflow-hidden'>
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] blur-[120px]">
                <div className="h-[600px] w-[600px] rounded-full bg-[#FF9900]" />
            </div>

            <div className='flex flex-col justify-center items-center flex-1 relative z-10 py-10'>
                <Link to="/">
                    <div className="headerHover transition-transform hover:scale-105">
                        <h1 className="text-3xl font-black tracking-tight mt-2 mb-2">
                            <span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span>
                        </h1>
                    </div>
                </Link>

                <div className='w-full max-w-[450px] mt-4 bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl shadow-2xl p-8'>
                    <span className='text-[28px] font-black tracking-tight text-white mb-6 block'>
                        Create Account
                    </span>
                    {
                        successMsg
                            ? <div className='my-4 p-5 rounded-xl bg-green-400/10 border border-green-400/20 flex flex-col gap-3'>
                                <p className='font-bold text-green-400 text-lg'>
                                    Account successfully created!
                                </p>
                                <p className='text-sm text-gray-300'>
                                    Please check your email for a verification link to confirm your email address.
                                </p>
                                <p className='text-xs text-red-400 font-mono'>
                                    * Remember, if you don't verify your email, your data may be lost.
                                </p>
                            </div>
                            : <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                                <label className='flex flex-col gap-1.5'>
                                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Full Name</span>
                                    <input 
                                        type="text" 
                                        placeholder="Jane Doe" 
                                        autoComplete="true" 
                                        value={nameInput} 
                                        onChange={(e) => {
                                            setNameInput(e.target.value);
                                            setNameError("");
                                        }} 
                                        className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                    />
                                    {nameError && <div className='text-xs text-red-500 mt-1'>{nameError}</div>}
                                </label>
                                
                                <label className='flex flex-col gap-1.5'>
                                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Email Address</span>
                                    <input 
                                        type="text" 
                                        value={emailInput} 
                                        autoComplete="true" 
                                        placeholder="jane@example.com"
                                        onChange={(e) => {
                                            setEmailInput(e.target.value.toString().toLowerCase());
                                            setEmailError("");
                                            setFirebaseError("");
                                        }} 
                                        className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                    />
                                    {(emailError || firebaseError) && <div className='text-xs text-red-500 mt-1'>{emailError || firebaseError}</div>}
                                </label>
                                
                                <label className='flex flex-col gap-1.5'>
                                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Mobile Number (Optional)</span>
                                    <div className='flex items-center gap-2'>
                                        <div className='bg-[#141414] ring-1 ring-white/10 text-gray-400 rounded-lg px-4 py-3 font-mono text-sm'>
                                            +91
                                        </div>
                                        <input 
                                            type="tel" 
                                            autoComplete="true" 
                                            maxLength="10" 
                                            placeholder="10-digit number" 
                                            value={mobileInput} 
                                            onChange={(e) => {
                                                setMobileInput(e.target.value);
                                                setMobileError("");
                                            }} 
                                            className='flex-1 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                        />
                                    </div>
                                    {mobileError && <div className='text-xs text-red-500 mt-1'>{mobileError}</div>}
                                </label>
                                
                                <label className='flex flex-col gap-1.5'>
                                    <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Password</span>
                                    <input 
                                        type="password" 
                                        autoComplete="true" 
                                        value={passwordInput} 
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            setPasswordError("");
                                        }} 
                                        placeholder="At least 6 characters" 
                                        className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                    />
                                    {passwordError 
                                        ? <div className='text-xs text-red-500 mt-1'>{passwordError}</div>
                                        : <div className='flex items-center gap-1.5 mt-1 opacity-70'>
                                            <img src={i} alt='info' className='w-3.5 h-3.5 opacity-50' />
                                            <span className='text-xs font-mono text-gray-400'>Must be at least 6 characters.</span>
                                        </div>
                                    }
                                </label>

                                <button 
                                    className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[#FF9900] px-8 py-3.5 font-mono text-sm font-black uppercase tracking-[0.1em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98] mt-4`}
                                >
                                    Create Account
                                </button>
                                
                                {loading && <div className='flex justify-center mt-2'>
                                    <RotatingLines strokeColor="#febd69" strokeWidth="4" animationDuration="0.75" width="30" visible={true} />
                                </div>}
                            </form>
                    }
                    
                    <div className='flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/5'>
                        <span className='text-sm text-gray-400'>
                            {successMsg ? "Ready to shop?" : "Already have an account?"}
                        </span>
                        <Link to="/signIn">
                            <span className='text-sm font-bold text-[#FF9900] hover:text-[#FFB145] hover:underline transition-colors'>
                                Sign in →
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 w-full mt-auto py-8">
                <div className="flex flex-row text-xs gap-6 justify-center tracking-wide">
                    <a href="#" className='text-gray-500 hover:text-[#FFB145] transition-colors'>Conditions of Use</a>
                    <a href="#" className='text-gray-500 hover:text-[#FFB145] transition-colors'>Privacy Notice</a>
                    <a href="#" className='text-gray-500 hover:text-[#FFB145] transition-colors'>Help</a>
                </div>
                <div className='text-xs text-gray-600 flex justify-center mt-3'>
                    © 2026, ZipDash (HackOn), Inc.
                </div>
            </div>
        </div>
    )
}

export default CreateAccount;

