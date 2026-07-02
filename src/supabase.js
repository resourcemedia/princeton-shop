// src/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, price, blurb, kind, image_url')
    .eq('active', true)
    .order('sort_order')

  if (error) return { data: null, error }

  return {
    data: data.map((row) => ({
      id: row.slug,
      name: row.name,
      price: Number(row.price),
      blurb: row.blurb,
      group: row.kind === 'package' ? 'Packages' : 'Individual Tests',
      image_url: row.image_url,
    })),
    error: null,
  }
}

export async function getComparisonMatrix() {
  const [productsRes, analytesRes, linkRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, name, kind')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('analytes')
      .select('id, slug, name, sort_order')
      .order('sort_order'),
    supabase
      .from('product_analytes')
      .select('product_id, analyte_id'),
  ])

  const err = productsRes.error || analytesRes.error || linkRes.error
  if (err) return { data: null, error: err }

  const links = linkRes.data
  const products = productsRes.data.map((p) => ({
    ...p,
    analyteIds: new Set(
      links.filter((l) => l.product_id === p.id).map((l) => l.analyte_id)
    ),
  }))

  return { data: { products, analytes: analytesRes.data }, error: null }
}

export async function getSymptoms() {
  const { data, error } = await supabase
    .from('symptoms')
    .select('id, slug, label, category, sort_order')
    .eq('active', true)
    .order('category')
    .order('sort_order')

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function getSymptomAnalytes() {
  const { data, error } = await supabase
    .from('symptom_analytes')
    .select('symptom_id, analyte_id')

  if (error) return { data: null, error }
  return { data, error: null }
}

export async function getDeliveryOptions() {
  const { data, error } = await supabase
    .from('delivery_options')
    .select('id, slug, name, kind, flat_price, needs_zip')
    .eq('active', true)
    .order('sort_order')

  if (error) return { data: null, error }

  return {
    data: data.map((row) => ({
      ...row,
      flat_price: Number(row.flat_price),
    })),
    error: null,
  }
}

export async function getSamplingFees() {
  const { data, error } = await supabase
    .from('sampling_fees')
    .select('id, label, max_miles, price, sort_order')
    .order('sort_order')

  if (error) return { data: null, error }

  return {
    data: data.map((row) => ({
      ...row,
      price: Number(row.price),
    })),
    error: null,
  }
}

// TODO: depends on the 'submit-order' Edge Function being deployed to Supabase.
export async function submitOrder(order) {
  const { data, error } = await supabase.functions.invoke('submit-order', {
    body: order,
  })

  if (error) {
    const isNotDeployed =
      error.message?.includes('FunctionNotFound') ||
      error.context?.status === 404
    if (isNotDeployed) {
      return { data: null, error: { message: 'Order submission is not yet available — the edge function has not been deployed.' } }
    }
    return { data: null, error }
  }

  return { data, error: null }
}
