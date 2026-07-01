import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { getSymptoms, getSymptomAnalytes, getComparisonMatrix, getProducts } from "./supabase";
import CartButton from "./CartButton.jsx";

/*
  PENDING Dr. Coyer's review: the symptom → analyte mappings (symptom_analytes
  table) are placeholder data, and the result-page wording below has not been
  clinically reviewed. Keep all copy in "these observations suggest testing
  for X" language — never diagnostic ("you have X") — until that review lands.
*/

const NAVY = "#15428b";
const CYAN = "#2ba6e0";
const fmt = (n) => `$${n.toFixed(2)}`;

const CATEGORY_ORDER = ["appearance", "taste", "health"];
const CATEGORY_LABELS = {
  appearance: "Stains / Appearance",
  taste: "Taste",
  health: "Health",
};

export default function Quiz() {
  const navigate = useNavigate();

  const [symptoms, setSymptoms] = useState([]);
  const [symptomAnalytes, setSymptomAnalytes] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checked, setChecked] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [needsSelection, setNeedsSelection] = useState(false);

  useEffect(() => {
    Promise.all([getSymptoms(), getSymptomAnalytes(), getComparisonMatrix(), getProducts()]).then(
      ([sRes, saRes, mRes, pRes]) => {
        const err = sRes.error || saRes.error || mRes.error || pRes.error;
        if (err) {
          setError("Could not load the quiz. Please refresh or try again later.");
        } else {
          setSymptoms(sRes.data);
          setSymptomAnalytes(saRes.data);
          setMatrix(mRes.data);
          setProducts(pRes.data);
        }
        setLoading(false);
      }
    );
  }, []);

  const grouped = useMemo(() => {
    const byCat = {};
    for (const s of symptoms) (byCat[s.category] ||= []).push(s);
    for (const cat in byCat) byCat[cat].sort((a, b) => a.sort_order - b.sort_order);
    return byCat;
  }, [symptoms]);

  const toggle = (id) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const reset = () => {
    setChecked({});
    setShowResults(false);
    setNeedsSelection(false);
  };

  const checkedSymptoms = useMemo(() => symptoms.filter((s) => checked[s.id]), [symptoms, checked]);

  const priceBySlug = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.price])), [products]);
  const blurbBySlug = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.blurb])), [products]);
  const analyteNameById = useMemo(
    () => (matrix ? Object.fromEntries(matrix.analytes.map((a) => [a.id, a.name])) : {}),
    [matrix]
  );

  const result = useMemo(() => {
    if (!showResults || !matrix || checkedSymptoms.length === 0) return null;

    const checkedIds = new Set(checkedSymptoms.map((s) => s.id));
    const neededAnalyteIds = new Set(
      symptomAnalytes.filter((sa) => checkedIds.has(sa.symptom_id)).map((sa) => sa.analyte_id)
    );

    const enriched = matrix.products
      .map((p) => ({ ...p, price: priceBySlug[p.slug], blurb: blurbBySlug[p.slug] }))
      .filter((p) => p.price != null);
    if (enriched.length === 0) return null;

    const coverageCount = (p) => [...neededAnalyteIds].filter((id) => p.analyteIds.has(id)).length;

    const fullyCovering = enriched.filter((p) => coverageCount(p) === neededAnalyteIds.size);

    let primary;
    let fullCoverage;
    if (fullyCovering.length > 0) {
      primary = fullyCovering.reduce((min, p) => (p.price < min.price ? p : min), fullyCovering[0]);
      fullCoverage = true;
    } else {
      // No single package covers every suggested analyte — fall back to
      // whichever covers the most (ties broken by the most comprehensive package).
      primary = enriched.reduce((best, p) => {
        const bestCov = coverageCount(best);
        const pCov = coverageCount(p);
        if (pCov !== bestCov) return pCov > bestCov ? p : best;
        return p.analyteIds.size > best.analyteIds.size ? p : best;
      }, enriched[0]);
      fullCoverage = false;
    }

    const others = enriched.filter((p) => p.id !== primary.id).sort((a, b) => a.price - b.price);

    return { neededAnalyteIds, primary, fullCoverage, coveredCount: coverageCount(primary), others };
  }, [showResults, matrix, checkedSymptoms, symptomAnalytes, priceBySlug, blurbBySlug]);

  const handleShowResults = () => {
    if (checkedSymptoms.length === 0) {
      setNeedsSelection(true);
      setShowResults(false);
      return;
    }
    setNeedsSelection(false);
    setShowResults(true);
  };

  const goOrder = (slug) => navigate(`/order?preload=${slug}`);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-9 h-9 rounded-full text-white" style={{ background: CYAN }}>
              <FlaskConical size={18} />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.22em] font-semibold" style={{ color: NAVY }}>PRINCETON ANALYTICAL LABS</div>
              <h1 className="text-3xl font-bold leading-tight" style={{ color: NAVY }}>Water Quiz</h1>
            </div>
          </div>
          <CartButton />
        </div>
        <p className="text-sm text-slate-500 mb-6 ml-12 max-w-xl">
          Select your water issue symptoms to determine the proper test kit.
        </p>

        {loading && <p className="text-sm text-slate-400 py-8 text-center">Loading quiz…</p>}
        {error && <p className="text-sm text-rose-500 py-8 text-center">{error}</p>}

        {!loading && !error && (
          <>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="p-5 space-y-6">
                {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
                      {CATEGORY_LABELS[cat]}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {grouped[cat].map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 border border-slate-200 rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!checked[s.id]}
                            onChange={() => toggle(s.id)}
                            className="accent-sky-500 w-4 h-4 shrink-0"
                          />
                          <span className="text-sm text-slate-700">{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleShowResults}
                  className="rounded-lg text-white px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: CYAN }}
                >
                  Show Results
                </button>
                <button
                  onClick={reset}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
                {needsSelection && (
                  <span className="text-xs text-rose-500">Select at least one symptom to see results.</span>
                )}
              </div>
            </div>

            {result && (
              <ResultsPanel
                result={result}
                checkedSymptoms={checkedSymptoms}
                symptomAnalytes={symptomAnalytes}
                analyteNameById={analyteNameById}
                onOrder={goOrder}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ResultsPanel({ result, checkedSymptoms, symptomAnalytes, analyteNameById, onOrder }) {
  const { primary, others, fullCoverage, neededAnalyteIds, coveredCount } = result;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-1" style={{ color: NAVY }}>Recommended Tests</h2>
        <p className="text-xs text-slate-500 max-w-xl">
          These results suggest which water tests may be appropriate based on the symptoms you
          selected. They are not a diagnosis of your water quality — only a lab test can confirm
          actual contaminant levels.
        </p>
      </div>

      <div className="bg-white border-2 rounded-xl p-5" style={{ borderColor: CYAN }}>
        <div className="text-[11px] font-semibold tracking-wider uppercase mb-1" style={{ color: CYAN }}>
          {fullCoverage ? "Best Match" : "Most Complete Match"}
        </div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-[200px]">
            <h3 className="text-xl font-bold" style={{ color: NAVY }}>{primary.name}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">{primary.blurb}</p>
            {!fullCoverage && (
              <p className="text-xs text-amber-600 mt-2">
                Suggests testing covers {coveredCount} of {neededAnalyteIds.size} indicated areas —
                the most complete package available.
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{fmt(primary.price)}</div>
            <button
              onClick={() => onOrder(primary.slug)}
              className="mt-2 rounded-lg text-white px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: CYAN }}
            >
              Order
            </button>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Other Packages</div>
          <div className="space-y-2">
            {others.map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">{p.blurb}</div>
                </div>
                <div className="font-bold tabular-nums text-sm" style={{ color: NAVY }}>{fmt(p.price)}</div>
                <button
                  onClick={() => onOrder(p.slug)}
                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-md"
                  style={{ background: CYAN }}
                >
                  Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-3">
          What you told us → what to test for
        </div>
        <div className="space-y-2">
          {checkedSymptoms.map((s) => {
            const analyteNames = symptomAnalytes
              .filter((sa) => sa.symptom_id === s.id)
              .map((sa) => analyteNameById[sa.analyte_id])
              .filter(Boolean);
            return (
              <div key={s.id} className="flex items-start gap-2 text-sm flex-wrap">
                <span className="text-slate-700">{s.label}</span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-500">{analyteNames.length ? analyteNames.join(", ") : "General panel review"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
