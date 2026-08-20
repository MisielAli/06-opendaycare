# SPEC 12 — Vinculación padre por invitación con Resend y registro por código

> **Estado:** Aprovado
> **Depende de:** SPEC 02, SPEC 06, SPEC 08, SPEC 09, SPEC 10, SPEC 11
> **Fecha:** 2026-08-19
> **Objetivo:** Conectar el modal Vincular padre a Supabase enviando la invitación por Resend desde Next.js (Server Action) y habilitar el registro del padre en `/activate-account` validando código y email contra la invitación.

## Por qué existe esta spec

SPEC 06 dejó `LinkParentModal` como mock con código fijo `7K4P9` sin persistencia ni envío. SPEC 08/09 crearon `daycares` y `users` con el trigger Auth, y SPEC 11 creó `rooms` y `children` reales. Falta el puente entre staff y familia: persistir la invitación, enviarla por correo y permitir que el padre se registre y quede vinculado a su hijo. Esta spec cierra ese ciclo bajo la regla explícita de que **Resend se ejecuta desde Next.js** (Server Action, `server-only`), no desde Edge Functions ni triggers de Postgres.

## Alcance

**Incluye:**

- Migración generada por CLI que crea los enums `public.relationship_type` (`father`, `mother`, `guardian`) y `public.invitation_status` (`pending`, `accepted`, `expired`, `cancelled`) si no existen.
- Migración que crea `public.invitations` con columnas `id`, `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code`, `status`, `expires_at`, `accepted_at`, `created_at` según `../07-DBschema/opendaycare-database-schema.md`.
- Migración que crea `public.parent_children` con columnas `id`, `parent_id`, `child_id`, `relationship`, `created_at` y constraint `UNIQUE(parent_id, child_id)`.
- Índices, constraints (`code UNIQUE`, `btrim(full_name) <> ''`, `expires_at > created_at`, expiración a 7 días) y triggers de mantenimiento si aplican.
- RLS habilitado en ambas tablas con policies para `invitations` (INSERT/SELECT solo `staff` vía `auth.jwt().app_metadata.role = 'staff'`) y `parent_children` (SELECT para `staff/parent/admin`, INSERT solo vía RPC `SECURITY DEFINER`).
- Función transaccional `public.accept_invitation(p_code text, p_email text)` que valida `pending` y `expires_at > now()`, inserta en `parent_children` y marca `accepted/accepted_at` en una transacción.
- Configuración Resend desde Next.js: dependencia `resend`, variable `RESEND_API_KEY` documentada en `.env.example` (sin valor real), remitente fijo por defecto `OpenDaycare <onboarding@resend.dev>` hardcodeado en la Server Action (se cambia a dominio verificado en prod sin env), y template `emails/ParentInvitation.tsx` (o HTML inline) con asunto, nombre del niño/sala, código grande, `Vence en 7 días` y link a `/activate-account?code=CODE`.
- Server Action `inviteParent` en `app/actions/invitations.ts` que valida nombre/email/parentesco, genera código de 5 chars `A-Z0-9` único, cancela invitaciones `pending` previas del mismo `child_id+email`, inserta la invitación con `expires_at = now() + interval '7 days'` y envía el correo vía `new Resend(...).emails.send(...)` sin exponer la clave al cliente.
- Reemplazo del comportamiento mock de `components/kids/LinkParentModal.tsx` y `components/kids/ParentsPanel.tsx` por el flujo real: validación local, estado pendiente `Enviando...`, manejo de error de Resend sin rollback, inserción de fila `PENDIENTE` consultada desde DB, foco/scroll/Escape/overlay como en SPEC 06.
- Conversión de `/activate-account` de mock a real: lee `?code`, valida código+email contra `invitations` vía RPC/Server Action, ejecuta `supabase.auth.signUp({ email, password, options: { data: { daycare_id, role: 'parent', full_name } } })` (trigger crea `public.users` parent), o vincula un padre existente al niño, y navega a `/login` en éxito.
- Documentación de que `daycare_id` del padre se deriva de `rooms.daycare_id` del niño invitado.
- Actualización de `app/lib/kids.ts` o nuevo `app/lib/invitations.ts` con helpers de mapeo `relationship` DB (`father/mother/guardian`) ↔ UI (`Papá/Mamá/Tutor/a`).

**No incluye:**

- Edge Functions de Supabase, triggers que envían correo, ni cron de expiración automática.
- Reenvío programado, cancelación manual de invitaciones desde UI, edición o eliminación de vínculos `parent_children`.
- Recuperación/restablecimiento de contraseña, OAuth, magic links, MFA o passkeys.
- Panel familia/parent feed, subida de avatares o fotos.
- Generación de tipos `supabase gen types`, stack local Docker/`supabase start` o pgTAP.
- Toasts/banners fuera del modal y del formulario de activación; respeta los patrones accesibles de SPEC 04/06.

## Modelo de datos

### Enums

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
```

Etiquetas UI (no se guardan en DB): `father` → `Papá`, `mother` → `Mamá`, `guardian` → `Tutor/a`.

### `public.invitations`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | PK, `not null`, default `gen_random_uuid()` |
| `child_id` | `uuid` | `not null`, FK a `public.children(id)` `on delete cascade` |
| `invited_by` | `uuid` | `not null`, FK a `public.users(id)` `on delete restrict` |
| `full_name` | `text` | `not null`, `check (btrim(full_name) <> '')` |
| `email` | `text` | `not null`, `check (btrim(email) <> '' and email ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')` |
| `relationship` | `public.relationship_type` | `not null` |
| `code` | `text` | `not null`, `unique`, `check (code ~ '^[A-Z0-9]{5}$')` |
| `status` | `public.invitation_status` | `not null`, default `'pending'` |
| `expires_at` | `timestamptz` | `not null`, `check (expires_at > created_at)`, default `now() + interval '7 days'` |
| `accepted_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | `not null`, default `now()` |

Índices:

- `invitations_child_id_idx` sobre `child_id`.
- `invitations_code_idx` único sobre `code`.
- `invitations_email_child_status_idx` sobre `(child_id, lower(email), status)` para cancelar previas pendientes.

### `public.parent_children`

| Columna | Tipo | Restricciones y default |
| --- | --- | --- |
| `id` | `uuid` | PK, `not null`, default `gen_random_uuid()` |
| `parent_id` | `uuid` | `not null`, FK a `public.users(id)` `on delete cascade` |
| `child_id` | `uuid` | `not null`, FK a `public.children(id)` `on delete cascade` |
| `relationship` | `public.relationship_type` | `not null` |
| `created_at` | `timestamptz` | `not null`, default `now()` |
|  |  | `UNIQUE(parent_id, child_id)` |

Índices:

- `parent_children_parent_id_idx` sobre `parent_id`.
- `parent_children_child_id_idx` sobre `child_id`.

### RLS y policies

**`public.invitations` — RLS habilitado:**

| Policy | Operación | Condición |
| --- | --- | --- |
| `invitations_select_staff` | SELECT | `auth.jwt() -> 'app_metadata' ->> 'role' = 'staff'` |
| `invitations_insert_staff` | INSERT | `auth.jwt() -> 'app_metadata' ->> 'role' = 'staff'` |
| `invitations_update_staff` | UPDATE | `auth.jwt() -> 'app_metadata' ->> 'role' = 'staff'` (para marcar `accepted/expired/cancelled` desde RPC o Server Action staff) |

Sin policies para `anon` ni `authenticated` no-staff. La validación de código por el padre invitado ocurre dentro de la RPC `SECURITY DEFINER`, no por SELECT directo.

**`public.parent_children` — RLS habilitado:**

| Policy | Operación | Condición |
| --- | --- | --- |
| `parent_children_select_authenticated` | SELECT | `auth.jwt() -> 'app_metadata' ->> 'role' IN ('staff','parent','admin')` |
| (sin INSERT directo) | INSERT | Solo vía `public.accept_invitation()` (`SECURITY DEFINER`, `SET search_path = ''`) |

### Función transaccional

```sql
create or replace function public.accept_invitation(p_code text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations%rowtype;
  v_parent_id uuid;
begin
  select * into v_inv from public.invitations
   where code = p_code and lower(email) = lower(p_email)
   for update;

  if not found then raise exception 'invitation_not_found'; end if;
  if v_inv.status <> 'pending' then raise exception 'invitation_not_pending'; end if;
  if v_inv.expires_at <= now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'invitation_expired';
  end if;

  -- parent_id se resuelve por el llamante (auth.uid() si ya existe, o id del signup reciente)
  v_parent_id := auth.uid();
  if v_parent_id is null then raise exception 'not_authenticated'; end if;

  insert into public.parent_children(parent_id, child_id, relationship)
  values (v_parent_id, v_inv.child_id, v_inv.relationship)
  on conflict (parent_id, child_id) do nothing;

  update public.invitations
     set status = 'accepted', accepted_at = now()
   where id = v_inv.id;

  return v_inv.child_id;
end;
$$;
```

Reglas adicionales:

- Al crear una nueva invitación para el mismo `child_id` y `lower(email)` con `status='pending'`, las anteriores se actualizan a `status='cancelled'` en la misma transacción del INSERT.
- `code` se genera en la Server Action (no en DB) con 5 chars `A-Z0-9`, retry si colisiona por unique violation.
- `invited_by` = `auth.uid()` del staff autenticado (verificado vía `getClaims()`).

### Contratos TypeScript (Next.js)

```ts
// app/lib/invitations.ts
export type RelationshipDB = "father" | "mother" | "guardian";
export type RelationshipUI = "Mamá" | "Papá" | "Tutor/a";
export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled";

export const relationshipToDB: Record<RelationshipUI, RelationshipDB> = {
  "Mamá": "mother", "Papá": "father", "Tutor/a": "guardian",
};
export const relationshipToUI: Record<RelationshipDB, RelationshipUI> = {
  mother: "Mamá", father: "Papá", guardian: "Tutor/a",
};

export interface InviteParentInput {
  childId: string; // UUID
  fullName: string;
  email: string;
  relationship: RelationshipUI;
}

export interface InviteParentResult {
  code: string;
  expiresAt: string;
  emailSent: boolean;
  emailError?: string;
}
```

Resend — uso server-only (remitente por defecto, sin env):

```ts
// app/actions/invitations.ts — server-only
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: "OpenDaycare <onboarding@resend.dev>", // default Resend; cambiar a dominio verificado en prod
  to: input.email,
  subject: "Te invitaron a OpenDaycare",
  react: ParentInvitationEmail({ childName, code, expiresAt }),
});
```

Convenciones:

- `email` se normaliza a `lower(trim)` para comparaciones.
- `daycare_id` del nuevo `parent` = `select daycare_id from rooms where id = (select room_id from children where id = child_id)`.

## Estructura de archivos

```text
supabase/
└── migrations/
    ├── <ts>_add_invitation_enums.sql
    ├── <ts>_create_invitations.sql
    └── <ts>_create_parent_children_and_rpc.sql

app/
├── actions/
│   └── invitations.ts              # Nuevo: inviteParent(), acceptInvitation()
├── lib/
│   ├── invitations.ts              # Nuevo: mapeos y helpers
│   └── kids.ts                     # Modificar: re-export helpers si hace falta
├── (auth)/
│   └── activate-account/
│       └── page.tsx                # Modificar: real, lee ?code
├── (staff)/
│   └── kids/[id]/page.tsx          # Modificar: pasa childId real a ParentsPanel
components/
├── kids/
│   ├── LinkParentModal.tsx         # Modificar: de mock a Server Action real
│   └── ParentsPanel.tsx            # Modificar: consulta DB real tras invitar
└── auth/
    └── ActivateAccountForm.tsx     # Modificar: código+email+password reales, llama acceptInvitation

emails/
└── ParentInvitation.tsx            # Nuevo: template React Email (o HTML inline en invitations.ts)

.env.example                        # Modificar: agregar RESEND_API_KEY= (sin RESEND_FROM, remitente fijo en código)
```

Criterios:

- Migraciones generadas con `supabase migration new`, no timestamps manuales; una por unidad lógica (enums, invitations, parent_children+RPC).
- `emails/ParentInvitation.tsx` es server-only; no expone la clave ni importa cliente Supabase.
- `app/actions/invitations.ts` usa `utils/supabase/server.ts` y `getClaims()` para verificar `staff`; jamás crea cliente ad hoc.
- `RESEND_API_KEY` nunca tiene prefijo `NEXT_PUBLIC_`; se documenta vacía en `.env.example`.
- `package.json` agrega `resend` sin cambiar versiones de `@supabase/*` ni `next`.

## Comportamiento

### Modal Vincular padre (staff)

1. Staff abre `/kids/[uuid]` → `Vincular otro padre` abre `LinkParentModal` con subtítulo del niño real (consulta `children`+`rooms`).
2. Campos: Nombre completo, Email, Parentesco (`Mamá` por defecto, `Papá`, `Tutor/a`), bloque informativo azul, código no se muestra antes de enviar.
3. Validación al `Enviar invitación`: nombre no vacío, email con formato, parentesco válido. Errores en español bajo el control, desaparecen al corregir.
4. Submit llama `inviteParent()` Server Action: genera `code` 5 chars, cancela previas pendientes mismo `child+email`, inserta `pending` con `expires_at+7d`, envía correo vía Resend desde Next.js.
5. Durante envío el botón muestra `Enviando...` y queda deshabilitado.
6. Si Resend falla, la invitación queda creada en DB; el modal muestra `Invitación creada pero el email no pudo enviarse. Reintentá.` y no hace rollback.
7. En éxito, cierra modal, inserta fila `PENDIENTE` (consulta real de `parent_children`+`invitations` pendientes) antes de `Vincular otro padre`, con avatar `#A9C7E8`. Reabrir muestra formulario limpio y `Mamá` seleccionada.

### Email de invitación

- `From`: `OpenDaycare <onboarding@resend.dev>` (default hardcodeado en `app/actions/invitations.ts`; en prod se reemplaza por dominio verificado en el mismo archivo, sin env).
- `To`: email del padre invitado.
- `Subject`: `Te invitaron a OpenDaycare`.
- `Body` (React Email): marca OpenDaycare, texto `Te invitaron a vincularte con {childName} de {roomName}`, código en tipografía grande `7K4P9`-style, `Vence en 7 días` (`expiresAt` formateado en español), botón/link `Activar cuenta → /activate-account?code=CODE`.
- En dev sin dominio verificado, `onboarding@resend.dev` exige que el destinatario esté permitido por Resend (modo prueba).

### Registro del padre (`/activate-account`)

1. Ruta acepta `?code` y pre-llena el campo Código; el usuario completa Email (editable), Contraseña y consentimiento (como en SPEC 04, inicialmente marcado).
2. Validación local: código no vacío, email válido, contraseña no vacía, consentimiento marcado.
3. Submit ejecuta Server Action `acceptInvitation`: verifica que existe `invitations` con `code`+`lower(email)` en `pending` y `expires_at>now()`; si no, muestra error `Código inválido o expirado.` o `Esta invitación ya fue usada.`.
4. Si el email no tiene cuenta Auth, hace `supabase.auth.signUp({ email, password, options: { data: { daycare_id, role: 'parent', full_name } } })` — el trigger de SPEC 09 crea `public.users` con `role=parent` y `daycare_id` del niño. Luego invoca `accept_invitation(code,email)` autenticado.
5. Si el email ya tiene cuenta `parent`, valida contraseña vía `signInWithPassword` (o ya está logueado) y solo ejecuta `accept_invitation` para vincular el niño extra.
6. Duplicado `parent_children` (`UNIQUE parent_id,child_id`) es idempotente: si ya existe el vínculo, no duplica y marca la invitación como `accepted`.
7. En éxito navega a `/login` (como SPEC 04) y deja la invitación en `accepted`.

## Plan de implementación

1. Crear rama `spec-12-vinculacion-padre-invitacion-resend-registro` y confirmar que `supabase migration list` está alineado con SPEC 11 antes de generar nuevas migraciones.
2. Ejecutar `supabase migration new add_invitation_enums` y crear `relationship_type` e `invitation_status` solo si no existen (idempotente, `DO $$` con `pg_type`).
3. Ejecutar `supabase migration new create_invitations` y crear `public.invitations` con columnas, FK a `children`/`users`, índices, checks (`code ~ '^[A-Z0-9]{5}$'`, `expires_at > created_at`), RLS y policies `staff-only`.
4. Ejecutar `supabase migration new create_parent_children_and_rpc` y crear `public.parent_children` con FK, `UNIQUE`, índices, RLS y la función `accept_invitation` con `SECURITY DEFINER` y `search_path=''`.
5. Revisar SQL, ejecutar `supabase db push --dry-run`, aplicar al remoto y verificar catálogo: enums, columnas, FK, índices, constraints, RLS, policies, función y `search_path`.
6. Probar en transacciones revertidas: inserta invitación válida, rechaza código duplicado, rechaza `expires_at` pasado, valida `parent_children` unique, y que `accept_invitation` marca `expired` si vencida y `accepted` si válida.
7. Instalar `resend` (`npm i resend`), actualizar `.env.example` solo con `RESEND_API_KEY=` vacía (sin `RESEND_FROM`), crear `emails/ParentInvitation.tsx` con el template simple (React Email) usando `from: "OpenDaycare <onboarding@resend.dev>"` por defecto.
8. Crear `app/lib/invitations.ts` con mapeos `relationshipToDB/UI` y tipos; crear `app/actions/invitations.ts` con `inviteParent()` (genera código 5 chars con retry por unique violation, cancela previas pendientes, inserta `pending`, envía vía `Resend` desde Next.js, retorna `emailSent`/`emailError`) y `acceptInvitation()` (valida y orquesta `signUp`/`signIn` + RPC).
9. Modificar `components/kids/LinkParentModal.tsx` para usar `inviteParent()`, estado `Enviando...`, errores accesibles y cierre con foco devuelto; modificar `ParentsPanel.tsx` para consultar vínculos reales y renderizar pendientes de DB en lugar de memoria.
10. Modificar `app/(staff)/kids/[id]/page.tsx` para pasar `childId` UUID real a `ParentsPanel`; eliminar cualquier referencia a código fijo `7K4P9` del modal.
11. Modificar `app/(auth)/activate-account/page.tsx` y `components/auth/ActivateAccountForm.tsx` para leer `searchParams.code`, validar contra DB, soportar creación de cuenta parent nueva y vinculación de padre existente, y navegar a `/login` en éxito.
12. Ejecutar `npm run lint` y `npx tsc --noEmit`, corregir errores de esta entrega; verificar advisors (security/performance) y corregir `WARN/ERROR` nuevos.
13. Verificación manual E2E: staff logueado (`misiel@gmail.com`) invita a `padre@test.com` desde `/kids/<uuid>`, verifica `invitations` pending en DB y correo recibido (o log de Resend en dev), registra padre en `/activate-account?code=XXXXX`, confirma `parent_children` creado, invitación `accepted` y login del padre; probar duplicado mismo email+niño (cancela anterior), código expirado y modal responsive `390x844`.

## Criterios de aceptación

- [x] Existen tres migraciones nuevas generadas por CLI con sufijos `add_invitation_enums`, `create_invitations` y `create_parent_children_and_rpc`.
- [x] `public.relationship_type` existe con `father`, `mother`, `guardian`; `public.invitation_status` con `pending`, `accepted`, `expired`, `cancelled`.
- [x] `public.invitations` tiene 11 columnas acordadas con tipos, defaults, checks y FK correctas.
- [x] `invitations.code` es `UNIQUE` y rechaza valores que no cumplan `^[A-Z0-9]{5}$`.
- [x] `invitations.expires_at` usa `now()+7d` por defecto y `check (expires_at > created_at)`.
- [x] `public.parent_children` tiene 5 columnas, `UNIQUE(parent_id,child_id)` y FK con `on delete cascade`.
- [x] RLS habilitado en ambas tablas; `invitations` solo permite INSERT/SELECT/UPDATE a `staff`; `parent_children` SELECT para `staff/parent/admin`, INSERT solo vía RPC.
- [x] `public.accept_invitation` existe, es `SECURITY DEFINER`, `search_path=''`, y es transaccional (marca `expired` si vencida, `accepted` si válida).
- [x] Crear una segunda invitación pendiente para el mismo `child_id+email` cancela la anterior (`cancelled`).
- [x] `package.json` incluye `resend`; `.env.example` documenta solo `RESEND_API_KEY` vacía (sin `RESEND_FROM`) y no contiene secretos reales.
- [x] `app/actions/invitations.ts` envía el correo vía `new Resend(process.env.RESEND_API_KEY).emails.send(...)` desde Next.js (no Edge Function ni trigger).
- [x] El correo contiene `childName`, `roomName`, código en grande, `Vence en 7 días` y link a `/activate-account?code=CODE`.
- [x] Si Resend falla, la invitación permanece `pending` en DB y la UI muestra `Invitación creada pero el email no pudo enviarse. Reintentá.`.
- [x] `Vincular otro padre` abre el modal en cada `/kids/[uuid]` con el subtítulo del niño real; el foco inicial va a Nombre y el foco queda atrapado.
- [x] Enviar con nombre vacío, email vacío/inválido o parentesco inválido mantiene el modal abierto y muestra error bajo el control.
- [x] Enviar válido muestra `Enviando...`, deshabilita el botón, cierra al éxito y agrega fila `PENDIENTE` con `#A9C7E8` antes de `Vincular otro padre`.
- [x] Reabrir el modal muestra campos vacíos, `Mamá` seleccionada y sin código visible previo.
- [x] `/activate-account` lee `?code`, pre-llena el campo y valida `pending`+no expirado; muestra `Código inválido o expirado.` si corresponde.
- [ ] Registrar un email nuevo con código válido crea `auth.users` + `public.users` (`role=parent`, `daycare_id` del niño) y `parent_children`; la invitación pasa a `accepted`. — pendiente: `email rate limit exceeded` de Supabase Auth bloquea `signUp` (verificado con `mamr.213@gmail.com`/`QLJ4E`), se retomará tras ajustar `Confirm email` o límite en dashboard.
- [ ] Registrar un email ya existente (padre con otro hijo) no crea cuenta duplicada y solo inserta el nuevo `parent_children` (idempotente). — pendiente por mismo rate limit.
- [ ] Intentar reusar un código `accepted` muestra `Esta invitación ya fue usada.` y no crea vínculo adicional. — pendiente por mismo rate limit.
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores; advisors no reportan `WARN/ERROR` nuevos atribuibles a esta entrega.
- [x] `RESEND_API_KEY` no aparece en código cliente, logs, capturas ni archivos versionados; solo en env server-only.

## Decisiones tomadas y descartadas

- **Sí:** Resend desde Next.js Server Action (`app/actions/invitations.ts`, `server-only`, `new Resend(RESEND_API_KEY)`) — mantiene el flujo en la capa de aplicación, evita infra extra y respeta que la clave es server-only; es la regla explícita de esta spec.
- **No:** Edge Function de Supabase o trigger Postgres que envía correo — agrega deploy, latencia, configuración de vault/secrets fuera de Next.js y rompe la regla acordada.
- **No:** cliente Supabase `service_role` en la aplicación — la escritura usa el JWT staff verificado y la RPC privilegiada solo para la inserción transaccional de `parent_children`.
- **Sí:** enums `relationship_type` e `invitation_status` en DB en inglés — alinea con `../07-DBschema` y mantiene UI en español por mapeo (`Mamá/Papá/Tutor/a`).
- **No:** guardar parentesco en español en DB — mezcla idiomas y rompe el diccionario del schema de referencia.
- **Sí:** código 5 chars `A-Z0-9` con `UNIQUE` y retry en la Server Action — replica el mock `7K4P9` y es amigable para tipeo; colisiones se resuelven por reintento.
- **No:** UUID como código — único pero poco usable por teléfono/papel.
- **Sí:** `expires_at = now()+7d` y texto estático `Vence en 7 días` — coincide con la referencia visual y el DBSchema (`expires_at`).
- **No:** cron de expiración — una validación en lectura/RPC es suficiente para esta fase.
- **Sí:** cancelar previas pendientes del mismo `child+email` al crear nueva — evita múltiples códigos válidos simultáneos y deja solo la última pending auditable como `cancelled`.
- **No:** rechazar duplicado con error — obliga al staff a esperar expiración sin valor operativo.
- **No:** permitir ilimitadas pendientes — deja códigos ambiguos y complica el registro.
- **Sí:** mantener invitación `pending` aunque Resend falle y mostrar error visible — evita rollback silencioso y deja al staff la decisión de reintentar.
- **No:** rollback si email falla — perdería el código generado y obligaría a regenerar.
- **Sí:** `signUp` público desde `/activate-account` con `app_metadata {daycare_id, role, full_name}` y trigger de SPEC 09 — reutiliza el mecanismo existente para `parent`.
- **No:** `admin.createUser` con `service_role` desde Next.js — requiere clave privilegiada en la app y bypass de RLS innecesario.
- **Sí:** RPC `accept_invitation` transaccional — garantiza que `parent_children` y `accepted` ocurren juntos o no ocurren.
- **No:** dos pasos sueltos en la Server Action — riesgo de invitación marcada sin vínculo o viceversa.
- **Sí:** `daycare_id` del padre derivado de `rooms.daycare_id` del niño — asegura que el tenant del padre coincide con el de la guardería invitadora.
- **Sí:** RLS `invitations` solo `staff` y validación de código vía RPC — evita exponer códigos por SELECT y mantiene el principio de SPEC 09 (metadata solo en `app_metadata`).
- **No:** SELECT anónimo de `invitations` por código — expone enumeración de códigos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `RESEND_API_KEY` expuesta al cliente | Usar `server-only` en `app/actions/invitations.ts`, nunca prefijo `NEXT_PUBLIC_`, y no loguear la clave ni el cuerpo del email. |
| Dominio no verificado en Resend rechaza `From` | Usar `from` fijo `OpenDaycare <onboarding@resend.dev>` por defecto en la Server Action; documentar que en prod se cambia en código a dominio verificado. |
| Colisión de código 5 chars | Constraint `UNIQUE(code)` + retry en la Server Action (hasta 5 intentos); monitorear advisors por cardinalidad. |
| Race al cancelar previas pendientes | `SELECT ... FOR UPDATE` o `UPDATE ... WHERE status='pending'` en la misma transacción del INSERT. |
| `accept_invitation` llamada sin sesión | RPC exige `auth.uid()` no nulo; la Server Action de registro asegura `signUp/signIn` previo y valida expiración antes de invocar. |
| Padre existente con rol no `parent` invita de nuevo | La RPC valida que el vínculo se crea solo si el usuario autenticado tiene `role=parent` (vía `public.users` o `app_metadata`), o permite pero documenta que el rol no cambia. |
| Expiración no visible hasta intento de uso | Mostrar `expires_at` formateado en el panel de invitaciones pendientes y en el email; la RPC marca `expired` al validar. |
| Dependencia de trigger SPEC 09 para crear `public.users` | Verificar que `handle_new_auth_user` acepta `role=parent` y `daycare_id` del niño; probar signup parent en transacción revertida. |

## Lo que **no** está en este spec

- Edge Functions, cron, ni triggers que envían correo.
- Reenvío, cancelación manual o expiración programada de invitaciones.
- Edición o eliminación de vínculos `parent_children`.
- Recuperación de contraseña, OAuth, magic links, MFA o passkeys.
- Feed familia, subida de fotos, `post_children` o `reactions`.
- Generación de tipos TypeScript, Docker local o pgTAP.
- Toasts o notificaciones fuera del modal y del formulario de activación.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
