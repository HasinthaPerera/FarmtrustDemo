import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';


// ---------------------------------------------------------------------------
// Hero slideshow — high-quality Unsplash agriculture images.
// We use translateX on an absolute flex track to create the physical slide.
// ---------------------------------------------------------------------------
const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&auto=format&fit=crop&q=80',
    alt: 'Golden wheat field at sunrise',
  },
  {
    url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&auto=format&fit=crop&q=80',
    alt: 'Tractor working a large green farm',
  },
  {
    url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&auto=format&fit=crop&q=80',
    alt: 'Fresh produce at a farmers market',
  },
  {
    url: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&auto=format&fit=crop&q=80',
    alt: 'Sunrise over a lush agricultural valley',
  },
];

// ---------------------------------------------------------------------------
// Featured Products — mock data (image: '' triggers emoji fallback logic)
// ---------------------------------------------------------------------------
const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'Organic Mango',
    quantity: 200,
    price: 3.49,
    originalPrice: 4.49,
    discount: 22,
    image: '',
  },
  {
    id: 2,
    name: 'Fresh Watermelon',
    quantity: 85,
    price: 1.99,
    originalPrice: 2.49,
    discount: 20,
    image: '',
  },
  {
    id: 3,
    name: 'Premium Basmati Rice',
    quantity: 500,
    price: 2.79,
    originalPrice: 3.49,
    discount: 20,
    image: '',
  },
];

// ---------------------------------------------------------------------------
// Image-fallback emoji mapping (mirrors BuyerDashboard / FarmerDashboard)
// ---------------------------------------------------------------------------
const CROP_EMOJI_MAP = {
  banana: '🍌', coconut: '🥥', watermelon: '🍉', mango: '🥭',
  apple: '🍎', orange: '🍊', grape: '🍇', strawberry: '🍓',
  tomato: '🍅', potato: '🥔', carrot: '🥕', corn: '🌽',
  wheat: '🌾', rice: '🍚', onion: '🧅', garlic: '🧄',
  pepper: '🫑', broccoli: '🥦', spinach: '🥬', pumpkin: '🎃',
  lemon: '🍋', pineapple: '🍍', peach: '🍑', pear: '🍐',
  cherry: '🍒', blueberry: '🫐', mushroom: '🍄', cabbage: '🥬',
  cucumber: '🥒', avocado: '🥑', eggplant: '🍆', radish: '🌱',
};

const getCropEmoji = (name = '') => {
  const key = name.toLowerCase();
  for (const [word, emoji] of Object.entries(CROP_EMOJI_MAP)) {
    if (key.includes(word)) return emoji;
  }
  return '🌿';
};

// ---------------------------------------------------------------------------
// Role → CTA configuration map
// Determines the primary button text and destination for the current user.
// ---------------------------------------------------------------------------
const CTA_CONFIG = {
  '': { label: 'Start Exploring', route: '/buyer' },
  buyer: { label: 'Go to Marketplace', route: '/buyer' },
  farmer: { label: 'Go to Dashboard', route: '/farmer' },
  admin: { label: 'Go to Admin Panel', route: '/admin' },
};

// ---------------------------------------------------------------------------
// Typewriter heading — split into words so each fades in sequentially.
// Using words (not chars) preserves responsive line-wrapping on mobile.
// ---------------------------------------------------------------------------
const HERO_HEADING_WORDS = 'Empower Your Agricultural Business'.split(' ');

// Parent variant: orchestrates staggered reveal of each child word.
const headingContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,   // 4 words × 0.12s ≈ 0.48s total type time
      delayChildren: 0.1,      // tiny lead-in before first word appears
    },
  },
};

// Child variant: each word pops in (pure opacity — no vertical slide,
// so it feels like characters being typed rather than falling in).
const headingWordVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

const Home = () => {
  const { user } = useAuth();

  // Derive the primary CTA text + route from the current auth role
  const ctaConfig = CTA_CONFIG[user?.role ?? ''] ?? CTA_CONFIG[''];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Bulletproof scroll-reveal: ref on the <section> (guaranteed intrinsic
  // height from py-24 + heading), currentRef captured before the callback
  // closes over it, observer.unobserve() stops it after the first fire.
  // ---------------------------------------------------------------------------
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInitialLoading) return; // Splash screen is still mounted; sectionRef.current is null — wait.

    const currentRef = sectionRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(currentRef); // stop after first intersection
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [isInitialLoading]); // re-runs when splash finishes → sectionRef is now valid

  // ---------------------------------------------------------------------------
  // Independent scroll-reveal for the "Platform Highlights" section.
  // Identical bulletproof pattern: isInitialLoading guard, currentRef capture,
  // unobserve-after-first-fire, [isInitialLoading] dep array.
  // ---------------------------------------------------------------------------
  const highlightsRef = useRef(null);
  const [isHighlightsVisible, setIsHighlightsVisible] = useState(false);

  useEffect(() => {
    if (isInitialLoading) return; // wait for splash to finish

    const currentRef = highlightsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsHighlightsVisible(true);
          observer.unobserve(currentRef); // stop after first intersection
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [isInitialLoading]); // re-runs when splash finishes → highlightsRef is now valid

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    // Cleanup: prevent memory leaks on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 z-50 fixed top-0 left-0">
        <img src="/main_logo.png" alt="FarmTrust Logo" className="w-32 h-32 mb-4 animate-pulse" />
        <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">FarmTrust</h1>
        <div className="mt-6 w-12 h-12 border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      {/* Hero Section — sliding image background */}
      <section className="relative h-[calc(100vh-73px)] w-full overflow-hidden">

        {/* ── Overflow-hidden viewport (clips the sliding track) ────────── */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">

          {/* ── Sliding track: w-full keeps width = 1 viewport; each slide
               is min-w-full so translateX(-N*100%) shifts exactly N slides */}
          <div
            className="flex w-full h-full transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('${slide.url}')`
                }}
                role="img"
                aria-label={slide.alt}
              />
            ))}
          </div>

        </div>{/* end viewport */}

        {/* ── Dark scrim: bg-black/40 = 40% opacity, sits in background ─ */}
        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

        {/* ── Protective fade overlay: bottom-to-top gradient to protect contrast ─ */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent z-0 pointer-events-none" />

        {/* ── Content — sits securely above the background carousel ─────── */}
        <div className="relative z-10 h-full flex flex-col justify-end pb-16 md:pb-24 w-full max-w-7xl mx-auto px-6 text-center text-white">

          {/* ── Typewriter heading: each word fades in via staggerChildren ─── */}
          <motion.h2
            className="text-5xl md:text-6xl font-hero-display font-bold italic mb-4 tracking-tight"
            variants={headingContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {HERO_HEADING_WORDS.map((word, i) => (
              <motion.span
                key={i}
                variants={headingWordVariants}
                // inline-block so each word is an independent animation target
                // while still wrapping naturally on narrow viewports
                className="inline-block mr-[0.25em] last:mr-0"
              >
                {word}
              </motion.span>
            ))}
          </motion.h2>

          {/* ── Paragraph: fade-up, starts after typing finishes (≈1.5s) ─── */}
          <motion.p
            className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10 drop-shadow-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.5 }}
          >
            FarmTrust connects farmers and buyers with transparency, trust, and fair pricing. Grow your business with our intelligent marketplace.
          </motion.p>

          {/* ── Buttons: fade-up last, 300ms after paragraph begins (≈1.8s) ── */}
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.8 }}
          >
            {/* Primary CTA — rich gradient, inner glow, outer shadow, and animated arrow */}
            <Link
              to={ctaConfig.route}
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-white rounded-full overflow-hidden transition-all duration-300 active:scale-95 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),_0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),_0_6px_25px_rgba(16,185,129,0.6)] hover:-translate-y-1"
            >
              {ctaConfig.label}
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            {/* Secondary CTA — premium frosted glassmorphism */}
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white rounded-full bg-white/10 backdrop-blur-md border border-white/30 transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 active:scale-95"
              >
                Get Started Free
              </Link>
            )}
          </motion.div>
        </div>

      </section>

      {/* ── Featured Products ─────────────────────────────────────────────────
           Sits between Hero and "Why Choose FarmTrust". Same bg/padding as
           the Why Choose section for a seamless visual transition.          */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section header */}
          <div className="mb-12 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-sm font-semibold mb-3">
              🛒 Live on FarmTrust
            </span>
            <h3 className="section-header dark:text-slate-100">Featured Products</h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg max-w-xl mx-auto">
              Hand-picked fresh produce from verified farmers — straight to you.
            </p>
          </div>

          {/* Desktop: cards + explore button in a single row
               Mobile : cards stacked, button at the bottom              */}
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">

            {/* 3 product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1">
              {FEATURED_PRODUCTS.map(product => {
                const emoji = getCropEmoji(product.name);
                return (
                  <div
                    key={product.id}
                    className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Image / Emoji area */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-7xl select-none group-hover:scale-110 transition-transform duration-300">
                          {emoji}
                        </span>
                      )}

                      {/* Discount badge — top-left */}
                      <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                        {product.discount}% Off
                      </span>

                      {/* Produce tag — bottom-left */}
                      <span className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/60 dark:border-slate-600 shadow">
                        🌱 Fresh Produce
                      </span>
                    </div>

                    {/* Details area */}
                    <div className="flex flex-col flex-1 p-4 gap-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {product.name}
                      </h3>

                      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
                        Available: {product.quantity} kg
                      </p>

                      {/* Pricing row */}
                      <div className="flex items-baseline gap-2 mt-auto">
                        <span className="text-xl font-extrabold text-primary-700 dark:text-primary-400">
                          ${product.price.toFixed(2)}
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/kg</span>
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Link
                          to="/buyer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                        >
                          🛒 Add to Cart
                        </Link>
                        <Link
                          to="/buyer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          ⚡ Buy Now
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "Explore for more" CTA — right column on desktop, bottom on mobile */}
            <div className="flex lg:flex-col items-center justify-center lg:justify-center lg:w-48 shrink-0">
              <Link
                to={ctaConfig.route}
                className="group flex flex-col items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full text-center"
              >
                {/* Animated arrow circle */}
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30 group-hover:bg-white/30 transition-colors duration-300">
                  <svg
                    className="w-8 h-8 text-white transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <span className="text-base font-bold leading-tight">
                  Explore<br />for more
                </span>
                <span className="text-xs text-white/70 font-medium">
                  View all listings →
                </span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* sectionRef on the outermost wrapper — py-24 padding + heading give it
          guaranteed intrinsic height so the observer fires early & reliably. */}
      <section ref={sectionRef} className="py-24 bg-slate-50 dark:bg-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="section-header dark:text-slate-100">Why Choose FarmTrust?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

            {/* ── Card 1 — Transparent Pricing
                 Mobile : opacity-0 translate-y-10  →  opacity-100 translate-y-0
                 Desktop: md:-translate-x-20        →  translate-x-0
                 Delay  : none (fires first) */}
            <div
              className={`feature-card text-left dark:bg-slate-700/60 dark:border dark:border-slate-600
                transition-all duration-1000 ease-out
                ${isVisible
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-0 md:-translate-x-20'
                }`}
            >
              <div className="feature-icon mb-4">⚖️</div>
              <h4 className="dark:text-slate-100">Transparent Pricing</h4>
              <p className="dark:text-slate-300">Automated market analysis delivers fair quotes for farmers and buyers, eliminating middleman markup.</p>
            </div>

            {/* ── Card 2 — Secure Payments
                 Mobile & Desktop: opacity-0 translate-y-10/20  →  opacity-100 translate-y-0
                 Delay: 200ms */}
            <div
              className={`feature-card text-left dark:bg-slate-700/60 dark:border dark:border-slate-600
                transition-all duration-1000 ease-out delay-200
                ${isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-20'
                }`}
            >
              <div className="feature-icon mb-4">🔒</div>
              <h4 className="dark:text-slate-100">Secure Payments</h4>
              <p className="dark:text-slate-300">Protected escrow workflows and encrypted transfers give both parties confidence and contract safety.</p>
            </div>

            {/* ── Card 3 — Verified Trust
                 Mobile : opacity-0 translate-y-10  →  opacity-100 translate-y-0
                 Desktop: md:translate-x-20         →  translate-x-0
                 Delay  : 400ms */}
            <div
              className={`feature-card text-left dark:bg-slate-700/60 dark:border dark:border-slate-600
                transition-all duration-1000 ease-out delay-400
                ${isVisible
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-0 md:translate-x-20'
                }`}
            >
              <div className="feature-icon mb-4">✔️</div>
              <h4 className="dark:text-slate-100">Verified Trust</h4>
              <p className="dark:text-slate-300">Blockchain-anchored verification badges and quality ratings make trust decisions instant and audit-ready.</p>
            </div>

          </div>
        </div>
      </section>

      {/* Platform Highlights — highlightsRef on the outermost <section> guarantees
          intrinsic height (py-24 + heading), so the observer fires reliably. */}
      <section ref={highlightsRef} className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="section-header dark:text-slate-100">Platform Highlights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">

            {/* Card 1 — Fair Pricing
                 Mobile : opacity-0 translate-y-10  →  opacity-100 translate-y-0
                 Desktop: md:-translate-x-20        →  translate-x-0
                 Delay  : 100ms */}
            <div
              className={`glass-card text-center dark:bg-slate-800 dark:border dark:border-slate-700
                transition-all duration-1000 ease-out delay-100
                ${isHighlightsVisible
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-0 md:-translate-x-20'
                }`}
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Fair Pricing</h4>
              <p className="text-slate-600 dark:text-slate-300">AI-powered market intelligence ensures transparent and fair pricing for all transactions.</p>
            </div>

            {/* Card 2 — Secure Payments
                 Mobile & Desktop: opacity-0 translate-y-10/20  →  opacity-100 translate-y-0
                 Delay: 200ms */}
            <div
              className={`card-lg text-center hover:shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700
                transition-all duration-1000 ease-out delay-200
                ${isHighlightsVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-20'
                }`}
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Secure Payments</h4>
              <p className="text-slate-600 dark:text-slate-300">Safe, encrypted transactions with escrow and multiple payment options for peace of mind.</p>
            </div>

            {/* Card 3 — Trust Marks
                 Mobile : opacity-0 translate-y-10  →  opacity-100 translate-y-0
                 Desktop: md:translate-x-20         →  translate-x-0
                 Delay  : 400ms */}
            <div
              className={`card-lg text-center hover:shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700
                transition-all duration-1000 ease-out delay-400
                ${isHighlightsVisible
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-y-10 md:translate-y-0 md:translate-x-20'
                }`}
            >
              <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">Trust Marks</h4>
              <p className="text-slate-600 dark:text-slate-300">Blockchain-based verification system for authenticity, reliability, and seller reputation.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Premium CTA Section ─────────────────────────────────────────── */}
      <section className="relative py-24 md:py-28 overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 dark:from-emerald-900 dark:to-teal-950 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
        {/* Subtle glowing orbs for depth */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
          <h3 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-6 tracking-tight leading-tight">
            Cultivate Your Future with FarmTrust.
          </h3>
          <p className="text-lg md:text-xl mb-10 text-primary-100 dark:text-teal-100/90 max-w-2xl mx-auto font-medium leading-relaxed">
            Connect directly with verified buyers and trusted farmers. Experience transparent pricing, secure transactions, and a thriving digital community.
          </p>
          <div className="flex justify-center">
            <Link
              to={user ? ctaConfig.route : "/register"}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white text-primary-700 dark:text-emerald-900 font-bold text-lg shadow-lg hover:bg-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {user ? ctaConfig.label : "Create Your Free Account"}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">

            {/* Column 1: Brand Identity & About */}
            <div className="md:col-span-2">
              <Link to="/" className="inline-block mb-6">
                <span className="text-3xl font-display font-extrabold text-white tracking-tight">FarmTrust</span>
              </Link>
              <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-sm">
                Connecting farmers and buyers with trust and transparency. Experience a fair, secure and intelligent agricultural marketplace.
              </p>
              <div className="flex flex-col gap-3">
                <a href="mailto:support@farmtrust.com" className="inline-flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  support@farmtrust.com
                </a>
                <a href="tel:+18005550199" className="inline-flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  +94 764640282
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h6 className="text-white text-lg font-bold mb-6">Product</h6>
              <ul className="space-y-4 text-base">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#security" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h6 className="text-white text-lg font-bold mb-6">Company</h6>
              <ul className="space-y-4 text-base">
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#blog" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="mailto:support@farmtrust.com" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h6 className="text-white text-lg font-bold mb-6">Legal</h6>
              <ul className="space-y-4 text-base">
                <li><a href="#privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#cookie" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800">
            <p className="text-sm text-slate-500 mb-4 md:mb-0">
              &copy; 2026 FarmTrust. All rights reserved.
            </p>

            {/* Social Icons (Dummy) */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" /></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
              </a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.7-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;