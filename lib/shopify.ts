export type ShopifyOrder = {
  id: number
  order_number: number
  current_total_price?: string
  total_price?: string
  contact_email?: string
  phone?: string
  customer?: { email?: string, phone?: string, first_name?: string, last_name?: string }
  shipping_address?: {
    name?: string
    first_name?: string
    last_name?: string
    address1?: string
    address2?: string
    phone?: string
    city?: string
    province?: string
    province_code?: string
    zip?: string
  }
}

const clean = (d:string)=> d.replace(/^https?:\/\//i,'').replace(/\/+$/,'').trim()

export async function fetchPaidUnfulfilled({ domain, token, limit = 250 }:{ domain:string, token:string, limit?:number }){
  const orders: ShopifyOrder[] = []
  let pageInfo: string | undefined
  const d = clean(domain)
  while(true){
    const url = new URL(`https://${d}/admin/api/2025-01/orders.json`)
    if (pageInfo) url.searchParams.set('page_info', pageInfo)
    url.searchParams.set('status','any')
    url.searchParams.set('financial_status','paid')
    url.searchParams.set('fulfillment_status','unfulfilled')
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('fields',[
      'id','order_number','current_total_price','total_price','contact_email','phone','customer','shipping_address'
    ].join(','))
    const resp = await fetch(url.toString(), { headers: { 'X-Shopify-Access-Token': token, 'Content-Type':'application/json' }, cache:'no-store' })
    if (!resp.ok) throw new Error(`Shopify ${resp.status}: ${await resp.text()}`)
    const data = await resp.json()
    orders.push(...(data.orders || []))
    const link = resp.headers.get('link') || ''
    const m = link.match(/<([^>]+)>; rel="next"/i)
    if (!m) break
    const nextUrl = new URL(m[1])
    pageInfo = nextUrl.searchParams.get('page_info') ?? undefined
    if (!pageInfo) break
  }
  return orders
}
