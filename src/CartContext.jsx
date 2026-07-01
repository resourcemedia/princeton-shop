import React, { createContext, useContext, useState, useCallback } from "react";

// Shared cart state (product slug -> quantity), lifted above the router so it
// survives navigation between /shop and /order.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [qty, setQty] = useState({});

  const add = useCallback((id) => {
    setQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 }));
  }, []);

  const bump = useCallback((id, delta) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + delta) }));
  }, []);

  const remove = useCallback((id) => {
    setQty((q) => ({ ...q, [id]: 0 }));
  }, []);

  // Used for entry-point presets (quiz/wellness/first arrival): only takes
  // effect if the cart is currently empty, so it never clobbers or piles on
  // top of an in-progress cart.
  const setIfEmpty = useCallback((preset) => {
    setQty((q) => (Object.values(q).some((n) => n > 0) ? q : { ...preset }));
  }, []);

  const clear = useCallback(() => setQty({}), []);

  const value = { qty, add, bump, remove, setIfEmpty, clear };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
