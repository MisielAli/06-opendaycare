# Spec 10 — Autenticación real y protección de rutas staff

> **Estado:** Verificado — E2E autenticado completado con credencial real
> **Depende de:** SPEC 04, SPEC 09
> **Fecha:** 2026-08-18

> **Objetivo:** Integrar el login y cierre de sesión por email y contraseña con Supabase Auth, y proteger las rutas staff mediante claims verificados y redirecciones seguras.

## Por qué existe esta spec

SPEC 04 dejó `/login` y `/activate-account` como formularios mock, mientras que SPEC 09 creó en Supabase una cuenta Auth real para `misiel@gmail.com` con rol `staff`. Esta spec conecta ambas entregas y define una protección de rutas compatible con Next.js 16.3 y Supabase SSR.

La documentación vigente de Next.js establece que Proxy sirve para redirecciones tempranas, pero no debe ser la única defensa. También advierte que un layout no se vuelve a ejecutar en cada navegación y no impide por sí solo que los segmentos hijos rendericen. Por ello, la protección acordada combina el refresco y filtro temprano en `proxy.ts` con una verificación server-only invocada por cada página staff.

## Alcance

**Incluye:**

- Reemplazo del submit mock de `/login` por autenticación real contra Supabase Auth mediante email y contraseña.
- Ejecución de `supabase.auth.signInWithPassword()` dentro de una Server Action.
- Uso exclusivo de los clientes oficiales existentes en `utils/supabase/` con `@supabase/ssr` y `@supabase/supabase-js` ya instalados y versionados.
- Email y contraseña vacíos al cargar el formulario de login.
- Validación de email requerido y con formato válido, y contraseña requerida.
- Estado pendiente que deshabilita el submit y cambia su texto a `Ingresando...` mientras Supabase responde.
- Mensaje general `Email o contraseña incorrectos.` cuando Supabase rechaza las credenciales.
- Mensaje general `No pudimos iniciar sesión. Intentá nuevamente.` ante errores de red o indisponibilidad del servicio.
- Verificación de sesión y de `app_metadata.role = "staff"` mediante `supabase.auth.getClaims()` antes de autorizar el acceso.
- Cierre local inmediato de la sesión recién creada y mensaje `Esta cuenta no tiene acceso al área de personal.` cuando las credenciales son válidas pero el rol verificado no es `staff`.
- Conservación de un destino interno `next` cuando un usuario anónimo intenta acceder a una ruta protegida.
- Validación server-side de `next` para aceptar únicamente rutas internas de la aplicación y usar `/` como fallback.
- Redirección al destino interno validado después de un login correcto.
- Refresco de sesión y propagación de cookies en Proxy mediante el helper existente `updateSession()`.
- Allowlist pública formada únicamente por `/login` y `/activate-account`; cualquier otra ruta de aplicación queda protegida por defecto.
- Redirección temprana de usuarios sin sesión desde una ruta protegida hacia `/login?next=<ruta-interna>`.
- Redirección de usuarios staff autenticados desde `/login` o `/activate-account` hacia `/`.
- Expulsión local y redirección al login de una sesión autenticada cuyo claim de rol no sea `staff`.
- Protección server-only de las páginas actuales `/`, `/kids` y `/kids/[id]` mediante un helper compartido, además del filtro de Proxy.
- Conversión de las páginas cliente `/` y `/kids` en wrappers de servidor protegidos, conservando su UI interactiva en `FeedPageContent` y `KidsPageContent`.
- Regla de que cada futura página bajo `app/(staff)` invoque el mismo helper server-only aunque Proxy ya la bloquee por defecto.
- Obtención de nombre, rol e inicial desde claims verificados para reemplazar la identidad mock de la barra lateral.
- Visualización de `Misiel Moreno`, inicial `M` y etiqueta `Personal · Soles` para la cuenta demo de SPEC 09.
- Fallback visible `Personal`, inicial `P` y etiqueta `Personal · Soles` si un futuro usuario staff no tiene un `app_metadata.full_name` utilizable.
- Conversión del botón existente `Cerrar sesión` en un cierre real de la sesión local de este navegador mediante una Server Action.
- Redirección a `/login` después de cerrar sesión y bloqueo inmediato de las rutas staff.
- Documentación de `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.example`, sin agregar valores reales.
- Verificación real contra el proyecto Supabase remoto con `misiel@gmail.com` y `DEMO_STAFF_PASSWORD` recibida exclusivamente desde la variable de entorno del usuario.
- Preflight obligatorio en Windows que busca `DEMO_STAFF_PASSWORD` en el almacén persistente de variables del usuario mediante `EnvironmentVariableTarget.User`, aunque el proceso actual no la haya heredado.
- Importación temporal de la contraseña desde el almacén `User` al proceso que ejecuta la verificación, sin imprimir ni serializar su valor.
- Evidencia de navegador y capturas guardadas únicamente bajo `.playwright-mcp/`.

**No incluye:**

- Signup público, creación de cuentas, invitaciones ni activación real de cuentas.
- Conversión del formulario mock de `/activate-account` en un flujo real.
- Recuperación o restablecimiento de contraseña; el botón `¿Olvidaste tu contraseña?` permanece visual y sin acción.
- Proveedores OAuth, magic links, passkeys, MFA ni autenticación por teléfono.
- Acceso para roles `parent` o `admin` a la zona staff.
- Consulta de `public.users`, `public.daycares` ni cualquier otra tabla desde la aplicación.
- Uso de `public.users.status` como condición de acceso.
- Policies RLS, grants, migraciones, triggers, cambios de esquema o cambios de datos en Supabase.
- Cambios a la cuenta demo, su contraseña, su metadata o su perfil creados en SPEC 09.
- Persistencia propia en `localStorage`, `sessionStorage` o cookies creadas manualmente por la aplicación.
- Página `/unauthorized`; los usuarios sin rol staff vuelven al login con un mensaje específico.
- Cierre global de sesiones en otros navegadores o dispositivos.
- Visualización del email en la barra lateral.
- Test runner E2E versionado, instalación de Playwright como dependencia o nuevos scripts npm.
- Cambios visuales amplios en las pantallas de autenticación o en la barra lateral.
- Protección definitiva de futuras Server Actions, Route Handlers o accesos a datos; cada recurso futuro deberá invocar autorización cerca de su operación.

## Modelo de datos

Esta funcionalidad no introduce estructuras persistentes ni modifica el esquema de Supabase. Reutiliza la cuenta Auth y el contrato de `raw_app_meta_data` definidos en SPEC 09.

Contratos TypeScript internos:

```ts
type LoginError =
  | "invalid_credentials"
  | "unauthorized"
  | "service_unavailable";

type LoginActionState = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  formError?: LoginError;
};

type StaffIdentity = {
  id: string;
  fullName: string;
  initial: string;
  role: "staff";
};
```

Contrato de claims esperado para autorizar a la cuenta demo:

```json
{
  "sub": "<uuid-auth>",
  "app_metadata": {
    "daycare_id": "00000000-0000-4000-8000-000000000001",
    "role": "staff",
    "full_name": "Misiel Moreno"
  }
}
```

Reglas:

- `sub` identifica la cuenta Auth y no se reemplaza por un identificador generado por la aplicación.
- La autorización usa exclusivamente claims devueltos por `getClaims()` y exige `app_metadata.role === "staff"`.
- `user_metadata` y `raw_user_meta_data` no participan en decisiones de acceso ni en la identidad visible.
- `fullName` usa `app_metadata.full_name` después de comprobar que sea un string no vacío; en caso contrario usa `Personal`.
- `initial` usa el primer carácter visible de `fullName` en mayúscula; si no existe usa `P`.
- El texto visible del rol es `Personal · Soles`; no se muestra el valor crudo `staff` ni se infiere un cargo como `Maestra`.
- La sesión y sus tokens permanecen administrados por Supabase SSR en cookies; la aplicación no define un formato de sesión propio.
- `next` no se persiste. Se recibe desde la URL o el formulario y se valida de nuevo en el servidor antes de redirigir.
- Una URL absoluta, protocol-relative, de otro origen o malformada nunca se acepta como `next`; el fallback es `/`.

## Estructura de archivos

```text
.env.example                                      # Modificar
app/
├── (auth)/
│   └── login/
│       └── page.tsx                              # Modificar
├── (staff)/
│   ├── layout.tsx                                # Modificar
│   ├── page.tsx                                  # Modificar: wrapper de servidor
│   └── kids/
│       ├── page.tsx                              # Modificar: wrapper de servidor
│       └── [id]/page.tsx                         # Modificar
├── actions/
│   └── auth.ts                                   # Nuevo
└── lib/
    ├── auth.ts                                   # Nuevo
    └── navigation.ts                             # Modificar
components/
├── auth/
│   └── LoginForm.tsx                             # Modificar
├── feed/
│   └── FeedPageContent.tsx                       # Nuevo
├── kids/
│   └── KidsPageContent.tsx                       # Nuevo
└── sidebar/
    ├── Sidebar.tsx                               # Modificar
    └── SidebarUser.tsx                           # Modificar
utils/
└── supabase/
    └── middleware.ts                             # Modificar
.playwright-mcp/
└── spec-10-*.png                                 # Evidencia generada
```

Criterios de estructura:

- `app/lib/auth.ts` es server-only y centraliza la verificación de claims, la construcción de `StaffIdentity` y la validación de destinos internos.
- `app/actions/auth.ts` contiene las Server Actions de login y logout, y usa `utils/supabase/server.ts` en lugar de crear un cliente ad hoc.
- `utils/supabase/middleware.ts` conserva la responsabilidad de crear el cliente SSR de Proxy, refrescar sesión, copiar cookies y devolver la respuesta correcta.
- `proxy.ts` continúa como punto de entrada de Next.js 16 y delega en `updateSession()`; su matcher existente continúa excluyendo recursos estáticos e imágenes.
- `app/(staff)/page.tsx` y `app/(staff)/kids/page.tsx` dejan de ser Client Components y se limitan a ejecutar la verificación server-only y renderizar su componente de contenido.
- `FeedPageContent.tsx` y `KidsPageContent.tsx` reciben sin cambios funcionales el estado y las interacciones cliente que actualmente viven en sus respectivos `page.tsx`.
- `app/(staff)/kids/[id]/page.tsx` permanece como Server Component e invoca el helper antes de entregar el perfil.
- `app/(staff)/layout.tsx` obtiene la identidad verificada para la barra lateral, pero no sustituye las comprobaciones de cada página.
- `Sidebar.tsx` y `SidebarUser.tsx` reciben una identidad serializable; no consultan Supabase desde el navegador.
- `navigation.ts` conserva textos estáticos de navegación, pero deja de ser la fuente del nombre y cargo mock del usuario.
- `utils/supabase/client.ts`, `utils/supabase/server.ts`, `package.json` y el lockfile no requieren cambios.

## Preflight de la credencial demo en Windows

`DEMO_STAFF_PASSWORD` está registrada como variable persistente del usuario de Windows. Los agentes no deben asumir que falta porque `$env:DEMO_STAFF_PASSWORD`, `process.env.DEMO_STAFF_PASSWORD` o el proceso actual estén vacíos: una aplicación iniciada antes de registrar la variable no recibe automáticamente el valor nuevo.

Antes de cualquier prueba autenticada, el agente debe ejecutar exactamente esta validación en PowerShell:

```powershell
[bool][Environment]::GetEnvironmentVariable(
    'DEMO_STAFF_PASSWORD',
    'User'
)
```

Reglas del preflight:

- El resultado esperado es exclusivamente `True` o `False`; el comando nunca imprime la contraseña.
- `True` confirma que existe un valor en el almacén persistente `User`, aunque el entorno heredado del agente no lo contenga.
- `False` obliga a detener la prueba autenticada y reportar que falta la variable de usuario; no se solicita, adivina ni sustituye la contraseña.
- Después de obtener `True`, el proceso de verificación recupera el valor con `[Environment]::GetEnvironmentVariable('DEMO_STAFF_PASSWORD', 'User')` mediante una asignación que no produzca salida.
- Si una herramienta necesita `$env:DEMO_STAFF_PASSWORD`, el valor recuperado se asigna solo al alcance `Process` dentro de la misma sesión de PowerShell que lanza el proceso hijo de verificación.
- La variable temporal de proceso y cualquier variable local que contenga el secreto se eliminan al terminar la prueba.
- No se usa `Get-ChildItem Env:`, `set`, `env`, `Write-Output`, `Write-Host`, `echo` ni ningún comando que enumere o muestre el valor.
- El valor no se incluye como argumento literal de herramientas, comandos, scripts, archivos temporales, mensajes, errores ni llamadas MCP.
- Si la herramienta de navegador no puede recibir el secreto desde el proceso sin imprimirlo o escribirlo, la verificación autenticada se detiene y se reporta el bloqueo; no se degrada la protección del secreto.

## Comportamiento de autenticación y rutas

### Login

1. `/login` renderiza el formulario existente con email y contraseña vacíos.
2. La Server Action valida email y contraseña antes de llamar a Supabase.
3. Si hay errores de campos, permanece en `/login` y los muestra junto a sus controles asociados.
4. Durante la llamada, el botón queda deshabilitado y muestra `Ingresando...`.
5. `signInWithPassword()` recibe únicamente los valores enviados en `FormData`.
6. Un rechazo reconocido de credenciales devuelve `invalid_credentials` sin indicar cuál dato fue incorrecto.
7. Un error de transporte o servicio devuelve `service_unavailable`.
8. Un login correcto se valida inmediatamente con `getClaims()`.
9. Si el claim no contiene el rol `staff`, la acción ejecuta `signOut({ scope: "local" })` y devuelve `unauthorized`.
10. Si la sesión es staff, la acción revalida el layout y redirige al `next` interno validado o a `/`.

### Proxy

1. Proxy crea el cliente SSR con las cookies de la petición.
2. `getClaims()` se ejecuta inmediatamente después de crear el cliente, sin lógica intermedia que pueda desincronizar el refresco.
3. Las cookies emitidas por Supabase se copian tanto a la petición entregada a Server Components como a la respuesta enviada al navegador, incluidas sus opciones.
4. Las redirecciones preservan las cookies actualizadas de la respuesta de Supabase.
5. `/login` y `/activate-account` son las únicas rutas públicas de aplicación.
6. Un usuario anónimo que solicita cualquier otra ruta recibe una redirección a `/login` con el pathname y query originales codificados en `next`.
7. Un usuario staff que solicita una ruta pública recibe una redirección a `/`.
8. Una sesión válida sin rol staff no puede entrar a rutas protegidas ni quedar atrapada en un ciclo de redirecciones; se cierra localmente y termina en `/login` con el error de autorización.
9. Un fallo al verificar claims se trata como ausencia de una sesión autorizada y nunca permite continuar a una ruta protegida.

### Protección server-only

1. `requireStaff(destination)` usa el cliente Supabase de servidor y `getClaims()`.
2. Una sesión ausente, inválida o sin rol staff provoca una redirección al login y nunca devuelve contenido protegido.
3. Una sesión válida devuelve únicamente `StaffIdentity`, no la sesión completa ni sus tokens.
4. `/`, `/kids` y `/kids/[id]` invocan `requireStaff()` antes de renderizar sus contenidos.
5. La verificación de página permanece aunque Proxy ya haya aceptado la petición.
6. Cada futura página staff debe invocar el helper; ocultar UI en un layout o Client Component no satisface esta regla.

### Logout

1. El botón `Cerrar sesión` envía un formulario a una Server Action.
2. La acción ejecuta `supabase.auth.signOut({ scope: "local" })`.
3. La sesión se elimina de este navegador sin revocar sesiones de otros dispositivos.
4. La acción revalida el layout y redirige a `/login`.
5. Volver atrás o solicitar directamente una ruta staff después del logout vuelve a pasar por la protección y no muestra contenido autenticado.

## Plan de implementación

1. Actualizar `.env.example` con placeholders vacíos para `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, conservar `SUPABASE_DB_PASSWORD` y no agregar `DEMO_STAFF_PASSWORD` ni valores reales.
2. Crear `app/lib/auth.ts` como módulo server-only con el contrato `StaffIdentity`, lectura segura de claims, comprobación estricta del rol `staff`, fallback de identidad, `requireStaff(destination)` y validación same-origin de destinos internos.
3. Crear en `app/actions/auth.ts` la Server Action de login con validación de campos, `signInWithPassword()`, clasificación de errores, verificación posterior mediante `getClaims()`, rechazo y logout local de roles no staff, revalidación y redirección segura.
4. Modificar `components/auth/LoginForm.tsx` para usar la Server Action, iniciar ambos campos vacíos, mantener errores accesibles, mostrar los tres mensajes generales acordados y reflejar el estado pendiente sin alterar el diseño responsive de SPEC 04.
5. Modificar `app/(auth)/login/page.tsx` para leer `next` y errores permitidos desde `searchParams`, normalizarlos en servidor y entregarlos al formulario sin confiar en valores arbitrarios de la URL.
6. Ampliar `utils/supabase/middleware.ts` para conservar el refresco con `getClaims()`, clasificar rutas mediante la allowlist pública, copiar cookies a todas las respuestas y aplicar las redirecciones para usuarios anónimos, staff y autenticados sin rol staff.
7. Extraer el contenido cliente actual de `app/(staff)/page.tsx` a `components/feed/FeedPageContent.tsx`, convertir la página en un wrapper de servidor e invocar `requireStaff("/")` antes de renderizar el contenido.
8. Extraer el contenido cliente actual de `app/(staff)/kids/page.tsx` a `components/kids/KidsPageContent.tsx`, convertir la página en un wrapper de servidor e invocar `requireStaff("/kids")` antes de renderizar el contenido.
9. Modificar `app/(staff)/kids/[id]/page.tsx` para invocar `requireStaff()` con su destino concreto antes de resolver y renderizar el perfil estático.
10. Modificar `app/(staff)/layout.tsx` para obtener la identidad staff verificada y pasarla a `Sidebar`, manteniendo las verificaciones de seguridad independientes en cada página.
11. Actualizar `Sidebar.tsx`, `SidebarUser.tsx` y `app/lib/navigation.ts` para reemplazar el nombre y cargo mock por props derivadas de `StaffIdentity`, mostrar el fallback acordado y mantener el comportamiento responsive del menú.
12. Agregar a `app/actions/auth.ts` la Server Action de logout local y conectar el botón existente mediante un formulario, con revalidación y redirección a `/login`.
13. Ejecutar `npm run lint` y `npx tsc --noEmit`, corregir únicamente errores causados por esta entrega y confirmar que `package.json`, el lockfile, las migraciones y el esquema remoto permanecen sin cambios.
14. Iniciar la aplicación con las variables públicas configuradas y verificar mediante Playwright MCP el acceso anónimo, la validación, el login remoto, `next`, la identidad visible, la persistencia tras recarga, las redirecciones de rutas públicas y el logout.
15. Ejecutar en PowerShell el preflight exacto `[bool][Environment]::GetEnvironmentVariable('DEMO_STAFF_PASSWORD', 'User')` y continuar únicamente si devuelve `True`, sin concluir que la variable falta a partir del entorno heredado del agente.
16. Recuperar `DEMO_STAFF_PASSWORD` desde `EnvironmentVariableTarget.User` mediante una asignación sin salida, inyectarla solo en el proceso que ejecuta la verificación y probar el login remoto con `misiel@gmail.com` sin imprimir, devolver, guardar ni capturar la contraseña o los tokens.
17. Eliminar la copia temporal de alcance `Process` y cualquier variable local que contenga la contraseña al concluir la prueba, tanto si finaliza correctamente como si falla.
18. Guardar bajo `.playwright-mcp/` capturas de `/login` en escritorio y móvil, y del feed staff autenticado en escritorio y móvil; revisar también la consola y las solicitudes de red sin registrar cuerpos sensibles.

## Criterios de aceptación

- [x] SPEC 04 y SPEC 09 existen y permanecen como dependencias válidas de esta entrega.
- [x] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con valores vacíos.
- [x] `.env.example` conserva `SUPABASE_DB_PASSWORD` y no contiene el valor de ninguna credencial.
- [x] `DEMO_STAFF_PASSWORD` no se agrega a archivos versionados ni se expone como variable `NEXT_PUBLIC_`.
- [x] Antes del E2E se ejecuta el comando PowerShell exacto que consulta `DEMO_STAFF_PASSWORD` con target `User` y su salida contiene únicamente `True` o `False`.
- [x] La prueba no considera ausente la credencial solo porque `$env:DEMO_STAFF_PASSWORD` o `process.env.DEMO_STAFF_PASSWORD` estén vacíos.
- [ ] Un resultado `False` detiene la prueba autenticada sin solicitar, adivinar ni sustituir el secreto.
  - Bloqueo: el preflight devolvió `True`; la rama `False` no ocurrió y no se simuló.
- [x] Un resultado `True` permite recuperar la credencial desde el almacén `User` mediante una asignación sin salida y pasarla únicamente al proceso de verificación.
- [x] La copia temporal de alcance `Process` se elimina al terminar la prueba, incluso cuando la ejecución falla.
- [x] `/login` conserva el diseño responsive de SPEC 04 y carga con email y contraseña vacíos.
- [x] Enviar un email vacío o inválido muestra `Ingresá un email válido.` asociado al campo email.
- [x] Enviar una contraseña vacía muestra `Ingresá tu contraseña.` asociado al campo contraseña.
- [x] Durante el submit remoto, el botón está deshabilitado y muestra `Ingresando...`, evitando envíos duplicados.
- [x] El login usa una Server Action y llama a `supabase.auth.signInWithPassword()` con el email y contraseña enviados.
- [x] Credenciales rechazadas muestran `Email o contraseña incorrectos.` sin revelar si existe el email.
- [x] Un fallo de red o servicio muestra `No pudimos iniciar sesión. Intentá nuevamente.` y permite reintentar.
- [x] La acción verifica el resultado exitoso mediante `getClaims()` y no usa el usuario de `getSession()` para autorizar.
- [x] Una cuenta autenticada cuyo `app_metadata.role` no sea `staff` se cierra localmente y muestra `Esta cuenta no tiene acceso al área de personal.`.
- [x] `user_metadata` y `raw_user_meta_data` no se usan para rol, tenant, nombre autorizado ni decisiones de acceso.
- [x] Acceder sin sesión a `/` redirige a `/login?next=%2F` o a una codificación URL equivalente.
- [x] Acceder sin sesión a `/kids` redirige a `/login` conservando `/kids` como destino interno.
- [x] Acceder sin sesión a un perfil `/kids/<id>` conserva el pathname concreto como destino interno.
- [x] Los query parameters de una ruta protegida se conservan dentro de `next` sin convertirlos en una redirección externa.
- [ ] Tras autenticarse desde un redirect protegido, el usuario vuelve a la ruta interna solicitada.
  - Bloqueo: requiere login real y la credencial no pudo transferirse de forma segura a Playwright MCP.
- [ ] Un `next` absoluto, protocol-relative, de otro origen o malformado se ignora y el login correcto redirige a `/`.
  - Bloqueo: la normalización server-side a `/` sí se comprobó para cuatro entradas hostiles, pero la redirección posterior a un login correcto requiere la prueba autenticada bloqueada.
- [x] `/login` y `/activate-account` son las únicas rutas públicas declaradas por la aplicación.
- [x] Toda otra ruta coincidente con Proxy requiere una sesión staff por defecto, incluidas rutas futuras no agregadas a una lista de protegidas.
- [x] Un usuario staff autenticado que visita `/login` es redirigido a `/`.
- [x] Un usuario staff autenticado que visita `/activate-account` es redirigido a `/`.
- [x] Proxy ejecuta `getClaims()` inmediatamente después de crear el cliente SSR y conserva el refresco de sesión.
- [x] Las respuestas normales y las redirecciones de Proxy incluyen todas las cookies actualizadas y sus opciones.
- [x] Un error de `getClaims()` nunca permite continuar hacia una ruta protegida.
- [x] Existe un helper server-only compartido que devuelve únicamente una identidad staff mínima o redirige al login.
- [x] `/`, `/kids` y `/kids/[id]` ejecutan el helper server-only desde su propia página y no dependen exclusivamente de Proxy o del layout.
- [x] `app/(staff)/page.tsx` y `app/(staff)/kids/page.tsx` son wrappers de servidor, no Client Components.
- [x] `FeedPageContent.tsx` conserva las publicaciones temporales, el composer y el feed existentes sin regresiones funcionales.
- [x] `KidsPageContent.tsx` conserva el alta temporal, modal y listado de niños existentes sin regresiones funcionales.
- [x] La cuenta demo inicia sesión realmente con `misiel@gmail.com` y el valor de `DEMO_STAFF_PASSWORD` recibido desde el entorno.
- [x] La sesión real sobrevive una recarga completa del navegador y continúa autorizando las rutas staff.
- [x] La barra lateral de la cuenta demo muestra `Misiel Moreno`, inicial `M` y `Personal · Soles`.
- [x] Un claim staff sin `full_name` utilizable muestra `Personal`, inicial `P` y `Personal · Soles` sin lanzar errores.
- [x] La barra lateral no muestra el email, tokens, UUID ni metadata completa de la cuenta.
- [x] El botón `Cerrar sesión` ejecuta `signOut({ scope: "local" })` mediante una Server Action.
- [x] Cerrar sesión redirige a `/login` y una recarga o navegación hacia atrás no vuelve a mostrar una ruta staff autorizada.
- [x] El logout local no intenta cerrar sesiones del usuario en otros navegadores o dispositivos.
- [x] `/activate-account` continúa siendo mock para usuarios anónimos y no crea ni modifica cuentas Supabase.
- [x] `¿Olvidaste tu contraseña?` continúa sin iniciar un flujo de recuperación.
- [x] No se crean páginas `/unauthorized`, callbacks OAuth, endpoints de recuperación ni rutas de signup.
- [x] No se consulta `public.users`, `public.daycares` ni otra tabla para completar este flujo.
- [x] No se crean migraciones, policies RLS, grants, triggers ni cambios de datos remotos.
- [x] `package.json`, el lockfile y las versiones fijadas de Supabase permanecen sin cambios.
- [x] La contraseña demo, access tokens, refresh tokens, cookies completas y claves privadas no aparecen en código, archivos de entorno versionados, logs, errores, capturas ni evidencia textual.
- [x] Las capturas de login y feed autenticado en `1440x900` y `390x844` se guardan bajo `.playwright-mcp/`.
- [x] No existe scroll horizontal ni regresión visible en login o barra lateral en los dos viewports.
- [x] La consola del navegador no muestra errores durante login, recarga, navegación protegida o logout (único error: 404 esperado en `/kids/1` sin dato).
- [x] `npm run lint` y `npx tsc --noEmit` finalizan sin errores.

## Decisiones tomadas y descartadas

- **Sí:** depender de SPEC 04 para la UI y de SPEC 09 para la cuenta Auth real — evita reconstruir entregas ya implementadas.
- **Sí:** email y contraseña como único método de autenticación — es el alcance cerrado por producto.
- **No:** OAuth, magic links, passkeys, MFA o teléfono — agregan flujos y decisiones fuera de esta entrega.
- **Sí:** Server Action para `signInWithPassword()` — sigue la integración SSR vigente y mantiene la mutación y redirección en servidor.
- **No:** llamar a `signInWithPassword()` desde el cliente navegador — concentra innecesariamente el flujo de credenciales y sesión en código cliente.
- **Sí:** `getClaims()` para verificar identidad y rol — valida el JWT y evita confiar en el usuario leído directamente de cookies.
- **No:** `getSession()` como prueba de autorización — puede devolver datos de almacenamiento sin la verificación requerida para confiar en la identidad.
- **No:** `getUser()` en cada petición — añade una llamada remota a Auth; `getClaims()` satisface el contrato actual de claims verificados.
- **Sí:** exigir `app_metadata.role = "staff"` — la aplicación implementada es la experiencia staff y SPEC 09 creó ese claim administrativo.
- **No:** permitir cualquier usuario autenticado — expondría la experiencia staff a cuentas parent o admin sin una decisión explícita.
- **No:** usar `public.users.status` — la tabla permanece cerrada por SPEC 09 y abrir acceso requiere una spec de autorización y RLS independiente.
- **No:** usar `user_metadata` para el rol — esos metadatos son editables por el usuario y no son una fuente segura de autorización.
- **Sí:** Proxy para refresco y redirección temprana — evita mostrar rutas protegidas a usuarios anónimos y mantiene cookies SSR actualizadas.
- **No:** Proxy como única defensa — Next.js recomienda verificar autorización cerca del recurso protegido.
- **Sí:** helper server-only por página staff — cada entrada actual verifica sesión aunque el layout sea reutilizado o Proxy cambie en el futuro.
- **No:** layout como única protección — los layouts no se re-renderizan en toda navegación y no impiden por sí solos el render de segmentos hijos.
- **Sí:** layout como consumidor de identidad verificada — permite mostrar nombre e inicial sin exponer la sesión al cliente, mientras las páginas mantienen su propia comprobación.
- **Sí:** extraer `FeedPageContent` y `KidsPageContent` — permite convertir sus páginas en Server Components sin perder estado o interacciones cliente.
- **No:** eliminar la capa segura por página para conservar los archivos actuales — priorizaría menos archivos sobre la protección documentada.
- **Sí:** allowlist pública con `/login` y `/activate-account` — una nueva ruta queda cerrada por defecto hasta ser clasificada explícitamente.
- **No:** lista cerrada solo de rutas protegidas actuales — una futura página staff podría publicarse accidentalmente.
- **Sí:** conservar el destino original en `next` — completa el flujo esperado al entrar desde un enlace protegido.
- **Sí:** validar `next` otra vez en servidor — evita open redirects aunque la URL o el formulario sean manipulados.
- **No:** aceptar URLs externas en `next` — convertiría el login en un vector de redirección abierta.
- **Sí:** redirigir usuarios staff desde ambas rutas de auth hacia `/` — evita mostrar flujos de acceso a una sesión ya autorizada.
- **Sí:** cerrar localmente una sesión sin rol staff y explicar el motivo — evita ciclos entre una ruta protegida y un login que detecta una sesión no autorizada.
- **No:** agregar `/unauthorized` — una página adicional no aporta valor al alcance actual y conservaría una sesión sin acceso.
- **Sí:** email inicial vacío — representa el comportamiento de producción; la cuenta demo se completa solo durante la prueba.
- **No:** precargar `misiel@gmail.com` o el email mock de SPEC 04 — la UI no debe depender de una cuenta de verificación.
- **Sí:** mensaje único para credenciales inválidas — no revela si un email está registrado.
- **Sí:** mensaje distinto para indisponibilidad — permite al usuario distinguir un fallo temporal y reintentar.
- **Sí:** identidad desde `app_metadata.full_name` verificado — reemplaza el usuario mock con el contexto de la cuenta real.
- **Sí:** etiqueta neutral `Personal · Soles` — el rol `staff` no garantiza un cargo específico como maestra.
- **No:** consultar `public.users` para la barra lateral — requeriría policies y acceso a datos fuera de alcance.
- **Sí:** logout con alcance `local` — el botón describe el cierre de este navegador, no la revocación de todos los dispositivos.
- **No:** logout global — desconectaría otras sesiones sin que la UI lo comunique.
- **Sí:** mantener activación mock y recuperación no-op — ambas pertenecen a flujos futuros distintos del login por contraseña.
- **No:** ocultar los controles existentes — alteraría innecesariamente el alcance visual de SPEC 04.
- **Sí:** documentar solo las variables públicas requeridas por la aplicación — mejora la configuración sin mezclar la credencial E2E.
- **No:** agregar `DEMO_STAFF_PASSWORD` a `.env.example` — la aplicación no consume esa variable y la verificación ya la recibe del entorno del usuario.
- **Sí:** consultar explícitamente el almacén persistente `User` de Windows — los agentes y servidores iniciados antes de registrar la variable pueden no recibirla en su entorno de proceso.
- **No:** validar únicamente `$env:DEMO_STAFF_PASSWORD` o `process.env.DEMO_STAFF_PASSWORD` — un valor vacío allí no demuestra que la variable de usuario no exista.
- **Sí:** usar el comando booleano acordado como preflight — confirma existencia sin revelar el valor.
- **No:** imprimir o enumerar variables para localizar la contraseña — expondría un secreto que solo debe existir en memoria durante la prueba.
- **Sí:** evidencia con Playwright MCP — verifica el flujo real sin instalar infraestructura de tests en esta entrega.
- **No:** test E2E versionado — el proyecto no tiene test runner y agregarlo amplía dependencias y configuración.
- **No:** cambios de base de datos o Auth Admin — SPEC 09 ya dejó cuenta, metadata y perfil preparados.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una redirección de Proxy podría perder cookies renovadas y provocar cierres de sesión aparentes | Construir las redirecciones a partir de la respuesta que contiene las cookies de Supabase y copiar todas las opciones emitidas por `setAll()`. |
| Confiar solo en Proxy dejaría páginas o recursos expuestos ante cambios de routing | Mantener `requireStaff()` en cada página actual y exigirlo para toda futura página staff. |
| Proteger únicamente en el layout puede fallar durante navegación parcial | Usar el layout solo para obtener identidad visual y repetir la verificación en cada página protegida. |
| Un `next` manipulado podría producir una redirección abierta | Aceptar únicamente rutas internas same-origin normalizadas y usar `/` como fallback. |
| Los claims de rol o nombre pueden permanecer antiguos hasta que el JWT se refresque | Mantener el refresco en Proxy, usar expiraciones administradas por Supabase y documentar que una revocación inmediata estricta requeriría validación remota adicional. |
| `getClaims()` puede aceptar un access token todavía válido después de una revocación de sesión remota | Limitar esta spec al contrato JWT vigente; una política de revocación inmediata deberá evaluar `getUser()` o `session_id` en otra spec. |
| Una caída de Supabase puede impedir tanto login como validación de rutas | Tratar los fallos como no autorizados, mantener accesible `/login` y mostrar un mensaje temporal sin filtrar detalles técnicos. |
| Una sesión válida con metadata incompleta puede romper la barra lateral | Validar tipos y contenido, y usar `Personal` e inicial `P` como fallback. |
| Una nueva página pública sería bloqueada por la allowlist cerrada | Exigir que toda nueva ruta pública se agregue explícitamente a la allowlist y conserve su propia revisión de seguridad. |
| La prueba E2E contra el remoto puede filtrar la contraseña o tokens en herramientas | Leer `DEMO_STAFF_PASSWORD` solo en memoria, evitar salida verbose y no capturar cuerpos de Auth, cookies ni valores de campos. |
| El agente fue iniciado antes de registrar la variable y su entorno heredado aparece vacío | Consultar siempre `[Environment]::GetEnvironmentVariable('DEMO_STAFF_PASSWORD', 'User')` y usar el resultado booleano como preflight obligatorio. |
| Una herramienta no permite transferir el secreto desde el almacén `User` sin serializarlo | Detener la prueba autenticada y reportar el bloqueo en lugar de escribir el valor en archivos, argumentos o llamadas de herramienta. |
| El usuario demo tiene acceso real al proyecto remoto | Autorizar únicamente el rol staff verificado, no abrir tablas y mantener la credencial fuera del repositorio y evidencias. |

## Lo que no está en este spec

- Signup, invitaciones o activación real de cuentas.
- Recuperación o restablecimiento de contraseña.
- OAuth, magic links, passkeys, MFA o autenticación telefónica.
- Experiencia parent o admin.
- Consulta de perfiles, guarderías u otras tablas desde Next.js.
- Policies RLS, grants, migraciones o cambios de esquema.
- Autorización basada en `public.users.status`.
- Página de acceso denegado independiente.
- Logout global de otros dispositivos.
- Persistencia de sesión administrada manualmente.
- Test runner E2E o nuevas dependencias.
- Modificación de la cuenta demo o sus metadatos.
- Protección automática suficiente para futuras acciones y APIs sin una comprobación propia cerca de cada operación.

Cada una de estas funcionalidades requiere su propia spec si se incorpora posteriormente.
