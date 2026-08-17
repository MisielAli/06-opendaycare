# Spec 07 — Modal Nueva publicación

> **Estado:** Aprovado
> **Depende de:** SPEC 01, SPEC 02, SPEC 03, SPEC 05
> **Fecha:** 2026-08-17

> **Objetivo:** Agregar un modal global de nueva publicación basado en `references/pantallas/crear-publicacion.dc.html` que permita crear posts temporales para un niño o toda la sala, con fotos locales y sin persistencia.

## Alcance

**Incluye:**

- Modal accesible basado visualmente en `references/pantallas/crear-publicacion.dc.html` con overlay centrado, tarjeta de hasta 580 px y contenido desplazable en viewports angostos.
- Apertura del modal desde el botón `Nueva publicación` del sidebar y desde `Compartí un momento…` del feed.
- Disponibilidad del flujo en todas las rutas del área staff: `/`, `/kids` y `/kids/[id]`.
- Catálogo compartido de destinatarios que reúne los ocho niños estáticos de `app/lib/kids.ts` y las altas temporales creadas desde `/kids`.
- Destinatarios individuales presentados por nombre completo, con los niños temporales primero, los estáticos en su orden existente y la opción `Toda la sala` al final.
- Selección obligatoria y mutuamente excluyente de un niño o `Toda la sala`.
- Selección obligatoria y mutuamente excluyente de uno de los siete tipos de la referencia: Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio.
- Campo Descripción obligatorio que rechaza contenido vacío o compuesto solo por espacios.
- Sección FOTOS con selector de archivos locales, hasta cuatro imágenes `image/*` de hasta 10 MB cada una, previews removibles y mensajes de rechazo dentro del modal.
- Validación de al menos una imagen cuando el tipo elegido es Foto; las fotos son opcionales para los demás tipos.
- Publicación temporal en memoria que navega a `/`, se inserta primera en el feed y se presenta como tarjeta completa con tipo, destinatario, hora actual, descripción, grilla de fotos y contadores `0`.
- Para un niño, la tarjeta muestra su primer nombre como encabezado y `familia de {primer nombre}` como audiencia; para `Toda la sala`, muestra `Toda la sala` y `toda la sala` respectivamente.
- Todos los tipos están disponibles para destinatarios individuales y para toda la sala.
- Cierre por Cancelar, Escape y clic sobre el overlay, descartando el contenido sin confirmación.
- Bloqueo del scroll de fondo, foco inicial en el primer destinatario, foco contenido dentro del diálogo y devolución del foco al activador al cancelar.
- Después de publicar, el foco se sitúa en la tarjeta nueva al llegar al feed.
- Estado compartido de niños y publicaciones temporales durante la navegación por el área staff, perdido al recargar la página.
- Diseño responsive sin desbordes horizontales y navegación completa por teclado.

**No incluye:**

- Base de datos, API, Server Actions, servicios externos, llamadas de red o almacenamiento local.
- Persistencia de niños, publicaciones o archivos tras una recarga.
- Subida real de imágenes a un servidor, optimización de imágenes o almacenamiento de archivos.
- Edición, eliminación, reacciones o comentarios funcionales sobre publicaciones existentes o temporales.
- Confirmación de descarte, toasts, banners o una pantalla de éxito.
- Reglas de permisos, autenticación, roles, moderación o validación remota de destinatarios.
- Nuevas rutas para crear, editar o ver el detalle de una publicación.
- Cambios en el lado familia/padres.

## Modelo de datos

La funcionalidad amplía los modelos de `app/lib/posts.ts` y concentra el estado efímero compartido en un provider del área staff. `app/lib/kids.ts` conserva `Kid`, `TempKid` y los datos estáticos existentes.

```ts
export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

export type PostAudience =
  | { kind: "kid"; kidId: string; kidName: string }
  | { kind: "room" };

export interface PostPhoto {
  id: string;
  name: string;
  previewUrl: string;
}

export interface CreatePostFormValues {
  audience: PostAudience | null;
  type: PostType | null;
  content: string;
  photos: PostPhoto[];
}

export interface Post {
  id: string;
  type: PostType;
  authorName: string;
  avatarInitial?: string;
  postedAtLabel: string;
  audienceLabel: string;
  content: string;
  photos?: PostPhoto[];
  likeCount: number;
  commentCount: number;
}
```

Convenciones:

- `PostAudience` es exclusivo: una publicación se dirige a un niño o a toda la sala.
- Una publicación para un niño deriva `authorName` de su primer nombre y `audienceLabel` como `familia de {primer nombre}`.
- Una publicación para sala usa `authorName: "Toda la sala"` y `audienceLabel: "toda la sala"`.
- `postedAtLabel` se deriva de la hora local al publicar con el formato ya usado por el feed.
- Los posts creados usan un ID temporal que no depende de texto ni del destinatario.
- `PostPhoto.previewUrl` usa una URL de objeto del navegador únicamente durante la vida de la página; se revoca al eliminar una foto y al desmontar el modal o provider que la conserva.
- El archivo original no se guarda como parte del post temporal; solo permanecen el nombre y la URL de preview en memoria.
- Los nuevos tipos mantienen una etiqueta visible y tokens de color en un único mapa de `app/lib/posts.ts` para que `TypeBadge` y el selector compartan la misma semántica.

## Estructura de componentes

```text
app/
├── (staff)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── kids/
│       └── page.tsx
└── lib/
    ├── kids.ts
    └── posts.ts

components/
├── feed/
│   ├── ComposerTrigger.tsx
│   ├── NewPostModal.tsx
│   ├── PostCard.tsx
│   └── PostPhotoGrid.tsx
├── shared/
│   ├── Avatar.tsx
│   └── TypeBadge.tsx
└── staff/
    └── StaffProvider.tsx
```

Criterios:

- `StaffProvider.tsx` es un client component montado por `app/(staff)/layout.tsx`; concentra el catálogo de niños, las altas temporales, los posts temporales y el estado de apertura del modal.
- El provider expone acciones para abrir y cerrar el composer, agregar un niño temporal y agregar una publicación temporal.
- `app/(staff)/kids/page.tsx` deja de mantener su propio arreglo `temporaryKids` y usa el catálogo y la acción del provider para preservar las altas al navegar.
- `app/(staff)/page.tsx` consume los posts temporales del provider y los muestra antes de `posts`.
- `Sidebar.tsx` y `ComposerTrigger.tsx` solicitan al provider la apertura del mismo modal; no duplican estado de formulario.
- `NewPostModal.tsx` concentra formulario, validación, previews locales, limpieza de recursos, mecanismos de cierre y gestión de foco.
- `PostPhotoGrid.tsx` muestra una foto a ancho completo o dos a cuatro fotos en grilla responsive con texto alternativo derivado de cada nombre de archivo.
- `PostCard.tsx` admite fotos temporales y se puede enfocar programáticamente cuando recibe la publicación recién creada.
- `Avatar.tsx` y `TypeBadge.tsx` se amplían para cubrir los siete tipos sin alterar el tratamiento de las tarjetas estáticas existentes.
- Los nombres de componentes, tipos, props y funciones se mantienen en inglés; todos los textos visibles, errores y etiquetas se mantienen en español.

## Plan de implementación

1. Actualizar `app/lib/posts.ts` con los siete valores de `PostType`, etiquetas, mapas visuales, `PostAudience`, `PostPhoto`, `CreatePostFormValues` y soporte opcional de fotos en `Post`.
2. Crear `components/staff/StaffProvider.tsx` con niños estáticos, niños temporales, posts temporales, acciones de alta y composición, y el estado global de apertura del modal.
3. Actualizar `app/(staff)/layout.tsx` para montar `StaffProvider` alrededor del sidebar y el contenido del área staff.
4. Actualizar `app/(staff)/kids/page.tsx` para crear niños temporales a través del provider y consumir el catálogo compartido, sin cambiar la validación ni el flujo del modal de alta existente.
5. Actualizar `components/sidebar/Sidebar.tsx` y `components/feed/ComposerTrigger.tsx` para abrir el composer del provider y conservar el cierre del menú móvil al activar Nueva publicación.
6. Crear `components/feed/NewPostModal.tsx` con la jerarquía visual de la referencia, chips de destinatario, selector de tipo, descripción y sección de fotos.
7. Implementar en `NewPostModal.tsx` la selección exclusiva, validación al pulsar Publicar, mensajes de error accesibles, regla adicional para tipo Foto, selector `image/*`, límite de cuatro archivos y límite de 10 MB por archivo.
8. Implementar en `NewPostModal.tsx` previews removibles, revocación de URLs de objeto, cancelación limpia, bloqueo de scroll, foco inicial, atrapamiento de foco, Escape, clic en overlay y devolución de foco al activador.
9. Crear `components/feed/PostPhotoGrid.tsx` y actualizar `components/feed/PostCard.tsx`, `components/shared/TypeBadge.tsx` y `components/shared/Avatar.tsx` para renderizar los siete tipos, tarjetas temporales con fotos y el foco de la tarjeta recién creada.
10. Actualizar `app/(staff)/page.tsx` para combinar posts temporales y estáticos, publicar mediante el provider, navegar a `/` desde cualquier ruta staff y enfocar la tarjeta nueva al llegar.
11. Verificar las altas temporales desde `/kids` como destinatarios del modal, publicaciones para niño y sala, todos los tipos, errores, fotos, cancelación y navegación; capturar el modal y el feed publicado en `1440x900` y `390x844` dentro de `.playwright-mcp/`, y ejecutar `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [x] El botón `Nueva publicación` del sidebar abre el modal en `/`, `/kids` y `/kids/[id]`.
- [x] `Compartí un momento…` abre el mismo modal desde `/`.
- [x] El modal reproduce la jerarquía visual, las tipografías, colores y espaciados de `references/pantallas/crear-publicacion.dc.html`.
- [x] El modal aparece centrado sobre un overlay, bloquea la interacción y el scroll del fondo y permanece utilizable sin desborde horizontal en `390x844`.
- [x] Los destinatarios individuales incluyen los ocho niños estáticos por nombre completo y toda alta temporal creada desde `/kids` durante la misma sesión.
- [x] Los niños temporales se muestran antes de los estáticos y `Toda la sala` aparece como última opción.
- [x] Solo se puede seleccionar un destinatario individual o `Toda la sala` a la vez.
- [x] El modal ofrece Comida, Siesta, Actividad, Logro, Ánimo, Foto y Anuncio, y permite seleccionar exactamente un tipo.
- [x] Todo tipo se puede publicar tanto para un niño como para Toda la sala.
- [x] Destino, tipo y descripción son obligatorios al pulsar Publicar.
- [x] Una descripción vacía o formada solo por espacios muestra un error y no crea una publicación.
- [x] Los errores aparecen al pulsar Publicar y desaparecen al corregir su control correspondiente.
- [x] El selector acepta solo imágenes, como máximo cuatro archivos y como máximo 10 MB por archivo.
- [x] Un archivo de tipo o tamaño no permitido muestra un mensaje dentro del modal y no se agrega como preview.
- [x] Cada preview válido se puede eliminar antes de publicar.
- [x] Publicar con el tipo Foto y sin imágenes muestra un error y conserva el modal abierto.
- [x] Publicar otro tipo sin fotos es válido.
- [x] Cancelar, Escape y clic sobre el fondo cierran el modal, descartan el contenido sin pedir confirmación y devuelven el foco al activador.
- [x] Al abrir, el foco se sitúa en el primer destinatario y no puede salir del diálogo mientras está abierto.
- [x] Publicar un formulario válido desde cualquier ruta staff navega a `/` y coloca la publicación creada antes de las publicaciones estáticas.
- [x] Una publicación individual muestra el primer nombre del niño como encabezado y `familia de {primer nombre}` como audiencia.
- [x] Una publicación para sala muestra `Toda la sala` como encabezado y `toda la sala` como audiencia.
- [x] La tarjeta creada muestra el tipo elegido, la hora de publicación, la descripción, contadores `0` y una grilla responsive con todas las fotos seleccionadas.
- [x] Una foto se muestra a ancho completo y dos a cuatro fotos se muestran en una grilla compacta con texto alternativo basado en el nombre del archivo.
- [x] Tras publicar, el foco se sitúa en la tarjeta nueva del feed.
- [x] Los niños temporales y publicaciones temporales sobreviven la navegación entre rutas staff, pero desaparecen al recargar.
- [x] No se realizan llamadas de red ni se usa base de datos, cookies, `localStorage`, `sessionStorage` u otro almacenamiento persistente.
- [x] La consola no muestra errores al abrir, validar, adjuntar, eliminar, publicar o cancelar.
- [x] Las capturas del modal y del feed publicado en `1440x900` y `390x844` se guardan en `.playwright-mcp/` y se comparan con la referencia.
- [x] `npm run lint` y `npx tsc --noEmit` finalizan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** un único `StaffProvider` para niños, publicaciones y apertura del composer — permite que las altas temporales y publicaciones se compartan entre rutas staff sin duplicar estado.
- **No:** mantener el estado temporal dentro de `KidsBrowser` y la página del feed — esos estados se desmontan al navegar y no permiten integrar el modal global.
- **Sí:** incluir ocho niños estáticos y altas temporales — utiliza todo el catálogo disponible y evita excluir registros existentes sin una regla de producto.
- **No:** limitar el selector a los tres niños del mockup — reproduce la composición visual, pero rompe la consistencia con los datos ya disponibles.
- **Sí:** conservar el estado solo hasta recargar — valida el flujo completo sin establecer un contrato de persistencia prematuro.
- **No:** `localStorage`, backend o API — requieren versionado, sincronización y reglas de datos fuera de este alcance.
- **Sí:** abrir desde el sidebar y el composer del feed — ambas acciones expresan la misma intención y comparten un único formulario.
- **No:** dejar la caja `Compartí un momento…` como control visual — mantendría una acción principal sin comportamiento.
- **Sí:** destino, tipo y descripción obligatorios — garantiza que cada tarjeta temporal tenga contexto legible.
- **No:** permitir publicaciones vacías — produciría posts sin audiencia, significado ni contenido.
- **Sí:** todos los tipos para todos los destinatarios — la referencia no define restricciones de negocio y no se deben introducir reglas arbitrarias.
- **No:** restringir Anuncio a sala o tipos cotidianos a niños — sería una regla de producto no acordada.
- **Sí:** requerir imagen únicamente con tipo Foto — mantiene las fotos opcionales sin permitir una publicación cuyo tipo no tiene contenido visual.
- **No:** exigir fotos para todos los tipos — la referencia incluye publicaciones de texto y ampliaría innecesariamente el esfuerzo de carga.
- **Sí:** hasta cuatro imágenes locales de 10 MB, removibles — ofrece una experiencia de adjunto funcional y acotada para el prototipo.
- **No:** archivos ilimitados o una galería compleja — agregan manejo de rendimiento y UI que el mockup no requiere.
- **Sí:** sin confirmación de descarte y sin toast — el flujo se mantiene directo y la tarjeta recién insertada confirma el resultado en su contexto.
- **No:** modal adicional de confirmación o banner de éxito — introduce patrones visuales y estados no presentes en la referencia.
- **Sí:** foco atrapado, foco inicial y devolución de foco — el composer es un diálogo modal y debe ser operable con teclado.
- **No:** confiar solo en el foco nativo — permite que la navegación por teclado alcance contenido oculto detrás del overlay.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las URLs de objeto de previews retienen memoria si no se liberan | Revocarlas al quitar cada foto y durante la limpieza del modal o provider. |
| El provider convierte páginas antes estáticas en consumidoras de estado cliente | Limitar el provider al layout staff y mantener los datos base en `app/lib/`. |
| Las publicaciones en memoria pueden interpretarse como persistidas | Documentar el comportamiento y excluir explícitamente backend y almacenamiento local. |
| El selector con ocho o más niños puede ocupar demasiado espacio en móvil | Usar chips flexibles, contenido desplazable y verificar el viewport `390x844`. |
| Las fotos locales no sobreviven una recarga | Limitar los previews al ciclo de vida de la página y no mostrar una falsa promesa de almacenamiento. |

## Lo que no está en este spec

- Persistencia de publicaciones, niños o fotos tras recargar.
- Carga de fotos a un servidor o gestión real de archivos.
- Edición, eliminación, comentarios o reacciones funcionales.
- Permisos, autenticación, moderación o reglas de visibilidad reales.
- Confirmación de descarte, toasts o banners de éxito.
- Rutas de detalle o edición de publicaciones.
- Cambios en el lado familia/padres.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
