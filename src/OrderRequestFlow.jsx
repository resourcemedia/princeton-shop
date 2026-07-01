import React, { useState, useMemo, useEffect } from "react";
import { Plus, Minus, Trash2, Check, ChevronLeft, ChevronRight, FlaskConical, Truck, PackageCheck, MapPin } from "lucide-react";
import { getProducts, submitOrder } from "./supabase";

/*
  Princeton Analytical Labs — Order Request flow (pseudo-cart, no payment)
  Four steps: Kits → Delivery → Your Details → Summary → confirmation.

  NOTES FOR BUILD:
  - Delivery prices are PLACEHOLDERS, flagged in the UI. Courier model
    (local sample pickup, zip-priced) pending client clarification.
  - The "Arriving from" control simulates entry-point filtering. In production
    this comes from a URL param (e.g. /order?from=quiz) — the flow is identical,
    only the starting catalog/cart changes.
  - On submit, the `payload` object is what a form service / serverless
    function would email to the lab. No payment is processed anywhere.
*/

const NAVY = "#15428b";
const CYAN = "#2ba6e0";

// CATALOG is now fetched from Supabase — see products state below.

// Entry-point presets: which products show, and what's pre-loaded.
// Packages-only for now. Realtor/FHA path is parked — it relied on individual
// tests (Coliform/Nitrate/Lead); restore it when those return.
const ENTRY = {
  shop:     { label: "Shop (all)", show: null,                         preload: {} },
  quiz:     { label: "Water Quiz", show: null,                         preload: { ww2: 1 } },
  wellness: { label: "Wellness",   show: ["ww1", "ww2", "ww3", "ww4"], preload: {} },
};

const DELIVERY = [
  { id: "courier",  label: "Courier — local sample pickup", price: 45, needsZip: true,  icon: MapPin,       note: "Zip-based pricing (placeholder)" },
  { id: "ground",   label: "Ground Shipping",               price: 15, needsZip: false, icon: Truck,        note: "Flat (placeholder)" },
  { id: "overnight",label: "Overnight Shipping",            price: 40, needsZip: false, icon: PackageCheck, note: "Flat (placeholder)" },
];

const fmt = (n) => `$${n.toFixed(2)}`;
const STEPS = ["Water Test Kits", "Delivery", "Your Details", "Order Summary"];

export default function OrderRequestFlow() {
  const [entry, setEntry] = useState("shop");
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState({});
  const [delivery, setDelivery] = useState("courier");
  const [zip, setZip] = useState("");
  const [info, setInfo] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);

  useEffect(() => {
    getProducts().then(({ data, error }) => {
      if (error) {
        setCatalogError("Could not load products. Please refresh or try again later.");
      } else {
        setCatalog(data);
      }
      setCatalogLoading(false);
    });
  }, []);

  // Reset cart to the entry-point preset whenever the simulated source changes.
  useEffect(() => {
    setQty({ ...ENTRY[entry].preload });
    setStep(1);
    setSubmitted(false);
    setSubmitting(false);
    setSubmitError(null);
  }, [entry]);

  const visible = useMemo(() => {
    const show = ENTRY[entry].show;
    return show ? catalog.filter((p) => show.includes(p.id)) : catalog;
  }, [entry, catalog]);

  const lines = useMemo(
    () => catalog.filter((p) => qty[p.id] > 0).map((p) => ({ ...p, count: qty[p.id], subtotal: p.price * qty[p.id] })),
    [qty, catalog]
  );
  const kitsTotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const itemCount = lines.reduce((s, l) => s + l.count, 0);
  const deliveryObj = DELIVERY.find((d) => d.id === delivery);
  const deliveryFee = deliveryObj ? deliveryObj.price : 0;
  const grandTotal = kitsTotal + deliveryFee;

  const bump = (id, d) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + d) }));
  const addOne = (id) => setQty((q) => ({ ...q, [id]: (q[id] || 0) + 1 })); // arrives at 1
  const validDetails = info.name.trim() && /\S+@\S+\.\S+/.test(info.email);
  const courierZipOk = delivery !== "courier" || /^\d{5}$/.test(zip);

  const canNext = (() => {
    if (step === 1) return lines.length > 0;
    if (step === 2) return courierZipOk;
    if (step === 3) return validDetails;
    return true;
  })();

  const payload = {
    source: entry,
    customer: info,
    items: lines.map((l) => ({ name: l.name, qty: l.count, unit: l.price, subtotal: l.subtotal })),
    delivery: { method: deliveryObj?.label, zip: delivery === "courier" ? zip : null, fee: deliveryFee },
    estimatedTotal: grandTotal,
    submittedAt: new Date().toISOString(),
  };

  const handleSendOrder = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const { data, error } = await submitOrder(payload);
    if (error || !data?.ok) {
      setSubmitError("Something went wrong sending your request — please try again.");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
  };

  const groups = useMemo(
    () => [...new Set(catalog.map((p) => p.group))],
    [catalog]
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }} className="min-h-screen bg-slate-50 text-slate-800">
      {/* Demo control — not part of the real page */}
      <div className="bg-slate-900 text-slate-300 text-xs">
        <div className="max-w-3xl mx-auto px-5 py-2 flex flex-wrap items-center gap-2">
          <span className="text-slate-500">Demo · arriving from:</span>
          {Object.entries(ENTRY).map(([k, v]) => (
            <button key={k} onClick={() => setEntry(k)}
              className={`px-2.5 py-1 rounded-full transition-colors ${entry === k ? "bg-sky-500 text-white" : "hover:bg-slate-800"}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-1">
          <div className="grid place-items-center w-9 h-9 rounded-full text-white" style={{ background: CYAN }}>
            <FlaskConical size={18} />
          </div>
          <div>
            <div className="text-[11px] tracking-[0.22em] font-semibold" style={{ color: NAVY }}>PRINCETON ANALYTICAL LABS</div>
            <h1 className="text-3xl font-bold leading-tight" style={{ color: NAVY }}>Order Request</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-6 ml-12 max-w-xl">
          Submit your order request below — no payment is required now. We'll review your order, follow up with any questions, and process payment with you before anything is charged.
        </p>

        {/* Stepper */}
        <div className="flex items-center mb-6">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < step || submitted;
            const active = n === step && !submitted;
            return (
              <React.Fragment key={label}>
                <button
                  onClick={() => !submitted && n < step && setStep(n)}
                  className="flex items-center gap-2 group"
                  disabled={submitted || n >= step}
                >
                  <span
                    className="grid place-items-center w-7 h-7 rounded-full text-sm font-semibold transition-colors"
                    style={{
                      background: done ? CYAN : active ? NAVY : "#e2e8f0",
                      color: done || active ? "#fff" : "#64748b",
                    }}
                  >
                    {done ? <Check size={15} /> : n}
                  </span>
                  <span className={`text-sm hidden sm:inline ${active ? "font-semibold text-slate-900" : "text-slate-400"}`}>{label}</span>
                </button>
                {n < STEPS.length && <div className="flex-1 h-px bg-slate-200 mx-2" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ===== Confirmation ===== */}
        {submitted ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <div className="grid place-items-center w-12 h-12 rounded-full mx-auto mb-3" style={{ background: "#dcfce7" }}>
              <Check size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: NAVY }}>Thanks for your order!</h2>
            <p className="text-slate-600 max-w-md mx-auto">
              An expert from Princeton Analytical Labs will follow up within one business day to confirm your order and process payment.
            </p>
            <button onClick={() => { setEntry(entry); }} className="mt-5 text-sm font-medium" style={{ color: CYAN }}>
              ← Start over
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* ===== Step 1: Kits ===== */}
            {step === 1 && (
              <Section n={1} title="Water Test Kits">
                {catalogLoading && (
                  <p className="text-sm text-slate-400 py-4 text-center">Loading products…</p>
                )}
                {catalogError && (
                  <p className="text-sm text-rose-500 py-4 text-center">{catalogError}</p>
                )}
                {!catalogLoading && !catalogError && groups.map((g) => {
                  const items = visible.filter((p) => p.group === g);
                  if (!items.length) return null;
                  return (
                    <div key={g} className="mb-4 last:mb-0">
                      {groups.length > 1 && <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">{g}</div>}
                      <div className="space-y-2">
                        {items.map((p) => {
                          const c = qty[p.id] || 0;
                          return (
                            <div key={p.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                                <div className="text-xs text-slate-500 truncate">{p.blurb}</div>
                              </div>
                              <div className="font-bold tabular-nums text-sm" style={{ color: NAVY }}>{fmt(p.price)}</div>
                              {c > 0 ? (
                                <div className="flex items-center gap-1">
                                  <IconBtn onClick={() => bump(p.id, -1)} aria={`Remove one ${p.name}`}><Minus size={14} /></IconBtn>
                                  <span className="w-6 text-center font-semibold tabular-nums text-sm">{c}</span>
                                  <IconBtn onClick={() => bump(p.id, 1)} aria={`Add one ${p.name}`} solid><Plus size={14} /></IconBtn>
                                </div>
                              ) : (
                                <button onClick={() => addOne(p.id)}
                                  className="text-xs font-semibold text-white px-3 py-1.5 rounded-md" style={{ background: CYAN }}>
                                  Add
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <Nav
                  leftLabel="Continue Shopping" leftIcon={ChevronLeft}
                  onLeft={() => {}} canNext={canNext} onNext={() => setStep(2)}
                  hint={lines.length === 0 ? "Add at least one test to continue" : `${itemCount} item${itemCount !== 1 ? "s" : ""} · ${fmt(kitsTotal)}`}
                />
              </Section>
            )}

            {/* ===== Step 2: Delivery ===== */}
            {step === 2 && (
              <Section n={2} title="Delivery">
                <div className="mb-3 text-xs rounded-md px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200">
                  Delivery options &amp; pricing are placeholders pending courier details from the lab.
                </div>
                <div className="space-y-2">
                  {DELIVERY.map((d) => {
                    const Icon = d.icon;
                    const sel = delivery === d.id;
                    return (
                      <label key={d.id}
                        className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${sel ? "border-sky-400 bg-sky-50/50" : "border-slate-200"}`}>
                        <input type="radio" name="delivery" checked={sel} onChange={() => setDelivery(d.id)} className="accent-sky-500" />
                        <Icon size={18} className="text-slate-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">{d.label}</div>
                          <div className="text-[11px] text-slate-400">{d.note}</div>
                        </div>
                        {d.needsZip && sel && (
                          <input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                            placeholder="Enter zip"
                            className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                        )}
                        <div className="font-semibold tabular-nums text-sm w-16 text-right" style={{ color: NAVY }}>
                          {d.needsZip && (!sel || !/^\d{5}$/.test(zip)) ? "—" : fmt(d.price)}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {!courierZipOk && <p className="text-xs text-rose-500 mt-2">Enter a 5-digit zip for courier pickup.</p>}
                <Nav
                  leftLabel="Previous" leftIcon={ChevronLeft} onLeft={() => setStep(1)}
                  canNext={canNext} onNext={() => setStep(3)}
                />
              </Section>
            )}

            {/* ===== Step 3: Your Details ===== */}
            {step === 3 && (
              <Section n={3} title="Your Details">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { k: "name", label: "Full name", ph: "Jane Doe", req: true },
                    { k: "email", label: "Email", ph: "jane@example.com", req: true },
                    { k: "phone", label: "Phone", ph: "(570) 555-0123" },
                    { k: "address", label: "Shipping address", ph: "123 Main St, Wilkes-Barre, PA" },
                  ].map((f) => (
                    <label key={f.k} className="text-sm">
                      <span className="text-slate-600">{f.label}{f.req && <span style={{ color: CYAN }}> *</span>}</span>
                      <input value={info[f.k]} onChange={(e) => setInfo((i) => ({ ...i, [f.k]: e.target.value }))}
                        placeholder={f.ph}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                    </label>
                  ))}
                  <label className="text-sm sm:col-span-2">
                    <span className="text-slate-600">Notes for the lab</span>
                    <textarea value={info.notes} onChange={(e) => setInfo((i) => ({ ...i, notes: e.target.value }))}
                      placeholder="Anything we should know? (water source, concerns, timing)" rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </label>
                </div>
                {!validDetails && <p className="text-xs text-slate-400 mt-2">Name and a valid email are required.</p>}
                <Nav
                  leftLabel="Previous" leftIcon={ChevronLeft} onLeft={() => setStep(2)}
                  canNext={canNext} onNext={() => setStep(4)}
                />
              </Section>
            )}

            {/* ===== Step 4: Summary ===== */}
            {step === 4 && (
              <Section n={4} title="Order Summary">
                <div className="text-sm text-slate-600 leading-relaxed mb-4">
                  <div className="font-semibold text-slate-900">{info.name || "Firstname Lastname"}</div>
                  {info.address && <div>{info.address}</div>}
                  <div>{info.email}</div>
                  {info.phone && <div>{info.phone}</div>}
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">Your Order</div>
                  {lines.map((l) => (
                    <Row key={l.id} label={`${l.count}× ${l.name}`} value={fmt(l.subtotal)} onRemove={() => setQty((q) => ({ ...q, [l.id]: 0 }))} />
                  ))}
                  <Row label={deliveryObj?.label + (delivery === "courier" && zip ? ` (${zip})` : "")} value={fmt(deliveryFee)} muted />
                </div>
                <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">{itemCount} item{itemCount !== 1 ? "s" : ""} + delivery</span>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>{fmt(grandTotal)}</span>
                </div>
                {submitError && (
                  <p className="text-sm text-rose-500 mt-3 text-center">{submitError}</p>
                )}
                <button onClick={handleSendOrder} disabled={submitting}
                  className="mt-4 w-full rounded-lg text-white py-3 font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: CYAN }}>
                  {submitting ? "Sending…" : "Send Order Request"}
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">Estimate only. We'll confirm your order before processing payment.</p>
                <button onClick={() => setStep(3)} className="mt-3 text-sm text-slate-500 flex items-center gap-1 mx-auto">
                  <ChevronLeft size={14} /> Previous
                </button>
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */
function Section({ n, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100" style={{ background: "#f8fafc" }}>
        <span className="grid place-items-center w-6 h-6 rounded-full text-white text-xs font-bold" style={{ background: CYAN }}>{n}</span>
        <h2 className="font-bold" style={{ color: "#15428b" }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function IconBtn({ children, onClick, aria, solid }) {
  return (
    <button onClick={onClick} aria-label={aria}
      className={`w-7 h-7 grid place-items-center rounded-md ${solid ? "text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
      style={solid ? { background: "#2ba6e0" } : {}}>
      {children}
    </button>
  );
}
function Row({ label, value, onRemove, muted }) {
  return (
    <div className="flex items-center gap-2 text-sm py-1">
      <span className={`flex-1 ${muted ? "text-slate-500" : "text-slate-700"}`}>{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
      {onRemove && (
        <button onClick={onRemove} className="text-slate-300 hover:text-rose-500" aria-label={`Remove ${label}`}><Trash2 size={13} /></button>
      )}
    </div>
  );
}
function Nav({ leftLabel, leftIcon: LeftIcon, onLeft, canNext, onNext, hint }) {
  return (
    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
      <button onClick={onLeft} className="text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
        {LeftIcon && <LeftIcon size={15} />} {leftLabel}
      </button>
      {hint && <span className="text-xs text-slate-400 hidden sm:block flex-1 text-center">{hint}</span>}
      <button onClick={onNext} disabled={!canNext}
        className="text-sm font-semibold flex items-center gap-1 px-5 py-2 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "#15428b" }}>
        Next <ChevronRight size={15} />
      </button>
    </div>
  );
}
