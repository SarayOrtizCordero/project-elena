# DESIGN.md · Elena Fit

Dirección: **editorial deportivo**. Negro puro, bloques de rojo, secciones de papel claro con borde rasgado,
titulares enormes en sans extendida y fotos en duotono rojo/negro. Referencias aportadas por el cliente
(web de fitness roja con papel rasgado, web oscura de estudio con galería y tarifas, paleta rojo/naranja).
No se compararon sitios reales vía UXKIN (herramientas no conectadas).

Los tokens viven en `packages/ui/src/theme.css` y los comparten `apps/web` y `apps/app`.

## Color

| Token | Valor | Rol | Contraste |
|---|---|---|---|
| `ink` | `#000000` | Fondo base | — |
| `ink-2` / `ink-3` | `#0b0b0c` / `#161617` | Superficies elevadas (tarjetas, campos) | — |
| `line` | `#232326` | Bordes sobre negro | — |
| `bone` | `#f6f5ef` | Texto principal sobre negro | 19:1 |
| `mute` | `#a1a1aa` | Texto secundario sobre negro | 8:1 |
| `brand` | `#bb2234` | Botones, bloques, hero, titulares **grandes** | 6,2:1 con texto blanco; 3,4:1 sobre negro (solo texto grande) |
| `brand-2` | `#d12b40` | Hover de `brand` | — |
| `accent` (`volt`) | `#fb8603` | Etiquetas, cifras, enlaces, texto pequeño sobre negro | 8,5:1 sobre negro |
| `paper` | `#f2efe9` | Secciones claras alternas | — |
| `paper-ink` | `#111111` | Texto sobre papel | 17:1 |
| `paper-mute` | `#55555c` | Texto secundario sobre papel | 6,6:1 |

Reglas: el naranja **nunca** va como texto sobre papel (2,1:1); sobre papel el énfasis es rojo. El rojo como texto
pequeño solo sobre papel (5,4:1). Estados de error: `bad` (#f87171) sobre negro, rojo oscuro sobre papel.

## Tipografía

- **Titulares**: Archivo variable, ancho 125, peso 800, mayúsculas, interlineado 0,94, tracking -0,02em
  (clase `font-display-tight`). La app mantiene Barlow Condensed para cifras en móvil.
- **Cuerpo**: Inter, 16 px mínimo, líneas de 60–75 caracteres.
- Escala (web): hero `clamp(2.6rem, 10.5vw, 7.5rem)`, h2 `text-4xl → text-6xl`, h3 `text-2xl/3xl`, cuerpo `text-base/lg`,
  etiquetas `text-xs` con tracking 0,22em.

## Espaciado y forma

- Base 4 px. Secciones `py-24` (móvil) a `py-32` (escritorio). Ancho de contenido `max-w-7xl`/`max-w-6xl`.
- Radios: tarjetas `rounded-2xl`; botones y chips `rounded-full`; fotos de galería rectas o `rounded-xl`.
- Sin sombras de relleno; la profundidad viene de bordes, color y solapes. Una sombra solo en tarjetas inclinadas.
- Bordes rasgados entre secciones (componente `TornEdge`), textura de papel sutil en `paper`.

## Componentes

- **Botones** (`packages/ui/src/button.tsx`): `brand` (rojo, texto blanco) principal en negro y papel; `light` (blanco)
  sobre rojo; `primary` (naranja, texto negro) en la app; `ghost` y `dark` secundarios. Altura 44 px mínimo.
- **Foco**: anillo doble blanco + negro (visible sobre negro, rojo y papel).
- **Navegación**: barra negra sólida y opaca, enlace de la sección activa con `aria-current`.
- **Foto** (`Photo`): `grayscale` + `contrast` + `mix-blend-multiply` sobre `brand` = duotono rojo/negro.
- **Cinta** (marquee): texto grande en contorno/blanco, separadores naranjas, `aria-hidden`.

## Imágenes

Fotos de stock gratuitas de Pexels (licencia Pexels, sin atribución obligatoria) como **marcadores**; se
sustituirán por fotos reales de Elena. Iconos: Lucide. Logo: sello circular y marca (mancuerna-corazón) en
`packages/ui/assets`.

## Movimiento

Títulos palabra a palabra al entrar en pantalla (`RevealText`), bloques con fundido y subida corta (`Reveal`),
una vez por elemento. Sin movimiento continuo salvo la cinta. `prefers-reduced-motion` lo desactiva.

## Contenido

Sin cifras, clientes, testimonios ni precios inventados: todo lo provisional está rotulado ("ejemplo", "por confirmar").
