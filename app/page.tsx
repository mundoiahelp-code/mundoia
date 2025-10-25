import Link from 'next/link'
export default function Home(){
  return (
    <main className="grid gap-6">
      <section className="card grid gap-3">
        <h2 className="h2">¿Qué hace?</h2>
        <p>Lee pedidos <b>Pagados</b> y <b>No cumplidos</b> de Shopify y los descarga en la <b>planilla oficial de Andreani</b> con validaciones.</p>
        <ul className="list-disc pl-6 text-sm text-slate-700">
          <li>Completa DNI, peso, dimensiones y valor declarado ($6000 por defecto).</li>
          <li>Provincia/Localidad/CP mapeados desde la hoja <i>Configuración</i> aunque esté oculta.</li>
          <li>Si falta el <b>Número</b> en la dirección → se usa <b>1</b> y se avisa en Observaciones.</li>
        </ul>
        <Link href="/dashboard" className="btn btn-primary w-max">Ir al Panel</Link>
      </section>
    </main>
  )
}
