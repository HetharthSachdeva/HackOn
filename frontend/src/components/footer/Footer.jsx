import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { logo } from '../../assets';

const serviceLinks = [
  { label: 'FAQ', to: '#' },
  { label: 'Manuals', to: '#' },
  { label: 'Downloads', to: '#' },
  { label: 'CE documents', to: '#' },
  { label: 'Shipping and payment', to: '#' },
  { label: 'Dealer Map', to: '#' },
];

const legalLinks = [
  { label: 'Contact', to: '#' },
  { label: 'Terms and Conditions', to: '#' },
  { label: 'Cookies', to: '#' },
  { label: 'Privacy Policy', to: '#' },
  { label: 'Imprint', to: '#' },
  { label: 'Right of withdrawal', to: '#' },
];

const Footer = () => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => setPos({ x: -9999, y: -9999 });

  return (
    <footer
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden bg-[#131921] text-gray-300"
      style={{ '--mx': `${pos.x}px`, '--my': `${pos.y}px` }}
    >
      {/* Soft ambient glow following the cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(420px circle at var(--mx) var(--my), rgba(255,153,0,0.16), transparent 70%)',
        }}
      />

      {/* Giant background wordmark with glow reveal */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex select-none items-end justify-center overflow-hidden">
        {/* base (barely visible) */}
        <span className="footer-bigtext text-white/[0.04]">AZON NOW</span>
        {/* glow layer revealed near cursor */}
        <span
          className="footer-bigtext footer-bigtext--glow absolute bottom-0 left-1/2 -translate-x-1/2 text-[#ff990066]"
          style={{
            WebkitMaskImage:
              'radial-gradient(260px circle at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.4) 45%, transparent 70%)',
            maskImage:
              'radial-gradient(260px circle at var(--mx) var(--my), #000 0%, rgba(0,0,0,0.4) 45%, transparent 70%)',
          }}
        >
          AZON NOW
        </span>
      </div>

      {/* Vertical promo tab */}
      <div className="absolute right-0 top-16 z-20 hidden md:block">
        <div className="flex items-center justify-center rounded-l-md border border-r-0 border-[#febd69]/40 bg-[#232F3E] px-2 py-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#febd69] [writing-mode:vertical-rl]">
            5% off first order
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1500px] px-6 pt-14 pb-8">
        {/* Top: intro + link columns */}
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          {/* Left intro */}
          <div className="max-w-sm">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              Delivered in <span className="text-[#febd69]">minutes</span>, not days.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Groceries, electronics and everyday essentials at unbeatable prices —
              brought to your door before you finish your coffee.
            </p>

            {/* Quick feature highlights */}
            {/* <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: '⚡', label: 'Fast delivery' },
                { icon: '🛡️', label: 'Secure checkout' },
                { icon: '↩️', label: 'Easy returns' },
              ].map((f) => (
                <div key={f.label} className="rounded-lg bg-white/5 px-3 py-3 text-center ring-1 ring-white/10">
                  <div className="text-xl">{f.icon}</div>
                  <p className="mt-1 text-[11px] font-medium text-gray-300">{f.label}</p>
                </div>
              ))}
            </div> */}

            {/* Payment methods */}
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">We accept</p>
              <div className="flex flex-wrap gap-2">
                {['VISA', 'MasterCard', 'UPI', 'PayPal', 'COD'].map((p) => (
                  <span key={p} className="rounded bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300 ring-1 ring-white/10">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:gap-24">
            <div>
              <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#febd69]">Service</h3>
              <ul className="space-y-3">
                {serviceLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-gray-300 transition-colors hover:text-[#febd69]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:pr-28">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#febd69]">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm text-gray-300 transition-colors hover:text-[#febd69]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-28 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          {/* Brand + socials */}
          <div className="flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="amazon" className="w-28 object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              {[
                { label: 'Facebook', path: 'M22 12a10 10 0 10-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0022 12z' },
                { label: 'Instagram', path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 1.8a3.1 3.1 0 100 6.2 3.1 3.1 0 000-6.2zm5.1-.9a1.1 1.1 0 110 2.3 1.1 1.1 0 010-2.3z' },
                { label: 'YouTube', path: 'M23 12s0-3.2-.4-4.7c-.2-.8-.9-1.5-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4c-.8.2-1.5.9-1.7 1.7C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.8.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.5.4-4.7.4-4.7zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z' },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-gray-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} amazon now | All Rights Reserved</p>
            <p className="mt-1 text-sm text-gray-500">All prices include VAT plus shipping/delivery costs, unless otherwise stated.</p>
            <div className="mt-4 flex items-center gap-2 md:justify-end">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Site Credits</span>
              <span className="inline-flex h-4 w-7 items-center rounded-full bg-white/10 px-0.5">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-bigtext {
          font-weight: 900;
          line-height: 0.8;
          letter-spacing: -0.02em;
          font-size: clamp(5rem, 20vw, 18rem);
          white-space: nowrap;
        }
        .footer-bigtext--glow {
          text-shadow: 0 0 40px rgba(255, 153, 0, 0.45);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
