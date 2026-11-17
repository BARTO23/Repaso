/* Lex: directorio de clientes funcional, con el aspecto de la demo de stageshow */
'use strict';

const D = window.LEX_DATA;
const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
};

let clients = store.get('lex-app-clients', null) || JSON.parse(JSON.stringify(D.clientes));
let reminders = store.get('lex-app-reminders', {});
const save = () => { store.set('lex-app-clients', clients); store.set('lex-app-reminders', reminders); };

const state = { q: '', tab: 'todos', open: null };

/* ---------- Formatos ---------- */
const HOY = D.HOY;
const parse = (s) => new Date(s + 'T00:00:00');
const days = (s) => Math.round((parse(s) - parse(HOY)) / 864e5);
const dfShort = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });
const dfLong = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const dfDate = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const whenShort = (s) => { const n = days(s); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n < 7 ? `En ${n} días` : dfShort.format(parse(s)); };
const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
// Los datos no traen hora ni juzgado: se derivan del cliente, siempre iguales
const hearingTime = (c) => { const h = hash(c.id); return `${8 + (h % 8)}:${h % 2 ? '30' : '00'}`; };
const hearingCourt = (c) => `Juzgado ${(hash(c.nombre) % 18) + 1} ${c.area === 'Penal' ? 'Penal' : c.area === 'Laboral' ? 'Laboral' : 'Civil'} de ${c.ciudad}`;
const hasHearing = (c) => c.proximaAudiencia && days(c.proximaAudiencia) >= 0;

const AREA_COLOR = { Corporativo: '#4a77b4', Penal: '#b5473a', Laboral: '#b5793a', Familia: '#a2456e', Tributario: '#3f8f6a', 'Propiedad Intelectual': '#6a5fae', Inmobiliario: '#2f8a8f', Civil: '#7d7a4a' };
const LAWYER = (id) => D.ABOGADOS.find((a) => a.id === id) || D.ABOGADOS[0];
const lawyerColor = (a) => `hsl(${a.hue} 32% 52%)`;

const status = (s) => `<svg class="status" data-s="${esc(s)}" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5"/>${s === 'Activo' ? '<circle class="dot" cx="7" cy="7" r="2.5"/>' : ''}</svg>`;
const chip = (area) => `<span class="chip" style="--c:${AREA_COLOR[area] || '#8b8b86'}"><i></i>${esc(area)}</span>`;
const avatar = (a, cls = '') => `<span class="avatar ${cls}" style="--c:${lawyerColor(a)}" title="${esc(a.titulo + ' ' + a.nombre)}" aria-hidden="true">${esc(a.nombre[0])}</span>`;

/* ---------- Filtrado ---------- */
const byTab = (c) => state.tab === 'activos' ? c.estado === 'Activo' : state.tab === 'audiencia' ? hasHearing(c) : true;
function matches(c, tokens) {
  if (!tokens.length) return true;
  const hay = norm([c.nombre, c.ciudad, c.area, c.documento, c.email, c.contacto, LAWYER(c.abogado).nombre].join(' '));
  return tokens.every((t) => hay.includes(t));
}

/* ---------- Lista ---------- */
function rowHTML(c) {
  const a = LAWYER(c.abogado);
  const when = hasHearing(c) ? whenShort(c.proximaAudiencia) : '';
  return `<button class="row" data-id="${c.id}" aria-current="${state.open === c.id}">
    ${status(c.estado)}
    <span class="name">${esc(c.nombre)}<span class="sr-only">, ${esc(c.estado)}</span></span>
    <span class="chip-slot">${chip(c.area)}</span>
    ${avatar(a)}
    <span class="when" ${hasHearing(c) && days(c.proximaAudiencia) < 7 ? 'data-soon' : ''}>${when ? `<span class="sr-only">Audiencia: </span>${when}` : ''}</span>
  </button>`;
}

function render() {
  const tokens = norm(state.q).split(/\s+/).filter(Boolean);
  const list = clients.filter((c) => byTab(c) && matches(c, tokens)).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
  let html = '';
  if (tokens.length) {
    // Al buscar, también aparecen los expedientes que coinciden (por título o por cliente)
    const cases = clients.filter(byTab).flatMap((c) => c.casos.map((k) => ({ k, c })))
      .filter(({ k, c }) => tokens.every((t) => norm(k.titulo + ' ' + k.expediente + ' ' + c.nombre).includes(t))).slice(0, 8);
    if (list.length) html += `<div class="group-head">Clientes</div>${list.map(rowHTML).join('')}`;
    if (cases.length) {
      html += `<div class="group-head">Expedientes</div>` + cases.map(({ k, c }) => `
        <button class="row" data-id="${c.id}">
          ${status(k.estado === 'Cerrado' ? 'Inactivo' : k.estado === 'En espera' ? 'En revisión' : 'Activo')}
          <span class="name">${esc(k.titulo)}<small>${esc(c.nombre)}</small></span>
          <span class="chip-slot"></span><span></span>
          <span class="ref">${esc(k.expediente)}</span>
        </button>`).join('');
    }
    if (!list.length && !cases.length) html = `<div class="empty"><strong>Nada coincide con “${esc(state.q)}”</strong>Revisa la ortografía o busca por ciudad, NIT o abogado.<br><button class="btn btn-secondary" data-clear>Borrar la búsqueda</button></div>`;
  } else {
    html = list.length ? list.map(rowHTML).join('') : `<div class="empty"><strong>No hay clientes en esta vista</strong>Prueba con otra pestaña.</div>`;
  }
  $('#list').innerHTML = html;

  const all = clients.length;
  $('#navCount').textContent = all;
  $('#cTodos').textContent = all;
  $('#cActivos').textContent = clients.filter((c) => c.estado === 'Activo').length;
  $('#cAud').textContent = clients.filter(hasHearing).length;
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === state.tab)));
}

/* ---------- Ficha ---------- */
function renderPeek() {
  const peek = $('#peek');
  const c = clients.find((x) => x.id === state.open);
  if (!c) { peek.hidden = true; document.title = 'Clientes | Lex & Asociados'; return; }
  const a = LAWYER(c.abogado);
  const reminded = !!reminders[c.id];
  const hearing = hasHearing(c) ? `
    <section class="hearing" aria-label="Próxima audiencia">
      <span class="label">Próxima audiencia</span>
      <span class="when">${days(c.proximaAudiencia) === 0 ? 'Hoy' : days(c.proximaAudiencia) === 1 ? 'Mañana' : cap(dfLong.format(parse(c.proximaAudiencia)))} a las ${hearingTime(c)}</span>
      <span class="where">${esc(hearingCourt(c))}</span>
      <button class="btn ${reminded ? 'btn-secondary' : 'btn-primary'}" data-remind="${c.id}" aria-pressed="${reminded}">
        ${reminded ? '<svg class="i" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>Recordatorio creado' : '<svg class="i" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>Recordarme'}
      </button>
    </section>` : `<section class="hearing"><span class="label">Próxima audiencia</span><span class="where">Sin audiencias programadas</span></section>`;

  peek.innerHTML = `
    <div class="peek-head">
      <span class="avatar lg" style="--c:${AREA_COLOR[c.area] || '#8b8b86'}" aria-hidden="true">${esc(c.nombre[0])}</span>
      <div><h2 id="peekTitle">${esc(c.nombre)}</h2><p>${c.tipo === 'Empresa' ? 'Empresa' : 'Persona natural'} en ${esc(c.ciudad)}</p></div>
      <button class="icon-btn" data-close aria-label="Cerrar ficha (Esc)"><svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="badges"><span class="badge" data-s="${esc(c.estado)}">${esc(c.estado)}</span>${chip(c.area)}</div>
    ${hearing}
    <dl class="facts">
      <dt>Correo</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>
      <dt>Teléfono</dt><dd><a href="tel:${esc(c.telefono.replace(/\s/g, ''))}">${esc(c.telefono)}</a></dd>
      ${c.contacto ? `<dt>Contacto</dt><dd>${esc(c.contacto)}</dd>` : ''}
      <dt>Responsable</dt><dd>${esc(a.titulo + ' ' + a.nombre)}</dd>
      <dt>Documento</dt><dd>${esc(c.documento)}</dd>
      <dt>Cliente desde</dt><dd>${dfDate.format(parse(c.desde))}</dd>
    </dl>
    <section class="cases" aria-label="Expedientes">
      <h3>Expedientes (${c.casos.length})</h3>
      ${c.casos.length ? c.casos.map((k) => `<div class="case">${status(k.estado === 'Cerrado' ? 'Inactivo' : 'Activo')}<span>${esc(k.titulo)}<small>${esc(k.expediente)}, ${esc(k.estado.toLowerCase())}</small></span><span class="prio" ${k.prioridad === 'Alta' ? 'data-high' : ''}>Prioridad ${k.prioridad.toLowerCase()}</span></div>`).join('') : '<p class="notes">Todavía no tiene expedientes.</p>'}
    </section>
    ${c.notas ? `<p class="notes">${esc(c.notas)}</p>` : ''}`;
  peek.hidden = false;
  peek.setAttribute('aria-labelledby', 'peekTitle');
  document.title = `${c.nombre} | Lex & Asociados`;
}

function open(id) {
  const wasOpen = !!state.open;
  state.open = id;
  render(); renderPeek();
  const peek = $('#peek');
  if (wasOpen) { peek.style.animation = 'none'; void peek.offsetWidth; peek.style.animation = ''; }
  $('[data-close]', peek)?.focus({ preventScroll: true });
}
function close() {
  if (!state.open) return false;
  const id = state.open;
  state.open = null;
  render(); renderPeek();
  document.querySelector(`.row[data-id="${id}"]`)?.focus({ preventScroll: true });
  return true;
}

/* ---------- Avisos ---------- */
function toast(msg, action) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${msg}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.fn(); el.remove(); };
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ---------- Eventos ---------- */
$('#q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
document.addEventListener('click', (e) => {
  const t = e.target;
  let el;
  if ((el = t.closest('[data-tab]'))) { state.tab = el.dataset.tab; render(); return; }
  if ((el = t.closest('.row[data-id]'))) { open(el.dataset.id); return; }
  if (t.closest('[data-close]')) { close(); return; }
  if (t.closest('[data-clear]')) { $('#q').value = ''; state.q = ''; render(); $('#q').focus(); return; }
  if ((el = t.closest('[data-remind]'))) {
    const id = el.dataset.remind;
    const c = clients.find((x) => x.id === id);
    if (reminders[id]) { delete reminders[id]; save(); renderPeek(); $('[data-remind]')?.focus(); toast('Quitaste el recordatorio.'); return; }
    reminders[id] = true; save(); renderPeek(); $('[data-remind]')?.focus();
    toast(`Te recordaremos la audiencia de <b>${esc(c.nombre)}</b> el día antes.`, { label: 'Deshacer', fn: () => { delete reminders[id]; save(); renderPeek(); } });
    return;
  }
  if ((el = t.closest('[data-soon]'))) { toast(`La sección <b>${esc(el.dataset.soon)}</b> todavía no está disponible.`); }
});

document.addEventListener('keydown', (e) => {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
  if ($('#newDialog').open) return;
  if (e.key === 'Escape') {
    if (close()) return;
    if (state.q) { $('#q').value = ''; state.q = ''; render(); }
    return;
  }
  if (e.key === '/' && !typing) { e.preventDefault(); $('#q').focus(); return; }
  // Flechas para moverse por la lista
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && (e.target.closest('.row') || e.target.id === 'q')) {
    const rows = [...document.querySelectorAll('#list .row')];
    if (!rows.length) return;
    e.preventDefault();
    const i = rows.indexOf(e.target.closest('.row'));
    const next = e.key === 'ArrowDown' ? rows[Math.min(rows.length - 1, i + 1)] : rows[Math.max(0, i - 1)];
    next.focus();
  }
});

/* ---------- Nuevo cliente ---------- */
const dlg = $('#newDialog');
const form = $('#newForm');
$('#fArea').innerHTML = Object.keys(D.AREAS).map((a) => `<option>${esc(a)}</option>`).join('');
$('#newBtn').addEventListener('click', () => { form.reset(); form.querySelectorAll('[data-invalid]').forEach((l) => l.removeAttribute('data-invalid')); dlg.showModal(); });
$('#cancelNew').addEventListener('click', () => dlg.close());
form.addEventListener('input', (e) => e.target.closest('label')?.removeAttribute('data-invalid'));
// Sin depender del evento submit: los visores aislados (iframes sin allow-forms) lo bloquean
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); createClient(); } });
$('#createBtn').addEventListener('click', createClient);
function createClient() {
  const nombre = form.nombre.value.trim(), email = form.email.value.trim();
  const bad = [];
  if (nombre.length < 3) bad.push('lNombre');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad.push('lEmail');
  bad.forEach((id) => $('#' + id).setAttribute('data-invalid', ''));
  if (bad.length) { $('#' + bad[0] + ' input').focus(); return; }
  const c = {
    id: 'c' + Date.now().toString(36), nombre, tipo: 'Empresa', area: form.area.value, estado: 'Potencial', abogado: 'ev', contacto: '',
    email, telefono: 'Sin teléfono', ciudad: 'Bogotá', documento: 'Sin documento', desde: HOY, ultimaActividad: HOY,
    proximaAudiencia: null, facturado: 0, pendiente: 0, satisfaccion: 5, favorito: false, etiquetas: [], casos: [], notas: '',
    timeline: [{ fecha: HOY, texto: 'Cliente creado' }],
  };
  clients.unshift(c); save(); dlg.close();
  state.q = ''; $('#q').value = ''; state.tab = 'todos';
  open(c.id);
  toast(`Creaste el cliente <b>${esc(nombre)}</b>.`);
}

render();
renderPeek();
