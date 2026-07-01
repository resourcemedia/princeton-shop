import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext.jsx";

const NAVY = "#15428b";
const CYAN = "#2ba6e0";

export default function CartButton() {
  const navigate = useNavigate();
  const { qty } = useCart();
  const count = Object.values(qty).reduce((s, n) => s + n, 0);

  return (
    <button
      onClick={() => navigate("/order")}
      aria-label={`View cart${count > 0 ? ` (${count} item${count !== 1 ? "s" : ""})` : ""}`}
      className="relative grid place-items-center w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shrink-0"
    >
      <ShoppingCart size={18} style={{ color: NAVY }} />
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full grid place-items-center text-[10px] font-bold text-white leading-none"
          style={{ background: CYAN }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
