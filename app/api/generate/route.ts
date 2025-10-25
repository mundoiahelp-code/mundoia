import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchPaidUnfulfilled } from '../../../lib/shopify'
import { fillAndreaniFromOrders } from '../../../lib/andreani'
export const runtime='nodejs'; export const dynamic='force-dynamic'

export async function POST(){
  const domain=process.env.SHOPIFY_DOMAIN||''
  const token=process.env.SHOPIFY_TOKEN||''
  if(!domain||!token) return new NextResponse('Faltan SHOPIFY_DOMAIN y/o SHOPIFY_TOKEN',{status:400})

  const orders=await fetchPaidUnfulfilled({domain,token})
  if(!orders.length) return new NextResponse('No hay pedidos pagados y no cumplidos para exportar.',{status:400})

  const tpl=path.join(process.cwd(),'public','andreani.xlsx')
  if(!fs.existsSync(tpl)) return new NextResponse('Falta la plantilla: /public/andreani.xlsx',{status:400})
  const buffer=fs.readFileSync(tpl)
  const out=await fillAndreaniFromOrders(buffer,orders,{
    dni: process.env.DEFAULT_DNI||'11111111',
    peso_gr: Number(process.env.DEFAULT_PESO_GR||1000),
    alto_cm: Number(process.env.DEFAULT_ALTO_CM||1),
    ancho_cm: Number(process.env.DEFAULT_ANCHO_CM||1),
    profundidad_cm: Number(process.env.DEFAULT_PROFUNDIDAD_CM||1),
    valor_declarado: Number(process.env.DEFAULT_VALOR_DECLARADO||6000),
  })

  return new NextResponse(out,{
    headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':'attachment; filename="andreani_envios.xlsx"'
    }
  })
}
