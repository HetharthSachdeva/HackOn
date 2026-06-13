import React, { useState } from 'react';

const AISearchBar = ({ isAIMode, setIsAIMode, onSearch }) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
            <form onSubmit={handleSubmit} className="relative">
                {/* Search Bar */}
                <div className={`
                    relative flex items-center gap-3 bg-white rounded-full shadow-lg
                    transition-all duration-500 ease-out
                    ${isAIMode 
                        ? 'ring-4 ring-purple-400/30 shadow-2xl shadow-purple-500/20' 
                        : 'ring-1 ring-gray-200'
                    }
                    ${isFocused ? 'ring-4 ring-blue-400/30' : ''}
                    hover:shadow-xl
                    ${isAIMode ? 'p-5' : 'p-4'}
                `}>
                    {/* Plus Icon (AI Mode) / Search Icon (Normal) */}
                    <div className={`
                        flex-shrink-0 flex items-center justify-center
                        transition-all duration-300
                        ${isAIMode ? 'w-10 h-10' : 'w-8 h-8'}
                    `}>
                        {isAIMode ? (
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-sm opacity-50"></div>
                                <svg className="w-8 h-8 relative z-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                    </div>

                    {/* Input Field */}
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={isAIMode 
                            ? "Ask anything... 'Healthy breakfast for a week under ₹1000'"
                            : "Search products, brands, categories"
                        }
                        className={`
                            flex-1 bg-transparent outline-none
                            transition-all duration-300
                            ${isAIMode 
                                ? 'text-lg font-medium text-gray-800 placeholder-purple-400/60' 
                                : 'text-base text-gray-700 placeholder-gray-400'
                            }
                        `}
                    />

                    {/* Right Icons */}
                    <div className="flex items-center gap-2">
                        {/* Voice Search */}
                        <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Voice search"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            </svg>
                        </button>

                        {/* Camera Search */}
                        <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Image search"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-gray-300"></div>

                        {/* AI Mode Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsAIMode(!isAIMode)}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-full
                                font-semibold text-sm transition-all duration-300
                                ${isAIMode
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
                            `}
                        >
                            {isAIMode && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-50"></div>
                            )}
                            <svg className="w-4 h-4 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                            </svg>
                            <span className="relative z-10">AI Mode</span>
                        </button>
                    </div>
                </div>

                {/* AI Mode Glow Effect */}
                {isAIMode && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse -z-10"></div>
                )}
            </form>

            {/* Quick Suggestions (AI Mode) */}
            {isAIMode && (
                <div className="mt-4 flex flex-wrap gap-2 justify-center animate-fade-in">
                    {[
                        '🥗 Healthy breakfast under ₹1000',
                        '🎂 Party supplies for 20 people',
                        '💪 Fitness supplements bundle',
                        '👶 Baby essentials kit'
                    ].map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => setQuery(suggestion.substring(2))}
                            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full text-sm text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 hover:scale-105"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AISearchBar;
