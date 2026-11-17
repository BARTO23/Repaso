# Lex & Asociados · Directorio de clientes

Panel de resumen y directorio de clientes para una firma de abogados. Es HTML, CSS y JavaScript sin dependencias ni proceso de build.

## Cómo abrirlo

```bash
cd directorio-clientes
python3 -m http.server 8000
# abre http://localhost:8000
```

## Identidad visual

El diseño se inspira en el archivo de un despacho, no en un kit genérico de SaaS.

- **Paleta:** papel gris frío (`#e9ece8`), tinta verdosa (`#17201c`), verde de despacho (`#1e4a3b`), rojo lacre para lo urgente (`#8e2c25`) y latón (`#94712f`) solo para los favoritos. Tiene una versión oscura propia.
- **Tipografía:** Spectral para títulos y Public Sans para la interfaz. No hay mayúsculas sostenidas en las etiquetas ni palabras sueltas en cursiva para dar énfasis.
- **Iconos:** [Phosphor Icons](https://phosphoricons.com) (MIT). Se usa el estilo regular, y el estilo fill para los iconos pequeños, incrustados como sprite SVG.
- **Carpetas de cliente:** cada cliente es una carpeta con una pestaña del color de su área. El índice A–Z funciona como las pestañas de un archivador.
- **Resumen:** abre con la agenda de audiencias de los próximos 10 días hábiles, que es lo primero que consulta un abogado.

## Animación con propósito

- Una sola secuencia de entrada por página.
- Las cifras ruedan dígito a dígito en lugar de cambiar de golpe.
- El gráfico se puede recorrer con el puntero o con las flechas del teclado, y la cifra principal rueda hasta el mes señalado.
- Las carpetas se reordenan con animación FLIP al filtrar.
- La ficha lateral se desliza y sus pestañas tienen un indicador que se mueve entre ellas.
- Al marcar un favorito sale un pequeño destello.
- Los avisos muestran una barra de tiempo.
- El cambio de tema usa una transición circular.
- Todo se desactiva con `prefers-reduced-motion`.

## Funcionalidades

- Búsqueda que ignora las tildes. Filtros por estado, área, tipo, abogado, favoritos, audiencia próxima y letra inicial.
- **Filtros en la URL:** por ejemplo `#/clientes?area=Penal&orden=fac:desc`, así que se pueden enlazar y el botón Atrás funciona.
- Vista de carpetas o de tabla, orden por columnas y paginación.
- Ficha del cliente (`#/clientes/<id>`) con Resumen, Casos y Actividad. El correo y el teléfono se copian con un clic.
- Crear y editar clientes con validación junto a cada campo. Si cierras el formulario con cambios sin guardar, te avisa.
- Eliminar con confirmación y opción de deshacer. Exportar a CSV.
- **Búsqueda rápida:** `Ctrl/⌘ + K`. Atajos: `/` busca, `N` crea un cliente, `Esc` cierra.

## Accesibilidad e interfaz

Se aplicaron las Web Interface Guidelines de Vercel:

- Enlace para saltar al contenido y foco visible con `:focus-visible`.
- Botones de icono con `aria-label` y avisos en una región `aria-live`.
- Pestañas con roles ARIA y navegación con flechas.
- La navegación usa enlaces reales, así que Ctrl o ⌘ + clic abre en otra pestaña.
- Fechas y cifras con `Intl`, y `tabular-nums` en las columnas numéricas.
- Campos con `autocomplete`, `inputmode` y `spellcheck` adecuados.
- `overscroll-behavior: contain` en las capas, `theme-color` y `color-scheme` por tema.
- Ninguna `transition: all`.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura y sprite de iconos Phosphor |
| `styles.css` | Tokens claro/oscuro, componentes y movimiento |
| `data.js` | Datos de ejemplo (ficticios) |
| `app.js` | Rutas, vistas, gráfico, filtros, ficha, formularios y búsqueda rápida |
