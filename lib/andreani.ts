import ExcelJS from 'exceljs'
import { ShopifyOrder } from '../lib/shopify'

type Defaults = {
  dni: string
  peso_gr: number
  alto_cm: number
  ancho_cm: number
  profundidad_cm: number
  valor_declarado: number
}

const norm = (s?:string)=> (s??'').toString().trim()
const up   = (s?:string)=> norm(s).toUpperCase()

function normalizeName(s: string){
  return up(s).normalize('NFD').replace(/\p{Diacritic}/gu,'')
}

function findSheetLike(wb: ExcelJS.Workbook, contains: string){
  const target = normalizeName(contains)
  for (const ws of wb.worksheets) {
    const name = normalizeName(ws.name)
    if (name.includes(target)) return ws
  }
  return null
}

function mapNombre(name?: string, first?: string, last?: string){
  const full = norm(name || `${first??''} ${last??''}`)
  const parts = full.split(' ').filter(Boolean)
  if (parts.length<=1) return { nombre: parts[0]||'', apellido: '' }
  return { nombre: parts.slice(0,-1).join(' '), apellido: parts.at(-1)! }
}

function extractNumero(calle: string): { numero: string, cleaned: string, estimated: boolean } {
  const m1 = calle.match(/(.*?)[\s,]+(\d+[A-Z]?)\s*$/)
  if (m1) return { numero: m1[2], cleaned: up(m1[1]), estimated: false }
  const m2 = calle.match(/(\d+[A-Z]?)/)
  if (m2) return { numero: m2[1], cleaned: up(calle.replace(m2[1], '').trim()), estimated: false }
  return { numero: '1', cleaned: up(calle), estimated: true }
}

async function bestMatchPLC(wb: ExcelJS.Workbook, provincia: string, localidad: string, cp: string): Promise<string> {
  let cfg = findSheetLike(wb, 'CONFIGURACION') || findSheetLike(wb, 'CONFIGURACIÓN')
  if (!cfg) return `${up(provincia)} / ${up(localidad)} / ${cp}`
  try { // @ts-ignore
    if (cfg.state && cfg.state !== 'visible') cfg.state = 'visible'
  } catch {}
  const listColIndex = 5
  const items: string[] = []
  for (let r = 2; r <= cfg.rowCount; r++) {
    const v = cfg.getRow(r).getCell(listColIndex).value
    if (typeof v === 'string' && v.trim()) items.push(v.trim())
  }
  const targetCP = cp.replace(/\D/g,'')
  const targetProv = up(provincia); const targetLoc = up(localidad)
  const exactCP = items.find(x => x.endsWith(` / ${targetCP}`))
  if (exactCP) return exactCP
  const loccp = items.find(x => x.toUpperCase().includes(` ${targetLoc} `) && x.endsWith(` / ${targetCP}`))
  if (loccp) return loccp
  const prov = items.find(x => x.toUpperCase().startsWith(targetProv))
  if (prov) return prov
  return items[0] || `${targetProv} / ${targetLoc} / ${targetCP}`
}

export async function fillAndreaniFromOrders(templateBuffer: Buffer, orders: ShopifyOrder[], defaults: Defaults) {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(templateBuffer)

  let ws = findSheetLike(wb, 'DOMICILIO') || wb.worksheets[0]
  if (!ws) throw new Error('No se encontró la hoja "A domicilio" en la plantilla.')

  const HEADER_ROW = 2
  const headers: Record<string, number> = {}
  ws.getRow(HEADER_ROW).eachCell((cell, col) => {
    if (cell.value && typeof cell.value === 'string') headers[cell.value.replace(/\s+/g,' ').trim().toLowerCase()] = col
  })
  const col = (start: string) => {
    const key = Object.keys(headers).find(k => k.startsWith(start.toLowerCase()))
    return key ? headers[key] : undefined
  }

  for (const o of orders) {
    const ship = o.shipping_address || {}
    if (!ship || (!ship.address1 && !ship.city)) continue

    const { nombre, apellido } = mapNombre(ship.name, ship.first_name, ship.last_name)
    const email = norm(o.contact_email || o.customer?.email)
    const phone = norm(ship.phone || o.phone || o.customer?.phone)

    const parsed = extractNumero(norm(ship.address1 || ''))
    const calle = parsed.cleaned
    const numero = parsed.numero
    const numeroEstimated = parsed.estimated

    const piso = norm(ship.address2)
    const provincia = up(ship.province || ship.province_code || '')
    const localidad = up(ship.city || '')
    const cp = norm(ship.zip || '')

    const row = ws.addRow([]); const r = row.number
    const set = (labelStart: string, value: any) => { const c = col(labelStart); if (c) ws.getRow(r).getCell(c).value = value }

    set('Paquete Guardado', '')
    set('Peso (grs)', defaults.peso_gr)
    set('Alto (cm)', defaults.alto_cm)
    set('Ancho (cm)', defaults.ancho_cm)
    set('Profundidad (cm)', defaults.profundidad_cm)

    const precio = Number(o.current_total_price || o.total_price || 0) || 0
    set('Valor declarado', Math.max(defaults.valor_declarado, Math.ceil(precio)))
    set('Numero Interno', `#${o.order_number}`)

    set('Nombre', up(nombre))
    set('Apellido', up(apellido))
    set('DNI', defaults.dni)
    set('Email', email)

    const digits = phone.replace(/\D/g,'')
    const cod = digits.slice(0,2) || '11'
    const num = digits.slice(2) || '11111111'
    set('Celular código', cod)
    set('Celular número', num)

    set('Calle', calle)
    set('Número *', numero); set('Numero', numero)
    set('Piso', piso)
    set('Departamento', '')

    const plc = await bestMatchPLC(wb, provincia, localidad, cp)
    set('Provincia / Localidad / CP', plc)

    const obsBase = `Pedido Shopify #${o.order_number}`
    set('Observaciones', numeroEstimated ? `${obsBase} (Número estimado automáticamente)` : obsBase)
  }

  return await wb.xlsx.writeBuffer()
}
