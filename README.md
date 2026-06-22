# Harmony Paws API

NestJS REST + WebSocket API for the Harmony Paws mobile application.

## Setup

```bash
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

API docs: `http://localhost:3000/api/docs`

## Key modules

| Module | Description |
|--------|-------------|
| `auth` | JWT register/login/refresh |
| `activities` | User balades, invitations, live stats |
| `rides` | Admin-curated activity templates (clone via mobile pre-fill) |
| `dogs` | Dog profiles |
| `social` | Friends, meetings |
| `messages` | Chat |
| `health` | Medical records |
| `formations` | Training catalog |

## Rides (templates)

Admins (`role.name === "admin"`) manage ride templates via `POST/PATCH/DELETE /rides`.
All authenticated users can `GET /rides` and `GET /rides/:id`.

Cloning is **not** a server-side copy: the mobile app fetches a ride, pre-fills
the activity creation form, and submits `POST /activities` with optional
`sourceRideId` for traceability.

Demo accounts (after seed):

- User: `demo@harmonypaws.app` / `password123`
- Admin: `admin@harmonypaws.app` / `password123`

## Scripts

- `npm run start:dev` — watch mode
- `npm run build` — compile
- `npm run test` — unit tests
- `npm run test:e2e` — e2e tests
