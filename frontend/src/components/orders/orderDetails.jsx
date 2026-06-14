import React from 'react';
import ProductsSlider from '../home/ProductsSlider';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const OrderDetails = ({ ordersData, reversedOrders, handleCancelOrder, handleReturnOrder }) => {
    return (
        ordersData.length > 0 ?
            <div className='flex flex-col gap-8'>
                {
                    ordersData.map((order, index) => (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ duration: 0.4, delay: index * 0.05 }} 
                            key={index} 
                            className='bg-[#0e0e11] ring-1 ring-white/5 rounded-3xl overflow-hidden transition-colors hover:ring-white/10 group'
                        >
                            {/* Header row */}
                            <div className='flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] px-6 py-4 sm:px-8 border-b border-white/5'>
                                <div className='flex flex-wrap gap-8'>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Order Placed</p>
                                        <p className="font-semibold text-white">
                                            {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Total</p>
                                        <p className="font-semibold text-white">₹{order.price}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Ship To</p>
                                        <p className="font-semibold text-[#FF9900] cursor-pointer hover:underline">{order.address.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-1">Order ID</p>
                                    <p className="font-mono text-sm text-[#FF9900] tracking-wider">{order.uniqueNumber}</p>
                                </div>
                            </div>

                            {/* Body */}
                            <div className='flex flex-col md:flex-row p-6 sm:p-8 gap-8 items-start'>
                                {/* Image */}
                                <div className="h-32 w-32 sm:h-40 sm:w-40 flex-shrink-0 bg-[#141414] rounded-2xl p-4 ring-1 ring-white/5 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                                    <img src={order.thumbnail} alt={order.title} className="max-h-full max-w-full object-contain" />
                                </div>

                                {/* Details */}
                                <div className='flex-1 flex flex-col gap-4'>
                                    <Link to={`/${order.category}/${encodeURIComponent(order.title)}`} className="inline-block">
                                        <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:to-gray-400 transition-colors">
                                            {order.title}
                                        </h3>
                                    </Link>
                                    
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1">
                                        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                            Qty: <strong className="text-white">{order.quantity}</strong>
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900]"></span>
                                            Paid via: <strong className="text-white capitalize">{order.paymentMethod}</strong>
                                        </span>
                                    </div>

                                    <div className="mt-2 p-4 bg-white/[0.02] rounded-xl border border-white/5 text-sm leading-relaxed text-gray-400">
                                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF9900] mb-2 flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            Delivery Address
                                        </p>
                                        <span className='font-bold text-white'>{order.address.name}</span> • {order.address.address}, {order.address.area}, {order.address.city}, {order.address.state} {order.address.pincode}, {order.address.country}. <br/>
                                        <span className="mt-1 inline-block"><span className="opacity-60">Phone:</span> {order.address.mobile}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {ordersData === reversedOrders && (
                                    <div className='flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0 pt-2'>
                                        <button 
                                            onClick={() => handleReturnOrder(order)} 
                                            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-white/5 font-mono text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 hover:shadow-lg transition-all"
                                        >
                                            Return Item
                                        </button>
                                        <button 
                                            onClick={() => handleCancelOrder(order)} 
                                            className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-red-500/20 font-mono text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
            </div>

            : <div className="py-20">
                <div className='flex flex-col items-center justify-center text-center gap-4 mb-16'>
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    </div>
                    <p className='text-xl font-bold text-white'>No orders found</p>
                    <p className='text-gray-500 max-w-sm'>Looks like you haven't placed any orders in this category yet.</p>
                </div>
                <div>
                    <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-gray-400 mb-8 ml-4">Trending Now</h3>
                    <ProductsSlider />
                </div>
            </div>
    )
}
export default OrderDetails;


