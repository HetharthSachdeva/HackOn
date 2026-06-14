import React from 'react';
import { Link } from 'react-router-dom';
import { logo } from '../../assets';

const serviceLinks = [
  { label: 'Help Center', to: '#' },
  { label: 'Track Order', to: '#' },
  { label: 'Returns & Refunds', to: '#' },
  { label: 'Shipping Info', to: '#' },
  { label: 'Payment Options', to: '#' },
  { label: 'Contact Us', to: '#' },
];

const legalLinks = [
  { label: 'Terms of Service', to: '#' },
  { label: 'Privacy Policy', to: '#' },
  { label: 'Cookie Policy', to: '#' },
  { label: 'Security', to: '#' },
  { label: 'Sitemap', to: '#' },
];

const companyLinks = [
  { label: 'About Us', to: '#' },
  { label: 'Careers', to: '#' },
  { label: 'Press Releases', to: '#' },
  { label: 'Investors', to: '#' },
  { label: 'Sustainability', to: '#' },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-[#050505] pt-24 pb-12 font-sans text-gray-400">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 opacity-[0.03] blur-[150px]">
         <div className="h-[600px] w-[1000px] rounded-full bg-[#FF9900]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1600px] px-6 sm:px-12 lg:px-16">
        
        {/* Top Section: Newsletter & Brand */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-16">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-4">
              Stay in the <span className="text-[#FF9900]">Loop</span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">
              Join our newsletter for exclusive deals, new arrivals, and early access to sales. We promise we don't spam.
            </p>
          </div>

          <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-[#0a0a0a] p-2 ring-1 ring-white/10 transition-shadow focus-within:ring-[#FF9900]/50 focus-within:shadow-[0_0_20px_rgba(255,153,0,0.1)]">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="w-full bg-transparent px-4 py-3 text-white outline-none placeholder:text-gray-600 font-mono text-sm"
            />
            <button className="rounded-xl bg-[#FF9900] px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:bg-[#ffb145] hover:scale-[1.02] active:scale-[0.98]">
              Subscribe
            </button>
          </div>
        </div>

        {/* Middle Section: Links */}
        <div className="grid grid-cols-2 gap-12 py-16 md:grid-cols-4 lg:gap-24">
          
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block mb-8 transition-transform hover:scale-105">
              <img src={logo} alt="Logo" className="w-32 object-contain" />
            </Link>
            <p className="mb-8 text-sm leading-loose text-gray-500 max-w-xs">
              Your premium destination for the best products, delivered with unprecedented speed and world-class customer service.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-4">
              {[
                { label: 'Facebook', path: 'M22 12a10 10 0 10-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.5-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0022 12z' },
                { label: 'Instagram', path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 1.8a3.1 3.1 0 100 6.2 3.1 3.1 0 000-6.2zm5.1-.9a1.1 1.1 0 110 2.3 1.1 1.1 0 010-2.3z' },
                { label: 'YouTube', path: 'M23 12s0-3.2-.4-4.7c-.2-.8-.9-1.5-1.7-1.7C19.4 5.2 12 5.2 12 5.2s-7.4 0-8.9.4c-.8.2-1.5.9-1.7 1.7C1 8.8 1 12 1 12s0 3.2.4 4.7c.2.8.9 1.5 1.7 1.7 1.5.4 8.9.4 8.9.4s7.4 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.5.4-4.7.4-4.7zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z' },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-gray-400 ring-1 ring-white/10 transition-all duration-300 hover:bg-[#FF9900] hover:text-black hover:scale-110">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.25em] text-white">Company</h3>
            <ul className="space-y-4">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm font-medium text-gray-500 transition-colors hover:text-[#FF9900]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.25em] text-white">Customer Service</h3>
            <ul className="space-y-4">
              {serviceLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm font-medium text-gray-500 transition-colors hover:text-[#FF9900]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.25em] text-white">Legal</h3>
            <ul className="space-y-4">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm font-medium text-gray-500 transition-colors hover:text-[#FF9900]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-t border-white/5 pt-8">
          
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">We Accept</span>
            <div className="flex gap-2">
              {['VISA', 'MASTERCARD', 'PAYPAL', 'APPLE PAY'].map((p) => (
                <span key={p} className="rounded-md bg-[#141414] px-3 py-1.5 font-mono text-[9px] font-bold tracking-widest text-gray-400 ring-1 ring-white/5">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm font-medium text-gray-500">© {new Date().getFullYear()} Amazon Clone. All Rights Reserved.</p>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
