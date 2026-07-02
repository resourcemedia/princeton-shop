import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Check, ImageOff } from "lucide-react";
import { getProducts, getComparisonMatrix } from "./supabase";

const NAVY = "#15428b";
const CYAN = "#2ba6e0";

const fmt = (n) => `$${n.toFixed(2)}`;

const VIEWS = [
  { id: "product", label: "By Product" },
  { id: "chart", label: "Comparison Chart" },
];

export default function Shop() {
  const navigate = useNavigate();
  const [view, setView] = useState("product");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [matrix, setMatrix] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixError, setMatrixError] = useState(null);

  useEffect(() => {
    getProducts().then(({ data, error }) => {
      if (error) setProductsError("Could not load products. Please refresh or try again later.");
      else setProducts(data);
      setProductsLoading(false);
    });
    getComparisonMatrix().then(({ data, error }) => {
      if (error) setMatrixError("Could not load the comparison chart. Please refresh or try again later.");
      else setMatrix(data);
      setMatrixLoading(false);
    });
  }, []);

  const priceBySlug = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.price])),
    [products]
  );

  const goOrder = (slug) => navigate(`/order?preload=${slug}`);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-1">
          <div className="grid place-items-center w-9 h-9 rounded-full text-white" style={{ background: CYAN }}>
            <FlaskConical size={18} />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] font-semibold" style={{ color: NAVY }}>PRINCETON ANALYTICAL LABS</div>
            <h1 className="text-3xl font-bold leading-tight" style={{ color: NAVY }}>Shop | Water Test Kits</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 ml-12 max-w-xl">Well Water Evaluation Panel Packages</p>

        {/* Toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 mb-6">
          {VIEWS.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
              style={view === t.id ? { background: NAVY, color: "#fff" } : { color: "#64748b" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {view === "product" ? (
          <ProductGrid loading={productsLoading} error={productsError} products={products} onOrder={goOrder} />
        ) : (
          <ComparisonChart
            loading={matrixLoading}
            error={matrixError}
            matrix={matrix}
            priceBySlug={priceBySlug}
            onOrder={goOrder}
          />
        )}
      </div>
    </div>
  );
}

function ProductGrid({ loading, error, products, onOrder }) {
  if (loading) return <p className="text-sm text-slate-400 py-8 text-center">Loading products…</p>;
  if (error) return <p className="text-sm text-rose-500 py-8 text-center">{error}</p>;
  if (!products.length) return <p className="text-sm text-slate-400 py-8 text-center">No products available right now.</p>;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {products.map((p) => (
        <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-full aspect-square object-contain bg-white" />
          ) : (
            <div className="w-full aspect-square grid place-items-center bg-slate-50 text-slate-300">
              <ImageOff size={28} />
            </div>
          )}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-slate-900">{p.name}</h3>
              <span className="font-bold tabular-nums whitespace-nowrap" style={{ color: NAVY }}>{fmt(p.price)}</span>
            </div>
            <p className="text-sm text-slate-500 flex-1">{p.blurb}</p>
            <button
              onClick={() => onOrder(p.id)}
              className="mt-4 w-full rounded-lg text-white py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: CYAN }}
            >
              Order
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonChart({ loading, error, matrix, priceBySlug, onOrder }) {
  if (loading) return <p className="text-sm text-slate-400 py-8 text-center">Loading comparison chart…</p>;
  if (error) return <p className="text-sm text-rose-500 py-8 text-center">{error}</p>;
  if (!matrix || !matrix.products.length) return <p className="text-sm text-slate-400 py-8 text-center">No products available right now.</p>;

  const { products, analytes } = matrix;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr>
            <th className="text-left p-3 border-b border-slate-100 text-slate-500 font-semibold">Analyte</th>
            {products.map((p) => (
              <th key={p.id} className="p-3 border-b border-slate-100 text-center font-bold" style={{ color: NAVY }}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {analytes.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 last:border-0">
              <td className="p-3 text-slate-700">{a.name}</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center">
                  {p.analyteIds.has(a.id) && <Check size={16} className="inline text-emerald-600" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="p-3 font-semibold text-slate-500">Price</td>
            {products.map((p) => (
              <td key={p.id} className="p-3 text-center font-bold tabular-nums" style={{ color: NAVY }}>
                {priceBySlug[p.slug] != null ? fmt(priceBySlug[p.slug]) : "—"}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3" />
            {products.map((p) => (
              <td key={p.id} className="p-3 text-center">
                <button
                  onClick={() => onOrder(p.slug)}
                  className="rounded-lg text-white px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{ background: CYAN }}
                >
                  Order
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
