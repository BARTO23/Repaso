// @ts-nocheck
/* Datos de ejemplo ficticios, compartidos con directorio-clientes/data.js */
/* =========================================================
   Datos de demostración (ficticios) — Lex & Asociados
   ========================================================= */

  // Generador pseudoaleatorio con semilla: los datos son siempre los mismos
  let seed = 20261117;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const int = (a, b) => Math.floor(a + rnd() * (b - a + 1));

  const AREAS = {
    'Corporativo':           { color: '#2f5d8a', icon: 'building' },
    'Penal':                 { color: '#9b2c2c', icon: 'gavel' },
    'Laboral':               { color: '#a8641c', icon: 'briefcase' },
    'Familia':               { color: '#a2456e', icon: 'heart' },
    'Tributario':            { color: '#2e7d5b', icon: 'receipt' },
    'Propiedad Intelectual': { color: '#55509a', icon: 'copyright' },
    'Inmobiliario':          { color: '#23727a', icon: 'house' },
    'Civil':                 { color: '#6e6a3a', icon: 'scale' },
  };

  const ESTADOS = ['Activo', 'En revisión', 'Potencial', 'Inactivo'];

  const ABOGADOS = [
    { id: 'ev', nombre: 'Elena Vargas',     titulo: 'Dra.', rol: 'Socia directora',  hue: 38,  areas: ['Corporativo', 'Tributario'] },
    { id: 'mr', nombre: 'Martín Rojas',     titulo: 'Dr.',  rol: 'Socio · Penal',    hue: 355, areas: ['Penal'] },
    { id: 'pm', nombre: 'Paula Méndez',     titulo: 'Dra.', rol: 'Asociada senior',  hue: 330, areas: ['Laboral', 'Familia'] },
    { id: 'so', nombre: 'Sebastián Ochoa',  titulo: 'Dr.',  rol: 'Asociado senior',  hue: 140, areas: ['Tributario', 'Corporativo'] },
    { id: 'nr', nombre: 'Natalia Ríos',     titulo: 'Dra.', rol: 'Asociada',         hue: 265, areas: ['Propiedad Intelectual'] },
    { id: 'ta', nombre: 'Tomás Aguilar',    titulo: 'Dr.',  rol: 'Asociado',         hue: 190, areas: ['Inmobiliario', 'Civil'] },
  ];

  const CASOS = {
    'Corporativo': ['Fusión con subsidiaria regional', 'Revisión de estatutos sociales', 'Due diligence de adquisición', 'Acuerdo de accionistas', 'Contrato de distribución internacional'],
    'Penal': ['Defensa por presunta estafa', 'Querella por difamación', 'Recurso de apelación penal', 'Acompañamiento en indagatoria'],
    'Laboral': ['Demanda por despido injustificado', 'Reestructuración de nómina', 'Conciliación colectiva', 'Auditoría de contratos laborales'],
    'Familia': ['Proceso de divorcio de mutuo acuerdo', 'Custodia y régimen de visitas', 'Sucesión intestada', 'Cuota alimentaria'],
    'Tributario': ['Respuesta a requerimiento DIAN', 'Planeación fiscal anual', 'Recurso de reconsideración', 'Devolución de saldo a favor'],
    'Propiedad Intelectual': ['Registro de marca mixta', 'Oposición de marca', 'Licencia de software', 'Infracción de derechos de autor'],
    'Inmobiliario': ['Compraventa de inmueble comercial', 'Restitución de inmueble arrendado', 'Constitución de propiedad horizontal', 'Estudio de títulos'],
    'Civil': ['Responsabilidad civil extracontractual', 'Proceso ejecutivo', 'Incumplimiento contractual', 'Pertenencia por prescripción'],
  };

  const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales'];
  const ETIQUETAS = ['VIP', 'Retención mensual', 'Referido', 'Internacional', 'Pro bono', 'Urgente', 'Recurrente'];

  const BASE = [
    ['Grupo Altamira S.A.',            'Empresa', 'Corporativo'],
    ['María Fernanda Ortiz',           'Persona', 'Familia'],
    ['Constructora Valdés & Hijos',    'Empresa', 'Inmobiliario'],
    ['Carlos Andrés Mejía',            'Persona', 'Penal'],
    ['Textiles Andinos Ltda.',         'Empresa', 'Laboral'],
    ['Lucía Restrepo Vargas',          'Persona', 'Civil'],
    ['BioFarma Meridiano',             'Empresa', 'Propiedad Intelectual'],
    ['Javier Hernández Soto',          'Persona', 'Tributario'],
    ['Inversiones Ríos del Sur',       'Empresa', 'Tributario'],
    ['Valentina Gómez Ruiz',           'Persona', 'Laboral'],
    ['Café Sierra Alta S.A.S.',        'Empresa', 'Corporativo'],
    ['Andrés Felipe Cárdenas',         'Persona', 'Inmobiliario'],
    ['TecnoLogística Pacífico',        'Empresa', 'Laboral'],
    ['Sofía Martínez León',            'Persona', 'Familia'],
    ['Hotel Casa Colonial',            'Empresa', 'Civil'],
    ['Diego Alejandro Paredes',        'Persona', 'Penal'],
    ['Editorial Brújula',              'Empresa', 'Propiedad Intelectual'],
    ['Camila Torres Duque',            'Persona', 'Corporativo'],
    ['Agroindustrias La Esperanza',    'Empresa', 'Tributario'],
    ['Ricardo Salazar Pinto',          'Persona', 'Civil'],
    ['Nova Capital Fintech',           'Empresa', 'Corporativo'],
    ['Isabel Navarro Quintero',        'Persona', 'Familia'],
    ['Estudio Creativo Prisma',        'Empresa', 'Propiedad Intelectual'],
    ['Mateo Castillo Ramos',           'Persona', 'Penal'],
    ['Transportes Cordillera',         'Empresa', 'Laboral'],
    ['Gabriela Ospina Rivera',         'Persona', 'Inmobiliario'],
    ['Laboratorios Ámbar',             'Empresa', 'Penal'],
    ['Daniel Esteban Vélez',           'Persona', 'Tributario'],
  ];

  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  const today = new Date(2026, 10, 17);
  const daysAgo = (d) => new Date(today.getTime() - d * 864e5).toISOString().slice(0, 10);
  // Las audiencias solo caen en días hábiles
  const daysAhead = (d) => {
    const x = new Date(today.getTime() + d * 864e5);
    const w = x.getDay();
    if (w === 6) x.setDate(x.getDate() + 2);
    if (w === 0) x.setDate(x.getDate() + 1);
    return x.toISOString().slice(0, 10);
  };

  const clientes = BASE.map(([nombre, tipo, area], idx) => {
    const posibles = ABOGADOS.filter((a) => a.areas.includes(area));
    const abogado = (posibles.length ? pick(posibles) : pick(ABOGADOS)).id;
    const estado = idx < 3 ? 'Activo' : pick(['Activo', 'Activo', 'Activo', 'En revisión', 'Potencial', 'Inactivo']);
    const nCasos = estado === 'Potencial' ? int(0, 1) : estado === 'Inactivo' ? int(1, 2) : int(1, 4);
    const casos = Array.from({ length: nCasos }, (_, k) => ({
      id: `${idx}-${k}`,
      titulo: pick(CASOS[area]),
      expediente: `${int(2023, 2026)}-${String(int(100, 9999)).padStart(4, '0')}`,
      estado: estado === 'Inactivo' ? 'Cerrado' : pick(['Abierto', 'Abierto', 'En audiencia', 'En espera', 'Cerrado']),
      prioridad: pick(['Alta', 'Media', 'Media', 'Baja']),
      progreso: int(10, 100),
    }));
    const facturado = tipo === 'Empresa' ? int(40, 420) * 1e6 : int(6, 90) * 1e6;
    const dominio = tipo === 'Empresa' ? slug(nombre.split(' ').slice(0, 2).join(' ')).replace(/\./g, '') + '.com.co' : 'correo.co';
    const email = tipo === 'Empresa' ? `juridico@${dominio}` : `${slug(nombre.split(' ').slice(0, 2).join(' '))}@${dominio}`;
    const etiquetas = [...new Set(Array.from({ length: int(0, 2) }, () => pick(ETIQUETAS)))];
    const actividad = int(0, 40);

    return {
      id: 'c' + String(idx + 1).padStart(3, '0'),
      nombre, tipo, area, estado, abogado,
      contacto: tipo === 'Empresa' ? pick(['Ana Beltrán', 'Jorge Lozano', 'Marcela Duarte', 'Felipe Arango', 'Laura Pineda']) + ' (gerencia)' : '',
      email,
      telefono: `+57 3${int(0, 2)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      ciudad: pick(CIUDADES),
      documento: tipo === 'Empresa' ? `NIT ${int(800, 901)}.${int(100, 999)}.${int(100, 999)}-${int(0, 9)}` : `C.C. ${int(10, 99)}.${int(100, 999)}.${int(100, 999)}`,
      desde: daysAgo(int(30, 2200)),
      ultimaActividad: daysAgo(actividad),
      proximaAudiencia: estado === 'Activo' && rnd() > 0.35 ? daysAhead(int(0, 30)) : null,
      facturado,
      pendiente: estado === 'Potencial' ? 0 : Math.round(facturado * (rnd() * 0.35) / 1e5) * 1e5,
      satisfaccion: int(3, 5),
      favorito: rnd() > 0.78,
      etiquetas,
      casos,
      notas: pick([
        'Prefiere comunicación por correo. Reuniones de seguimiento quincenales.',
        'Cliente sensible a plazos; enviar reportes de avance cada viernes.',
        'Requiere aprobación de junta directiva para gastos superiores a 20 M.',
        'Contacto preferente por teléfono en horas de la mañana.',
        'Referido por cliente corporativo. Potencial de ampliar servicios.',
      ]),
      timeline: [
        { fecha: daysAgo(actividad), texto: pick(['Se radicó memorial ante el juzgado', 'Reunión de estrategia con el cliente', 'Se envió borrador de contrato', 'Se recibió respuesta de la contraparte']) },
        { fecha: daysAgo(actividad + int(3, 12)), texto: pick(['Se emitió factura de honorarios', 'Llamada de seguimiento', 'Se adjuntaron pruebas documentales', 'Revisión de poder especial']) },
        { fecha: daysAgo(actividad + int(15, 40)), texto: pick(['Firma de contrato de prestación de servicios', 'Primera consulta jurídica', 'Apertura de expediente']) },
      ],
    };
  });

  // Serie mensual (últimos 12 meses) para el dashboard
  const MESES = ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov'];
  const serie = MESES.map((m, i) => ({
    mes: m,
    nuevos: Math.round(4 + i * 0.6 + rnd() * 5),
    cerrados: Math.round(3 + i * 0.4 + rnd() * 4),
    ingresos: Math.round((180 + i * 14 + rnd() * 60) * 1e6),
  }));

  export const LEX_DATA = { AREAS, ESTADOS, ABOGADOS, clientes, serie, HOY: today.toISOString().slice(0, 10) };
