# Spec 09 — Tabla users y usuario staff demo en Supabase

> **Estado:** Hecho
> **Depende de:** SPEC 08
> **Fecha:** 2026-08-17

> **Objetivo:** Crear y aplicar en Supabase los enums y la tabla `public.users` vinculada con Auth y `public.daycares`, y validar el flujo con una cuenta staff confirmada de `misiel@gmail.com` asociada a `Guardería Sala Soles`.

## Alcance

**Incluye:**

- Creación de los enums `public.user_role` y `public.user_status` con los valores definidos en `../07-DBschema/opendaycare-database-schema.md`.
- Creación de `public.users` como tabla de perfiles de dominio vinculada uno a uno con `auth.users` mediante el mismo UUID.
- Relación obligatoria muchos-a-uno entre `public.users` y `public.daycares`; cada usuario pertenece a una guardería y una guardería puede tener varios usuarios.
- Restricciones, defaults e índice de foreign key necesarios para mantener datos válidos y consultas por guardería eficientes.
- Eliminación automática del perfil cuando se elimina su cuenta en `auth.users` y bloqueo de la eliminación de una guardería que todavía tenga usuarios.
- Actualización automática de `updated_at` en cada modificación de un perfil.
- Esquema no expuesto `private` para las funciones de trigger.
- Constraint trigger `AFTER INSERT`, `DEFERRABLE INITIALLY DEFERRED`, sobre `auth.users` que crea el perfil desde `raw_app_meta_data` al finalizar la operación administrativa.
- Rechazo atómico del alta Auth cuando `daycare_id`, `role` o `full_name` falten o sean inválidos.
- RLS habilitado en `public.users`, sin policies y con privilegios revocados para `anon`, `authenticated` y `service_role`.
- Creación administrativa de una cuenta Auth confirmada para `misiel@gmail.com`, con rol `staff`, nombre `Misiel Moreno` y la guardería canónica `Guardería Sala Soles`.
- Uso de la contraseña demo acordada exclusivamente mediante `DEMO_STAFF_PASSWORD` durante el comando temporal de alta; su valor no se escribe en archivos ni comandos versionados.
- Aplicación de la migración y creación de la cuenta demo en el proyecto Supabase remoto ya enlazado.
- Verificación remota del esquema, restricciones, triggers, aislamiento, cuenta demo, inicio de sesión e informes de advisors.

**No incluye:**

- Enums no utilizados por `public.users`: `relationship_type`, `invitation_status`, `post_type` y `child_status`.
- Tablas `rooms`, `children`, `parent_children`, `invitations`, `posts` ni ninguna otra tabla futura.
- Policies RLS para consultar o modificar perfiles mediante Data API.
- Integración de Supabase Auth o `public.users` con la aplicación Next.js.
- Cambios en las pantallas mock de login y activación de SPEC 04.
- Signup público, recuperación de contraseña, invitaciones, activación de cuentas o administración de usuarios desde la aplicación.
- Sincronización del perfil cuando `raw_app_meta_data` cambia después de crear la cuenta.
- Almacenamiento de email, contraseña o hashes de contraseña en `public.users`.
- Seed SQL de cuentas Auth, script versionado para crear usuarios o dependencias npm de Supabase.
- Stack local de Supabase, Docker, `supabase start`, `supabase db reset`, pgTAP o generación de tipos TypeScript.
- Corrección de `public.rls_auto_enable()` o del event trigger `ensure_rls` preexistentes.

## Modelo de datos

### `public.user_role`

| Valor | Uso |
| --- | --- |
| `staff` | Personal de una guardería |
| `parent` | Padre, madre o tutor |
| `admin` | Administrador de una guardería |

### `public.user_status`

| Valor | Uso |
| --- | --- |
| `pending` | Perfil pendiente de activación en flujos futuros |
| `active` | Perfil activo; valor por defecto al crear una cuenta |

Los nombres de tipos y valores se almacenan en inglés. Las etiquetas visibles en español pertenecen a la UI y quedan fuera de esta spec.

### `public.users`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `not null`, FK a `auth.users(id)` con `on delete cascade`, sin default propio |
| `daycare_id` | `uuid` | `not null`, FK a `public.daycares(id)` con `on delete restrict` |
| `role` | `public.user_role` | `not null` |
| `status` | `public.user_status` | `not null`, default `active` |
| `full_name` | `text` | `not null`, constraint `users_full_name_not_blank` con `check (btrim(full_name) <> '')` |
| `avatar_url` | `text` | Nullable, sin default |
| `notify_on_post` | `boolean` | `not null`, default `true` |
| `daily_summary_enabled` | `boolean` | `not null`, default `true` |
| `created_at` | `timestamptz` | `not null`, default `now()` |
| `updated_at` | `timestamptz` | `not null`, default `now()` y mantenimiento automático antes de cada update |

Índices y relaciones:

- La primary key de `id` garantiza como máximo un perfil por cuenta Auth.
- `users_daycare_id_idx` indexa `daycare_id` porque PostgreSQL no crea automáticamente índices para foreign keys.
- `daycare_id` no es unique; varios perfiles pueden pertenecer a la misma guardería.
- No se duplica `email`, `encrypted_password` ni ningún dato de autenticación administrado por Supabase Auth.

### Funciones y triggers

| Objeto | Contrato |
| --- | --- |
| `private.handle_new_auth_user()` | Función `SECURITY DEFINER`, `SET search_path = ''`, que lee la versión actual de `raw_app_meta_data`, la valida e inserta un perfil en `public.users` |
| `on_auth_user_created` | Constraint trigger `AFTER INSERT`, `DEFERRABLE INITIALLY DEFERRED`, sobre `auth.users`, por cada fila, que ejecuta `private.handle_new_auth_user()` al cierre de la transacción |
| `private.set_users_updated_at()` | Función de trigger que asigna `new.updated_at = now()` |
| `set_users_updated_at` | Trigger `BEFORE UPDATE` sobre `public.users`, por cada fila |

Contrato de `raw_app_meta_data` al crear una cuenta:

```json
{
  "daycare_id": "00000000-0000-4000-8000-000000000001",
  "role": "staff",
  "full_name": "Misiel Moreno"
}
```

Reglas del trigger Auth:

- `daycare_id` debe ser un UUID válido que exista en `public.daycares`.
- `role` debe ser un valor válido de `public.user_role`.
- `full_name` debe existir y contener al menos un carácter distinto de espacio.
- La validación se difiere hasta el cierre de la transacción porque Supabase Auth inserta primero la cuenta y actualiza después el `app_metadata` personalizado dentro de la misma transacción.
- `status`, `notify_on_post`, `daily_summary_enabled`, `created_at` y `updated_at` usan los defaults de `public.users`.
- Un error de validación o inserción cancela también el insert en `auth.users`; no se conserva una cuenta Auth sin perfil.
- La función no lee `raw_user_meta_data` para asignar tenant o rol.
- Las funciones viven en `private`, usan nombres de objetos totalmente calificados y no conceden ejecución directa a roles de Data API.

### Usuario staff demo

| Atributo | Valor |
| --- | --- |
| Email Auth | `misiel@gmail.com` |
| Email confirmado | Sí |
| Contraseña | Valor recibido en tiempo de ejecución mediante `DEMO_STAFF_PASSWORD`; no se versiona |
| `app_metadata.daycare_id` | `00000000-0000-4000-8000-000000000001` |
| `app_metadata.role` | `staff` |
| `app_metadata.full_name` | `Misiel Moreno` |
| Perfil `status` | `active` por default |
| Perfil `avatar_url` | `null` |
| Preferencias | `notify_on_post = true`, `daily_summary_enabled = true` |

El UUID lo genera Supabase Auth. `public.users.id` debe coincidir exactamente con ese UUID.

## Estructura de archivos

```text
supabase/
├── migrations/
│   ├── 20260818052747_create_daycares.sql
│   └── <timestamp_generado_por_cli>_create_users.sql
└── seed.sql
```

Criterios:

- La única modificación versionada de esta spec es una migración nueva generada con `supabase migration new create_users`.
- `supabase/seed.sql` permanece sin cambios; Supabase Auth no se puebla mediante inserts SQL directos.
- El comando temporal contra Auth Admin API no se guarda como script ni agrega dependencias al proyecto.
- Las credenciales administrativas y `DEMO_STAFF_PASSWORD` se reciben por variables de entorno y no se imprimen ni se escriben en el repositorio.

## Plan de implementación

1. Confirmar con el proyecto remoto enlazado que la migración `20260818052747_create_daycares` está aplicada, que `public.daycares` conserva las cuatro filas de SPEC 08, que `Guardería Sala Soles` usa el UUID terminado en `0001` y que no existe todavía `public.users` ni la cuenta Auth demo.
2. Consultar la versión y ayuda vigentes de Supabase CLI, ejecutar `supabase migration new create_users` y comprobar que la CLI creó una única migración pendiente con el timestamp correspondiente.
3. Definir en la migración `public.user_role`, `public.user_status`, `public.users`, sus constraints, foreign keys, defaults y el índice `users_daycare_id_idx`.
4. Crear el esquema `private` con acceso revocado para `PUBLIC`, `anon`, `authenticated` y `service_role`, y definir `private.set_users_updated_at()` junto con el trigger `set_users_updated_at`.
5. Definir `private.handle_new_auth_user()` como `SECURITY DEFINER SET search_path = ''`, leer la fila Auth actual, validar los tres valores de `raw_app_meta_data`, usar objetos totalmente calificados y crear `on_auth_user_created` como constraint trigger diferido sobre `auth.users`.
6. Habilitar RLS explícitamente en `public.users`, no crear policies y revocar privilegios sobre la tabla, los enums, el esquema privado y sus funciones para los roles no administrativos acordados.
7. Revisar la migración completa, ejecutar `supabase migration list` y `supabase db push --dry-run`, y detener la aplicación si aparece una migración inesperada o una divergencia con SPEC 08.
8. Aplicar la migración al proyecto remoto con Supabase CLI y confirmar que el historial local y remoto queda alineado.
9. Verificar mediante consultas de catálogo los enums, columnas, tipos, defaults, nullability, constraints, foreign keys, acciones de borrado, índice, funciones, triggers, `search_path`, propiedad, RLS, ausencia de policies y privilegios revocados.
10. Probar en transacciones revertidas que `public.users` acepta perfiles válidos, rechaza nombres nulos o vacíos, rechaza tenants inexistentes, permite varios usuarios en una misma guardería, actualiza `updated_at`, elimina el perfil al borrar su cuenta Auth y bloquea borrar una guardería con usuarios.
11. Ejecutar un comando temporal de Auth Admin API con URL, clave secreta y contraseña recibidas por variables de entorno para crear `misiel@gmail.com`, marcar su email como confirmado y enviar el `app_metadata` acordado, sin registrar el valor de la contraseña.
12. Verificar que Auth creó exactamente una cuenta demo, que el trigger creó exactamente un perfil con el mismo UUID y valores esperados, y que no fue necesario insertar manualmente en `public.users`.
13. Probar el endpoint de inicio de sesión con el email demo y `DEMO_STAFF_PASSWORD` desde variables de entorno; confirmar una respuesta autenticada sin imprimir access tokens, refresh tokens ni la contraseña.
14. Probar un alta administrativa inválida sin `daycare_id` y confirmar que falla sin dejar una fila en `auth.users` ni en `public.users`.
15. Comprobar con los roles `anon`, `authenticated` y `service_role` que `public.users` no es accesible mediante Data API, y confirmar que el flujo privilegiado del trigger continúa funcionando.
16. Ejecutar los advisors de seguridad y rendimiento, corregir findings nuevos de nivel `WARN` o `ERROR` causados por esta migración, documentar como esperado el `INFO` por RLS sin policies y mantener fuera de alcance los warnings preexistentes de `public.rls_auto_enable()`.

## Criterios de aceptación

- [x] SPEC 08 existe y la migración `20260818052747_create_daycares` está aplicada antes de esta migración.
- [x] Existe una única migración nueva generada por la CLI con sufijo `_create_users.sql`.
- [x] `supabase migration list` no muestra divergencias inesperadas después del push.
- [x] Existe `public.user_role` con exactamente `staff`, `parent` y `admin` en ese orden.
- [x] Existe `public.user_status` con exactamente `pending` y `active` en ese orden.
- [x] No se crean los otros enums de la referencia ni tablas adicionales.
- [x] `public.users` contiene exactamente las diez columnas acordadas, con sus tipos, nullability y defaults definidos.
- [x] `public.users.id` es primary key y foreign key a `auth.users(id)` con `on delete cascade`.
- [x] `public.users.id` no genera un UUID independiente y coincide con el UUID de la cuenta Auth.
- [x] `public.users.daycare_id` es obligatorio y referencia `public.daycares(id)` con `on delete restrict`.
- [x] Dos usuarios diferentes pueden compartir el mismo `daycare_id`.
- [x] Existe el índice `users_daycare_id_idx` sobre `public.users(daycare_id)`.
- [x] `role` y `status` usan los enums correspondientes, y `status` usa `active` por default.
- [x] `full_name` rechaza `null`, cadena vacía y texto formado únicamente por espacios.
- [x] `avatar_url` acepta `null`.
- [x] `notify_on_post` y `daily_summary_enabled` son obligatorios y usan `true` por default.
- [x] `created_at` y `updated_at` son obligatorios y usan `now()` por default.
- [x] Actualizar un perfil cambia automáticamente `updated_at` mediante `set_users_updated_at`.
- [x] Eliminar una cuenta de prueba en `auth.users` elimina su perfil asociado.
- [x] Eliminar una guardería con usuarios asociados es rechazado y no elimina cuentas Auth ni perfiles.
- [x] Existe el esquema `private` y no está expuesto a `PUBLIC`, `anon`, `authenticated` ni `service_role`.
- [x] `private.handle_new_auth_user()` es `SECURITY DEFINER`, tiene `search_path` vacío, usa nombres totalmente calificados y no puede ejecutarse directamente por roles de Data API.
- [x] `on_auth_user_created` es `AFTER INSERT`, `DEFERRABLE INITIALLY DEFERRED`, se ejecuta al cierre de la transacción Auth y crea un único perfil con el metadata actualizado.
- [x] El trigger lee `daycare_id`, `role` y `full_name` desde `raw_app_meta_data`, no desde `raw_user_meta_data`.
- [x] Un alta Auth sin `daycare_id`, con UUID inválido, con guardería inexistente, con rol inválido o con nombre vacío falla de forma atómica y no deja filas huérfanas.
- [x] RLS está habilitado en `public.users` y no existen policies.
- [x] `anon`, `authenticated` y `service_role` no tienen privilegios sobre `public.users` ni uso de los enums nuevos.
- [x] `misiel@gmail.com` existe exactamente una vez en Supabase Auth, tiene el email confirmado y conserva los tres valores de `app_metadata` acordados.
- [x] El perfil de `misiel@gmail.com` comparte el UUID Auth, pertenece a `Guardería Sala Soles`, tiene rol `staff`, estado `active`, nombre `Misiel Moreno`, avatar nulo y ambas preferencias activadas.
- [x] Es posible iniciar sesión con `misiel@gmail.com` y el valor de `DEMO_STAFF_PASSWORD` sin exponer credenciales ni tokens en logs o archivos.
- [x] La contraseña demo, la clave secreta de Supabase y los tokens de sesión no aparecen en la spec, la migración, `supabase/seed.sql`, scripts, archivos de entorno versionados ni salida capturada.
- [x] `supabase/seed.sql`, `package.json`, el lockfile y los archivos de la aplicación Next.js permanecen sin cambios por esta spec.
- [x] El advisor de rendimiento no reporta findings nuevos causados por `public.users`.
- [x] El advisor de seguridad no reporta findings nuevos de nivel `WARN` o `ERROR` causados por esta migración.
- [x] El finding `INFO` por RLS habilitado sin policies queda documentado como intencional.
- [x] Los warnings preexistentes de `public.rls_auto_enable()` no se atribuyen a esta spec ni se modifican.

### Evidencia de verificación (2026-08-18)

- `npx supabase migration list` mostró `20260818052747` y `20260818063422` alineadas local/remoto; `npx supabase db push --dry-run` informó que el remoto está actualizado.
- Consultas de catálogo verificaron enums, diez columnas, constraints, foreign keys, índice, funciones, triggers, RLS sin policies y ausencia de privilegios para los roles de Data API.
- Pruebas remotas dentro de transacciones revertidas verificaron defaults, nombres inválidos, tenant inexistente, varios perfiles por guardería, `updated_at`, cascada Auth, restricción de guardería, trigger diferido y cinco variantes de metadata Auth inválida; no quedaron filas de prueba.
- Auth contiene una sola cuenta confirmada para `misiel@gmail.com`; su `raw_app_meta_data` y perfil asociado coinciden con el contrato, incluido el UUID compartido.
- El endpoint de contraseña de Supabase Auth respondió HTTP 200, devolvió una sesión autenticada para el email esperado y la sesión de prueba se cerró localmente con HTTP 204; solo se registraron estados booleanos, sin credenciales, claves ni tokens.
- Advisors: rendimiento sin findings; seguridad solo informa el `INFO` intencional `rls_enabled_no_policy` para `public.users`. Los dos `WARN` de ejecución de `public.rls_auto_enable()` son preexistentes de SPEC 08; el `WARN` de protección de contraseñas filtradas es configuración Auth ajena a esta migración.

## Decisiones tomadas y descartadas

- **Sí:** depender de SPEC 08 — `public.users.daycare_id` requiere que `public.daycares` y su seed canónico ya existan.
- **Sí:** crear solo `user_role` y `user_status` — son los únicos enums consumidos por esta tabla.
- **No:** adelantar enums para relaciones, invitaciones, publicaciones o niños — deben crearse junto con sus tablas en specs futuras.
- **Sí:** `public.users` comparte primary key con `auth.users` — mantiene una relación uno a uno y evita identidades duplicadas.
- **No:** UUID independiente para el perfil — obligaría a mantener una segunda identidad sin aportar valor al dominio.
- **Sí:** un `daycare_id` obligatorio por usuario — representa la relación uno-a-muchos acordada y evita perfiles sin tenant.
- **No:** tabla intermedia usuario-guardería — permitiría múltiples guarderías por usuario, caso no requerido.
- **Sí:** `on delete cascade` desde Auth al perfil — una cuenta eliminada no debe dejar datos de perfil huérfanos.
- **Sí:** `on delete restrict` desde daycare a perfiles — evita borrar el tenant mientras existan cuentas asociadas.
- **No:** cascade desde daycare — eliminaría perfiles sin eliminar correctamente las cuentas administradas por Auth.
- **Sí:** constraints estrictos y defaults en la base — preservan invariantes sin depender de consumidores futuros.
- **Sí:** índice explícito para `daycare_id` — PostgreSQL no indexa automáticamente las foreign keys.
- **Sí:** trigger de `updated_at` — la fecha se mantiene aunque la modificación no provenga de la aplicación.
- **No:** delegar `updated_at` al cliente — permitiría timestamps omitidos o inconsistentes.
- **Sí:** constraint trigger Auth diferido con `raw_app_meta_data` — tenant y rol deben provenir de un contexto administrativo controlado, y Supabase Auth aplica el metadata personalizado después del insert inicial dentro de la misma transacción.
- **No:** usar `raw_user_meta_data` para tenant o rol — el usuario puede modificar esos metadatos y escalar privilegios.
- **Sí:** fallar de forma atómica ante metadata inválida — evita cuentas Auth utilizables sin perfil o sin guardería válida.
- **No:** crear cuentas incompletas para repararlas después — introduce estados inconsistentes y rutas de autorización ambiguas.
- **Sí:** función privilegiada en el esquema `private`, con `search_path` vacío y ejecución revocada — reduce el riesgo propio de `SECURITY DEFINER`.
- **No:** función privilegiada expuesta en `public` — aumenta innecesariamente la superficie visible mediante Data API.
- **Sí:** RLS sin policies y privilegios revocados — conserva la tabla cerrada hasta definir el modelo de autorización por rol y guardería.
- **No:** lectura del perfil propio o de compañeros de guardería — requiere una spec específica de policies y flujos de aplicación.
- **Sí:** cuenta Auth real, confirmada y enlazada a `Guardería Sala Soles` — prueba la integración del trigger y deja un staff listo para el futuro login real.
- **Sí:** creación mediante un comando temporal de Auth Admin API — usa el mecanismo soportado por Auth sin insertar directamente en tablas administradas por Supabase.
- **No:** insertar usuarios Auth desde `supabase/seed.sql` o SQL directo — puede violar invariantes internas de Auth y almacenar credenciales de forma insegura.
- **No:** script versionado o dependencia `@supabase/supabase-js` solo para el alta demo — agrega superficie permanente para una operación administrativa puntual.
- **Sí:** recibir la contraseña acordada mediante `DEMO_STAFF_PASSWORD` — permite probar la credencial fija sin escribirla en Git.
- **No:** documentar el valor de la contraseña — una cuenta remota confirmada no debe tener credenciales versionadas aunque sea demo.
- **Sí:** aplicación y verificación remotas sin Docker — mantiene el flujo establecido por SPEC 08.
- **No:** integración Next.js, signup público o policies en esta entrega — cada área introduce decisiones adicionales y debe abordarse por separado.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un error en el trigger sobre `auth.users` puede bloquear todas las altas | Validar casos correctos e incorrectos inmediatamente después de aplicar la migración y mantener mensajes de error explícitos. |
| Un usuario podría intentar asignarse rol o guardería mediante metadata editable | Leer exclusivamente `raw_app_meta_data` y crear la cuenta demo mediante Auth Admin API. |
| Una función `SECURITY DEFINER` mal configurada puede elevar privilegios | Ubicarla en `private`, fijar `search_path = ''`, calificar todos los objetos y revocar ejecución directa. |
| La cuenta demo confirmada tiene acceso real a Supabase Auth | Mantener `public.users` cerrada por RLS, no exponer la contraseña y reemplazar o eliminar la cuenta cuando deje de ser necesaria. |
| El comando temporal puede filtrar secretos o tokens en la salida de herramientas | Referenciar variables de entorno, evitar modo verbose y no imprimir cuerpos con credenciales o tokens. |
| Agregar valores a enums Postgres en el futuro requiere una migración explícita | Mantener los enums acotados al contrato actual y versionar cualquier ampliación posterior. |
| Aplicar directamente al remoto reduce la capacidad de rollback ensayado | Revisar SQL, exigir `db push --dry-run`, mantener la migración pequeña y verificar catálogo y Auth inmediatamente después. |
| `public.rls_auto_enable()` puede producir warnings ajenos a la tabla nueva | Habilitar RLS explícitamente y comparar advisors con los findings preexistentes documentados en SPEC 08. |

## Lo que no está en este spec

- Policies RLS o acceso de aplicación a perfiles y guarderías.
- Cliente Supabase, autenticación real o sesiones dentro de Next.js.
- Signup, invitaciones, activación, recuperación de contraseña o UI administrativa.
- Usuarios parent o admin de demostración.
- Soporte para que un usuario pertenezca a varias guarderías.
- Sincronización posterior entre metadata Auth y el perfil de dominio.
- Email o credenciales persistidos fuera del esquema administrado por Supabase Auth.
- Seeds o scripts versionados para crear cuentas Auth.
- Otros enums y tablas del esquema de referencia.
- Stack Supabase local, Docker, pgTAP o tipos TypeScript generados.
- Corrección de infraestructura preexistente de RLS.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
