import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Shop from "./Shop.jsx";
import OrderRequestFlow from "./OrderRequestFlow.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/order" element={<OrderRequestFlow />} />
      </Routes>
    </BrowserRouter>
  );
}
