# Spec 08 — Tabla daycares y seed inicial en Supabase

> **Estado:** Aprovado
> **Depende de:** —
> **Fecha:** 2026-08-17

> **Objetivo:** Crear y aplicar en Supabase la tabla raíz `public.daycares` mediante una migración versionada y poblarla con un seed idempotente de cuatro guarderías encabezado por `Guardería Sala Soles`.

## Alcance

**Incluye:**

- Inicialización del flujo local de Supabase CLI en el repositorio mediante `supabase/config.toml`.
- Uso de migraciones imperativas bajo `supabase/migrations/` como fuente versionada de cambios de esquema.
- Enlace de la CLI con el proyecto Supabase remoto ya conectado al workspace.
- Reconciliación de las migraciones remotas de prueba `20260818004104_create_connection_test_table` y `20260818004152_drop_connection_test_table`, marcándolas como revertidas antes de crear la primera migración real.
- Creación de `public.daycares` con las columnas `id`, `name` y `created_at` definidas por la referencia `../07-DBschema/opendaycare-database-schema.md`.
- Restricciones para exigir UUID y fecha de creación automáticos, nombre obligatorio y nombre no vacío después de eliminar espacios en los extremos.
- Activación explícita de Row Level Security en `public.daycares`.
- Tabla cerrada por defecto, sin policies y sin privilegios para `anon`, `authenticated` ni `service_role`.
- Seed separado en `supabase/seed.sql` con cuatro guarderías y UUIDs fijos.
- Aplicación de la migración y el seed al proyecto remoto mediante Supabase CLI.
- Seed reejecutable mediante upsert por UUID, sin duplicar filas ni eliminar guarderías ajenas al seed.
- Verificación remota de esquema, restricciones, defaults, RLS, policies, privilegios, datos sembrados, historial de migraciones y advisors.

**No incluye:**

- Creación de `users`, `rooms`, `children` ni ninguna otra tabla de la referencia.
- Integración de `daycares` con la aplicación Next.js, Supabase Auth o el cliente de Supabase.
- Policies RLS para usuarios, administradores o miembros de una guardería.
- Acceso de `anon`, `authenticated` o `service_role` mediante Data API.
- Columnas `slug`, `is_primary`, `updated_at` u otros atributos no definidos para esta tabla.
- Unicidad del nombre de la guardería.
- Cambios globales a los privilegios por defecto del esquema `public`.
- Corrección o eliminación de `public.rls_auto_enable()` y del event trigger `ensure_rls` preexistentes.
- Stack local de Supabase, Docker, `supabase start` o `supabase db reset`.
- Tests pgTAP, tipos TypeScript generados o cambios en archivos de la aplicación.

## Modelo de datos

### `public.daycares`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `not null`, default `gen_random_uuid()` |
| `name` | `text` | `not null`, constraint `daycares_name_not_blank` con `check (btrim(name) <> '')` |
| `created_at` | `timestamptz` | `not null`, default `now()` |

Convenciones:

- La tabla y sus columnas viven en el esquema `public` y usan identificadores `snake_case` en inglés.
- `name` conserva el texto recibido; la restricción solo rechaza valores vacíos o formados exclusivamente por espacios.
- Dos guarderías pueden compartir el mismo `name`.
- La migración habilita RLS aunque el event trigger remoto también intente hacerlo automáticamente.
- La tabla no define policies iniciales.
- La migración revoca todos los privilegios de tabla heredados por `anon`, `authenticated` y `service_role`.
- El propietario de la tabla y las conexiones administrativas directas conservan la capacidad necesaria para aplicar y verificar la migración.

### Seed de guarderías

| `id` | `name` | Uso |
| --- | --- | --- |
| `00000000-0000-4000-8000-000000000001` | `Guardería Sala Soles` | Registro canónico principal para los datos demo de OpenDayCare |
| `00000000-0000-4000-8000-000000000002` | `Guardería Luna Nueva` | Registro demo adicional |
| `00000000-0000-4000-8000-000000000003` | `Guardería Arcoíris` | Registro demo adicional |
| `00000000-0000-4000-8000-000000000004` | `Guardería Pequeños Exploradores` | Registro demo adicional |

Convenciones del seed:

- `supabase/seed.sql` contiene únicamente DML; el DDL permanece en la migración.
- Los cuatro UUIDs son fijos y forman parte del contrato de datos demo.
- `Guardería Sala Soles` usa siempre el UUID terminado en `0001`; no se agrega una columna especial para marcarla como principal.
- El insert omite `created_at` para usar el default de la tabla.
- El conflicto se resuelve por `id` y actualiza únicamente `name`.
- Una reejecución conserva el `created_at` original de cada fila canónica.
- El seed no usa `delete` ni `truncate` y no modifica filas con otros UUIDs.

## Estructura de archivos

```text
supabase/
├── config.toml
├── migrations/
│   └── <timestamp_generado_por_cli>_create_daycares.sql
└── seed.sql
```

Criterios:

- `supabase/config.toml` se genera con `supabase init` y mantiene habilitado el seed estándar `./seed.sql`.
- El nombre y timestamp de la migración los genera Supabase CLI mediante `supabase migration new create_daycares`; no se inventa manualmente el timestamp.
- No se agregan placeholders locales para las dos migraciones remotas de conexión que no tienen archivos fuente.
- Los artefactos temporales de enlace de la CLI no se versionan.
- No se agregan dependencias de Supabase CLI a `package.json`; los comandos se ejecutan con `npx`.

## Plan de implementación

1. Consultar la ayuda y versión vigentes de Supabase CLI con `npx`, ejecutar `supabase init` desde la raíz y revisar el `supabase/config.toml` generado sin habilitar un stack Docker local.
2. Autenticar y enlazar la CLI con el proyecto remoto, ejecutar `supabase migration list` y confirmar que las únicas versiones remotas sin archivo local son `20260818004104` y `20260818004152`.
3. Consultar `supabase migration repair --help`, marcar ambas migraciones de prueba como `reverted` en el proyecto enlazado y comprobar con `supabase migration list` que dejaron de figurar como aplicadas, sin crear placeholders ni modificar el esquema.
4. Ejecutar `supabase migration new create_daycares` para generar el archivo versionado dentro de `supabase/migrations/`.
5. Definir en la migración `public.daycares`, sus defaults, primary key y constraint `daycares_name_not_blank`; habilitar RLS explícitamente y revocar todos los privilegios de `anon`, `authenticated` y `service_role` sobre la tabla.
6. Crear `supabase/seed.sql` con las cuatro filas canónicas y un upsert por `id` que actualice solo `name`, use el default de `created_at` y no altere otras filas.
7. Revisar el SQL completo, ejecutar `supabase migration list` y previsualizar las migraciones pendientes con `supabase db push --dry-run`, sin aplicar cambios si aparece una versión inesperada.
8. Aplicar la migración y el seed al proyecto enlazado con el flujo `supabase db push --include-seed` soportado por la versión instalada de la CLI.
9. Consultar el catálogo remoto para verificar columnas, tipos, defaults, constraints, RLS, ausencia de policies y ausencia de privilegios para los tres roles de Data API.
10. Probar mediante transacciones revertidas que una inserción válida genera `id` y `created_at`, que nombres nulos, vacíos o formados por espacios fallan, y que nombres duplicados son válidos.
11. Ejecutar nuevamente el seed contra el proyecto enlazado y verificar que los cuatro UUIDs aparecen una sola vez, que sus nombres son los canónicos y que sus valores originales de `created_at` no cambian.
12. Ejecutar los advisors de seguridad y rendimiento, confirmar que la tabla no introduce findings nuevos y registrar como preexistentes los dos warnings de `public.rls_auto_enable()` que quedan fuera de este alcance.

## Criterios de aceptación

- [ ] Existe `supabase/config.toml`, generado por Supabase CLI y preparado para usar `supabase/seed.sql`.
- [ ] Existe una única migración local generada por la CLI con sufijo `_create_daycares.sql`.
- [ ] No existen archivos placeholder para `20260818004104_create_connection_test_table` ni `20260818004152_drop_connection_test_table`.
- [ ] Las versiones remotas `20260818004104` y `20260818004152` están marcadas como revertidas antes del primer push real.
- [ ] `supabase migration list` no muestra divergencias inesperadas después de aplicar la nueva migración.
- [ ] El proyecto remoto contiene `public.daycares` con exactamente las columnas `id`, `name` y `created_at`.
- [ ] `id` es `uuid`, primary key, `not null` y usa `gen_random_uuid()` por defecto.
- [ ] `name` es `text`, `not null` y tiene el constraint `daycares_name_not_blank`.
- [ ] `created_at` es `timestamptz`, `not null` y usa `now()` por defecto.
- [ ] Insertar una fila proporcionando solo un nombre válido genera automáticamente `id` y `created_at`.
- [ ] Insertar `name = null`, una cadena vacía o una cadena formada solo por espacios es rechazado por la base de datos.
- [ ] Insertar dos filas con el mismo nombre es válido porque `name` no tiene una restricción unique.
- [ ] RLS está habilitado en `public.daycares` aunque no existan policies.
- [ ] `anon` no tiene privilegios `select`, `insert`, `update`, `delete` ni otros privilegios sobre `public.daycares`.
- [ ] `authenticated` no tiene privilegios `select`, `insert`, `update`, `delete` ni otros privilegios sobre `public.daycares`.
- [ ] `service_role` no tiene privilegios `select`, `insert`, `update`, `delete` ni otros privilegios sobre `public.daycares`.
- [ ] `supabase/seed.sql` contiene los cuatro UUIDs y nombres acordados.
- [ ] `Guardería Sala Soles` existe con `id = 00000000-0000-4000-8000-000000000001`.
- [ ] Ejecutar el seed dos veces deja exactamente una fila para cada uno de los cuatro UUIDs canónicos.
- [ ] Una segunda ejecución restaura los nombres canónicos sin cambiar el `created_at` original.
- [ ] El seed no elimina ni modifica guarderías con UUIDs diferentes a los cuatro definidos.
- [ ] La migración y el seed están aplicados en el proyecto remoto mediante el historial y flujo de Supabase CLI.
- [ ] El advisor de rendimiento no reporta findings nuevos causados por `public.daycares`.
- [ ] El advisor de seguridad no reporta findings nuevos causados por `public.daycares`.
- [ ] Los dos warnings preexistentes sobre `public.rls_auto_enable()` permanecen documentados y no se corrigen dentro de este spec.
- [ ] No se agregan tablas adicionales, policies, tipos TypeScript, dependencias npm ni cambios en la aplicación Next.js.

## Decisiones tomadas y descartadas

- **Sí:** migraciones imperativas administradas por Supabase CLI — dejan el cambio de esquema versionado y alineado con el historial remoto.
- **No:** esquema declarativo bajo `supabase/schemas/` — el repositorio comienza con una tabla acotada y no existe una convención declarativa previa.
- **Sí:** generar el timestamp mediante `supabase migration new` — evita inventar manualmente identificadores de migración.
- **No:** crear el archivo con un timestamp escrito a mano — puede desalinear la convención de la CLI y el historial remoto.
- **Sí:** marcar como revertidas las dos migraciones de prueba — ambas se anulan entre sí, no dejan tablas en `public` y sus archivos originales no existen en el repositorio.
- **No:** crear placeholders vacíos para las migraciones de prueba — aparentaría una historia local que no reproduce las operaciones originales.
- **No:** borrar tablas o reconstruir el remoto para limpiar el historial — el ajuste requerido afecta solo metadatos de migración ya revertidos en la práctica.
- **Sí:** `uuid` con `gen_random_uuid()` para la primary key — respeta la convención explícita del esquema de referencia.
- **No:** cambiar a `bigint identity` o UUIDv7 — sería una revisión transversal del modelo de referencia fuera de este spec.
- **Sí:** nombre obligatorio y no vacío — impide crear entidades raíz sin una etiqueta utilizable.
- **Sí:** nombres repetidos permitidos — el nombre visible no se adopta como identidad global ni se acordó una regla de unicidad.
- **No:** `unique(name)` o unicidad case-insensitive — dos organizaciones pueden compartir nombre y esa política requiere una decisión de negocio posterior.
- **Sí:** RLS explícito y tabla sin policies — mantiene la tabla cerrada hasta que existan usuarios y una estrategia real de aislamiento por guardería.
- **Sí:** revocar privilegios a `anon`, `authenticated` y `service_role` — evita depender de los grants automáticos actuales del proyecto y de cambios futuros de Data API.
- **No:** exponer lectura autenticada o CRUD mediante `service_role` — todavía no existe un consumidor ni un modelo de autorización acordado.
- **No:** modificar los privilegios por defecto de todo `public` — afectaría futuras tablas y excede la creación aislada de `daycares`.
- **Sí:** seed separado de la migración — conserva DDL en el historial y datos demo en el mecanismo estándar de Supabase.
- **No:** insertar las guarderías dentro de la migración — mezclaría datos reejecutables con un cambio de esquema de ejecución única.
- **Sí:** aplicar el seed al remoto con `db push --include-seed` — el proyecto remoto necesita las cuatro guarderías desde esta entrega.
- **Sí:** UUIDs fijos y legibles — permiten que datos demo posteriores referencien de forma estable a `Guardería Sala Soles` y a las otras guarderías.
- **No:** agregar `slug` o `is_primary` — la importancia de Sala Soles pertenece al conjunto demo y no al modelo multi-tenant.
- **Sí:** upsert por UUID que actualiza solo `name` — hace el seed reejecutable y conserva la fecha de creación.
- **No:** actualizar `created_at` al resembrar — contradice la semántica de fecha de creación.
- **No:** borrar filas externas al seed — sería destructivo para guarderías reales o datos agregados posteriormente.
- **Sí:** validación remota sin stack local — es la decisión adoptada para este flujo aunque Docker no esté disponible.
- **No:** Docker, `supabase start`, `supabase db reset` o pgTAP — amplían la infraestructura local fuera del alcance acordado.
- **No:** corregir `public.rls_auto_enable()` — es infraestructura preexistente con warnings propios y merece una corrección separada.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La migración se aplica al remoto sin ejecutarse antes en una base local | Mantener el cambio pequeño, revisar el SQL, exigir `db push --dry-run` y ejecutar verificaciones remotas inmediatamente después del push. |
| Reparar el historial remoto con versiones incorrectas podría ocultar una migración real | Confirmar nombres, versiones y ausencia de tablas antes de marcar exclusivamente `20260818004104` y `20260818004152` como revertidas. |
| Los privilegios automáticos actuales podrían exponer brevemente una tabla nueva | Crear tabla, habilitar RLS y revocar privilegios dentro de la misma migración transaccional. |
| El seed remoto puede sobrescribir cambios manuales de nombre en los cuatro UUIDs canónicos | Limitar el upsert a registros demo conocidos y documentar que sus nombres son canónicos. |
| UUIDs legibles pueden confundirse con identificadores generados para datos reales | Reservarlos explícitamente para seeds y no reutilizar su patrón al crear entidades reales. |
| `public.rls_auto_enable()` mantiene dos warnings de seguridad independientes | No invocar la función directamente, habilitar RLS explícitamente y abordar sus permisos en otro spec. |

## Lo que no está en este spec

- Tablas de usuarios, salas, niños, publicaciones o relaciones.
- Integración con Supabase Auth o con la aplicación Next.js.
- Policies RLS y acceso mediante Data API.
- Un identificador `slug` o una marca global de guardería principal.
- Unicidad de nombres de guarderías.
- Modificación global de default privileges.
- Corrección del event trigger y la función automática de RLS existentes.
- Stack Supabase local, Docker, pgTAP o generación de tipos TypeScript.
- Eliminación o reemplazo de guarderías ajenas al seed.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
