# Elena Fit

Monorepo (npm workspaces + Turborepo) con la landing y la app de seguimiento de Elena.
**Estado: DEMO** — textos, precios e imágenes son provisionales; la app guarda los datos en el propio dispositivo.

```
apps/
  web/   Landing (Next.js, Tailwind v4, Motion)        → http://localhost:3000
  app/   App PWA para clientes y coach (datos demo)     → http://localhost:3001
packages/
  ui/    Sistema de diseño compartido (tokens negro/amarillo, Button, Reveal, Placeholder, Logo)
supabase/
  migrations/  Esquema + RLS para cuando se pase a producción
```

## Arrancar

```powershell
npm install
npm run dev          # web y app a la vez
npm run dev:web      # solo landing
npm run dev:app      # solo app
npm run build        # compila todo
npm run typecheck
```

## Demo de la app

La pantalla de entrada tiene dos accesos sin contraseña: **cliente** (Lucía) y **coach** (Elena).
Todo lo que registres (series, comidas, peso) se guarda en `localStorage`. Es instalable como PWA
(en producción: `npm run build && npm run start`).

## Variables de entorno (opcionales)

| Variable | Dónde | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | web | `http://localhost:3001` |
| `NEXT_PUBLIC_WEB_URL` | app | `http://localhost:3000` |

## Modo Supabase real (chat, reservas, plantillas, push)

`apps/app` funciona en **doble modo**: sin variables de Supabase usa datos locales (demo); con ellas usa Supabase.

1. Crea un proyecto Supabase y ejecuta `supabase/migrations/0001_init.sql` en el SQL Editor (tablas + RLS + Realtime).
2. Regístrate con el email de Elena y conviértela en entrenadora:
   `update public.profiles set role = 'trainer' where email = 'elena@tu-dominio.com';`
3. Copia `apps/app/.env.example` a `.env.local` y rellénalo. Claves VAPID: `npx web-push generate-vapid-keys` (solo se usa para generarlas).
4. Elena activa **Entrenamiento presencial** en la ficha de cada cliente (`is_in_person`) → ese cliente ve la pestaña *Reservas*.
5. Backup: añade el secret `SUPABASE_DB_URL` (Session pooler, IPv4) en GitHub → `.github/workflows/supabase-backup.yml` guarda un `.sql.gz` cada domingo (30 días).

Notas:
- **Push**: `lib/webpush-edge.ts` firma VAPID y cifra el aviso con Web Crypto (sin `web-push`), apto para Cloudflare Workers. En iPhone solo funciona con la PWA instalada (iOS 16.4+).
- **Cloudflare**: el código es compatible con `@opennextjs/cloudflare` (rutas Node/Workers, sin runtime edge), pero aún **no** está configurado (`wrangler.jsonc`, scripts de deploy). `SUPABASE_SERVICE_ROLE_KEY` y `VAPID_PRIVATE_KEY` van como *secrets* del Worker, nunca con prefijo `NEXT_PUBLIC_`.
- El panel de adherencia/progreso de Elena sigue siendo demo; con Supabase se muestra la lista real de clientes.

## Del demo a producción (pendiente)

1. Sustituir `apps/app/src/lib/store.ts` (entrenos, comidas, peso en local) por consultas a Supabase (`assigned_plans`, `progress_logs`).
2. Sustituir contenido provisional (`apps/web/src/lib/data.ts`, `Placeholder`) por el real de Elena.
3. Conectar el formulario de contacto (`apps/web/src/components/contact.tsx`) a email o base de datos.
4. Añadir Stripe si se cobran los planes online.
