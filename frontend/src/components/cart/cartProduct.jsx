import React from 'react';

const CartProduct = ({ product, handleCategoryClick, handleDecreaseQuantity, handleIncreaseQuantity, handleDeleteProduct }) => {
    const title = product.title || product.name || 'Product';
    const subtitle = product.brand || product.description?.slice(0, 28) || product.category;

    return (
        <div className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#0d0d0d] p-4 transition-colors hover:border-white/20">
            {/* Image */}
            <div
                className="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-[#141414] p-1.5"
                onClick={() => handleCategoryClick(product.category, product.title)}
            >
                <img className="h-full w-full object-contain" src={product.thumbnail} alt={title} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <h3
                    className="cursor-pointer truncate text-base font-bold text-white hover:text-gray-200"
                    onClick={() => handleCategoryClick(product.category, product.title)}
                >
                    {title}
                </h3>
                <p className="mt-0.5 truncate font-mono text-xs text-gray-500">{subtitle}</p>
                <p className="mt-1.5 font-bold text-[#FF9900]">${Number(product.price).toFixed(2)}</p>
            </div>

            {/* Quantity stepper */}
            <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/10">
                <button
                    onClick={handleDecreaseQuantity}
                    className="grid h-8 w-8 place-items-center rounded-md text-gray-300 transition hover:bg-white/10 hover:text-white"
                    aria-label="Decrease quantity"
                >
                    −
                </button>
                <span className="w-8 text-center font-semibold text-white">{product.quantity}</span>
                <button
                    onClick={handleIncreaseQuantity}
                    className="grid h-8 w-8 place-items-center rounded-md text-gray-300 transition hover:bg-white/10 hover:text-white"
                    aria-label="Increase quantity"
                >
                    +
                </button>
            </div>

            {/* Delete */}
            <button
                onClick={handleDeleteProduct}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                aria-label="Remove item"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};

export default CartProduct;
