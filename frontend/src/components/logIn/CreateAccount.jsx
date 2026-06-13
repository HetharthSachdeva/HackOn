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
        <div className='bg-[#0a0a0a]'>
            <div className='flex flex-col w-full h-full justify-center mb-10 items-center'>

                <Link to="/">
                    <div className="headerHover">
                        <h1 className="text-2xl font-black tracking-tight mt-2"><span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span></h1>
                    </div>
                </Link>

                <div className='w-80 mt-4 bg-[#0d0d0d] ring-1 ring-white/10 border-white/10 rounded-lg'>
                    <div className='my-4 mx-5 '>
                        <span className='text-[28px] font-semibold text-white'>
                            Create Account
                        </span>
                        {
                            successMsg
                                ? <div className=' my-2 flex flex-col gap-2'>
                                    <p className='font-semibold text-green-600'>
                                        Your account has been successfully created!
                                    </p>
                                    <p className='font-semibold text-white'>
                                        Please check your email for a verification link to confirm your email address.
                                    </p>
                                    <p className='font-semibold text-red-400'>
                                        Remember, if you don't verify your email, your data may be lost.
                                    </p>
                                </div>
                                : <form className='my-3' onSubmit={handleSubmit}>
                                    <label className='text-sm font-semibold text-gray-300'>
                                        Your name
                                        <input type="text" placeholder="First and last name" autoComplete="true" value={nameInput} onChange={(e) => {
                                            setNameInput(e.target.value);
                                            setNameError("");
                                        }} className='w-full border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1 ' />
                                    </label>
                                    {
                                        nameError && <div className='text-sm text-red-400'>{nameError}</div>
                                    }
                                    <label className='text-sm font-semibold mt-3 text-gray-300'>
                                        Email
                                        <input type="text" value={emailInput} autoComplete="true" onChange={(e) => {
                                            setEmailInput(e.target.value.toString().toLowerCase());
                                            setEmailError("");
                                            setFirebaseError("");
                                        }} className='w-full border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />

                                    </label>
                                    {
                                        (emailError || firebaseError) && <div className='text-sm text-red-400'>{emailError || firebaseError}</div>
                                    }
                                    <label className='text-sm font-semibold my-3 text-gray-300'>
                                        Mobile number (Optional)
                                        <div className='flex items-center justify-between mt-1'>
                                            <div className='w-[22%] border-[1px] rounded-md border-white/10 bg-[#141414] text-white p-1'>IN +91</div>
                                            <input type="tel" autoComplete="true" maxLength="10" placeholder="Mobile number" value={mobileInput} onChange={(e) => {
                                                setMobileInput(e.target.value);
                                                setMobileError("");
                                            }} className='w-[74%] border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />
                                        </div>
                                    </label>
                                    {
                                        mobileError && <div className='text-sm text-red-400  pl-20'>{mobileError}</div>
                                    }
                                    <label className='text-sm font-semibold mt-3 text-gray-300'>
                                        Password
                                        <input type="password" autoComplete="true" value={passwordInput} onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            setPasswordError("");
                                        }} placeholder="At least 6 characters" className='w-full border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />
                                    </label>
                                    {
                                        passwordError && <div className='text-sm text-red-400'>{passwordError}</div>
                                    }
                                    {!passwordError && <div className='flex items-center justify-start mt-1' >
                                        <img src={i} alt='i' className='w-4 h-4' />
                                        <span className='text-xs text-gray-400'>Passwords must be at least 6 characters.</span>
                                    </div>}
                                    <div className='text-[12px] tracking-wide mt-4 text-gray-500 '>
                                        By enrolling your mobile phone number, you consent to receive automated security notifications via text message from Amazon. Message and data rates may apply.
                                    </div>
                                    <button className={`text-sm w-full text-center rounded-lg bg-[#FF9900] text-black font-bold hover:bg-[#FFB145] p-[6px] mt-5 shadow active:ring-2 active:ring-offset-1 active:ring-violet-500`}
                                    >Continue</button>
                                    {
                                        loading && <div className='flex justify-center mt-4'>
                                            <RotatingLines
                                                strokeColor="#febd69"
                                                strokeWidth="5"
                                                animationDuration="0.75"
                                                width="50"
                                                visible={true}
                                            />
                                        </div>
                                    }
                                </form>
                        }
                        <div className='flex items-center gap-2 mt-7 '>
                            <div className=' text-xs text-gray-400'>
                                {
                                    successMsg
                                        ? "You can now sign-in "
                                        : "Already have an account? "}
                                <Link to="/signIn" >
                                    <span className='text-[#FF9900] hover:underline hover:text-[#FFB145] cursor-pointer'>
                                        Sign in
                                    </span>
                                </Link>
                            </div>
                            <div className='w-[6px] h-[6px] mt-1'>
                                <img src={right} alt='right' />
                            </div>
                        </div>
                        <div className='text-xs tracking-wide mt-5 text-gray-500 '>
                            <span className=''>
                                By creating an account or logging in, you agree to Amazon’s
                                <a href='https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_condition_of_use?ie=UTF8&nodeId=200545940' className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> Conditions of Use </a>
                                and
                                <a href='https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_privacy_notice?ie=UTF8&nodeId=200534380' className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> Privacy Notice</a>.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <hr className="w-11/12 mx-auto border-white/10" />
            <div className="flex flex-row text-[11px] gap-4 mx-auto mt-10 text-white justify-center tracking-wide  pt-5">
                <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_condition_of_use?ie=UTF8&nodeId=200545940" className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Conditions of Use</a>
                <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_privacy_notice?ie=UTF8&nodeId=200534380" className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Privacy Notice</a>
                <p className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Interest-Based Ads</p>
            </div>
            <div className='text-xs tracking-wider text-gray-500 flex justify-center mt-[4px] pb-16'>
                © 1996-2023, Amazon.com, Inc. or its affiliates
            </div>
        </div>
    )
}

export default CreateAccount;

