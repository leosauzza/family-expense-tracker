# Frontend - AGENTS.md

## Service Overview

React 18 SPA with TypeScript for the expense tracker UI.

## Tech Stack

- **Framework**: React 18.2+
- **Language**: TypeScript 5+
- **Build Tool**: Vite 5+
- **Router**: React Router DOM 6+
- **Styling**: CSS Modules + CSS Variables
- **State**: React Context API + useReducer
- **Icons**: Lucide React
- **HTTP**: Native Fetch API with dynamic hostname detection

## Project Structure

```
frontend/
├── AGENTS.md
├── development-plan.md
├── Dockerfile
├── nginx.conf
├── public/
│   └── locales/          # Translation files
│       ├── es.json       # Spanish (default)
│       └── en.json       # English
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Buttons, inputs, modals
│   │   │   ├── Button.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/       # Header, navigation
│   │   │   └── Header.tsx
│   │   └── expenses/     # Expense list components
│   │       ├── CalculationDisplay.tsx
│   │       ├── ExpenseItem.tsx
│   │       ├── ExpenseList.tsx
│   │       ├── ExpenseModal.tsx
│   │       ├── TheyOweMe.tsx
│   │       ├── ThirdPartyList.tsx
│   │       ├── TotalRow.tsx
│   │       └── WalletCard.tsx
│   ├── contexts/         # React Contexts
│   │   ├── AuthContext.tsx    # User auth state
│   │   └── LocaleContext.tsx  # i18n state
│   ├── hooks/            # Custom hooks
│   │   ├── useLocalStorage.ts
│   │   └── useTranslation.ts
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx       # User selection
│   │   └── DashboardPage.tsx  # Main dashboard
│   ├── services/         # API services
│   │   ├── api.ts             # Base fetch wrapper
│   │   ├── userService.ts
│   │   ├── monthlyDataService.ts
│   │   └── expenseService.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── calculations.ts
│   │   ├── date.ts
│   │   └── formatters.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Naming Conventions

- Components: PascalCase (`ExpenseList.tsx`, `WalletCard.tsx`)
- Hooks: camelCase starting with `use` (`useLocalStorage`, `useTranslation`)
- Utils: camelCase (`formatCurrency.ts`, `calculateTotal.ts`)
- Types/Interfaces: PascalCase (`User`, `FixedExpense`)
- CSS Modules: `ComponentName.module.css`
- Translation keys: snake_case (`expense_list.title`, `wallet.edit_button`)

## State Management

### LocalStorage Keys
- `expense_tracker_user`: `{ id: string, name: string, slug: string }`
- `expense_tracker_locale`: `'es' | 'en'`

### Contexts

**AuthContext**
- Current user
- Viewed user (can view other users via URL)
- Login/logout methods

**LocaleContext**
- Current language
- t() translation function
- Change language method

## Dynamic API URL Detection

The frontend automatically detects the API server hostname:

```typescript
// api.ts
function getBaseUrl(): string {
  const hostname = window.location.hostname;
  return `http://${hostname}:8080/api`;
}
```

This allows the same build to work on:
- `localhost:3000` → API calls to `localhost:8080`
- `192.168.0.x:3000` → API calls to `192.168.0.x:8080`

## Responsive Design

### Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | ≤480px | Single column, buttons next to detail, currency labels visible |
| Tablet | 481-767px | Compact 5-column grid |
| Desktop | >767px | Full layout with 3-column tables |

### Mobile-Specific Features
- Edit/delete buttons appear inline with expense detail
- Currency labels ("AR$"/"US$") shown above amounts
- Stacked layout for expense rows

## Translation Structure

Default language: Spanish (es)

```json
{
  "app": { "title": "Seguimiento de Gastos Familiar" },
  "home": { "selectUser": "¿Quién eres?" },
  "dashboard": {
    "wallet": { "title": "Billetera", "edit": "Editar" },
    "fixedExpenses": { "title": "Gastos Fijos Mensuales" },
    "sharedExpenses": { "myShared": "Gastos compartidos pagados por mí" },
    "theyOweMe": { "title": "Me deben" },
    "calculation": { "title": "Balance Final" }
  },
  "common": { "save": "Guardar", "cancel": "Cancelar", "delete": "Eliminar" }
}
```

## URL Pattern

- Parse: `/:userSlug/:year-:month` or `/:userSlug/dashboard`
- Example: `/leo/2026-02` → Leo's February 2026 expenses

## Services

### userService
- `getAll(): Promise<User[]>`
- `getBySlug(slug: string): Promise<User | null>`

### monthlyDataService
- `get(userId, year, month): Promise<MonthlyData>`
- `create(userId, year, month): Promise<MonthlyData>`
- `updateWallet(id, amount): Promise<void>`
- `copyFromPrevious(id): Promise<MonthlyData>`

### fixedExpenseService
- `create(expense): Promise<FixedExpense>`
- `update(id, expense): Promise<FixedExpense>`
- `delete(id): Promise<void>`
- `togglePaid(id, isPaid): Promise<void>`

### sharedExpenseService
- Same as fixedExpenseService
- `getPaidByOthers(userId, year, month): Promise<SharedExpense[]>`

### thirdPartyService
- List: `createList`, `updateListName`, `deleteList`
- Expense: `createExpense`, `updateExpense`, `deleteExpense`, `toggleExpensePaid`

## Calculation Logic

```typescript
// utils/calculations.ts
FinalBalance = WalletAmount 
             + Sum(ThirdPartyExpenses.Where(!IsPaid))
             - Sum(FixedExpenses.Where(!IsPaid))
             + ((Sum(SharedByOther.Where(!IsPaid)) + Sum(SharedByUser.Where(!IsPaid))) / TotalUsers)
```

TheyOweMe = Sum(ThirdPartyExpenses.Where(!IsPaid)) + (((Sum(SharedByUser + SharedByOther) / TotalUsers) - Sum(SharedByUser)))

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `/api` (uses dynamic hostname) |

## Docker

Frontend runs on port 3000 with hot reload via Vite.
Build target uses nginx for production.
