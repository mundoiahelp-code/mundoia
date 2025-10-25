import { NextResponse } from 'next/server'
import { fetchPaidUnfulfilled } from '../../../lib/shopify'
export const runtime='nodejs'; export const dynamic='force-dynamic'

export async function GET(){
  const domain=process.env.SHOPIFY_DOMAIN||''
  const token=process.env.SHOPIFY_TOKEN||''
  if(!domain||!token) return new NextResponse('Faltan SHOPIFY_DOMAIN y/o SHOPIFY_TOKEN',{status:400})
  const orders=await fetchPaidUnfulfilled({domain,token,limit:5})
  return NextResponse.json({ok:true,count:orders.length,message:orders.length?'Conexión OK':'Conexión OK — sin pedidos'})
}
