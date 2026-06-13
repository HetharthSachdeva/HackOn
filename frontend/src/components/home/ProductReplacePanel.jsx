import React, { useState } from 'react';

const ProductReplacePanel = ({ product, onClose, onSelect }) => {
    const [selectedIntent, setSelectedIntent] = useState(null);
    const [isReplacing, setIsReplacing] = useState(false);

    const intents = [
        { id: 'cheaper', label: 'Cheaper', icon: '💰', color: 'from-orange-500 to-red-500' },
        { id: 'healthier', label: 'Healthier', icon: '🍎', color: 'from-green-500 to-emerald-600' },
        { id: 'best-value', label: 'Best Value', icon: '⭐', color: 'from-yellow-500 to-amber-600' },
        { id: 'premium', label: 'Premium', icon: '👑', color: 'from-purple-500 to-pink-600' }
    ];

    const handleIntentSelect = (intent) => {
        setSelectedIntent(intent.id);
        setIsReplacing(true);

        // Simulate AI replacement
        setTimeout(() => {
            const alternative = alternatives.find(alt => alt.type === intent.id || 
                (intent.id === 'best-value' && alt.type === 'best-value'));
            
            if (alternative) {
                onSelect(alternative);
            }
            setIsReplacing(false);
        }, 1200);
    };

    const alternatives = [
        {
            type: 'budget',
            label: 'Budget Option',
            icon: '💰',
            color: 'from-green-500 to-emerald-600',
            product: {
                name: 'Economy ' + product?.name?.substring(0, 30),
                price: Math.floor(product?.price * 0.7),
                originalPrice: product?.price,
                image: product?.image,
                rating: 3.8,
                savings: Math.floor(product?.price * 0.3),
                features: ['Basic quality', 'Good value', 'Longer delivery']
            }
        },
        {
            type: 'best-value',
            label: 'Best Value',
            icon: '⭐',
            color: 'from-blue-500 to-indigo-600',
            recommended: true,
            product: {
                name: product?.name,
                price: product?.price,
                originalPrice: Math.floor(product?.price * 1.2),
                image: product?.image,
                rating: 4.5,
                savings: Math.floor(product?.price * 0.2),
                features: ['Great quality', 'Best rated', 'Fast delivery']
            }
        },
        {
            type: 'premium',
            label: 'Premium Option',
            icon: '👑',
            color: 'from-purple-500 to-pink-600',
            product: {
                name: 'Premium ' + product?.name?.substring(0, 25),
                price: Math.floor(product?.price * 1.5),
                originalPrice: Math.floor(product?.price * 1.8),
                image: product?.image,
                rating: 4.9,
                savings: Math.floor(product?.price * 0.3),
                features: ['Top quality', 'Premium brand', 'Instant delivery']
            }
        }
    ];

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Side Panel */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 animate-slide-in overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black">Find Better Alternative</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Current Product Summary */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 mb-6">
                        <p className="text-sm opacity-90 mb-2">Currently Selected</p>
                        <div className="flex items-center gap-3">
                            <img src={product?.image} alt="" className="w-16 h-16 object-contain bg-white/20 rounded-lg" />
                            <div>
                                <p className="font-bold line-clamp-1">{product?.name}</p>
                                <p className="text-2xl font-black">₹{product?.price}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Intent Buttons */}
                    <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                            <span className="font-bold text-sm">What do you want?</span>
                            <button className="ml-auto p-1 hover:bg-white/20 rounded transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {intents.map((intent) => (
                                <button
                                    key={intent.id}
                                    onClick={() => handleIntentSelect(intent)}
                                    disabled={isReplacing}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                        font-semibold text-left transition-all duration-200
                                        ${selectedIntent === intent.id
                                            ? `bg-gradient-to-r ${intent.color} text-white scale-105 shadow-lg`
                                            : 'bg-white/10 text-white hover:bg-white/20 hover:scale-102'
                                        }
                                        ${isReplacing && selectedIntent !== intent.id ? 'opacity-50' : ''}
                                        disabled:cursor-not-allowed
                                    `}
                                >
                                    <span className="text-2xl">{intent.icon}</span>
                                    <span className="flex-1">{intent.label}</span>
                                    {selectedIntent === intent.id && isReplacing && (
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        {isReplacing && (
                            <div className="mt-4 text-center animate-pulse">
                                <p className="text-sm opacity-90">
                                    🤖 AI is finding the perfect match...
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Section - Shows after selection */}
                {selectedIntent && !isReplacing && (
                    <div className="p-6 animate-fade-in">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-500/50 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold text-green-800">Replacement Complete!</span>
                            </div>
                            <p className="text-sm text-green-700">
                                AI has found the best {intents.find(i => i.id === selectedIntent)?.label.toLowerCase()} option for you.
                            </p>
                        </div>
                    </div>
                )}

                {/* Alternatives List - Hidden initially, shows for reference */}
                {!isReplacing && (
                    <div className="p-6 pt-2">
                        <div className="text-center mb-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default ProductReplacePanel;
