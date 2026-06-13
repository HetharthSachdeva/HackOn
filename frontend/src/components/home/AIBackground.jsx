import React, { useMemo } from 'react';

// Futuristic animated background: gradient waves, floating light orbs, drifting particles.
const AIBackground = ({ active }) => {
    const particles = useMemo(
        () =>
            Array.from({ length: 28 }).map((_, i) => ({
                id: i,
                left: Math.random() * 100,
                size: Math.random() * 3 + 1.5,
                delay: Math.random() * 8,
                duration: Math.random() * 10 + 10,
                opacity: Math.random() * 0.5 + 0.2,
            })),
        []
    );

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out ${
                active ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1b2550_0%,_#0a0f24_55%,_#060814_100%)]" />

            <div className="ai-wave ai-wave--1" />
            <div className="ai-wave ai-wave--2" />
            <div className="ai-wave ai-wave--3" />

            <div className="ai-orb ai-orb--violet" />
            <div className="ai-orb ai-orb--cyan" />
            <div className="ai-orb ai-orb--orange" />

            {particles.map((p) => (
                <span
                    key={p.id}
                    className="ai-particle"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        opacity: p.opacity,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

            <style>{`
                .ai-wave {
                    position: absolute;
                    left: 50%;
                    border-radius: 45%;
                    transform: translateX(-50%);
                    filter: blur(40px);
                    opacity: 0.5;
                    mix-blend-mode: screen;
                }
                .ai-wave--1 { bottom: -55%; width: 120%; height: 120%; background: radial-gradient(circle, rgba(124,58,237,0.45), transparent 60%); animation: wave-spin 18s linear infinite; }
                .ai-wave--2 { bottom: -60%; width: 110%; height: 110%; background: radial-gradient(circle, rgba(34,211,238,0.30), transparent 60%); animation: wave-spin 24s linear infinite reverse; }
                .ai-wave--3 { bottom: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255,153,0,0.22), transparent 60%); animation: wave-spin 30s linear infinite; }
                @keyframes wave-spin { from { transform: translateX(-50%) rotate(0deg); } to { transform: translateX(-50%) rotate(360deg); } }

                .ai-orb { position: absolute; border-radius: 9999px; filter: blur(60px); opacity: 0.5; }
                .ai-orb--violet { top: 10%; left: 12%; width: 320px; height: 320px; background: rgba(139,92,246,0.45); animation: float-a 14s ease-in-out infinite; }
                .ai-orb--cyan { top: 30%; right: 10%; width: 280px; height: 280px; background: rgba(34,211,238,0.35); animation: float-b 17s ease-in-out infinite; }
                .ai-orb--orange { bottom: 8%; left: 40%; width: 360px; height: 360px; background: rgba(255,153,0,0.28); animation: float-a 20s ease-in-out infinite reverse; }
                @keyframes float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.1); } }
                @keyframes float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,25px) scale(1.15); } }

                .ai-particle { position: absolute; bottom: -10px; border-radius: 9999px; background: rgba(255,255,255,0.9); box-shadow: 0 0 8px 2px rgba(255,177,69,0.7); animation-name: rise; animation-timing-function: linear; animation-iteration-count: infinite; }
                @keyframes rise { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-110vh) translateX(30px); opacity: 0; } }
            `}</style>
        </div>
    );
};

export default AIBackground;
