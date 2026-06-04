import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Trash2, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems, removeFromCart, processPayment } = useCart();

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, []);

  // Scroll Locking (Crucial UX)
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 transform flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShoppingBag size={24} className="text-primary-600 dark:text-primary-400" />
            Order History
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length > 0 ? (
            cartItems.map(order => (
              <div key={order.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-primary-200 dark:hover:border-primary-800 transition-colors relative">
                
                {/* Remove Button */}
                <button 
                  onClick={() => removeFromCart(order.id)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-start justify-between mb-3 pr-8">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{order.crop?.name || 'Crop'}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${order.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400 dark:border-green-400/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400 dark:border-yellow-400/20'}`}>
                    {order.paymentStatus?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{order.quantity} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">${Number(order.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-medium uppercase">{order.paymentMethod}</span>
                  </div>
                  {order.paymentReference && (
                    <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500">Ref:</span>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{order.paymentReference}</span>
                    </div>
                  )}
                </div>

                {/* Actions Area */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {order.paymentStatus === 'pending' ? (
                    <button 
                      onClick={() => processPayment(order.id)}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Pay Now
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                      <CheckCircle2 size={16} /> Completed
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-12 flex flex-col items-center">
              <ShoppingBag size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Your History is Empty</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Looks like you haven't bought anything yet.</p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default CartDrawer;
