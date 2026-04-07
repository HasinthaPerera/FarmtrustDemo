import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { href: '/', label: 'Home' },
  { href: '/farmer', label: 'Farmer' },
  { href: '/buyer', label: 'Buyer' },
  { href: '/ai-predictions', label: 'Future Prices' },
  { href: '/admin', label: 'Admin' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' }
];

const Navbar = () => {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold">FT</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-primary-900">FarmTrust</h1>
            <p className="text-xs text-slate-500">Agriculture marketplace</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                location.pathname === href ? 'bg-primary-100 text-primary-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden p-2 rounded-lg bg-white/70 hover:bg-white border border-slate-200"
          onClick={() => setNavOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="text-slate-600 font-bold">{navOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {navOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-slate-200">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setNavOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  location.pathname === href ? 'bg-primary-100 text-primary-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
