# SKY4444 Repository Structure - Best Practices

## Overview

This document outlines the professional, scalable repository structure following industry best practices for a large-scale production platform with 1,055+ screens and 320+ API endpoints.

---

## Root Level Structure

```
skycoin_production/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js/Express server
├── drizzle/               # Database schema & migrations
├── tests/                 # Test suites (unit, integration, E2E)
├── docs/                  # Documentation
├── config/                # Configuration files
├── deploy/                # Deployment scripts
├── .github/               # GitHub workflows & CI/CD
├── .manus/                # Manus framework config
├── package.json           # Root dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite bundler config
├── vitest.config.ts       # Vitest test runner config
└── README.md              # Project overview
```

---

## Client Directory Structure

### `/client` - Frontend Application

```
client/
├── src/
│   ├── features/              # Feature modules (organized by domain)
│   │   ├── ai/                # AI features (AI Assistant, Code Studio, etc.)
│   │   ├── trading/           # Trading & Finance features
│   │   ├── marketplace/       # Marketplace & Commerce
│   │   ├── social/            # Social & Community
│   │   ├── gaming/            # Gaming & Entertainment
│   │   ├── education/         # Education & Learning
│   │   ├── admin/             # Admin & Management
│   │   ├── wallet/            # Wallet & Crypto
│   │   ├── content/           # Content & Creator
│   │   └── analytics/         # Analytics & Reporting
│   │
│   ├── shared/                # Shared utilities & types
│   │   ├── types/             # TypeScript type definitions
│   │   ├── constants/         # Application constants
│   │   ├── utils/             # Utility functions
│   │   └── hooks/             # Custom React hooks
│   │
│   ├── core/                  # Core functionality
│   │   ├── auth/              # Authentication logic
│   │   ├── api/               # API client setup
│   │   └── state/             # Global state management
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── games/             # Game components
│   │   └── layouts/           # Layout components
│   │
│   ├── pages/                 # Page components (1,055+ screens)
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   └── [Feature]*.tsx     # Feature-specific pages
│   │
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Library functions
│   ├── styles/                # Global styles
│   ├── App.tsx                # Main App component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global CSS
│
├── public/                    # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── manifest.json
│
├── index.html                 # HTML template
└── package.json               # Client dependencies
```

---

## Server Directory Structure

### `/server` - Backend Application

```
server/
├── features/                  # Feature modules
│   ├── ai/                    # AI services
│   ├── trading/               # Trading logic
│   ├── marketplace/           # Marketplace operations
│   ├── social/                # Social features
│   ├── gaming/                # Gaming logic
│   ├── education/             # Education services
│   ├── admin/                 # Admin operations
│   └── wallet/                # Wallet services
│
├── middleware/                # Express middleware
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── rateLimit.ts
│   └── logging.ts
│
├── _core/                     # Core framework
│   ├── index.ts               # Server entry point
│   ├── context.ts             # tRPC context
│   ├── oauth.ts               # OAuth implementation
│   ├── auth.ts                # Authentication
│   ├── llm.ts                 # LLM integration
│   ├── storage.ts             # File storage
│   ├── notification.ts        # Notifications
│   ├── heartbeat.ts           # Scheduled jobs
│   └── env.ts                 # Environment variables
│
├── db.ts                      # Database queries
├── routers.ts                 # tRPC router definitions
├── storage.ts                 # Storage helpers
└── package.json               # Server dependencies
```

---

## Database Structure

### `/drizzle` - Database Schema & Migrations

```
drizzle/
├── schema.ts                  # Database table definitions
├── relations.ts               # Table relationships
├── migrations/                # SQL migration files
│   ├── 0001_init.sql
│   ├── 0002_add_features.sql
│   └── ...
├── manual/                    # Manual migration scripts
└── drizzle.config.ts          # Drizzle configuration
```

---

## Testing Structure

### `/tests` - Test Suites

```
tests/
├── unit/                      # Unit tests
│   ├── utils/
│   ├── hooks/
│   └── components/
│
├── integration/               # Integration tests
│   ├── api/
│   ├── database/
│   └── auth/
│
└── e2e/                       # End-to-end tests
    ├── user-flows/
    ├── payment-flows/
    └── admin-flows/
```

---

## Documentation Structure

### `/docs` - Documentation

```
docs/
├── api/                       # API documentation
│   ├── endpoints.md
│   ├── authentication.md
│   └── examples.md
│
├── architecture/              # Architecture docs
│   ├── overview.md
│   ├── data-flow.md
│   └── security.md
│
└── deployment/                # Deployment guides
    ├── local-setup.md
    ├── staging.md
    └── production.md
```

---

## Configuration Structure

### `/config` - Configuration Files

```
config/
├── dev/                       # Development config
│   ├── database.config.ts
│   ├── api.config.ts
│   └── cache.config.ts
│
└── prod/                      # Production config
    ├── database.config.ts
    ├── api.config.ts
    └── cache.config.ts
```

---

## Naming Conventions

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx`, `DashboardLayout.tsx` |
| Pages | PascalCase | `HomePage.tsx`, `AIAssistant.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts`, `useFetch.ts` |
| Utilities | camelCase | `formatDate.ts`, `validateEmail.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL.ts`, `MAX_RETRIES.ts` |
| Types | PascalCase | `User.ts`, `ApiResponse.ts` |
| Tests | `.test.ts` or `.spec.ts` | `utils.test.ts`, `auth.spec.ts` |

### Directory Naming

| Type | Convention | Example |
|------|-----------|---------|
| Feature folders | kebab-case | `user-profile/`, `ai-assistant/` |
| Utility folders | kebab-case | `shared-utils/`, `custom-hooks/` |
| Component folders | PascalCase | `Components/`, `Layouts/` |

---

## Feature Module Structure

Each feature module follows a consistent structure:

```
features/[feature-name]/
├── components/                # Feature-specific components
├── hooks/                     # Feature-specific hooks
├── types/                     # Feature-specific types
├── utils/                     # Feature-specific utilities
├── pages/                     # Feature pages
├── router.ts                  # tRPC router for feature
├── db.ts                      # Database queries
└── index.ts                   # Barrel export
```

---

## Best Practices Implemented

### ✅ Scalability
- Modular feature-based organization
- Clear separation of concerns
- Easy to add new features without affecting existing code

### ✅ Maintainability
- Consistent naming conventions
- Logical directory hierarchy
- Self-documenting structure

### ✅ Performance
- Lazy loading of components
- Code splitting by feature
- Optimized bundle size

### ✅ Security
- Centralized authentication
- Middleware for authorization
- Environment-based configuration

### ✅ Testing
- Organized test structure
- Unit, integration, and E2E tests
- Easy test discovery

### ✅ Documentation
- Comprehensive docs directory
- API documentation
- Architecture guides

---

## Import Path Aliases

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["client/src/*"],
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"],
      "@types/*": ["client/src/shared/types/*"]
    }
  }
}
```

**Usage:**
```typescript
import { useAuth } from "@/core/auth";
import { User } from "@types/user";
import { trpc } from "@/lib/trpc";
```

---

## Git Workflow

```
main (production)
  ↓
staging (pre-production testing)
  ↓
develop (integration branch)
  ↓
feature/* (feature branches)
```

---

## Continuous Integration

### GitHub Actions Workflows

```
.github/workflows/
├── test.yml                   # Run tests on PR
├── lint.yml                   # Lint code
├── build.yml                  # Build verification
└── deploy.yml                 # Deploy on merge
```

---

## Summary

This repository structure follows industry best practices and is designed to:

1. **Scale** - Support 1,055+ screens across 13 feature categories
2. **Maintain** - Clear organization makes updates and fixes easy
3. **Test** - Comprehensive test structure ensures quality
4. **Deploy** - Organized config enables smooth deployments
5. **Document** - Well-structured docs keep team aligned

The structure is professional, enterprise-grade, and ready for production use.
