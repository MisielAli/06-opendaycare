# Spec 02 — Niños: lista y perfil (estático)

**Estado:** Aprovado
**Depende de:** SPEC 01
**Fecha:** 2026-08-17

**Objetivo:** Implementar las pantallas `ninos.dc.html` y `perfil-nino.dc.html` como páginas estáticas bajo `/kids` y `/kids/[id]`, visualmente idénticas a los mockups proporcionados.

## Alcance

**Incluye:**

- Lista en `/kids`: encabezado GESTIÓN/Niños, botón "Agregar niño", buscador funcional, separador "SALA SOLES · 8 niños" y grilla de dos columnas con los 8 niños del mockup
- Badges en las tarjetas: MANÍ o LACTOSA para alergias, VINCULAR para niños sin padres vinculados y chevron en los demás casos
- Buscador client-side que filtra por nombre y muestra un mensaje vacío simple cuando no hay coincidencias
- Perfil dinámico en `/kids/[id]`, con rutas estáticas como `/kids/0001`: avatar, nombre, edad calculada, panel de alergias, datos del niño, botón "Resumen del día", padres vinculados, estados ACTIVA/PENDIENTE, acción "Vincular otro padre" y enlace "Volver a Niños"
- Datos estáticos de los 8 niños en `app/lib/kids.ts`: Mateo fiel al mockup y los demás con datos plausibles derivados de la lista
- Edad calculada desde `birthDate` mediante un helper compartido con singular y plural correctos
- Item "Niños" activo en el sidebar existente de `app/(staff)/layout.tsx`
- Responsive simple: grilla de una columna y perfil apilado en viewports angostos

**No incluye:**

- Páginas funcionales para "Agregar niño", "Editar", "Resumen del día" o "Vincular otro padre"
- Formulario para agregar o editar niños
- Flujo para vincular padres
- Base de datos, API o persistencia
- Lado familia/padres

## Modelo de datos

`app/lib/kids.ts`:

```ts
export type ParentStatus = "active" | "pending";

export interface ParentLink {
  name: string;
  roleLabel: string;
  status: ParentStatus;
  avatarColor: string;
}

export interface Kid {
  id: string;              // "0001"..."0008"; se usa en la URL /kids/[id]
  name: string;
  birthDate: string;       // ISO: "2022-03-12"
  room: string;
  enrollmentLabel: string;
  allergyLabel?: string;
  allergyNotes?: string;
  avatarColor: string;
  avatarTextColor: string;
  parents: ParentLink[];
}

export const kids: Kid[];

export function getAgeLabel(birthDate: string): string;
export function formatBirthDate(birthDate: string): string;

export const parentStatusLabels: Record<ParentStatus, string> = {
  active: "ACTIVA",
  pending: "PENDIENTE",
};
```

Convenciones:

- Los IDs son strings numéricos con padding (`"0001"`, `"0002"`, etc.) y no dependen del nombre del niño
- `getAgeLabel` calcula la edad desde `birthDate` y devuelve "1 año" o "N años"
- `formatBirthDate` transforma la fecha ISO al formato visible del mockup, por ejemplo "12 mar 2022"
- El badge de la tarjeta se deriva de los datos: `allergyLabel` tiene prioridad; si no existe y `parents.length === 0`, se muestra VINCULAR; en los demás casos se muestra un chevron
- Los nombres de tipos, campos, variables y funciones están en inglés; el texto visible para el usuario está en español

## Estructura de componentes

```text
components/kids/
├── KidsBrowser.tsx   # client component: buscador, filtro, grilla y mensaje vacío
├── KidCard.tsx       # tarjeta de la lista
├── AllergyAlert.tsx  # panel "Alergias y notas" del perfil
└── ParentsPanel.tsx  # padres vinculados, estados y acción de vinculación
```

Criterios:

- `KidsBrowser.tsx` es el único client component nuevo y recibe los datos como props
- `KidCard.tsx`, `AllergyAlert.tsx` y `ParentsPanel.tsx` son componentes de presentación
- Las filas de nacimiento, sala e ingreso permanecen en la página de perfil porque no requieren reutilización
- Se reutilizan el layout y los componentes compartidos creados en SPEC 01 cuando correspondan

## Plan de implementación

1. **Datos:** crear `app/lib/kids.ts` con los 8 niños, IDs `"0001"` a `"0008"`, padres vinculados y helpers de fecha y edad
2. **Lista:** crear `components/kids/KidCard.tsx`, `components/kids/KidsBrowser.tsx` y `app/(staff)/kids/page.tsx` con la estructura visual de `ninos.dc.html`
3. **Perfil:** crear `components/kids/AllergyAlert.tsx`, `components/kids/ParentsPanel.tsx` y `app/(staff)/kids/[id]/page.tsx` con la estructura visual de `perfil-nino.dc.html`, `generateStaticParams` y `notFound()` para IDs inexistentes
4. **Responsive:** adaptar la grilla a una columna y apilar el perfil en viewports angostos, manteniendo el comportamiento móvil del sidebar definido en SPEC 01
5. **Verificación:** ejecutar `npm run dev`, comparar capturas de `/kids` y `/kids/0001` contra los mockups en `.playwright-mcp/`, y ejecutar `npm run lint` y `npx tsc --noEmit`

## Criterios de aceptación

- [ ] `/kids` renderiza el encabezado, buscador, separador "SALA SOLES · 8 niños" y los 8 niños del mockup en una grilla de dos columnas
- [ ] Cada tarjeta muestra avatar con inicial y colores, nombre, edad calculada, cantidad de padres vinculados y el badge o chevron correspondiente
- [ ] Mateo muestra MANÍ, Valentina muestra VINCULAR, Tomás muestra LACTOSA y los demás muestran chevron
- [ ] La edad se calcula desde `birthDate`; no existen etiquetas de edad hardcodeadas en los datos
- [ ] El cálculo usa la fecha actual y maneja correctamente "1 año" y "N años", aunque el resultado difiera del texto histórico del mockup
- [ ] Escribir en el buscador filtra por nombre en tiempo real y una búsqueda sin coincidencias muestra un mensaje vacío simple
- [ ] El hover de cada tarjeta cambia el borde a `#F2A78E` y aplica `translateY(-2px)`
- [ ] El item "Niños" aparece activo en el sidebar con fondo `#FBE3D8` y texto `#D9583C`
- [ ] `/kids/0001` reproduce el perfil de Mateo del mockup: avatar de 84 px, alerta de alergia con el texto exacto, fecha "12 mar 2022", sala "Soles", ingreso "feb 2025", botón "Resumen del día", Lucía ACTIVA, Diego PENDIENTE, acción "Vincular otro padre" y enlace "Volver a Niños"
- [ ] Los otros 7 IDs renderizan perfiles completos con sus datos y un ID inexistente responde con 404
- [ ] Los botones y enlaces a pantallas fuera de alcance mantienen la apariencia del mockup sin navegación funcional
- [ ] En viewport angosto la grilla usa una columna y el panel derecho del perfil se apila debajo de los datos principales
- [ ] Las capturas de `/kids` y `/kids/0001` se guardan en `.playwright-mcp/` y se comparan lado a lado con los mockups
- [ ] `npm run lint` y `npx tsc --noEmit` pasan sin errores
- [ ] No hay base de datos ni llamadas a API
- [ ] Los identificadores están en inglés y el texto visible está en español

## Decisiones tomadas y descartadas

- **IDs numéricos con padding** (`"0001"`) y no slugs derivados del nombre — evitan colisiones entre homónimos y producen URLs simples como `/kids/0001`; superar cuatro dígitos no requiere cambios
- **No UUIDs** — garantizan unicidad, pero agregan URLs largas sin aportar valor en esta fase estática
- **No slugs de nombre** — son legibles, pero pueden colisionar entre homónimos y cambiar si se corrige el nombre
- **Edad calculada desde `birthDate`** y no etiqueta estática — prepara el flujo para datos reales y evita mantener edades manualmente
- **Se acepta que la edad calculada difiera del mockup** — Mateo nació el 12 de marzo de 2022 y el texto histórico de "3 años" deja de ser correcto con el paso del tiempo
- **Rutas `/kids` y `/kids/[id]` con `generateStaticParams`** — permiten generar una página estática por cada niño sin introducir API o base de datos
- **Buscador funcional** y no solo visual — el input ya forma parte del mockup y el filtrado client-side tiene un alcance limitado
- **Datos completos para los 8 niños** y no solo para Mateo — todas las tarjetas deben navegar a un perfil válido
- **Links visuales sin destino** — mantiene la fidelidad de los mockups sin incorporar páginas fuera de alcance, siguiendo el criterio de SPEC 01
- **Mensaje vacío simple** — el mockup no define el estado sin resultados y no se introduce un diseño adicional complejo
- **Responsive con colapso simple** — no existe mockup móvil; se prioriza evitar desbordes y conservar la jerarquía visual

## Riesgos

- La edad calculada cambia con el tiempo y no coincide literalmente con el texto histórico del mockup; la aceptación valida el cálculo correcto, no el número estático
- Los datos completos de 7 perfiles no están definidos en los mockups y serán plausibles hasta que exista una fuente real
- "Idéntico al mockup" puede producir diferencias menores por renderizado de fuentes o viewport; se mitiga con capturas lado a lado en dimensiones equivalentes

## Lo que no está en este spec

- Agregar o editar niños
- Vincular padres
- Resumen del día
- Persistencia, API o base de datos
- Lado familia/padres

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
