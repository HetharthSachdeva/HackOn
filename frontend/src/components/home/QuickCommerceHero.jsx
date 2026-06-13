import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
    { title: 'Fast Delivery', desc: '10-15 min delivery directly to your door.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: 'Fresh Picks', desc: 'Hand-picked quality groceries and essentials.', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { title: 'No Minimum', desc: 'Order any amount, exactly what you need.', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
    { title: 'Live Tracking', desc: 'Follow your order in real-time as it travels to you.', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z', highlight: true },
];

const QuickCommerceHero = () => {
    const navigate = useNavigate();
    const [deliveryTime, setDeliveryTime] = useState(11);

    useEffect(() => {
        const times = [9, 10, 11, 12];
        let i = 0;
        const t = setInterval(() => { i = (i + 1) % times.length; setDeliveryTime(times[i]); }, 3000);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="bg-[#0a0a0a]">
            {/* ── HERO ── */}
            <section className="relative overflow-hidden">
                {/* Background image + overlays */}
                <div className="absolute inset-0">
                    <img
                        src="/hero-grocery.jpg"
                        alt=""
                        className="h-full w-full object-cover object-center md:object-right"
                        onError={(e) => {
                            // fallback to a grocery-bag stock image if local file is missing
                            if (!e.currentTarget.dataset.fallback) {
                                e.currentTarget.dataset.fallback = '1';
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1400&q=80';
                            } else {
                                e.currentTarget.style.display = 'none';
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />
                </div>

                <div className="relative mx-auto max-w-[1500px] px-6 py-24 md:py-28">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        {/* Left: copy */}
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF9900]/40 bg-[#FF9900]/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-[#FF9900]">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF9900]" />
                                Quick Commerce
                            </span>

                            <h1 className="mt-6 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
                                <span className="text-white">Everything<br />you need,</span><br />
                                <span className="text-[#FF9900]">in {deliveryTime} minutes.</span>
                            </h1>

                            <p className="mt-6 max-w-md text-sm text-gray-400 md:text-base">
                                Snacks, fresh produce, and daily essentials — delivered to your door before you finish scrolling.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/allProducts')}
                                    className="group inline-flex items-center gap-2 rounded-md bg-[#FF9900] px-7 py-3 font-bold text-black transition hover:bg-[#ffae33]"
                                >
                                    Start shopping
                                    <span className="transition-transform group-hover:translate-x-1">→</span>
                                </button>
                                <button
                                    onClick={() => navigate('/groceries')}
                                    className="rounded-md border border-white/20 px-7 py-3 font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
                                >
                                    Explore categories
                                </button>
                            </div>
                        </div>

                        {/* Right: delivery status card */}
                        <div className="lg:justify-self-end">
                            <div className="w-full max-w-md rounded-2xl border-l-2 border-[#FF9900] bg-[#0f0f10]/80 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">Delivery Status</p>
                                        <h3 className="mt-1 text-2xl font-bold text-white">Arriving in {deliveryTime}:00</h3>
                                    </div>
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-lg ring-1 ring-white/10">🏍️</span>
                                </div>

                                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-2/3 rounded-full bg-[#FF9900]" />
                                </div>

                                <div className="mt-5 space-y-3">
                                    {[
                                        { label: 'Order packed', done: true },
                                        { label: 'Out for delivery', done: true },
                                        { label: 'At your doorstep', done: false },
                                    ].map((s) => (
                                        <div key={s.label} className="flex items-center gap-3">
                                            <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${s.done ? 'bg-[#FF9900] text-black' : 'bg-white/10 text-gray-500'}`}>
                                                {s.done ? '✓' : '○'}
                                            </span>
                                            <span className={`text-sm ${s.done ? 'font-medium text-white' : 'text-gray-500'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FEATURE CARDS ── */}
            <section className="mx-auto max-w-[1500px] px-6 pb-16 pt-4">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {FEATURES.map((f) => (
                        <div
                            key={f.title}
                            className={`rounded-xl bg-[#101012] p-6 ring-1 ring-white/10 transition hover:ring-white/25 ${f.highlight ? 'border-l-2 border-[#FF9900]' : ''}`}
                        >
                            <div className={`mb-5 grid h-11 w-11 place-items-center rounded-lg ${f.highlight ? 'bg-[#FF9900]/15' : 'bg-white/5'}`}>
                                <svg className={`h-5 w-5 ${f.highlight ? 'text-[#FF9900]' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">{f.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default QuickCommerceHero;
