# DESIGN.md · Elena Fit

Dirección: **editorial deportivo**. Negro puro, bloques ámbar, secciones blancas con borde rasgado,
titulares enormes en sans extendida y fotos en duotono ámbar/negro. Referencias aportadas por el cliente.
No se compararon sitios reales vía UXKIN (herramientas no conectadas).

Los tokens viven en `packages/ui/src/theme.css` y los comparten `apps/web` y `apps/app`.

## Color · paleta de marca: `#FAA307` · `#FFFFFF` · `#000000`

| Token | Valor | Rol | Contraste |
|---|---|---|---|
| `ink` | `#000000` | Fondo base | — |
| `ink-2` / `ink-3` | `#0b0b0c` / `#161617` | Superficies elevadas (tarjetas, campos) | — |
| `line` | `#232326` | Bordes sobre negro | — |
| `bone` | `#ffffff` | Texto principal sobre negro | 21:1 |
| `mute` | `#a3a3a3` | Texto secundario sobre negro | 8,6:1 |
| `brand` / `accent` / `volt` | `#faa307` | Relleno (botones, hero, bloques) y acento (etiquetas, cifras, enlaces) | 10,3:1 sobre negro; 10,3:1 con texto negro encima |
| `brand-2` | `#ffb733` | Hover del ámbar | — |
| `paper` | `#ffffff` | Secciones claras alternas | — |
| `paper-ink` | `#000000` | Texto sobre blanco | 21:1 |
| `paper-mute` | `#4a4a4a` | Texto secundario sobre blanco | 8,9:1 |

Reglas de contraste (importantes):
- **Texto sobre ámbar: siempre negro.** El blanco sobre `#FAA307` da solo 2:1 y no se usa.
- **Ámbar como texto: solo sobre negro.** Sobre blanco da 2:1; el énfasis en secciones blancas es negro con subrayado ámbar.
- Estados funcionales fuera de marca: `bad` (#f87171) para errores de formulario y `ok` (#4ade80) para métricas de la app.

## Tipografía

- **Titulares**: Archivo variable, ancho 125, peso 800, mayúsculas, interlineado 0,94, tracking -0,02em
  (clase `font-display-tight`). La app mantiene Barlow Condensed para cifras en móvil.
- **Cuerpo**: Inter, 16 px mínimo, líneas de 60–75 caracteres.
- Énfasis en titulares: palabra en ámbar sobre negro; en el hero y el cierre (fondo ámbar), palabra en contorno negro.

## Espaciado y forma

- Base 4 px. Secciones `py-24` (móvil) a `py-32` (escritorio). Ancho de contenido `max-w-7xl`.
- Radios: tarjetas `rounded-2xl`/`3xl`; botones y chips `rounded-full`.
- Sin sombras de relleno; profundidad con bordes, color y solapes. Una sombra solo en las tarjetas inclinadas.
- Bordes rasgados entre secciones (`TornEdge`), grano de papel muy sutil en secciones blancas.

## Componentes

- **Botones** (`packages/ui/src/button.tsx`): `brand` (ámbar, texto negro) principal; `ink` (negro, texto blanco) sobre ámbar;
  `light` (blanco) sobre negro; `primary` (ámbar) en la app; `ghost` y `dark` secundarios. Altura mínima 44 px.
- **Foco**: anillo doble blanco + negro, visible sobre negro, ámbar y blanco.
- **Navegación**: barra negra sólida, enlace de la sección activa en ámbar con `aria-current`.
- **Foto** (`Photo`): `grayscale` + `contrast` + `mix-blend-multiply` sobre ámbar = duotono ámbar/negro.

## Imágenes

Fotos de stock gratuitas de Pexels como **marcadores**, sustituibles por fotos reales de Elena. Iconos: Lucide.
Logo: sello circular y marca (mancuerna-corazón), en `packages/ui/assets`, con variantes blanca, negra y ámbar.

## Movimiento

Títulos palabra a palabra al entrar en pantalla (`RevealText`), bloques con fundido y subida corta (`Reveal`),
una vez por elemento. Solo la cinta se mueve de forma continua. `prefers-reduced-motion` lo desactiva.

## Contenido

Sin cifras, clientes, testimonios ni precios inventados: todo lo provisional está rotulado ("ejemplo", "por confirmar").
