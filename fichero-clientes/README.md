# Fichero de clientes

Otra vista del directorio de clientes de Lex & Asociados, construida siguiendo solo las skills de [anthropics/skills](https://github.com/anthropics/skills).

## Cómo verlo

`bundle.html` es un solo archivo con todo incluido: ábrelo directamente en el navegador.

Para desarrollar:

```bash
pnpm install
pnpm dev
```

Para volver a empaquetar, desde esta carpeta:

```bash
bash ruta/a/anthropics-skills/skills/web-artifacts-builder/scripts/bundle-artifact.sh
```

## Skills aplicadas

- **`frontend-design`:** el plan de diseño y su revisión frente al encargo están en [`DISENO.md`](./DISENO.md). El concepto es el fichero metálico de fichas con separadores alfabéticos, con una paleta de seis tonos y una sola familia tipográfica (Archivo, con su eje de anchura). La interfaz evita los rasgos genéricos que la skill enumera, y tuvo una pasada de crítica con capturas: se quitó la barra de letras porque duplicaba los separadores del cajón, y se reservó el rojo para la selección y lo urgente.
- **`web-artifacts-builder`:** la base es React 18, TypeScript, Tailwind y shadcn/ui, creada con `init-artifact.sh` y empaquetada en un solo HTML con `bundle-artifact.sh`.
- **`webapp-testing`:** pruebas con Playwright en Python sobre `bundle.html`:
  - Búsqueda sin tildes y pestañas de la ficha.
  - Estado vacío y validación del formulario, que lleva el foco al primer error.
  - Creación de una ficha.
  - Hoja inferior en móvil y ausencia de desbordamiento.

## Ajustes al entorno

- **`tsconfig`:** se quitó `baseUrl`, que la versión actual de TypeScript ya no admite. Los alias `@/` siguen funcionando.
- **`package.json`:** se activó `packageExports` para que Parcel resuelva los paquetes de Radix.
- **Fuente:** Archivo se carga desde `main.tsx`, porque `html-inline` no puede incrustar hojas de estilo remotas.
- **Componentes:** se quitaron `calendar` y `resizable` de shadcn, que no se usan y no compilan con las versiones actuales de sus dependencias.
