import React from "react";
import { NavLink } from "react-router-dom";
import CartButton from "./CartButton.jsx";

const NAVY = "#15428b";

// TEMPORARY nav for sharing test links while the app is in progress — this
// is not the princetonanalytical.com site chrome (Home / Our Lab / Services /
// FAQ etc.), just quick links between this order app's own pages. Remove once
// the app is embedded in / linked from the real site.
const LINKS = [
  { to: "/shop", label: "Shop" },
  { to: "/quiz", label: "Water Quiz" },
  { to: "/wellness", label: "Wellness" },
];

export default function TempNav() {
  return (
    <div
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      className="bg-white border-b-2 border-dashed border-slate-300"
    >
      <div className="max-w-5xl mx-auto px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 border border-slate-300 rounded px-2 py-0.5 shrink-0">
          Order App — Preview
        </span>

        <nav className="flex flex-wrap items-center gap-1 flex-1 min-w-[200px]">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`
              }
              style={({ isActive }) => (isActive ? { background: NAVY } : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <CartButton />
      </div>
    </div>
  );
}
