/* =========================================================
   Lex & Asociados — Directorio de clientes
   Vanilla JS, sin dependencias.
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
const EASE = 'cubic-bezier(.22,1,.36,1)';
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const sum = (arr, k) => arr.reduce((s, x) => s + (+x[k] || 0), 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Formatos con Intl (nada de fechas o números escritos a mano) */
const LOCALE = 'es-CO';
const fmtMoney = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat(LOCALE);
const fmtPct = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });
const dfDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
const dfLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
const dfWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
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
const inDays = (s) => { const d = diffDays(s); return d === 0 ? 'hoy' : d === 1 ? 'mañana' : `en ${d} días`; };

const initials = (n) => n.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const hue = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
const LAW = (id) => D.ABOGADOS.find((a) => a.id === id) || D.ABOGADOS[0];
const lawName = (a) => `${a.titulo} ${a.nombre}`;
const AREA = (a) => D.AREAS[a] || { color: '#6e7672', icon: 'scale' };
const STATUS = {
  'Activo': { cls: 's-activo', color: 'var(--ok)' },
  'En revisión': { cls: 's-revision', color: 'var(--warn)' },
  'Potencial': { cls: 's-potencial', color: 'var(--info)' },
  'Inactivo': { cls: 's-inactivo', color: 'var(--off)' },
};
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

/* ---------------------------------------------------------
   Persistencia
   --------------------------------------------------------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};
const STORE_KEY = 'lex-clients-v2';
let clients = store.get(STORE_KEY, null) || JSON.parse(JSON.stringify(D.clientes));
const byId = (id) => clients.find((c) => c.id === id);
function save() { store.set(STORE_KEY, clients); updateNavCount(); }

/* ---------------------------------------------------------
   Estado de filtros, sincronizado con la URL
   --------------------------------------------------------- */
const DEFAULTS = { q: '', estado: 'all', area: 'all', abogado: 'all', tipo: 'all', fav: false, hearing: false, letter: '', sort: 'act:desc', page: 1, view: store.get('lex-view', 'grid') };
const F = { ...DEFAULTS };
const PARAMS = { q: 'q', estado: 'estado', area: 'area', abogado: 'abogado', tipo: 'tipo', fav: 'favoritos', hearing: 'audiencia', letter: 'letra', sort: 'orden', page: 'p', view: 'vista' };
const PER_PAGE = 12;

function queryString() {
  const sp = new URLSearchParams();
  for (const [k, p] of Object.entries(PARAMS)) {
    const v = F[k];
    if (v === DEFAULTS[k] || v === false || v === '' || v === 'all') continue;
    if (k === 'view' && v === 'grid') continue;
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
    else if (k === 'view') F.view = v === 'table' || v === 'grid' ? v : F.view;
    else F[k] = v ?? DEFAULTS[k];
  }
  if (!CMP[F.sort.split(':')[0]]) F.sort = DEFAULTS.sort;
  return before !== JSON.stringify(F);
}
const clientHref = (id) => `#/clientes/${id}${queryString()}`;
function writeUrl() {
  if (current !== 'clientes') return;
  const url = `#/clientes${drawerId ? '/' + drawerId : ''}${queryString()}`;
  if (location.hash !== url) history.replaceState(null, '', url);
}

/* ---------------------------------------------------------
   Piezas pequeñas
   --------------------------------------------------------- */
const avatar = (name, cls = '', extra = '') => `<div class="avatar ${cls}" style="--h:${hue(name)}" aria-hidden="true">${esc(initials(name))}${extra}</div>`;
const lawAvatar = (a, cls = 'xs') => `<div class="avatar ${cls} round" style="--h:${a.hue}" aria-hidden="true">${esc(initials(a.nombre))}</div>`;
const badge = (estado) => `<span class="badge ${STATUS[estado]?.cls || ''}">${esc(estado)}</span>`;
const areaTag = (a) => `<span class="area-tag" style="--ac:${AREA(a).color}">${ic(AREA(a).icon + '-f', 'sm')}${esc(a)}</span>`;
const tags = (list = []) => list.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
const statusDot = (c) => `<span class="status-dot" style="background:${STATUS[c.estado]?.color}"></span>`;

/* Dígitos que ruedan: el valor cambia moviéndose, no sustituyéndose */
function roll(el, text) {
  if (!el) return;
  text = String(text);
  if (reduced) { el.textContent = text; return; }
  const chars = [...text];
  const isD = (c) => /\d/.test(c);
  const prev = el._roll;
  const same = prev && prev.length === chars.length && prev.every((c, i) => isD(c) === isD(chars[i]) && (isD(c) || c === chars[i]));
  if (!same) {
    el.classList.add('roll');
    el.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true" style="display:inline-flex">${chars.map((c) => isD(c)
      ? `<span class="rd"><span class="rd-col">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`
      : `<span class="rs">${esc(c)}</span>`).join('')}</span>`;
    void el.offsetWidth;
  } else {
    $('.sr-only', el).textContent = text;
  }
  let k = 0;
  const cols = $$('.rd-col', el);
  chars.forEach((c) => { if (isD(c)) { const col = cols[k]; col.style.transitionDelay = `${k * 35}ms`; col.style.transform = `translateY(${-c * 10}%)`; k++; } });
  el._roll = chars;
}
function rollAll(root) { $$('[data-roll]', root).forEach((el) => roll(el, el.dataset.roll)); }

function fillTracks(root = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('.track i[data-w]', root).forEach((b) => { b.style.transform = `scaleX(${b.dataset.w / 100})`; });
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
const niceMax = (v) => { const e = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / e; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * e; };

/* ---------------------------------------------------------
   Avisos
   --------------------------------------------------------- */
function toast(msg, { type = 'ok', action = null, duration = 4000 } = {}) {
  const colors = { ok: 'var(--green)', info: 'var(--brass)', bad: 'var(--seal)' };
  const icons = { ok: 'check-f', info: 'alert-f', bad: 'trash-f' };
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.style.setProperty('--tc', colors[type]);
  el.innerHTML = `${ic(icons[type])}<p>${msg}</p>${action ? `<button type="button">${esc(action.label)}</button>` : ''}<span class="t-bar" style="animation-duration:${duration}ms"></span>`;
  const kill = () => { if (el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => el.remove(), 300); };
  if (action) $('button', el).onclick = () => { action.fn(); kill(); };
  $('#toasts').appendChild(el);
  let timer = setTimeout(kill, duration);
  const bar = $('.t-bar', el);
  el.onmouseenter = () => { clearTimeout(timer); bar.style.animationPlayState = 'paused'; };
  el.onmouseleave = () => { timer = setTimeout(kill, 1500); bar.style.animationPlayState = 'running'; };
  const all = $$('.toast:not(.out)'); if (all.length > 3) all[0].classList.add('out');
}

/* ---------------------------------------------------------
   Router
   --------------------------------------------------------- */
let current = null;
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
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
    window.scrollTo({ top: 0 });
    document.title = `${p === 'clientes' ? 'Clientes' : 'Resumen'} · Lex & Asociados`;
  } else if (p === 'clientes' && applyParams(params)) {
    if ($('#q')) $('#q').value = F.q;
    updateList();
  }
  if (p === 'clientes' && id) openDrawer(id); else closeDrawer(true);
  setActiveNav(p);
  toggleSidebarMobile(false);
}

function setActiveNav(p) {
  const links = $$('#nav a[data-route]');
  links.forEach((a) => { const on = a.dataset.route === p; a.classList.toggle('active', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  const act = links.find((a) => a.dataset.route === p);
  const ind = $('#navIndicator');
  if (act) { ind.style.transform = `translateY(${act.offsetTop}px)`; ind.style.opacity = 1; }
}
function updateNavCount() { $('#navCount').textContent = clients.length; }

/* =========================================================
   RESUMEN
   ========================================================= */
let chartMode = 'clientes';
let chartIdx = D.serie.length - 1;

function renderDashboard() {
  const activos = clients.filter((c) => c.estado === 'Activo');
  const casos = clients.flatMap((c) => c.casos.map((k) => ({ ...k, cliente: c })));
  const abiertos = casos.filter((k) => k.estado !== 'Cerrado');
  const altas = abiertos.filter((k) => k.prioridad === 'Alta').length;
  const facturado = sum(clients, 'facturado'), pendiente = sum(clients, 'pendiente');
  const recaudo = facturado ? 1 - pendiente / facturado : 0;
  const s = D.serie, last = s[s.length - 1], prev = s[s.length - 2];
  const pct = (a, b) => (a - b) / (b || 1);
  const proximas = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)
    .sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia));
  const semana = proximas.filter((c) => diffDays(c.proximaAudiencia) < 7).length;
  const mes = dfMonth.format(parseD(HOY));

  // Agenda: los próximos 10 días hábiles (los juzgados no abren en fin de semana)
  const days = [];
  for (let i = 0; days.length < 10; i++) {
    const d = new Date(parseD(HOY).getTime() + i * 864e5);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
    days.push({ d, iso, today: i === 0, monday: d.getDay() === 1 && days.length > 0, items: proximas.filter((c) => c.proximaAudiencia === iso) });
  }
  let hd = 0;

  const areas = Object.keys(D.AREAS).map((a) => ({ a, n: clients.filter((c) => c.area === a).length })).filter((x) => x.n).sort((x, y) => y.n - x.n);
  const maxArea = Math.max(1, ...areas.map((x) => x.n));
  const lawLoad = D.ABOGADOS.map((a) => {
    const mine = clients.filter((c) => c.abogado === a.id && c.estado !== 'Inactivo');
    return { a, n: mine.length, k: mine.reduce((t, c) => t + c.casos.filter((x) => x.estado !== 'Cerrado').length, 0) };
  });
  const maxLoad = Math.max(1, ...lawLoad.map((x) => x.k));
  const feed = clients.flatMap((c) => c.timeline.map((t) => ({ ...t, c }))).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
  const recientes = [...clients].sort((a, b) => b.desde.localeCompare(a.desde)).slice(0, 6);
  const nuevosMes = clients.filter((c) => c.desde.slice(0, 7) === HOY.slice(0, 7)).length || last.nuevos;
  const dlt = (v, txt) => `<span class="delta ${v >= 0 ? 'up' : 'down'}">${ic(v >= 0 ? 'trend-f' : 'trend-down-f', 'sm')}${v >= 0 ? '+' : ''}${fmtPct.format(v)} <small>${txt}</small></span>`;

  $('#view').innerHTML = `
  <header class="page-head enter">
    <div>
      <h1 class="page-title">${cap(dfLong.format(parseD(HOY)))}</h1>
      <p class="page-sub">${plural(semana, 'audiencia', 'audiencias')} en los próximos 7 días y ${plural(altas, 'caso', 'casos')} de prioridad alta.</p>
    </div>
    <div class="head-actions">
      <a class="btn btn-ghost" href="#/clientes">${ic('users')}Ver clientes</a>
      <button class="btn btn-primary" type="button" data-act="new">${ic('plus', 'turn')}Nuevo cliente</button>
    </div>
  </header>

  <div class="dash">
    <section class="panel docket c-12 enter" style="--d:80" aria-labelledby="h-docket">
      <div class="panel-head">
        <div><h2 id="h-docket">Agenda de audiencias</h2><p>Los próximos 10 días hábiles</p></div>
        <a class="text-link" href="#/clientes?audiencia=1">Ver clientes con audiencia</a>
      </div>
      <div class="docket-scroll" style="margin-top:14px" tabindex="0" aria-label="Agenda de los próximos 10 días hábiles">
        <div class="docket-grid">
          ${days.map((x) => `<div class="day ${x.today ? 'today' : ''} ${x.monday ? 'week-start' : ''}">
              <div class="day-head"><span>${x.today ? 'Hoy' : esc(cap(dfWeekday.format(x.d)).replace('.', ''))}</span><b>${x.d.getDate()}</b></div>
              ${x.items.map((c) => {
                const caso = c.casos.find((k) => k.estado !== 'Cerrado') || c.casos[0];
                return `<a class="hear" href="#/clientes/${c.id}" style="--ac:${AREA(c.area).color};--d:${300 + (hd++) * 70}">${esc(c.nombre)}<span>${esc(caso ? caso.titulo : c.area)}</span></a>`;
              }).join('')}
            </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="panel c-12 enter" style="--d:160" aria-label="Cifras del despacho">
      <dl class="ledger">
        <div class="fig"><dt>Clientes activos</dt><dd data-roll="${fmtInt.format(activos.length)}">0</dd>${dlt(pct(last.nuevos, prev.nuevos), `${plural(nuevosMes, 'nuevo', 'nuevos')} este mes`)}</div>
        <div class="fig"><dt>Casos abiertos</dt><dd data-roll="${fmtInt.format(abiertos.length)}">0</dd><span class="delta"><small>${plural(altas, 'de prioridad alta', 'de prioridad alta')}</small></span></div>
        <div class="fig"><dt>Ingresos de ${mes}</dt><dd data-roll="${fmtCompact.format(last.ingresos)}">0</dd>${dlt(pct(last.ingresos, prev.ingresos), 'frente al mes anterior')}</div>
        <div class="fig"><dt>Por cobrar</dt><dd data-roll="${fmtCompact.format(pendiente)}">0</dd><span class="delta"><small>${fmtPct.format(recaudo)} de lo facturado ya está recaudado</small></span></div>
      </dl>
    </section>

    <section class="panel c-8 enter" style="--d:240" aria-labelledby="h-chart">
      <div class="panel-head">
        <h2 id="h-chart">Evolución de la cartera</h2>
        <div class="seg" id="chartSeg" role="group" aria-label="Serie del gráfico"><span class="seg-pill"></span>
          <button type="button" data-mode="clientes" aria-pressed="${chartMode === 'clientes'}">Clientes</button>
          <button type="button" data-mode="ingresos" aria-pressed="${chartMode === 'ingresos'}">Ingresos</button>
        </div>
      </div>
      <div class="chart-read" aria-live="polite"><strong id="chartVal">0</strong><span id="chartLbl"></span></div>
      <div class="chart-wrap" id="mainChart" tabindex="0" aria-label="Gráfico mensual. Usa las flechas para recorrer los meses."></div>
      <div class="chart-key" id="chartKey"></div>
    </section>

    <section class="panel c-4 enter" style="--d:300" aria-labelledby="h-areas">
      <div class="panel-head"><div><h2 id="h-areas">Clientes por área</h2><p>Abre un área para ver sus clientes</p></div></div>
      <div class="panel-body">
        ${areas.map((x, i) => `
          <a class="hbar" href="#/clientes?area=${encodeURIComponent(x.a)}" style="--ac:${AREA(x.a).color}">
            <span class="hbar-label">${ic(AREA(x.a).icon + '-f', 'sm')}${esc(x.a)}</span><b>${x.n}</b>
            <span class="track" style="--bc:${AREA(x.a).color}"><i data-w="${Math.round((x.n / maxArea) * 100)}" style="--d:${400 + i * 60}"></i></span>
          </a>`).join('')}
      </div>
    </section>

    <section class="panel c-7 enter" style="--d:360" aria-labelledby="h-recent">
      <div class="panel-head">
        <div><h2 id="h-recent">Clientes recientes</h2><p>Las últimas incorporaciones</p></div>
        <a class="text-link" href="#/clientes?orden=des:desc">Ver todos</a>
      </div>
      <div class="panel-body table-wrap">
        <table>
          <thead><tr><th scope="col">Cliente</th><th scope="col">Área</th><th scope="col">Responsable</th><th scope="col" class="num">Facturado</th></tr></thead>
          <tbody>
            ${recientes.map((c) => `
              <tr>
                <td><div class="cell-client">${avatar(c.nombre, 'sm', statusDot(c))}<div><a class="row-link" href="#/clientes/${c.id}"><strong>${esc(c.nombre)}</strong></a><small>${esc(c.estado)}, desde ${fmtDate(c.desde)}</small></div></div></td>
                <td>${areaTag(c.area)}</td>
                <td><span title="${esc(lawName(LAW(c.abogado)))}">${lawAvatar(LAW(c.abogado))}</span><span class="sr-only">${esc(lawName(LAW(c.abogado)))}</span></td>
                <td class="num"><b>${fmtCompact.format(c.facturado)}</b></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel c-5 enter" style="--d:420" aria-labelledby="h-log">
      <div class="panel-head"><div><h2 id="h-log">Bitácora</h2><p>Movimientos recientes en los expedientes</p></div></div>
      <div class="panel-body">
        <ul class="log">
          ${feed.map((f) => `<li><time datetime="${f.fecha}">${esc(cap(rel(f.fecha)))}</time><div><b>${esc(f.c.nombre)}</b>: ${esc(f.texto.charAt(0).toLowerCase() + f.texto.slice(1))}<small>${esc(lawName(LAW(f.c.abogado)))}</small></div></li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="panel c-12 enter" style="--d:480" aria-labelledby="h-load">
      <div class="panel-head"><div><h2 id="h-load">Carga por abogado</h2><p>Casos abiertos asignados a cada miembro del equipo</p></div></div>
      <div class="panel-body loads">
        ${lawLoad.map(({ a, n, k }, i) => `
          <div class="load">
            ${lawAvatar(a, 'sm')}
            <div>
              <div class="load-top"><strong>${esc(lawName(a))}</strong><span>${plural(k, 'caso', 'casos')}, ${plural(n, 'cliente', 'clientes')}</span></div>
              <div class="track" style="--bc:hsl(${a.hue} 35% 42%)"><i data-w="${Math.round((k / maxLoad) * 100)}" style="--d:${500 + i * 60}"></i></div>
            </div>
          </div>`).join('')}
      </div>
    </section>
  </div>`;

  setTimeout(() => rollAll($('#view')), 200);
  fillTracks($('#view'));
  requestAnimationFrame(() => { segPill($('#chartSeg')); drawMainChart(true); });
}

function segPill(seg) {
  if (!seg) return;
  const on = $('button[aria-pressed="true"]', seg), pill = $('.seg-pill', seg);
  if (on && pill) { pill.style.transform = `translateX(${on.offsetLeft - 3}px)`; pill.style.width = on.offsetWidth + 'px'; pill.style.left = '3px'; }
}

function chartSeries() {
  const s = D.serie;
  return chartMode === 'ingresos'
    ? [{ name: 'Ingresos', color: 'var(--green)', vals: s.map((x) => x.ingresos), fmt: (v) => fmtCompact.format(v), lbl: (m) => `facturados en ${m}` }]
    : [{ name: 'Nuevos clientes', color: 'var(--green)', vals: s.map((x) => x.nuevos), fmt: (v) => fmtInt.format(v), lbl: (m) => `clientes nuevos en ${m}` },
       { name: 'Casos cerrados', color: 'var(--brass)', vals: s.map((x) => x.cerrados), fmt: (v) => fmtInt.format(v) }];
}
const monthName = (i) => dfMonth.format(new Date(2025, 11 + i, 1));

function drawMainChart(animate) {
  const wrap = $('#mainChart');
  if (!wrap) return;
  const W = wrap.clientWidth, H = wrap.clientHeight, P = { l: 52, r: 16, t: 14, b: 28 };
  const s = D.serie, labels = s.map((x) => x.mes);
  const series = chartSeries();
  const max = niceMax(Math.max(...series.flatMap((x) => x.vals)) * 1.1);
  const step = (W - P.l - P.r) / (labels.length - 1);
  const X = (i) => P.l + i * step;
  const Y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);

  $('#chartKey').innerHTML = series.map((x) => `<span><i style="background:${x.color}"></i>${x.name}</span>`).join('');

  let svg = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>`;
  series.forEach((x, i) => { svg += `<linearGradient id="ag${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${x.color};stop-opacity:.16"/><stop offset="1" style="stop-color:${x.color};stop-opacity:0"/></linearGradient>`; });
  svg += '</defs>';
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4, y = Y(v);
    svg += `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text class="axis" x="${P.l - 10}" y="${y + 4}" text-anchor="end">${series[0].fmt(v)}</text>`;
  }
  labels.forEach((l, i) => { svg += `<text class="axis xl" data-i="${i}" x="${X(i)}" y="${H - 6}" text-anchor="middle">${l}</text>`; });
  series.forEach((x, i) => {
    const pts = x.vals.map((v, j) => [X(j), Y(v)]);
    const d = smooth(pts);
    if (i === 0) svg += `<path class="area" d="${d} L ${X(pts.length - 1)} ${H - P.b} L ${X(0)} ${H - P.b} Z" fill="url(#ag0)" style="${animate ? '' : 'animation:none'}"/>`;
    svg += `<path class="line" d="${d}" style="stroke:${x.color}"/>`;
  });
  svg += `<line class="guide" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}"/>`;
  series.forEach((x, i) => { svg += `<circle class="dot" data-s="${i}" cx="0" cy="0" r="5" style="fill:var(--surface);stroke:${x.color};stroke-width:2.5"/>`; });
  svg += '</svg>';
  wrap.innerHTML = svg;

  if (animate && !reduced) {
    $$('.line', wrap).forEach((p, i) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.style.animationDelay = 300 + i * 160 + 'ms';
      p.classList.add('draw');
    });
  }

  const guide = $('.guide', wrap), dots = $$('.dot', wrap), xl = $$('.xl', wrap);
  const setIdx = (i) => {
    chartIdx = Math.max(0, Math.min(labels.length - 1, i));
    const x = X(chartIdx);
    guide.style.transform = `translateX(${x}px)`;
    dots.forEach((d) => { d.style.transform = `translate(${x}px, ${Y(series[d.dataset.s].vals[chartIdx])}px)`; });
    xl.forEach((t) => t.classList.toggle('on', +t.dataset.i === chartIdx));
    roll($('#chartVal'), series[0].fmt(series[0].vals[chartIdx]));
    const m = monthName(chartIdx);
    $('#chartLbl').textContent = series[1]
      ? `${series[0].lbl(m)}; ${fmtInt.format(series[1].vals[chartIdx])} casos cerrados`
      : series[0].lbl(m);
  };
  setIdx(chartIdx);
  wrap.onpointermove = (e) => {
    const r = wrap.getBoundingClientRect();
    const i = Math.round((e.clientX - r.left - P.l) / step);
    if (i !== chartIdx) setIdx(i);
  };
  wrap.onpointerleave = () => setIdx(labels.length - 1);
  wrap.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); setIdx(chartIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setIdx(chartIdx + 1); }
  };
}

/* =========================================================
   DIRECTORIO
   ========================================================= */
const SORTS = [
  ['act:desc', 'Actividad más reciente'], ['act:asc', 'Actividad más antigua'],
  ['nom:asc', 'Nombre, de la A a la Z'], ['nom:desc', 'Nombre, de la Z a la A'],
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
const openCases = (c) => c.casos.filter((k) => k.estado !== 'Cerrado').length;

function matches(c, skip = '') {
  if (skip !== 'estado' && F.estado !== 'all' && c.estado !== F.estado) return false;
  if (F.area !== 'all' && c.area !== F.area) return false;
  if (F.abogado !== 'all' && c.abogado !== F.abogado) return false;
  if (F.tipo !== 'all' && c.tipo !== F.tipo) return false;
  if (F.fav && !c.favorito) return false;
  if (skip !== 'hearing' && F.hearing && !(c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0)) return false;
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
  const activos = clients.filter((c) => c.estado === 'Activo').length;
  $('#view').innerHTML = `
  <header class="page-head enter">
    <div>
      <h1 class="page-title">Clientes</h1>
      <p class="page-sub" id="clientsSub">${plural(clients.length, 'cliente', 'clientes')} en el directorio, ${activos} con asuntos activos.</p>
    </div>
    <div class="head-actions">
      <button class="btn btn-ghost" type="button" data-act="export">${ic('download')}Exportar CSV</button>
      <button class="btn btn-primary" type="button" data-act="new">${ic('plus', 'turn')}Nuevo cliente</button>
    </div>
  </header>

  <div class="toolbar enter" style="--d:60" role="search">
    <div class="field search-box" id="searchBox">
      ${ic('search')}
      <input class="input" id="q" type="search" name="q" placeholder="Nombre, NIT o ciudad…" value="${esc(F.q)}" autocomplete="off" spellcheck="false" aria-label="Buscar clientes" />
      <button class="clear" type="button" data-act="clearq" aria-label="Borrar búsqueda">${ic('x', 'sm')}</button>
    </div>
    <select class="select" id="fArea" aria-label="Área de práctica">
      <option value="all">Todas las áreas</option>
      ${Object.keys(D.AREAS).map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}
    </select>
    <select class="select" id="fTipo" aria-label="Tipo de cliente">
      <option value="all">Empresas y personas</option>
      <option value="Empresa">Solo empresas</option>
      <option value="Persona">Solo personas</option>
    </select>
    <div class="lawyer-filter" role="group" aria-label="Filtrar por abogado responsable">
      ${D.ABOGADOS.map((a) => `<button type="button" data-law="${a.id}" data-tip="${esc(lawName(a))}" aria-label="${esc(lawName(a))}" aria-pressed="false">${lawAvatar(a, 'xs')}</button>`).join('')}
    </div>
    <span class="spacer"></span>
    <button class="icon-btn fav-toggle" type="button" data-act="fav" aria-label="Mostrar solo favoritos" aria-pressed="false">${ic('star-f')}</button>
  </div>

  <div class="chips" role="group" aria-label="Filtrar por estado">
    ${['all', ...D.ESTADOS].map((e) => `<button type="button" class="chip" data-estado="${esc(e)}" aria-pressed="false">${e === 'all' ? 'Todos' : esc(e)}<span class="roll" data-count-for="${esc(e)}"></span></button>`).join('')}
    <span class="chip-sep" aria-hidden="true"></span>
    <button type="button" class="chip" data-act="hearing" aria-pressed="false">${ic('gavel-f', 'sm')}Con audiencia próxima<span class="roll" data-count-for="hearing"></span></button>
    <div class="active-filters" id="afs"></div>
  </div>

  <nav class="cabinet" id="cabinet" aria-label="Índice alfabético"></nav>

  <div class="result-line">
    <p id="resultLine" aria-live="polite"></p>
    <div class="result-tools">
      <select class="select" id="fSort" aria-label="Ordenar clientes">
        ${SORTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
      <div class="seg" id="viewSeg" role="group" aria-label="Vista"><span class="seg-pill"></span>
        <button type="button" data-view="grid" aria-label="Carpetas" aria-pressed="false">${ic('grid-f', 'sm')}</button>
        <button type="button" data-view="table" aria-label="Lista" aria-pressed="false">${ic('list-f', 'sm')}</button>
      </div>
    </div>
  </div>
  <section id="results" aria-label="Resultados"></section>
  <nav class="pager" id="pager" aria-label="Paginación"></nav>`;

  $('#q').addEventListener('input', debounce((e) => { F.q = e.target.value.trim(); F.page = 1; updateList(); }, 140));
  $('#fArea').addEventListener('change', (e) => { F.area = e.target.value; F.page = 1; updateList(); });
  $('#fTipo').addEventListener('change', (e) => { F.tipo = e.target.value; F.page = 1; updateList(); });
  $('#fSort').addEventListener('change', (e) => { F.sort = e.target.value; updateList(); });

  if (!skeletonDone && !reduced) {
    skeletonDone = true;
    const sk = (w, h, m = '') => `<div class="skel" style="width:${w};height:${h}px;${m}"></div>`;
    $('#results').innerHTML = `<div class="folders">${Array.from({ length: 6 }, (_, i) => `
      <div class="folder" style="--ac:var(--rule)" aria-hidden="true">
        <div class="folder-tab" style="width:${[96, 120, 84, 132, 104, 90][i]}px"></div>
        <div class="folder-body">
          <div class="f-head">${sk('40px', 40, 'border-radius:10px')}<div style="flex:1">${sk('70%', 12)}${sk('45%', 9, 'margin-top:8px')}</div></div>
          <div class="f-meta">${[0, 1, 2].map(() => `<div>${sk('60%', 9)}${sk('40%', 12, 'margin-top:8px')}</div>`).join('')}</div>
          <div class="f-foot">${sk('26px', 26, 'border-radius:50%')}${sk('40%', 10)}</div>
        </div>
      </div>`).join('')}</div>`;
    syncControls();
    setTimeout(() => { if (current === 'clientes') updateList({ flip: false }); }, 600);
  } else {
    updateList({ flip: false });
  }
}

function syncControls() {
  $('#searchBox')?.classList.toggle('has', !!F.q);
  const press = (el, on) => el && el.setAttribute('aria-pressed', String(!!on));
  press($('.fav-toggle'), F.fav);
  press($('[data-act="hearing"]'), F.hearing);
  $$('[data-law]').forEach((b) => press(b, b.dataset.law === F.abogado));
  $$('#viewSeg [data-view]').forEach((b) => press(b, b.dataset.view === F.view));
  $$('[data-estado]').forEach((b) => press(b, b.dataset.estado === F.estado));
  segPill($('#viewSeg'));
  if ($('#fArea')) $('#fArea').value = F.area;
  if ($('#fTipo')) $('#fTipo').value = F.tipo;
  if ($('#fSort')) $('#fSort').value = F.sort;
}

function updateChips() {
  const base = clients.filter((c) => matches(c, 'estado'));
  $$('[data-count-for]').forEach((el) => {
    const k = el.dataset.countFor;
    const n = k === 'all' ? base.length
      : k === 'hearing' ? clients.filter((c) => matches(c, 'hearing') && c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0).length
      : base.filter((c) => c.estado === k).length;
    roll(el, String(n));
  });
  const pills = [];
  if (F.q) pills.push(['q', `“${esc(F.q)}”`]);
  if (F.area !== 'all') pills.push(['area', esc(F.area)]);
  if (F.tipo !== 'all') pills.push(['tipo', F.tipo === 'Empresa' ? 'Empresas' : 'Personas']);
  if (F.abogado !== 'all') pills.push(['abogado', esc(lawName(LAW(F.abogado)))]);
  if (F.fav) pills.push(['fav', 'Favoritos']);
  if (F.letter) pills.push(['letter', `Letra ${F.letter}`]);
  $('#afs').innerHTML = pills.map(([k, l]) => `<span class="af">${l}<button type="button" data-rm="${k}" aria-label="Quitar filtro ${l.replace(/<[^>]+>/g, '')}">${ic('x', 'sm')}</button></span>`).join('')
    + (pills.length > 1 || (pills.length && (F.estado !== 'all' || F.hearing)) ? '<button type="button" class="clear-all" data-act="reset">Quitar todos los filtros</button>' : '');
}

function renderCabinet() {
  const avail = new Set(clients.filter((c) => matches(c, 'letter')).map(firstLetter));
  $('#cabinet').innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) =>
    `<button type="button" data-letter="${l}" aria-pressed="${F.letter === l}" ${avail.has(l) || F.letter === l ? '' : 'disabled'}>${l}</button>`).join('');
}

function folderHTML(c) {
  const a = LAW(c.abogado), ar = AREA(c.area);
  const tipoTxt = c.tipo === 'Empresa' ? 'Empresa' : 'Persona natural';
  return `
  <article class="folder" data-key="${c.id}" style="--ac:${ar.color}">
    <div class="folder-tab" aria-hidden="true">${ic(ar.icon + '-f')}${esc(c.area)}</div>
    <div class="folder-body">
      <div class="f-head">
        ${avatar(c.nombre, '', statusDot(c))}
        <div class="f-name">
          <h3><a href="${clientHref(c.id)}">${esc(c.nombre)}</a></h3>
          <p>${tipoTxt} en ${esc(c.ciudad)}</p>
        </div>
        <button type="button" class="mini-btn star-btn" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Favorito: ${esc(c.nombre)}">${ic(c.favorito ? 'star-f' : 'star')}</button>
      </div>
      <dl class="f-meta">
        <div><dt>Estado</dt><dd>${badge(c.estado)}</dd></div>
        <div><dt>Casos abiertos</dt><dd>${openCases(c)}</dd></div>
        <div><dt>Por cobrar</dt><dd>${c.pendiente ? fmtCompact.format(c.pendiente) : 'Al día'}</dd></div>
      </dl>
      <div class="f-foot">
        <div class="f-lawyer">${lawAvatar(a)}<div><b>${esc(lawName(a))}</b><span>Actividad ${esc(rel(c.ultimaActividad))}</span></div></div>
        <div class="f-actions">
          <a class="mini-btn" href="mailto:${esc(c.email)}" aria-label="Escribir a ${esc(c.nombre)}">${ic('mail')}</a>
          <a class="mini-btn" href="tel:${esc(c.telefono.replace(/\s/g, ''))}" aria-label="Llamar a ${esc(c.nombre)}">${ic('phone')}</a>
        </div>
      </div>
    </div>
  </article>`;
}

function tableHTML(list) {
  const [k, dir] = F.sort.split(':');
  const th = (key, label, cls = '') => `<th scope="col" class="${cls}" ${k === key ? `aria-sort="${dir === 'asc' ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${key}">${label}${k === key ? ic('chev-d-f', 'sm') : ''}</button></th>`;
  return `<div class="panel"><div class="table-wrap"><table>
    <thead><tr>${th('nom', 'Cliente')}<th scope="col">Área</th><th scope="col">Estado</th><th scope="col">Responsable</th>${th('cas', 'Casos', 'num')}${th('fac', 'Facturado', 'num')}${th('act', 'Última actividad')}<th scope="col"><span class="sr-only">Acciones</span></th></tr></thead>
    <tbody>${list.map((c) => {
      const a = LAW(c.abogado);
      return `<tr data-key="${c.id}">
        <td><div class="cell-client">${avatar(c.nombre, 'sm', statusDot(c))}<div><a class="row-link" href="${clientHref(c.id)}"><strong>${esc(c.nombre)}</strong></a><small>${esc(c.email)}</small></div></div></td>
        <td>${areaTag(c.area)}</td>
        <td>${badge(c.estado)}</td>
        <td><div class="cell-client">${lawAvatar(a)}<small>${esc(lawName(a))}</small></div></td>
        <td class="num">${c.casos.length}</td>
        <td class="num">${fmtMoney.format(c.facturado)}</td>
        <td><small style="color:var(--muted)">${esc(cap(rel(c.ultimaActividad)))}</small></td>
        <td><div class="row-actions">
          <button type="button" class="mini-btn star-btn" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Favorito: ${esc(c.nombre)}">${ic(c.favorito ? 'star-f' : 'star')}</button>
          <button type="button" class="mini-btn" data-edit="${c.id}" aria-label="Editar ${esc(c.nombre)}">${ic('edit')}</button>
          <button type="button" class="mini-btn" data-del="${c.id}" aria-label="Eliminar ${esc(c.nombre)}">${ic('trash')}</button>
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
  updateChips();
  renderCabinet();
  writeUrl();
  $('#resultLine').innerHTML = list.length
    ? `<b>${plural(list.length, 'cliente', 'clientes')}</b>${pages > 1 ? `, del ${from + 1} al ${from + items.length}` : ''}`
    : 'Ningún cliente coincide';

  const old = new Map($$('[data-key]', box).map((el) => [el.dataset.key, el.getBoundingClientRect()]));
  box.innerHTML = !list.length
    ? `<div class="panel empty">${ic('folder')}<h2>Ningún cliente coincide</h2><p>Prueba con otro nombre o quita alguno de los filtros activos.</p><button type="button" class="btn btn-primary" data-act="reset">Quitar los filtros</button></div>`
    : F.view === 'grid' ? `<div class="folders">${items.map(folderHTML).join('')}</div>` : tableHTML(items);

  // Reordenamiento FLIP: cada carpeta viaja a su nuevo sitio; las nuevas entran
  if (!reduced) {
    let n = 0;
    $$('[data-key]', box).forEach((el) => {
      const o = flip && old.get(el.dataset.key);
      if (o) {
        const r = el.getBoundingClientRect();
        const dx = o.left - r.left, dy = o.top - r.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 500, easing: EASE });
      } else {
        el.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
          { duration: 450, delay: Math.min(n++, 12) * 35, easing: EASE, fill: 'backwards' });
      }
    });
  }

  $('#pager').innerHTML = pages > 1 ? `
    <button type="button" data-page="${F.page - 1}" ${F.page === 1 ? 'disabled' : ''} aria-label="Página anterior">${ic('chev-l')}</button>
    ${Array.from({ length: pages }, (_, i) => `<button type="button" data-page="${i + 1}" ${F.page === i + 1 ? 'aria-current="page"' : ''} aria-label="Página ${i + 1}">${i + 1}</button>`).join('')}
    <button type="button" data-page="${F.page + 1}" ${F.page === pages ? 'disabled' : ''} aria-label="Página siguiente">${ic('chev-r')}</button>` : '';
}

function refresh() {
  if (current === 'clientes') {
    const activos = clients.filter((c) => c.estado === 'Activo').length;
    const sub = $('#clientsSub');
    if (sub) sub.textContent = `${plural(clients.length, 'cliente', 'clientes')} en el directorio, ${activos} con asuntos activos.`;
    updateList();
  } else renderDashboard();
  if (drawerId) { const c = byId(drawerId); c ? renderDrawer(c) : closeDrawer(); }
}

/* Favoritos */
function toggleFav(id, btn) {
  const c = byId(id);
  if (!c) return;
  c.favorito = !c.favorito;
  save();
  $$(`[data-fav="${id}"]`).forEach((b) => { b.setAttribute('aria-pressed', String(c.favorito)); $('use', b).setAttribute('href', `#i-${c.favorito ? 'star-f' : 'star'}`); });
  if (c.favorito && btn && !reduced) {
    btn.classList.remove('burst'); void btn.offsetWidth; btn.classList.add('burst');
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      const ang = (i / 6) * Math.PI * 2 - Math.PI / 2;
      s.className = 'spark';
      s.style.setProperty('--dx', Math.cos(ang) * 18 + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * 18 + 'px');
      btn.appendChild(s);
      setTimeout(() => s.remove(), 600);
    }
  }
  toast(c.favorito ? `<b>${esc(c.nombre)}</b> se añadió a favoritos.` : `<b>${esc(c.nombre)}</b> se quitó de favoritos.`, { type: 'info', duration: 2400 });
  if (F.fav && current === 'clientes') setTimeout(updateList, 350);
}

/* =========================================================
   FICHA DEL CLIENTE
   ========================================================= */
let drawerId = null, drawerTab = 'resumen', lastFocus = null;

function openDrawer(id) {
  const c = byId(id);
  if (!c) { location.hash = `#/clientes${queryString()}`; return; }
  const wasOpen = $('#drawer').classList.contains('open');
  if (drawerId !== id) drawerTab = 'resumen';
  drawerId = id;
  renderDrawer(c);
  const dr = $('#drawer');
  dr.classList.add('open');
  dr.setAttribute('aria-hidden', 'false');
  dr.setAttribute('role', 'dialog');
  dr.setAttribute('aria-modal', 'true');
  syncOverlay();
  if (!wasOpen) { lastFocus = document.activeElement; setTimeout(() => $('[data-act="close-drawer"]', dr)?.focus(), 60); }
}

function closeDrawer(silent) {
  const dr = $('#drawer');
  if (!dr.classList.contains('open')) return;
  drawerId = null;
  dr.classList.remove('open');
  dr.setAttribute('aria-hidden', 'true');
  syncOverlay();
  if (!silent && parseHash().id) location.hash = `#/clientes${queryString()}`;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

function renderDrawer(c) {
  const ar = AREA(c.area);
  $('#drawer').innerHTML = `
    <div class="dr-head" style="--ac:${ar.color}">
      <div class="dr-actions">
        <button type="button" class="icon-btn star-btn" data-fav="${c.id}" aria-pressed="${!!c.favorito}" aria-label="Favorito">${ic(c.favorito ? 'star-f' : 'star')}</button>
        <button type="button" class="icon-btn" data-edit="${c.id}" aria-label="Editar cliente">${ic('edit')}</button>
        <button type="button" class="icon-btn" data-act="close-drawer" aria-label="Cerrar ficha">${ic('x')}</button>
      </div>
      <div class="dr-id">
        ${avatar(c.nombre, 'xl')}
        <div><h2 id="drTitle">${esc(c.nombre)}</h2><p>${c.tipo === 'Empresa' ? 'Empresa' : 'Persona natural'}, ${esc(c.documento)}</p></div>
      </div>
      <div class="dr-badges">${badge(c.estado)}${areaTag(c.area)}${tags(c.etiquetas)}</div>
      <div class="tabs" id="drTabs" role="tablist" aria-label="Secciones de la ficha">
        <button type="button" role="tab" data-tab="resumen" aria-controls="drBody">Resumen</button>
        <button type="button" role="tab" data-tab="casos" aria-controls="drBody">Casos<b>${c.casos.length}</b></button>
        <button type="button" role="tab" data-tab="actividad" aria-controls="drBody">Actividad</button>
        <span class="tab-line" aria-hidden="true"></span>
      </div>
    </div>
    <div class="dr-body" id="drBody" role="tabpanel"></div>
    <div class="dr-foot">
      <a class="btn btn-ghost" href="mailto:${esc(c.email)}">${ic('mail')}Escribir</a>
      <a class="btn btn-ghost" href="tel:${esc(c.telefono.replace(/\s/g, ''))}">${ic('phone')}Llamar</a>
      <button type="button" class="btn btn-ghost danger-ghost" data-del="${c.id}" aria-label="Eliminar cliente">${ic('trash')}</button>
    </div>`;
  $('#drawer').setAttribute('aria-labelledby', 'drTitle');
  renderTab(c);
}

function renderTab(c) {
  $$('#drTabs [data-tab]').forEach((b) => { const on = b.dataset.tab === drawerTab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  const on = $('#drTabs [aria-selected="true"]'), line = $('#drTabs .tab-line');
  requestAnimationFrame(() => { line.style.transform = `translateX(${on.offsetLeft}px)`; line.style.width = on.offsetWidth + 'px'; });
  const a = LAW(c.abogado);
  const pagado = c.facturado ? Math.round((1 - c.pendiente / c.facturado) * 100) : 100;
  let html = '';

  if (drawerTab === 'resumen') {
    const copy = (v) => `<button type="button" class="copy-btn" data-copy="${esc(v)}" aria-label="Copiar ${esc(v)}"><span>${esc(v)}</span>${ic('copy', 'sm')}</button>`;
    html = `
      <h3 class="dr-sec">Contacto</h3>
      <dl class="facts">
        <div><dt>Correo</dt><dd>${copy(c.email)}</dd></div>
        <div><dt>Teléfono</dt><dd>${copy(c.telefono)}</dd></div>
        ${c.contacto ? `<div><dt>Persona de contacto</dt><dd>${esc(c.contacto)}</dd></div>` : ''}
        <div><dt>Ciudad</dt><dd>${esc(c.ciudad)}</dd></div>
        <div><dt>Cliente desde</dt><dd>${fmtDate(c.desde)}<span style="color:var(--muted)">(${esc(rel(c.desde))})</span></dd></div>
        <div><dt>Responsable</dt><dd>${lawAvatar(a)}${esc(lawName(a))}</dd></div>
        <div><dt>Próxima audiencia</dt><dd>${c.proximaAudiencia ? `${fmtDate(c.proximaAudiencia)} <span class="tag">${cap(inDays(c.proximaAudiencia))}</span>` : '<span style="color:var(--muted)">Sin programar</span>'}</dd></div>
        <div><dt>Satisfacción</dt><dd><span class="rating" aria-label="${c.satisfaccion} de 5">${Array.from({ length: 5 }, (_, i) => ic('star-f', i < c.satisfaccion ? '' : 'off')).join('')}</span></dd></div>
      </dl>
      <h3 class="dr-sec">Estado de cuenta</h3>
      <div class="account">
        <div><small>Total facturado</small><strong>${fmtMoney.format(c.facturado)}</strong></div>
        <div><small>Por cobrar</small><strong style="color:${c.pendiente ? 'var(--warn)' : 'var(--ok)'}">${c.pendiente ? fmtMoney.format(c.pendiente) : 'Al día'}</strong>
          <div class="track" style="--bc:var(--ok)"><i data-w="${pagado}"></i></div>
          <small>${pagado} % recaudado</small></div>
      </div>
      <h3 class="dr-sec">Notas internas</h3>
      <p class="notes">${esc(c.notas || 'Sin notas todavía.')}</p>`;
  } else if (drawerTab === 'casos') {
    html = c.casos.length ? c.casos.map((k, i) => {
      const p = k.estado === 'Cerrado' ? 100 : k.progreso;
      return `<div class="case" style="--d:${i * 60}">
        <div class="case-top">
          <div><strong>${esc(k.titulo)}</strong><small>Expediente ${esc(k.expediente)}, ${esc(k.estado.toLowerCase())}</small></div>
          <span class="prio ${k.prioridad}">Prioridad ${k.prioridad.toLowerCase()}</span>
        </div>
        <div class="track" style="--bc:${k.estado === 'Cerrado' ? 'var(--ok)' : AREA(c.area).color}"><i data-w="${p}"></i></div>
        <div class="case-foot"><span>Avance del proceso</span><span>${p} %</span></div>
      </div>`;
    }).join('')
      : `<div class="empty" style="padding:30px 0">${ic('folder')}<h2>Sin casos abiertos</h2><p>Cuando abras un caso para este cliente aparecerá aquí.</p></div>`;
  } else {
    html = `<ol class="timeline">${c.timeline.map((t) => `<li>${esc(t.texto)}<time datetime="${t.fecha}">${fmtDate(t.fecha)}, ${esc(rel(t.fecha))}</time></li>`).join('')}</ol>`;
  }
  const body = $('#drBody');
  body.innerHTML = `<div class="tab-pane">${html}</div>`;
  body.scrollTop = 0;
  fillTracks(body);
}

/* =========================================================
   MODAL: crear, editar, confirmar
   ========================================================= */
let formDirty = false;

function openModal(html, label) {
  const m = $('#modal');
  m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>`;
  m.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => m.classList.add('open'));
  syncOverlay(true);
}
function closeModal(force) {
  const m = $('#modal');
  if (m.getAttribute('aria-hidden') === 'true') return;
  if (formDirty && !force) return askDiscard();
  formDirty = false;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
  setTimeout(() => { if (!m.classList.contains('open')) m.innerHTML = ''; }, 400);
  syncOverlay();
}
const modalOpen = () => $('#modal').getAttribute('aria-hidden') === 'false';

function askDiscard() {
  const foot = $('#modal .modal-foot');
  if (!foot || foot.dataset.asking) return;
  foot.dataset.asking = '1';
  const prev = foot.innerHTML;
  foot.innerHTML = `<p style="margin-right:auto;align-self:center;color:var(--ink-2)">Tienes cambios sin guardar.</p>
    <button type="button" class="btn btn-ghost" data-act="keep-editing">Seguir editando</button>
    <button type="button" class="btn btn-danger" data-act="discard">Descartar cambios</button>`;
  foot.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 250, easing: EASE });
  foot._restore = () => { foot.innerHTML = prev; delete foot.dataset.asking; };
  $('[data-act="keep-editing"]', foot).focus();
}

function openForm(id) {
  const c = id ? byId(id) : null;
  const v = c || { tipo: 'Empresa', nombre: '', documento: '', email: '', telefono: '', ciudad: 'Bogotá', area: 'Corporativo', estado: 'Potencial', abogado: 'ev', etiquetas: [], notas: '' };
  const cities = [...new Set(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', v.ciudad])];
  const opt = (arr, sel) => arr.map((x) => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}" ${val === sel ? 'selected' : ''}>${esc(lab)}</option>`; }).join('');
  const err = (t) => `<span class="err" id="">${ic('warning-f', 'sm')}${t}</span>`;
  openModal(`
    <div class="modal-head">
      <div><h2>${c ? 'Editar cliente' : 'Nuevo cliente'}</h2><p>${c ? esc(c.nombre) : 'Los campos con asterisco son obligatorios.'}</p></div>
      <button type="button" class="icon-btn" data-act="close-modal" aria-label="Cerrar">${ic('x')}</button>
    </div>
    <form class="form" id="clientForm" novalidate>
      <fieldset class="type-toggle full">
        <legend>Tipo de cliente</legend>
        <label><input type="radio" name="tipo" value="Empresa" ${v.tipo === 'Empresa' ? 'checked' : ''}>${ic('building')}Empresa</label>
        <label><input type="radio" name="tipo" value="Persona" ${v.tipo === 'Persona' ? 'checked' : ''}>${ic('user')}Persona natural</label>
      </fieldset>
      <label class="full" data-f="nombre">Nombre o razón social *<input class="input" name="nombre" autocomplete="organization" value="${esc(v.nombre)}" placeholder="Grupo Horizonte S.A.S.…" aria-describedby="e-nombre">${err('Escribe al menos 3 caracteres.').replace('id=""', 'id="e-nombre"')}</label>
      <label>Documento o NIT<input class="input" name="documento" autocomplete="off" spellcheck="false" value="${esc(v.documento)}" placeholder="NIT 900.123.456-7…"></label>
      <label>Ciudad<select class="select" name="ciudad" autocomplete="address-level2">${opt(cities, v.ciudad)}</select></label>
      <label data-f="email">Correo electrónico *<input class="input" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" value="${esc(v.email)}" placeholder="contacto@empresa.com…" aria-describedby="e-email">${err('Usa el formato nombre@dominio.com.').replace('id=""', 'id="e-email"')}</label>
      <label data-f="telefono">Teléfono<input class="input" name="telefono" type="tel" inputmode="tel" autocomplete="tel" value="${esc(v.telefono)}" placeholder="+57 300 000 0000…" aria-describedby="e-tel">${err('Escribe solo números, espacios o el signo +.').replace('id=""', 'id="e-tel"')}</label>
      <label>Área de práctica<select class="select" name="area">${opt(Object.keys(D.AREAS), v.area)}</select></label>
      <label>Estado<select class="select" name="estado">${opt(D.ESTADOS, v.estado)}</select></label>
      <label>Abogado responsable<select class="select" name="abogado">${opt(D.ABOGADOS.map((a) => [a.id, lawName(a)]), v.abogado)}</select></label>
      <label>Etiquetas<input class="input" name="etiquetas" autocomplete="off" value="${esc((v.etiquetas || []).join(', '))}" placeholder="VIP, Referido…"></label>
      <label class="full">Notas internas<textarea class="input" name="notas" placeholder="Preferencias, acuerdos, observaciones…">${esc(v.notas)}</textarea></label>
    </form>
    <div class="modal-foot">
      <button type="button" class="btn btn-ghost" data-act="close-modal">Cancelar</button>
      <button type="button" class="btn btn-primary" data-act="save" data-id="${c ? c.id : ''}">${ic('check')}${c ? 'Guardar cambios' : 'Crear cliente'}</button>
    </div>`, c ? 'Editar cliente' : 'Nuevo cliente');
  formDirty = false;
  const form = $('#clientForm');
  form.addEventListener('submit', (e) => { e.preventDefault(); saveForm(c ? c.id : ''); });
  form.addEventListener('input', (e) => { formDirty = true; e.target.closest('[data-f]')?.classList.remove('invalid'); });
  if (matchMedia('(pointer: fine)').matches) setTimeout(() => form.nombre.focus(), 120);
}

function saveForm(id) {
  const form = $('#clientForm');
  const val = (n) => form[n].value.trim();
  const errs = [];
  if (val('nombre').length < 3) errs.push('nombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) errs.push('email');
  if (val('telefono') && !/^[+\d][\d\s()-]{6,}$/.test(val('telefono'))) errs.push('telefono');
  $$('[data-f]', form).forEach((l) => { l.classList.remove('invalid'); $('input', l)?.removeAttribute('aria-invalid'); });
  if (errs.length) {
    errs.forEach((n) => { form[n].closest('[data-f]').classList.add('invalid'); form[n].setAttribute('aria-invalid', 'true'); });
    const box = $('.modal-box');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
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
    toast(`Cambios guardados en <b>${esc(c.nombre)}</b>.`);
  } else {
    c = {
      id: 'c' + Date.now().toString(36), ...data, contacto: '',
      desde: HOY, ultimaActividad: HOY, proximaAudiencia: null,
      facturado: 0, pendiente: 0, satisfaccion: 5, favorito: false, casos: [],
      timeline: [{ fecha: HOY, texto: 'Cliente creado en el directorio' }],
    };
    clients.unshift(c);
    toast(`Cliente creado: <b>${esc(c.nombre)}</b>.`);
  }
  save();
  closeModal(true);
  if (!id) {
    resetFilters(); F.sort = 'act:desc';
    if (current !== 'clientes') location.hash = '#/clientes';
    else { $('#q').value = ''; refresh(); }
    setTimeout(() => {
      const el = $(`[data-key="${c.id}"] .folder-body, tr[data-key="${c.id}"]`);
      if (el && !reduced) el.animate([{ boxShadow: '0 0 0 0 color-mix(in srgb, var(--green) 60%, transparent)' }, { boxShadow: '0 0 0 12px transparent' }], { duration: 900, iterations: 2, delay: 300 });
    }, 700);
  } else {
    refresh();
  }
}

function confirmDelete(id) {
  const c = byId(id);
  if (!c) return;
  openModal(`
    <div class="confirm">
      <h2>¿Eliminar a ${esc(c.nombre)}?</h2>
      <p>Se quitarán del directorio sus datos de contacto y ${plural(c.casos.length, 'caso asociado', 'casos asociados')}. Podrás deshacerlo durante unos segundos.</p>
      <div class="row">
        <button type="button" class="btn btn-ghost" data-act="close-modal">Cancelar</button>
        <button type="button" class="btn btn-danger" data-act="do-delete" data-id="${c.id}">${ic('trash')}Eliminar cliente</button>
      </div>
    </div>`, 'Confirmar eliminación');
  setTimeout(() => $('#modal [data-act="close-modal"]')?.focus(), 60);
}

function doDelete(id) {
  const idx = clients.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const [c] = clients.splice(idx, 1);
  save();
  closeModal(true);
  closeDrawer();
  refresh();
  toast(`Cliente eliminado: <b>${esc(c.nombre)}</b>.`, {
    type: 'bad', duration: 6000,
    action: { label: 'Deshacer', fn: () => { clients.splice(idx, 0, c); save(); refresh(); toast(`Cliente restaurado: <b>${esc(c.nombre)}</b>.`); } },
  });
}

function syncOverlay(force) {
  const open = force || $('#drawer').classList.contains('open') || modalOpen() || $('#palette').classList.contains('open');
  $('#overlay').classList.toggle('open', !!open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* =========================================================
   BÚSQUEDA RÁPIDA (Ctrl + K)
   ========================================================= */
let palSel = 0, palRun = [];
const ACTIONS = [
  { label: 'Crear un cliente', hint: 'Abre el formulario de alta', icon: 'plus', kbd: 'N', fn: () => openForm() },
  { label: 'Ir al resumen', hint: 'Agenda, cifras y bitácora', icon: 'dashboard', fn: () => { location.hash = '#/dashboard'; } },
  { label: 'Ir a clientes', hint: 'Todo el directorio', icon: 'users', fn: () => { location.hash = '#/clientes'; } },
  { label: 'Ver favoritos', hint: 'Clientes marcados con estrella', icon: 'star', fn: () => { location.hash = '#/clientes?favoritos=1'; } },
  { label: 'Ver clientes con audiencia', hint: 'Audiencias programadas', icon: 'gavel', fn: () => { location.hash = '#/clientes?audiencia=1'; } },
  { label: 'Cambiar el tema', hint: 'Claro u oscuro', icon: 'moon', fn: () => toggleTheme() },
  { label: 'Exportar clientes a CSV', hint: 'Descarga el listado filtrado', icon: 'download', fn: () => exportCSV() },
  { label: 'Restablecer los datos de ejemplo', hint: 'Descarta los cambios guardados en este navegador', icon: 'undo', fn: () => { clients = JSON.parse(JSON.stringify(D.clientes)); save(); refresh(); toast('Datos de ejemplo restablecidos.'); } },
];

function openPalette() {
  const p = $('#palette');
  lastFocus = document.activeElement;
  p.classList.add('open'); p.setAttribute('aria-hidden', 'false');
  $('#paletteInput').value = '';
  palSel = 0;
  renderPalette();
  syncOverlay();
  setTimeout(() => $('#paletteInput').focus(), 40);
}
function closePalette() {
  const p = $('#palette');
  if (!p.classList.contains('open')) return;
  p.classList.remove('open'); p.setAttribute('aria-hidden', 'true');
  syncOverlay();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
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
    html += cls.map((c) => { palRun.push(() => { location.hash = `#/clientes/${c.id}`; }); return `<button type="button" role="option" class="pl-item" data-pi="${palRun.length - 1}">${avatar(c.nombre, 'sm')}<div><strong>${mark(c.nombre, q)}</strong><small>${esc(c.area)}, ${esc(c.ciudad)}</small></div><kbd>Enter</kbd></button>`; }).join('');
  }
  if (acts.length) {
    html += `<div class="pl-group">Acciones</div>`;
    html += acts.map((a) => { palRun.push(a.fn); return `<button type="button" role="option" class="pl-item" data-pi="${palRun.length - 1}"><span class="pl-ic">${ic(a.icon)}</span><div><strong>${mark(a.label, q)}</strong><small>${esc(a.hint)}</small></div><kbd>${a.kbd || 'Enter'}</kbd></button>`; }).join('');
  }
  $('#paletteList').innerHTML = html || `<div class="pl-empty">Nada coincide con “${esc($('#paletteInput').value)}”. Prueba con un nombre o una ciudad.</div>`;
  palSel = Math.min(palSel, Math.max(0, palRun.length - 1));
  paintSel();
}
function paintSel() {
  $$('.pl-item').forEach((el) => { const on = +el.dataset.pi === palSel; el.classList.toggle('sel', on); el.setAttribute('aria-selected', String(on)); });
  $(`.pl-item[data-pi="${palSel}"]`)?.scrollIntoView({ block: 'nearest' });
}
function runPal(i) { const fn = palRun[i]; closePalette(); if (fn) setTimeout(fn, 60); }

/* =========================================================
   TEMA (transición circular con View Transitions)
   ========================================================= */
function toggleTheme(e) {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const apply = () => {
    root.dataset.theme = next;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', next === 'dark' ? '#0e1412' : '#e9ece8'));
    try { localStorage.setItem('lex-theme', next); } catch { /* */ }
  };
  if (!document.startViewTransition || reduced) return apply();
  const x = e?.clientX ?? innerWidth - 60, y = e?.clientY ?? 32;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(apply);
  t.ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 600, easing: EASE, pseudoElement: '::view-transition-new(root)' });
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
    ['Cliente desde', 'desde'], ['Casos', (c) => c.casos.length], ['Facturado', 'facturado'], ['Por cobrar', 'pendiente'],
  ];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [cols.map((c) => cell(c[0])).join(';'), ...list.map((c) => cols.map(([, k]) => cell(typeof k === 'function' ? k(c) : c[k])).join(';'))];
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `clientes-${HOY}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`${plural(list.length, 'cliente exportado', 'clientes exportados')} a CSV.`);
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */
function renderNotifs() {
  const prox = clients.filter((c) => c.proximaAudiencia && diffDays(c.proximaAudiencia) >= 0).sort((a, b) => a.proximaAudiencia.localeCompare(b.proximaAudiencia)).slice(0, 2);
  const deuda = [...clients].sort((a, b) => b.pendiente - a.pendiente)[0];
  const nuevo = [...clients].sort((a, b) => b.desde.localeCompare(a.desde))[0];
  const items = [
    ...prox.map((c) => ({ id: c.id, ic: 'gavel-f', col: 'var(--seal)', t: `Audiencia de <b>${esc(c.nombre)}</b>`, s: `${cap(inDays(c.proximaAudiencia))}, ${fmtDate(c.proximaAudiencia)}` })),
    deuda && { id: deuda.id, ic: 'wallet-f', col: 'var(--warn)', t: `<b>${esc(deuda.nombre)}</b> tiene el mayor saldo por cobrar`, s: fmtMoney.format(deuda.pendiente) },
    nuevo && { id: nuevo.id, ic: 'users-f', col: 'var(--green)', t: `Nuevo cliente: <b>${esc(nuevo.nombre)}</b>`, s: cap(rel(nuevo.desde)) },
  ].filter(Boolean);
  $('#notifPop').innerHTML = `<div class="pop-head"><strong>Notificaciones</strong><button type="button" data-act="read-all">Marcar como leídas</button></div>` +
    items.map((n) => `<a class="pop-item" href="#/clientes/${n.id}"><span class="dot-ic" style="color:${n.col};background:color-mix(in srgb, ${n.col} 14%, transparent)">${ic(n.ic, 'sm')}</span><div><p>${n.t}</p><small>${n.s}</small></div></a>`).join('');
}
function setNotif(open) { $('#notifPop').classList.toggle('open', open); $('#notifBtn').setAttribute('aria-expanded', String(open)); }

/* =========================================================
   MENÚ LATERAL
   ========================================================= */
function toggleSidebarMobile(force) {
  const open = force ?? !$('#sidebar').classList.contains('open');
  $('#sidebar').classList.toggle('open', open);
  $('#sbBackdrop').classList.toggle('open', open);
}

/* =========================================================
   EVENTOS
   ========================================================= */
document.addEventListener('click', (e) => {
  const q = (s) => e.target.closest(s);
  let el;

  if (!q('.pop-wrap')) setNotif(false);

  if ((el = q('[data-fav]'))) { e.preventDefault(); return toggleFav(el.dataset.fav, el); }
  if ((el = q('[data-edit]'))) return openForm(el.dataset.edit);
  if ((el = q('[data-del]'))) return confirmDelete(el.dataset.del);
  if ((el = q('[data-copy]'))) {
    const v = el.dataset.copy;
    navigator.clipboard?.writeText(v).then(() => toast(`Copiado: <b>${esc(v)}</b>.`, { type: 'info', duration: 2000 }), () => toast('No se pudo copiar. Selecciona el texto y cópialo a mano.', { type: 'bad' }));
    return;
  }
  if ((el = q('[data-tab]'))) { drawerTab = el.dataset.tab; const c = byId(drawerId); if (c) renderTab(c); return; }
  if ((el = q('[data-pi]'))) return runPal(+el.dataset.pi);
  if ((el = q('[data-mode]'))) {
    chartMode = el.dataset.mode;
    $$('#chartSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    segPill($('#chartSeg'));
    return drawMainChart(true);
  }
  if ((el = q('[data-view]'))) { F.view = el.dataset.view; store.set('lex-view', F.view); return updateList({ flip: false }); }
  if ((el = q('[data-estado]'))) { F.estado = el.dataset.estado; F.page = 1; return updateList(); }
  if ((el = q('[data-law]'))) { F.abogado = F.abogado === el.dataset.law ? 'all' : el.dataset.law; F.page = 1; return updateList(); }
  if ((el = q('[data-letter]'))) { F.letter = F.letter === el.dataset.letter ? '' : el.dataset.letter; F.page = 1; return updateList(); }
  if ((el = q('[data-page]'))) {
    F.page = +el.dataset.page; updateList({ flip: false });
    return $('.toolbar')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }
  if ((el = q('[data-sort]'))) {
    const [k, d] = F.sort.split(':');
    const key = el.dataset.sort;
    F.sort = `${key}:${k === key ? (d === 'asc' ? 'desc' : 'asc') : key === 'nom' ? 'asc' : 'desc'}`;
    return updateList();
  }
  if ((el = q('[data-rm]'))) {
    const k = el.dataset.rm;
    if (k === 'q') { F.q = ''; if ($('#q')) $('#q').value = ''; }
    else if (k === 'fav') F.fav = false;
    else if (k === 'letter') F.letter = '';
    else F[k] = 'all';
    F.page = 1;
    return updateList();
  }
  if ((el = q('[data-act]'))) {
    const a = el.dataset.act;
    if (a === 'new') return openForm();
    if (a === 'export') return exportCSV();
    if (a === 'close-drawer') return closeDrawer();
    if (a === 'close-modal') return closeModal();
    if (a === 'keep-editing') { const f = $('#modal .modal-foot'); f?._restore?.(); return; }
    if (a === 'discard') return closeModal(true);
    if (a === 'save') return saveForm(el.dataset.id);
    if (a === 'do-delete') return doDelete(el.dataset.id);
    if (a === 'clearq') { F.q = ''; $('#q').value = ''; $('#q').focus(); F.page = 1; return updateList(); }
    if (a === 'reset') { resetFilters(); if ($('#q')) $('#q').value = ''; return updateList(); }
    if (a === 'fav') { F.fav = !F.fav; F.page = 1; return updateList(); }
    if (a === 'hearing') { F.hearing = !F.hearing; F.page = 1; return updateList(); }
    if (a === 'read-all') { $('.ping')?.remove(); setNotif(false); return toast('Notificaciones marcadas como leídas.', { type: 'info', duration: 2000 }); }
  }
});

// Pestañas de la ficha con flechas
document.addEventListener('keydown', (e) => {
  const tab = e.target.closest?.('[role="tab"]');
  if (!tab || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
  const tabs = $$('#drTabs [role="tab"]');
  const i = (tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  drawerTab = tabs[i].dataset.tab;
  const c = byId(drawerId); if (c) renderTab(c);
  tabs[i].focus();
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
    setNotif(false);
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
addEventListener('beforeunload', (e) => { if (formDirty && modalOpen()) { e.preventDefault(); e.returnValue = ''; } });

$('#openPalette').addEventListener('click', openPalette);
$('#themeToggle').addEventListener('click', toggleTheme);
$('#notifBtn').addEventListener('click', () => { renderNotifs(); setNotif(!$('#notifPop').classList.contains('open')); });
$('#sbOpen').addEventListener('click', () => toggleSidebarMobile(true));
$('#sbBackdrop').addEventListener('click', () => toggleSidebarMobile(false));
$('#sbCollapse').addEventListener('click', () => {
  const c = document.documentElement.classList.toggle('sb-collapsed');
  $('#sbCollapse').setAttribute('aria-label', c ? 'Expandir menú' : 'Contraer menú');
  try { localStorage.setItem('lex-sidebar', c ? 'collapsed' : 'open'); } catch { /* */ }
  setTimeout(() => { if (current === 'dashboard') drawMainChart(false); segPill($('#chartSeg')); }, 480);
});
$$('[data-soon]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  toast(`<b>${esc(a.textContent.trim())}</b> aún no está disponible en esta versión.`, { type: 'info' });
}));

// Onda en botones
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn');
  if (!b || reduced) return;
  const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
  const sp = document.createElement('span');
  sp.className = 'ripple';
  sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(sp);
  setTimeout(() => sp.remove(), 650);
});

addEventListener('scroll', () => $('.topbar').classList.toggle('scrolled', scrollY > 4), { passive: true });
addEventListener('resize', debounce(() => {
  if (current === 'dashboard') { drawMainChart(false); segPill($('#chartSeg')); }
  if (current === 'clientes') segPill($('#viewSeg'));
  const act = $('#nav a.active'); if (act) $('#navIndicator').style.transform = `translateY(${act.offsetTop}px)`;
}, 150));
addEventListener('hashchange', route);

/* Inicio */
updateNavCount();
if (!location.hash) history.replaceState(null, '', '#/dashboard');
route();
