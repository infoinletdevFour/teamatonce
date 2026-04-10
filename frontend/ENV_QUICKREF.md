# Environment Configuration Quick Reference

## Local Development (.env.local)

```bash
# Core Configuration (REQUIRED)
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5175

# Feature Flags (Development)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=false
VITE_ENABLE_DEBUG_MODE=true

# Optional Development Settings
VITE_MAX_FILE_SIZE=10
VITE_API_TIMEOUT=30000
VITE_LOG_API_REQUESTS=true
```

## Production (.env.production)

```bash
# Core Configuration (REQUIRED)
VITE_API_URL=https://api.teamatonce.com/api/v1
VITE_WS_URL=https://api.teamatonce.com
VITE_APP_ENV=production
VITE_APP_URL=https://teamatonce.com

# Feature Flags (Production)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEBUG_MODE=false

# Optional Production Settings
VITE_MAX_FILE_SIZE=25
VITE_API_TIMEOUT=60000
VITE_LOG_API_REQUESTS=false
```

## Usage in Code

### Import Configuration
```typescript
import { appConfig } from '@/config/app-config'
```

### API Calls
```typescript
import { get, post, put, del } from '@/lib/api-client'

// GET
const projects = await get<Project[]>('/projects')

// POST
const newProject = await post('/projects', { name: 'New Project' })

// PUT
const updated = await put('/projects/123', { name: 'Updated' })

// DELETE
await del('/projects/123')
```

### WebSocket
```typescript
import { socketClient } from '@/lib/websocket-client'

// Connect
socketClient.connect()

// Listen for messages
socketClient.onMessage((data) => console.log(data))

// Send message
socketClient.sendMessage('room-123', 'Hello!')

// Disconnect
socketClient.disconnect()
```

### Environment Checks
```typescript
import { isDevelopment, isProduction, debugLog } from '@/config/app-config'

if (isDevelopment) {
  debugLog('Development mode')
}
```

## Common Commands

```bash
# Setup
cp .env.example .env.local

# Development
npm run dev

# Build for production
npm run build:production

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## TypeScript Types

All environment variables are typed in `src/vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  // ... more types
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Env vars not loading | Restart dev server (`npm run dev`) |
| TypeScript errors | Restart TS server or check `vite-env.d.ts` |
| API 404 errors | Check `VITE_API_URL` includes `/api/v1` |
| WebSocket fails | Check `VITE_WS_URL` does NOT include `/api/v1` |
| Build fails | Ensure `.env.production` exists with all required vars |

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] No sensitive keys in client-side code
- [ ] Production secrets are different from development
- [ ] OAuth redirect URIs match deployed URLs
- [ ] Stripe keys use `pk_live_` in production

## File Locations

```
frontend/
├── .env.local              # Your local config (gitignored)
├── .env.production         # Production config (gitignored)
├── .env.example            # Template (in git)
├── CONFIGURATION.md        # Full documentation
├── ENV_QUICKREF.md         # This file
└── src/
    ├── config/
    │   └── app-config.ts   # Configuration module
    ├── lib/
    │   ├── api-client.ts   # HTTP client
    │   └── websocket-client.ts  # WebSocket client
    └── examples/
        └── config-usage-example.tsx  # Usage examples
```

## Support

See `CONFIGURATION.md` for detailed documentation and troubleshooting.
