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
        <div className='min-h-screen bg-[#0a0a0a] w-full flex flex-col relative overflow-hidden'>
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] blur-[120px]">
                <div className="h-[600px] w-[600px] rounded-full bg-[#FF9900]" />
            </div>

            <div className='flex flex-col justify-center items-center flex-1 relative z-10 py-10'>
                <Link to="/">
                    <div className="headerHover transition-transform hover:scale-105">
                        <h1 className="text-3xl font-black tracking-tight mt-2 mb-2">
                            <span className="text-[#FF9900]">Amazon</span><span className="text-white">Now</span>
                        </h1>
                    </div>
                </Link>

                <div className='w-full max-w-[450px] mt-4 bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl shadow-2xl p-8'>
                    <span className='text-[28px] font-black tracking-tight text-white mb-3 block'>
                        Password Assistance
                    </span>
                    <div className='text-[13px] font-medium tracking-wide mt-2 text-gray-400 mb-6'>
                        Enter the email address or mobile phone number associated with your Amazon Now account.
                    </div>
                    
                    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                        <label className='flex flex-col gap-1.5'>
                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Email or Mobile Number</span>
                            <input 
                                type="text" 
                                value={input} 
                                autoComplete="true" 
                                placeholder="jane@example.com"
                                onChange={(e) => { setInput(e.target.value); setError('') }} 
                                className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                            />
                            {error && <div className='text-xs text-red-500 mt-1'>{error}</div>}
                        </label>
                        
                        <button 
                            className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[#FF9900] px-8 py-3.5 font-mono text-sm font-black uppercase tracking-[0.1em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98] mt-2`}
                        >
                            Continue
                        </button>
                    </form>
                </div>
                
                <div className='w-full max-w-[450px] mt-8 text-center'>
                    <div className='text-sm font-bold text-white mb-2'>
                        Has your email or mobile phone changed?
                    </div>
                    <div className='text-sm text-gray-400 leading-relaxed'>
                        If you no longer use the e-mail address associated with your Amazon Now account, you may contact Customer Service for help restoring access to your account.
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
                    © 2026, Amazon Now , Inc.
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword;

