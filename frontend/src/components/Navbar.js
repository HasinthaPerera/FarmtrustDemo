import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, LogOut } from 'lucide-react';
import CartDrawer from './CartDrawer';
import ThemeToggle from './ThemeToggle';

// ---------------------------------------------------------------------------
// Role-based navigation link configuration
// Each entry in the map is the definitive link list for that role.
// The guest key ('') covers the unauthenticated state.
// ---------------------------------------------------------------------------
const NAV_LINKS_BY_ROLE = {
  '': [
    { href: '/', label: 'Home' },
    { href: '/buyer', label: 'Marketplace' },
  ],
  buyer: [
    { href: '/buyer', label: 'Marketplace' },
    { href: '/ai-predictions', label: 'Future Prices' },
  ],
  farmer: [
    { href: '/farmer', label: 'My Products' },
    { href: '/ai-predictions', label: 'AI Price Page' },
  ],
  admin: [],
};

const AUTH_HREF = '/auth';

// ---------------------------------------------------------------------------
// Navbar component
// ---------------------------------------------------------------------------
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Scroll detection: isScrolled drives the transparent → solid transition
  // This effect is ONLY intended for the Home page hero section.
  // ---------------------------------------------------------------------------
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === '/';

  // For any page other than home, the navbar is permanently "solid" (scrolled state)
  const effectiveIsScrolled = isHome ? isScrolled : true;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Consume AuthContext — zero prop-drilling required
  const { user, logout } = useAuth();
  const { cartItems } = useCart();

  // Derive the correct link list for the current auth state / role
  const role = user?.role ?? '';
  const activeLinks = NAV_LINKS_BY_ROLE[role] ?? NAV_LINKS_BY_ROLE[''];
  const isGuest = !user;

  // Logout handler: clear context + localStorage, then redirect home
  const handleLogout = () => {
    logout();
    setNavOpen(false);
    navigate('/');
  };

  // ---------------------------------------------------------------------------
  // Shared render helpers
  // ---------------------------------------------------------------------------

  /** Desktop nav link — colour adapts to scroll state */
  const DesktopLink = ({ href, label }) => (
    <Link
      key={href + label}
      to={href}
      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${location.pathname === href
          ? effectiveIsScrolled
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400'
            : 'bg-white/15 text-white'
          : effectiveIsScrolled
            ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            : 'text-white/90 hover:text-white hover:bg-white/10'
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
      className={`block px-3 py-2 rounded-lg text-sm font-semibold transition ${location.pathname === href
          ? 'bg-primary-100 text-primary-800'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      {label}
    </Link>
  );

  // ---------------------------------------------------------------------------
  // Dynamic class derivations
  // ---------------------------------------------------------------------------
  const navBg = effectiveIsScrolled
    ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-md border-b border-slate-200 dark:border-slate-800'
    : 'bg-transparent';

  const logoTitleColor = effectiveIsScrolled
    ? 'text-primary-900 dark:text-primary-400'
    : 'text-white';

  const logoSubtitleColor = effectiveIsScrolled
    ? 'text-slate-500 dark:text-slate-400'
    : 'text-white/70';

  const signInClass = location.pathname === AUTH_HREF
    ? 'px-5 py-2 rounded-full border bg-emerald-500 text-white text-sm font-semibold transition-all duration-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
    : effectiveIsScrolled
      ? 'px-5 py-2 rounded-full border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-sm font-semibold transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95'
      : 'px-5 py-2 rounded-full border border-white/70 text-white text-sm font-semibold transition-all duration-300 hover:bg-white hover:text-slate-900 active:scale-95';

  const hamburgerClass = effectiveIsScrolled
    ? 'md:hidden p-2 rounded-lg bg-white/70 hover:bg-white border border-slate-200'
    : 'md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30';

  const hamburgerTextClass = effectiveIsScrolled ? 'text-slate-600 font-bold' : 'text-white font-bold';

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <nav className={`${isHome ? 'fixed' : 'sticky'} top-0 left-0 w-full z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
          <img
            src="/main_logo.png"
            alt="FarmTrust logo"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <h1 className={`text-xl font-display font-extrabold tracking-tight leading-none mb-0.5 transition-colors duration-300 ${logoTitleColor}`}>
              FarmTrust
            </h1>
            <p className={`text-[10px] uppercase tracking-wider font-bold transition-colors duration-300 ${logoSubtitleColor}`}>
              Agriculture Marketplace
            </p>
          </div>
        </Link>

        {/* ── Desktop navigation ── */}
        <div className="hidden md:flex items-center gap-5 ml-auto">
          {activeLinks.map(({ href, label }) => (
            <DesktopLink key={href + label} href={href} label={label} />
          ))}

          {/* Theme toggle — sits between nav links and auth actions */}
          <ThemeToggle isScrolled={effectiveIsScrolled} />

          {isGuest ? (
            <>
              {/* Single Sign In CTA — routes to unified /auth page */}
              <Link
                id="navbar-signin-btn"
                to={AUTH_HREF}
                className={signInClass}
              >
                Sign In
              </Link>
            </>
          ) : (
            /* Authenticated: Cart (if buyer) + Logout CTA */
            <div className={`flex items-center gap-3 ml-2 pl-4 border-l transition-colors duration-300 ${effectiveIsScrolled ? 'border-slate-200 dark:border-slate-700' : 'border-white/20'}`}>
              {role === 'buyer' && (
                <button
                  onClick={() => window.dispatchEvent(new Event('openCart'))}
                  className={`relative p-2 transition-all duration-300 flex items-center justify-center rounded-full ${effectiveIsScrolled ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-white/90 hover:text-white hover:bg-white/15'}`}
                  aria-label="Open Cart"
                >
                  <ShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-md border ${effectiveIsScrolled ? 'border-slate-200 hover:bg-red-500/10 text-red-500 bg-white hover:border-red-500/20 shadow-sm dark:bg-transparent dark:border-slate-700' : 'border-white/30 text-white bg-white/10 hover:bg-red-500/20 hover:border-red-400/40'}`}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* ── Hamburger toggle ── */}
        <button
          className={`${hamburgerClass} transition-all duration-300`}
          onClick={() => setNavOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span className={`${hamburgerTextClass} transition-colors duration-300`}>{navOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {navOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 shadow-md border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 py-3 space-y-1">
            {activeLinks.map(({ href, label }) => (
              <MobileLink key={href + label} href={href} label={label} />
            ))}

            {/* Theme toggle row — always visible on mobile menu */}
            <div className="flex items-center gap-3 px-3 py-2">
              <ThemeToggle isScrolled={true} />
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Toggle Theme
              </span>
            </div>

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
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2 space-y-2">
                {role === 'buyer' && (
                  <button
                    onClick={() => {
                      setNavOpen(false);
                      window.dispatchEvent(new Event('openCart'));
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart size={18} />
                      View Cart / Orders
                    </div>
                    {cartItems.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        {cartItems.length}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition border border-slate-200 dark:border-slate-700 hover:bg-red-500/10 text-red-500 bg-white dark:bg-transparent hover:border-red-500/20"
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
