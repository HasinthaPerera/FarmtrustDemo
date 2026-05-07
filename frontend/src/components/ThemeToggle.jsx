import React, { useState, useEffect } from 'react';

// ---------------------------------------------------------------------------
// ThemeToggle — Fixed FAB (bottom-right) that toggles dark mode.
// • Reads preference from localStorage on first render.
// • Falls back to the OS-level prefers-color-scheme if no saved preference.
// • Adds/removes the `dark` class on <html> so Tailwind dark: variants fire.
// • Persists the choice to localStorage on every toggle.
// ---------------------------------------------------------------------------

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // 1. Check for a saved preference first.
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // 2. Fall back to the OS color-scheme preference.
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync the <html> class and localStorage whenever isDark changes.
  useEffect(() => {
    const root = document.documentElement; // <html>
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-12 h-12
        rounded-lg
        shadow-lg
        transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600
        bg-slate-900 text-slate-100
        dark:bg-slate-100 dark:text-slate-900
        hover:scale-110 active:scale-95
      "
    >
      {isDark ? (
        // Sun icon — shown when dark mode is active (click to go light)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m8.66-9H21M3 12H2m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon — shown when light mode is active (click to go dark)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
