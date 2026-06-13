import React, { useState } from 'react';
import { logoBlack } from '../../assets';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [input, setInput] = useState("");
    const [error, setError] = useState("");
    const validate = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const mobilePattern = /^[0-9]{10}$/;
        if (!emailPattern.test(input) && !mobilePattern.test(input)) {
            setError("We're sorry. We weren't able to identify you given the information provided.")
        }
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        validate();
        setInput("");
    }
    
    return (
        <div className='bg-[#0b1120]'>
            <div className='flex flex-col justify-center items-center '>

                <Link to="/">
                    <div className="headerHover">
                        <h1 className="text-2xl font-black tracking-tight mt-2"><span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span></h1>
                    </div>
                </Link>

                <div className='w-80 mt-4 bg-[#151c2b] ring-1 ring-white/10 border-white/10 rounded-lg '>
                    <div className='my-4 mx-5 '>
                        <span className='text-[28px] font-semibold text-white'>
                            Password assistance
                        </span>
                        <div className='text-[13px] font-medium tracking-wide mt-2 text-gray-400 '>
                            Enter the email address or mobile phone number associated with your Amazon account.
                        </div>
                        <form onSubmit={handleSubmit} className='my-3'>
                            <label className='text-sm font-semibold text-gray-300'>
                                Email or mobile phone number
                                <input type="text" value={input} autoComplete="true" onChange={(e) => { setInput(e.target.value); setError('') }} className='w-full border-[1px] border-white/10 bg-[#0e1420] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />
                            </label>
                            <button className={`text-sm w-full text-center rounded-lg bg-[#FF9900] text-black font-bold hover:bg-[#FFB145] p-[6px] mt-4 shadow active:ring-2 active:ring-offset-1 active:ring-violet-500`}
                            >Continue</button>
                        </form>
                        {
                            error && <div className='text-xs text-red-400'>{error}</div>
                        }
                    </div>
                </div>
                <div className='w-80 mt-2 text-md leading-5 pl-3 font-medium text-white'>Has your email address or mobile phone number changed?</div>
                <div className='w-80 text-sm  mx-auto mt-1 pl-3 mb-8 text-gray-400 '>
                    If you no longer use the e-mail address associated with your Amazon account, you may contact Customer Service for help restoring access to your account.
                </div>

            </div>
            <hr className='w-11/12 mx-auto border-white/10' />
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

export default ForgotPassword;

