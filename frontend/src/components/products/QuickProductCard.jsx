import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuickProductCard = ({ product }) => {
    const navigate = useNavigate();
    
    const price = parseFloat(product.price || 0);
    const discountPercentage = parseFloat(product.discountPercentage || 0);
    const discountedPrice = price * (1 - discountPercentage / 100);
    const deliveryTime = Math.floor(Math.random() * 5) + 8; // 8-12 mins

    const handleProductClick = () => {
        navigate(`/${product.category}/${encodeURIComponent(product.title)}`, {
            state: { item: product }
        });
    };

    return (
        <div 
            onClick={handleProductClick}
            className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 p-4 cursor-pointer group border-2 border-transparent hover:border-violet-300"
        >
            {/* Delivery Time Badge */}
            <div className="flex items-center justify-between mb-2">
                <span className="bg-gradient-to-r from-violet-400 to-violet-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <span>⚡</span>
                    {deliveryTime} min
                </span>
                {product.discountPercentage > 0 && (
                    <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {discountPercentage.toFixed(0)}% OFF
                    </span>
                )}
            </div>

            {/* Product Image */}
            <div className="relative mb-3 bg-gray-50 rounded-xl overflow-hidden">
                <img
                    src={product.thumbnail || product.images?.[0]}
                    alt={product.title}
                    className="w-full h-48 object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                />
                {product.stock < 10 && product.stock > 0 && (
                    <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Only {product.stock} left!
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
                {/* Title */}
                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-violet-600 transition min-h-[40px]">
                    {product.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        <span>{product.rating?.toFixed(1) || 'N/A'}</span>
                        <span className="ml-1">★</span>
                    </div>
                    <span className="text-xs text-gray-500">
                        ({Math.floor(Math.random() * 1000) + 100} reviews)
                    </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900">
                        ₹{discountedPrice.toFixed(0)}
                    </span>
                    {product.discountPercentage > 0 && (
                        <span className="text-sm text-gray-500 line-through">
                            ₹{price.toFixed(0)}
                        </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add to cart logic
                    }}
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                        product.stock > 0
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:shadow-lg hover:scale-105'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                    disabled={product.stock === 0}
                >
                    {product.stock > 0 ? (
                        <span className="flex items-center justify-center gap-2">
                            <span>🛒</span>
                            Add to Cart
                        </span>
                    ) : (
                        'Out of Stock'
                    )}
                </button>
            </div>

            {/* Free Delivery Badge */}
            {discountedPrice > 299 && (
                <div className="mt-2 text-center text-xs font-semibold text-green-600 bg-green-50 py-1 rounded">
                    ✓ FREE Delivery
                </div>
            )}
        </div>
    );
};

export default QuickProductCard;

