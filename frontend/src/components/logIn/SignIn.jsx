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
        <div className='bg-[#0a0a0a] w-full h-full'>
            <div className='flex flex-col justify-center items-center'>

                <Link to="/">
                    <div className="headerHover">
                        <h1 className="text-2xl font-black tracking-tight mt-2"><span className="text-[#FF9900]">Zip</span><span className="text-white">Dash</span></h1>
                    </div>
                </Link>

                <div className='w-80 mt-4 bg-[#0d0d0d] ring-1 ring-white/10 border-white/10 rounded-lg'>
                    <div className='my-4 mx-7 '>
                        <span className='text-[28px] font-semibold text-white'>
                            Sign in
                        </span>
                        {
                            successMsg
                                ? <div className=''>
                                    <motion.p
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 10, opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className='text-base font-semibold text-green-600 border-[1px] my-8 text-center'
                                    >
                                        {successMsg}
                                    </motion.p>
                                </div>
                                : <div>
                                    <div onClick={handleGoogle} className=" cursor-pointer flex flex-row items-center my-3 border-[1px] p-[6px] border-white/10 rounded-md hover:bg-white/5 active:ring-2 active:ring-offset-1 active:ring-blue-600 active:border-transparent">
                                        <img src={google} alt="google" className="w-5 h-5 mx-5" />
                                        <p className="text-sm font-semibold text-white">Continue with Google</p>
                                    </div>
                                    <div onClick={handleFacebook} className="cursor-pointer flex flex-row items-center  my-3 border-[1px] p-[6px] border-white/10 rounded-md hover:bg-white/5 active:ring-2 active:ring-offset-1 active:ring-blue-600 active:border-transparent">
                                        <img src={facebook} alt="facebook" className="w-5 mx-5 h-5" />
                                        <p className="text-sm font-semibold text-white">Continue with Facebook</p>
                                    </div>
                                    <div className="flex items-center justify-between ">
                                        <div className="w-[45%]"><hr className="border-white/10" /></div>
                                        <p className="text-sm font-semibold text-gray-400">Or</p>
                                        <div className="w-[45%]"><hr className="border-white/10" /></div>
                                    </div>
                                    <form className='mt-2 mb-3' onSubmit={handleSubmit}>
                                        <label className='text-sm font-semibold text-gray-300'>
                                            Email address
                                            <input type="text" autoComplete="true" value={inputValue} onChange={(e) => {
                                                setInputValue(e.target.value.toString().toLowerCase());
                                                setUserEmailError("");
                                            }} className='w-full border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />
                                        </label>
                                        {
                                            userEmailError && <div className="flex  items-center  pt-1 pb-2">
                                                <img src={required} className="w-4 h-4 mr-1" alt="warning" />
                                                <div className="text-xs text-red-400">{userEmailError}</div>
                                            </div>
                                        }
                                        <label className='text-sm font-semibold text-gray-300'>
                                            Password
                                            <input type="password" autoComplete="true" value={passwordValue} onChange={(e) => {
                                                setPasswordValue(e.target.value);
                                                setWarningPassword("");
                                            }} className='w-full border-[1px] border-white/10 bg-[#141414] text-white ring-1 ring-white/10 focus:ring-[#FF9900]/40 placeholder-gray-500 rounded p-1' />
                                        </label>
                                        {
                                            warningPassword && <div className="flex  items-center pt-1 pb-2">
                                                <img src={required} className="w-4 h-4 mr-1" alt="warning" />
                                                <div className="text-xs text-red-400">{warningPassword}</div>
                                            </div>
                                        }
                                        <button className={`${isClicked ? "clicked" : ""} text-sm my-4 w-full text-center rounded-lg bg-[#FF9900] text-black font-bold hover:bg-[#FFB145] p-[6px]`}
                                            onClick={(e) => { handleNewClickEffect(e) }}>Continue</button>
                                        {
                                            loading && <div className='flex justify-center'>
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
                                </div>
                        }
                        <div className='text-xs tracking-wide text-gray-500 '>
                            <span className=''>
                                By continuing, you agree to Amazon's
                                <a href='https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_condition_of_use?ie=UTF8&nodeId=200545940' className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> Conditions of Use </a>
                                and
                                <a href='https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_privacy_notice?ie=UTF8&nodeId=200534380' className='text-[#FF9900] hover:text-[#FFB145] cursor-pointer'> Privacy Notice</a>.
                            </span>
                        </div>
                        <div className='flex items-center gap-2 mt-7 cursor-pointer group ' onClick={handleNeedHelp}>
                            <div className='w-2 h-2 text-gray-200'>
                                {
                                    needHelp ?
                                        <img src={down} alt='down' /> :
                                        <img src={right} alt='right' />
                                }

                            </div>
                            <div className=' text-xs  text-[#FF9900] group-hover:underline group-hover:text-[#FFB145]'>Need help?</div>
                        </div>
                        {
                            needHelp ?
                                (<div className=' text-xs  text-[#FF9900] cursor-pointer hover:underline hover:text-[#FFB145] ml-4 mt-2 mb-5'>
                                    <Link to="forgotPassword">
                                        Forgot password
                                    </Link>
                                </div>)
                                : null
                        }
                    </div>
                </div>

                <div className='text-sm text-gray-400 my-4'>
                    New to Amazon?
                </div>
                <div className='w-80 text-[12px] font-bold tracking-wide text-center bg-[#FF9900] text-black rounded-lg p-[5px] hover:bg-[#FFB145] mb-7 shadow active:ring-2 active:ring-offset-1 active:ring-blue-500'>
                    <Link to="/createAccount">
                        <div>Create your Amazon account</div>
                    </Link>
                </div>
            </div>
            <hr className="w-11/12 mx-auto border-white/10" />
            <div className="flex flex-row text-[11px] gap-4 mx-auto text-white justify-center tracking-wide pt-5 my-4">
                <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_condition_of_use?ie=UTF8&nodeId=200545940" className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Conditions of Use</a>
                <a href="https://www.amazon.in/gp/help/customer/display.html/ref=ap_signin_notification_privacy_notice?ie=UTF8&nodeId=200534380" className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Privacy Notice</a>
                <p className='text-gray-400 hover:text-[#FFB145] cursor-pointer'>Interest-Based Ads</p>
            </div>
            <div className='text-xs tracking-wider text-gray-500 flex justify-center mt-[4px] pb-16'>
                © 1996-2023, Amazon.com, Inc. or its affiliates
            </div>
        </div>
    )
};

export default SignIn;

