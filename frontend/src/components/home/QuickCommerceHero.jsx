import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickCommerceHero = () => {
    const navigate = useNavigate();
    const [deliveryTime, setDeliveryTime] = useState(8);

    // Smoothly cycle the live delivery estimate
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
        { id: 1, name: 'Fruits & Veggies', icon: '🥬', tint: 'bg-violet-50', ring: 'group-hover:ring-violet-300', category: 'groceries' },
        { id: 2, name: 'Dairy & Eggs', icon: '🥛', tint: 'bg-sky-50', ring: 'group-hover:ring-sky-300', category: 'groceries' },
        { id: 3, name: 'Instant Foods', icon: '🍜', tint: 'bg-amber-50', ring: 'group-hover:ring-amber-300', category: 'groceries' },
        { id: 4, name: 'Personal Care', icon: '🧴', tint: 'bg-rose-50', ring: 'group-hover:ring-rose-300', category: 'beauty' },
        { id: 5, name: 'Household', icon: '🧹', tint: 'bg-violet-50', ring: 'group-hover:ring-violet-300', category: 'home-decoration' },
        { id: 6, name: 'Snacks & Drinks', icon: '🍿', tint: 'bg-yellow-50', ring: 'group-hover:ring-yellow-300', category: 'groceries' },
        { id: 7, name: 'Electronics', icon: '📱', tint: 'bg-indigo-50', ring: 'group-hover:ring-indigo-300', category: 'smartphones' },
        { id: 8, name: 'Baby Care', icon: '🍼', tint: 'bg-indigo-50', ring: 'group-hover:ring-indigo-300', category: 'groceries' },
    ];

    const promos = [
        {
            id: 1,
            title: 'Fresh produce, daily',
            subtitle: 'Up to 40% off on fruits & vegetables',
            cta: 'Shop fresh',
            gradient: 'from-violet-500 to-green-600',
            emoji: '🥗',
            category: 'groceries',
        },
        {
            id: 2,
            title: 'Late night cravings?',
            subtitle: 'Snacks & beverages delivered in minutes',
            cta: 'Order snacks',
            gradient: 'from-violet-500 to-fuchsia-600',
            emoji: '🍫',
            category: 'groceries',
        },
        {
            id: 3,
            title: 'Everyday essentials',
            subtitle: 'Stock up on home & personal care',
            cta: 'Browse all',
            gradient: 'from-sky-500 to-blue-600',
            emoji: '🧺',
            category: 'beauty',
        },
    ];

    return (
        <div className="w-full bg-[#fafafa]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ───────────────  HERO  ─────────────── */}
                <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-500 px-8 py-12 md:px-14 md:py-16 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.5)]">
                    {/* soft mesh accents */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
                        <div className="absolute -bottom-28 -left-10 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl" />
                    </div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                        {/* Left: copy */}
                        <div className="text-white">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-sm font-semibold ring-1 ring-white/25">
                                <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                                Delivering in your area now
                            </span>

                            <h1 className="mt-5 text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
                                Groceries in
                                <span className="block">
                                    <span className="tabular-nums">{deliveryTime}</span> minutes.
                                </span>
                            </h1>

                            <p className="mt-4 max-w-md text-base md:text-lg text-white/85">
                                Fresh produce, daily essentials and a thousand more products,
                                delivered to your door before you finish your coffee.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate('/allProducts')}
                                    className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-violet-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Start shopping
                                    <span className="transition-transform group-hover:translate-x-1">→</span>
                                </button>
                                <button
                                    onClick={() => navigate('/groceries')}
                                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3.5 text-base font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
                                >
                                    Explore categories
                                </button>
                            </div>

                            {/* inline trust row */}
                            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/85">
                                <span className="flex items-center gap-2"><span className="text-lg">🚚</span> Free delivery over ₹299</span>
                                <span className="flex items-center gap-2"><span className="text-lg">🛡️</span> 100% quality promise</span>
                            </div>
                        </div>

                        {/* Right: delivery card */}
                        <div className="relative hidden md:flex justify-center">
                            <div className="relative w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Arriving in</p>
                                        <p className="text-4xl font-black text-violet-600 tabular-nums">{deliveryTime}:00</p>
                                    </div>
                                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-3xl">🏍️</div>
                                </div>

                                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 animate-progress" />
                                </div>

                                <div className="mt-5 space-y-3">
                                    {[
                                        { label: 'Order packed', done: true },
                                        { label: 'Out for delivery', done: true },
                                        { label: 'At your doorstep', done: false },
                                    ].map((step) => (
                                        <div key={step.label} className="flex items-center gap-3">
                                            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${step.done ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                {step.done ? '✓' : '•'}
                                            </span>
                                            <span className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ───────────────  STATS STRIP  ─────────────── */}
                <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: `${deliveryTime} min`, label: 'Avg. delivery', accent: 'text-violet-600' },
                        { value: '1000+', label: 'Products', accent: 'text-violet-600' },
                        { value: '₹0', label: 'Delivery fee*', accent: 'text-sky-600' },
                        { value: '4.8★', label: 'Customer rating', accent: 'text-amber-600' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-gray-100 transition hover:shadow-md">
                            <div className={`text-2xl md:text-3xl font-black ${s.accent}`}>{s.value}</div>
                            <div className="mt-1 text-xs md:text-sm font-medium text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </section>

                {/* ───────────────  CATEGORIES  ─────────────── */}
                <section className="mt-12">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">Shop by category</h2>
                            <p className="mt-1 text-sm text-gray-500">Everything you need, neatly organized</p>
                        </div>
                        <button
                            onClick={() => navigate('/allProducts')}
                            className="hidden sm:inline text-sm font-semibold text-violet-600 hover:text-violet-700"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => navigate(`/${cat.category}`)}
                                className="group flex flex-col items-center gap-3"
                            >
                                <div className={`grid h-20 w-full place-items-center rounded-2xl ${cat.tint} ring-1 ring-transparent ${cat.ring} transition-all duration-300 group-hover:-translate-y-1`}>
                                    <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{cat.icon}</span>
                                </div>
                                <p className="text-center text-xs font-semibold text-gray-700 group-hover:text-violet-600">{cat.name}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ───────────────  PROMO CARDS  ─────────────── */}
                <section className="mt-12">
                    <div className="grid md:grid-cols-3 gap-4">
                        {promos.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => navigate(`/${p.category}`)}
                                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${p.gradient} p-6 text-left text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
                            >
                                <div className="absolute -right-6 -top-6 text-8xl opacity-20 transition-transform duration-500 group-hover:scale-110">
                                    {p.emoji}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-extrabold">{p.title}</h3>
                                    <p className="mt-1.5 text-sm text-white/85 max-w-[16rem]">{p.subtitle}</p>
                                    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-bold ring-1 ring-white/30 backdrop-blur transition group-hover:bg-white/30">
                                        {p.cta}
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ───────────────  FEATURE STRIP  ─────────────── */}
                <section className="mt-12 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '⚡', title: 'Lightning fast', desc: `Most orders arrive in under ${deliveryTime} minutes.` },
                            { icon: '✨', title: 'AI shopping assistant', desc: 'Describe what you need, get a smart bundle in seconds.' },
                            { icon: '💚', title: 'Fresh & guaranteed', desc: 'Not happy? We refund, no questions asked.' },
                        ].map((f) => (
                            <div key={f.title} className="flex items-start gap-4">
                                <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-violet-50 text-2xl">{f.icon}</div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{f.title}</h3>
                                    <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                                </div>
                            </div>
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
                .animate-progress {
                    animation: progress 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default QuickCommerceHero;

