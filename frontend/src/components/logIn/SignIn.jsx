import React, { useState, useEffect } from "react";
import { logoBlack } from '../../assets/index';
import { Link, useNavigate } from 'react-router-dom';
import { right, down, required, google, facebook } from "../../assets/index";
import { RotatingLines } from "react-loader-spinner";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from 'react-redux';
import { setUserInfo, setUserAuthentication } from "../../redux/amazonSlice";
import { supabase } from "../../api/supabaseClient";

const SignIn = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isClicked, setIsClicked] = useState(false);
    const [needHelp, setNeedHelp] = useState(false);

    const handleNeedHelp = () => {
        setNeedHelp(!needHelp);
    };

    const handleNewClickEffect = (e) => {
        e.stopPropagation();
        setIsClicked(true);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.classList.contains("clicked")) {
                setIsClicked(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const [warningPassword, setWarningPassword] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [passwordValue, setPasswordValue] = useState("");
    const [userEmailError, setUserEmailError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const validate = () => {
        let isValid = true;
        if (inputValue === "") {
            setUserEmailError("Enter your email or mobile number");
            isValid = false;
        }
        if (passwordValue === "") {
            setWarningPassword("Enter your password");
            isValid = false;
        }
        return isValid;
    }

    const handleUser = (user, token) => {
        dispatch(setUserInfo({
            id: user.id,
            name: user.user_metadata?.full_name || user.email,
            email: user.email,
            token: token,
            image: user.user_metadata?.avatar_url || null
        }));
        dispatch(setUserAuthentication(true));
        setLoading(false);
        setSuccessMsg("Successfully Logged-in! Welcome back.");
        setTimeout(() => {
            navigate(-1);
        }, 2000);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const isValid = validate();
        if (!isValid) {
            return;
        }
        setLoading(true);
        supabase.auth.signInWithPassword({
            email: inputValue,
            password: passwordValue
        })
        .then(({ data, error }) => {
            setLoading(false);
            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    setUserEmailError("Please confirm your email address first.");
                } else if (error.message.includes("Invalid login credentials")) {
                    setWarningPassword("There was a problem. Your email or password is incorrect.");
                } else {
                    setUserEmailError(error.message);
                }
                return;
            }
            if (data?.user) {
                handleUser(data.user, data.session?.access_token);
            }
        })
        .catch((error) => {
            setLoading(false);
            setUserEmailError("Something went wrong. Please try again.");
        });
        setInputValue("");
        setPasswordValue("");
    }

    const handleGoogle = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) {
            setLoading(false);
            console.error("Google sign in error:", error.message);
        }
    }

    const handleFacebook = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) {
            setLoading(false);
            console.error("Facebook sign in error:", error.message);
        }
    }

    return (
        <div className='min-h-screen bg-[#0a0a0a] w-full flex flex-col relative overflow-hidden'>
            {/* Background ambient glow */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] blur-[120px]">
                <div className="h-[600px] w-[600px] rounded-full bg-[#FF9900]" />
            </div>

            <div className='flex flex-col justify-center items-center flex-1 relative z-10'>
                <Link to="/">
                    <div className="headerHover transition-transform hover:scale-105">
                        <h1 className="text-3xl font-black tracking-tight mt-6 mb-2">
                            <span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span>
                        </h1>
                    </div>
                </Link>

                <div className='w-full max-w-[400px] mt-4 bg-[#0f0f0f] ring-1 ring-white/10 rounded-2xl shadow-2xl p-8'>
                    <span className='text-[28px] font-black tracking-tight text-white mb-6 block'>
                        Welcome Back
                    </span>
                    {
                        successMsg
                            ? <div className='my-4'>
                                <motion.p
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className='text-base font-bold text-green-400 bg-green-400/10 p-4 rounded-xl text-center'
                                >
                                    {successMsg}
                                </motion.p>
                            </div>
                            : <div className="flex flex-col gap-4">
                                <div onClick={handleGoogle} className="cursor-pointer flex items-center justify-center gap-3 w-full border border-white/10 bg-white/[0.02] p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <img src={google} alt="google" className="w-5 h-5" />
                                    <p className="text-sm font-semibold text-white">Continue with Google</p>
                                </div>
                                <div onClick={handleFacebook} className="cursor-pointer flex items-center justify-center gap-3 w-full border border-white/10 bg-white/[0.02] p-3 rounded-xl hover:bg-white/5 transition-all">
                                    <img src={facebook} alt="facebook" className="w-5 h-5" />
                                    <p className="text-sm font-semibold text-white">Continue with Facebook</p>
                                </div>

                                <div className="flex items-center justify-between my-2 opacity-50">
                                    <div className="flex-1 h-px bg-white/20"></div>
                                    <p className="text-xs font-mono uppercase tracking-widest text-white px-4">Or</p>
                                    <div className="flex-1 h-px bg-white/20"></div>
                                </div>

                                <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
                                    <label className='flex flex-col gap-1.5'>
                                        <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Email Address</span>
                                        <input 
                                            type="text" 
                                            value={inputValue} 
                                            onChange={(e) => {
                                                setInputValue(e.target.value.toString().toLowerCase());
                                                setUserEmailError("");
                                            }} 
                                            className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                            placeholder="Enter email or mobile"
                                        />
                                        {userEmailError && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><img src={required} className="w-3 h-3" alt="warning" />{userEmailError}</div>}
                                    </label>
                                    
                                    <label className='flex flex-col gap-1.5'>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono uppercase tracking-wider text-gray-400">Password</span>
                                            <Link to="forgotPassword" className="text-xs text-[#FF9900] hover:text-[#FFB145] hover:underline transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <input 
                                            type="password" 
                                            value={passwordValue} 
                                            onChange={(e) => {
                                                setPasswordValue(e.target.value);
                                                setWarningPassword("");
                                            }} 
                                            className='bg-[#141414] text-white ring-1 ring-white/10 focus:ring-2 focus:ring-[#FF9900]/50 placeholder-gray-600 rounded-lg px-4 py-3 outline-none transition-all'
                                            placeholder="••••••••"
                                        />
                                        {warningPassword && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><img src={required} className="w-3 h-3" alt="warning" />{warningPassword}</div>}
                                    </label>

                                    <button 
                                        className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-[#FF9900] px-8 py-3.5 font-mono text-sm font-black uppercase tracking-[0.1em] text-black shadow-[0_0_20px_rgba(255,153,0,0.3)] transition-all hover:bg-[#ffb145] hover:shadow-[0_0_35px_rgba(255,153,0,0.5)] hover:scale-[1.02] active:scale-[0.98] mt-2`}
                                        onClick={(e) => { handleNewClickEffect(e) }}
                                    >
                                        Sign In
                                    </button>
                                    
                                    {loading && <div className='flex justify-center mt-2'>
                                        <RotatingLines strokeColor="#febd69" strokeWidth="4" animationDuration="0.75" width="30" visible={true} />
                                    </div>}
                                </form>
                            </div>
                    }
                    
                    <div className='text-xs text-gray-500 mt-6 pt-6 border-t border-white/5 text-center leading-relaxed'>
                        By continuing, you agree to ZipDash's <a href='#' className='text-[#FF9900] hover:text-[#FFB145] transition-colors'>Conditions of Use</a> and <a href='#' className='text-[#FF9900] hover:text-[#FFB145] transition-colors'>Privacy Notice</a>.
                    </div>
                </div>

                <div className='mt-8 flex items-center justify-center gap-4 w-full max-w-[400px]'>
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-xs text-gray-400 font-mono tracking-wider uppercase">New to ZipDash?</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                </div>
                
                <Link to="/createAccount" className="w-full max-w-[400px]">
                    <div className='mt-6 w-full text-center border border-white/10 bg-white/[0.02] hover:bg-white/5 text-white rounded-xl py-3.5 text-sm font-bold tracking-wide transition-all hover:border-[#FF9900]/50'>
                        Create your ZipDash account
                    </div>
                </Link>
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
};

export default SignIn;

