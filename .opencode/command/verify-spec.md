---
description: Verifica, corrige y marca los criterios de aceptacion de un spec.
agent: spec-verifier
---

Verifica el archivo de especificacion indicado por `$ARGUMENTS`.

Acepta un numero de spec, una ruta dentro de `specs/` o un fragmento de nombre. Sigue todo el flujo obligatorio del agente `spec-verifier`: comprueba individualmente cada criterio de aceptacion, corrige la implementacion cuando sea necesario, vuelve a verificar y marca solo los checks respaldados por evidencia.
