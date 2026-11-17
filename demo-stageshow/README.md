# Lex: demo animada del directorio de clientes

Una ilustración animada del producto, hecha solo con la skill [stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) de benjitaylor/skills.

**Esto no es un directorio que funcione.** Stageshow sirve para crear interfaces de producto falsas, en imagen fija o animadas con un cursor guionizado, como las que se ponen en la portada de una web o en una tarjeta de funcionalidad. Los clics no hacen nada real: `a.click()` solo dibuja la pulsación y `a.set()` cambia la escena.

## Cómo verlo

Abre `lex-clientes-demo.html` en el navegador: es un solo archivo con todo incluido.

Para desarrollar:

```bash
npm install
npm run dev
npm run build   # genera dist/index.html, un solo archivo
```

## La historia

Un asociado busca "valdes" y la lista se cierra alrededor del único resultado, junto con sus expedientes. Abre la ficha de Constructora Valdés & Hijos, ve la audiencia de mañana y crea un recordatorio: el botón lo confirma en el mismo sitio. Con Esc se deshace todo y vuelve a empezar. El bucle dura unos 17 segundos.

## Cómo se siguió la skill

- **Punto de partida:** el ejemplo de referencia `linear`, filmado antes de empezar (`shots/gold-linear.png`) y copiado como base.
- **Escena:** construida con las piezas del kit (`Stage`, `Window`, `Field`, `Collapse`, `Button`, `States`, `Badge`, `Avatar`, `Bar`, `Text`), sin imitarlas a mano.
- **Diseño para móvil:** uno propio a 358 px, no una versión encogida.
- **Ensayo:** `scripts/film.mjs` con `--gate` en ancho completo, a 390 px y con `--states`, y en la página final ya compilada. Todas las pasadas terminan en `rehearsal passed`.
- **Registro:** `REHEARSAL.md` recoge qué se corrigió, qué hallazgos quedan y por qué, y qué no se comprobó.

## Archivos

| Archivo | Contenido |
|---|---|
| `src/scene/LexClientes.tsx` | La escena y su guion |
| `src/scene/lex.css` | El aspecto del producto (parte del CSS del ejemplo `linear`) |
| `src/kit/` | El kit de stageshow, copiado sin cambios (MIT, ver `LICENSE-stageshow` y `NOTICE-stageshow.md`) |
| `src/main.tsx`, `src/host.css` | La página que aloja la demo, con un botón para repetirla |
| `lex-clientes-demo.html` | La demo compilada en un solo archivo |
| `REHEARSAL.md` | El registro del ensayo que pide la skill |
| `shots/` | El ejemplo de referencia, el momento final y el fotograma de movimiento reducido |
