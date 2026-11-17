# Lex & Asociados: directorio de clientes

Panel de resumen y directorio de clientes para una firma de abogados. Es HTML, CSS y JavaScript sin dependencias.

## Cómo abrirlo

```bash
cd directorio-clientes
python3 -m http.server 8000
# abre http://localhost:8000
```

## Guías aplicadas

El diseño sigue las [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) de Vercel mediante la skill `web-design-guidelines` de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills). Los textos siguen su guía de redacción, `writing-guidelines`. La auditoría completa, con cada hallazgo y su corrección, está en [`AUDITORIA-VERCEL.md`](./AUDITORIA-VERCEL.md).

**Sistema visual al estilo Geist:**
- Tipografía Geist, y Geist Mono para cifras, NIT y expedientes.
- Paleta neutra. El color solo marca estados, y cada estado va con su texto.
- Bordes finos semitransparentes y sombras en capas.
- Pestañas de navegación arriba.

**Movimiento:** solo cuando explica un cambio:
- Las tarjetas se reordenan con FLIP al filtrar.
- La ficha se desliza y el modal aparece.
- El gráfico sigue al puntero o a las flechas del teclado.
- Las cifras ruedan cuando cambian, nunca al cargar.

**Interacción:**
- **Filtros en la URL:** por ejemplo `#/clientes?estado=Activo&area=Penal`, así que se pueden compartir y Atrás restaura la vista y el scroll.
- **Enlaces reales:** Ctrl o ⌘ + clic abre en otra pestaña.
- **Foco:** queda atrapado en la ficha, el modal y la búsqueda, y vuelve al elemento de origen al cerrar.
- **Formulario:** Enter envía, ⌘ o Ctrl + Enter guarda desde las notas y los errores aparecen junto al campo. Si lo cierras con cambios sin guardar, te avisa.
- **Pantallas táctiles:** controles de 44 px y entradas de 16 px para que iOS no haga zoom.
- **Atajos:** `⌘/Ctrl + K` abre la búsqueda, `/` busca en el directorio, `N` crea un cliente y `Esc` cierra.

La página también funciona dentro de vistas previas aisladas, donde la URL no se puede modificar.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura e iconos (Phosphor, MIT) |
| `styles.css` | Tokens claro y oscuro, componentes |
| `data.js` | Datos de ejemplo ficticios |
| `app.js` | Rutas, vistas, filtros, ficha, formularios y búsqueda |
| `AUDITORIA-VERCEL.md` | Auditoría con el formato de la skill de Vercel |
