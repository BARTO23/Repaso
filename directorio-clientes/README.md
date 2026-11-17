# Lex & Asociados · Directorio de clientes

Dashboard y directorio de clientes para una firma de abogados. Es HTML, CSS y JavaScript sin dependencias ni proceso de build.

## Cómo abrirlo

```bash
cd directorio-clientes
python3 -m http.server 8000
# abre http://localhost:8000
```

(También funciona abriendo `index.html` directamente en el navegador.)

## Funcionalidades

- **Dashboard** (`#/dashboard`): saludo con resumen, anillo de recaudo, KPIs con contador animado y sparklines, gráfico de área interactivo (clientes / ingresos), donut por área de práctica (clic para filtrar), clientes recientes, próximas audiencias, carga por abogado y actividad reciente.
- **Directorio** (`#/clientes`):
  - Búsqueda instantánea sin distinguir tildes, filtros por área, tipo, estado, abogado, favoritos y letra inicial.
  - Vista de tarjetas o de tabla, orden por columnas, paginación y chips de filtros activos.
  - Ficha lateral (`#/clientes/<id>`) con pestañas Resumen, Casos y Actividad; clic en el correo o el teléfono para copiarlos.
  - Crear y editar clientes con validación, eliminar con "Deshacer" y exportar a CSV.
- **Paleta de comandos** con `Ctrl/⌘ + K`. Atajos: `/` busca, `N` crea un cliente, `Esc` cierra.
- Tema claro/oscuro con transición circular, menú lateral contraíble y diseño adaptable a móvil.
- Los datos son ficticios y los cambios se guardan en `localStorage`. Desde la paleta se pueden restablecer los datos de demostración.

## Animaciones

Entrada escalonada de bloques, gráficos que se dibujan, reordenamiento FLIP al filtrar, inclinación 3D con foco de luz en las tarjetas, ripple en botones, explosión al marcar favoritos, skeleton de carga, indicadores deslizantes en el menú y en las pestañas, y toasts con barra de progreso. Se respeta `prefers-reduced-motion`.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura, sprite de iconos SVG |
| `styles.css` | Sistema de diseño (tokens claro/oscuro), componentes y animaciones |
| `data.js` | Datos de demostración (clientes, abogados, series) |
| `app.js` | Router, vistas, gráficos, filtros, ficha, formularios, paleta |
