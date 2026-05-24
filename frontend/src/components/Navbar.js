import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, LogOut } from 'lucide-react';
import CartDrawer from './CartDrawer';

// ---------------------------------------------------------------------------
// Role-based navigation link configuration
// Each entry in the map is the definitive link list for that role.
// The guest key ('') covers the unauthenticated state.
// ---------------------------------------------------------------------------
const NAV_LINKS_BY_ROLE = {
  '':       [
    { href: '/',           label: 'Home'        },
    { href: '/buyer',      label: 'Marketplace' },
  ],
  buyer:    [
    { href: '/buyer',          label: 'Marketplace' },
    { href: '/ai-predictions', label: 'Future Prices' },
  ],
  farmer:   [
    { href: '/farmer',     label: 'Dashboard'    },
    { href: '/farmer',     label: 'My Products'  },
  ],
  admin:    [],
};

const AUTH_HREF = '/auth';

// ---------------------------------------------------------------------------
// Navbar component
// ---------------------------------------------------------------------------
const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  // Consume AuthContext — zero prop-drilling required
  const { user, logout } = useAuth();

  // Derive the correct link list for the current auth state / role
  const role        = user?.role ?? '';
  const activeLinks = NAV_LINKS_BY_ROLE[role] ?? NAV_LINKS_BY_ROLE[''];
  const isGuest     = !user;

  // Logout handler: clear context + localStorage, then redirect home
  const handleLogout = () => {
    logout();
    setNavOpen(false);
    navigate('/');
  };

  // ---------------------------------------------------------------------------
  // Shared render helpers (keep class strings identical to the original)
  // ---------------------------------------------------------------------------

  /** Desktop nav link */
  const DesktopLink = ({ href, label }) => (
    <Link
      key={href + label}
      to={href}
      className={`px-3 py-2 text-sm font-semibold transition
  ${location.pathname === href
          ? 'border-b-2 border-green-500 text-green-700'
          : 'text-slate-600 hover:text-slate-900'
        }`}
    >
      {label}
    </Link>
  );

  /** Mobile nav link */
  const MobileLink = ({ href, label }) => (
    <Link
      key={href + label}
      to={href}
      onClick={() => setNavOpen(false)}
      className={`block px-3 py-2 rounded-lg text-sm font-semibold transition ${
        location.pathname === href
          ? 'bg-primary-100 text-primary-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {label}
    </Link>
  );

  // ---------------------------------------------------------------------------
  // JSX — structure identical to original; only the mapped content changes
  // ---------------------------------------------------------------------------
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/main_logo.png"
            alt="FarmTrust logo"
            className="h-7 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl font-display font-bold text-primary-900">
              FarmTrust
            </h1>
            <p className="text-xs text-slate-500">Agriculture marketplace</p>
          </div>
        </Link>

        {/* ── Desktop navigation ── */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {activeLinks.map(({ href, label }) => (
            <DesktopLink key={href + label} href={href} label={label} />
          ))}

          {isGuest ? (
            <>
              {/* Single Sign In CTA — routes to unified /auth page */}
              <Link
                id="navbar-signin-btn"
                to={AUTH_HREF}
                className={
                  location.pathname === AUTH_HREF
                    ? 'px-4 py-2 text-sm font-semibold transition rounded-md border-b-2 border-emerald-500 text-emerald-600 bg-transparent'
                    : 'px-4 py-2 text-sm font-semibold transition rounded-md bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                }
              >
                Sign In
              </Link>
            </>
          ) : (
            /* Authenticated: Cart (if buyer) + Logout CTA */
            <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-4">
              {role === 'buyer' && (
                <button
                  onClick={() => window.dispatchEvent(new Event('openCart'))}
                  className="p-2 text-slate-600 hover:text-slate-900 transition flex items-center justify-center rounded-full hover:bg-slate-100"
                  aria-label="Open Cart"
                >
                  <ShoppingCart size={20} />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition rounded-md border border-slate-200 hover:bg-red-500/10 text-red-500 bg-white hover:border-red-500/20 shadow-sm"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* ── Hamburger toggle ── */}
        <button
          className="md:hidden p-2 rounded-lg bg-white/70 hover:bg-white border border-slate-200"
          onClick={() => setNavOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="text-slate-600 font-bold">{navOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {navOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-slate-200">
          <div className="px-4 py-3 space-y-1">
            {activeLinks.map(({ href, label }) => (
              <MobileLink key={href + label} href={href} label={label} />
            ))}

            {isGuest ? (
              <>
                {/* Single Sign In CTA (mobile) — routes to unified /auth page */}
                <Link
                  id="navbar-mobile-signin-btn"
                  to={AUTH_HREF}
                  onClick={() => setNavOpen(false)}
                  className={
                    location.pathname === AUTH_HREF
                      ? 'block px-3 py-2 rounded-lg text-sm font-semibold transition bg-emerald-100 text-emerald-800'
                      : 'block px-3 py-2 rounded-lg text-sm font-semibold transition bg-emerald-500 text-white hover:bg-emerald-600'
                  }
                >
                  Sign In
                </Link>
              </>
            ) : (
              /* Authenticated: Cart (if buyer) + Logout CTA (mobile) */
              <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
                {role === 'buyer' && (
                  <button
                    onClick={() => {
                      setNavOpen(false);
                      window.dispatchEvent(new Event('openCart'));
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ShoppingCart size={18} />
                    View Cart / Orders
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition border border-slate-200 hover:bg-red-500/10 text-red-500 bg-white hover:border-red-500/20"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Globally persistent Cart Drawer for Buyers */}
      {role === 'buyer' && <CartDrawer />}
    </nav>
  );
};

export default Navbar;
