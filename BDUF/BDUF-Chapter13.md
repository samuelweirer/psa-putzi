## 13. CODE-ORGANISATION & STANDARDS

### 13.1 Monorepo-Struktur

```
psa-platform/
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── crm/
│   ├── ticketing/
│   ├── billing/
│   └── web/           # Frontend
├── libs/
│   ├── shared/
│   │   ├── src/
│   │   │   ├── dto/
│   │   │   ├── interfaces/
│   │   │   └── utils/
│   │   └── package.json
│   ├── database/
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   └── package.json
│   └── auth/
│       ├── src/
│       │   ├── guards/
│       │   ├── decorators/
│       │   └── strategies/
│       └── package.json
├── tools/
│   ├── scripts/
│   └── generators/
├── docs/
│   ├── api/
│   ├── architecture/
│   └── deployment/
├── .github/
│   └── workflows/
├── package.json
├── tsconfig.base.json
├── nx.json
└── README.md
```

### 13.2 Coding-Standards

**ESLint-Configuration (.eslintrc.json):**
```json
{
  "extends": [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "max-lines-per-function": ["warn", 50],
    "complexity": ["warn", 10],
    "no-console": "warn"
  }
}
```

**Prettier-Configuration (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**TypeScript-Configuration (tsconfig.base.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@psa/shared": ["libs/shared/src"],
      "@psa/database": ["libs/database/src"],
      "@psa/auth": ["libs/auth/src"]
    }
  }
}
```

### 13.3 Git-Workflow

**Branch-Strategy:**
```
main (production)
  ↑
develop (staging)
  ↑
feature/TICKET-123-add-new-feature
bugfix/TICKET-456-fix-login-issue
hotfix/critical-security-patch
```

**Commit-Message-Convention:**
```
<type>(<scope>): <subject>

<body>

<footer>

Types: feat, fix, docs, style, refactor, perf, test, chore
Scope: crm, ticketing, billing, etc.

Examples:
feat(ticketing): add SLA breach notifications
fix(auth): prevent token refresh race condition
docs(api): update authentication endpoints
```

**Pre-Commit-Hook (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm run test:affected
```

---
