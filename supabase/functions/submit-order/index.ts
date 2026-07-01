import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderItemsTable(items: Array<{ name: string; qty: number; unit?: string; subtotal: number }>) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.qty)} × ${escapeHtml(item.name)}${item.unit ? ` (${escapeHtml(item.unit)})` : ""}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">$${Number(item.subtotal).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `
    <table style="border-collapse:collapse;width:100%;max-width:480px;">
      ${rows}
    </table>`;
}

function renderEmailHtml(order: {
  source: string;
  customer: { name: string; email: string; phone?: string; address?: string; notes?: string };
  items: Array<{ name: string; qty: number; unit?: string; subtotal: number }>;
  delivery: { method?: string; zip?: string; fee?: number };
  estimatedTotal: number;
  submittedAt: string;
}) {
  const { customer, items, delivery, estimatedTotal, source, submittedAt } = order;

  return `
    <div style="font-family: 'Inter', system-ui, sans-serif; color:#1e293b;">
      <h2 style="color:#15428b;">New Order Request</h2>
      <p style="color:#64748b;">Source: ${escapeHtml(source)} &middot; Submitted: ${escapeHtml(submittedAt)}</p>

      <h3 style="margin-bottom:4px;">Customer</h3>
      <p style="margin-top:0;">
        ${escapeHtml(customer.name)}<br/>
        ${escapeHtml(customer.email)}<br/>
        ${customer.phone ? `${escapeHtml(customer.phone)}<br/>` : ""}
        ${customer.address ? `${escapeHtml(customer.address)}<br/>` : ""}
      </p>
      ${customer.notes ? `<p><strong>Notes:</strong> ${escapeHtml(customer.notes)}</p>` : ""}

      <h3 style="margin-bottom:4px;">Items</h3>
      ${renderItemsTable(items)}

      <p><strong>Delivery:</strong> ${escapeHtml(delivery?.method ?? "n/a")}${delivery?.zip ? ` (ZIP ${escapeHtml(delivery.zip)})` : ""}${delivery?.fee ? ` — $${Number(delivery.fee).toFixed(2)} fee` : ""}</p>

      <p style="font-size:16px;"><strong>Estimated Total: $${Number(estimatedTotal).toFixed(2)}</strong></p>
    </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const { source, customer, items, delivery, estimatedTotal, submittedAt } = body ?? {};

    if (!customer?.name || typeof customer.name !== "string") {
      return jsonResponse({ ok: false, error: "customer.name is required" }, 400);
    }
    if (!customer?.email || !EMAIL_RE.test(customer.email)) {
      return jsonResponse({ ok: false, error: "A valid customer.email is required" }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse({ ok: false, error: "At least one item is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: insertedOrder, error: insertError } = await supabase
      .from("orders")
      .insert({
        source,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone ?? null,
        customer_address: customer.address ?? null,
        notes: customer.notes ?? null,
        items,
        delivery_method: delivery?.method ?? null,
        delivery_zip: delivery?.zip ?? null,
        delivery_fee: delivery?.fee ?? null,
        estimated_total: estimatedTotal ?? null,
      })
      .select("id")
      .single();

    if (insertError) {
      return jsonResponse({ ok: false, error: insertError.message }, 400);
    }

    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Princeton Analytical Labs <orders@princetonanalytical.com>",
          to: Deno.env.get("ORDER_NOTIFY_EMAIL"),
          reply_to: customer.email,
          subject: `New order request — ${customer.name} ($${Number(estimatedTotal).toFixed(2)})`,
          html: renderEmailHtml({ source, customer, items, delivery, estimatedTotal, submittedAt }),
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return jsonResponse({ ok: true, emailed: false, id: insertedOrder.id, error: errText });
      }

      return jsonResponse({ ok: true, emailed: true, id: insertedOrder.id });
    } catch (emailErr) {
      return jsonResponse({
        ok: true,
        emailed: false,
        id: insertedOrder.id,
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500
    );
  }
});
