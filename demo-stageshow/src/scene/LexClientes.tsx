import { BellRing, Briefcase, CalendarDays, Check, ChevronDown, FileText, Inbox, Search, SlidersHorizontal, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, Badge, Bar, Button, Collapse, Field, Stage, States, Text, Window, type Act, type Layout } from '../kit'
import './lex.css'

// Lex, the practice app of a law firm, light, in its desktop window.
// Started from the linear gold: same window, sidebar, list anatomy and pace.
//
// The story (how it feels to use): the associate searches "valdes", the
// client list closes up around the one match, they open it, the file slides
// in with tomorrow's hearing, and one click sets a reminder; the button
// confirms on itself. Esc twice undoes it in the order it was built: the
// file closes, the search clears and the rows come back. A caused reset.
//
// Real strings: the view (Clientes), the four client names the search
// passes over, what is typed, the opened client, the hearing and the action.
// Everything else is placeholder lines around the product's own marks:
// status rings, area chips, the responsible lawyer's avatar.
//
// Icons: lucide-react (installed here), as in the linear gold.

type S = {
  focus: boolean
  query: string
  hover: boolean
  open: boolean
  reminded: boolean
}

const initial: S = { focus: false, query: '', hover: false, open: false, reminded: false }

type Status = 'activo' | 'revision' | 'potencial' | 'inactivo'
type Row = { status: Status; name: string | number; area: string; areaW: number; tone: 0 | 1 | 2; who: string; date: string | number }

// Four worded rows, four placeholder rows: the list the search runs over
const ROWS: Row[] = [
  { status: 'activo', name: 'Agroindustrias La Esperanza', area: 'Tributario', areaW: 0, tone: 0, who: 'Elena', date: 44 },
  { status: 'revision', name: 'Camila Torres Duque', area: 'Corporativo', areaW: 0, tone: 1, who: 'Sebastián', date: 38 },
  { status: 'activo', name: 'Constructora Valdés & Hijos', area: 'Inmobiliario', areaW: 0, tone: 2, who: 'Tomás', date: 'Mañana' },
  { status: 'potencial', name: 'Diego Alejandro Paredes', area: 'Penal', areaW: 0, tone: 0, who: 'Martín', date: 40 },
  { status: 'activo', name: 168, area: '', areaW: 42, tone: 1, who: 'Paula', date: 36 },
  { status: 'inactivo', name: 132, area: '', areaW: 36, tone: 2, who: 'Natalia', date: 42 },
  { status: 'activo', name: 184, area: '', areaW: 46, tone: 0, who: 'Elena', date: 38 },
  { status: 'revision', name: 146, area: '', areaW: 40, tone: 1, who: 'Tomás', date: 44 },
  { status: 'activo', name: 120, area: '', areaW: 38, tone: 2, who: 'Paula', date: 40 },
]
const TARGET = 2

// What the search also finds: the client's case files, grouped under the match
const CASES: { title: string | number; ref: string | number; status: Status }[] = [
  { title: 'Compraventa de inmueble comercial', ref: '2026-6279', status: 'activo' },
  { title: 'Restitución de inmueble arrendado', ref: '2026-7586', status: 'revision' },
  { title: 'Estudio de títulos', ref: '2024-9721', status: 'activo' },
  { title: 172, ref: 52, status: 'inactivo' },
]
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

async function script(a: Act<S>) {
  const compact = a.layout === 'compact'
  await a.wait(900)

  // 1. Search: click the field and type
  a.mark('search')
  await a.move({ at: 'search', x: 0.7, y: 0.55 })
  await a.click()
  await a.set({ focus: true })
  await a.wait(300)
  await a.type('query', 'valdes', { interval: 95 })
  await a.wait(800)

  // 2. Open the one match
  a.mark('open')
  await a.move({ at: 'row', x: compact ? 0.82 : 0.6, y: 0.55 })
  await a.set({ hover: true })
  await a.wait(250)
  await a.click()
  await a.set({ open: true, focus: false })
  await a.wait(1000)

  // 3. Set the reminder; the button confirms on itself
  a.mark('remind')
  await a.move({ at: 'remind', x: 0.13, y: 0.62 })
  await a.wait(250)
  await a.click()
  await a.set({ reminded: true })
  await a.move({ at: 'rest', x: 0.5, y: 0.5 })
  await a.wait(2200)

  // Esc closes the file, Esc again clears the search: the caused reset
  a.mark('reset')
  await a.key('esc')
  await a.set({ open: false, hover: false })
  await a.wait(600)
  await a.snap({ reminded: false })
  await a.key('esc')
  await a.set({ query: '' })
  await a.wait(500)
  // Back to where the loop began, so the seam is invisible
  await a.move(compact ? { x: 220, y: 260 } : { x: 620, y: 300 })
  await a.wait(600)
}

function StatusMark({ status }: { status: Status }) {
  return (
    <svg className="lx-status" data-status={status} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.5" strokeDasharray={status === 'potencial' ? '2.1 1.5' : undefined} />
      {status === 'activo' && <circle cx="7" cy="7" r="2.5" />}
    </svg>
  )
}

function ClientRow({ r, i, s, compact }: { r: Row; i: number; s: S; compact: boolean }) {
  const target = i === TARGET
  const worded = typeof r.name === 'string'
  return (
    <div className="lx-row" data-target={target ? 'row' : undefined} data-focus={(target && s.hover) || undefined} data-open={(target && s.open) || undefined}>
      <StatusMark status={r.status} />
      <span className="lx-title">
        {worded ? <Text className="lx-title__text">{r.name as string}</Text> : <Bar w={compact ? Math.min(r.name as number, 140) : (r.name as number)} h={6} tone={3} />}
      </span>
      {!compact && (
        <span className="lx-labels">
          <span className="lx-chip">
            <span className="lx-chip__dot" data-tone={r.tone} />
            {r.area ? <Text className="lx-chip__text">{r.area}</Text> : <Bar w={r.areaW} h={5} tone={3} />}
          </span>
        </span>
      )}
      <span className="lx-who">
        <Avatar name={r.who} size={18} className="lx-avatar" data-face={i % 3} style={{ fontSize: 9.5 }} />
      </span>
      {!compact && (
        <span className="lx-date">{typeof r.date === 'string' ? <Text className="lx-date__text">{r.date}</Text> : <Bar w={r.date} h={5} tone={2} />}</span>
      )}
    </div>
  )
}

function Sidebar() {
  const nav = (icon: ReactNode, label: ReactNode, active?: boolean) => (
    <div className="lx-nav" data-active={active || undefined}>
      {icon}
      {label}
    </div>
  )
  return (
    <div className="lx-side">
      <div className="lx-workspace">
        <Text className="lx-workspace__name">Lex &amp; Asociados</Text>
        <ChevronDown size={12} strokeWidth={1.8} className="lx-icon" />
      </div>
      <div className="lx-group">
        {nav(<Inbox size={14} strokeWidth={1.7} className="lx-icon" />, <Bar w={40} h={5} tone={3} />)}
        {nav(<CalendarDays size={14} strokeWidth={1.7} className="lx-icon" />, <Bar w={52} h={5} tone={3} />)}
      </div>
      <div className="lx-group">
        <div className="lx-section"><Bar w={58} h={5} tone={2} /></div>
        {nav(<Users size={14} strokeWidth={1.7} className="lx-icon lx-icon--on" />, <Text className="lx-nav__label">Clientes</Text>, true)}
        {nav(<Briefcase size={14} strokeWidth={1.7} className="lx-icon" />, <Bar w={56} h={5} tone={3} />)}
        {nav(<FileText size={14} strokeWidth={1.7} className="lx-icon" />, <Bar w={46} h={5} tone={3} />)}
      </div>
    </div>
  )
}

// The client's file: slides in over the list's right side, as the product opens it
function Peek({ s, compact }: { s: S; compact: boolean }) {
  return (
    <aside className="lx-peek" data-open={s.open || undefined} data-compact={compact || undefined}>
      <div className="lx-peek__head">
        <Avatar name="Constructora" size={32} className="lx-peek__avatar" />
        <div className="lx-peek__id">
          <Text className="lx-peek__name">Constructora Valdés &amp; Hijos</Text>
          <Text className="lx-peek__sub">Empresa en Pereira</Text>
        </div>
      </div>
      <div className="lx-peek__badges">
        <Badge tone="success" dot>Activo</Badge>
        <span className="lx-chip"><span className="lx-chip__dot" data-tone={2} /><Text className="lx-chip__text">Inmobiliario</Text></span>
      </div>
      <div className="lx-hearing">
        <Text className="lx-hearing__label">Próxima audiencia</Text>
        <Text className="lx-hearing__when">Mañana a las 9:00</Text>
        <Text className="lx-hearing__where">Juzgado 12 Civil de Bogotá</Text>
        <Button
          variant="primary"
          icon={<States value={s.reminded ? 'check' : 'bell'} states={{ bell: <BellRing size={14} strokeWidth={1.8} />, check: <Check size={14} strokeWidth={2.2} /> }} />}
          data-target="remind"
          className="lx-remind"
        >
          {s.reminded ? 'Recordatorio creado' : 'Recordarme'}
        </Button>
      </div>
      <div className="lx-facts">
        {[[52, 120], [44, 96], [60, 132]].map(([k, v], i) => (
          <div key={i} className="lx-fact"><Bar w={k} h={5} tone={2} /><Bar w={v} h={6} tone={3} /></div>
        ))}
      </div>
    </aside>
  )
}

function Scene({ s, layout }: { s: S; layout: Layout }) {
  const compact = layout === 'compact'
  const q = norm(s.query)
  const lead = (
    <div className="lx-crumbs">
      <Text className="lx-crumbs__view">Clientes</Text>
      {!compact && (
        <div className="lx-tabs">
          <span className="lx-tab" data-active><Text>Todos</Text></span>
          <span className="lx-tab"><Bar w={40} h={5} tone={3} /></span>
          <span className="lx-tab"><Bar w={48} h={5} tone={3} /></span>
        </div>
      )}
    </div>
  )
  const toolbar = (
    <div className="lx-tools">
      <Field
        value={s.query}
        placeholder="Buscar clientes"
        focused={s.focus}
        className="lx-search"
        leading={<Search size={13} strokeWidth={1.8} className="lx-icon" />}
        box={{ 'data-target': 'search', 'data-cursor': 'ibeam' }}
      />
      {!compact && (
        <span className="lx-tool lx-tool--display">
          <SlidersHorizontal size={13} strokeWidth={1.7} className="lx-icon" />
          <Bar w={36} h={5} tone={3} />
        </span>
      )}
    </div>
  )
  const list = (
    <div className="lx-content">
      <div className="lx-list" data-target="rest">
        {ROWS.map((r, i) => {
          const match = !q || (typeof r.name === 'string' && norm(r.name).includes(q))
          return (
            <Collapse key={i} open={match}>
              <ClientRow r={r} i={i} s={s} compact={compact} />
            </Collapse>
          )
        })}
        <Collapse open={!!q}>
          <div className="lx-group-head"><Text className="lx-group-head__text">Expedientes</Text></div>
          {CASES.map((c, i) => (
            <div key={i} className="lx-row lx-case">
              <StatusMark status={c.status} />
              <span className="lx-title">{typeof c.title === 'string' ? <Text className="lx-case__text">{c.title}</Text> : <Bar w={c.title} h={6} tone={3} />}</span>
              {!compact && <span className="lx-labels" />}
              <span className="lx-who" />
              {!compact && <span className="lx-date">{typeof c.ref === 'string' ? <Text className="lx-ref">{c.ref}</Text> : <Bar w={c.ref} h={5} tone={2} />}</span>}
            </div>
          ))}
        </Collapse>
      </div>
      <Peek s={s} compact={compact} />
    </div>
  )
  const props = { lead, toolbar, className: 'lx-window', body: { className: 'lx-body', 'data-crop': true } }
  return compact ? (
    <Window {...props}>{list}</Window>
  ) : (
    <Window {...props} sidebar={<Sidebar />} sidebarWidth={200}>
      {list}
    </Window>
  )
}

export default function LexClientes() {
  return (
    <Stage
      width={920}
      height={410}
      compact={{ below: 600, width: 358, height: 330 }}
      accent="#2e6b4f"
      initial={initial}
      poster={{ ...initial, query: 'valdes', hover: true, open: true, reminded: true }}
      script={script}
      cursor={{ at: { wide: { x: 620, y: 300 }, compact: { x: 220, y: 260 } } }}
      className="lx-stage"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} />}
    </Stage>
  )
}
