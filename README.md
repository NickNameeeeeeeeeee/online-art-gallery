# Atelier — Online Art Gallery

Atelier is a virtual art gallery created to make great art more accessible, no matter where people live or how far they are from a major museum. The idea began with friends and fellow students who did not always have the time, money, or transportation to travel to a large city and experience these works in person. Atelier brings artwork from The Metropolitan Museum of Art and the Art Institute of Chicago into one consistent interface, where users can explore collections, create accounts, save favorites, and curate public exhibitions of their own.
## Main features

- Unified search across both museums
- Museum and public-domain filters
- Responsive artwork cards and high-resolution detail pages
- In-frame artwork zoom, pan, mouse-wheel, and mobile pinch controls
- Context-aware back navigation from artwork details
- Museum attribution, credit lines, source links, and rights labels
- Registration, login, persistent sessions, and account settings
- Secure in-account password changes and sign-out
- Personal favorites
- Create, edit, drag-and-drop reorder, and delete virtual exhibitions
- Whole-card exhibition reordering on desktop and mobile, with keyboard shortcuts
- Curator notes for individual works
- Public/private exhibition visibility
- Shareable public exhibition pages
- Loading, empty, partial-service, and error states
- API rate limiting, Helmet headers, password hashing, and environment-based secrets

## Project structure

```text
online-art-gallery/
├── client/                 React + TypeScript application
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       └── pages/
├── server/                 Express + Mongoose application
│   └── src/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/       Museum adapters and cache
│       └── utils/
├── .env.example
├── docker-compose.yml
└── package.json
```

## Local setup

### 1. Install Node.js and dependencies

Use Node.js 20.19 or newer.

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` in the project root and replace `JWT_SECRET` with a long random value.

```bash
cp .env.example .env
```

The server reads the root `.env` when started from the root workspace.

### 3. Start MongoDB

Use an existing MongoDB installation, MongoDB Atlas, or the included Docker Compose service:

```bash
docker compose up -d mongo
```

### 4. Run the client and server

```bash
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

Vite proxies `/api` requests to the Express server during development.

## Production build

```bash
npm run build
NODE_ENV=production npm start
```

In production, Express serves the compiled files in `client/dist`. Set these environment variables on the hosting platform:

- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT` if required by the host
- `CLIENT_ORIGIN` when the frontend is hosted separately

GitLab Pages alone cannot run the Express server. Deploy the complete application to a Node-capable service, or deploy the client and API separately and set `VITE_API_URL` before building the client.

## API overview

### Artworks

```text
GET /api/artworks?query=monet&source=all&page=1&limit=16
GET /api/artworks/featured
GET /api/artworks/:source/:id
```

Sources are `met` and `artic`.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/password
```

### Favorites

```text
GET    /api/favorites
POST   /api/favorites
DELETE /api/favorites/:source/:sourceId
```

### Exhibitions

```text
GET    /api/collections
POST   /api/collections
GET    /api/collections/:id
PUT    /api/collections/:id
DELETE /api/collections/:id
GET    /api/collections/public/:slug
```

## Museum data and image rights

The app does not claim ownership of museum data or images. Every normalized artwork keeps its source museum, official record URL, credit line, public-domain status, and available rights text. Users should consult the official museum record before reusing an image outside this educational application.

# Implementation Notes

## Architectural decision

Museum collection records are fetched live and normalized by the Express server. MongoDB stores only application-owned information: users, favorite snapshots, and exhibition snapshots. This avoids copying entire museum collections while preserving saved exhibitions if a museum API is temporarily unavailable.

## Normalized artwork contract

Both museum adapters return the same fields:

- `source` and `sourceId`
- title, artist, date, medium, culture, and department
- description
- full and thumbnail image URLs
- museum name and official record URL
- public-domain flag, credit line, and rights text

The React application therefore never needs museum-specific conditional request logic.

## Partial failure behavior

When one museum API fails during a combined search, the API returns results from the other museum plus a warning. It returns an error only when both sources fail.
