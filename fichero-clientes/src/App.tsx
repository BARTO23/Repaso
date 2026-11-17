import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Mail, Phone, Plus, Search, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { LEX_DATA } from './data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'

/* ---------- Tipos y datos ---------- */
type Caso = { id: string; titulo: string; expediente: string; estado: string; prioridad: string; progreso: number }
type Cliente = {
  id: string; nombre: string; tipo: string; area: string; estado: string; abogado: string; contacto: string
  email: string; telefono: string; ciudad: string; documento: string; desde: string; ultimaActividad: string
  proximaAudiencia: string | null; facturado: number; pendiente: number; satisfaccion: number; favorito: boolean
  etiquetas: string[]; casos: Caso[]; notas: string; timeline: { fecha: string; texto: string }[]
}
type Abogado = { id: string; nombre: string; titulo: string; rol: string }

const D = LEX_DATA as { AREAS: Record<string, unknown>; ESTADOS: string[]; ABOGADOS: Abogado[]; clientes: Cliente[]; HOY: string }
const AREAS = Object.keys(D.AREAS)
const STORE = 'lex-fichero-v1'
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- Formatos (Intl) ---------- */
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const pct = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 0 })
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
const parse = (s: string) => new Date(s + 'T00:00:00')
const dias = (s: string) => Math.round((parse(s).getTime() - parse(D.HOY).getTime()) / 864e5)
const fmt = (s: string) => fecha.format(parse(s))
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const letra = (c: Cliente) => norm(c.nombre).charAt(0).toUpperCase()
const abogado = (id: string) => D.ABOGADOS.find((a) => a.id === id) ?? D.ABOGADOS[0]
const nombreAbogado = (a: Abogado) => `${a.titulo} ${a.nombre}`
const abiertos = (c: Cliente) => c.casos.filter((k) => k.estado !== 'Cerrado').length
const cuando = (s: string) => { const n = dias(s); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días` }

function cargar(): Cliente[] {
  try { const v = localStorage.getItem(STORE); if (v) return JSON.parse(v) } catch { /* sin almacenamiento */ }
  return JSON.parse(JSON.stringify(D.clientes))
}

function useNarrow() {
  const q = '(max-width: 899px)'
  const [n, set] = useState(() => matchMedia(q).matches)
  useEffect(() => { const m = matchMedia(q); const h = () => set(m.matches); m.addEventListener('change', h); return () => m.removeEventListener('change', h) }, [])
  return n
}

/* Al filtrar, las fichas se reacomodan en el cajón en vez de saltar (FLIP) */
function useRefile(ref: React.RefObject<HTMLDivElement | null>, key: string) {
  const prev = useRef(new Map<string, number>())
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const now = new Map<string, number>()
    box.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const k = el.dataset.key!
      now.set(k, el.offsetTop)
      const before = prev.current.get(k)
      if (!reduced && before !== undefined && before !== el.offsetTop) {
        el.animate([{ transform: `translateY(${before - el.offsetTop}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' })
      }
    })
    prev.current = now
  }, [ref, key])
}

/* =========================================================
   APLICACIÓN
   ========================================================= */
export default function App() {
  const [clientes, setClientes] = useState<Cliente[]>(cargar)
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('todos')
  const [area, setArea] = useState('todas')
  const [selId, setSelId] = useState<string | null>(null)
  const [nueva, setNueva] = useState(false)
  const [archivando, setArchivando] = useState(true)
  const narrow = useNarrow()
  const cajon = useRef<HTMLDivElement>(null)
  const buscar = useRef<HTMLInputElement>(null)

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(clientes)) } catch { /* */ } }, [clientes])
  useEffect(() => { const t = setTimeout(() => setArchivando(false), 1600); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(t.tagName)) { e.preventDefault(); buscar.current?.focus() }
    }
    addEventListener('keydown', h); return () => removeEventListener('keydown', h)
  }, [])

  const lista = useMemo(() => {
    const tokens = norm(q).split(/\s+/).filter(Boolean)
    return clientes
      .filter((c) => (estado === 'todos' || c.estado === estado) && (area === 'todas' || c.area === area))
      .filter((c) => { const h = norm([c.nombre, c.ciudad, c.area, c.documento, c.email, c.contacto].join(' ')); return tokens.every((t) => h.includes(t)) })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [clientes, q, estado, area])

  const grupos = useMemo(() => {
    const g: { l: string; items: Cliente[] }[] = []
    lista.forEach((c) => { const l = letra(c); const last = g[g.length - 1]; last && last.l === l ? last.items.push(c) : g.push({ l, items: [c] }) })
    return g
  }, [lista])

  // En escritorio siempre hay una ficha abierta; en móvil se abre al tocarla
  const sel = clientes.find((c) => c.id === selId) ?? (narrow ? null : lista[0] ?? null)
  useRefile(cajon, lista.map((c) => c.id).join())

  const semana = clientes.filter((c) => c.proximaAudiencia && dias(c.proximaAudiencia) >= 0 && dias(c.proximaAudiencia) < 7).length
  const hayFiltro = q || estado !== 'todos' || area !== 'todas'

  const actualizar = (id: string, cambio: Partial<Cliente>) => setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, ...cambio } : c)))
  const eliminar = (c: Cliente) => {
    const idx = clientes.findIndex((x) => x.id === c.id)
    setClientes((cs) => cs.filter((x) => x.id !== c.id))
    setSelId(null)
    toast(`Eliminaste la ficha de ${c.nombre}.`, {
      action: { label: 'Deshacer', onClick: () => { setClientes((cs) => { const n = [...cs]; n.splice(idx, 0, c); return n }); setSelId(c.id) } },
      duration: 6000,
    })
  }
  let n = 0

  return (
    <div className="min-h-screen">
      <a href="#cajon" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-[var(--tinta)] focus:px-3 focus:py-2 focus:text-white">Saltar al fichero</a>

      <header className="mx-auto max-w-[1240px] px-5 pb-6 pt-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--grafito)]" translate="no">Lex &amp; Asociados</p>
            <h1 className="wide text-[42px] font-semibold leading-[1.05] tracking-[-0.01em] text-[var(--tinta)] max-sm:text-[32px]">Fichero de clientes</h1>
            <p className="mt-2 text-[var(--grafito)]">{clientes.length} fichas en el cajón. {semana === 1 ? 'Una audiencia' : `${semana} audiencias`} en los próximos 7 días.</p>
          </div>
          <Button onClick={() => setNueva(true)} className="h-10 gap-2 rounded-md bg-[var(--tinta)] px-4 text-[15px] hover:bg-[#2b3547]">
            <Plus className="size-4" aria-hidden />Nueva ficha
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3" role="search">
          <div className="relative min-w-[240px] flex-1 sm:max-w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--grafito)]" aria-hidden />
            <Input ref={buscar} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre, ciudad o NIT…" aria-label="Buscar en el fichero"
              className="h-10 border-[var(--canto)] bg-white pl-9 pr-9 text-[15px] shadow-none max-sm:text-base" autoComplete="off" spellCheck={false} />
            {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-[var(--grafito)] hover:text-[var(--tinta)]" aria-label="Borrar búsqueda"><X className="size-4" /></button>}
          </div>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="h-10 w-[210px] border-[var(--canto)] bg-white text-[15px] shadow-none" aria-label="Área de práctica"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las áreas</SelectItem>
              {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" value={estado} onValueChange={(v) => setEstado(v || 'todos')} aria-label="Estado del cliente" className="flex-wrap justify-start gap-1">
            {[['todos', 'Todos'], ['Activo', 'Activos'], ['En revisión', 'En revisión'], ['Potencial', 'Potenciales'], ['Inactivo', 'Inactivos']].map(([v, l]) => (
              <ToggleGroupItem key={v} value={v} className="h-10 rounded-md px-3 text-[15px] text-[var(--grafito)] data-[state=on]:bg-white data-[state=on]:text-[var(--tinta)] data-[state=on]:shadow-[inset_0_-2px_0_var(--margen)]">{l}</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-8 px-5 pb-16 sm:px-8 min-[900px]:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        {/* ---------- El cajón ---------- */}
        <section aria-label="Fichas de clientes en orden alfabético" id="cajon" tabIndex={-1}>
          <div ref={cajon} className={`cajon ${archivando && !reduced ? 'archivando' : ''}`} aria-live="polite">
            {lista.length === 0 && (
              <div className="rounded bg-white p-6">
                <p className="font-medium text-[var(--tinta)]">Ninguna ficha coincide con la búsqueda.</p>
                <p className="mt-1 text-[var(--grafito)]">Revisa la ortografía o busca por ciudad o NIT.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setQ(''); setEstado('todos'); setArea('todas') }}>Quitar filtros</Button>
              </div>
            )}
            {grupos.map((g, gi) => (
              <div key={g.l}>
                <div className="separador" id={`sep-${g.l}`} style={{ ['--tab-x' as string]: `${(gi % 5) * 19}%`, ['--n' as string]: n++ }} aria-hidden>
                  <span>{g.l}</span>
                </div>
                {g.items.map((c) => (
                  <button key={c.id} data-key={c.id} className="ficha" style={{ ['--n' as string]: n++, zIndex: 1 }}
                    aria-current={sel?.id === c.id} onClick={() => setSelId(c.id)}>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[16px] font-semibold text-[var(--tinta)]">{c.nombre}</span>
                      {c.favorito && <Star className="size-3.5 shrink-0 fill-[var(--tinta)] text-[var(--tinta)]" aria-label="Favorito" />}
                    </span>
                    <span className="mt-[14px] block truncate text-[13px] text-[var(--grafito)]">
                      {c.area}, {c.ciudad}. {c.estado}{abiertos(c) ? `, ${abiertos(c)} ${abiertos(c) === 1 ? 'caso abierto' : 'casos abiertos'}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          {hayFiltro && lista.length > 0 && <p className="mt-3 text-sm text-[var(--grafito)]">{lista.length} de {clientes.length} fichas. <button className="underline underline-offset-2 hover:text-[var(--tinta)]" onClick={() => { setQ(''); setEstado('todos'); setArea('todas') }}>Ver todas</button></p>}
        </section>

        {/* ---------- La ficha abierta ---------- */}
        {!narrow && (
          <section aria-label="Ficha abierta" className="min-[900px]:sticky min-[900px]:top-6 min-[900px]:self-start">
            {sel ? <FichaAbierta key={sel.id} c={sel} onFav={() => actualizar(sel.id, { favorito: !sel.favorito })} onDelete={() => eliminar(sel)} />
              : <p className="rounded bg-white/60 p-8 text-[var(--grafito)]">Elige una ficha del cajón para abrirla.</p>}
          </section>
        )}
      </main>

      {narrow && (
        <Sheet open={!!sel} onOpenChange={(o) => !o && setSelId(null)}>
          <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-lg border-0 bg-[var(--gabinete)] p-3 pt-10">
            <SheetTitle className="sr-only">{sel?.nombre}</SheetTitle>
            <SheetDescription className="sr-only">Ficha del cliente</SheetDescription>
            {sel && <FichaAbierta key={sel.id} c={sel} onFav={() => actualizar(sel.id, { favorito: !sel.favorito })} onDelete={() => eliminar(sel)} />}
          </SheetContent>
        </Sheet>
      )}

      <NuevaFicha open={nueva} onOpenChange={setNueva} onCreate={(c) => { setClientes((cs) => [c, ...cs]); setSelId(c.id); setQ(''); setEstado('todos'); setArea('todas'); toast(`Creaste la ficha de ${c.nombre}.`) }} />
      <Toaster position="bottom-left" toastOptions={{ className: 'font-[Archivo]' }} />
    </div>
  )
}

/* =========================================================
   FICHA ABIERTA
   ========================================================= */
function Fila({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 max-sm:grid-cols-[112px_minmax(0,1fr)]">
      <dt className="truncate text-[13px] text-[var(--grafito)]">{k}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  )
}

function FichaAbierta({ c, onFav, onDelete }: { c: Cliente; onFav: () => void; onDelete: () => void }) {
  const a = abogado(c.abogado)
  const cobrado = c.facturado ? 1 - c.pendiente / c.facturado : 1
  const urgente = c.proximaAudiencia !== null && dias(c.proximaAudiencia) >= 0 && dias(c.proximaAudiencia) < 7
  return (
    <article className="abierta" aria-labelledby={`t-${c.id}`}>
      <header className="flex items-start gap-4 px-7 pb-4 pt-6 max-sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 id={`t-${c.id}`} className="wide text-[28px] font-semibold leading-tight text-[var(--tinta)] max-sm:text-[24px]">{c.nombre}</h2>
          <p className="mt-1 text-[var(--grafito)]">{c.tipo === 'Empresa' ? 'Empresa' : 'Persona natural'} en {c.ciudad}, {c.documento}</p>
          <p className="mt-1 text-[var(--tinta)]">
            {c.estado} desde el {fmt(c.desde)}.{' '}
            {urgente && <span className="font-semibold text-[var(--margen)]">Audiencia {cuando(c.proximaAudiencia!)}.</span>}
          </p>
        </div>
        <button onClick={onFav} aria-pressed={c.favorito} aria-label={c.favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
          className="grid size-10 shrink-0 place-items-center rounded-md text-[var(--grafito)] transition-colors hover:bg-[var(--gabinete)] hover:text-[var(--tinta)]">
          <Star className={`size-5 ${c.favorito ? 'fill-[var(--tinta)] text-[var(--tinta)]' : ''}`} />
        </button>
      </header>
      <div className="linea-roja" />

      <Tabs defaultValue="ficha" className="px-7 max-sm:px-5">
        <TabsList className="h-auto w-full justify-start rounded-none border-b border-[var(--renglon)] bg-transparent p-0">
          {[['ficha', 'Ficha'], ['casos', `Casos (${c.casos.length})`], ['cuenta', 'Cuenta'], ['bitacora', 'Bitácora']].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="pestana-texto rounded-none bg-transparent px-0 text-[15px] shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="ficha" className="mt-0">
          <dl className="renglones py-2">
            <Fila k="Correo"><a className="underline decoration-[var(--renglon)] underline-offset-4 hover:decoration-[var(--tinta)]" href={`mailto:${c.email}`}>{c.email}</a></Fila>
            <Fila k="Teléfono"><a className="hover:underline" href={`tel:${c.telefono.replace(/\s/g, '')}`}>{c.telefono}</a></Fila>
            {c.contacto && <Fila k="Persona de contacto">{c.contacto}</Fila>}
            <Fila k="Responsable">{nombreAbogado(a)}</Fila>
            <Fila k="Próxima audiencia">{c.proximaAudiencia ? <span className={urgente ? 'font-semibold text-[var(--margen)]' : ''}>{fmt(c.proximaAudiencia)} ({cuando(c.proximaAudiencia)})</span> : <span className="text-[var(--grafito)]">Sin programar</span>}</Fila>
            {c.etiquetas.length > 0 && <Fila k="Etiquetas">{c.etiquetas.join(', ')}</Fila>}
            <Fila k="Última actividad">{fmt(c.ultimaActividad)}</Fila>
            <div><dt className="text-[13px] text-[var(--grafito)]">Notas</dt></div>
            <dd className="whitespace-normal">{c.notas || 'Sin notas.'}</dd>
          </dl>
        </TabsContent>

        <TabsContent value="casos" className="mt-0">
          {c.casos.length ? (
            <ul className="renglones py-2">
              {c.casos.map((k) => (
                <li key={k.id} className="mb-[32px] last:mb-0">
                  <div className="flex justify-between gap-4"><span className="truncate font-medium">{k.titulo}</span><span className={`shrink-0 text-[13px] ${k.prioridad === 'Alta' ? 'font-semibold text-[var(--margen)]' : 'text-[var(--grafito)]'}`}>Prioridad {k.prioridad.toLowerCase()}</span></div>
                  <div className="text-[13px] text-[var(--grafito)]">Expediente {k.expediente}, {k.estado.toLowerCase()}, {k.estado === 'Cerrado' ? 100 : k.progreso} % de avance</div>
                </li>
              ))}
            </ul>
          ) : <p className="renglones py-2 text-[var(--grafito)]">Este cliente aún no tiene casos. Los que abras aparecerán en esta ficha.</p>}
        </TabsContent>

        <TabsContent value="cuenta" className="mt-0">
          <dl className="renglones py-2">
            <Fila k="Total facturado"><span className="tabular-nums">{money.format(c.facturado)}</span></Fila>
            <Fila k="Por cobrar"><span className="tabular-nums">{c.pendiente ? money.format(c.pendiente) : 'Nada pendiente'}</span></Fila>
            <Fila k="Cobrado">{pct.format(cobrado)} de lo facturado</Fila>
            <Fila k="Satisfacción">{c.satisfaccion} de 5</Fila>
          </dl>
        </TabsContent>

        <TabsContent value="bitacora" className="mt-0">
          <ol className="renglones py-2">
            {c.timeline.map((t, i) => <li key={i} className="grid grid-cols-[150px_minmax(0,1fr)] gap-4 max-sm:grid-cols-[112px_minmax(0,1fr)]"><span className="text-[13px] text-[var(--grafito)]">{fmt(t.fecha)}</span><span className="truncate">{t.texto}</span></li>)}
          </ol>
        </TabsContent>
      </Tabs>

      <footer className="flex flex-wrap gap-2 px-7 pb-6 pt-4 max-sm:px-5">
        <Button asChild variant="outline" className="h-10 gap-2 border-[var(--canto)] bg-white text-[15px] hover:bg-[var(--gabinete)]"><a href={`mailto:${c.email}`}><Mail className="size-4" aria-hidden />Escribir</a></Button>
        <Button asChild variant="outline" className="h-10 gap-2 border-[var(--canto)] bg-white text-[15px] hover:bg-[var(--gabinete)]"><a href={`tel:${c.telefono.replace(/\s/g, '')}`}><Phone className="size-4" aria-hidden />Llamar</a></Button>
        <Button variant="ghost" onClick={onDelete} className="ml-auto h-10 gap-2 text-[15px] text-[var(--margen)] hover:bg-[#f8e7e8] hover:text-[var(--margen)]"><Trash2 className="size-4" aria-hidden />Eliminar ficha</Button>
      </footer>
    </article>
  )
}

/* =========================================================
   NUEVA FICHA
   ========================================================= */
function NuevaFicha({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (c: Cliente) => void }) {
  const vacio = { nombre: '', tipo: 'Empresa', email: '', telefono: '', ciudad: 'Bogotá', area: 'Corporativo', abogado: 'ev', notas: '' }
  const [f, setF] = useState(vacio)
  const [err, setErr] = useState<Record<string, string>>({})
  useEffect(() => { if (open) { setF(vacio); setErr({}) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string, v: string) => { setF((x) => ({ ...x, [k]: v })); setErr((e) => ({ ...e, [k]: '' })) }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const errores: Record<string, string> = {}
    if (f.nombre.trim().length < 3) errores.nombre = 'Escribe el nombre completo o la razón social.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) errores.email = 'Escribe un correo con el formato nombre@dominio.com.'
    setErr(errores)
    if (Object.keys(errores).length) { document.getElementById(`f-${Object.keys(errores)[0]}`)?.focus(); return }
    onCreate({
      id: 'c' + Date.now().toString(36), nombre: f.nombre.trim(), tipo: f.tipo, area: f.area, estado: 'Potencial', abogado: f.abogado,
      contacto: '', email: f.email.trim(), telefono: f.telefono.trim() || 'Sin teléfono', ciudad: f.ciudad, documento: 'Sin documento',
      desde: D.HOY, ultimaActividad: D.HOY, proximaAudiencia: null, facturado: 0, pendiente: 0, satisfaccion: 5, favorito: false,
      etiquetas: [], casos: [], notas: f.notas.trim(), timeline: [{ fecha: D.HOY, texto: 'Ficha creada en el fichero' }],
    })
    onOpenChange(false)
  }

  const campo = 'h-10 border-[var(--canto)] text-[15px] shadow-none max-sm:text-base'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-md border-0 p-0 sm:rounded-md">
        <form onSubmit={enviar} noValidate>
          <DialogHeader className="px-6 pb-4 pt-6 text-left">
            <DialogTitle className="wide text-[24px] font-semibold text-[var(--tinta)]">Nueva ficha</DialogTitle>
            <DialogDescription className="text-[var(--grafito)]">Abre una ficha para un cliente nuevo. Podrás completar el resto de datos después.</DialogDescription>
          </DialogHeader>
          <div className="linea-roja" />
          <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="f-nombre">Nombre o razón social</Label>
              <Input id="f-nombre" className={campo} value={f.nombre} onChange={(e) => set('nombre', e.target.value)} autoComplete="organization" placeholder="Grupo Horizonte SAS…" aria-invalid={!!err.nombre} aria-describedby="e-nombre" />
              {err.nombre && <p id="e-nombre" className="text-[13px] text-[var(--margen)]">{err.nombre}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-email">Correo</Label>
              <Input id="f-email" type="email" inputMode="email" spellCheck={false} className={campo} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="contacto@empresa.com…" aria-invalid={!!err.email} aria-describedby="e-email" />
              {err.email && <p id="e-email" className="text-[13px] text-[var(--margen)]">{err.email}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-tel">Teléfono</Label>
              <Input id="f-tel" type="tel" inputMode="tel" className={campo} value={f.telefono} onChange={(e) => set('telefono', e.target.value)} autoComplete="tel" placeholder="+57 300 000 0000…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-area">Área de práctica</Label>
              <Select value={f.area} onValueChange={(v) => set('area', v)}>
                <SelectTrigger id="f-area" className={campo}><SelectValue /></SelectTrigger>
                <SelectContent>{AREAS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="f-abogado">Responsable</Label>
              <Select value={f.abogado} onValueChange={(v) => set('abogado', v)}>
                <SelectTrigger id="f-abogado" className={campo}><SelectValue /></SelectTrigger>
                <SelectContent>{D.ABOGADOS.map((x) => <SelectItem key={x.id} value={x.id}>{nombreAbogado(x)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="f-notas">Notas</Label>
              <Textarea id="f-notas" className="min-h-[80px] border-[var(--canto)] text-[15px] shadow-none max-sm:text-base" value={f.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Cómo llegó a la firma, qué necesita…" />
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-[var(--canto)] px-6 py-4">
            <Button type="button" variant="outline" className="h-10 border-[var(--canto)] text-[15px]" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="h-10 bg-[var(--tinta)] text-[15px] hover:bg-[#2b3547]">Abrir ficha</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
