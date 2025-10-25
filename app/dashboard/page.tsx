'use client'
import { useState } from 'react'

export default function Dashboard(){
  const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false); const [ordersCount,setOrdersCount]=useState<number|null>(null)
  const [logs,setLogs]=useState<string[]>([])
  const log=(t:string)=>setLogs(p=>[new Date().toLocaleString()+': '+t,...p].slice(0,12))

  async function test(){ setBusy(true); setMsg(''); setErr(''); setOrdersCount(null)
    const r=await fetch('/api/test'); setBusy(false)
    if(!r.ok){ const t=await r.text(); setErr(t); log('❌ Test: '+t); return }
    const d=await r.json(); setOrdersCount(d.count??0); setMsg(d.message||'Conexión OK'); log('✅ Test OK — pedidos: '+(d.count??0))
  }

  async function generate(){ setBusy(true); setMsg(''); setErr('')
    const r=await fetch('/api/generate',{method:'POST'}); setBusy(false)
    if(!r.ok){ const t=await r.text(); setErr(t); log('❌ Generar: '+t); return }
    const blob=await r.blob(); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url
    const d=new Date(); const dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'), yyyy=d.getFullYear()
    a.download=`andreani_envios_${dd}-${mm}-${yyyy}.xlsx`; a.click(); URL.revokeObjectURL(url); setMsg('Archivo descargado ✅'); log('✅ Excel descargado')
  }

  return (<main className="grid gap-6">
    <section className="card grid gap-4">
      <h2 className="h2">Acciones</h2>
      <p className="helper">Credenciales desde variables de entorno (Vercel). Sin modo demo.</p>
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-ghost" onClick={test} disabled={busy}>Probar conexión</button>
        <button className="btn btn-success" onClick={generate} disabled={busy}>Generar Excel</button>
        {ordersCount!==null && <span className="badge">Pedidos: {ordersCount}</span>}
      </div>
      {(msg||err) && <div className={err?'alert alert-error':'alert alert-ok'}>{err||msg}</div>}
    </section>

    <section className="card">
      <h2 className="h2 mb-2">Logs</h2>
      <div className="space-y-1">{logs.map((l,i)=>(<div key={i} className="logline">{l}</div>))}</div>
    </section>
  </main>)
}
