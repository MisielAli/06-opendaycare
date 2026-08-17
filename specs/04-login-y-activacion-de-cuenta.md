# Spec 04 — Login y activación de cuenta (mock)

**Estado:** Aprovado
**Depende de:** SPEC 01
**Fecha:** 2026-08-17

**Objetivo:** Implementar las pantallas `login.dc.html` y `activar-cuenta.dc.html` como formularios mock interactivos en `/login` y `/activate-account`, sin autenticación real ni persistencia.

## Alcance

**Incluye:**

- Página de login en `/login`, basada visualmente en `references/pantallas/login.dc.html`
- Eliminación completa del selector "Personal" / "Familia" y del encabezado "INGRESO COMO"
- Panel promocional coral con marca, mensaje y nombre de la guardería en escritorio
- Formulario de login con email precargado `caro@opendaycare.com`, contraseña vacía, validación local y botón "Iniciar sesión"
- Navegación a `/` después de enviar un email válido y una contraseña no vacía
- Botón visual "¿Olvidaste tu contraseña?" sin navegación ni recuperación funcional
- Enlace "Activá tu cuenta" desde `/login` hacia `/activate-account`
- Página de activación en `/activate-account`, basada visualmente en `references/pantallas/activar-cuenta.dc.html`
- Invitación estática para Mateo de Sala Soles con código `7K4P9` y email `lucia.fernandez@gmail.com`
- Código, email y contraseña editables; consentimiento de fotos interactivo e inicialmente marcado
- Validación local de código requerido, email válido, contraseña requerida y consentimiento obligatorio
- Navegación a `/login` después de enviar correctamente el formulario de activación
- Enlace "Iniciar sesión" desde `/activate-account` hacia `/login`
- Mensajes de error breves en español debajo de cada campo inválido, con asociación accesible entre control y mensaje
- Navegación por teclado y estados de foco visibles para todos los controles interactivos
- Responsive para ambas páginas; el panel promocional del login se oculta en viewports angostos y los formularios permanecen utilizables sin desbordes
- Datos, validaciones y navegación completamente locales, sin esperas ni estados de carga asíncronos

**No incluye:**

- Autenticación, sesiones, cookies, tokens o protección de rutas
- Base de datos, API, Server Actions o integración con servicios externos
- Persistencia en `localStorage`, `sessionStorage` o cualquier otro medio
- Selector de tipo de usuario Personal/Familia
- Feed o experiencia para familias
- Recuperación o restablecimiento de contraseña
- Validación remota del código de invitación o comprobación de credenciales
- Reglas de complejidad o longitud mínima para las contraseñas

## Modelo de datos

Esta funcionalidad no introduce estructuras de datos persistentes ni modifica los datos de SPEC 01. Los formularios usan únicamente estado local y efímero en sus componentes cliente.

Valores mock iniciales:

```ts
const loginDefaults = {
  email: "caro@opendaycare.com",
  password: "",
};

const activationDefaults = {
  invitationCode: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "contraseña",
  photoConsent: true,
};
```

Datos estáticos visibles de la invitación:

- Niño: `Mateo`
- Sala: `Sala Soles`
- Inicial del avatar: `M`

Reglas locales:

- Login válido: email con formato válido y contraseña no vacía
- Activación válida: código no vacío, email con formato válido, contraseña no vacía y consentimiento marcado
- Cualquier email y contraseña que cumplan las reglas locales se consideran válidos; no se comparan con credenciales fijas
- Ningún valor sobrevive a una recarga o navegación

## Estructura de componentes

```text
app/(auth)/
├── login/page.tsx
└── activate-account/page.tsx

components/auth/
├── LoginForm.tsx
├── ActivateAccountForm.tsx
└── BrandMark.tsx
```

Criterios:

- `app/(auth)/login/page.tsx` contiene el layout de dos columnas y el panel promocional; no usa el sidebar de `app/(staff)/layout.tsx`
- `app/(auth)/activate-account/page.tsx` contiene el layout centrado y la tarjeta estática de invitación; no usa el sidebar de staff
- `LoginForm.tsx` y `ActivateAccountForm.tsx` son client components y concentran únicamente estado, validación y navegación de sus formularios
- `BrandMark.tsx` contiene el icono solar reutilizado por las dos pantallas nuevas
- Las páginas conservan el layout visual en server components y delegan solo la interacción a los formularios cliente
- Los enlaces entre rutas internas usan `Link` de `next/link`
- Las navegaciones posteriores al submit usan el router de Next.js y no recargan el documento completo
- Los nombres de componentes, variables y funciones están en inglés; el texto visible y los errores están en español

## Plan de implementación

1. Crear `components/auth/BrandMark.tsx` con el icono solar compartido y las propiedades visuales mínimas necesarias para usarlo sobre ambos fondos.
2. Crear `components/auth/LoginForm.tsx` con campos controlados, valores iniciales mock, validación accesible, botón de recuperación sin acción, enlace a activación y navegación a `/` al enviar datos válidos.
3. Crear `app/(auth)/login/page.tsx` con el panel promocional y el contenedor del formulario, eliminar el selector Personal/Familia y ocultar el panel coral en viewports angostos.
4. Crear `components/auth/ActivateAccountForm.tsx` con código, email, contraseña y consentimiento controlados, validación accesible, enlace al login y navegación a `/login` al enviar datos válidos.
5. Crear `app/(auth)/activate-account/page.tsx` con la marca, textos y tarjeta estática de Mateo y Sala Soles, manteniendo el formulario centrado y sin desbordes en móvil.
6. Ajustar únicamente los tokens de `app/globals.css` que sean necesarios y reutilizables para reproducir los colores de las referencias; usar valores locales cuando un color sea exclusivo de un elemento.
7. Verificar manualmente ambos flujos, capturar las dos rutas en escritorio y móvil dentro de `.playwright-mcp/`, y ejecutar `npm run lint` y `npx tsc --noEmit`.

## Criterios de aceptación

- [ ] `/login` renderiza sin el sidebar de staff y reproduce la estructura, tipografía, colores y espaciado de `references/pantallas/login.dc.html`
- [ ] `/login` no muestra "INGRESO COMO", "Personal", "Familia" ni ningún selector de rol
- [ ] En escritorio, `/login` muestra el panel coral con la marca OpenDayCare, el mensaje principal y "Guardería Sala Soles"
- [ ] En un viewport de `390x844`, el panel coral está oculto y el formulario de login cabe en pantalla sin scroll horizontal
- [ ] El email del login inicia con `caro@opendaycare.com` y la contraseña inicia vacía
- [ ] Enviar el login con email vacío o inválido, o con contraseña vacía, mantiene al usuario en `/login` y muestra el error correspondiente debajo de cada campo inválido
- [ ] Enviar el login con un email válido y una contraseña no vacía navega a `/` sin recargar el documento completo
- [ ] "¿Olvidaste tu contraseña?" se muestra como botón y no navega ni modifica la URL
- [ ] "Activá tu cuenta" usa `Link` y navega de `/login` a `/activate-account`
- [ ] `/activate-account` reproduce la estructura, tipografía, colores, espaciado y textos de `references/pantallas/activar-cuenta.dc.html`
- [ ] La tarjeta de invitación muestra la inicial `M`, Mateo y Sala Soles
- [ ] El formulario de activación inicia con código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña mock y consentimiento marcado
- [ ] Código, email, contraseña y consentimiento se pueden modificar localmente
- [ ] Enviar la activación con código vacío, email vacío o inválido, contraseña vacía o consentimiento desmarcado mantiene al usuario en `/activate-account` y muestra el error correspondiente junto al control inválido
- [ ] Enviar una activación válida navega a `/login` sin guardar datos y sin recargar el documento completo
- [ ] "Iniciar sesión" usa `Link` y navega de `/activate-account` a `/login`
- [ ] En un viewport de `390x844`, la activación conserva su jerarquía visual, todos los controles son visibles y no existe scroll horizontal
- [ ] Todos los campos tienen una etiqueta asociada; los errores se relacionan mediante atributos accesibles y los controles interactivos muestran foco visible
- [ ] Ambos formularios se pueden completar y enviar usando únicamente el teclado
- [ ] Las capturas de `/login` y `/activate-account` en `1440x900` y `390x844` se guardan en `.playwright-mcp/` y se comparan con las referencias
- [ ] La consola del navegador no muestra errores al cargar, validar o navegar desde las dos pantallas
- [ ] `npm run lint` y `npx tsc --noEmit` finalizan sin errores
- [ ] La implementación no usa base de datos, API, Server Actions, almacenamiento local, cookies ni autenticación real

## Decisiones tomadas y descartadas

- **Sí:** rutas `/login` y `/activate-account` — mantienen URLs en inglés, consistentes con `/kids`
- **No:** ruta `/activar-cuenta` — mezcla idiomas entre las rutas existentes
- **Sí:** eliminar el selector Personal/Familia — esta fase solo representa un único ingreso mock
- **No:** conservar el selector como elemento deshabilitado — agrega una decisión de rol que el alcance excluye explícitamente
- **Sí:** validación local y navegación mock — permite probar los formularios de extremo a extremo sin introducir autenticación
- **No:** formularios exclusivamente visuales — impedirían verificar estados inválidos y navegación
- **Sí:** navegar a `/` después del login — reutiliza el feed staff implementado en SPEC 01
- **Sí:** volver a `/login` después de activar — completa el flujo disponible sin inventar un feed familiar
- **No:** navegar a un feed familiar — esa pantalla todavía no existe y requiere su propio spec
- **Sí:** código y email precargados pero editables — conserva la referencia visual y permite probar sus validaciones
- **Sí:** consentimiento inicialmente marcado — reproduce el mockup, pero puede desmarcarse para verificar el estado inválido
- **Sí:** código y contraseña únicamente requeridos — no existe una política de formato o complejidad definida
- **No:** aceptar únicamente `7K4P9` o exigir ocho caracteres — simularía reglas de negocio que todavía no existen
- **Sí:** errores debajo de cada campo — mantienen contexto y permiten asociarlos accesiblemente al control
- **Sí:** páginas de layout y formularios cliente separados — limita JavaScript cliente al estado y las interacciones
- **No:** páginas cliente completas — mezclarían el layout estático con el estado sin una necesidad concreta
- **No:** descomponer cada campo, botón y panel en componentes independientes — sería una abstracción prematura para dos formularios pequeños
- **Sí:** `BrandMark.tsx` como única pieza visual compartida inicial — evita duplicar el mismo SVG entre las dos pantallas
- **Sí:** ocultar el panel promocional del login en móvil — prioriza el acceso directo al formulario y evita una pantalla excesivamente larga
- **Sí:** mantener recuperación de contraseña como botón visual sin acción — conserva el diseño sin crear un flujo fuera de alcance

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los formularios mock pueden interpretarse como autenticación real | Documentar y verificar que no existen sesiones, persistencia, llamadas de red ni protección de rutas. |
| El login permite entrar con cualquier dato localmente válido | Mantener esta regla explícita y reemplazarla únicamente cuando exista un spec de autenticación. |
| El flujo de activación no llega al feed familiar mostrado por la referencia | Navegar a `/login` y dejar la experiencia familiar para un spec independiente. |
| Las referencias no incluyen diseños móviles | Aplicar el comportamiento responsive acordado y verificarlo con capturas en `390x844`. |
| El renderizado de fuentes puede producir diferencias menores frente al HTML de referencia | Reutilizar Fredoka y Nunito ya configuradas y comparar capturas en viewports equivalentes. |

## Lo que no está en este spec

- Autenticación real o autorización
- Protección del feed en `/`
- Sesiones, cookies o tokens
- API, base de datos o persistencia local
- Roles Personal/Familia
- Feed familiar
- Recuperación de contraseña
- Invitaciones reales y validación remota de códigos
- Políticas definitivas de contraseña

Cada una de estas funcionalidades requiere su propio spec si se incorpora posteriormente.
