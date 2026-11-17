# Auditoría: Vercel Web Interface Guidelines

Revisión de la versión anterior (commit `fb2e1f3`) con la skill `web-design-guidelines` de [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills). Las reglas vienen de [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) (`command.md` y `README.md`, incluida la sección específica de Vercel) y de [vercel-labs/writing-guidelines](https://github.com/vercel-labs/writing-guidelines) para los textos. Cada hallazgo está corregido en esta versión.

## styles.css

```text
styles.css:83   - inputs 14px en móvil: iOS hace zoom al enfocar → 16px en pantallas táctiles
styles.css:415  - controles de 38px; en móvil el mínimo es 44px → targets ≥ 44px en pointer: coarse
styles.css:249  - .ripple: animación decorativa, no aclara causa y efecto (necessity check) → eliminada
styles.css:532  - .spark: destellos decorativos al marcar favorito → eliminados
styles.css:507  - .folder:hover levanta la tarjeta: movimiento sin causa → el hover solo sube el contraste
styles.css:227  - .enter: entrada escalonada de todas las secciones al cargar → eliminada
styles.css:150  - .nav-indicator: posición medida en JS → estado activo solo con CSS
styles.css:313  - .seg-pill: posición medida en JS → aria-pressed con CSS
styles.css:577  - .tab-line: posición medida en JS → borde del tab activo con CSS
styles.css:166  - topbar sin env(safe-area-inset-*) → añadido en topbar, toasts y ficha
styles.css:680  - toasts sin safe-area → añadido
styles.css:434  - tooltip sin retardo; los vecinos tampoco lo comparten → retardo inicial y sin retardo entre vecinos
styles.css:8    - bordes opacos → bordes semitransparentes + sombra en capas (crisp borders)
styles.css:132  - serif decorativa, pestañas de color por área, avatares pastel: estética de plantilla → Geist y paleta neutra; color solo para estados
```

## app.js

```text
app.js:450   - transform aplicado a <line>/<circle> del SVG → envueltos en <g> con transform-box: fill-box
app.js:390   - segPill mide offsetLeft/offsetWidth en cada render (layout thrash) → eliminado
app.js:836   - tab-line mide offsetLeft → eliminado
app.js:230   - indicador del menú mide offsetTop → eliminado
app.js:592   - esqueleto falso de 600 ms sin trabajo real: añade espera sin motivo → eliminado
app.js:385   - cifras que ruedan desde 0 al cargar (count-up decorativo) → solo ruedan cuando el valor cambia
app.js:300   - audiencias distinguidas solo por color de área (redundant status cues) → texto con el área y la hora
app.js:215   - <title> no refleja la ficha abierta → incluye el nombre del cliente
app.js:934   - formulario sin botón submit dentro: Enter no envía → botones dentro del <form>
app.js:934   - textarea sin ⌘/Ctrl + Enter para enviar → añadido
app.js:893   - modal, ficha y búsqueda sin trampa de foco → foco atrapado y devuelto al cerrar
app.js:1125  - transición circular del tema: decorativa → cambio inmediato
app.js:—     - Back/Forward no restaura el scroll → se guarda y restaura por ruta
```

## index.html

```text
index.html:164 - atajo “Ctrl K” fijo; en macOS debe ser ⌘ K → símbolo según la plataforma
index.html:11  - Spectral + Public Sans → Geist + Geist Mono (cifras, NIT y expedientes en mono)
```

## Textos (writing-guidelines)

```text
app.js:—  - encabezados en sentence case: ok (la guía pide sentence case en H1 a H6)
app.js:—  - “Ver todos” no nombra el destino → “Ver los 28 clientes”
app.js:—  - errores del formulario: ya indican cómo corregir: ok
app.js:—  - unidades: “75 % recaudado” → “75 % cobrado”, con espacio fino no separable
```

## Decisiones razonadas

- **Title Case en botones:** la sección específica de Vercel lo pide para el inglés. En español va contra la norma ortográfica de la RAE, y la propia guía de redacción de Vercel pide sentence case en los encabezados. Se mantiene sentence case.
- **Movimiento que se conserva:** solo lo que explica un cambio. Las carpetas se reordenan con FLIP al filtrar, la ficha se desliza, el modal y los avisos aparecen, el gráfico sigue al puntero y los dígitos ruedan cuando cambia una cifra. Todo respeta `prefers-reduced-motion`.
