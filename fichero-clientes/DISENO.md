# Plan de diseño: fichero de clientes

Plan escrito según la skill `frontend-design` de anthropics/skills: primero el sistema de tokens y el concepto, después la revisión frente al encargo, y solo entonces el código.

## Encargo

- **Tema:** el directorio de clientes de una firma de abogados.
- **Público:** socios y asociados que buscan a un cliente varias veces al día.
- **Trabajo principal:** encontrar a un cliente en segundos y ver de un vistazo sus asuntos y su cuenta.

## Primera propuesta

El tema más característico del mundo legal para un directorio es el **fichero**: el cajón metálico de fichas bibliográficas con separadores alfabéticos que los despachos usaron durante décadas. Cada cliente es una ficha blanca con renglones azules y una línea roja bajo el encabezado.

### Color

| Nombre | Hex | Uso |
|---|---|---|
| Gabinete | `#DCE0E5` | Fondo: el metal gris azulado del archivador |
| Ficha | `#FFFFFF` | Superficie de cada ficha |
| Tinta | `#1A2230` | Texto principal |
| Grafito | `#566070` | Texto secundario |
| Renglón | `#A9C6E8` | Líneas de la ficha abierta |
| Margen | `#C62B33` | La línea roja de la ficha; marca la selección y lo urgente |

### Tipografía

Una sola familia, **Archivo** (variable, eje de anchura 62–125), usada con intención en vez de combinar dos familias:

- **Títulos:** Archivo expandida (`wdth 125`), peso 600.
- **Pestañas de los separadores:** Archivo condensada (`wdth 75`), peso 700.
- **Texto:** Archivo normal (`wdth 100`), 400 y 500.

Escala modular de razón 4:3: 12, 14, 16, 21, 28 y 42 px. Líneas de menos de 80 caracteres.

### Composición

Alineada a la izquierda, maestro y detalle:

```
┌───────────────────────────────────────────────────────────────┐
│ Lex & Asociados        [ buscar… ]                [Nueva ficha]│
│ 28 fichas. 4 audiencias esta semana.                          │
├──────────────────────────┬────────────────────────────────────┤
│  ┌A┐                     │ ┌────────────────────────────────┐ │
│ ─┴─┴──────────────────── │ │ Constructora Valdés & Hijos    │ │
│ ▔ Agroindustrias La Es…  │ │════════════════════════════════│ │← línea roja
│ ▔ Andrés Felipe Cárde…   │ │ Correo   juridico@…            │ │← renglones
│      ┌B┐                 │ │ Teléfono +57 …                 │ │
│ ─────┴─┴──────────────── │ │ ───────────────────────────── │ │
│ ▔ BioFarma Meridiano     │ │ Ficha · Casos · Cuenta · Bitác.│ │
│ ...                      │ └────────────────────────────────┘ │
│  cajón (lista apilada)   │  ficha sacada del cajón            │
└──────────────────────────┴────────────────────────────────────┘
```

- **El cajón:** las fichas se apilan y solo asoma su borde superior, con el nombre y una línea de datos. Antes de cada letra hay un separador con su pestaña, y las pestañas se escalonan horizontalmente como en un fichero real.
- **La ficha abierta:** es grande, tiene renglones y ahí se lee todo.

### Principios

1. **El cajón es la interfaz.** Es lo memorable; todo lo demás queda callado.
2. **Nada de paneles de métricas.** El resumen es una frase.
3. **Movimiento solo con causa:**
   - Una secuencia al cargar: las fichas se archivan en el cajón.
   - Al elegir una ficha, sube y aparece abierta a la derecha.
   - Al filtrar, las fichas se reordenan.
4. **Textos sencillos y en sentence case.** Sin etiquetas en mayúsculas sostenidas, sin separadores "·" y sin flechas.

## Revisión frente al encargo

La skill pide comprobar si alguna parte del plan es la opción por defecto para cualquier encargo parecido. Probé con "directorio de clientes de un despacho de abogados" desde cero:

- **La respuesta por defecto sería azul marino y dorado con serif** (de hecho, mi primera versión). El fichero no cae ahí: es gris metálico, blanco y rojo, con una sans de ancho variable.
- **Rasgos genéricos que enumera la skill:**
  1. Crema con serif y terracota: no.
  2. Casi negro con un acento ácido: no.
  3. Tipo periódico, con líneas finas y sin radios: riesgo parcial, porque los renglones son líneas finas. Se limitan a la ficha abierta, que es donde está el sentido; el resto no usa reglas.
  4. Kit de tarjetas SaaS: la primera idea de lista era una cuadrícula de tarjetas. **La cambié** por fichas apiladas que solo muestran el borde, con radios distintos según la jerarquía: ficha 4 px, pestaña 8 px arriba, botón 6 px.
  5. Adornos de plantilla: la tentación era escribir la ficha en monoespaciada "de máquina de escribir". **La descarté:** es un rasgo de la lista y además empeora la lectura. Todo va en Archivo.
- **Esqueumorfismo excesivo:** riesgo propio del concepto. **Lo corregí:** sin texturas de papel, sin sombras 3D ni inclinaciones. El fichero se expresa con la estructura (separadores, pila y renglones), no con decoración.

## Calidad mínima

- Responsive hasta móvil: en pantallas estrechas la ficha abierta sale como hoja desde abajo.
- Foco visible.
- Respeta `prefers-reduced-motion`.
- Contraste accesible.
