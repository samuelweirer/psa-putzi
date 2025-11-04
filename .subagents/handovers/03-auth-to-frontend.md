# Handover: Auth Module → Frontend Development

**From:** Senior-2 (Security Specialist) - AUTH-001
**To:** Junior-5 (Frontend Developer) - FRONTEND-001
**Date:** 2025-11-04
**Status:** ✅ Ready for Frontend Development (Auth APIs available)
**Completion:** AUTH-001 at 75% - Core features complete, OAuth2 pending

---

## 🎯 Purpose

This handover enables you to start building the React frontend while AUTH-001 OAuth2 integration is being completed. You can use the **existing auth endpoints** that are already implemented and tested.

---

## ✅ What's Ready Now

### Available Auth Endpoints (Port 3001)

All endpoints are **implemented, tested, and working**:

#### 1. **POST /api/v1/auth/register**
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Validation:**
- Email must be valid format
- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- First/last name: 1-100 characters

---

#### 2. **POST /api/v1/auth/login**
Login with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "mfaEnabled": false,
  "mfaRequired": false
}
```

**Response if MFA enabled (200):**
```json
{
  "mfaRequired": true,
  "tempToken": "temp_token_uuid"
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### 3. **POST /api/v1/auth/mfa/verify**
Verify MFA code (if user has MFA enabled).

**Request:**
```json
{
  "tempToken": "temp_token_uuid",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### 4. **POST /api/v1/auth/refresh**
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

---

#### 5. **POST /api/v1/auth/logout**
Logout and invalidate tokens.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 6. **GET /api/v1/auth/me**
Get current user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "mfaEnabled": false,
  "accountStatus": "active",
  "createdAt": "2025-11-04T10:00:00Z",
  "lastLoginAt": "2025-11-04T14:30:00Z"
}
```

---

#### 7. **PATCH /api/v1/auth/me**
Update user profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

---

#### 8. **POST /api/v1/auth/password/change**
Change password (authenticated users).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

#### 9. **POST /api/v1/auth/password/reset-request**
Request password reset (forgot password).

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

**Note:** In dev, check server logs for reset token.

---

#### 10. **POST /api/v1/auth/password/reset**
Reset password with token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPass789!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

#### 11. **POST /api/v1/auth/mfa/setup**
Enable MFA for user account.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "recoveryCodes": [
    "ABC123XYZ",
    "DEF456UVW",
    "GHI789RST"
  ]
}
```

**User must:**
1. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
2. Save recovery codes securely
3. Verify setup with POST /api/v1/auth/mfa/verify

---

#### 12. **DELETE /api/v1/auth/mfa/disable**
Disable MFA for user account.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "MFA disabled successfully"
}
```

---

## 🚀 Getting Started - Frontend Development

### Step 1: Setup React Project (Week 3, Day 1)

```bash
cd /opt/psa-putzi
mkdir -p frontend
cd frontend

# Create Vite + React + TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom axios
npm install -D @types/react-router-dom
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-icons
npm install class-variance-authority clsx tailwind-merge

# Install shadcn/ui components (as needed)
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### Step 2: Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

**tailwind.config.js:**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 3: Create API Client

**src/lib/api.ts:**
```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/api/v1/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### Step 4: Create Auth Context

**src/contexts/AuthContext.tsx:**
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mfaEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });

    if (data.mfaRequired) {
      // Handle MFA flow (implement in Step 5)
      throw new Error('MFA_REQUIRED');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
  };

  const register = async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Step 5: Build Login Page

**src/pages/LoginPage.tsx:**
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">PSA Platform Login</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center">
          <a href="/register" className="text-blue-600 hover:underline">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 📋 Your Tasks (Week 3)

### Priority 1: Authentication UI (Days 1-3)
- [ ] Set up React + Vite + TypeScript project
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Implement Login page
- [ ] Implement Register page
- [ ] Implement Forgot Password flow
- [ ] Create AuthContext for state management
- [ ] Add token refresh logic
- [ ] Implement MFA verification UI

### Priority 2: Protected Routes & Navigation (Days 4-5)
- [ ] Create ProtectedRoute component
- [ ] Build main navigation/sidebar
- [ ] Create Dashboard skeleton
- [ ] Add logout functionality
- [ ] Implement user profile page

### Priority 3: Testing (Day 6)
- [ ] Unit tests for auth components
- [ ] E2E tests for login flow (Playwright)
- [ ] Test token refresh logic
- [ ] Test protected routes

---

## 🔌 Backend Connection

### Auth Service
- **URL:** http://localhost:3001
- **Base Path:** /api/v1/auth
- **Status:** ✅ Running and tested

### Starting the Auth Service

```bash
cd /opt/psa-putzi/services/auth-service
npm run dev
```

Service runs on port 3001.

### Environment Variables

**frontend/.env:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

---

## ⚠️ What's NOT Ready Yet

### OAuth2 SSO (Coming in Week 3)
- Google SSO
- Microsoft SSO

**Workaround:** Build UI placeholders, implement when endpoints are ready.

---

## 🐛 Known Issues & Limitations

### 1. Email Sending (Password Reset)
- Currently **logs to console** in development
- Production will use SMTP
- **UI can work normally** - just inform user to check console in dev

### 2. Rate Limiting
- Rate limiting is active (10 login attempts per 15 min)
- Test accounts might get locked during development
- **Solution:** Flush Redis or wait 15 minutes

---

## 📦 Shared Resources

### Types to Import

Check `.subagents/shared/types.ts` for shared TypeScript types.

**Example:**
```typescript
import { User, Role } from '../../.subagents/shared/types';
```

---

## 🤝 Coordination

### Daily Updates
Update `.subagents/status/agent-5-frontend.md` daily with:
- What you built
- What's blocking you
- Questions for backend team

### Questions?
Create issue: `.subagents/issues/2025-11-04-your-question.md`
- @mention Senior-2 for auth questions
- @mention Main-Agent for architectural decisions

---

## 📚 Resources

### Implementation Guide
Read: `implementation/13-MODULE-Frontend.md` for complete frontend spec.

### Design System
Use **shadcn/ui** components: https://ui.shadcn.com/

### API Testing
Use **Postman** or **curl** to test endpoints before integrating.

**Example:**
```bash
# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

## ✅ Definition of Done (Frontend Auth Module)

- [ ] Login page functional with real API
- [ ] Register page functional with real API
- [ ] Password reset flow working
- [ ] MFA verification working (TOTP codes)
- [ ] Token refresh automatic and working
- [ ] Protected routes block unauthenticated users
- [ ] User profile page with edit capability
- [ ] Logout functional
- [ ] Responsive design (mobile + desktop)
- [ ] Unit tests ≥60% coverage
- [ ] E2E tests for auth flows
- [ ] No console errors
- [ ] Proper error handling and user feedback

---

## 🚀 Next Steps

1. **Read** `implementation/13-MODULE-Frontend.md`
2. **Set up** React project (Day 1)
3. **Build** login page (Day 1-2)
4. **Test** with running auth service
5. **Update** status file daily
6. **Ask questions** early via issues

---

**Good luck! 🎉**

**Contact:**
- Auth questions: @Senior-2 (Security Specialist)
- Frontend questions: @Main-Agent
- Blockers: Create 🔴 critical issue

---

**Last Updated:** 2025-11-04
**Auth Service Version:** v0.1.0 (75% complete)
**Next Auth Update:** OAuth2 integration (Week 3)
