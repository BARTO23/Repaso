/* =========================================================
   Lex & Asociados: directorio de clientes
   Vanilla JS, sin dependencias. Sigue las Web Interface
   Guidelines de Vercel (ver AUDITORIA-VERCEL.md).
   ========================================================= */
'use strict';

const D = window.LEX_DATA;

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sum = (arr, k) => arr.reduce((s, x) => s + (+x[k] || 0), 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

const LOCALE = 'es-CO';
const fmtMoney = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat(LOCALE);
const fmtPct = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });
const fmtPctSigned = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' });
const dfDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
const dfLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const dfMonth = new Intl.DateTimeFormat(LOCALE, { month: 'long' });
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

const HOY = D.HOY;
const parseD = (s) => new Date(s + 'T00:00:00');
const diffDays = (s) => Math.round((parseD(s) - parseD(HOY)) / 864e5);
const fmtDate = (s) => dfDate.format(parseD(s));
const rel = (s) => {
  const n = diffDays(s), a = Math.abs(n);
  if (a < 30) return rtf.format(n, 'day');
  if (a < 365) return rtf.format(Math.round(n / 30), 'month');
  return rtf.format(Math.round(n / 365), 'year');
};
const inDays = (s) => { const d = diffDays(s); return d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`; };

const initials = (n) => n.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const LAW = (id) => D.ABOGADOS.find((a) => a.id === id) || D.ABOGADOS[0];
const lawName = (a) => `${a.titulo} ${a.nombre}`;
const STATUS = { 'Activo': 's-activo', 'En revisión': 's-revision', 'Potencial': 's-potencial', 'Inactivo': 's-inactivo' };
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
const openCases = (c) => c.casos.filter((k) => k.estado !== 'Cerrado').length;
const lastNote = (c) => (c.timeline[0] ? c.timeline[0].texto : 'Sin movimientos');

/* ---------------------------------------------------------
   Persistencia
   --------------------------------------------------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
const STORE_KEY = 'lex-clients-v3';
let clients = store.get(STORE_KEY, null) || JSON.parse(JSON.stringify(D.clientes));
const byId = (id) => clients.find((c) => c.id === id);
function save() { store.set(STORE_KEY, clients); $('#navCount').textContent = clients.length; }

/* ---------------------------------------------------------
   Estado de filtros: vive en la URL (se puede enlazar y Atrás funciona)
   --------------------------------------------------------- */
const DEFAULTS = { q: '', estado: 'all', area: 'all', abogado: 'all', tipo: 'all', fav: false, hearing: false, sort: 'act:desc', page: 1, view: 'grid' };
const F = { ...DEFAULTS, view: store.get('lex-view', 'grid') };
const PARAMS = { q: 'q', estado: 'estado', area: 'area', abogado: 'abogado', tipo: 'tipo', fav: 'favoritos', hearing: 'audiencia', sort: 'orden', page: 'p', view: 'vista' };
const PER_PAGE = 12;

function queryString() {
  const sp = new URLSearchParams();
  for (const [k, p] of Object.entries(PARAMS)) {
    const v = F[k];
    if (v === DEFAULTS[k] || v === false || v === '') continue;
    sp.set(p, v === true ? '1' : v);
  }
  const s = sp.toString();
  return s ? '?' + s : '';
}
function applyParams(sp) {
  const before = JSON.stringify(F);
  for (const [k, p] of Object.entries(PARAMS)) {
    const v = sp.get(p);
    if (k === 'fav' || k === 'hearing') F[k] = v === '1';
    else if (k === 'page') F.page = Math.max(1, parseInt(v, 10) || 1);
    else if (k === 'view') F.view = v === 'table' ? 'table' : v === 'grid' ? 'grid' : F.view;
    else F[k] = v ?? DEFAULTS[k];
  }
  if (!CMP[F.sort.split(':')[0]]) F.sort = DEFAULTS.sort;
  return before !== JSON.stringify(F);
}
const clientHref = (id) => `#/clientes/${id}${queryString()}`;

/* ---------------------------------------------------------
   Rutas en memoria, reflejadas en la URL cuando el navegador lo permite
   (así la página funciona también en vistas previas aisladas)
   --------------------------------------------------------- */
let current = null;
let routeHash = '#/dashboard';
const scrollMemory = {};
let restoring = false;
function safeUrl(method, url) { try { history[method](null, '', url); return true; } catch { return false; } }
function go(url) {
  if (url === routeHash) return;
  scrollMemory[routeHash.split('?')[0]] = scrollY;
  routeHash = url;
  safeUrl('pushState', url);
  route();
}
function writeUrl() {
  if (current !== 'clientes') return;
  const url = `#/clientes${drawerId ? '/' + drawerId : ''}${queryString()}`;
  if (routeHash !== url) { routeHash = url; safeUrl('replaceState', url); }
}
function parseHash() {
  const raw = routeHash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const p = path.split('/');
  return { page: p[0] || 'dashboard', id: p[1] || null, params: new URLSearchParams(qs) };
}

function route() {
  const { page, id, params } = parseHash();
  const p = page === 'clientes' ? 'clientes' : 'dashboard';
  if (p !== current) {
    current = p;
    closeDrawer(true);
    if (p === 'clientes') { applyParams(params); renderClients(); } else renderDashboard();
    const y = restoring ? scrollMemory[routeHash.split('?')[0]] || 0 : 0;
    window.scrollTo({ top: y });
  } else if (p === 'clientes' && applyParams(params)) {
    if ($('#q')) $('#q').value = F.q;
    updateList();
  }
  restoring = false;
  if (p === 'clientes' && id) openDrawer(id); else closeDrawer(true);
  $$('#nav a[data-route]').forEach((a) => (a.dataset.route === p ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  setTitle();
}
function setTitle() {
  const c = drawerId && byId(drawerId);
  document.title = c ? `${c.nombre} | Lex & Asociados` : `${current === 'clientes' ? 'Clientes' : 'Resumen'} | Lex & Asociados`;
}

/* ---------------------------------------------------------
   Piezas
   --------------------------------------------------------- */
const avatar = (name, cls = '') => `<span class="avatar ${cls}" aria-hidden="true">${esc(initials(name))}</span>`;
const hueOf = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
const gAvatar = (a, cls = 'sm') => `<span class="g-avatar ${cls}" style="--h:${a.hue ?? hueOf(a.nombre)}" aria-hidden="true"></span>`;
const status = (e) => `<span class="status ${STATUS[e] || ''}">${esc(e)}</span>`;
const pill = (t) => `<span class="pill">${esc(t)}</span>`;

/* Dígitos que ruedan: solo cuando el valor cambia, nunca al cargar */
function roll(el, text) {
  if (!el) return;
  text = String(text);
  const prev = el._v;
  el._v = text;
  if (prev === undefined || reduced || prev.length !== text.length) { el.textContent = text; return; }
  if (prev === text) return;
  const isD = (c) => /\d/.test(c);
  const a = [...prev], b = [...text];
  if (a.some((c, i) => isD(c) !== isD(b[i]) || (!isD(c) && c !== b[i]))) { el.textContent = text; return; }
  el.classList.add('roll');
  el.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true" style="display:inline-flex">${a.map((c) => isD(c)
    ? `<span class="rd"><span class="rd-col" style="transition:none;transform:translateY(${-c * 10}%)">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
    : `<span class="rs">${esc(c)}</span>`).join('')}</span>`;
  void el.offsetWidth;
  let k = 0;
  const cols = $$('.rd-col', el);
  b.forEach((c) => { if (isD(c)) { const col = cols[k++]; col.style.transition = ''; col.style.transform = `translateY(${-c * 10}%)`; } });
}

function smooth(p) {
  if (p.length < 2) return '';
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = 1 / 6;
    d += ` C ${(p1[0] + (p2[0] - p0[0]) * t).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) * t).toFixed(1)}, ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) * t).toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const niceMax = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e; };

/* ---------------------------------------------------------
   Avisos (región aria-live polite en el HTML)
   --------------------------------------------------------- */
function toast(msg, { action = null, duration = 4000 } = {}) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<p>${msg}</p>${action ? `<button type="button" class="btn btn-secondary">${esc(action.label)}</button>` : ''}`;
  const kill = () => { if (el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => el.remove(), 150); };
  if (action) $('button', el).onclick = () => { action.fn(); kill(); };
  $('#toasts').appendChild(el);
  let timer = setTimeout(kill, duration);
  el.onmouseenter = () => clearTimeout(timer);
  el.onmouseleave = () => { timer = setTimeout(kill, 2000); };
  const all = $$('.toast:not(.out)'); if (all.length > 3) all[0].classList.add('out');
}

/* =========================================================
   RESUMEN
   ========================================================= */
let chartMode = 'clientes';
let chartIdx = D.serie.length - 1;

function renderDashboard() {
  const activos = clients.filter((c) => c.estado === 'Activo');
  const abiertos = clients.flatMap((c) => c.casos).filter((k) => k.estado !== 'Cerrado');
  const altas = abiertos.filter((k) => k.prioridad === 'Alta').length;
  const facturado = sum(clients, 'facturado'), pendiente = sum(clients, 'pendiente');
  const cobrado = facturado ? 1 - pendiente / facturado : 0;
  const s = D.serie, last = s[s.length - 1], prev = s[s.length - 2];
  const delta = (a, b) => (a - b) / (b || 1);
  const proximas = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)
    .sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia) || a.nombre.localeCompare(b.nombre, 'es'));
  const semana = proximas.filter((c) => diffDays(c.proximaAudiencia) < 7).length;
  const mes = dfMonth.format(parseD(HOY));

  // Audiencias agrupadas por día
  const groups = [];
  proximas.slice(0, 5).forEach((c) => {
    const g = groups.find((x) => x.day === c.proximaAudiencia);
    g ? g.items.push(c) : groups.push({ day: c.proximaAudiencia, items: [c] });
  });
  const dayLabel = (d) => { const n = diffDays(d); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : cap(dfLong.format(parseD(d))); };

  const areas = Object.keys(D.AREAS).map((a) => ({ a, n: clients.filter((c) => c.area === a).length })).filter((x) => x.n).sort((x, y) => y.n - x.n || x.a.localeCompare(y.a, 'es'));
  const maxArea = Math.max(1, ...areas.map((x) => x.n));
  const loads = D.ABOGADOS.map((a) => {
    const mine = clients.filter((c) => c.abogado === a.id && c.estado !== 'Inactivo');
    return { a, n: mine.length, k: mine.reduce((t, c) => t + openCases(c), 0) };
  }).sort((x, y) => y.k - x.k);
  const maxLoad = Math.max(1, ...loads.map((x) => x.k));
  const feed = clients.flatMap((c) => c.timeline.map((t) => ({ ...t, c }))).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
  const recientes = [...clients].sort((a, b) => b.desde.localeCompare(a.desde)).slice(0, 5);
  const dl = delta(last.ingresos, prev.ingresos);

  $('#view').innerHTML = `
  <div class="page-head">
    <div>
      <h1 class="page-title">Resumen</h1>
      <p class="page-sub">${cap(dfLong.format(parseD(HOY)))}. ${plural(semana, 'audiencia', 'audiencias')} en los próximos 7 días.</p>
    </div>
    <div class="head-actions">
      <a class="btn btn-secondary" href="#/clientes">Ver clientes</a>
      <button class="btn btn-primary" type="button" data-act="new">${ic('plus')}Nuevo cliente</button>
    </div>
  </div>

  <div class="dash">
    <section class="card c-12" aria-label="Cifras del despacho">
      <dl class="stats">
        <div class="stat"><dt>Clientes activos</dt><dd>${fmtInt.format(activos.length)}</dd><p class="note">de ${fmtInt.format(clients.length)} en el directorio</p></div>
        <div class="stat"><dt>Casos abiertos</dt><dd>${fmtInt.format(abiertos.length)}</dd><p class="note">${fmtInt.format(altas)} con prioridad alta</p></div>
        <div class="stat"><dt>Ingresos de ${mes}</dt><dd>${fmtCompact.format(last.ingresos)}</dd><p class="note"><span class="${dl >= 0 ? 'up' : 'down'}">${fmtPctSigned.format(dl)}</span> frente al mes anterior</p></div>
        <div class="stat"><dt>Por cobrar</dt><dd>${fmtCompact.format(pendiente)}</dd><p class="note">${fmtPct.format(cobrado)} de lo facturado ya está cobrado</p></div>
      </dl>
    </section>

    <section class="card c-8 chart-card" aria-labelledby="h-chart">
      <div class="card-head">
        <h2 id="h-chart">Evolución de la cartera</h2>
        <div class="seg" role="group" aria-label="Serie del gráfico">
          <button type="button" data-mode="clientes" aria-pressed="${chartMode === 'clientes'}">Clientes</button>
          <button type="button" data-mode="ingresos" aria-pressed="${chartMode === 'ingresos'}">Ingresos</button>
        </div>
      </div>
      <div class="chart-read" aria-live="polite"><strong id="chartVal"></strong><span id="chartLbl"></span></div>
      <div class="chart-wrap" id="mainChart" tabindex="0" role="img" aria-label="Gráfico de los últimos 12 meses. Usa las flechas izquierda y derecha para recorrer los meses."></div>
      <div class="chart-key" id="chartKey"></div>
    </section>

    <section class="card c-4" aria-labelledby="h-hear">
      <div class="card-head"><h2 id="h-hear">Próximas audiencias</h2><a class="link" href="#/clientes?audiencia=1">Ver todas</a></div>
      ${groups.length ? groups.map((g) => `
        <div class="day-label ${diffDays(g.day) === 0 ? 'today' : ''}">${dayLabel(g.day)}</div>
        ${g.items.map((c) => {
          const caso = c.casos.find((k) => k.estado !== 'Cerrado') || c.casos[0];
          return `<div class="list-row"><div class="grow"><a class="stretch" href="#/clientes/${c.id}"><strong>${esc(c.nombre)}</strong></a><small>${esc(caso ? caso.titulo : c.area)}</small></div><span class="pill">${esc(c.area)}</span></div>`;
        }).join('')}`).join('') : '<p class="empty-row">No hay audiencias programadas.</p>'}
    </section>

    <section class="card c-7" aria-labelledby="h-recent">
      <div class="card-head"><h2 id="h-recent">Clientes recientes</h2><a class="link" href="#/clientes?orden=des:desc">Ver los ${clients.length} clientes</a></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Cliente</th><th scope="col">Estado</th><th scope="col">Desde</th><th scope="col" class="num">Facturado</th></tr></thead>
          <tbody>
            ${recientes.map((c) => `
              <tr>
                <td><div class="cell">${avatar(c.nombre)}<div><a class="stretch" href="#/clientes/${c.id}"><strong>${esc(c.nombre)}</strong></a><small>${esc(c.area)}</small></div></div></td>
                <td>${status(c.estado)}</td>
                <td class="muted">${fmtDate(c.desde)}</td>
                <td class="num">${fmtCompact.format(c.facturado)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="card c-5" aria-labelledby="h-areas">
      <div class="card-head"><h2 id="h-areas">Clientes por área</h2></div>
      <div class="card-body">
        ${areas.map((x) => `
          <a class="bar-row" href="#/clientes?area=${encodeURIComponent(x.a)}">
            <span class="bar-label">${esc(x.a)}</span><span class="mono">${x.n}</span>
            <span class="track"><i style="--w:${(x.n / maxArea).toFixed(3)}"></i></span>
          </a>`).join('')}
      </div>
    </section>

    <section class="card c-7" aria-labelledby="h-log">
      <div class="card-head"><h2 id="h-log">Actividad reciente</h2></div>
      <ul class="log">
        ${feed.map((f) => `<li><time datetime="${f.fecha}">${esc(cap(rel(f.fecha)))}</time><div>${esc(f.texto)}<small>${esc(f.c.nombre)}</small></div></li>`).join('')}
      </ul>
    </section>

    <section class="card c-5" aria-labelledby="h-load">
      <div class="card-head"><h2 id="h-load">Carga por abogado</h2><p>Casos abiertos</p></div>
      <div class="loads" style="grid-template-columns:1fr">
        ${loads.map(({ a, n, k }) => `
          <div class="load">
            ${gAvatar(a, '')}
            <div>
              <div class="load-top"><strong>${esc(lawName(a))}</strong><span><span class="mono">${k}</span> casos, ${n} clientes</span></div>
              <div class="track"><i style="--w:${(k / maxLoad).toFixed(3)}"></i></div>
            </div>
          </div>`).join('')}
      </div>
    </section>
  </div>`;

  drawMainChart();
}

function chartSeries() {
  const s = D.serie;
  return chartMode === 'ingresos'
    ? [{ name: 'Ingresos', vals: s.map((x) => x.ingresos), fmt: (v) => fmtCompact.format(v), lbl: (m) => `facturados en ${m}` }]
    : [{ name: 'Clientes nuevos', vals: s.map((x) => x.nuevos), fmt: (v) => fmtInt.format(v), lbl: (m) => `clientes nuevos en ${m}` },
       { name: 'Casos cerrados', vals: s.map((x) => x.cerrados), fmt: (v) => fmtInt.format(v), alt: true }];
}
const monthName = (i) => dfMonth.format(new Date(2025, 11 + i, 1));

function drawMainChart() {
  const wrap = $('#mainChart');
  if (!wrap) return;
  const W = wrap.clientWidth, H = wrap.clientHeight, P = { l: 56, r: 8, t: 12, b: 26 };
  const labels = D.serie.map((x) => x.mes);
  const series = chartSeries();
  const max = niceMax(Math.max(...series.flatMap((x) => x.vals)) * 1.1);
  const step = (W - P.l - P.r) / (labels.length - 1);
  const X = (i) => P.l + i * step;
  const Y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const stroke = (x) => (x.alt ? 'var(--faint)' : 'var(--ink)');

  $('#chartKey').innerHTML = series.map((x) => `<span><svg aria-hidden="true"><line x1="0" x2="16" y1="1" y2="1" stroke="${stroke(x)}" stroke-width="2" ${x.alt ? 'stroke-dasharray="4 3"' : ''}/></svg>${x.name}</span>`).join('');

  let svg = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4, y = Y(v);
    svg += `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text class="axis" x="${P.l - 10}" y="${y + 4}" text-anchor="end">${series[0].fmt(v)}</text>`;
  }
  labels.forEach((l, i) => { svg += `<text class="axis xl" data-i="${i}" x="${X(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`; });
  series.forEach((x) => { svg += `<path class="line ${x.alt ? 'alt' : ''}" d="${smooth(x.vals.map((v, j) => [X(j), Y(v)]))}" style="stroke:${stroke(x)}"/>`; });
  // Las transformaciones van en <g>, no en los elementos (Safari)
  svg += `<g class="scrub" id="sGuide"><line class="guide" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}"/></g>`;
  series.forEach((x, i) => { svg += `<g class="scrub" data-s="${i}"><circle r="4" cx="0" cy="0" style="fill:var(--surface);stroke:${stroke(x)};stroke-width:2"/></g>`; });
  svg += '</svg>';
  wrap.innerHTML = svg;

  const guide = $('#sGuide', wrap), dots = $$('g[data-s]', wrap), xl = $$('.xl', wrap);
  const setIdx = (i) => {
    chartIdx = Math.max(0, Math.min(labels.length - 1, i));
    const x = X(chartIdx);
    guide.style.transform = `translateX(${x}px)`;
    dots.forEach((d) => { d.style.transform = `translate(${x}px, ${Y(series[d.dataset.s].vals[chartIdx])}px)`; });
    xl.forEach((t) => t.classList.toggle('on', +t.dataset.i === chartIdx));
    roll($('#chartVal'), series[0].fmt(series[0].vals[chartIdx]));
    const m = monthName(chartIdx);
    $('#chartLbl').textContent = series[1] ? `${series[0].lbl(m)}, ${fmtInt.format(series[1].vals[chartIdx])} casos cerrados` : series[0].lbl(m);
  };
  setIdx(chartIdx);
  wrap.onpointermove = (e) => {
    const i = Math.round((e.clientX - wrap.getBoundingClientRect().left - P.l) / step);
    if (i !== chartIdx) setIdx(i);
  };
  wrap.onpointerleave = () => setIdx(labels.length - 1);
  wrap.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setIdx(chartIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setIdx(chartIdx + 1); }
  };
}

/* =========================================================
   CLIENTES
   ========================================================= */
const SORTS = [
  ['act:desc', 'Actividad reciente'], ['nom:asc', 'Nombre (A a Z)'], ['nom:desc', 'Nombre (Z a A)'],
  ['fac:desc', 'Mayor facturación'], ['cas:desc', 'Más casos abiertos'], ['des:desc', 'Clientes más nuevos'], ['des:asc', 'Clientes más antiguos'],
];
const CMP = {
  nom: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  act: (a, b) => a.ultimaActividad.localeCompare(b.ultimaActividad),
  fac: (a, b) => a.facturado - b.facturado,
  cas: (a, b) => openCases(a) - openCases(b),
  des: (a, b) => a.desde.localeCompare(b.desde),
};

function matches(c, skip = '') {
  if (skip !== 'estado' && F.estado !== 'all' && c.estado !== F.estado) return false;
  if (F.area !== 'all' && c.area !== F.area) return false;
  if (F.abogado !== 'all' && c.abogado !== F.abogado) return false;
  if (F.tipo !== 'all' && c.tipo !== F.tipo) return false;
  if (F.fav && !c.favorito) return false;
  if (skip !== 'hearing' && F.hearing && !(c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)) return false;
  if (F.q) {
    const hay = norm([c.nombre, c.email, c.ciudad, c.area, c.documento, c.contacto, c.estado, c.telefono, LAW(c.abogado).nombre, ...(c.etiquetas || [])].join(' '));
    if (!norm(F.q).split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
  }
  return true;
}
function filtered() {
  const [k, dir] = F.sort.split(':');
  return clients.filter((c) => matches(c)).sort((a, b) => CMP[k](a, b) * (dir === 'desc' ? -1 : 1) || a.nombre.localeCompare(b.nombre, 'es'));
}
function resetFilters() { Object.assign(F, { q: '', estado: 'all', area: 'all', abogado: 'all', tipo: 'all', fav: false, hearing: false, page: 1 }); }
const anyFilter = () => F.q || F.estado !== 'all' || F.area !== 'all' || F.abogado !== 'all' || F.tipo !== 'all' || F.fav || F.hearing;

function renderClients() {
  const opt = (list, sel) => list.map(([v, l]) => `<option value="${esc(v)}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('');
  $('#view').innerHTML = `
  <div class="page-head">
    <div>
      <h1 class="page-title">Clientes</h1>
      <p class="page-sub" id="clientsSub"></p>
    </div>
    <div class="head-actions">
      <button class="btn btn-secondary" type="button" data-act="export">${ic('download')}Exportar CSV</button>
      <button class="btn btn-primary" type="button" data-act="new">${ic('plus')}Nuevo cliente</button>
    </div>
  </div>

  <div class="toolbar" role="search">
    <div class="search" id="searchBox">
      ${ic('search')}
      <input class="input" id="q" type="search" name="q" placeholder="Busca por nombre, NIT o ciudad…" value="${esc(F.q)}" autocomplete="off" spellcheck="false" aria-label="Buscar clientes" />
      <button class="clear" type="button" data-act="clearq" aria-label="Borrar la búsqueda">${ic('x')}</button>
    </div>
    <select class="select" id="fArea" aria-label="Área de práctica">${opt([['all', 'Todas las áreas'], ...Object.keys(D.AREAS).map((a) => [a, a])], F.area)}</select>
    <select class="select" id="fTipo" aria-label="Tipo de cliente">${opt([['all', 'Empresas y personas'], ['Empresa', 'Solo empresas'], ['Persona', 'Solo personas']], F.tipo)}</select>
    <select class="select" id="fLaw" aria-label="Abogado responsable">${opt([['all', 'Todos los responsables'], ...D.ABOGADOS.map((a) => [a.id, lawName(a)])], F.abogado)}</select>
    <button class="icon-toggle" type="button" data-act="fav" aria-pressed="${F.fav}" aria-label="Mostrar solo favoritos">${ic('star-f')}</button>
    <div class="seg" role="group" aria-label="Vista">
      <button type="button" data-view="grid" aria-pressed="${F.view === 'grid'}" aria-label="Cuadrícula">${ic('grid')}</button>
      <button type="button" data-view="table" aria-pressed="${F.view === 'table'}" aria-label="Lista">${ic('list')}</button>
    </div>
  </div>

  <div class="filters" role="group" aria-label="Filtrar por estado">
    ${['all', ...D.ESTADOS].map((e) => `<button type="button" class="chip" data-estado="${esc(e)}" aria-pressed="${F.estado === e}">${e === 'all' ? 'Todos' : esc(e)}<span data-count-for="${esc(e)}"></span></button>`).join('')}
    <span class="sep" aria-hidden="true"></span>
    <button type="button" class="chip" data-act="hearing" aria-pressed="${F.hearing}">Con audiencia próxima<span data-count-for="hearing"></span></button>
    <button type="button" class="clear-all" data-act="reset" id="clearAll" hidden>Quitar filtros</button>
  </div>

  <div class="result-line">
    <p id="resultLine" aria-live="polite"></p>
    <select class="select" id="fSort" aria-label="Ordenar">${opt(SORTS, F.sort)}</select>
  </div>
  <section id="results" aria-label="Resultados"></section>
  <nav class="pager" id="pager" aria-label="Paginación"></nav>`;

  $('#q').addEventListener('input', debounce((e) => { F.q = e.target.value.trim(); F.page = 1; updateList(); }, 120));
  $('#fArea').addEventListener('change', (e) => { F.area = e.target.value; F.page = 1; updateList(); });
  $('#fTipo').addEventListener('change', (e) => { F.tipo = e.target.value; F.page = 1; updateList(); });
  $('#fLaw').addEventListener('change', (e) => { F.abogado = e.target.value; F.page = 1; updateList(); });
  $('#fSort').addEventListener('change', (e) => { F.sort = e.target.value; updateList(); });
  updateList({ flip: false });
}

function syncControls() {
  const press = (el, on) => el && el.setAttribute('aria-pressed', String(!!on));
  $('#searchBox')?.classList.toggle('has', !!F.q);
  press($('[data-act="fav"]'), F.fav);
  press($('[data-act="hearing"]'), F.hearing);
  $$('[data-view]').forEach((b) => press(b, b.dataset.view === F.view));
  $$('[data-estado]').forEach((b) => press(b, b.dataset.estado === F.estado));
  const set = (id, v) => { const el = $(id); if (el && el.value !== v) el.value = v; };
  set('#fArea', F.area); set('#fTipo', F.tipo); set('#fLaw', F.abogado); set('#fSort', F.sort);
  const clr = $('#clearAll'); if (clr) clr.hidden = !anyFilter();
  const activos = clients.filter((c) => c.estado === 'Activo').length;
  const sub = $('#clientsSub'); if (sub) sub.textContent = `${plural(clients.length, 'cliente', 'clientes')} en el directorio, ${activos} con asuntos activos.`;
}

function updateCounts() {
  const base = clients.filter((c) => matches(c, 'estado'));
  $$('[data-count-for]').forEach((el) => {
    const k = el.dataset.countFor;
    const n = k === 'all' ? base.length
      : k === 'hearing' ? clients.filter((c) => matches(c, 'hearing') && c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0).length
      : base.filter((c) => c.estado === k).length;
    el.className = 'mono roll';
    roll(el, String(n));
  });
}

function cardHTML(c) {
  const a = LAW(c.abogado);
  const n = openCases(c);
  return `
  <article class="client" data-key="${c.id}">
    <div class="client-top">
      ${avatar(c.nombre)}
      <div class="client-name">
        <h3><a class="stretch" href="${clientHref(c.id)}">${esc(c.nombre)}</a></h3>
        <p>${esc(c.email)}</p>
      </div>
      <button type="button" class="star" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Marcar como favorito: ${esc(c.nombre)}">${ic(c.favorito ? 'star-f' : 'star')}</button>
    </div>
    <div class="client-tags">${status(c.estado)}${pill(c.area)}</div>
    <p class="client-last">${esc(lastNote(c))}</p>
    <div class="client-foot">
      <span class="who">${gAvatar(a)}${esc(lawName(a))}, ${esc(rel(c.ultimaActividad))}</span>
      <span class="num-pair"><span title="Casos abiertos">${plural(n, 'caso', 'casos')}</span><span title="Por cobrar">${c.pendiente ? fmtCompact.format(c.pendiente) : 'Al día'}</span></span>
    </div>
  </article>`;
}

function tableHTML(list) {
  const [k, dir] = F.sort.split(':');
  const th = (key, label, cls = '') => `<th scope="col" class="${cls}" ${k === key ? `aria-sort="${dir === 'asc' ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${key}">${label}${k === key ? ic('chev-d', 'sm') : ''}</button></th>`;
  return `<div class="card"><div class="table-wrap"><table>
    <thead><tr>${th('nom', 'Cliente')}<th scope="col">Estado</th><th scope="col">Área</th><th scope="col">Responsable</th>${th('cas', 'Casos', 'num')}${th('fac', 'Facturado', 'num')}${th('act', 'Actividad')}<th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
    <tbody>${list.map((c) => `<tr data-key="${c.id}">
        <td><div class="cell">${avatar(c.nombre)}<div><a class="stretch" href="${clientHref(c.id)}"><strong>${esc(c.nombre)}</strong></a><small>${esc(c.email)}</small></div></div></td>
        <td>${status(c.estado)}</td>
        <td class="muted">${esc(c.area)}</td>
        <td><div class="cell">${gAvatar(LAW(c.abogado))}${esc(lawName(LAW(c.abogado)))}</div></td>
        <td class="num">${openCases(c)}</td>
        <td class="num">${fmtMoney.format(c.facturado)}</td>
        <td class="muted">${esc(cap(rel(c.ultimaActividad)))}</td>
        <td><div class="row-actions">
          <button type="button" class="star" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Marcar como favorito: ${esc(c.nombre)}">${ic(c.favorito ? 'star-f' : 'star')}</button>
          <button type="button" class="icon-btn" data-edit="${c.id}" aria-label="Editar ${esc(c.nombre)}">${ic('edit')}</button>
          <button type="button" class="icon-btn" data-del="${c.id}" aria-label="Eliminar ${esc(c.nombre)}">${ic('trash')}</button>
        </div></td>
      </tr>`).join('')}</tbody></table></div></div>`;
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
  updateCounts();
  writeUrl();
  $('#resultLine').textContent = list.length ? plural(list.length, 'cliente', 'clientes') : 'Sin resultados';

  // FLIP: al filtrar, cada tarjeta viaja a su nuevo sitio (la animación explica el cambio)
  const old = new Map($$('[data-key]', box).map((el) => [el.dataset.key, el.getBoundingClientRect()]));
  box.innerHTML = !list.length
    ? `<div class="card empty"><h2>Ningún cliente coincide con los filtros</h2><p>Revisa la búsqueda o quita algún filtro para ver más resultados.</p><button type="button" class="btn btn-secondary" data-act="reset">Quitar filtros</button></div>`
    : F.view === 'grid' ? `<div class="grid">${items.map(cardHTML).join('')}</div>` : tableHTML(items);
  if (!reduced && flip) {
    $$('[data-key]', box).forEach((el) => {
      const o = old.get(el.dataset.key);
      if (o) {
        const r = el.getBoundingClientRect();
        if (o.left !== r.left || o.top !== r.top) el.animate([{ transform: `translate(${o.left - r.left}px,${o.top - r.top}px)` }, { transform: 'none' }], { duration: 300, easing: EASE });
      } else {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
      }
    });
  }

  $('#pager').innerHTML = pages > 1 ? `
    <span>Mostrando del ${from + 1} al ${from + items.length} de ${list.length}</span>
    <span class="pager-btns">
      <button type="button" class="btn btn-secondary" data-page="${F.page - 1}" ${F.page === 1 ? 'disabled' : ''}>${ic('chev-l')}Anterior</button>
      <button type="button" class="btn btn-secondary" data-page="${F.page + 1}" ${F.page === pages ? 'disabled' : ''}>Siguiente${ic('chev-r')}</button>
    </span>` : '';
}

function refresh() {
  if (current === 'clientes') updateList(); else renderDashboard();
  if (drawerId) { const c = byId(drawerId); c ? renderDrawer(c) : closeDrawer(); }
}

function toggleFav(id) {
  const c = byId(id);
  if (!c) return;
  c.favorito = !c.favorito;
  save();
  $$(`[data-fav="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', String(c.favorito)); $('use', b).setAttribute('href', `#i-${c.favorito ? 'star-f' : 'star'}`); });
  toast(c.favorito ? `Añadiste <b>${esc(c.nombre)}</b> a favoritos.` : `Quitaste <b>${esc(c.nombre)}</b> de favoritos.`, { duration: 2500 });
  if (F.fav && current === 'clientes') updateList();
}

/* =========================================================
   CAPAS: foco atrapado y devuelto al cerrar
   ========================================================= */
const layerStack = [];
function pushLayer(el) {
  layerStack.push({ el, back: document.activeElement });
  el.removeAttribute('inert');
}
function popLayer(el) {
  const i = layerStack.findIndex((l) => l.el === el);
  if (i < 0) return;
  const [{ back }] = layerStack.splice(i, 1);
  el.setAttribute('inert', '');
  if (back && document.contains(back) && !layerStack.length) back.focus({ preventScroll: true });
}
function syncOverlay() {
  const open = layerStack.length > 0;
  $('#overlay').classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !layerStack.length) return;
  const root = layerStack[layerStack.length - 1].el;
  const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', root).filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
});

/* =========================================================
   FICHA DEL CLIENTE
   ========================================================= */
let drawerId = null, drawerTab = 'resumen';

function openDrawer(id) {
  const c = byId(id);
  if (!c) { go(`#/clientes${queryString()}`); return; }
  const dr = $('#drawer');
  const wasOpen = dr.classList.contains('open');
  if (drawerId !== id) drawerTab = 'resumen';
  drawerId = id;
  renderDrawer(c);
  setTitle();
  if (!wasOpen) {
    dr.classList.add('open');
    dr.setAttribute('aria-hidden', 'false');
    dr.setAttribute('role', 'dialog');
    dr.setAttribute('aria-modal', 'true');
    pushLayer(dr);
    syncOverlay();
    setTimeout(() => $('[data-act="close-drawer"]', dr)?.focus(), 50);
  }
}
function closeDrawer(silent) {
  const dr = $('#drawer');
  if (!dr.classList.contains('open')) return;
  drawerId = null;
  dr.classList.remove('open');
  dr.setAttribute('aria-hidden', 'true');
  popLayer(dr);
  syncOverlay();
  setTitle();
  if (!silent && parseHash().id) go(`#/clientes${queryString()}`);
}

function renderDrawer(c) {
  $('#drawer').innerHTML = `
    <div class="dr-head">
      <div class="dr-bar">
        <span class="crumb">Clientes</span>
        <div>
          <button type="button" class="icon-btn star" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Marcar como favorito">${ic(c.favorito ? 'star-f' : 'star')}</button>
          <button type="button" class="icon-btn" data-edit="${c.id}" aria-label="Editar cliente">${ic('edit')}</button>
          <button type="button" class="icon-btn" data-act="close-drawer" aria-label="Cerrar la ficha">${ic('x')}</button>
        </div>
      </div>
      <div class="dr-id">
        ${avatar(c.nombre, 'lg')}
        <div><h2 id="drTitle">${esc(c.nombre)}</h2><p>${c.tipo === 'Empresa' ? 'Empresa' : 'Persona natural'}, <span class="mono">${esc(c.documento)}</span></p></div>
      </div>
      <div class="dr-tags">${status(c.estado)}${pill(c.area)}${(c.etiquetas || []).map(pill).join('')}</div>
      <div class="tabs" id="drTabs" role="tablist" aria-label="Secciones de la ficha">
        <button type="button" role="tab" id="t-resumen" data-tab="resumen" aria-controls="drBody">Resumen</button>
        <button type="button" role="tab" id="t-casos" data-tab="casos" aria-controls="drBody">Casos<span class="count">${c.casos.length}</span></button>
        <button type="button" role="tab" id="t-actividad" data-tab="actividad" aria-controls="drBody">Actividad</button>
      </div>
    </div>
    <div class="dr-body" id="drBody" role="tabpanel"></div>
    <div class="dr-foot">
      <a class="btn btn-secondary" href="mailto:${esc(c.email)}">${ic('mail')}Escribir correo</a>
      <a class="btn btn-secondary" href="tel:${esc(c.telefono.replace(/\s/g, ''))}">${ic('phone')}Llamar</a>
      <button type="button" class="btn btn-ghost" data-del="${c.id}" aria-label="Eliminar cliente">${ic('trash')}</button>
    </div>`;
  $('#drawer').setAttribute('aria-labelledby', 'drTitle');
  renderTab(c);
}

function renderTab(c) {
  $$('#drTabs [data-tab]').forEach((b) => { const on = b.dataset.tab === drawerTab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  $('#drBody').setAttribute('aria-labelledby', `t-${drawerTab}`);
  const a = LAW(c.abogado);
  const pagado = c.facturado ? (1 - c.pendiente / c.facturado) : 1;
  let html = '';
  if (drawerTab === 'resumen') {
    const copy = (v, label) => `<button type="button" class="copy" data-copy="${esc(v)}" aria-label="Copiar ${label}: ${esc(v)}"><span>${esc(v)}</span>${ic('copy', 'sm')}</button>`;
    html = `
      <h3 class="dr-sec">Contacto</h3>
      <dl class="facts">
        <div><dt>Correo</dt><dd>${copy(c.email, 'correo')}</dd></div>
        <div><dt>Teléfono</dt><dd>${copy(c.telefono, 'teléfono')}</dd></div>
        ${c.contacto ? `<div><dt>Persona de contacto</dt><dd>${esc(c.contacto)}</dd></div>` : ''}
        <div><dt>Ciudad</dt><dd>${esc(c.ciudad)}</dd></div>
        <div><dt>Responsable</dt><dd>${gAvatar(a)}${esc(lawName(a))}</dd></div>
        <div><dt>Cliente desde</dt><dd>${fmtDate(c.desde)}</dd></div>
        <div><dt>Próxima audiencia</dt><dd>${c.proximaAudiencia ? `${fmtDate(c.proximaAudiencia)} <span class="muted">(${inDays(c.proximaAudiencia)})</span>` : '<span class="muted">Sin programar</span>'}</dd></div>
      </dl>
      <h3 class="dr-sec">Estado de cuenta</h3>
      <div class="account">
        <div><small>Total facturado</small><strong>${fmtMoney.format(c.facturado)}</strong></div>
        <div><small>Por cobrar</small><strong>${c.pendiente ? fmtMoney.format(c.pendiente) : 'Al día'}</strong>
          <div class="track"><i style="--w:${pagado.toFixed(3)}"></i></div>
          <small>${fmtPct.format(pagado)} cobrado</small></div>
      </div>
      <h3 class="dr-sec">Notas internas</h3>
      <p class="notes">${esc(c.notas || 'Todavía no hay notas.')}</p>`;
  } else if (drawerTab === 'casos') {
    html = c.casos.length ? c.casos.map((k) => {
      const p = k.estado === 'Cerrado' ? 100 : k.progreso;
      return `<div class="case">
        <div class="case-top">
          <div><strong>${esc(k.titulo)}</strong><small>Expediente <span class="mono">${esc(k.expediente)}</span>, ${esc(k.estado.toLowerCase())}</small></div>
          <span class="prio ${k.prioridad}">Prioridad ${k.prioridad.toLowerCase()}</span>
        </div>
        <div class="track"><i style="--w:${(p / 100).toFixed(2)}"></i></div>
        <div class="case-foot"><span>Avance del proceso</span><span class="mono">${p} %</span></div>
      </div>`;
    }).join('') : `<div class="empty"><h2>Este cliente no tiene casos</h2><p>Los casos que abras para este cliente aparecerán aquí.</p></div>`;
  } else {
    html = `<ol class="timeline">${c.timeline.map((t) => `<li><div>${esc(t.texto)}<time datetime="${t.fecha}">${fmtDate(t.fecha)}, ${esc(rel(t.fecha))}</time></div></li>`).join('')}</ol>`;
  }
  $('#drBody').innerHTML = html;
  $('#drBody').scrollTop = 0;
}

/* =========================================================
   MODAL: crear, editar y confirmar
   ========================================================= */
let formDirty = false;
const modalOpen = () => $('#modal').getAttribute('aria-hidden') === 'false';

function openModal(html, label) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>`;
  m.setAttribute('aria-hidden', 'false');
  pushLayer(m);
  requestAnimationFrame(() => m.classList.add('open'));
  syncOverlay();
}
function closeModal(force) {
  const m = $('#modal');
  if (!modalOpen()) return;
  if (formDirty && !force) return askDiscard();
  formDirty = false;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  popLayer(m);
  syncOverlay();
  setTimeout(() => { if (!m.classList.contains('open')) m.innerHTML = ''; }, 200);
}
function askDiscard() {
  const foot = $('#modal .modal-foot');
  if (!foot || foot.dataset.asking) return;
  foot.dataset.asking = '1';
  foot._prev = foot.innerHTML;
  foot.innerHTML = `<span class="warn-text">Tienes cambios sin guardar.</span>
    <button type="button" class="btn btn-secondary" data-act="keep-editing">Seguir editando</button>
    <button type="button" class="btn btn-danger" data-act="discard">Descartar cambios</button>`;
  $('[data-act="keep-editing"]', foot).focus();
}

function openForm(id) {
  const c = id ? byId(id) : null;
  const v = c || { tipo: 'Empresa', nombre: '', documento: '', email: '', telefono: '', ciudad: 'Bogotá', area: 'Corporativo', estado: 'Potencial', abogado: 'ev', etiquetas: [], notas: '' };
  const cities = [...new Set(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', v.ciudad])];
  const opt = (arr, sel) => arr.map((x) => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${val === sel ? 'selected' : ''}>${esc(lab)}</option>`; }).join('');
  openModal(`
    <form id="clientForm" novalidate>
      <div class="modal-head">
        <h2>${c ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <p>${c ? esc(c.nombre) : 'Los campos con asterisco son obligatorios.'}</p>
      </div>
      <div class="form-grid">
        <fieldset class="radio-row full">
          <legend>Tipo de cliente</legend>
          <label><input type="radio" name="tipo" value="Empresa" ${v.tipo === 'Empresa' ? 'checked' : ''}>Empresa</label>
          <label><input type="radio" name="tipo" value="Persona" ${v.tipo === 'Persona' ? 'checked' : ''}>Persona natural</label>
        </fieldset>
        <label class="field full" data-f="nombre">Nombre o razón social *
          <input class="input" name="nombre" autocomplete="organization" value="${esc(v.nombre)}" placeholder="Grupo Horizonte SAS…" aria-describedby="e-nombre">
          <span class="err" id="e-nombre">Escribe al menos 3 caracteres.</span></label>
        <label class="field">Documento o NIT
          <input class="input" name="documento" autocomplete="off" spellcheck="false" value="${esc(v.documento)}" placeholder="NIT 900.123.456-7…"></label>
        <label class="field">Ciudad<select class="select" name="ciudad" autocomplete="address-level2">${opt(cities, v.ciudad)}</select></label>
        <label class="field" data-f="email">Correo electrónico *
          <input class="input" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" value="${esc(v.email)}" placeholder="contacto@empresa.com…" aria-describedby="e-email">
          <span class="err" id="e-email">Usa el formato nombre@dominio.com.</span></label>
        <label class="field" data-f="telefono">Teléfono
          <input class="input" name="telefono" type="tel" inputmode="tel" autocomplete="tel" value="${esc(v.telefono)}" placeholder="+57 300 000 0000…" aria-describedby="e-tel">
          <span class="err" id="e-tel">Usa solo números, espacios y el signo +.</span></label>
        <label class="field">Área de práctica<select class="select" name="area">${opt(Object.keys(D.AREAS), v.area)}</select></label>
        <label class="field">Estado<select class="select" name="estado">${opt(D.ESTADOS, v.estado)}</select></label>
        <label class="field">Abogado responsable<select class="select" name="abogado">${opt(D.ABOGADOS.map((a) => [a.id, lawName(a)]), v.abogado)}</select></label>
        <label class="field">Etiquetas<input class="input" name="etiquetas" autocomplete="off" value="${esc((v.etiquetas || []).join(', '))}" placeholder="VIP, Referido…"></label>
        <label class="field full">Notas internas<textarea class="input" name="notas" placeholder="Preferencias, acuerdos, observaciones…">${esc(v.notas)}</textarea></label>
      </div>
      <div class="modal-foot">
        <span class="hint">${MOD}&nbsp;+&nbsp;Enter guarda</span>
        <button type="button" class="btn btn-secondary" data-act="close-modal">Cancelar</button>
        <button type="submit" class="btn btn-primary">${c ? 'Guardar cambios' : 'Crear cliente'}</button>
      </div>
    </form>`, c ? 'Editar cliente' : 'Nuevo cliente');
  formDirty = false;
  const form = $('#clientForm');
  form.addEventListener('submit', (e) => { e.preventDefault(); saveForm(c ? c.id : ''); });
  form.addEventListener('input', (e) => { formDirty = true; e.target.closest('[data-f]')?.classList.remove('invalid'); e.target.removeAttribute('aria-invalid'); });
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); form.requestSubmit(); } });
  if (matchMedia('(pointer: fine)').matches) setTimeout(() => form.nombre.focus(), 50);
}

function saveForm(id) {
  const form = $('#clientForm');
  const val = (n) => form[n].value.trim();
  const errs = [];
  if (val('nombre').length < 3) errs.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) errs.push('email');
  if (val('telefono') && !/^[+\d][\d\s()-]{6,}$/.test(val('telefono'))) errs.push('telefono');
  $$('[data-f]', form).forEach((l) => l.classList.remove('invalid'));
  if (errs.length) {
    errs.forEach((n) => { form[n].closest('[data-f]').classList.add('invalid'); form[n].setAttribute('aria-invalid', 'true'); });
    form[errs[0]].focus();
    return;
  }
  const data = {
    tipo: form.querySelector('[name="tipo"]:checked').value,
    nombre: val('nombre'), documento: val('documento') || 'Sin documento', email: val('email'), telefono: val('telefono') || 'Sin teléfono',
    ciudad: val('ciudad'), area: val('area'), estado: val('estado'), abogado: val('abogado'),
    etiquetas: val('etiquetas').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
    notas: val('notas'),
  };
  let c;
  if (id) {
    c = byId(id);
    Object.assign(c, data, { ultimaActividad: HOY });
    c.timeline.unshift({ fecha: HOY, texto: 'Datos del cliente actualizados' });
    toast(`Guardaste los cambios de <b>${esc(c.nombre)}</b>.`);
  } else {
    c = {
      id: 'c' + Date.now().toString(36), ...data, contacto: '',
      desde: HOY, ultimaActividad: HOY, proximaAudiencia: null,
      facturado: 0, pendiente: 0, satisfaccion: 5, favorito: false, casos: [],
      timeline: [{ fecha: HOY, texto: 'Cliente creado en el directorio' }],
    };
    clients.unshift(c);
    toast(`Creaste el cliente <b>${esc(c.nombre)}</b>.`, { action: { label: 'Abrir ficha', fn: () => go(`#/clientes/${c.id}`) } });
  }
  save();
  closeModal(true);
  if (!id) {
    resetFilters(); F.sort = 'act:desc';
    if (current !== 'clientes') go('#/clientes');
    else { $('#q').value = ''; refresh(); }
  } else refresh();
}

function confirmDelete(id) {
  const c = byId(id);
  if (!c) return;
  openModal(`
    <div class="modal-head">
      <h2>Eliminar a ${esc(c.nombre)}</h2>
      <p>Se quitarán del directorio sus datos y ${plural(c.casos.length, 'caso asociado', 'casos asociados')}. Podrás deshacerlo durante 6 segundos.</p>
    </div>
    <div class="modal-foot" style="margin-top:20px">
      <button type="button" class="btn btn-secondary" data-act="close-modal">Cancelar</button>
      <button type="button" class="btn btn-danger" data-act="do-delete" data-id="${c.id}">Eliminar cliente</button>
    </div>`, 'Confirmar eliminación');
  setTimeout(() => $('#modal [data-act="close-modal"]')?.focus(), 50);
}
function doDelete(id) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const [c] = clients.splice(idx, 1);
  save();
  closeModal(true);
  closeDrawer();
  refresh();
  toast(`Eliminaste a <b>${esc(c.nombre)}</b>.`, {
    duration: 6000,
    action: { label: 'Deshacer', fn: () => { clients.splice(idx, 0, c); save(); refresh(); toast(`Restauraste a <b>${esc(c.nombre)}</b>.`); } },
  });
}

/* =========================================================
   BÚSQUEDA RÁPIDA
   ========================================================= */
let palSel = 0, palRun = [];
const ACTIONS = [
  { label: 'Crear cliente', hint: 'Abre el formulario', icon: 'plus', kbd: 'N', fn: () => openForm() },
  { label: 'Ir al resumen', hint: 'Cifras, audiencias y actividad', icon: 'dashboard', fn: () => go('#/dashboard') },
  { label: 'Ir a clientes', hint: 'El directorio completo', icon: 'users', fn: () => go('#/clientes') },
  { label: 'Ver favoritos', hint: 'Clientes marcados con estrella', icon: 'star', fn: () => go('#/clientes?favoritos=1') },
  { label: 'Ver clientes con audiencia', hint: 'Audiencias programadas', icon: 'gavel', fn: () => go('#/clientes?audiencia=1') },
  { label: 'Cambiar el tema', hint: 'Claro u oscuro', icon: 'moon', fn: () => toggleTheme() },
  { label: 'Exportar a CSV', hint: 'Descarga la lista actual', icon: 'download', fn: () => exportCSV() },
  { label: 'Restablecer datos de ejemplo', hint: 'Descarta los cambios guardados en este navegador', icon: 'undo', fn: () => { clients = JSON.parse(JSON.stringify(D.clientes)); save(); refresh(); toast('Restableciste los datos de ejemplo.'); } },
];

function openPalette() {
  const p = $('#palette');
  if (p.classList.contains('open')) return;
  p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  pushLayer(p);
  $('#paletteInput').value = '';
  palSel = 0;
  renderPalette();
  syncOverlay();
  setTimeout(() => $('#paletteInput').focus(), 30);
}
function closePalette() {
  const p = $('#palette');
  if (!p.classList.contains('open')) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
  popLayer(p);
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
    html += `<div class="pl-group" role="presentation">Clientes</div>`;
    html += cls.map((c) => { palRun.push(() => go(`#/clientes/${c.id}`)); return `<button type="button" role="option" id="pl-${palRun.length - 1}" class="pl-item" data-pi="${palRun.length - 1}">${avatar(c.nombre)}<div><strong>${mark(c.nombre, q)}</strong><small>${esc(c.area)}, ${esc(c.ciudad)}</small></div><kbd>Enter</kbd></button>`; }).join('');
  }
  if (acts.length) {
    html += `<div class="pl-group" role="presentation">Acciones</div>`;
    html += acts.map((a) => { palRun.push(a.fn); return `<button type="button" role="option" id="pl-${palRun.length - 1}" class="pl-item" data-pi="${palRun.length - 1}"><span class="avatar">${ic(a.icon)}</span><div><strong>${mark(a.label, q)}</strong><small>${esc(a.hint)}</small></div><kbd>${a.kbd || 'Enter'}</kbd></button>`; }).join('');
  }
  $('#paletteList').innerHTML = html || `<p class="pl-empty">Nada coincide con “${esc($('#paletteInput').value)}”. Prueba con un nombre o una ciudad.</p>`;
  palSel = Math.min(palSel, Math.max(0, palRun.length - 1));
  paintSel();
}
function paintSel() {
  $$('.pl-item').forEach((el) => { const on = +el.dataset.pi === palSel; el.classList.toggle('sel', on); el.setAttribute('aria-selected', String(on)); });
  const sel = $(`.pl-item[data-pi="${palSel}"]`);
  sel?.scrollIntoView({ block: 'nearest' });
  sel ? $('#paletteInput').setAttribute('aria-activedescendant', sel.id) : $('#paletteInput').removeAttribute('aria-activedescendant');
}
function runPal(i) { const fn = palRun[i]; closePalette(); if (fn) fn(); }

/* =========================================================
   TEMA, CSV, NOTIFICACIONES
   ========================================================= */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#0a0a0a' : '#fafafa');
  try { localStorage.setItem('lex-theme', next); } catch { /* */ }
}

function exportCSV() {
  const list = current === 'clientes' ? filtered() : clients;
  const cols = [
    ['Nombre', 'nombre'], ['Tipo', 'tipo'], ['Documento', 'documento'], ['Área', 'area'], ['Estado', 'estado'],
    ['Responsable', (c) => lawName(LAW(c.abogado))], ['Correo', 'email'], ['Teléfono', 'telefono'], ['Ciudad', 'ciudad'],
    ['Cliente desde', 'desde'], ['Casos abiertos', (c) => openCases(c)], ['Facturado', 'facturado'], ['Por cobrar', 'pendiente'],
  ];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [cols.map((c) => cell(c[0])).join(';'), ...list.map((c) => cols.map(([, k]) => cell(typeof k === 'function' ? k(c) : c[k])).join(';'))];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clientes-${HOY}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`Exportaste ${plural(list.length, 'cliente', 'clientes')} a CSV.`);
}

function renderNotifs() {
  const prox = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0).sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia)).slice(0, 2);
  const deuda = [...clients].sort((a, b) => b.pendiente - a.pendiente)[0];
  const nuevo = [...clients].sort((a, b) => b.desde.localeCompare(a.desde))[0];
  const items = [
    ...prox.map((c) => ({ id: c.id, ic: 'gavel', t: `Audiencia de <b>${esc(c.nombre)}</b> ${inDays(c.proximaAudiencia)}`, s: fmtDate(c.proximaAudiencia) })),
    deuda && { id: deuda.id, ic: 'wallet', t: `<b>${esc(deuda.nombre)}</b> tiene el mayor saldo por cobrar`, s: fmtMoney.format(deuda.pendiente) },
    nuevo && { id: nuevo.id, ic: 'users', t: `Nuevo cliente: <b>${esc(nuevo.nombre)}</b>`, s: cap(rel(nuevo.desde)) },
  ].filter(Boolean);
  $('#notifPop').innerHTML = `<div class="pop-head"><strong>Notificaciones</strong><button type="button" data-act="read-all">Marcar todo como leído</button></div>` +
    items.map((n) => `<a class="pop-item" href="#/clientes/${n.id}">${ic(n.ic)}<div><p>${n.t}</p><small>${n.s}</small></div></a>`).join('');
}
function setNotif(open) { $('#notifPop').classList.toggle('open', open); $('#notifBtn').setAttribute('aria-expanded', String(open)); }

/* =========================================================
   EVENTOS
   ========================================================= */
// Enlaces internos: navegación en memoria; Ctrl/⌘ + clic y clic central siguen abriendo otra pestaña
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  setNotif(false);
  go(a.getAttribute('href'));
}, true);

document.addEventListener('click', (e) => {
  const q = (s) => e.target.closest(s);
  let el;
  if (!q('.pop-wrap')) setNotif(false);
  if ((el = q('[data-fav]'))) return toggleFav(el.dataset.fav);
  if ((el = q('[data-edit]'))) return openForm(el.dataset.edit);
  if ((el = q('[data-del]'))) return confirmDelete(el.dataset.del);
  if ((el = q('[data-copy]'))) {
    const v = el.dataset.copy;
    navigator.clipboard?.writeText(v).then(() => toast(`Copiaste <b>${esc(v)}</b>.`, { duration: 2000 }), () => toast('No se pudo copiar. Selecciona el texto y cópialo con el teclado.'));
    return;
  }
  if ((el = q('[data-tab]'))) { drawerTab = el.dataset.tab; const c = byId(drawerId); if (c) renderTab(c); return; }
  if ((el = q('[data-pi]'))) return runPal(+el.dataset.pi);
  if ((el = q('[data-mode]'))) {
    chartMode = el.dataset.mode;
    $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    return drawMainChart();
  }
  if ((el = q('[data-view]'))) { F.view = el.dataset.view; store.set('lex-view', F.view); return updateList({ flip: false }); }
  if ((el = q('[data-estado]'))) { F.estado = el.dataset.estado; F.page = 1; return updateList(); }
  if ((el = q('[data-page]'))) { F.page = +el.dataset.page; updateList({ flip: false }); return window.scrollTo({ top: 0 }); }
  if ((el = q('[data-sort]'))) {
    const [k, d] = F.sort.split(':');
    const key = el.dataset.sort;
    F.sort = `${key}:${k === key ? (d === 'asc' ? 'desc' : 'asc') : key === 'nom' ? 'asc' : 'desc'}`;
    return updateList();
  }
  if ((el = q('[data-act]'))) {
    const a = el.dataset.act;
    if (a === 'new') return openForm();
    if (a === 'export') return exportCSV();
    if (a === 'close-drawer') return closeDrawer();
    if (a === 'close-modal') return closeModal();
    if (a === 'keep-editing') { const f = $('#modal .modal-foot'); if (f) { f.innerHTML = f._prev; delete f.dataset.asking; } return; }
    if (a === 'discard') return closeModal(true);
    if (a === 'do-delete') return doDelete(el.dataset.id);
    if (a === 'clearq') { F.q = ''; $('#q').value = ''; $('#q').focus(); F.page = 1; return updateList(); }
    if (a === 'reset') { resetFilters(); if ($('#q')) $('#q').value = ''; return updateList(); }
    if (a === 'fav') { F.fav = !F.fav; F.page = 1; return updateList(); }
    if (a === 'hearing') { F.hearing = !F.hearing; F.page = 1; return updateList(); }
    if (a === 'read-all') { $('.ping')?.remove(); $('#notifBtn').setAttribute('aria-label', 'Notificaciones'); setNotif(false); return toast('Marcaste todas las notificaciones como leídas.', { duration: 2000 }); }
  }
});

// Pestañas de la ficha con flechas (patrón WAI-ARIA)
document.addEventListener('keydown', (e) => {
  const tab = e.target.closest?.('[role="tab"]');
  if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const tabs = $$('#drTabs [role="tab"]');
  let i = tabs.indexOf(tab);
  i = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  drawerTab = tabs[i].dataset.tab;
  const c = byId(drawerId); if (c) renderTab(c);
  tabs[i].focus();
});

// Atajos
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
    return setNotif(false);
  }
  if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey || layerStack.length) return;
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
addEventListener('beforeunload', (e) => { if (formDirty && modalOpen()) { e.preventDefault(); e.returnValue = ''; } });

$('#openPalette').addEventListener('click', openPalette);
$('#themeToggle').addEventListener('click', toggleTheme);
$('#notifBtn').addEventListener('click', () => { renderNotifs(); setNotif(!$('#notifPop').classList.contains('open')); });
$$('[data-soon]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  toast(`La sección <b>${esc(a.textContent.trim())}</b> todavía no está disponible.`);
}));

addEventListener('resize', debounce(() => { if (current === 'dashboard') drawMainChart(); }, 150));
const syncFromUrl = () => { let h = ''; try { h = location.hash; } catch { /* */ } if (h.startsWith('#/') && h !== routeHash) { scrollMemory[routeHash.split('?')[0]] = scrollY; routeHash = h; restoring = true; route(); } };
addEventListener('hashchange', syncFromUrl);
addEventListener('popstate', syncFromUrl);

/* Inicio */
try { history.scrollRestoration = 'manual'; } catch { /* */ }
$('#kbdHint').innerHTML = `${MOD}&nbsp;K`;
$('#navCount').textContent = clients.length;
try { if (location.hash.startsWith('#/')) routeHash = location.hash; } catch { /* */ }
if (routeHash === '#/dashboard') safeUrl('replaceState', routeHash);
route();
