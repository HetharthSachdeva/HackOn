import React from 'react';
import { Link, ScrollRestoration } from 'react-router-dom';
import { useSelector } from 'react-redux';

const FooterTop = () => {

  const userInfo = useSelector((state) => state.amazon.userInfo);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {!userInfo &&
        <div className='w-full bg-[#0b1120] pt-10 pb-6'>
          <div className='mx-auto w-72 rounded-md border border-white/10 bg-[#151c2b]'>
            <div className='mx-auto w-60 text-center pt-10 pb-5'>
              <p className='text-sm text-gray-300'>See personalized recommendations</p>
              <Link to="/signIn" >
                <button
                  className='w-full bg-[#FF9900] text-black rounded-md py-1.5 font-bold cursor-pointer hover:bg-[#FFB145] text-sm mt-2 mb-1'
                >
                  Sign in
                </button>
              </Link>
              <p className='text-xs text-gray-400'>
                New customer? &nbsp;
                <Link to="/createAccount" >
                  <span className='text-xs text-[#FF9900] hover:text-[#FFB145] cursor-pointer'>
                    Start here.
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>}
      <div
        className="w-full py-[14px] hover:bg-[#414953] bg-[#485769]"
        onClick={handleScrollToTop}
      >
        <p className='text-sm mx-auto text-center text-white'>Back to top</p>
      </div>
      <ScrollRestoration />
    </>
  );
};

export default FooterTop;

