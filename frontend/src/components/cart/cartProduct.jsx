import React from 'react'

const CartProduct = ({ product, handleCategoryClick, handleDecreaseQuantity, handleIncreaseQuantity, handleDeleteProduct }) => {
    return (
        <div className='flex w-full gap-6 border-b border-white/5 p-4' >
            <div className='w-1/5 cursor-pointer overflow-hidden rounded-xl bg-[#0e1420] p-2' onClick={() => handleCategoryClick(product.category, product.title)}>
                <img className='h-40 w-full object-contain' src={product.thumbnail} alt="productImage" />
            </div>
            <div className='-mt-2 flex w-4/5 flex-col gap-2'>
                <h2 className='cursor-pointer text-[22px] font-semibold text-white hover:text-[#FFB145]' onClick={() => handleCategoryClick(product.category, product.title)}>
                    {product.title || product.name || 'Product'}
                </h2>
                <p className='line-clamp-2 text-sm text-gray-400'>{product.description}</p>
                <div className='flex items-baseline'>
                    <span className='text-[26px] font-black text-white'>${product.price}</span>
                </div>
                <p className='text-sm font-semibold text-[#FF9900]'>In stock</p>
                <div className='flex flex-row gap-5 text-sm text-gray-400'>
                    <p className='capitalize'>Sold by : {product.brand}</p>
                    <p className='border-l border-white/10 pl-5 capitalize'>Category : {product.category}</p>
                </div>
                <div className='mt-2 flex flex-row justify-between gap-5'>
                    <div className='flex items-center text-gray-300'>
                        Qty :&nbsp;&nbsp;
                        <button onClick={handleDecreaseQuantity} className='grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10'>-</button>
                        <p className='px-3 text-[18px] font-bold text-white'>{product.quantity}</p>
                        <button onClick={handleIncreaseQuantity} className='grid h-7 w-7 place-items-center rounded-md bg-white/5 text-white ring-1 ring-white/10 transition hover:bg-white/10'>+</button>
                    </div>
                    <button onClick={handleDeleteProduct} className='text-sm font-semibold text-gray-400 transition hover:text-red-400'>Delete</button>
                </div>
            </div>
        </div>
    )
}

export default CartProduct
