# File & Folder Naming Guide - Best Practices

## Quick Reference

| Item | Convention | Example |
|------|-----------|---------|
| **React Components** | PascalCase | `UserProfile.tsx`, `DashboardLayout.tsx` |
| **Page Components** | PascalCase | `HomePage.tsx`, `AIAssistant.tsx` |
| **Custom Hooks** | camelCase + `use` prefix | `useAuth.ts`, `useFetch.ts` |
| **Utility Functions** | camelCase | `formatDate.ts`, `validateEmail.ts` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL.ts`, `MAX_RETRIES.ts` |
| **Type Definitions** | PascalCase | `User.ts`, `ApiResponse.ts` |
| **Test Files** | `.test.ts` or `.spec.ts` | `utils.test.ts`, `auth.spec.ts` |
| **Feature Folders** | kebab-case | `user-profile/`, `ai-assistant/` |
| **Utility Folders** | kebab-case | `shared-utils/`, `custom-hooks/` |
| **Component Folders** | PascalCase | `Components/`, `Layouts/` |

---

## Detailed Conventions

### 1. React Components

**Convention:** PascalCase (UpperCamelCase)

```
✅ CORRECT:
- UserProfile.tsx
- DashboardLayout.tsx
- AIAssistant.tsx
- MarketplaceCard.tsx

❌ INCORRECT:
- userProfile.tsx
- dashboard-layout.tsx
- aiAssistant.tsx
- marketplace_card.tsx
```

**Reason:** React components are classes/functions that return JSX, so they follow class naming conventions.

---

### 2. Page Components

**Convention:** PascalCase

```
✅ CORRECT:
- HomePage.tsx
- AICodeStudio.tsx
- MarketplaceOverview.tsx
- WalletManagement.tsx

❌ INCORRECT:
- home-page.tsx
- aiCodeStudio.tsx
- marketplace_overview.tsx
```

**Reason:** Pages are React components and should follow component naming conventions.

---

### 3. Custom Hooks

**Convention:** camelCase with `use` prefix

```
✅ CORRECT:
- useAuth.ts
- useFetch.ts
- useLocalStorage.ts
- usePagination.ts

❌ INCORRECT:
- UseAuth.ts
- fetch.ts
- useLocalStorage.tsx
- usePaginationHook.ts
```

**Reason:** React hooks must start with `use` prefix. File should match the export name.

---

### 4. Utility Functions

**Convention:** camelCase

```
✅ CORRECT:
- formatDate.ts
- validateEmail.ts
- calculateTotalPrice.ts
- parseJsonResponse.ts

❌ INCORRECT:
- FormatDate.ts
- validate-email.ts
- calculateTotalPrice.tsx
- parseJSON.ts (use full word)
```

**Reason:** Utility functions are not components, so they use standard camelCase.

---

### 5. Constants

**Convention:** UPPER_SNAKE_CASE

```
✅ CORRECT:
- API_BASE_URL.ts
- MAX_RETRIES.ts
- DEFAULT_TIMEOUT.ts
- FEATURE_FLAGS.ts

❌ INCORRECT:
- apiBaseUrl.ts
- max-retries.ts
- defaultTimeout.ts
- feature_flags.ts
```

**Reason:** Constants are immutable values and deserve special visual distinction.

---

### 6. Type Definitions

**Convention:** PascalCase

```
✅ CORRECT:
- User.ts
- ApiResponse.ts
- MarketplaceItem.ts
- AuthToken.ts

❌ INCORRECT:
- user.ts
- api-response.ts
- marketplace_item.ts
- authToken.ts
```

**Reason:** Types represent data structures and should follow class naming conventions.

---

### 7. Test Files

**Convention:** `.test.ts` or `.spec.ts` suffix

```
✅ CORRECT:
- utils.test.ts
- auth.spec.ts
- calculatePrice.test.ts
- useAuth.test.ts

❌ INCORRECT:
- utils_test.ts
- auth-spec.ts
- test-utils.ts
- useAuthTest.ts
```

**Reason:** Consistent suffix makes test discovery automatic in test runners.

---

### 8. Directories - Feature Folders

**Convention:** kebab-case (lowercase with hyphens)

```
✅ CORRECT:
- user-profile/
- ai-assistant/
- marketplace-items/
- wallet-management/

❌ INCORRECT:
- UserProfile/
- aiAssistant/
- marketplace_items/
- WalletManagement/
```

**Reason:** Directories are organizational units, not code entities. kebab-case is more readable in file paths.

---

### 9. Directories - Utility Folders

**Convention:** kebab-case

```
✅ CORRECT:
- shared-utils/
- custom-hooks/
- type-definitions/
- api-clients/

❌ INCORRECT:
- SharedUtils/
- customHooks/
- type_definitions/
- APIClients/
```

**Reason:** Consistency with feature folders for organizational clarity.

---

### 10. Directories - Component Folders

**Convention:** PascalCase (optional, for clarity)

```
✅ CORRECT:
- Components/
- Layouts/
- UI/
- Games/

❌ INCORRECT:
- components/
- layouts/
- ui-components/
- game_components/
```

**Reason:** These are special organizational folders that contain React components.

---

## Directory Structure Examples

### ✅ Correct Structure

```
client/src/
├── components/
│   ├── DashboardLayout.tsx
│   ├── UserProfile.tsx
│   └── MarketplaceCard.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useLocalStorage.ts
│
├── utils/
│   ├── formatDate.ts
│   ├── validateEmail.ts
│   └── calculatePrice.ts
│
├── types/
│   ├── User.ts
│   ├── ApiResponse.ts
│   └── MarketplaceItem.ts
│
├── constants/
│   ├── API_BASE_URL.ts
│   ├── MAX_RETRIES.ts
│   └── FEATURE_FLAGS.ts
│
├── features/
│   ├── user-profile/
│   │   ├── UserProfile.tsx
│   │   ├── useUserProfile.ts
│   │   └── userProfileTypes.ts
│   │
│   ├── ai-assistant/
│   │   ├── AIAssistant.tsx
│   │   ├── useAIChat.ts
│   │   └── aiTypes.ts
│   │
│   └── marketplace/
│       ├── MarketplaceOverview.tsx
│       ├── useMarketplace.ts
│       └── marketplaceTypes.ts
│
└── pages/
    ├── HomePage.tsx
    ├── DashboardPage.tsx
    ├── AIAssistantPage.tsx
    └── MarketplaceOverviewPage.tsx
```

### ❌ Incorrect Structure

```
client/src/
├── components/
│   ├── dashboard-layout.tsx        ❌ Should be PascalCase
│   ├── UserProfile.tsx             ✅
│   └── marketplace_card.tsx        ❌ Should be PascalCase
│
├── hooks/
│   ├── UseAuth.ts                  ❌ Should be camelCase
│   ├── fetch.ts                    ❌ Missing 'use' prefix
│   └── useLocalStorage.tsx         ❌ Should be .ts not .tsx
│
├── utils/
│   ├── FormatDate.ts               ❌ Should be camelCase
│   ├── validate-email.ts           ❌ Should be camelCase
│   └── calculatePrice.ts           ✅
│
├── types/
│   ├── user.ts                     ❌ Should be PascalCase
│   ├── api_response.ts             ❌ Should be PascalCase
│   └── MarketplaceItem.ts          ✅
│
├── constants/
│   ├── apiBaseUrl.ts               ❌ Should be UPPER_SNAKE_CASE
│   ├── max_retries.ts              ❌ Should be UPPER_SNAKE_CASE
│   └── FEATURE_FLAGS.ts            ✅
│
├── features/
│   ├── UserProfile/                ❌ Should be kebab-case
│   ├── ai_assistant/               ❌ Should be kebab-case
│   └── marketplace/                ✅
│
└── pages/
    ├── home-page.tsx               ❌ Should be PascalCase
    ├── DashboardPage.tsx           ✅
    ├── aiAssistantPage.tsx         ❌ Should be PascalCase
    └── marketplace_overview.tsx    ❌ Should be PascalCase
```

---

## Import Path Examples

### ✅ Correct Imports

```typescript
// Components
import { DashboardLayout } from '@/components/DashboardLayout';
import { UserProfile } from '@/components/UserProfile';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';

// Utilities
import { formatDate } from '@/utils/formatDate';
import { validateEmail } from '@/utils/validateEmail';

// Types
import type { User } from '@/types/User';
import type { ApiResponse } from '@/types/ApiResponse';

// Constants
import { API_BASE_URL, MAX_RETRIES } from '@/constants/API_BASE_URL';

// Features
import { AIAssistant } from '@/features/ai-assistant/AIAssistant';
import { useUserProfile } from '@/features/user-profile/useUserProfile';
```

### ❌ Incorrect Imports

```typescript
// ❌ Wrong casing
import { dashboardLayout } from '@/components/dashboard-layout';
import { UseAuth } from '@/hooks/UseAuth';

// ❌ Wrong path structure
import { formatDate } from '@/utils/format-date';
import { User } from '@/types/user';

// ❌ Wrong constant naming
import { apiBaseUrl } from '@/constants/apiBaseUrl';
```

---

## Checklist for New Files

Before creating a new file, ask yourself:

- [ ] Is this a React component? → Use **PascalCase**
- [ ] Is this a custom hook? → Use **camelCase** with `use` prefix
- [ ] Is this a utility function? → Use **camelCase**
- [ ] Is this a constant? → Use **UPPER_SNAKE_CASE**
- [ ] Is this a type definition? → Use **PascalCase**
- [ ] Is this a test file? → Add `.test.ts` or `.spec.ts` suffix
- [ ] Is this a directory? → Use **kebab-case** (except Components/Layouts/UI)
- [ ] Does the filename match the main export? → Yes
- [ ] Is the file in the right directory? → Yes

---

## Benefits of Following These Conventions

1. **Consistency** - Everyone on the team knows where to find things
2. **Clarity** - File names clearly indicate what they contain
3. **Discoverability** - IDEs can auto-complete and suggest files
4. **Maintainability** - Easy to refactor and update code
5. **Scalability** - Works well as the project grows
6. **Professional** - Follows industry standards and best practices

---

## Tools to Enforce Conventions

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "VariableDeclarator > ArrowFunctionExpression[id.name=/^[a-z]/]",
        message: 'Component names must be PascalCase'
      }
    ]
  }
};
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
git diff --cached --name-only | grep -E '\.(ts|tsx)$' | while read file; do
  if [[ $file =~ ^client/src/components/.*[a-z]\.tsx$ ]]; then
    echo "❌ Component file must be PascalCase: $file"
    exit 1
  fi
done
```

---

## Summary

Follow these naming conventions to maintain a professional, scalable, and maintainable codebase:

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | usePrefix + camelCase | `useAuth.ts` |
| Utils | camelCase | `formatDate.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL.ts` |
| Types | PascalCase | `User.ts` |
| Tests | .test.ts/.spec.ts | `utils.test.ts` |
| Folders | kebab-case | `user-profile/` |

**Remember:** Consistency is key to maintaining a professional codebase!
