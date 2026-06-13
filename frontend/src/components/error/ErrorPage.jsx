import React from 'react'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'

const ErrorPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = () => {
      navigate(-1);
    };
    const timeoutId = setTimeout(redirect, 3000);
    return () => clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="bg-[#0d0d0d] ring-1 ring-white/5 border border-white/10 text-gray-400 px-4 py-3 rounded relative">
      <h1 className="text-center text-white">OOPS!! Something went wrong. You will be re-directed to previous page in 3-seconds.</h1>
    </div>
  )
}

export default ErrorPage;