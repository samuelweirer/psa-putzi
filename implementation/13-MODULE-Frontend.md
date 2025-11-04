# Module Implementation Guide: Frontend Application

**Module ID:** FRONTEND-001
**Phase:** Phase 1 & 2 (Progressive Enhancement)
**Priority:** P0 - Critical
**Estimated Duration:** 8-12 weeks
**Dependencies:** AUTH-001 (Auth), GATEWAY-001 (API Gateway)

---

## Overview

### Purpose
The Frontend module provides a modern, responsive web application for the PSA platform. It delivers an intuitive user interface for MSPs to manage customers, tickets, projects, billing, and all other platform features.

### Key Features
- **Modern UI Framework** - React 18+ with TypeScript
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Component Library** - Reusable UI components (buttons, forms, tables, etc.)
- **State Management** - Redux Toolkit or Zustand
- **Real-time Updates** - WebSocket integration for live notifications
- **Offline Support** - Service Worker for basic offline functionality
- **Multi-language** - i18n support (German primary, English secondary)
- **Dark Mode** - User-selectable theme
- **Accessibility** - WCAG 2.1 AA compliance
- **Performance** - Code splitting, lazy loading, optimistic UI updates

### Technology Stack
```
Frontend:
- React 18.2+ with TypeScript 5.x
- Vite 5.x (build tool)
- TailwindCSS 3.x (styling)
- Shadcn/ui or MUI (component library)
- React Router 6.x (routing)
- TanStack Query (data fetching)
- Zustand or Redux Toolkit (state management)
- Socket.io-client (WebSocket)
- i18next (internationalization)
- Zod (validation)
- React Hook Form (forms)
- Recharts or Chart.js (data visualization)
```

---

## Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── locales/
│       ├── de/
│       │   └── translation.json
│       └── en/
│           └── translation.json
├── src/
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base components (Button, Input, Card, etc.)
│   │   ├── layout/       # Layout components (Header, Sidebar, Footer)
│   │   ├── common/       # Common components (DataTable, SearchBar, etc.)
│   │   └── features/     # Feature-specific components
│   ├── pages/            # Page components (routes)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── tickets/
│   │   ├── projects/
│   │   ├── billing/
│   │   └── settings/
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services (axios instances)
│   ├── stores/           # State management stores
│   ├── types/            # TypeScript types and interfaces
│   ├── utils/            # Utility functions
│   ├── lib/              # Third-party library configurations
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── routes.tsx        # Route definitions
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Core Features Implementation

### 1. Authentication & Authorization

```typescript
// src/services/auth.service.ts

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface LoginRequest {
  email: string;
  password: string;
  mfa_code?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
}

class AuthService {
  private readonly API_URL = import.meta.env.VITE_API_URL;

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(
      `${this.API_URL}/auth/login`,
      credentials
    );

    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    try {
      await axios.post(`${this.API_URL}/auth/logout`, {
        refresh_token: refreshToken
      });
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<{ access_token: string }>(
      `${this.API_URL}/auth/refresh`,
      { refresh_token: refreshToken }
    );

    this.setAccessToken(response.data.access_token);
    return response.data.access_token;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem('access_token', accessToken);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getCurrentUser(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return jwtDecode<User>(token);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }
}

export const authService = new AuthService();
```

```typescript
// src/components/auth/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !authService.hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
```

---

### 2. API Client with Interceptors

```typescript
// src/lib/axios.ts

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authService } from '@/services/auth.service';
import { toast } from '@/components/ui/use-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authService.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set tenant ID if available
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await authService.refreshToken();
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        authService.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    const message = error.response?.data?.message || 'Ein Fehler ist aufgetreten';

    if (error.response?.status === 403) {
      toast({
        title: 'Zugriff verweigert',
        description: 'Sie haben keine Berechtigung für diese Aktion.',
        variant: 'destructive'
      });
    } else if (error.response?.status === 404) {
      toast({
        title: 'Nicht gefunden',
        description: message,
        variant: 'destructive'
      });
    } else if (error.response?.status === 500) {
      toast({
        title: 'Serverfehler',
        description: 'Ein interner Serverfehler ist aufgetreten.',
        variant: 'destructive'
      });
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

### 3. State Management with Zustand

```typescript
// src/stores/auth.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string, mfaCode?: string) => {
        set({ isLoading: true });

        try {
          const response = await authService.login({ email, password, mfa_code: mfaCode });
          set({ user: response.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      refreshUser: () => {
        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        set({ user, isAuthenticated });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions?.includes(permission) || false;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);
```

---

### 4. Data Fetching with TanStack Query

```typescript
// src/hooks/useTickets.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Ticket, CreateTicketRequest, UpdateTicketRequest } from '@/types/ticket';

export function useTickets(filters?: any) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const response = await api.get<{ tickets: Ticket[] }>('/tickets', { params: filters });
      return response.data.tickets;
    },
    staleTime: 30000 // 30 seconds
  });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['tickets', ticketId],
    queryFn: async () => {
      const response = await api.get<Ticket>(`/tickets/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketRequest) => {
      const response = await api.post<Ticket>('/tickets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTicketRequest }) => {
      const response = await api.patch<Ticket>(`/tickets/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', data.id] });
    }
  });
}
```

---

### 5. Reusable Components

```typescript
// src/components/ui/DataTable.tsx

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Suchen...'
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter
    }
  });

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center">
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <div className="text-sm text-muted-foreground">
          Seite {table.getState().pagination.pageIndex + 1} von {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Zurück
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Weiter
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. WebSocket Integration

```typescript
// src/services/websocket.service.ts

import { io, Socket } from 'socket.io-client';
import { authService } from './auth.service';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): void {
    if (this.socket?.connected) return;

    const token = authService.getAccessToken();
    if (!token) return;

    this.socket = io(import.meta.env.VITE_WEBSOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
    });

    // Handle all events and dispatch to listeners
    this.socket.onAny((event, data) => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.forEach(callback => callback(data));
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const wsService = new WebSocketService();

// React hook for WebSocket events
export function useWebSocket(event: string, callback: (data: any) => void) {
  useEffect(() => {
    wsService.on(event, callback);

    return () => {
      wsService.off(event, callback);
    };
  }, [event, callback]);
}
```

---

### 7. Internationalization (i18n)

```typescript
// src/lib/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });

export default i18n;
```

```json
// public/locales/de/translation.json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "search": "Suchen",
    "loading": "Lädt..."
  },
  "tickets": {
    "title": "Tickets",
    "create": "Neues Ticket",
    "status": {
      "open": "Offen",
      "in_progress": "In Bearbeitung",
      "resolved": "Gelöst",
      "closed": "Geschlossen"
    }
  }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)
```typescript
// tests/unit/components/Button.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Integration Tests
```typescript
// tests/integration/tickets.test.tsx

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TicketsList } from '@/pages/tickets/TicketsList';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('Tickets List', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
  });

  it('displays tickets after loading', async () => {
    server.use(
      rest.get('/api/v1/tickets', (req, res, ctx) => {
        return res(
          ctx.json({
            tickets: [
              { id: '1', number: 'T-001', title: 'Test Ticket', status: 'open' }
            ]
          })
        );
      })
    );

    render(
      <QueryClientProvider client={queryClient}>
        <TicketsList />
      </QueryClientProvider>
    );

    expect(screen.getByText('Lädt...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Ticket')).toBeInTheDocument();
    });
  });
});
```

---

## Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)
- [ ] **Project Setup**
  - [ ] Initialize Vite + React + TypeScript
  - [ ] Configure TailwindCSS
  - [ ] Set up ESLint + Prettier
  - [ ] Configure path aliases (@/...)
  - [ ] Set up environment variables

- [ ] **Core Infrastructure**
  - [ ] Implement axios client with interceptors
  - [ ] Set up auth service
  - [ ] Configure routing (React Router)
  - [ ] Set up state management (Zustand)
  - [ ] Configure TanStack Query
  - [ ] Set up i18n

- [ ] **Base Components**
  - [ ] Install/configure Shadcn/ui
  - [ ] Create layout components (Header, Sidebar, Footer)
  - [ ] Implement responsive navigation
  - [ ] Create loading states
  - [ ] Implement error boundaries

### Phase 2: Authentication & Dashboard (Weeks 3-4)
- [ ] **Authentication Pages**
  - [ ] Login page
  - [ ] MFA verification page
  - [ ] Password reset flow
  - [ ] Implement ProtectedRoute component

- [ ] **Dashboard**
  - [ ] Dashboard layout
  - [ ] KPI cards (tickets, customers, revenue)
  - [ ] Recent tickets widget
  - [ ] Activity timeline
  - [ ] Quick actions

### Phase 3: Core Modules (Weeks 5-8)
- [ ] **Tickets Module**
  - [ ] Ticket list with filters
  - [ ] Ticket detail view
  - [ ] Create/edit ticket forms
  - [ ] Comments section
  - [ ] Time entries tracking
  - [ ] Ticket status workflow

- [ ] **Customers Module**
  - [ ] Customer list
  - [ ] Customer detail page
  - [ ] Create/edit customer forms
  - [ ] Contacts management
  - [ ] Locations management

- [ ] **Users Module**
  - [ ] User list
  - [ ] User profile
  - [ ] Role management
  - [ ] Permissions editor

### Phase 4: Advanced Modules (Weeks 9-12)
- [ ] **Projects Module**
  - [ ] Project list and Kanban board
  - [ ] Project detail with tasks
  - [ ] Gantt chart view
  - [ ] Time tracking

- [ ] **Billing Module**
  - [ ] Invoice list
  - [ ] Invoice detail
  - [ ] Create invoice wizard
  - [ ] Payment tracking

- [ ] **Reports Module**
  - [ ] Report dashboard
  - [ ] Chart components (Recharts)
  - [ ] Export functionality (PDF, Excel)

### Phase 5: Polish & Optimization (Week 12+)
- [ ] **Performance**
  - [ ] Code splitting
  - [ ] Lazy loading routes
  - [ ] Image optimization
  - [ ] Bundle size optimization

- [ ] **Testing**
  - [ ] Unit tests for components
  - [ ] Integration tests for pages
  - [ ] E2E tests (Playwright/Cypress)

- [ ] **Accessibility**
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] ARIA labels
  - [ ] Color contrast

- [ ] **Documentation**
  - [ ] Component documentation (Storybook)
  - [ ] Developer guide
  - [ ] User guide

---

## Definition of Done

- [x] All pages implemented and functional
- [x] Responsive design (mobile, tablet, desktop)
- [x] Unit test coverage ≥ 70%
- [x] Integration tests for critical flows
- [x] E2E tests for main user journeys
- [x] Accessibility WCAG 2.1 AA
- [x] Performance: Lighthouse score ≥ 90
- [x] i18n: German and English supported
- [x] Documentation complete

---

## Dependencies

### Required Backend Modules
- **AUTH-001** - Authentication & Authorization
- **GATEWAY-001** - API Gateway
- **TICKETS-001** - Tickets API
- **CRM-001** - Customers API

### External Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.12.0",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "socket.io-client": "^4.5.4",
    "i18next": "^23.7.6",
    "react-i18next": "^13.5.0",
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "tailwindcss": "^3.3.6",
    "recharts": "^2.10.3",
    "date-fns": "^2.30.0",
    "jwt-decode": "^4.0.0"
  }
}
```

---

## Environment Variables

```bash
# .env.example

# API Configuration
VITE_API_URL=http://localhost:3000/api/v1
VITE_WEBSOCKET_URL=http://localhost:3000

# Application
VITE_APP_NAME=PSA-Platform
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_OFFLINE_MODE=false

# Analytics (optional)
VITE_ANALYTICS_ID=
```

---

**Module Owner**: Frontend Sub-Agent
**Created**: 2025-11-04
**Status**: Ready for Implementation
