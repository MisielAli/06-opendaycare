# Spec 05 — Modal Agregar niño en /kids

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 03
> **Fecha:** 2026-08-17

> **Objetivo:** Agregar un modal de alta de niños en `/kids`, basado en `references/pantallas/agregar-nino.dc.html`, que valide localmente nombre, fecha de nacimiento y sala, guarde registros temporales en memoria y presente la lista agrupada por sala sin persistencia real.

## Alcance

**Incluye:**

- Botón `+ Agregar niño` en `/kids` que abre un modal con overlay centrado, foco contenido y cierre por Cancelar, Escape y clic en el fondo.
- Campos Nombre completo, Fecha de nacimiento, Sala, Alergias y Notas médicas, con los mismos pesos visuales del mockup.
- Nombre completo, Fecha de nacimiento y Sala como obligatorios; Alergias y Notas médicas como opcionales.
- Máscara visible de fecha en formato `dd/mm/aaaa` y validación de fecha real, existente y no futura.
- Selector de Sala con las opciones mock Soles, Luna y Estrellas, comenzando sin selección para exigir una elección explícita.
- Mensajes de error requeridos debajo de cada campo obligatorio solo al intentar Guardar, desapareciendo al corregir.
- Cierre inmediato del modal al enviar un formulario válido.
- Inserción del niño nuevo en memoria dentro de su sala, como primer ítem del grupo.
- Lista en `/kids` reorganizada por secciones SALA SOLES, SALA LUNA y SALA ESTRELLAS con conteos dinámicos, ocultando salas sin niños.
- Tarjetas de niños creados en memoria sin enlace de navegación, manteniendo el mismo aspecto de las tarjetas existentes.
- Generación automática de datos requeridos por la tarjeta: ID temporal, mes y año de ingreso, avatar por inicial y vínculos vacíos.
- Badge de alergias normalizado con valores separados por comas, único por tarjeta, visible solo si existen alergias.
- Limpieza automática del buscador al Guardar para que el niño nuevo quede visible.
- Homónimos permitidos sin validación de duplicados.
- Responsive con overlay, contenido desplazable y formulario usable sin desbordes en viewports angostos.
- Navegación por teclado y estados de foco accesibles en todos los controles del modal.
- Coherencia visual con los tokens de `app/globals.css` y la identidad ya definida en `/kids`.

**No incluye:**

- Base de datos, API, Server Actions o integraciones con servicios externos.
- Persistencia en localStorage, sessionStorage ni ningún otro medio.
- Creación de perfil temporal para `/kids/[id]` ni edición de niños existentes.
- Validación de duplicados por nombre, apellido, fecha o sala.
- Reordenamiento alfabético de la lista ni del agrupamiento por sala.
- Selección de fecha con componente nativo del navegador.
- Toasts, banners, mensajes fuera del formulario o estados de carga.
- Edición de los datos de sala existentes ni migración de los datos mock actuales.
- Lado familia/padres.
- Cambios visuales fuera del alcance del modal y del agrupamiento por sala.

## Modelo de datos

El feature introduce estructuras derivadas y temporales en `app/lib/kids.ts`, preparadas para reemplazarse por una fuente persistente futura.

```ts
export type RoomName = "Soles" | "Luna" | "Estrellas";

export interface RoomOption {
  name: RoomName;
}

export const roomOptions: RoomOption[];
```

El `Kid` existente se mantiene y el componente de listado ahora agrupa por `kid.room`. Para niños creados desde el modal se usan valores derivados:

```ts
export interface AddKidFormValues {
  fullName: string;
  birthDate: string;
  room: RoomName | "";
  allergyTags: string;
  medicalNotes: string;
}

export interface TempKid extends Kid {
  createdAt: Date;
}
```

Reglas de construcción del `TempKid`:

- `id`: prefijo `temp-` seguido de un sello temporal, sin depender del nombre.
- `room`: valor seleccionado en el formulario.
- `birthDate`: conversión de `dd/mm/aaaa` a ISO `yyyy-mm-dd`.
- `enrollmentLabel`: mes y año actuales en español, por ejemplo `ago 2026`.
- `avatarColor`: valor constante del proyecto para niños nuevos.
- `avatarTextColor`: valor constante del proyecto para niños nuevos.
- `parents`: arreglo vacío.
- `allergyLabel`: primer valor normalizado, si existe.
- `allergyNotes`: valor del campo Notas médicas si fue completado.
- `createdAt`: sello de momento de guardado, para pruebas y depuración.

Valores mock requeridos:

```ts
const fallbackAvatar = {
  avatarColor: "#F2937A",
  avatarTextColor: "#8B3A24",
};

const fallbackEnrollmentDate = new Date();
```

Si `fullName` está vacío, se usa un nombre visible temporal consistente para desarrollo: `Niño sin nombre`.

## Estructura de componentes

```text
components/kids/
├── AddKidModal.tsx
└── ...existentes

app/(staff)/kids/
└── page.tsx
```

Criterios:

- `AddKidModal.tsx` es un client component que gestiona el formulario, validación, cierre, foco y devolución de datos válidos.
- `KidsBrowser.tsx` recibe un prop de apertura del modal y agrupa la lista por sala.
- `KidCard.tsx` acepta una variante sin navegación para niños en memoria sin perder el estilo base.
- `app/(staff)/kids/page.tsx` mantiene la carga de datos existente y la composición del header con el botón activador.
- Los textos visibles del modal están en español y los nombres de componentes, props y funciones están en inglés.

## Plan de implementación

1. Agregar a `app/lib/kids.ts` los tipos `RoomName`, `RoomOption`, `AddKidFormValues`, `TempKid`, el array `roomOptions` y los valores constantes requeridos para niños temporales.
2. Crear `components/kids/AddKidModal.tsx` con overlay, foco contenido, Escape, cierre por fondo, validación por Guardar, máscara de fecha, selector de sala obligatorio y devolución del formulario válido al componente padre.
3. Actualizar `components/kids/KidCard.tsx` para aceptar una opción de navegación deshabilitada y conservar su apariencia y badges actuales.
4. Actualizar `components/kids/KidsBrowser.tsx` para manejar niños en memoria, agrupar por sala, ordenar dentro de cada sala por fecha de inserción y limpiar la búsqueda al recibir un nuevo niño.
5. Actualizar `app/(staff)/kids/page.tsx` para mantener el estado de niños, controlar la apertura del modal y pasar el formulario guardado hacia `KidsBrowser`.
6. Verificar manualmente el flujo completo, el responsive, la accesibilidad del teclado, la ausencia de errores en consola, y ejecutar `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [x] El botón `+ Agregar niño` en `/kids` abre un overlay centrado y bloquea la interacción con el fondo.
- [x] El modal muestra exactamente los campos Nombre completo, Fecha de nacimiento, Sala, Alergias y Notas médicas.
- [x] El modal abre con el foco en Nombre completo y mantiene el foco dentro del diálogo.
- [x] Escape, Cancelar y clic en el fondo oscurecido cierran el modal y devuelven el foco al botón que lo abrió.
- [x] Sala inicia sin selección y muestra un estado requerido hasta que el usuario elija Soles, Luna o Estrellas.
- [x] La máscara de fecha muestra siempre el formato `dd/mm/aaaa`.
- [x] No se acepta una fecha vacía, incompleta, inexistente ni futura.
- [x] El formulario solo valida al pulsar Guardar.
- [x] Cada campo obligatorio sin valor válido muestra un mensaje de error directamente debajo del control.
- [x] Al corregir un campo con error, el mensaje correspondiente desaparece.
- [x] Guardar con formulario válido cierra el modal y agrega el niño nuevo a la lista.
- [x] El niño nuevo aparece primero dentro de la sección de su sala.
- [x] La lista muestra secciones SALA SOLES, SALA LUNA y SALA ESTRELLAS con conteos dinámicos.
- [x] Las secciones de salas vacías no se renderizan.
- [x] La tarjeta del niño nuevo conserva el mismo estilo que las tarjetas existentes.
- [x] La tarjeta del niño nuevo no navega a `/kids/[id]`.
- [x] La tarjeta muestra badge de alergias normalizado si el usuario ingresó al menos una alergia.
- [x] La tarjeta muestra `ingreso ago 2026` u otro mes actual según la fecha de alta.
- [x] La tarjeta muestra `0 padres vinculados`.
- [x] Si el usuario tenía un filtro activo, Guardar lo limpia y deja visible al niño nuevo.
- [x] Los homónimos se aceptan sin validación de duplicados.
- [x] El formulario permite completar todos los campos usando solo el teclado.
- [x] El modal se mantiene usable en viewports angostos sin desbordes horizontales.
- [x] La consola del navegador no muestra errores al abrir, validar, guardar o cerrar el modal.
- [x] `npm run lint` y `npx tsc --noEmit` finalizan sin errores.
- [x] La implementación no guarda datos en base de datos, API, almacenamiento local ni cookies.

## Decisiones tomadas y descartadas

- **Sí:** persistencia solo en memoria por ahora — permite validar el flujo de UI y quedarse preparado para una DB futura.
- **No:** localStorage — evita crear un contrato de persistencia que todavía no corresponde.
- **Sí:** campos cinco, con tres obligatorios — respeta el mockup y da utilidad inmediata sin sobrecargar el formulario.
- **No:** modal de solo tres campos — dejaba fuera alergias y notas que aparecen en la referencia.
- **Sí:** máscara de fecha y validación real — ofrece una experiencia controlada sin depender del componente nativo del navegador.
- **No:** input nativo de fecha — no reproduce la presentación del mockup ni la máscara solicitada.
- **Sí:** sin selección inicial en Sala — hace explícito que es obligatorio y permite probar el error requerido.
- **No:** Sala preseleccionada en Soles — disfrazaba un campo obligatorio y ocultaba el estado de error inicial.
- **Sí:** overlay centrado con cierre por fondo, Escape y Cancelar — mejora la usabilidad y se aproxima a un diálogo accesible real.
- **No:** drawer o página sin fondo — se aleja del mockup y complica la interacción en móvil.
- **Sí:** niños temporales sin enlace — evita crear un perfil mock sin fuente de datos estable.
- **No:** perfil temporal en `/kids/[id]` — duplicaría lógica de renderizado y saldría del alcance acordado.
- **Sí:** agrupar por sala — es la única manera visible de integrar niños de múltiples salas mock sin romper el layout existente.
- **No:** mantener una sola sección con badge de sala en cada tarjeta — no resolvía la presentación de varias salas.
- **Sí:** insertar el niño nuevo primero dentro de su sala — garantiza visibilidad inmediata en el test manual.
- **No:** orden alfabético — agregaba reordenamiento extra sin un beneficio claro en esta etapa.
- **Sí:** limpiar búsqueda al guardar — evita que el filtro deje oculto al niño recién agregado.
- **No:** conservar búsqueda activa — podía impedir la verificación del resultado sin una regla clara de negocio.
- **Sí:** permitir homónimos — los nombres duplicados son válidos y el futuro modelo con ID real resuelve la identidad.
- **No:** rechazar duplicados — requeriría reglas de comparación, normalización y mensajes adicionales sin un beneficio real aún.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los niños en memoria desaparecen al recargar | Documentar que es comportamiento esperado hasta la integración con persistencia real. |
| El agrupamiento por sala puede confundir si se agregan salas mock futuras | Mantener las tres salas explícitas y ocultar secciones vacías. |
| La máscara de fecha puede frustrar a usuarios avanzados | Ofrecer una experiencia uniforme y dejar anotada la opción de input nativo para specs posteriores si se requiere. |
| Las tarjetas sin navegación pueden interpretarse como enlace roto | Mantener el mismo estilo pero sin semántica de enlace ni Pointer en la tarjeta. |

## Lo que no está en este spec

- Perfil temporal para `/kids/[id]`.
- Edición o eliminación de niños.
- Persistencia o sincronización con backend.
- Validación de duplicados por nombre u otros campos.
- Selección de fecha con componente nativo del navegador.
- Toasts, banners ni mensajes fuera del formulario.
- Migración de los 8 niños existentes a un esquema persistente.
- Integración con autenticación, API o base de datos.

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
