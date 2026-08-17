# Spec 01 — Feed como Home (estático)

**Estado:** Aprovado
**Depende de:** —
**Fecha:** 2026-08-16

**Objetivo:** Implementar la pantalla del feed de `references/pantallas/feed.dc.html` como home `/`, con datos estáticos, visualmente idéntica al mockup y responsive.

## Alcance

**Incluye:**

- Sidebar compartido en un layout: logo OpenDayCare, botón "Nueva publicación", nav (Feed activo, Niños, Avisos, Mi cuenta), usuario "Caro Giménez" y logout — como links visuales sin destino funcional
- Feed: saludo "Buenas, Caro", caja "Compartí un momento…", separador "PUBLICADO HOY" y los 3 posts del mockup (logro, actividad con placeholder de foto, anuncio) con badges y contadores
- Fuentes Fredoka y Nunito vía `next/font`
- Responsive: sidebar oculto en móvil con botón hamburguesa que lo abre
- Datos estáticos en archivo separado (`app/lib/posts.ts`)
- Arquitectura de componentes en `components/` con subcarpetas por dominio (`shared/`, `sidebar/`, `feed/`)

**No incluye:**

- Base de datos, API ni persistencia de ningún tipo
- Páginas destino de los links (crear-publicación, niños, avisos, mi cuenta, detalle, login)
- Interactividad de corazones, comentarios o "Editar" (puramente visual)
- Subida real de fotos (solo el placeholder dashed del mockup)
- Lado familia/padres

## Modelo de datos

`app/lib/posts.ts`:

```ts
// Código e identificadores en inglés; los strings que ve el usuario en español.
export type PostType = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostType;
  authorName: string;      // "Mateo" | "Anuncio general"
  avatarInitial?: string;  // inicial del avatar; ausente cuando el avatar lleva icono
  postedAtLabel: string;   // "14:20"
  audienceLabel: string;   // "familia de Mateo" | "toda la sala"
  content: string;         // texto del post en español
  photoLabel?: string;     // "Foto · pintando con témperas"
  likeCount: number;
  commentCount: number;
}

export const posts: Post[]; // los 3 posts del mockup

// Etiquetas visuales por tipo, en un único lugar
export const postTypeLabels: Record<PostType, string> = {
  achievement: "Logro",
  activity: "Actividad",
  announcement: "Anuncio",
};
```

Convenciones:

- Nombres de tipos, campos, variables y funciones en inglés (`PostType`, `likeCount`, `getInitials`)
- Todo texto visible al usuario en español, ya sea como valor de datos (posts) o como etiqueta mapeada (`postTypeLabels`)
- Los textos compartidos de UI (etiquetas, títulos) se agrupan en constantes exportadas desde `app/lib/`, no dispersos en componentes

## Estructura de componentes

```
components/
├── shared/                  # en común entre pantallas
│   ├── Avatar.tsx           # círculo con inicial (colores variables) o icono SVG
│   └── TypeBadge.tsx        # pill LOGRO/ACTIVIDAD/ANUNCIO (dot + colores por tipo)
├── sidebar/
│   ├── Sidebar.tsx          # client component: contenedor sticky + toggle hamburguesa
│   ├── SidebarNav.tsx       # nav con item activo (Feed/Niños/Avisos/Mi cuenta)
│   └── SidebarUser.tsx      # footer: avatar, nombre, rol, logout
└── feed/
    ├── ComposerTrigger.tsx  # caja "Compartí un momento…" con icono cámara
    ├── PostCard.tsx         # tarjeta de post (usa Avatar + TypeBadge)
    ├── PostActions.tsx      # footer: corazones, comentarios, Editar
    └── PhotoPlaceholder.tsx # bloque dashed de foto
```

Criterios:

- `shared/` solo para componentes reutilizables entre pantallas (Avatar y TypeBadge aparecen también en Niños/Avisos según los mockups)
- Nada de `feed/` se importa fuera del feed
- `Sidebar.tsx` es el único client component (estado del menú móvil); el resto son server components puros

## Plan de implementación

1. **Base:** actualizar `app/layout.tsx` (Fredoka + Nunito con `next/font`, `lang="es"`, metadata "OpenDayCare") y `app/globals.css` (fondo `#F6ECDF`, color de texto, scrollbar) — sistema funciona con la nueva base
2. **Datos:** crear `app/lib/posts.ts` con los 3 posts
3. **Shared:** crear `components/shared/Avatar.tsx` y `components/shared/TypeBadge.tsx`
4. **Sidebar:** crear `components/sidebar/*` + `app/(staff)/layout.tsx` que lo monta
5. **Feed:** crear `components/feed/*` y mover la home a `app/(staff)/page.tsx` (eliminando `app/page.tsx`)
6. **Verificación:** `npm run dev` + captura en `.playwright-mcp/` comparada contra el mockup; `npm run lint` y `npx tsc --noEmit` sin errores

## Criterios de aceptación

- [ ] `/` renderiza sidebar + feed visualmente idénticos al mockup (colores, tipografías, tamaños y espaciados)
- [ ] El ítem "Feed" del nav aparece activo (fondo `#FBE3D8`, texto `#D9583C`)
- [ ] Los 3 posts muestran sus badges LOGRO/ACTIVIDAD/ANUNCIO y contadores 3/1, 5/2, 8/0
- [ ] El post de actividad muestra el placeholder de foto con borde dashed
- [ ] Las fuentes cargan vía `next/font` (sin `<link>` a Google Fonts en el HTML)
- [ ] En viewport angosto el sidebar se oculta y la hamburguesa lo abre/cierra
- [ ] Existe la estructura `components/{shared,sidebar,feed}/` según la sección "Estructura de componentes"
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores
- [ ] No hay base de datos ni llamadas a API en el código
- [ ] Identificadores, tipos y funciones en inglés; todo texto visible al usuario en español (badges "LOGRO/ACTIVIDAD/ANUNCIO", posts, nav)

## Decisiones tomadas y descartadas

- **Datos en `app/lib/posts.ts`** y no hardcode en el componente — facilita el reemplazo por una API real
- **Links visuales sin destino** y no placeholders vacíos — fidelidad al mockup sin inflar alcance
- **Contadores puramente visuales** — fuera de alcance lo funcional
- **`next/font`** y no `<link>` a Google Fonts — self-hosted, sin FOUT
- **Layout compartido `app/(staff)/layout.tsx`** y no todo en `page.tsx` — reutilizable por Niños/Avisos/Mi cuenta
- **Hamburguesa móvil** y no bottom bar ni rail de iconos — patrón estándar
- **Estructura `components/{shared,sidebar,feed}/`** — separación por dominio de pantalla; `shared/` solo para componentes reutilizables entre pantallas
- **Código en inglés, UI en español** (`PostType = "achievement" | ...` + `postTypeLabels` con "Logro/Actividad/Anuncio") — identificadores en inglés con convenciones de código limpio; textos del usuario en español centralizados en constantes

## Riesgos

- El diseño móvil no está definido en los mockups; la hamburguesa se construye por criterio y podrá ajustarse cuando existan las demás pantallas
- "Idéntico al mockup" es subjetivo: se verifica con captura lado a lado en la fase de implementación
