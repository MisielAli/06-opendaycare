# Spec 11 — Mantenimiento de niños y salas con Supabase

> **Estado:** Done
> **Depende de:** SPEC 02, SPEC 05, SPEC 08, SPEC 09, SPEC 10
> **Fecha:** 2026-08-19

> **Objetivo:** Crear las tablas `rooms` y `children` en Supabase con seed de tres salas y RLS policies, y conectar las pantallas `/kids` y `/kids/[id]` a datos reales reemplazando el mock en memoria por consultas server-side y una Server Action para alta de niños.

## Por qué existe esta spec

SPEC 02 y SPEC 05 dejaron las pantallas de niños funcionando con datos estáticos y persistencia en memoria. SPEC 08 y SPEC 09 crearon `daycares` y `users` en Supabase. Esta spec cierra el ciclo: introduce las tablas de dominio que faltaban (`rooms` y `children`), las protege con RLS, siembra tres salas canónicas y reemplaza el código mock de la aplicación por consultas reales a la base de datos.

## Alcance

**Incluye:**

- Migración que crea `public.rooms` con las columnas `id`, `daycare_id`, `name` y `created_at` según el esquema de referencia `../07-DBschema/opendaycare-database-schema.md`.
- Foreign key de `rooms.daycare_id` a `public.daycares(id)` con `on delete restrict`.
- RLS habilitado en `public.rooms` con policies que permiten lectura a `authenticated` cuyo `role` sea `staff`, `parent` o `admin`.
- Seed de tres salas bajo `Guardería Sala Soles` (`daycare_id = 00000000-0000-4000-8000-000000000001`): **Soles**, **Luna** y **Estrellas**, con UUIDs fijos.
- Migración que crea `public.children` con las columnas `id`, `room_id`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags`, `photo_consent`, `status`, `created_at` y `updated_at`.
- Foreign key de `children.room_id` a `public.rooms(id)` con `on delete restrict`.
- Constraint `children_birth_date_not_future` con `check (birth_date <= current_date)`.
- Constraint `children_full_name_not_blank` con `check (btrim(full_name) <> '')`.
- Default `enrolled_at = current_date` al insertar un niño.
- Default `photo_consent = true`, `status = 'active'`.
- `allergy_tags` como `text[]` nullable, `medical_notes` como `text` nullable.
- Trigger `BEFORE UPDATE` que mantiene `updated_at = now()`.
- RLS habilitado en `public.children` con policies de lectura para `authenticated` con rol `staff`, `parent` o `admin`, y de escritura (`insert`, `update`) solo para `staff`.
- Seed separado en `supabase/seed.sql` con las tres salas (upsert por UUID).
- Aplicación de ambas migraciones y el seed al proyecto remoto mediante Supabase CLI.
- Verificación remota de esquema, constraints, RLS, policies, datos sembrados y advisors.
- Reemplazo del array `kids` mock en `app/lib/kids.ts` por una función server-only `getKids()` que consulta `children` + `rooms` + `parent_children` + `users`.
- Reemplazo de la lógica de alta en memoria de SPEC 05 por una Server Action `addKid()` que inserta en `public.children`.
- `AddKidModal.tsx` pasa de guardar en memoria a invocar la Server Action y recargar la página.
- `/kids` renderiza las salas colapsables con conteos reales de niños desde la base de datos.
- `/kids/[id]` consulta un niño real por UUID en lugar de buscar en el array mock.
- Eliminación del código de persistencia en memoria (`TempKid`, `createdAt`, inserción mock en `KidsPageContent`).
- Eliminación de los IDs numéricos mock (`"0001"`–`"0008"`) y los 8 niños hardcodeados.
- El perfil `/kids/[id]` usa UUIDs como parámetro de ruta.
- `enrolled_at` se usa automáticamente con la fecha actual al crear un niño; no se solicita en el formulario.
- Comportamiento de colapsar/expandir salas como toggle visual en cliente sin persistencia.
- Verificación manual del flujo completo, `npm run lint` y `npx tsc --noEmit`.

**No incluye:**

- Edición ni eliminación de niños existentes.
- Reasignación de un niño de una sala a otra.
- Tablas `parent_children`, `invitations`, `posts`, `post_children` ni ninguna otra del esquema de referencia.
- Policies RLS para tablas que no sean `rooms` y `children`.
- Integración del lado familia/padres con la base de datos.
- Subida de fotos de perfil ni avatares reales.
- Toasts, banners ni mensajes fuera del formulario de alta.
- Cambios al diseño visual de las tarjetas, el modal o el perfil más allá de lo necesario para consumir datos reales.
- Stack local de Supabase, Docker, `supabase start` ni pgTAP.
- Generación de tipos TypeScript desde Supabase (`supabase gen types`).

## Modelo de datos

### `public.rooms`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `not null`, default `gen_random_uuid()` |
| `daycare_id` | `uuid` | `not null`, FK a `public.daycares(id)` con `on delete restrict` |
| `name` | `text` | `not null`, constraint `rooms_name_not_blank` con `check (btrim(name) <> '')` |
| `created_at` | `timestamptz` | `not null`, default `now()` |

Índices:

- `rooms_daycare_id_idx` sobre `daycare_id` (FK no indexada automáticamente).

### Seed de salas

| `id` | `daycare_id` | `name` |
| --- | --- | --- |
| `11111111-1111-4000-8000-000000000001` | `00000000-0000-4000-8000-000000000001` | `Soles` |
| `11111111-1111-4000-8000-000000000002` | `00000000-0000-4000-8000-000000000001` | `Luna` |
| `11111111-1111-4000-8000-000000000003` | `00000000-0000-4000-8000-000000000001` | `Estrellas` |

Convenciones del seed:

- Upsert por `id` que actualiza solo `name`.
- Reejecutable sin duplicar filas ni modificar salas externas al seed.

### `public.children`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `not null`, default `gen_random_uuid()` |
| `room_id` | `uuid` | `not null`, FK a `public.rooms(id)` con `on delete restrict` |
| `full_name` | `text` | `not null`, constraint `children_full_name_not_blank` |
| `birth_date` | `date` | `not null`, constraint `children_birth_date_not_future` |
| `enrolled_at` | `date` | `not null`, default `current_date` |
| `medical_notes` | `text` | Nullable |
| `allergy_tags` | `text[]` | Nullable |
| `photo_consent` | `boolean` | `not null`, default `true` |
| `status` | `public.child_status` | `not null`, default `'active'` |
| `created_at` | `timestamptz` | `not null`, default `now()` |
| `updated_at` | `timestamptz` | `not null`, default `now()` |

Índices:

- `children_room_id_idx` sobre `room_id`.

Enums:

- Se crea `public.child_status` con valores `active` y `archived` (usado también por specs futuras).

### Funciones y triggers

| Objeto | Contrato |
| --- | --- |
| `private.set_children_updated_at()` | Función de trigger que asigna `new.updated_at = now()` |
| `set_children_updated_at` | Trigger `BEFORE UPDATE` sobre `public.children`, por cada fila |

### RLS policies

**`public.rooms`:**

| Policy | Operación | Condición |
| --- | --- | --- |
| `rooms_select_authenticated` | SELECT | `authenticated` con `app_metadata.role IN ('staff', 'parent', 'admin')` |

**`public.children`:**

| Policy | Operación | Condición |
| --- | --- | --- |
| `children_select_authenticated` | SELECT | `authenticated` con `app_metadata.role IN ('staff', 'parent', 'admin')` |
| `children_insert_staff` | INSERT | `authenticated` con `app_metadata.role = 'staff'` |
| `children_update_staff` | UPDATE | `authenticated` con `app_metadata.role = 'staff'` |

Las policies usan `auth.jwt()` para obtener los claims. El helper `auth.role()` se puede definir como una función SQL reutilizable si se prefiere.

### Contratos TypeScript (app)

```ts
// app/lib/kids.ts — reemplaza el mock actual

export interface KidRecord {
  id: string;           // UUID de Supabase
  fullName: string;
  birthDate: string;    // ISO yyyy-mm-dd
  roomName: string;     // "Soles" | "Luna" | "Estrellas"
  enrolledAt: string;   // ISO yyyy-mm-dd
  allergyTags: string[];
  medicalNotes: string | null;
  photoConsent: boolean;
  status: "active" | "archived";
}

export interface RoomRecord {
  id: string;           // UUID de Supabase
  name: string;
  kidCount: number;
}

export function getKids(): Promise<KidRecord[]>;
export function getRooms(): Promise<RoomRecord[]>;
export function getKidById(id: string): Promise<KidRecord | null>;
```

Para compatibilidad con la UI existente, se mantiene una función de transformación que mapea `KidRecord` a la interfaz `Kid` actual que consumen los componentes:

```ts
export function kidRecordToKid(record: KidRecord): Kid;
```

## Estructura de archivos

```text
supabase/
├── migrations/
│   ├── 20260818052747_create_daycares.sql
│   ├── 20260818063422_create_users.sql
│   ├── <timestamp>_create_child_status_enum_and_rooms.sql
│   └── <timestamp>_create_children.sql
└── seed.sql                                    # Modificar: agregar 3 salas

app/
└── lib/
    └── kids.ts                                 # Modificar: reemplazar mock por funciones server-only

app/
└── actions/
    └── kids.ts                                 # Nuevo: Server Action addKid()

app/(staff)/
├── kids/
│   ├── page.tsx                                # Modificar: consultar DB real
│   └── [id]/
│       └── page.tsx                            # Modificar: consultar DB por UUID

components/kids/
├── AddKidModal.tsx                             # Modificar: usar Server Action
├── KidsPageContent.tsx                         # Modificar: recibir datos reales, eliminar persistencia en memoria
├── KidsBrowser.tsx                             # Modificar: agrupar por sala real
├── KidCard.tsx                                 # Sin cambios funcionales
├── AllergyAlert.tsx                            # Sin cambios funcionales
├── ParentsPanel.tsx                            # Sin cambios funcionales (datos mock de padres se mantienen)
└── LinkParentModal.tsx                         # Sin cambios
```

Criterios:

- Las migraciones se generan con `supabase migration new` y no se inventan timestamps manualmente.
- `supabase/seed.sql` se amplía con las tres salas; no se modifican las cuatro guarderías existentes.
- `app/lib/kids.ts` se convierte en un módulo server-only para las consultas; los helpers de formato (`getAgeLabel`, `formatBirthDate`) permanecen.
- `app/actions/kids.ts` contiene la Server Action `addKid()`, valida campos requeridos e inserta en `public.children`.
- `app/(staff)/kids/page.tsx` consulta salas y niños desde el servidor y pasa los datos a `KidsPageContent`.
- `app/(staff)/kids/[id]/page.tsx` consulta un niño por UUID; `generateStaticParams` se elimina porque las rutas son dinámicas.
- `AddKidModal.tsx` invoca la Server Action, muestra errores de validación y recarga la página al tener éxito.
- `KidsPageContent.tsx` elimina toda la lógica de persistencia en memoria (`TempKid`, inserción mock, `createdAt`).
- Los componentes de presentación (`KidCard`, `AllergyAlert`, `ParentsPanel`) no cambian su contrato visual.
- `ParentsPanel.tsx` sigue mostrando datos mock de padres porque `parent_children` no existe aún.
- Los identificadores, tipos y funciones están en inglés; los textos visibles al usuario en español.

## Comportamiento de la página `/kids`

1. El servidor consulta `rooms` con conteo de niños activos por sala y los niños de cada sala.
2. `KidsPageContent` recibe los datos agrupados por sala.
3. Cada sala se renderiza como una sección colapsable con encabezado `SALA {NOMBRE} · {N} niños`.
4. El usuario puede colapsar/expandir cada sala con un toggle visual en cliente.
5. El botón `+ Agregar niño` abre el modal de alta.
6. El buscador filtra por nombre dentro de los niños cargados.

## Comportamiento del alta de niños

1. El usuario completa Nombre completo, Fecha de nacimiento y Sala (obligatorios).
2. Alergias y Notas médicas son opcionales.
3. `enrolled_at` se asigna automáticamente con la fecha actual.
4. La Server Action valida los campos requeridos y la fecha no futura.
5. Si la validación falla, el modal muestra errores debajo de los campos correspondientes.
6. Si la inserción tiene éxito, el modal se cierra y la página se recarga para mostrar el niño nuevo.

## Comportamiento del perfil `/kids/[id]`

1. El servidor consulta `children` por UUID.
2. Si el niño no existe, responde con 404.
3. El perfil renderiza avatar, nombre, edad calculada, alergias, datos del niño y padres.
4. Los padres se muestran con datos mock porque `parent_children` no existe aún.
5. El botón "Editar" permanece visual sin acción funcional.

## Plan de implementación

1. Ejecutar `supabase migration new create_child_status_enum_and_rooms` y crear `public.child_status`, `public.rooms`, FK a `daycares`, índice, constraint, RLS y policies de lectura para `authenticated`.
2. Ejecutar `supabase migration new create_children` y crear `public.children` con todas las columnas, constraints, FK a `rooms`, índice, trigger de `updated_at`, RLS y policies (lectura para `authenticated`, escritura solo para `staff`).
3. Ampliar `supabase/seed.sql` con las tres salas (Soles, Luna, Estrellas) bajo `Guardería Sala Soles` mediante upsert por UUID.
4. Revisar SQL completo, ejecutar `supabase db push --dry-run` y aplicar las migraciones y el seed al remoto.
5. Verificar esquema remoto: enums, columnas, constraints, FK, índices, triggers, RLS, policies, datos sembrados y advisors.
6. Crear `app/actions/kids.ts` con la Server Action `addKid()` que valida `fullName`, `birthDate` y `roomId`, rechaza fechas futuras e inserta en `public.children` con `enrolled_at = current_date`.
7. Reemplazar el contenido de `app/lib/kids.ts`: eliminar el array `kids` mock y los tipos `TempKid`; agregar `getKids()`, `getRooms()`, `getKidById()` y `kidRecordToKid()` como funciones server-only que consultan Supabase; conservar `getAgeLabel()`, `formatBirthDate()`, `roomOptions` y los helpers de formato.
8. Actualizar `app/(staff)/kids/page.tsx` para consultar salas y niños desde el servidor y pasarlos como props a `KidsPageContent`.
9. Actualizar `app/(staff)/kids/[id]/page.tsx` para consultar un niño por UUID, eliminar `generateStaticParams`, usar `dynamicParams = true` y responder 404 si no existe.
10. Actualizar `AddKidModal.tsx` para invocar la Server Action `addKid()` en lugar de guardar en memoria, mostrar errores de validación del servidor y recargar la página tras el alta exitosa.
11. Actualizar `KidsPageContent.tsx` para recibir datos reales como props, eliminar toda la lógica de persistencia en memoria y mantener el toggle visual de salas colapsables.
12. Actualizar `KidsBrowser.tsx` para agrupar por sala real con conteos de la base de datos y mantener el filtrado por buscador.
13. Ejecutar `npm run lint` y `npx tsc --noEmit`, corregir errores causados por esta entrega y confirmar que la aplicación compila sin errores.
14. Verificar manualmente el flujo completo: alta de niño desde `/kids`, aparición en la lista correcta, navegación al perfil por UUID, colapsar/expandir salas, buscador y responsive.

## Criterios de aceptación

- [x] SPEC 02, SPEC 05, SPEC 08, SPEC 09 y SPEC 10 existen como dependencias válidas.
- [x] Existen dos migraciones nuevas generadas por la CLI con sufijos `_create_child_status_enum_and_rooms` y `_create_children`.
- [x] `public.child_status` existe con valores `active` y `archived`.
- [x] `public.rooms` tiene exactamente las columnas `id`, `daycare_id`, `name` y `created_at`.
- [x] `rooms.daycare_id` referencia `public.daycares(id)` con `on delete restrict`.
- [x] Existe `rooms_daycare_id_idx` sobre `rooms(daycare_id)`.
- [x] `rooms.name` rechaza `null`, cadena vacía y texto solo de espacios.
- [x] RLS está habilitado en `public.rooms` con policy de SELECT para `authenticated`.
- [x] `public.children` tiene las once columnas acordadas con sus tipos, defaults y nullability.
- [x] `children.room_id` referencia `public.rooms(id)` con `on delete restrict`.
- [x] Existe `children_room_id_idx` sobre `children(room_id)`.
- [x] `children.full_name` rechaza `null`, cadena vacía y texto solo de espacios.
- [x] `children.birth_date` rechaza fechas futuras mediante constraint.
- [x] `children.enrolled_at` usa `current_date` por defecto.
- [x] `children.photo_consent` usa `true` por defecto.
- [x] `children.status` usa `public.child_status` con default `'active'`.
- [x] Actualizar un niño cambia automáticamente `updated_at`.
- [x] RLS está habilitado en `public.children` con policies de SELECT para `authenticated` y INSERT/UPDATE solo para `staff`.
- [x] `supabase/seed.sql` contiene las tres salas con UUIDs fijos bajo `Guardería Sala Soles`.
- [x] Ejecutar el seed dos veces deja exactamente una fila por sala.
- [x] Las migraciones y el seed están aplicados en el remoto.
- [x] Advisors no reportan findings nuevos de nivel `WARN` o `ERROR`.
- [x] `app/actions/kids.ts` existe con la Server Action `addKid()`.
- [x] `addKid()` rechaza `fullName` vacío, `birthDate` vacío o futuro, y `roomId` ausente.
- [x] `addKid()` inserta en `public.children` con `enrolled_at = current_date`.
- [x] `app/lib/kids.ts` no contiene el array `kids` mock ni los 8 niños hardcodeados.
- [x] `app/lib/kids.ts` exporta `getKids()`, `getRooms()`, `getKidById()` y `kidRecordToKid()`.
- [x] `app/lib/kids.ts` conserva `getAgeLabel()`, `formatBirthDate()` y `roomOptions`.
- [x] `/kids` muestra salas con conteos reales de niños desde la base de datos.
- [x] Las salas son colapsables con toggle visual en cliente.
- [x] El botón `+ Agregar niño` abre el modal y el alta exitosa inserta en la DB y recarga la página.
- [x] `/kids/[id]` consulta un niño real por UUID y responde 404 para UUIDs inexistentes.
- [x] El perfil muestra nombre, edad calculada, alergias, fecha de nacimiento, sala e ingreso.
- [x] Los padres en el perfil muestran datos mock (sin tabla `parent_children` aún).
- [x] `KidsPageContent.tsx` no contiene lógica de persistencia en memoria (`TempKid`, `createdAt`, inserción mock).
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores.
- [x] No hay referencias a `localStorage`, `sessionStorage` ni persistencia en memoria para niños.
- [x] Los identificadores están en inglés y el texto visible está en español.

## Decisiones tomadas y descartadas

- **Sí:** depender de SPEC 08 y SPEC 09 — `rooms.daycare_id` necesita `daycares` y las policies necesitan el modelo de roles de Auth.
- **Sí:** depender de SPEC 02 y SPEC 05 — las pantallas `/kids` y el modal de alta ya existen y se reconectan a datos reales.
- **Sí:** dos migraciones separadas (rooms + children) — cada tabla es una unidad de cambio independiente y facilita el rollback.
- **No:** una sola migración gigante — dificulta la revisión y el diagnóstico de errores.
- **Sí:** enum `child_status` en la migración de rooms — es un prerrequisito para `children.status` y es pequeño.
- **Sí:** seed de tres salas con UUIDs fijos — permite referencias estables desde datos demo futuros.
- **No:** crear salas dinámicamente desde la app — las salas son infraestructura administrativa, no datos de usuario.
- **Sí:** `enrolled_at = current_date` automático — simplifica el formulario y refleja la práctica real de inscripción inmediata.
- **No:** pedir `enrolled_at` en el formulario — agrega complejidad sin beneficio en esta etapa.
- **Sí:** RLS con policies basadas en `auth.jwt().app_metadata.role` — evita consultas a `public.users` para autorización.
- **No:** policies que unen con `public.users` — añade complejidad y dependencia circular entre tablas.
- **Sí:** INSERT/UPDATE solo para `staff` en `children` — los padres no deben crear ni modificar niños directamente.
- **No:** permitir escritura a `parent` en `children` — los padres solo leen el perfil de sus hijos.
- **Sí:** eliminar el array mock de 8 niños — la fuente de verdad pasa a ser la base de datos.
- **No:** coexistencia temporal de mock + DB — duplica la fuente de verdad y produce inconsistencias.
- **Sí:** `kidRecordToKid()` como adaptador — permite reutilizar los componentes de presentación existentes sin reescribirlos.
- **No:** reescribir todos los componentes de niños — el cambio debe ser incremental y focalizado en la capa de datos.
- **Sí:** `generateStaticParams` eliminado en `/kids/[id]` — los UUIDs son dinámicos y no se pueden pre-generar.
- **No:** mantener rutas estáticas numéricas (`/kids/0001`) — los UUIDs son la identidad real del niño.
- **Sí:** padres mock en el perfil — `parent_children` no existe aún y merece su propio spec.
- **No:** crear `parent_children` en esta entrega — amplía el alcance a vinculación de padres, que es otra funcionalidad.
- **Sí:** recarga de página tras alta exitosa — simplifica la sincronización del estado sin introducir revalidación compleja.
- **No:** optimización optimista con revalidación parcial — añade complejidad innecesaria en esta etapa.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las policies basadas en `auth.jwt()` pueden fallar si el token no se refresca correctamente | Depender del refresco de sesión ya implementado en SPEC 10 (Proxy + `updateSession()`). |
| Eliminar el mock de 8 niños deja la app vacía hasta que se creen niños reales | Documentar que el alta de niños desde `/kids` es el flujo para poblar la tabla; los datos mock se pierden intencionalmente. |
| UUIDs en la ruta `/kids/[id]` rompen bookmarks de los IDs numéricos anteriores | Los IDs numéricos eran mock; no existen bookmarks reales en producción. |
| `parent_children` no existe y el perfil muestra padres vacíos | Documentar como estado esperado; la vinculación de padres va en otro spec. |
| Una política RLS demasiado restrictiva puede bloquear la lectura de niños | Verificar las policies con la cuenta staff demo después de aplicar las migraciones. |
| El constraint `birth_date <= current_date` rechaza fechas ingresadas en timezone diferente | Usar `date` de Postgres que es independiente de timezone; la validación del formulario también debe rechazar fechas futuras en el cliente. |

## Lo que no está en este spec

- Edición ni eliminación de niños.
- Reasignación de niños entre salas.
- Tabla `parent_children` y vinculación de padres.
- Tablas `invitations`, `posts`, `post_children` ni ninguna otra del esquema.
- Integración del lado familia/padres con datos reales.
- Subida de fotos de perfil ni avatares reales.
- Toasts, banners ni mensajes fuera del formulario.
- Stack Supabase local, Docker ni pgTAP.
- Generación de tipos TypeScript desde Supabase.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
