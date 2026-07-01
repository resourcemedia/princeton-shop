import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FlaskConical, ShieldCheck } from "lucide-react";
import { getProducts } from "./supabase";

const NAVY = "#15428b";
const CYAN = "#2ba6e0";
const fmt = (n) => `$${n.toFixed(2)}`;

export default function Wellness() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts().then(({ data, error }) => {
      if (error) setError("Could not load packages. Please refresh or try again later.");
      else setProducts(data.filter((p) => p.group === "Packages"));
      setLoading(false);
    });
  }, []);

  // Additive add (same as /shop), tagged with from=wellness so the order
  // flow records source: 'wellness' on submission.
  const goOrder = (slug) => navigate(`/order?preload=${slug}&from=wellness`);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-1">
          <div className="grid place-items-center w-9 h-9 rounded-full text-white" style={{ background: CYAN }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] font-semibold" style={{ color: NAVY }}>PRINCETON ANALYTICAL LABS</div>
            <h1 className="text-3xl font-bold leading-tight" style={{ color: NAVY }}>Water Wellness</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 ml-12 max-w-xl">Ensure your water is safe.</p>

        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <p className="text-sm text-slate-600 leading-relaxed">
            Just because your water looks clear doesn't always mean it's safe, and conditions
            can change over time. Routine testing gives you peace of mind. Choose a Well Water
            evaluation panel below, or contact us about our ongoing Water Wellness Program.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-400 py-8 text-center">Loading packages…</p>}
        {error && <p className="text-sm text-rose-500 py-8 text-center">{error}</p>}

        {!loading && !error && (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                <div className="grid place-items-center w-10 h-10 rounded-full shrink-0" style={{ background: "#eff6ff" }}>
                  <FlaskConical size={16} style={{ color: CYAN }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.blurb}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums mb-1" style={{ color: NAVY }}>{fmt(p.price)}</div>
                  <button
                    onClick={() => goOrder(p.id)}
                    className="rounded-lg text-white px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: CYAN }}
                  >
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/shop" className="text-sm font-medium" style={{ color: CYAN }}>
            Compare packages in detail →
          </Link>
        </div>
      </div>
    </div>
  );
}
