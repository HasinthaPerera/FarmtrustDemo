import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('farmtrust_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (err) {
      console.error('Failed to parse cart from localStorage:', err);
      return [];
    }
  });

  const [showToast, setShowToast] = useState(false);
  const [toastTrigger, setToastTrigger] = useState(0);

  useEffect(() => {
    localStorage.setItem('farmtrust_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (toastTrigger > 0) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastTrigger]);


  const addToCart = (product, quantityInput = 1) => {
    const qty = Number(quantityInput) || 1;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Increase quantity
        const newQty = existing.quantity + qty;
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQty, totalAmount: newQty * Number(product.price) }
            : item
        );
      }
      // Add new item with default pending status and specified quantity
      return [...prev, {
        id: product.id,
        crop: product,
        quantity: qty,
        totalAmount: qty * Number(product.price),
        paymentStatus: 'pending',
        paymentMethod: 'card'
      }];
    });
    setToastTrigger(prev => prev + 1);
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const processPayment = (productId) => {
    setCartItems(prev => prev.map(item =>
      item.id === productId ? { ...item, paymentStatus: 'paid' } : item
    ));
    alert('Payment successful!');
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, processPayment }}>
      {children}
      
      {/* Toast Notification */}
      <div
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 transition-all duration-300 transform ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span className="text-sm font-semibold text-white">Item added to cart successfully!</span>
      </div>
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
