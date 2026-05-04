# ghostform

A privacy-first form builder with server-side validation, rate limiting, and zero tracking.

## Features

- Form builder with standard field types
- Server-first validation (works without JavaScript)
- Rate limiting per IP
- Zero tracking (no cookies, no fingerprinting, no IP logging)
- Simple embedding (standard HTML form action URLs)
- RESTful API for form management
- JSON export for submissions

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ghostform?retryWrites=true&w=majority
MONGODB_DB_NAME=ghostform
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL="Marvlock <noreply@marvlock.dev>"
```

3. Start development server:

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Build

```bash
pnpm build
pnpm preview
```

## Tech Stack

- **Framework**: Nuxt 4
- **Database**: MongoDB
- **Email**: Resend
- **Language**: TypeScript

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

A project by [Marvlock](https://www.marvlock.dev) | [GitHub](https://github.com/marvlock/ghostform)
