/* =========================================================
   Lex & Asociados — Directorio de clientes
   Vanilla JS · sin dependencias
   ========================================================= */
'use strict';

const D = window.LEX_DATA;

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, cls = '') => `<svg class="i ${cls}"><use href="#i-${n}"/></svg>`;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.22,1,.36,1)';
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sum = (arr, k) => arr.reduce((s, x) => s + (+x[k] || 0), 0);

const fmtMoney = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat('es-CO');

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const HOY = D.HOY;
const parseD = (s) => new Date(s + 'T00:00:00');
const diffDays = (s) => Math.round((parseD(s) - parseD(HOY)) / 864e5);
const fmtDate = (s) => { const d = parseD(s); return `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`; };
const rel = (s) => {
  const n = -diffDays(s);
  if (n <= 0) return 'hoy';
  if (n === 1) return 'ayer';
  if (n < 30) return `hace ${n} días`;
  const m = Math.round(n / 30);
  if (m < 12) return `hace ${m} ${m === 1 ? 'mes' : 'meses'}`;
  const y = Math.round(n / 365);
  return `hace ${y} ${y === 1 ? 'año' : 'años'}`;
};
const initials = (n) => n.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hue = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
const LAW = (id) => D.ABOGADOS.find((a) => a.id === id) || D.ABOGADOS[0];
const lawName = (a) => `${a.titulo} ${a.nombre}`;
const AREA = (a) => D.AREAS[a] || { color: '#868e96', icon: 'scale' };
const STATUS = {
  'Activo': { cls: 's-activo', color: 'var(--ok)' },
  'En revisión': { cls: 's-revision', color: 'var(--warn)' },
  'Potencial': { cls: 's-potencial', color: 'var(--info)' },
  'Inactivo': { cls: 's-inactivo', color: 'var(--off)' },
};
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/* ---------------------------------------------------------
   Persistencia (localStorage protegido)
   --------------------------------------------------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
const STORE_KEY = 'lex-clients-v1';
let clients = store.get(STORE_KEY, null) || JSON.parse(JSON.stringify(D.clientes));
const byId = (id) => clients.find((c) => c.id === id);
function save() { store.set(STORE_KEY, clients); updateNavCount(); updateSidebarHearing(); }

const F = {
  q: '', estado: 'all', area: 'all', abogado: 'all', tipo: 'all',
  fav: false, hearing: false, letter: '', sort: 'act:desc', page: 1,
  view: store.get('lex-view', 'grid'),
};
const PER_PAGE = 12;

/* ---------------------------------------------------------
   Componentes pequeños
   --------------------------------------------------------- */
const avatar = (name, cls = '', extra = '') => `<div class="avatar ${cls}" style="--h:${hue(name)}">${esc(initials(name))}${extra}</div>`;
const lawAvatar = (a, cls = 'xs') => `<div class="avatar ${cls} round" style="--h:${a.hue}">${esc(initials(a.nombre))}</div>`;
const badge = (estado) => `<span class="badge ${STATUS[estado]?.cls || ''}">${esc(estado)}</span>`;
const areaTag = (a) => `<span class="area-tag" style="--ac:${AREA(a).color}">${ic(AREA(a).icon)}${esc(a)}</span>`;
const tags = (list = []) => list.map((t) => `<span class="tag ${t === 'VIP' ? 'vip' : ''}">${esc(t)}</span>`).join('');

function countUp(root = document) {
  $$('[data-count]', root).forEach((el) => {
    const to = +el.dataset.count;
    const f = el.dataset.fmt || 'int';
    const out = (v) => (f === 'money' ? fmtCompact.format(v) : f === 'pct' ? Math.round(v) + '%' : fmtInt.format(Math.round(v)));
    if (reduced) { el.textContent = out(to); return; }
    const dur = 1400, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = out(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function fillBars(root = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.bar i[data-w]', root).forEach((b) => { b.style.width = b.dataset.w + '%'; });
  }));
}

/* Curva suave (Catmull-Rom → Bézier) */
function smooth(p) {
  if (p.length < 2) return '';
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = 1 / 6;
    d += ` C ${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function sparkSVG(vals) {
  const w = 120, h = 54, mn = Math.min(...vals), mx = Math.max(...vals);
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 6 - ((v - mn) / (mx - mn || 1)) * (h - 18)]);
  const d = smooth(pts);
  return `<svg class="kpi-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path class="a" d="${d} L ${w} ${h} L 0 ${h} Z"/><path class="l" d="${d}" vector-effect="non-scaling-stroke"/></svg>`;
}
const niceMax = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e; };

/* ---------------------------------------------------------
   Toasts
   --------------------------------------------------------- */
function toast(msg, { type = 'ok', action = null, duration = 3800 } = {}) {
  const colors = { ok: 'var(--ok)', info: 'var(--gold)', bad: 'var(--bad)' };
  const icons = { ok: 'check', info: 'alert', bad: 'trash' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.setProperty('--tc', colors[type]);
  el.innerHTML = `<span class="t-ic">${ic(icons[type])}</span><p>${msg}</p>${action ? `<button>${ic('undo', 'sm')}${esc(action.label)}</button>` : ''}<span class="t-bar" style="animation-duration:${duration}ms"></span>`;
  const kill = () => { if (el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => el.remove(), 350); };
  if (action) $('button', el).onclick = () => { action.fn(); kill(); };
  $('#toasts').appendChild(el);
  let timer = setTimeout(kill, duration);
  el.onmouseenter = () => { clearTimeout(timer); $('.t-bar', el).style.animationPlayState = 'paused'; };
  el.onmouseleave = () => { timer = setTimeout(kill, 1500); $('.t-bar', el).style.animationPlayState = 'running'; };
  const all = $$('.toast:not(.out)'); if (all.length > 4) all[0].classList.add('out');
}

/* ---------------------------------------------------------
   Router
   --------------------------------------------------------- */
let current = null;
const parseHash = () => { const p = location.hash.replace(/^#\/?/, '').split('/'); return { page: p[0] || 'dashboard', id: p[1] || null }; };

function route() {
  const { page, id } = parseHash();
  const p = page === 'clientes' ? 'clientes' : 'dashboard';
  if (p !== current) {
    current = p;
    closeDrawer(true);
    p === 'clientes' ? renderClients() : renderDashboard();
    window.scrollTo({ top: 0 });
    document.title = (p === 'clientes' ? 'Clientes' : 'Dashboard') + ' · Lex & Asociados';
  }
  if (p === 'clientes' && id) openDrawer(id); else closeDrawer(true);
  setActiveNav(p);
  toggleSidebarMobile(false);
}

function setActiveNav(p) {
  const links = $$('#nav a[data-route]');
  links.forEach((a) => a.classList.toggle('active', a.dataset.route === p));
  const act = links.find((a) => a.dataset.route === p);
  const ind = $('#navIndicator');
  if (act) { ind.style.transform = `translateY(${act.offsetTop}px)`; ind.style.opacity = 1; }
}

function updateNavCount() { $('#navCount').textContent = clients.length; }

function updateSidebarHearing() {
  const next = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)
    .sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia))[0];
  const card = $('.sb-card');
  if (!next) { $('strong', card).textContent = 'Agenda libre'; $('#sbHearing').textContent = 'No hay audiencias programadas.'; return; }
  const d = diffDays(next.proximaAudiencia);
  $('strong', card).textContent = d === 0 ? 'Audiencia hoy' : 'Próxima audiencia';
  $('#sbHearing').textContent = `${next.nombre} · ${d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`}`;
  $('.sb-card-link', card).setAttribute('href', `#/clientes/${next.id}`);
}

/* =========================================================
   DASHBOARD
   ========================================================= */
let chartMode = 'clientes';

function renderDashboard() {
  const activos = clients.filter((c) => c.estado === 'Activo');
  const casos = clients.flatMap((c) => c.casos.map((k) => ({ ...k, cliente: c })));
  const abiertos = casos.filter((k) => k.estado !== 'Cerrado');
  const altas = abiertos.filter((k) => k.prioridad === 'Alta').length;
  const facturado = sum(clients, 'facturado'), pendiente = sum(clients, 'pendiente');
  const recaudo = facturado ? Math.round((1 - pendiente / facturado) * 100) : 0;
  const s = D.serie, last = s[s.length - 1], prev = s[s.length - 2];
  const pct = (a, b) => Math.round(((a - b) / (b || 1)) * 100);
  const proximas = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)
    .sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia));
  const semana = proximas.filter((c) => diffDays(c.proximaAudiencia) <= 7).length;
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';

  const kpis = [
    { label: 'Clientes activos', value: activos.length, fmt: 'int', icon: 'users', color: 'var(--info)', delta: pct(last.nuevos, prev.nuevos), spark: s.map((x) => x.nuevos) },
    { label: 'Casos abiertos', value: abiertos.length, fmt: 'int', icon: 'briefcase', color: 'var(--gold)', delta: pct(abiertos.length, abiertos.length - 3), spark: s.map((x, i) => x.nuevos * 2 - x.cerrados + i) },
    { label: 'Ingresos del mes', value: last.ingresos, fmt: 'money', icon: 'wallet', color: 'var(--ok)', delta: pct(last.ingresos, prev.ingresos), spark: s.map((x) => x.ingresos) },
    { label: 'Cartera por cobrar', value: pendiente, fmt: 'money', icon: 'clock', color: 'var(--bad)', delta: -6, spark: s.map((x, i) => 50 - i * 2 + (x.cerrados % 5) * 3) },
  ];

  const lawLoad = D.ABOGADOS.map((a) => {
    const mine = clients.filter((c) => c.abogado === a.id && c.estado !== 'Inactivo');
    return { a, n: mine.length, casos: mine.reduce((t, c) => t + c.casos.filter((k) => k.estado !== 'Cerrado').length, 0) };
  });
  const maxLoad = Math.max(1, ...lawLoad.map((x) => x.casos));

  const feed = clients.flatMap((c) => c.timeline.map((t) => ({ ...t, c })))
    .sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
  const recientes = [...clients].sort((a, b) => b.desde.localeCompare(a.desde)).slice(0, 6);

  $('#view').innerHTML = `
  <section class="page-head">
    <div>
      <div class="crumbs">Inicio ${ic('chev-r')} Dashboard</div>
      <h1 class="page-title">Panel de <em>control</em></h1>
      <p class="page-sub">Resumen general de la firma · ${fmtDate(HOY)}</p>
    </div>
    <div class="head-actions">
      <a class="btn btn-ghost" href="#/clientes">${ic('users')} Ver directorio</a>
      <button class="btn btn-primary" data-act="new">${ic('plus', 'spin-on-hover')} Nuevo cliente</button>
    </div>
  </section>

  <div class="grid-dash stagger">
    <section class="card hero col-12" style="--i:0">
      <svg class="hero-lines" viewBox="0 0 200 200" fill="none" stroke="#fff" stroke-width=".5">
        ${[90, 75, 60, 45, 30].map((r) => `<circle cx="100" cy="100" r="${r}" stroke-dasharray="${r / 6} 4"/>`).join('')}
        ${Array.from({ length: 12 }, (_, i) => `<line x1="100" y1="100" x2="${100 + 95 * Math.cos(i * Math.PI / 6)}" y2="${100 + 95 * Math.sin(i * Math.PI / 6)}"/>`).join('')}
      </svg>
      <div class="hero-content">
        <span class="hero-eyebrow">${saludo}, Elena</span>
        <h2>Tienes <em>${semana} audiencia${semana === 1 ? '' : 's'}</em> esta semana y ${altas} caso${altas === 1 ? '' : 's'} de alta prioridad.</h2>
        <p>La cartera de clientes creció un ${pct(last.nuevos, prev.nuevos)}% frente al mes anterior. Revisa los expedientes que requieren atención inmediata.</p>
        <div class="hero-actions">
          <a class="btn btn-gold" href="#/clientes">${ic('users')} Abrir directorio</a>
          <button class="btn btn-glass" data-act="palette">${ic('search')} Búsqueda rápida</button>
        </div>
      </div>
      <div class="hero-stat">
        <svg class="ring" viewBox="0 0 132 132">
          <defs><linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9a4"/><stop offset="1" stop-color="#c4964a"/></linearGradient></defs>
          <circle class="bg" cx="66" cy="66" r="56"/>
          <circle class="fg" cx="66" cy="66" r="56" stroke-dasharray="351.86" stroke-dashoffset="351.86" data-ring="${recaudo}"/>
        </svg>
        <div class="ring-label"><strong data-count="${recaudo}" data-fmt="pct">0%</strong><span>tasa de recaudo</span></div>
      </div>
    </section>

    ${kpis.map((k, i) => `
      <section class="card kpi col-3" style="--i:${i + 1};--kc:${k.color}">
        <div class="kpi-top">
          <span class="kpi-ic">${ic(k.icon)}</span>
          <span class="delta ${k.delta >= 0 ? 'up' : 'down'}">${ic('trend')}${k.delta >= 0 ? '+' : ''}${k.delta}%</span>
        </div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-value" data-count="${k.value}" data-fmt="${k.fmt}">0</div>
        ${sparkSVG(k.spark)}
      </section>`).join('')}

    <section class="card col-8" style="--i:5">
      <div class="card-head">
        <div><h3>Evolución de la cartera</h3><p>Últimos 12 meses</p></div>
        <div class="seg" id="chartSeg"><span class="seg-pill"></span>
          <button data-mode="clientes" class="${chartMode === 'clientes' ? 'on' : ''}">Clientes</button>
          <button data-mode="ingresos" class="${chartMode === 'ingresos' ? 'on' : ''}">Ingresos</button>
        </div>
      </div>
      <div class="card-body">
        <div class="chart-legend" id="chartLegend"></div>
        <div class="chart-wrap" id="mainChart"></div>
      </div>
    </section>

    <section class="card col-4" style="--i:6">
      <div class="card-head"><div><h3>Clientes por área</h3><p>Distribución por especialidad</p></div></div>
      <div class="card-body"><div class="donut-wrap" id="donut"></div></div>
    </section>

    <section class="card col-8" style="--i:7">
      <div class="card-head">
        <div><h3>Clientes recientes</h3><p>Últimas incorporaciones a la firma</p></div>
        <a class="link-more" href="#/clientes">Ver todos ${ic('chev-r')}</a>
      </div>
      <div class="card-body table-wrap">
        <table>
          <thead><tr><th>Cliente</th><th>Área</th><th>Responsable</th><th class="num">Facturado</th></tr></thead>
          <tbody>
            ${recientes.map((c) => `
              <tr data-open="${c.id}">
                <td><div class="cell-client">${avatar(c.nombre, 'sm', `<span class="status-dot" style="background:${STATUS[c.estado]?.color}" title="${esc(c.estado)}"></span>`)}<div><strong>${esc(c.nombre)}</strong><small>Desde ${fmtDate(c.desde)} · ${esc(c.estado)}</small></div></div></td>
                <td>${areaTag(c.area)}</td>
                <td><span title="${esc(lawName(LAW(c.abogado)))}">${lawAvatar(LAW(c.abogado))}</span></td>
                <td class="num"><b>${fmtCompact.format(c.facturado)}</b></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card col-4" style="--i:8">
      <div class="card-head"><div><h3>Próximas audiencias</h3><p>${proximas.length} programadas</p></div><span class="kpi-ic" style="--kc:var(--gold);width:36px;height:36px">${ic('gavel')}</span></div>
      <div class="card-body">
        ${proximas.slice(0, 5).map((c) => {
          const d = parseD(c.proximaAudiencia), dd = diffDays(c.proximaAudiencia);
          const caso = c.casos.find((k) => k.estado !== 'Cerrado') || c.casos[0];
          return `<div class="hearing" data-open="${c.id}">
            <div class="date-chip ${dd === 0 ? 'today' : ''}"><b>${d.getDate()}</b><small>${MES[d.getMonth()]}</small></div>
            <div class="hearing-info"><strong>${esc(c.nombre)}</strong><span>${esc(caso ? caso.titulo : c.area)}</span></div>
            <span class="tag">${dd === 0 ? 'Hoy' : dd === 1 ? 'Mañana' : `${dd} días`}</span>
          </div>`;
        }).join('') || '<p class="page-sub">Sin audiencias programadas.</p>'}
      </div>
    </section>

    <section class="card col-5" style="--i:9">
      <div class="card-head"><div><h3>Carga por abogado</h3><p>Casos abiertos asignados</p></div></div>
      <div class="card-body">
        ${lawLoad.map(({ a, n, casos: k }) => `
          <div class="load-row">
            ${lawAvatar(a, 'sm')}
            <div class="info">
              <div><strong>${esc(lawName(a))}</strong><span>${n} clientes · ${k} casos</span></div>
              <div class="bar" style="--bc:hsl(${a.hue} 60% 50%)"><i data-w="${Math.round((k / maxLoad) * 100)}"></i></div>
            </div>
          </div>`).join('')}
      </div>
    </section>

    <section class="card col-7" style="--i:10">
      <div class="card-head"><div><h3>Actividad reciente</h3><p>Movimientos en los expedientes</p></div></div>
      <div class="card-body">
        <div class="feed">
          ${feed.map((f) => `
            <div class="feed-item">
              <p><b>${esc(f.c.nombre)}</b> — ${esc(f.texto)}</p>
              <small>${rel(f.fecha)} · ${esc(lawName(LAW(f.c.abogado)))}</small>
            </div>`).join('')}
        </div>
      </div>
    </section>
  </div>`;

  countUp($('#view'));
  fillBars($('#view'));
  requestAnimationFrame(() => {
    const ring = $('[data-ring]');
    if (ring) requestAnimationFrame(() => { ring.style.strokeDashoffset = 351.86 * (1 - ring.dataset.ring / 100); });
    segPill($('#chartSeg'));
    drawMainChart(true);
    drawDonut();
  });
}

function segPill(seg) {
  if (!seg) return;
  const on = $('button.on', seg), pill = $('.seg-pill', seg);
  if (on && pill) { pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px'; }
}

function drawMainChart(animate) {
  const wrap = $('#mainChart');
  if (!wrap) return;
  const W = wrap.clientWidth, H = wrap.clientHeight, P = { l: 52, r: 14, t: 16, b: 30 };
  const s = D.serie, labels = s.map((x) => x.mes);
  const money = chartMode === 'ingresos';
  const series = money
    ? [{ name: 'Ingresos', color: 'var(--gold)', vals: s.map((x) => x.ingresos) }]
    : [{ name: 'Nuevos clientes', color: 'var(--gold)', vals: s.map((x) => x.nuevos) },
       { name: 'Casos cerrados', color: 'var(--primary)', vals: s.map((x) => x.cerrados) }];
  const max = niceMax(Math.max(...series.flatMap((x) => x.vals)) * 1.1);
  const step = (W - P.l - P.r) / (labels.length - 1);
  const X = (i) => P.l + i * step;
  const Y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const fA = (v) => (money ? fmtCompact.format(v) : fmtInt.format(v));

  $('#chartLegend').innerHTML = series.map((x) => `<span><i style="background:${x.color}"></i>${x.name}</span>`).join('');

  let svg = `<svg viewBox="0 0 ${W} ${H}"><defs>`;
  series.forEach((x, i) => { svg += `<linearGradient id="ag${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${x.color};stop-opacity:.28"/><stop offset="1" style="stop-color:${x.color};stop-opacity:0"/></linearGradient>`; });
  svg += '</defs>';
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4, y = Y(v);
    svg += `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text class="axis" x="${P.l - 10}" y="${y + 4}" text-anchor="end">${fA(v)}</text>`;
  }
  labels.forEach((l, i) => { svg += `<text class="axis" x="${X(i)}" y="${H - 8}" text-anchor="middle">${l}</text>`; });
  series.forEach((x, i) => {
    const pts = x.vals.map((v, j) => [X(j), Y(v)]);
    const d = smooth(pts);
    svg += `<path class="area" d="${d} L ${X(pts.length - 1)} ${H - P.b} L ${X(0)} ${H - P.b} Z" fill="url(#ag${i})" style="${animate ? '' : 'animation:none;opacity:1'}"/>`;
    svg += `<path class="line" d="${d}" style="stroke:${x.color}"/>`;
  });
  svg += `<line class="guide" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}"/>`;
  series.forEach((x, i) => { svg += `<circle class="dot" data-s="${i}" r="5.5" style="fill:var(--surface);stroke:${x.color};stroke-width:3"/>`; });
  svg += '</svg><div class="chart-tip"></div>';
  wrap.innerHTML = svg;

  if (animate && !reduced) {
    $$('.line', wrap).forEach((p, i) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.style.animationDelay = i * 180 + 'ms';
      p.classList.add('draw');
    });
  }

  const guide = $('.guide', wrap), tip = $('.chart-tip', wrap), dots = $$('.dot', wrap);
  wrap.onmousemove = (e) => {
    const r = wrap.getBoundingClientRect();
    const i = Math.max(0, Math.min(labels.length - 1, Math.round((e.clientX - r.left - P.l) / step)));
    const x = X(i);
    wrap.classList.add('hovering');
    guide.setAttribute('x1', x); guide.setAttribute('x2', x);
    dots.forEach((d) => { d.setAttribute('cx', x); d.setAttribute('cy', Y(series[d.dataset.s].vals[i])); });
    tip.innerHTML = `<strong>${labels[i]} 2026</strong>` + series.map((sr) => `<div><span><i style="background:${sr.color}"></i>${sr.name}</span><b>${fA(sr.vals[i])}</b></div>`).join('');
    const tw = tip.offsetWidth;
    const top = Math.min(...series.map((sr) => Y(sr.vals[i])));
    tip.style.left = (x + 16 + tw > W ? x - tw - 16 : x + 16) + 'px';
    tip.style.top = Math.max(0, top - 30) + 'px';
  };
  wrap.onmouseleave = () => wrap.classList.remove('hovering');
}

function drawDonut() {
  const box = $('#donut');
  if (!box) return;
  const counts = Object.keys(D.AREAS).map((a) => ({ a, n: clients.filter((c) => c.area === a).length, color: AREA(a).color })).filter((x) => x.n);
  const total = counts.reduce((t, x) => t + x.n, 0) || 1;
  const r = 78, C = 2 * Math.PI * r;
  let off = 0;
  const segs = counts.map((x, i) => {
    const len = (x.n / total) * C;
    const html = `<circle cx="100" cy="100" r="${r}" stroke="${x.color}" stroke-dasharray="0 ${C}" stroke-dashoffset="${-off}" data-len="${Math.max(0, len - 3)}" data-area="${esc(x.a)}" style="transition-delay:${i * 90}ms"/>`;
    off += len;
    return html;
  });
  box.innerHTML = `
    <div class="donut"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="${r}" stroke="var(--line-2)" stroke-width="22" fill="none"/>${segs.join('')}</svg>
      <div class="donut-center"><strong id="dnNum">${total}</strong><span id="dnLbl">clientes en total</span></div></div>
    <div class="donut-legend">${counts.map((x) => `<button data-area="${esc(x.a)}"><i style="background:${x.color}"></i><span>${esc(x.a)}</span><b>${x.n}</b></button>`).join('')}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('circle[data-len]', box).forEach((c) => { c.setAttribute('stroke-dasharray', `${c.dataset.len} ${C}`); c.style.strokeDasharray = `${c.dataset.len} ${C}`; });
  }));
  const hl = (a) => {
    $$('[data-area]', box).forEach((el) => {
      el.classList.toggle('hl', el.dataset.area === a);
      if (el.tagName === 'circle') el.classList.toggle('dim', !!a && el.dataset.area !== a);
    });
    const x = counts.find((k) => k.a === a);
    $('#dnNum').textContent = x ? x.n : total;
    $('#dnLbl').textContent = x ? x.a : 'clientes en total';
    $('#dnNum').animate([{ transform: 'scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 350, easing: EASE });
  };
  $$('[data-area]', box).forEach((el) => {
    el.addEventListener('mouseenter', () => hl(el.dataset.area));
    el.addEventListener('mouseleave', () => hl(null));
    el.addEventListener('click', () => { resetFilters(); F.area = el.dataset.area; location.hash = '#/clientes'; });
  });
}

/* =========================================================
   DIRECTORIO DE CLIENTES
   ========================================================= */
const SORTS = [
  ['act:desc', 'Actividad reciente'], ['act:asc', 'Actividad más antigua'],
  ['nom:asc', 'Nombre A–Z'], ['nom:desc', 'Nombre Z–A'],
  ['fac:desc', 'Mayor facturación'], ['fac:asc', 'Menor facturación'],
  ['cas:desc', 'Más casos'], ['cas:asc', 'Menos casos'],
  ['des:asc', 'Clientes más antiguos'], ['des:desc', 'Clientes más nuevos'],
];
const CMP = {
  nom: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  act: (a, b) => a.ultimaActividad.localeCompare(b.ultimaActividad),
  fac: (a, b) => a.facturado - b.facturado,
  cas: (a, b) => a.casos.length - b.casos.length,
  des: (a, b) => a.desde.localeCompare(b.desde),
};
const firstLetter = (c) => norm(c.nombre).charAt(0).toUpperCase();

function matches(c, skip = '') {
  if (skip !== 'estado' && F.estado !== 'all' && c.estado !== F.estado) return false;
  if (F.area !== 'all' && c.area !== F.area) return false;
  if (F.abogado !== 'all' && c.abogado !== F.abogado) return false;
  if (F.tipo !== 'all' && c.tipo !== F.tipo) return false;
  if (F.fav && !c.favorito) return false;
  if (F.hearing && !(c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)) return false;
  if (skip !== 'letter' && F.letter && firstLetter(c) !== F.letter) return false;
  if (F.q) {
    const hay = norm([c.nombre, c.email, c.ciudad, c.area, c.documento, c.contacto, c.estado, c.telefono, LAW(c.abogado).nombre, ...(c.etiquetas || [])].join(' '));
    if (!norm(F.q).split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
  }
  return true;
}
function filtered() {
  const [k, dir] = F.sort.split(':');
  return clients.filter((c) => matches(c)).sort((a, b) => CMP[k](a, b) * (dir === 'desc' ? -1 : 1));
}
function resetFilters() { Object.assign(F, { q: '', estado: 'all', area: 'all', abogado: 'all', tipo: 'all', fav: false, hearing: false, letter: '', page: 1 }); }

let skeletonDone = false;

function renderClients() {
  $('#view').innerHTML = `
  <section class="page-head">
    <div>
      <div class="crumbs">Inicio ${ic('chev-r')} Clientes</div>
      <h1 class="page-title">Directorio de <em>clientes</em></h1>
      <p class="page-sub">Gestiona la relación con cada cliente, sus casos y su estado de cuenta.</p>
    </div>
    <div class="head-actions">
      <button class="btn btn-ghost" data-act="export">${ic('download')} Exportar CSV</button>
      <button class="btn btn-primary" data-act="new">${ic('plus', 'spin-on-hover')} Nuevo cliente</button>
    </div>
  </section>

  <section class="stats-strip stagger" id="stats"></section>

  <section class="toolbar">
    <div class="field search-box" id="searchBox">
      ${ic('search')}
      <input class="input" id="q" placeholder="Buscar nombre, NIT, ciudad…" value="${esc(F.q)}" autocomplete="off" aria-label="Buscar clientes" />
      <button class="clear" data-act="clearq" aria-label="Limpiar búsqueda">${ic('x', 'sm')}</button>
    </div>
    <select class="select" id="fArea" aria-label="Área de práctica">
      <option value="all">Todas las áreas</option>
      ${Object.keys(D.AREAS).map((a) => `<option ${F.area === a ? 'selected' : ''}>${esc(a)}</option>`).join('')}
    </select>
    <select class="select" id="fTipo" aria-label="Tipo de cliente">
      <option value="all">Empresas y personas</option>
      <option value="Empresa" ${F.tipo === 'Empresa' ? 'selected' : ''}>Solo empresas</option>
      <option value="Persona" ${F.tipo === 'Persona' ? 'selected' : ''}>Solo personas</option>
    </select>
    <div class="lawyer-filter" id="fLaw">
      ${D.ABOGADOS.map((a) => `<button data-law="${a.id}" data-tip="${esc(lawName(a))}" aria-label="${esc(lawName(a))}">${lawAvatar(a, 'xs')}</button>`).join('')}
    </div>
    <span class="spacer"></span>
    <button class="icon-btn fav-toggle" data-act="fav" title="Solo favoritos" aria-label="Solo favoritos">${ic('star')}</button>
  </section>

  <section class="chips" id="chips"></section>
  <section class="alpha" id="alpha"></section>
  <div class="result-line">
    <span id="resultLine"></span>
    <div class="result-tools">
      <select class="select" id="fSort" aria-label="Ordenar">
        ${SORTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
      <div class="seg" id="viewSeg"><span class="seg-pill"></span>
        <button data-view="grid" title="Tarjetas" aria-label="Vista de tarjetas">${ic('grid', 'sm')}</button>
        <button data-view="table" title="Lista" aria-label="Vista de lista">${ic('list', 'sm')}</button>
      </div>
    </div>
  </div>
  <section id="results"></section>
  <nav class="pager" id="pager"></nav>`;

  $('#fSort').value = F.sort;
  $('#q').addEventListener('input', debounce((e) => { F.q = e.target.value.trim(); F.page = 1; updateList(); }, 140));
  $('#fArea').addEventListener('change', (e) => { F.area = e.target.value; F.page = 1; updateList(); });
  $('#fTipo').addEventListener('change', (e) => { F.tipo = e.target.value; F.page = 1; updateList(); });
  $('#fSort').addEventListener('change', (e) => { F.sort = e.target.value; updateList(); });

  renderStats();

  if (!skeletonDone && !reduced) {
    skeletonDone = true;
    $('#results').innerHTML = `<div class="clients-grid">${Array.from({ length: 8 }, () => `
      <div class="card client-card" style="pointer-events:none">
        <div class="cc-top"><div class="skel" style="width:44px;height:44px;border-radius:14px"></div>
          <div style="flex:1"><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:10px;width:45%;margin-top:8px"></div></div></div>
        <div class="skel" style="height:22px;width:60%;margin:18px 0 14px"></div>
        <div class="skel" style="height:10px;width:90%"></div><div class="skel" style="height:10px;width:65%;margin-top:9px"></div>
        <div class="skel" style="height:28px;width:100%;margin-top:18px"></div>
      </div>`).join('')}</div>`;
    syncControls();
    setTimeout(() => { if (current === 'clientes') updateList({ flip: false }); }, 650);
  } else {
    updateList({ flip: false });
  }
}

function renderStats() {
  const box = $('#stats');
  if (!box) return;
  const activos = clients.filter((c) => c.estado === 'Activo').length;
  const pendiente = sum(clients, 'pendiente');
  const aud = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0 && diffDays(c.proximaAudiencia) <= 30).length;
  const items = [
    { k: 'all', label: 'Clientes registrados', v: clients.length, fmt: 'int', icon: 'users', c: 'var(--primary)' },
    { k: 'activos', label: 'Clientes activos', v: activos, fmt: 'int', icon: 'check', c: 'var(--ok)' },
    { k: 'cobro', label: 'Cartera por cobrar', v: pendiente, fmt: 'money', icon: 'wallet', c: 'var(--warn)' },
    { k: 'aud', label: 'Audiencias (30 días)', v: aud, fmt: 'int', icon: 'gavel', c: 'var(--gold)' },
  ];
  box.innerHTML = items.map((x, i) => `
    <button class="card mini-stat" data-stat="${x.k}" style="--i:${i};--sc:${x.c}">
      <span class="kpi-ic">${ic(x.icon)}</span>
      <div style="text-align:left"><strong data-count="${x.v}" data-fmt="${x.fmt}">0</strong><span>${x.label}</span></div>
    </button>`).join('');
  countUp(box);
}

function syncControls() {
  $('#searchBox')?.classList.toggle('has', !!F.q);
  $('.fav-toggle')?.classList.toggle('on', F.fav);
  $$('#fLaw [data-law]').forEach((b) => b.classList.toggle('on', b.dataset.law === F.abogado));
  $$('#viewSeg [data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === F.view));
  segPill($('#viewSeg'));
  if ($('#fArea')) $('#fArea').value = F.area;
  if ($('#fTipo')) $('#fTipo').value = F.tipo;
  if ($('#fSort')) $('#fSort').value = F.sort;
  $$('[data-stat]').forEach((b) => b.classList.toggle('on',
    (b.dataset.stat === 'activos' && F.estado === 'Activo') ||
    (b.dataset.stat === 'aud' && F.hearing) ||
    (b.dataset.stat === 'cobro' && F.sort === 'fac:desc')));
}

function renderChips() {
  const base = clients.filter((c) => matches(c, 'estado'));
  const opts = ['all', ...D.ESTADOS];
  const pills = [];
  if (F.q) pills.push(['q', `“${esc(F.q)}”`]);
  if (F.area !== 'all') pills.push(['area', esc(F.area)]);
  if (F.tipo !== 'all') pills.push(['tipo', F.tipo === 'Empresa' ? 'Empresas' : 'Personas']);
  if (F.abogado !== 'all') pills.push(['abogado', esc(lawName(LAW(F.abogado)))]);
  if (F.fav) pills.push(['fav', 'Favoritos']);
  if (F.hearing) pills.push(['hearing', 'Con audiencia']);
  if (F.letter) pills.push(['letter', `Letra ${F.letter}`]);
  $('#chips').innerHTML = opts.map((e) => {
    const n = e === 'all' ? base.length : base.filter((c) => c.estado === e).length;
    return `<button class="chip ${F.estado === e ? 'on' : ''}" data-estado="${esc(e)}">${e === 'all' ? 'Todos' : esc(e)}<b>${n}</b></button>`;
  }).join('') + `<div class="active-filters">${pills.map(([k, l]) => `<span class="af">${l}<button data-rm="${k}" aria-label="Quitar filtro">${ic('x')}</button></span>`).join('')}${pills.length > 1 ? `<span class="af" style="background:var(--surface-2);color:var(--ink-2)">Limpiar todo<button data-act="reset" aria-label="Limpiar todo">${ic('x')}</button></span>` : ''}</div>`;
}

function renderAlpha() {
  const avail = new Set(clients.filter((c) => matches(c, 'letter')).map(firstLetter));
  $('#alpha').innerHTML = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').filter((l) => l !== 'Ñ').map((l) =>
    `<button data-letter="${l}" class="${F.letter === l ? 'on' : ''}" ${avail.has(l) || F.letter === l ? '' : 'disabled'}>${l}</button>`).join('');
}

function cardHTML(c) {
  const a = LAW(c.abogado), ar = AREA(c.area);
  const abiertos = c.casos.filter((k) => k.estado !== 'Cerrado').length;
  return `
  <article class="card client-card" data-key="${c.id}" data-open="${c.id}" style="--ac:${ar.color}" tabindex="0">
    <span class="cc-ribbon"></span>
    <div class="cc-top">
      ${avatar(c.nombre, '', `<span class="status-dot" style="background:${STATUS[c.estado]?.color}"></span>`)}
      <div class="cc-name">
        <strong title="${esc(c.nombre)}">${esc(c.nombre)}</strong>
        <span>${ic(c.tipo === 'Empresa' ? 'building' : 'user')}${esc(c.tipo)} · ${esc(c.ciudad)}</span>
      </div>
      <button class="star-btn ${c.favorito ? 'on' : ''}" data-fav="${c.id}" aria-label="Favorito">${ic('star')}</button>
    </div>
    <div class="cc-meta">${badge(c.estado)}${areaTag(c.area)}${tags(c.etiquetas)}</div>
    <div class="cc-contact">
      <div>${ic('mail')}<span>${esc(c.email)}</span></div>
      <div>${ic('phone')}<span>${esc(c.telefono)}</span></div>
    </div>
    <div class="cc-foot">
      <div class="lawyer">${lawAvatar(a)}<div><b>${esc(lawName(a))}</b>Responsable</div></div>
      <div class="cc-cases"><b>${abiertos}</b>caso${abiertos === 1 ? '' : 's'} abierto${abiertos === 1 ? '' : 's'}</div>
    </div>
    <div class="cc-quick">
      <a href="mailto:${esc(c.email)}" data-stop title="Enviar correo" aria-label="Enviar correo">${ic('mail')}</a>
      <a href="tel:${esc(c.telefono.replace(/\s/g, ''))}" data-stop title="Llamar" aria-label="Llamar">${ic('phone')}</a>
      <button data-edit="${c.id}" title="Editar" aria-label="Editar">${ic('edit')}</button>
    </div>
  </article>`;
}

function tableHTML(list) {
  const [k, dir] = F.sort.split(':');
  const th = (key, label, cls = '') => `<th class="sortable ${cls} ${k === key ? dir : ''}" data-sort="${key}">${label}${k === key ? ic('chev-d') : ''}</th>`;
  return `<div class="card table-card"><div class="table-wrap"><table>
    <thead><tr>${th('nom', 'Cliente')}<th>Área</th><th>Estado</th><th>Responsable</th>${th('cas', 'Casos', 'num')}${th('fac', 'Facturado', 'num')}${th('act', 'Última actividad')}<th></th></tr></thead>
    <tbody>${list.map((c) => {
      const a = LAW(c.abogado);
      return `<tr data-key="${c.id}" data-open="${c.id}">
        <td><div class="cell-client">${avatar(c.nombre, 'sm', `<span class="status-dot" style="background:${STATUS[c.estado]?.color}"></span>`)}<div><strong>${esc(c.nombre)}</strong><small>${esc(c.email)}</small></div></div></td>
        <td>${areaTag(c.area)}</td>
        <td>${badge(c.estado)}</td>
        <td><div class="cell-client">${lawAvatar(a)}<small>${esc(lawName(a))}</small></div></td>
        <td class="num"><b>${c.casos.length}</b></td>
        <td class="num">${fmtMoney.format(c.facturado)}</td>
        <td><small style="color:var(--muted)">${rel(c.ultimaActividad)}</small></td>
        <td><div style="display:flex;gap:2px;justify-content:flex-end">
          <button class="star-btn ${c.favorito ? 'on' : ''}" data-fav="${c.id}" aria-label="Favorito">${ic('star')}</button>
          <button class="star-btn" data-edit="${c.id}" aria-label="Editar">${ic('edit')}</button>
          <button class="star-btn" data-del="${c.id}" aria-label="Eliminar">${ic('trash')}</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody></table></div></div>`;
}

function updateList({ flip = true } = {}) {
  const box = $('#results');
  if (!box) return;
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  F.page = Math.min(Math.max(1, F.page), pages);
  const from = (F.page - 1) * PER_PAGE;
  const items = list.slice(from, from + PER_PAGE);

  syncControls();
  renderChips();
  renderAlpha();
  $('#resultLine').innerHTML = list.length
    ? `Mostrando <b>${from + 1}–${from + items.length}</b> de <b>${list.length}</b> cliente${list.length === 1 ? '' : 's'}`
    : 'Sin coincidencias';

  const old = new Map($$('[data-key]', box).map((el) => [el.dataset.key, el.getBoundingClientRect()]));
  box.innerHTML = !list.length
    ? `<div class="card empty"><div class="em-ic">${ic('search')}</div><h3>Sin resultados</h3><p>Ningún cliente coincide con los filtros aplicados.</p><button class="btn btn-primary" data-act="reset">${ic('undo')} Limpiar filtros</button></div>`
    : F.view === 'grid' ? `<div class="clients-grid">${items.map(cardHTML).join('')}</div>` : tableHTML(items);

  if (!reduced) {
    let n = 0;
    $$('[data-key]', box).forEach((el) => {
      const o = flip && old.get(el.dataset.key);
      if (o) {
        const r = el.getBoundingClientRect();
        const dx = o.left - r.left, dy = o.top - r.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 550, easing: EASE });
      } else {
        el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay: Math.min(n++, 12) * 40, easing: EASE, fill: 'backwards' });
      }
    });
  }

  $('#pager').innerHTML = pages > 1 ? `
    <button data-page="${F.page - 1}" ${F.page === 1 ? 'disabled' : ''} aria-label="Anterior">${ic('chev-l')}</button>
    ${Array.from({ length: pages }, (_, i) => `<button data-page="${i + 1}" class="${F.page === i + 1 ? 'on' : ''}">${i + 1}</button>`).join('')}
    <button data-page="${F.page + 1}" ${F.page === pages ? 'disabled' : ''} aria-label="Siguiente">${ic('chev-r')}</button>` : '';
}

function refresh() {
  if (current === 'clientes') { renderStats(); updateList(); } else renderDashboard();
  if (drawerId) { const c = byId(drawerId); c ? renderDrawer(c) : closeDrawer(); }
}

/* ---------- Favoritos con micro-explosión ---------- */
function toggleFav(id, btn) {
  const c = byId(id);
  if (!c) return;
  c.favorito = !c.favorito;
  save();
  $$(`[data-fav="${id}"]`).forEach((b) => b.classList.toggle('on', c.favorito));
  if (c.favorito && btn && !reduced) {
    btn.classList.remove('burst'); void btn.offsetWidth; btn.classList.add('burst');
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('span');
      const ang = (i / 8) * Math.PI * 2;
      s.className = 'spark';
      s.style.setProperty('--dx', Math.cos(ang) * 22 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 22 + 'px');
      btn.appendChild(s);
      setTimeout(() => s.remove(), 650);
    }
  }
  toast(c.favorito ? `<b>${esc(c.nombre)}</b> añadido a favoritos` : `<b>${esc(c.nombre)}</b> quitado de favoritos`, { type: 'info', duration: 2400 });
  if (F.fav && current === 'clientes') setTimeout(updateList, 350);
}

/* =========================================================
   DRAWER DE DETALLE
   ========================================================= */
let drawerId = null, drawerTab = 'resumen';

function openDrawer(id) {
  const c = byId(id);
  if (!c) { location.hash = '#/clientes'; return; }
  if (drawerId !== id) drawerTab = 'resumen';
  drawerId = id;
  renderDrawer(c);
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  syncOverlay();
}

function closeDrawer(silent) {
  const dr = $('#drawer');
  if (!dr.classList.contains('open')) return;
  drawerId = null;
  dr.classList.remove('open');
  dr.setAttribute('aria-hidden', 'true');
  syncOverlay();
  if (!silent && parseHash().id) location.hash = '#/clientes';
}

function renderDrawer(c) {
  const ar = AREA(c.area);
  $('#drawer').innerHTML = `
    <div class="dr-hero" style="--ac:${ar.color}">
      <div class="dr-actions">
        <button class="icon-btn star-btn ${c.favorito ? 'on' : ''}" data-fav="${c.id}" title="Favorito" aria-label="Favorito">${ic('star')}</button>
        <button class="icon-btn" data-edit="${c.id}" title="Editar" aria-label="Editar">${ic('edit')}</button>
        <button class="icon-btn" data-act="close-drawer" title="Cerrar (Esc)" aria-label="Cerrar">${ic('x')}</button>
      </div>
      <div class="dr-id">
        ${avatar(c.nombre, 'xl')}
        <div><h2>${esc(c.nombre)}</h2><p>${esc(c.tipo)} · ${esc(c.documento)}</p></div>
      </div>
      <div class="dr-badges">${badge(c.estado)}${areaTag(c.area)}${tags(c.etiquetas)}</div>
      <div class="tabs" id="drTabs">
        <button data-tab="resumen">Resumen</button>
        <button data-tab="casos">Casos <b>${c.casos.length}</b></button>
        <button data-tab="actividad">Actividad</button>
        <span class="tab-line"></span>
      </div>
    </div>
    <div class="dr-body" id="drBody"></div>
    <div class="dr-foot">
      <a class="btn btn-ghost" href="mailto:${esc(c.email)}">${ic('mail')} Escribir</a>
      <a class="btn btn-ghost" href="tel:${esc(c.telefono.replace(/\s/g, ''))}">${ic('phone')} Llamar</a>
      <button class="btn btn-ghost" data-del="${c.id}" style="flex:none;color:var(--bad)" aria-label="Eliminar">${ic('trash')}</button>
    </div>`;
  renderTab(c);
}

function renderTab(c) {
  $$('#drTabs [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === drawerTab));
  const on = $('#drTabs button.on'), line = $('#drTabs .tab-line');
  requestAnimationFrame(() => { line.style.left = on.offsetLeft + 'px'; line.style.width = on.offsetWidth + 'px'; });
  const a = LAW(c.abogado);
  const pagado = c.facturado ? Math.round((1 - c.pendiente / c.facturado) * 100) : 0;
  let html = '';

  if (drawerTab === 'resumen') {
    const dd = c.proximaAudiencia ? diffDays(c.proximaAudiencia) : null;
    html = `
      <div class="info-grid">
        <div class="info-item copyable" data-copy="${esc(c.email)}" title="Clic para copiar"><small>${ic('mail')}Correo</small><div>${esc(c.email)}</div></div>
        <div class="info-item copyable" data-copy="${esc(c.telefono)}" title="Clic para copiar"><small>${ic('phone')}Teléfono</small><div>${esc(c.telefono)}</div></div>
        <div class="info-item"><small>${ic('pin')}Ciudad</small><div>${esc(c.ciudad)}</div></div>
        <div class="info-item"><small>${ic('calendar')}Cliente desde</small><div>${fmtDate(c.desde)} <span style="color:var(--muted);font-weight:400">· ${rel(c.desde)}</span></div></div>
        ${c.contacto ? `<div class="info-item"><small>${ic('user')}Contacto</small><div>${esc(c.contacto)}</div></div>` : ''}
        <div class="info-item ${c.contacto ? '' : 'full'}"><small>${ic('scale')}Responsable</small><div style="display:flex;align-items:center;gap:8px">${lawAvatar(a)}${esc(lawName(a))}</div></div>
      </div>
      <div class="sec-title">Estado de cuenta</div>
      <div class="money-row">
        <div class="money gold"><small>Total facturado</small><strong>${fmtMoney.format(c.facturado)}</strong></div>
        <div class="money"><small>Pendiente por cobrar</small><strong style="color:${c.pendiente ? 'var(--warn)' : 'var(--ok)'}">${fmtMoney.format(c.pendiente)}</strong>
          <div class="bar" style="--bc:var(--ok)"><i data-w="${pagado}"></i></div>
          <small>${pagado}% recaudado</small></div>
      </div>
      <div class="sec-title">Relación</div>
      <div class="info-grid">
        <div class="info-item"><small>${ic('star')}Satisfacción</small><div class="rating">${Array.from({ length: 5 }, (_, i) => ic('star', i < c.satisfaccion ? 'f' : '')).join('')}</div></div>
        <div class="info-item"><small>${ic('gavel')}Próxima audiencia</small><div>${c.proximaAudiencia ? `${fmtDate(c.proximaAudiencia)} <span class="tag">${dd === 0 ? 'Hoy' : dd === 1 ? 'Mañana' : `en ${dd} días`}</span>` : '<span style="color:var(--muted);font-weight:400">Sin programar</span>'}</div></div>
        <div class="info-item full"><small>${ic('file')}Notas internas</small><div>${esc(c.notas || 'Sin notas.')}</div></div>
      </div>`;
  } else if (drawerTab === 'casos') {
    html = c.casos.length ? c.casos.map((k, i) => `
      <div class="case" style="--i:${i}">
        <div class="case-top">
          <div><strong>${esc(k.titulo)}</strong><small>Exp. ${esc(k.expediente)} · ${esc(k.estado)}</small></div>
          <span class="prio ${k.prioridad}">${k.prioridad}</span>
        </div>
        <div class="bar" style="--bc:${k.estado === 'Cerrado' ? 'var(--ok)' : AREA(c.area).color}"><i data-w="${k.estado === 'Cerrado' ? 100 : k.progreso}"></i></div>
        <div class="case-foot"><span>Avance del proceso</span><span>${k.estado === 'Cerrado' ? 100 : k.progreso}%</span></div>
      </div>`).join('')
      : `<div class="empty" style="padding:30px 0"><div class="em-ic">${ic('briefcase')}</div><h3>Sin casos</h3><p>Este cliente aún no tiene procesos abiertos.</p></div>`;
  } else {
    html = `<div class="feed">${c.timeline.map((t) => `
      <div class="feed-item"><p>${esc(t.texto)}</p><small>${fmtDate(t.fecha)} · ${rel(t.fecha)}</small></div>`).join('')}</div>`;
  }
  const body = $('#drBody');
  body.innerHTML = `<div class="tab-pane">${html}</div>`;
  fillBars(body);
}

/* =========================================================
   MODAL: crear / editar / confirmar
   ========================================================= */
function openModal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
  m.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => m.classList.add('open'));
  syncOverlay(true);
}
function closeModal() {
  const m = $('#modal');
  if (m.getAttribute('aria-hidden') === 'true') return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  setTimeout(() => { if (!m.classList.contains('open')) m.innerHTML = ''; }, 400);
  syncOverlay();
}
const modalOpen = () => $('#modal').getAttribute('aria-hidden') === 'false';

function openForm(id) {
  const c = id ? byId(id) : null;
  const v = c || { tipo: 'Empresa', nombre: '', documento: '', email: '', telefono: '', ciudad: 'Bogotá', area: 'Corporativo', estado: 'Potencial', abogado: 'ev', etiquetas: [], notas: '' };
  const cities = [...new Set(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', v.ciudad])];
  const opt = (arr, sel) => arr.map((x) => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${val === sel ? 'selected' : ''}>${esc(lab)}</option>`; }).join('');
  openModal(`
    <div class="modal-head">
      <span class="kpi-ic">${ic(c ? 'edit' : 'plus')}</span>
      <div><h3>${c ? 'Editar cliente' : 'Nuevo cliente'}</h3><p>${c ? esc(c.nombre) : 'Registra un cliente en el directorio de la firma'}</p></div>
      <button class="icon-btn" data-act="close-modal" aria-label="Cerrar">${ic('x')}</button>
    </div>
    <form class="form" id="clientForm" novalidate>
      <div class="type-toggle full">
        <label style="display:block"><input type="radio" name="tipo" value="Empresa" ${v.tipo === 'Empresa' ? 'checked' : ''}><span>${ic('building')} Empresa</span></label>
        <label style="display:block"><input type="radio" name="tipo" value="Persona" ${v.tipo === 'Persona' ? 'checked' : ''}><span>${ic('user')} Persona natural</span></label>
      </div>
      <label class="full">Nombre o razón social *<input class="input" name="nombre" value="${esc(v.nombre)}" placeholder="Ej. Grupo Horizonte S.A.S."><span class="err">Escribe al menos 3 caracteres.</span></label>
      <label>Documento / NIT<input class="input" name="documento" value="${esc(v.documento)}" placeholder="NIT 900.123.456-7"></label>
      <label>Ciudad<select class="select" name="ciudad">${opt(cities, v.ciudad)}</select></label>
      <label>Correo electrónico *<input class="input" name="email" type="email" value="${esc(v.email)}" placeholder="contacto@empresa.com"><span class="err">Introduce un correo válido.</span></label>
      <label>Teléfono<input class="input" name="telefono" value="${esc(v.telefono)}" placeholder="+57 300 000 0000"><span class="err">Número no válido.</span></label>
      <label>Área de práctica<select class="select" name="area">${opt(Object.keys(D.AREAS), v.area)}</select></label>
      <label>Estado<select class="select" name="estado">${opt(D.ESTADOS, v.estado)}</select></label>
      <label>Abogado responsable<select class="select" name="abogado">${opt(D.ABOGADOS.map((a) => [a.id, lawName(a)]), v.abogado)}</select></label>
      <label>Etiquetas<input class="input" name="etiquetas" value="${esc((v.etiquetas || []).join(', '))}" placeholder="VIP, Referido…"></label>
      <label class="full">Notas internas<textarea class="input" name="notas" placeholder="Preferencias, acuerdos, observaciones…">${esc(v.notas)}</textarea></label>
    </form>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
      <button class="btn btn-primary" data-act="save" data-id="${c ? c.id : ''}">${ic('check')} ${c ? 'Guardar cambios' : 'Crear cliente'}</button>
    </div>`);
  const form = $('#clientForm');
  form.addEventListener('submit', (e) => { e.preventDefault(); saveForm(c ? c.id : ''); });
  form.addEventListener('input', (e) => e.target.closest('label')?.classList.remove('invalid'));
  setTimeout(() => form.nombre.focus(), 120);
}

function saveForm(id) {
  const form = $('#clientForm');
  const val = (n) => form[n].value.trim();
  const errs = [];
  if (val('nombre').length < 3) errs.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) errs.push('email');
  if (val('telefono') && !/^[+\d][\d\s()-]{6,}$/.test(val('telefono'))) errs.push('telefono');
  $$('label', form).forEach((l) => l.classList.remove('invalid'));
  if (errs.length) {
    errs.forEach((n) => form[n].closest('label').classList.add('invalid'));
    const box = $('.modal-box');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    form[errs[0]].focus();
    return;
  }
  const data = {
    tipo: form.querySelector('[name="tipo"]:checked').value,
    nombre: val('nombre'), documento: val('documento'), email: val('email'), telefono: val('telefono') || '—',
    ciudad: val('ciudad'), area: val('area'), estado: val('estado'), abogado: val('abogado'),
    etiquetas: val('etiquetas').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
    notas: val('notas'),
  };
  let c;
  if (id) {
    c = byId(id);
    Object.assign(c, data, { ultimaActividad: HOY });
    c.timeline.unshift({ fecha: HOY, texto: 'Datos del cliente actualizados' });
    toast(`Cambios guardados en <b>${esc(c.nombre)}</b>`);
  } else {
    c = {
      id: 'c' + Date.now().toString(36), ...data, contacto: '',
      desde: HOY, ultimaActividad: HOY, proximaAudiencia: null,
      facturado: 0, pendiente: 0, satisfaccion: 5, favorito: false, casos: [],
      timeline: [{ fecha: HOY, texto: 'Cliente registrado en el directorio' }],
    };
    clients.unshift(c);
    toast(`<b>${esc(c.nombre)}</b> se añadió al directorio`);
  }
  save();
  closeModal();
  if (!id) {
    if (current !== 'clientes') { resetFilters(); F.sort = 'act:desc'; location.hash = '#/clientes'; }
    else { resetFilters(); F.sort = 'act:desc'; $('#q').value = ''; renderStats(); updateList(); }
    setTimeout(() => {
      const el = $(`[data-key="${c.id}"]`);
      if (el && !reduced) el.animate([{ boxShadow: '0 0 0 0 rgba(214,171,95,.7)' }, { boxShadow: '0 0 0 14px rgba(214,171,95,0)' }], { duration: 900, iterations: 2, delay: 400 });
    }, 700);
  } else {
    refresh();
  }
}

function confirmDelete(id) {
  const c = byId(id);
  if (!c) return;
  openModal(`
    <div class="confirm-box">
      <div class="em-ic">${ic('trash', 'lg')}</div>
      <h3>¿Eliminar a ${esc(c.nombre)}?</h3>
      <p>Se eliminarán sus datos de contacto y ${c.casos.length} caso${c.casos.length === 1 ? '' : 's'} asociado${c.casos.length === 1 ? '' : 's'} del directorio.</p>
      <div class="row">
        <button class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button class="btn btn-danger" data-act="do-delete" data-id="${c.id}">${ic('trash')} Eliminar</button>
      </div>
    </div>`);
}

function doDelete(id) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const [c] = clients.splice(idx, 1);
  save();
  closeModal();
  closeDrawer();
  refresh();
  toast(`<b>${esc(c.nombre)}</b> fue eliminado`, {
    type: 'bad', duration: 6000,
    action: { label: 'Deshacer', fn: () => { clients.splice(idx, 0, c); save(); refresh(); toast('Cliente restaurado'); } },
  });
}

/* ---------- Overlay compartido ---------- */
function syncOverlay(force) {
  const open = force || $('#drawer').classList.contains('open') || modalOpen() || $('#palette').classList.contains('open');
  $('#overlay').classList.toggle('open', !!open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* =========================================================
   PALETA DE COMANDOS (Ctrl + K)
   ========================================================= */
let palSel = 0, palRun = [];
const ACTIONS = [
  { label: 'Nuevo cliente', hint: 'Registrar un cliente', icon: 'plus', kbd: 'N', fn: () => openForm() },
  { label: 'Ir al dashboard', hint: 'Panel de control', icon: 'dashboard', fn: () => { location.hash = '#/dashboard'; } },
  { label: 'Ir al directorio', hint: 'Todos los clientes', icon: 'users', fn: () => { location.hash = '#/clientes'; } },
  { label: 'Ver favoritos', hint: 'Clientes marcados con estrella', icon: 'star', fn: () => { resetFilters(); F.fav = true; current === 'clientes' ? updateList() : (location.hash = '#/clientes'); } },
  { label: 'Cambiar tema', hint: 'Claro / oscuro', icon: 'moon', fn: () => toggleTheme() },
  { label: 'Exportar clientes a CSV', hint: 'Descargar listado', icon: 'download', fn: () => exportCSV() },
  { label: 'Restablecer datos de demostración', hint: 'Descarta los cambios locales', icon: 'undo', fn: () => { clients = JSON.parse(JSON.stringify(D.clientes)); save(); refresh(); toast('Datos de demostración restaurados'); } },
];

function openPalette() {
  const p = $('#palette');
  p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  $('#paletteInput').value = '';
  palSel = 0;
  renderPalette();
  syncOverlay();
  setTimeout(() => $('#paletteInput').focus(), 50);
}
function closePalette() {
  const p = $('#palette');
  if (!p.classList.contains('open')) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
  syncOverlay();
}

function mark(text, q) {
  if (!q) return esc(text);
  const chars = [...text];
  const n = chars.map((ch) => norm(ch) || ch).join('');
  const i = n.indexOf(q);
  if (i < 0 || n.length !== chars.length) return esc(text);
  return esc(chars.slice(0, i).join('')) + '<mark>' + esc(chars.slice(i, i + q.length).join('')) + '</mark>' + esc(chars.slice(i + q.length).join(''));
}

function renderPalette() {
  const q = norm($('#paletteInput').value.trim());
  const acts = ACTIONS.filter((a) => !q || norm(a.label + ' ' + a.hint).includes(q));
  const cls = clients.filter((c) => !q || norm([c.nombre, c.ciudad, c.area, c.documento, c.email].join(' ')).includes(q)).slice(0, q ? 8 : 5);
  palRun = [];
  let html = '';
  if (cls.length) {
    html += `<div class="pl-group">Clientes</div>`;
    html += cls.map((c) => { palRun.push(() => { location.hash = `#/clientes/${c.id}`; }); return `<button class="pl-item" data-pi="${palRun.length - 1}">${avatar(c.nombre, 'sm')}<div><strong>${mark(c.nombre, q)}</strong><small>${esc(c.area)} · ${esc(c.ciudad)} · ${esc(c.estado)}</small></div><kbd>↵</kbd></button>`; }).join('');
  }
  if (acts.length) {
    html += `<div class="pl-group">Acciones</div>`;
    html += acts.map((a) => { palRun.push(a.fn); return `<button class="pl-item" data-pi="${palRun.length - 1}"><span class="pl-ic">${ic(a.icon)}</span><div><strong>${mark(a.label, q)}</strong><small>${esc(a.hint)}</small></div><kbd>${a.kbd || '↵'}</kbd></button>`; }).join('');
  }
  $('#paletteList').innerHTML = html || `<div class="pl-empty">Sin resultados para “${esc($('#paletteInput').value)}”</div>`;
  palSel = Math.min(palSel, Math.max(0, palRun.length - 1));
  paintSel();
}
function paintSel() {
  $$('.pl-item').forEach((el) => el.classList.toggle('sel', +el.dataset.pi === palSel));
  $(`.pl-item[data-pi="${palSel}"]`)?.scrollIntoView({ block: 'nearest' });
}
function runPal(i) { const fn = palRun[i]; closePalette(); if (fn) setTimeout(fn, 60); }

/* =========================================================
   TEMA (transición circular con View Transitions)
   ========================================================= */
function toggleTheme(e) {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => { root.dataset.theme = next; try { localStorage.setItem('lex-theme', next); } catch { /* */ } };
  if (!document.startViewTransition || reduced) return apply();
  const x = e?.clientX ?? innerWidth - 60, y = e?.clientY ?? 36;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(apply);
  t.ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: EASE, pseudoElement: '::view-transition-new(root)' });
  }).catch(() => {});
}

/* =========================================================
   EXPORTAR CSV
   ========================================================= */
function exportCSV() {
  const list = current === 'clientes' ? filtered() : clients;
  const cols = [
    ['Nombre', 'nombre'], ['Tipo', 'tipo'], ['Documento', 'documento'], ['Área', 'area'], ['Estado', 'estado'],
    ['Responsable', (c) => lawName(LAW(c.abogado))], ['Correo', 'email'], ['Teléfono', 'telefono'], ['Ciudad', 'ciudad'],
    ['Cliente desde', 'desde'], ['Casos', (c) => c.casos.length], ['Facturado', 'facturado'], ['Pendiente', 'pendiente'],
  ];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [cols.map((c) => cell(c[0])).join(';'), ...list.map((c) => cols.map(([, k]) => cell(typeof k === 'function' ? k(c) : c[k])).join(';'))];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clientes-lex-${HOY}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Se exportaron <b>${list.length}</b> clientes a CSV`);
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */
function renderNotifs() {
  const prox = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0).sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia)).slice(0, 2);
  const deuda = [...clients].sort((a, b) => b.pendiente - a.pendiente)[0];
  const nuevo = [...clients].sort((a, b) => b.desde.localeCompare(a.desde))[0];
  const items = [
    ...prox.map((c) => ({ id: c.id, ic: 'gavel', col: 'var(--gold)', t: `Audiencia de <b>${esc(c.nombre)}</b>`, s: fmtDate(c.proximaAudiencia) })),
    deuda && { id: deuda.id, ic: 'wallet', col: 'var(--warn)', t: `Saldo pendiente de <b>${esc(deuda.nombre)}</b>`, s: fmtMoney.format(deuda.pendiente) },
    nuevo && { id: nuevo.id, ic: 'users', col: 'var(--info)', t: `Nuevo cliente: <b>${esc(nuevo.nombre)}</b>`, s: rel(nuevo.desde) },
  ].filter(Boolean);
  $('#notifPop').innerHTML = `<div class="pop-head"><strong>Notificaciones</strong><button data-act="read-all">Marcar como leídas</button></div>` +
    items.map((n) => `<a class="pop-item" href="#/clientes/${n.id}"><span class="dot-ic" style="color:${n.col};background:color-mix(in srgb, ${n.col} 14%, transparent)">${ic(n.ic, 'sm')}</span><div><p>${n.t}</p><small>${n.s}</small></div></a>`).join('');
}

/* =========================================================
   SIDEBAR
   ========================================================= */
function toggleSidebarMobile(force) {
  const open = force ?? !$('#sidebar').classList.contains('open');
  $('#sidebar').classList.toggle('open', open);
  $('#sbBackdrop').classList.toggle('open', open);
}

/* =========================================================
   EVENTOS GLOBALES
   ========================================================= */
document.addEventListener('click', (e) => {
  const t = e.target;
  const q = (s) => t.closest(s);
  let el;

  // Popover de notificaciones
  if (!q('.pop-wrap')) $('#notifPop').classList.remove('open');

  if ((el = q('[data-stop]'))) return;                       // enlaces mailto/tel dentro de tarjetas
  if ((el = q('[data-fav]'))) { e.stopPropagation(); return toggleFav(el.dataset.fav, el); }
  if ((el = q('[data-edit]'))) return openForm(el.dataset.edit);
  if ((el = q('[data-del]'))) return confirmDelete(el.dataset.del);
  if ((el = q('[data-copy]'))) {
    navigator.clipboard?.writeText(el.dataset.copy).then(() => toast(`Copiado: <b>${esc(el.dataset.copy)}</b>`, { type: 'info', duration: 2000 }), () => {});
    el.animate([{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: 300, easing: EASE });
    return;
  }
  if ((el = q('[data-tab]'))) { drawerTab = el.dataset.tab; const c = byId(drawerId); if (c) renderTab(c); return; }
  if ((el = q('[data-pi]'))) return runPal(+el.dataset.pi);
  if ((el = q('[data-mode]'))) {
    chartMode = el.dataset.mode;
    $$('#chartSeg button').forEach((b) => b.classList.toggle('on', b === el));
    segPill($('#chartSeg'));
    return drawMainChart(true);
  }
  if ((el = q('[data-view]'))) { F.view = el.dataset.view; store.set('lex-view', F.view); return updateList({ flip: false }); }
  if ((el = q('[data-estado]'))) { F.estado = el.dataset.estado; F.page = 1; return updateList(); }
  if ((el = q('[data-law]'))) { F.abogado = F.abogado === el.dataset.law ? 'all' : el.dataset.law; F.page = 1; return updateList(); }
  if ((el = q('[data-letter]'))) { F.letter = F.letter === el.dataset.letter ? '' : el.dataset.letter; F.page = 1; return updateList(); }
  if ((el = q('[data-page]'))) { F.page = +el.dataset.page; updateList({ flip: false }); return $('.toolbar')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  if ((el = q('th[data-sort]'))) {
    const [k, d] = F.sort.split(':');
    const key = el.dataset.sort;
    F.sort = `${key}:${k === key ? (d === 'asc' ? 'desc' : 'asc') : key === 'nom' ? 'asc' : 'desc'}`;
    return updateList();
  }
  if ((el = q('[data-rm]'))) {
    const k = el.dataset.rm;
    if (k === 'q') { F.q = ''; if ($('#q')) $('#q').value = ''; }
    else if (k === 'fav' || k === 'hearing') F[k] = false;
    else if (k === 'letter') F.letter = '';
    else F[k] = 'all';
    F.page = 1;
    return updateList();
  }
  if ((el = q('[data-stat]'))) {
    const k = el.dataset.stat;
    if (k === 'all') { resetFilters(); if ($('#q')) $('#q').value = ''; }
    if (k === 'activos') F.estado = F.estado === 'Activo' ? 'all' : 'Activo';
    if (k === 'cobro') F.sort = F.sort === 'fac:desc' ? 'act:desc' : 'fac:desc';
    if (k === 'aud') F.hearing = !F.hearing;
    F.page = 1;
    return updateList();
  }
  if ((el = q('[data-act]'))) {
    const a = el.dataset.act;
    if (a === 'new') return openForm();
    if (a === 'export') return exportCSV();
    if (a === 'palette') return openPalette();
    if (a === 'close-drawer') return closeDrawer();
    if (a === 'close-modal') return closeModal();
    if (a === 'save') return saveForm(el.dataset.id);
    if (a === 'do-delete') return doDelete(el.dataset.id);
    if (a === 'clearq') { F.q = ''; $('#q').value = ''; $('#q').focus(); F.page = 1; return updateList(); }
    if (a === 'reset') { resetFilters(); if ($('#q')) $('#q').value = ''; return updateList(); }
    if (a === 'fav') { F.fav = !F.fav; F.page = 1; return updateList(); }
    if (a === 'read-all') { $('.ping')?.remove(); $('#notifPop').classList.remove('open'); return toast('Notificaciones marcadas como leídas', { type: 'info', duration: 2000 }); }
  }
  if ((el = q('[data-open]'))) {
    if (e.metaKey || e.ctrlKey) return;
    location.hash = `#/clientes/${el.dataset.open}`;
  }
});

// Abrir tarjeta con teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches?.('.client-card')) location.hash = `#/clientes/${e.target.dataset.open}`;
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
  const palOpen = $('#palette').classList.contains('open');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return palOpen ? closePalette() : openPalette(); }
  if (palOpen) {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % Math.max(1, palRun.length); return paintSel(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + palRun.length) % Math.max(1, palRun.length); return paintSel(); }
    if (e.key === 'Enter') { e.preventDefault(); return runPal(palSel); }
  }
  if (e.key === 'Escape') {
    if (palOpen) return closePalette();
    if (modalOpen()) return closeModal();
    if ($('#drawer').classList.contains('open')) return closeDrawer();
    $('#notifPop').classList.remove('open');
    return toggleSidebarMobile(false);
  }
  if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey || modalOpen() || palOpen) return;
  if (e.key === '/' && current === 'clientes') { e.preventDefault(); $('#q').focus(); }
  if (e.key.toLowerCase() === 'n') { e.preventDefault(); openForm(); }
});

$('#paletteInput').addEventListener('input', () => { palSel = 0; renderPalette(); });
$('#paletteList').addEventListener('mousemove', (e) => { const it = e.target.closest('.pl-item'); if (it && +it.dataset.pi !== palSel) { palSel = +it.dataset.pi; paintSel(); } });
$('#palette').addEventListener('click', (e) => { if (e.target.id === 'palette') closePalette(); });
$('#overlay').addEventListener('click', () => {
  if ($('#palette').classList.contains('open')) return closePalette();
  if (modalOpen()) return closeModal();
  closeDrawer();
});
$('#modal').addEventListener('submit', (e) => e.preventDefault());

$('#openPalette').addEventListener('click', openPalette);
$('#themeToggle').addEventListener('click', toggleTheme);
$('#notifBtn').addEventListener('click', () => { renderNotifs(); $('#notifPop').classList.toggle('open'); });
$('#sbOpen').addEventListener('click', () => toggleSidebarMobile(true));
$('#sbBackdrop').addEventListener('click', () => toggleSidebarMobile(false));
$('#sbCollapse').addEventListener('click', () => {
  const c = document.documentElement.classList.toggle('sb-collapsed');
  try { localStorage.setItem('lex-sidebar', c ? 'collapsed' : 'open'); } catch { /* */ }
  setTimeout(() => { if (current === 'dashboard') drawMainChart(false); segPill($('#chartSeg')); }, 520);
});
$$('[data-soon]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  toast(`El módulo <b>${esc(a.textContent.trim())}</b> estará disponible próximamente`, { type: 'info' });
}));

// Ripple en botones
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn');
  if (!b || reduced) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
  const sp = document.createElement('span');
  sp.className = 'ripple';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp);
  setTimeout(() => sp.remove(), 700);
});

// Inclinación 3D + foco de luz en las tarjetas de cliente
let tiltCard = null;
document.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || reduced) return;
  const card = e.target.closest('.client-card');
  if (tiltCard && tiltCard !== card) { tiltCard.style.transform = ''; tiltCard = null; }
  if (!card) return;
  tiltCard = card;
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  card.style.setProperty('--mx', px * 100 + '%');
  card.style.setProperty('--my', py * 100 + '%');
  card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-4px)`;
}, { passive: true });
document.addEventListener('pointerleave', () => { if (tiltCard) { tiltCard.style.transform = ''; tiltCard = null; } });

// Sombra del topbar al hacer scroll
addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', scrollY > 8), { passive: true });

// Redibujar el gráfico al cambiar el tamaño
addEventListener('resize', debounce(() => {
  if (current === 'dashboard') { drawMainChart(false); segPill($('#chartSeg')); }
  if (current === 'clientes') segPill($('#viewSeg'));
  const act = $('#nav a.active'); if (act) $('#navIndicator').style.transform = `translateY(${act.offsetTop}px)`;
}, 150));

addEventListener('hashchange', route);

/* ---------- Inicio ---------- */
updateNavCount();
updateSidebarHearing();
if (!location.hash) history.replaceState(null, '', '#/dashboard');
route();
