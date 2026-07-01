import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import TempNav from "./TempNav.jsx";
import Shop from "./Shop.jsx";
import Quiz from "./Quiz.jsx";
import Wellness from "./Wellness.jsx";
import OrderRequestFlow from "./OrderRequestFlow.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <TempNav />
        <Routes>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/order" element={<OrderRequestFlow />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
