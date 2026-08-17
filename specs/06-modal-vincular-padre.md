# Spec 06 — Modal Vincular padre en perfil de niño

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-08-17

> **Objetivo:** Agregar en `/kids/[id]` un modal accesible para simular la invitación de un padre, madre o tutor, basado en `references/pantallas/vincular-padre.dc.html`, y mostrar el vínculo pendiente en memoria sin persistencia ni envío real.

## Alcance

**Incluye:**

- Acción funcional `Vincular otro padre` en todos los perfiles existentes bajo `/kids/[id]`.
- Modal basado visualmente en `references/pantallas/vincular-padre.dc.html`, con el nombre del niño abierto en el subtítulo.
- Campos Nombre del padre/madre, Email y Parentesco.
- Opciones de parentesco Mamá, Papá y Tutor/a, con Mamá seleccionada inicialmente.
- Validación local al pulsar `Enviar invitación`: nombre no vacío, email con formato válido y parentesco seleccionado.
- Mensajes breves de error en español debajo del control inválido, que desaparecen al corregirlo.
- Panel informativo que explica que se enviaría un correo con el código para activar la cuenta y que solo verá el feed del niño actual.
- Código de invitación visual fijo `7K4P9` y texto estático `Vence en 7 días`.
- Cierre mediante botón X, Escape y clic en el fondo oscurecido.
- Bloqueo del scroll de fondo, foco inicial en el campo de nombre, foco contenido dentro del diálogo y devolución del foco al activador al cerrar.
- Al enviar un formulario válido, cierre del modal e inserción en memoria de un vínculo `PENDIENTE` con nombre y parentesco ingresados.
- El vínculo nuevo usa el avatar azul fijo `#A9C7E8`, aparece antes de la acción para vincular otro padre y muestra el mismo tratamiento visual de los vínculos pendientes existentes.
- Duplicados de nombre o email permitidos.
- Reapertura con formulario limpio, Mamá seleccionada y código `7K4P9` conservado.
- Diseño responsive sin desbordes horizontales y navegación completa por teclado.

**No incluye:**

- Envío real de correo, backend, API, Server Actions o servicios externos.
- Persistencia en base de datos, cookies, `localStorage`, `sessionStorage` u otro almacenamiento.
- Integración de la invitación con `/activate-account` o precarga de su formulario.
- Generación, consumo, vencimiento real o validación remota del código `7K4P9`.
- Mostrar o guardar el email ingresado en el panel de padres vinculados.
- Prevención de invitaciones duplicadas.
- Edición, eliminación, activación de vínculos existentes o cambios a los datos estáticos de `kids`.
- Cambios fuera del perfil del niño y el modal de invitación.

## Modelo de datos

La funcionalidad reutiliza `ParentLink` y agrega solo las estructuras de formulario necesarias en `app/lib/kids.ts`. El estado de los vínculos creados vive en memoria dentro de `ParentsPanel` y se pierde al recargar o navegar fuera del perfil.

```ts
export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export interface LinkParentFormValues {
  fullName: string;
  email: string;
  roleLabel: ParentRole;
}

export interface ParentLink {
  name: string;
  roleLabel: string;
  status: ParentStatus;
  avatarColor: string;
}

export const pendingParentAvatarColor = "#A9C7E8";
```

Convenciones:

- El email se usa solo para la validación local y se descarta después del envío válido.
- El nuevo `ParentLink` siempre usa `status: "pending"` y `avatarColor: pendingParentAvatarColor`.
- `roleLabel` conserva el valor visible seleccionado: `Mamá`, `Papá` o `Tutor/a`.
- Los vínculos temporales se anexan a una copia local de los `parents` recibidos por prop.
- Las claves de filas temporales no dependen exclusivamente del nombre para permitir duplicados.

## Estructura de componentes

```text
app/lib/
└── kids.ts

app/(staff)/kids/[id]/
└── page.tsx

components/kids/
├── LinkParentModal.tsx
└── ParentsPanel.tsx
```

Criterios:

- `LinkParentModal.tsx` es un client component que concentra estado de formulario, validación, foco, bloqueo de scroll y mecanismos de cierre.
- `ParentsPanel.tsx` pasa a ser client component y concentra únicamente la apertura del modal y el arreglo efímero de vínculos pendientes agregados.
- `app/(staff)/kids/[id]/page.tsx` permanece como server component y pasa el nombre del niño a `ParentsPanel` junto con los vínculos existentes.
- No se convierte la página de perfil completa en client component.
- Los nombres de componentes, tipos, props y funciones se mantienen en inglés; el texto visible y los errores están en español.

## Plan de implementación

1. Actualizar `app/lib/kids.ts` con `ParentRole`, `LinkParentFormValues` y `pendingParentAvatarColor`, sin modificar los vínculos estáticos actuales.
2. Crear `components/kids/LinkParentModal.tsx` con la estructura visual de la referencia, campos controlados, opciones de parentesco y código visual fijo.
3. Implementar en `LinkParentModal.tsx` la validación local al enviar, los mensajes de error accesibles, el reset del formulario al montar y el callback que devuelve nombre y parentesco válidos.
4. Implementar en `LinkParentModal.tsx` el foco inicial, el atrapamiento de foco, Escape, clic en el overlay, bloqueo de scroll y devolución del foco al botón activador.
5. Actualizar `components/kids/ParentsPanel.tsx` para abrir el modal, mantener los vínculos temporales en estado local e insertar cada envío válido como `PENDIENTE` antes de la acción de vinculación.
6. Actualizar `app/(staff)/kids/[id]/page.tsx` para pasar `kid.name` a `ParentsPanel`, conservando la generación estática y el 404 existentes.
7. Verificar el flujo en perfiles con y sin vínculos, capturar `/kids/0001` con el modal en `1440x900` y `390x844` dentro de `.playwright-mcp/`, y ejecutar `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [ ] `Vincular otro padre` abre el modal desde cada perfil existente en `/kids/[id]`.
- [ ] El subtítulo del modal muestra el nombre del niño del perfil abierto.
- [ ] El modal reproduce la jerarquía visual, tipografía, colores y espaciado de `references/pantallas/vincular-padre.dc.html`.
- [ ] El modal muestra los campos Nombre del padre/madre, Email y Parentesco.
- [ ] Las opciones de parentesco son Mamá, Papá y Tutor/a, y Mamá aparece seleccionada inicialmente.
- [ ] El modal muestra el código `7K4P9` y el texto `Vence en 7 días` como contenido estático.
- [ ] El foco inicial se sitúa en el campo Nombre del padre/madre.
- [ ] El foco no puede salir del diálogo mientras este está abierto.
- [ ] X, Escape y clic en el fondo cierran el modal y devuelven el foco al botón que lo abrió.
- [ ] El scroll del documento se bloquea mientras el modal está abierto y se restaura al cerrarlo.
- [ ] Enviar con nombre vacío, email vacío o inválido, o parentesco no válido mantiene abierto el modal y muestra el error correspondiente debajo del control.
- [ ] Corregir un campo inválido elimina su mensaje de error.
- [ ] Enviar con valores válidos cierra el modal y agrega una fila nueva al panel de padres vinculados.
- [ ] La fila creada muestra el nombre ingresado, el parentesco seleccionado, el detalle `invitación enviada` y el badge `PENDIENTE`.
- [ ] La fila creada usa el avatar `#A9C7E8` y se muestra antes de `Vincular otro padre`.
- [ ] Reabrir el modal muestra nombre y email vacíos, Mamá seleccionada y el código `7K4P9`.
- [ ] Se permiten múltiples invitaciones con el mismo nombre o email.
- [ ] El email ingresado no se muestra ni se guarda en el panel de vínculos.
- [ ] Un vínculo temporal desaparece al recargar la página o abandonar el perfil.
- [ ] El modal no produce desbordes horizontales en `390x844`.
- [ ] Todos los controles del modal se pueden operar solo con teclado y presentan foco visible.
- [ ] Las capturas de `/kids/0001` con el modal en `1440x900` y `390x844` se guardan en `.playwright-mcp/` y se comparan con la referencia.
- [ ] La consola no muestra errores al abrir, validar, enviar o cerrar el modal.
- [ ] `npm run lint` y `npx tsc --noEmit` finalizan sin errores.
- [ ] La implementación no realiza llamadas de red ni agrega persistencia local.

## Decisiones tomadas y descartadas

- **Sí:** vínculo pendiente solo en memoria dentro de `ParentsPanel` — mantiene el flujo visible sin crear un contrato de persistencia.
- **No:** persistencia entre perfiles o recargas — requiere definir una fuente de datos compartida y reglas de sincronización fuera de este alcance.
- **Sí:** aplicar el modal a todos los perfiles existentes — reutiliza el mismo flujo y muestra el niño correspondiente sin una excepción artificial para Mateo.
- **No:** limitarlo a `/kids/0001` — el comportamiento forma parte del perfil del niño, no de sus datos particulares.
- **Sí:** código fijo `7K4P9` y vencimiento como texto estático — replica la referencia sin simular lógica de negocio inexistente.
- **No:** generar códigos, fechas de vencimiento o cuentas regresivas — agregaría estados, reglas y persistencia sin beneficio en esta fase mock.
- **Sí:** validar nombre, email y parentesco al enviar — permite verificar los estados esenciales sin interrumpir la escritura.
- **No:** validación remota de email o código — requiere una integración externa que no existe.
- **Sí:** iniciar con Mamá seleccionada — replica el estado visual de la referencia.
- **No:** parentesco sin selección inicial — se aleja del mockup sin una necesidad funcional.
- **Sí:** cerrar y confirmar mediante la fila `PENDIENTE` — el resultado queda visible en su contexto sin introducir notificaciones adicionales.
- **No:** toast o pantalla de éxito — no aparecen en la referencia y amplían el diseño.
- **Sí:** permitir duplicados — los homónimos y correos repetidos requieren reglas de negocio que todavía no están definidas.
- **No:** almacenar el email en `ParentLink` — el panel actual no lo muestra y la invitación no tiene integración real.
- **Sí:** convertir solo `ParentsPanel` en cliente — concentra el estado efímero y conserva el perfil como página estática de servidor.
- **No:** convertir todo `/kids/[id]/page.tsx` en cliente — aumenta el JavaScript cliente e interfiere innecesariamente con la estructura existente.
- **Sí:** X, Escape y clic en fondo con control de foco — completa un diálogo accesible y es coherente con el modal de alta de niños.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La invitación mock puede interpretarse como correo enviado realmente | Mantener explícitamente fuera de alcance el envío, la integración y las llamadas de red. |
| El vínculo temporal desaparece al recargar o navegar | Documentar este comportamiento y limitar el estado al perfil abierto. |
| Los duplicados pueden parecer datos inconsistentes | Permitirlos de forma deliberada hasta que exista una identidad y fuente persistente para padres. |
| La referencia no define el estado móvil ni los errores | Verificar el modal en `390x844` y usar los patrones accesibles existentes del proyecto. |

## Lo que no está en este spec

- Envío de correos o notificaciones reales.
- Integración con activación de cuenta.
- API, base de datos, Server Actions o persistencia local.
- Códigos de invitación dinámicos o con vencimiento real.
- Validación remota de emails o códigos.
- Prevención, edición o eliminación de vínculos duplicados.
- Activación de cuentas de padres.
- Cambios a la experiencia de familia.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
