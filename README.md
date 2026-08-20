# OpenDaycare

Daycare-center app with staff and family/parent sides. Built with Next.js App Router.

## Requisitos previos

| Herramienta | Versión verificada | Notas |
|---|---|---|
| Node.js | 22.17.0 (recomendado 20+) | `node --version` |
| npm | 10.9.2 | `npm --version` |
| Docker Desktop | 29.x | Requerido para `supabase start` (Postgres, Auth, Storage, etc. corren en contenedores). Debe estar corriendo antes de iniciar el stack local. |
| Supabase CLI | 2.115.0 via `npx` | No requiere instalación global. Se usa con `npx supabase ...` |

> No es necesario instalar Supabase CLI globalmente. El repo usa `npx supabase` que descarga la versión pinned automáticamente.

## Levantar el proyecto (quick start)

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd 06-opendaycare
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores (ver sección siguiente)

# 3. Levantar Supabase local (requiere Docker corriendo)
npx supabase start

# 4. Levantar Next.js
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Variables de entorno

`.env.example` (`app:1`) define:

```
SUPABASE_DB_PASSWORD=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
```

- Copiar a `.env.local` (Next.js carga `.env.local` por defecto, está ignorado por `.gitignore:35`).
- Para desarrollo local con `npx supabase start`, obtener los valores con:

  ```bash
  npx supabase status
  # o en formato env:
  npx supabase status -o env --override-name api.url=NEXT_PUBLIC_SUPABASE_URL
  ```

  Mapeo típico local:

  | Variable | Valor local por defecto |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
  | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `anon` key de `npx supabase status` |
  | `NEXT_PUBLIC_APP_URL` | `http://127.0.0.1:3000` |
  | `SUPABASE_DB_PASSWORD` | password seteado al hacer `supabase link` (solo necesario para `link`/`db push` remoto) |
  | `RESEND_API_KEY` | API key de [Resend](https://resend.com) para emails |

- Para entorno remoto (proyecto linkeado), copiar los valores desde **Supabase Dashboard > Project Settings > API**.

> Nunca commitear `.env.local` ni exponer `service_role` / `secret` keys en código de browser (`NEXT_PUBLIC_*` se envía al cliente).

## Scripts

- `npm run dev` — dev server con Turbopack en http://localhost:3000
- `npm run build` / `npm start` — build y start de producción
- `npm run lint` — ESLint (`eslint-config-next`)
- `npx tsc --noEmit` — type checker (no hay script `test` configurado)

## Supabase CLI — instalación y uso

### 1. Verificar / actualizar

```bash
npx supabase --version        # 2.115.0
npx supabase --help           # lista todos los comandos
npx supabase <grupo> --help   # ej: npx supabase db --help
```

Descubrir comandos siempre con `--help` — la estructura cambia entre versiones.

### 2. Autenticación (acceso a proyecto remoto)

El CLI necesita un Personal Access Token (PAT) para operaciones remotas (`link`, `db push`, `projects list`, etc.). El stack local (`start`/`stop`/`status`) **no** requiere login.

**Opción A — flujo interactivo (abre navegador):**

```bash
npx supabase login
```

Abre `https://supabase.com/dashboard` para autorizar el CLI. El token se guarda localmente (`~/.supabase/access-token` en Windows: `%USERPROFILE%\.supabase\access-token`).

**Opción B — con token explícito (CI / headless):**

1. Generar PAT en **Supabase Dashboard > Account > Access Tokens** (`https://supabase.com/dashboard/account/tokens`).
2. Ejecutar:

   ```bash
   npx supabase login --token <tu-personal-access-token>
   # opcional: nombrar el perfil
   npx supabase login --token <token> --name opendaycare
   ```

Verificar sesión:

```bash
npx supabase projects list
```

Cerrar sesión:

```bash
npx supabase logout
```

### 3. Linkear el proyecto remoto

El `project_id` local es `06-opendaycare` (`supabase/config.toml:5`) y el project ref remoto configurado para el MCP es `wqomryhtgwjqlqpgbidm`.

```bash
# requiere login previo y Docker no necesario
npx supabase link --project-ref wqomryhtgwjqlqpgbidm
# te pedirá el DB password (SUPABASE_DB_PASSWORD)

# Alternativa en un solo comando:
npx supabase link --project-ref wqomryhtgwjqlqpgbidm -p <db-password>

# Linkear un branch de preview (si usas branching):
npx supabase link my-branch
```

Esto crea `supabase/.temp/` y guarda el ref. Desvincular con `npx supabase unlink`.

### 4. Stack local (desarrollo)

```bash
# Levantar todo (postgres, auth, storage, realtime, studio, edge-runtime...)
npx supabase start

# Ver URLs y keys locales
npx supabase status
npx supabase status -o env

# Parar
npx supabase stop

# Resetear DB (re-ejecuta migrations + supabase/seed.sql)
npx supabase db reset

# Ver diff entre local y remoto y generar migración
npx supabase db diff -f <nombre_descriptivo>

# Crear migración vacía a mano (flujo imperativo)
npx supabase migration new <nombre>
npx supabase migration list --local
```

**Puertos locales por defecto** (`supabase/config.toml`):

| Servicio | URL |
|---|---|
| API (PostgREST) | http://127.0.0.1:54321 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio | http://127.0.0.1:54323 |
| Inbucket (emails) | http://127.0.0.1:54324 |
| Analytics | http://127.0.0.1:54327 |

> Si un puerto está ocupado, editar `supabase/config.toml` o parar el servicio en conflicto.

### Troubleshooting CLI

- `supabase: command not found` → usar `npx supabase ...` (no hay binario global en este repo).
- Docker no corre → `supabase start` falla con `Cannot connect to the Docker daemon`.
- `Invalid project ref` → verificar que el ref sea de 20 letras minúsculas (`wqomryhtgwjqlqpgbidm`).

## MCP de Supabase — configuración y autenticación

El **Model Context Protocol (MCP)** expone herramientas de Supabase (`execute_sql`, `apply_migration`, `get_advisors`, `search_docs`, etc.) directamente al agente (opencode). Es independiente del Supabase CLI.

### 1. Configurar el cliente MCP

Agregar esta configuración a `~/.config/opencode/opencode.json` (config global de opencode — en este workspace **no** hay `.mcp.json` a nivel proyecto; el repo solo declara el MCP de Playwright en `opencode.json:4`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=wqomryhtgwjqlqpgbidm&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
      "enabled": true
    }
  }
}
```

> La URL incluye `project_ref=wqomryhtgwjqlqpgbidm` (mismo ref usado en `supabase link`) y `features=docs,account,database,debugging,development,functions,branching` que controla qué grupos de herramientas expone el servidor. Ajustar `features` según necesidad (ver [MCP setup guide](https://supabase.com/docs/guides/getting-started/mcp)).

### 2. Autenticar (OAuth 2.1)

Una vez agregada la configuración, ejecutar en la terminal:

```bash
opencode mcp auth supabase
```

Esto abre el navegador para completar el flujo OAuth contra Supabase. Al autorizar, el token queda guardado para el MCP remoto (`https://mcp.supabase.com/mcp`). Este login es **independiente** de `npx supabase login` del CLI.

Verificar que funcionó — el agente debería listar herramientas como `execute_sql`, `list_tables`, `get_project_url`, `search_docs`, etc.

### 3. Verificar que el MCP es alcanzable

```bash
curl -so /dev/null -w "%{http_code}" https://mcp.supabase.com/mcp
# 401 = servidor arriba (esperado sin token)
# timeout / connection refused = caído
```

Si devuelve `401` pero las herramientas no aparecen:

- Verificar que `~/.config/opencode/opencode.json` sea JSON válido, con `type: "remote"`, URL sin typos y `enabled: true`.
- Re-ejecutar `opencode mcp auth supabase` y completar el login en el navegador.
- Reiniciar opencode / recargar la sesión para que detecte el servidor MCP.
- Revisar logs de opencode para errores de MCP.

### 4. Instalar Agent Skills (opcional)

Los Agent Skills dan instrucciones, scripts y recursos listos para trabajar con Supabase de forma más precisa:

```bash
npx skills add supabase/agent-skills
```

Más info en [OpenCode docs](https://opencode.ai/docs) y [Supabase MCP guide](https://supabase.com/docs/guides/getting-started/mcp).

## Stack

- Next.js 16.3.1 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Fonts: Fredoka + Nunito via `next/font/google`
- Supabase (`@supabase/supabase-js` 2.112.3, `@supabase/ssr` 0.12.4)
- Resend 6.20.0 (emails)

## Project structure

- `app/` — Next.js App Router pages and layouts
- `app/(staff)/` — staff-side layout and pages (home feed, children, notices, account)
- `app/lib/` — static data and shared UI labels
- `components/` — React components organized by domain
  - `components/shared/` — reusable across screens
  - `components/sidebar/` — navigation sidebar
  - `components/feed/` — feed-specific components
- `supabase/` — CLI config, migrations (`supabase/migrations/`) y seed (`supabase/seed.sql`)
- `references/pantallas/` — design mockups (UI source of truth)
- `references/screenshots/` — reference captures
- `specs/` — feature specs

## Implemented features

- `specs/01-feed-home.md` — staff home feed with static posts, sidebar and responsive mobile menu.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development/cli/config)
