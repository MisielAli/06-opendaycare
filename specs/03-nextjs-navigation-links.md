# Spec 03 — Navegación interna con Next.js Link

**Estado:** Implementado
**Depende de:** SPEC 01, SPEC 02
**Fecha:** 2026-08-17

**Objetivo:** Usar `next/link` para toda navegación interna existente y reservar botones para acciones que todavía no tienen una ruta destino.

## Alcance

**Incluye:**

- Convertir los enlaces de rutas internas en `components/sidebar/SidebarNav.tsx` para que Feed (`/`) y Niños (`/kids`) usen `Link` de `next/link`
- Mantener los enlaces internos ya correctos en `components/kids/KidCard.tsx` y `app/(staff)/kids/[id]/page.tsx`
- Reemplazar los elementos `<a href="#">` que representan acciones sin página implementada por `<button type="button">` en `components/sidebar/Sidebar.tsx`, `components/sidebar/SidebarUser.tsx`, `components/feed/ComposerTrigger.tsx` y `components/feed/PostActions.tsx`
- Ajustar `app/lib/navigation.ts` y los componentes que lo consumen para que Avisos y Mi cuenta, que aún no tienen ruta, no se rendericen como enlaces de navegación
- Establecer la convención para las próximas pantallas: `Link` para rutas internas, `<a>` para URLs externas o descargas y `button` para acciones
- Verificación manual de la navegación de Feed, Niños, tarjetas de niños y enlace de retorno al perfil

**No incluye:**

- Crear las pantallas o rutas de Avisos, Mi cuenta, Nueva publicación, comentarios, edición o cierre de sesión
- Implementar la funcionalidad de las acciones que hoy son visuales
- Enlaces externos, descargas o autenticación
- Cambios visuales no necesarios para conservar el aspecto de los componentes existentes

## Modelo de datos

Esta funcionalidad no introduce nuevas estructuras de datos. `app/lib/navigation.ts` conserva `NavItem`, pero las entradas sin una ruta implementada se deben identificar de forma explícita para que `SidebarNav` pueda renderizarlas como botones.

Convenciones:

- Una ruta interna se expresa con una cadena que comienza con `/` y se renderiza con `Link`.
- Una acción sin navegación se renderiza con `button type="button"`.
- Un enlace externo o una descarga futura se renderizará con `<a>` y una URL real, no con `href="#"`.

## Plan de implementación

1. Actualizar `app/lib/navigation.ts` para distinguir los ítems navegables de las acciones visuales sin ruta, conservando las etiquetas y el orden actuales del sidebar.
2. Actualizar `components/sidebar/SidebarNav.tsx` para importar `Link`, usarlo para Feed y Niños y renderizar botones para los ítems sin ruta.
3. Reemplazar los placeholders de `components/sidebar/Sidebar.tsx` y `components/sidebar/SidebarUser.tsx` por botones accesibles sin alterar su apariencia.
4. Reemplazar los placeholders de `components/feed/ComposerTrigger.tsx` y `components/feed/PostActions.tsx` por botones accesibles sin alterar su apariencia.
5. Confirmar que `components/kids/KidCard.tsx` y `app/(staff)/kids/[id]/page.tsx` conservan sus usos de `Link` para las rutas internas ya implementadas.
6. Ejecutar la verificación manual de rutas y ejecutar `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [x] Los ítems Feed y Niños del sidebar usan `Link` de `next/link` y navegan respectivamente a `/` y `/kids`.
- [x] Cada tarjeta en `/kids` usa `Link` y navega a `/kids/[id]`.
- [x] El enlace "Volver a Niños" del perfil usa `Link` y navega a `/kids`.
- [x] Ningún componente de la aplicación usa `<a href="#">` como placeholder de una acción sin destino.
- [x] Nueva publicación, logo, comentarios, Editar, cerrar sesión, Avisos y Mi cuenta se representan como botones cuando no exista una ruta implementada.
- [x] Los botones reemplazados conservan sus textos, iconos, estilos visibles y etiquetas accesibles actuales.
- [x] La navegación manual entre `/`, `/kids`, `/kids/0001` y el retorno a `/kids` no produce recargas completas de documento.
- [x] `npm run lint` y `npx tsc --noEmit` finalizan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** `Link` para cada ruta interna existente — habilita navegación del App Router y prefetching de Next.js.
- **No:** `<a>` para rutas internas — no aprovecha la navegación cliente de Next.js.
- **Sí:** `button type="button"` para acciones sin destino funcional — expresa correctamente que todavía no navegan.
- **No:** `Link href="#"` para placeholders — no representa una ruta real y puede modificar el fragmento de la URL.
- **Sí:** preservar los `Link` ya existentes en tarjetas y perfil — ya cumplen la convención acordada.
- **No:** crear rutas vacías para Avisos, Mi cuenta o las acciones del feed — amplía el alcance de este ajuste técnico.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un botón visual parece una navegación disponible aunque no tenga función | Mantener el alcance estático actual y crear su ruta o comportamiento en un spec posterior. |
| Cambiar `<a>` por `button` altera estilos nativos | Conservar explícitamente las clases de Tailwind y verificar el aspecto manualmente. |

## Lo que no está en este spec

- Pantallas de Avisos, Mi cuenta y Nueva publicación.
- Funcionalidad de comentarios, edición o cierre de sesión.
- Persistencia, API o autenticación.
- Cambios de diseño no relacionados con la semántica de navegación.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
