---
description: Audita y corrige accesibilidad WCAG 2.2 AA en archivos indicados
agent: accessibility-checker
---

Audita los archivos indicados por `$ARGUMENTS` con el agente `accessibility-checker`.

Acepta rutas exactas (`components/feed/PostCard.tsx`), globs (`components/**/*.tsx`, `app/**/page.tsx`) o directorios (`components/`, `app/`). Sigue todo el flujo obligatorio del agente: resuelve archivos con `glob`, verifica WCAG 2.2 AA con Context7 (MDN/WCAG/axe-core), audita cada archivo, corrige con el cambio minimo y reporta tabla con evidencia por criterio.

Si no se indica ningun archivo, pregunta cual auditar. No audites todo el repo sin confirmacion.
