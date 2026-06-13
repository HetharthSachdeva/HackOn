import React, { useState } from 'react';

const ProductReplacePanel = ({ product, onClose, onSelect }) => {
    const [selectedIntent, setSelectedIntent] = useState(null);
    const [isReplacing, setIsReplacing] = useState(false);

    const intents = [
        { id: 'cheaper', label: 'Cheaper', icon: '💰', color: 'from-orange-500 to-red-500' },
        { id: 'healthier', label: 'Healthier', icon: '🍎', color: 'from-green-500 to-emerald-600' },
        { id: 'best-value', label: 'Best Value', icon: '⭐', color: 'from-[#FF9900] to-amber-600' },
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
            <div className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-[#0b1120] shadow-2xl z-50 animate-slide-in overflow-y-auto ring-1 ring-white/5">
                {/* Header */}
                <div className="sticky top-0 bg-[#0e1420] text-white p-6 z-10 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black">Find Better Alternative</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Current Product Summary */}
                    <div className="bg-white/5 rounded-2xl p-4 ring-1 ring-white/10 mb-6">
                        <p className="text-sm text-gray-400 mb-2">Currently Selected</p>
                        <div className="flex items-center gap-3">
                            <img src={product?.image} alt="" className="w-16 h-16 object-contain bg-white/5 rounded-lg" />
                            <div>
                                <p className="font-bold line-clamp-1 text-white">{product?.name}</p>
                                <p className="text-2xl font-black text-[#FF9900]">${product?.price}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Intent Buttons */}
                    <div className="bg-[#151c2b] rounded-2xl p-5 ring-1 ring-white/10">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-[#FF9900]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            <span className="font-bold text-sm text-white">What do you want?</span>
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
                                            ? 'bg-[#FF9900] text-black scale-105 shadow-lg shadow-[#FF9900]/20'
                                            : 'bg-white/5 text-gray-200 ring-1 ring-white/10 hover:bg-white/10 hover:text-[#FFB145]'
                                        }
                                        ${isReplacing && selectedIntent !== intent.id ? 'opacity-50' : ''}
                                        disabled:cursor-not-allowed
                                    `}
                                >
                                    <span className="text-2xl">{intent.icon}</span>
                                    <span className="flex-1">{intent.label}</span>
                                    {selectedIntent === intent.id && isReplacing && (
                                        <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                        
                        {isReplacing && (
                            <div className="mt-4 text-center animate-pulse">
                                <p className="text-sm text-[#FFB145]">
                                    🤖 AI is finding the perfect match...
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Section - Shows after selection */}
                {selectedIntent && !isReplacing && (
                    <div className="p-6 animate-fade-in">
                        <div className="bg-[#FF9900]/10 rounded-2xl p-5 ring-1 ring-[#FF9900]/40 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <svg className="w-6 h-6 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="font-bold text-[#FFB145]">Replacement Complete!</span>
                            </div>
                            <p className="text-sm text-gray-400">
                                AI has found the best {intents.find(i => i.id === selectedIntent)?.label.toLowerCase()} option for you.
                            </p>
                        </div>
                    </div>
                )}

                {/* Done button */}
                {!isReplacing && (
                    <div className="p-6 pt-2">
                        <div className="text-center mb-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-[#FF9900] text-black rounded-full font-bold hover:bg-[#FFB145] hover:scale-105 transition-all duration-200"
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
