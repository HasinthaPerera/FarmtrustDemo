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

  useEffect(() => {
    localStorage.setItem('farmtrust_cart', JSON.stringify(cartItems));
  }, [cartItems]);


  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        // Increase quantity
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, totalAmount: (item.quantity + 1) * Number(product.price) }
            : item
        );
      }
      // Add new item with default pending status and quantity 1
      return [...prev, {
        id: product.id,
        crop: product,
        quantity: 1,
        totalAmount: Number(product.price),
        paymentStatus: 'pending',
        paymentMethod: 'card'
      }];
    });
    alert('Added to cart!'); // UI feedback as requested
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
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
