import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickCommerceHero = () => {
    const navigate = useNavigate();
    const [deliveryTime, setDeliveryTime] = useState(8);

    useEffect(() => {
        const times = [8, 9, 10, 11, 12];
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % times.length;
            setDeliveryTime(times[index]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const categories = [
        { id: 1, name: 'Fruits & Veggies', icon: '🥬', category: 'groceries' },
        { id: 2, name: 'Dairy & Eggs', icon: '🥛', category: 'groceries' },
        { id: 3, name: 'Instant Foods', icon: '🍜', category: 'groceries' },
        { id: 4, name: 'Personal Care', icon: '🧴', category: 'beauty' },
        { id: 5, name: 'Household', icon: '🧹', category: 'home-decoration' },
        { id: 6, name: 'Snacks & Drinks', icon: '🍿', category: 'groceries' },
        { id: 7, name: 'Electronics', icon: '📱', category: 'smartphones' },
        { id: 8, name: 'Beauty', icon: '💄', category: 'beauty' },
    ];

    return (
        <div className="w-full bg-[#0b1120]">
            <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">

                {/* ── HERO ── */}
                <section className="relative overflow-hidden rounded-[28px] bg-[#151c2b] px-8 py-12 ring-1 ring-white/5 md:px-14 md:py-16">
                    {/* lime glow accents */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#FF9900]/10 blur-3xl" />
                        <div className="absolute -bottom-28 -left-10 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
                    </div>

                    <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-gray-300 ring-1 ring-white/10">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF9900]" />
                                Delivering in your area now
                            </span>

                            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
                                Everything you need,
                                <span className="block text-[#FF9900]">in <span className="tabular-nums">{deliveryTime}</span> minutes.</span>
                            </h1>

                            <p className="mt-4 max-w-md text-base text-gray-400 md:text-lg">
                                Snacks, fresh produce, electronics and daily essentials — dashed to your door before you finish scrolling.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate('/allProducts')}
                                    className="group inline-flex items-center gap-2 rounded-full bg-[#FF9900] px-7 py-3.5 text-base font-bold text-black transition-all duration-300 hover:bg-[#FFB145] hover:-translate-y-0.5"
                                >
                                    Start shopping
                                    <span className="transition-transform group-hover:translate-x-1">→</span>
                                </button>
                                <button
                                    onClick={() => navigate('/groceries')}
                                    className="inline-flex items-center gap-2 rounded-full bg-white/5 px-7 py-3.5 text-base font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
                                >
                                    Explore categories
                                </button>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-gray-400">
                                <span className="flex items-center gap-2"><span className="text-lg">🚚</span> Free delivery over $29</span>
                                <span className="flex items-center gap-2"><span className="text-lg">🛡️</span> 100% quality promise</span>
                            </div>
                        </div>

                        {/* Delivery card */}
                        <div className="relative hidden justify-center md:flex">
                            <div className="relative w-full max-w-sm rounded-3xl bg-[#0e1420] p-6 ring-1 ring-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Arriving in</p>
                                        <p className="text-4xl font-black tabular-nums text-[#FF9900]">{deliveryTime}:00</p>
                                    </div>
                                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#FF9900]/10 text-3xl">🏍️</div>
                                </div>
                                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-2/3 rounded-full bg-[#FF9900] animate-progress" />
                                </div>
                                <div className="mt-5 space-y-3">
                                    {[
                                        { label: 'Order packed', done: true },
                                        { label: 'Out for delivery', done: true },
                                        { label: 'At your doorstep', done: false },
                                    ].map((step) => (
                                        <div key={step.label} className="flex items-center gap-3">
                                            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step.done ? 'bg-[#FF9900] text-black' : 'bg-white/10 text-gray-500'}`}>
                                                {step.done ? '✓' : '•'}
                                            </span>
                                            <span className={`text-sm font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── STATS ── */}
                <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                        { value: `${deliveryTime} min`, label: 'Avg. delivery' },
                        { value: '1000+', label: 'Products' },
                        { value: '$0', label: 'Delivery fee*' },
                        { value: '4.8★', label: 'Customer rating' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl bg-[#151c2b] p-5 text-center ring-1 ring-white/5">
                            <div className="text-2xl font-black text-[#FF9900] md:text-3xl">{s.value}</div>
                            <div className="mt-1 text-xs font-medium text-gray-500 md:text-sm">{s.label}</div>
                        </div>
                    ))}
                </section>

                {/* ── CATEGORIES ── */}
                <section className="mt-12">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">Shop by category</h2>
                            <p className="mt-1 text-sm text-gray-500">Everything you need, neatly organized</p>
                        </div>
                        <button onClick={() => navigate('/allProducts')} className="hidden text-sm font-semibold text-[#FF9900] hover:text-[#FFB145] sm:inline">
                            View all →
                        </button>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 sm:gap-4">
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => navigate(`/${cat.category}`)} className="group flex flex-col items-center gap-3">
                                <div className="grid h-20 w-full place-items-center rounded-2xl bg-[#151c2b] ring-1 ring-white/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-[#FF9900]/30">
                                    <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                                </div>
                                <p className="text-center text-xs font-semibold text-gray-400 group-hover:text-[#FFB145]">{cat.name}</p>
                            </button>
                        ))}
                    </div>
                </section>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 35%; }
                    50% { width: 75%; }
                    100% { width: 35%; }
                }
                .animate-progress { animation: progress 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default QuickCommerceHero;
