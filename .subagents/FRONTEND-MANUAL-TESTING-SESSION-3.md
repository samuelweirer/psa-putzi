# Frontend Manual Testing Guide - Session 3
## Phase 2 Completion & Auth Flow Testing

**Date:** 2025-11-05
**Agent:** Junior Developer 5 (Frontend Agent - FRONTEND-001)
**Sprint:** Sprint 2
**Estimated Time:** 90-120 minutes

---

## Overview

This testing guide covers all remaining Phase 2 features and end-to-end testing:
- Full authentication flow (login, logout, session management)
- Password reset flow
- MFA setup and verification
- Responsive design across devices
- Navigation and routing across all pages

**Prerequisites:**
- Frontend dev server running on http://10.255.20.15:5173/
- Clean browser cache for accurate testing
- Test on multiple browsers: Chrome, Firefox, Safari/Edge
- Mobile device or responsive design mode for mobile tests

---

## Test Suite 1: Full Authentication Flow (15 tests)

### Setup
- Clear all cookies and local storage
- Start on http://10.255.20.15:5173/

### Test 1.1: Login Page Rendering
**Steps:**
1. Navigate to http://10.255.20.15:5173/
2. Should auto-redirect to /login

**Expected:**
- ✅ Login page displays with PSA Platform branding
- ✅ Email and password fields visible
- ✅ "Anmelden" button present
- ✅ Links to "Passwort vergessen?" and "Registrieren" present

### Test 1.2: Login Form Validation
**Steps:**
1. Click "Anmelden" without filling fields
2. Enter invalid email format
3. Enter valid email, short password

**Expected:**
- ✅ Shows "E-Mail ist erforderlich" for empty email
- ✅ Shows "Passwort ist erforderlich" for empty password
- ✅ Shows "Ungültige E-Mail-Adresse" for invalid format
- ✅ Shows "Mindestens 8 Zeichen" for short password

### Test 1.3: Successful Login (Without MFA)
**Steps:**
1. Enter: test@example.com / Test1234!
2. Click "Anmelden"
3. Wait for redirect

**Expected:**
- ✅ Loading spinner shows during login
- ✅ Redirects to /dashboard on success
- ✅ User name displays in sidebar
- ✅ Auth token stored in localStorage

**Verify:** Open DevTools → Application → Local Storage → Check for auth token

### Test 1.4: Login with Invalid Credentials
**Steps:**
1. Logout (click "Abmelden")
2. Enter: wrong@example.com / WrongPassword123
3. Click "Anmelden"

**Expected:**
- ✅ Error message displays
- ✅ Does NOT redirect
- ✅ Form fields remain filled
- ✅ Can retry login

### Test 1.5: Protected Route Access (Unauthenticated)
**Steps:**
1. Ensure logged out
2. Try to access: http://10.255.20.15:5173/dashboard
3. Try to access: http://10.255.20.15:5173/customers

**Expected:**
- ✅ Both redirect to /login
- ✅ Shows "Bitte melden Sie sich an" message (if implemented)

### Test 1.6: Session Persistence
**Steps:**
1. Login successfully
2. Navigate to /customers
3. Refresh page (F5)

**Expected:**
- ✅ Stays logged in after refresh
- ✅ Remains on /customers page
- ✅ No redirect to login

### Test 1.7: Logout Functionality
**Steps:**
1. While logged in, navigate to /dashboard
2. Click user menu in top-right
3. Click "Abmelden" button

**Expected:**
- ✅ Redirects to /login
- ✅ Auth token removed from localStorage
- ✅ Cannot access protected routes anymore

### Test 1.8: Multiple Tab Session Management
**Steps:**
1. Login in Tab 1
2. Open Tab 2 with same site
3. Tab 2 should show logged-in state
4. Logout in Tab 1
5. Try to navigate in Tab 2

**Expected:**
- ✅ Tab 2 shows logged-in state initially
- ✅ After logout in Tab 1, Tab 2 should redirect to login on next navigation
- ✅ Session is shared across tabs

### Test 1.9: Login Redirect After Session Expiry
**Steps:**
1. Login successfully
2. Manually delete auth token from localStorage
3. Try to navigate to /customers

**Expected:**
- ✅ Redirects to /login immediately
- ✅ Shows session expired message (if implemented)

### Test 1.10: Remember Me Functionality (if implemented)
**Steps:**
1. Login with "Remember Me" checked
2. Close browser completely
3. Reopen browser, navigate to site

**Expected:**
- ✅ Still logged in
- ✅ Token persists across browser sessions

### Test 1.11: Navigation After Login
**Steps:**
1. Login successfully
2. Click each sidebar item: Dashboard, Kunden, Tickets, etc.

**Expected:**
- ✅ Each route loads without redirecting to login
- ✅ Active route highlighted in sidebar
- ✅ Page content displays correctly

### Test 1.12: Direct URL Access (Authenticated)
**Steps:**
1. Login successfully
2. In address bar, navigate to: http://10.255.20.15:5173/customers/1
3. Navigate to: http://10.255.20.15:5173/customers/new

**Expected:**
- ✅ Both pages load without redirect
- ✅ Protected routes accessible when authenticated

### Test 1.13: Root Path Redirect
**Steps:**
1. While logged in, navigate to: http://10.255.20.15:5173/
2. While logged out, navigate to: http://10.255.20.15:5173/

**Expected:**
- ✅ Logged in: redirects to /dashboard
- ✅ Logged out: redirects to /login

### Test 1.14: 404 Handling
**Steps:**
1. While logged in, navigate to: http://10.255.20.15:5173/nonexistent-page
2. While logged out, navigate to same URL

**Expected:**
- ✅ Logged in: redirects to /login (catch-all route)
- ✅ Logged out: already at /login

### Test 1.15: Notification Bell (if implemented)
**Steps:**
1. Login successfully
2. Check notification bell in top-right

**Expected:**
- ✅ Bell icon displays
- ✅ Red dot shows unread notifications (mock data)

---

## Test Suite 2: Password Reset Flow (8 tests)

### Test 2.1: Access Forgot Password Page
**Steps:**
1. From login page, click "Passwort vergessen?"

**Expected:**
- ✅ Navigates to /auth/forgot-password
- ✅ Shows email input field
- ✅ Shows "Reset-Link senden" button

### Test 2.2: Forgot Password Form Validation
**Steps:**
1. Click "Reset-Link senden" without email
2. Enter invalid email format
3. Enter valid email

**Expected:**
- ✅ Shows "E-Mail ist erforderlich" for empty
- ✅ Shows "Ungültige E-Mail-Adresse" for invalid format
- ✅ No error for valid email

### Test 2.3: Request Password Reset
**Steps:**
1. Enter: test@example.com
2. Click "Reset-Link senden"

**Expected:**
- ✅ Loading spinner shows
- ✅ Success message: "Reset-Link wurde an Ihre E-Mail gesendet"
- ✅ Shows link back to login

### Test 2.4: Reset Password with Invalid Token
**Steps:**
1. Navigate to: /auth/reset-password?token=invalid-token
2. Check page state

**Expected:**
- ✅ Shows error: "Ungültiger oder abgelaufener Token"
- ✅ Cannot submit password form
- ✅ Shows link to request new reset

### Test 2.5: Reset Password Page Rendering
**Steps:**
1. Navigate to: /auth/reset-password?token=valid-mock-token
2. Check form fields

**Expected:**
- ✅ Shows new password field
- ✅ Shows confirm password field
- ✅ Shows "Passwort zurücksetzen" button
- ✅ Token is recognized as valid (mock)

### Test 2.6: Reset Password Form Validation
**Steps:**
1. On reset password page (with valid token)
2. Try to submit with empty fields
3. Enter mismatched passwords
4. Enter password < 8 characters

**Expected:**
- ✅ Shows "Passwort ist erforderlich" for empty
- ✅ Shows "Passwörter stimmen nicht überein" for mismatch
- ✅ Shows "Mindestens 8 Zeichen" for short password
- ✅ Shows password strength indicator

### Test 2.7: Successful Password Reset
**Steps:**
1. On reset password page (with valid token)
2. Enter: NewPassword123! (twice)
3. Click "Passwort zurücksetzen"

**Expected:**
- ✅ Loading spinner shows
- ✅ Success message displays
- ✅ Auto-redirects to /login after 2 seconds
- ✅ Can login with new password (mock)

### Test 2.8: Password Reset Link Expiry
**Steps:**
1. Navigate to: /auth/reset-password?token=expired-mock-token
2. Try to reset password

**Expected:**
- ✅ Shows "Link ist abgelaufen" error
- ✅ Cannot submit form
- ✅ Shows "Neuen Link anfordern" button

---

## Test Suite 3: MFA Setup & Verification (10 tests)

### Test 3.1: Access MFA Setup Page
**Steps:**
1. Login successfully
2. Navigate to: /auth/mfa-setup

**Expected:**
- ✅ Page loads (protected route)
- ✅ Shows QR code placeholder
- ✅ Shows backup codes section
- ✅ Shows "MFA aktivieren" button

### Test 3.2: MFA Setup Page UI
**Steps:**
1. On MFA setup page
2. Check all elements

**Expected:**
- ✅ QR code displays (mock)
- ✅ Shows text: "Scannen Sie den QR-Code mit Ihrer Authenticator-App"
- ✅ Shows manual entry code option
- ✅ Lists backup codes (8-10 codes)
- ✅ Shows "Download backup codes" option

### Test 3.3: Enable MFA
**Steps:**
1. On MFA setup page
2. Click "MFA aktivieren" button

**Expected:**
- ✅ Loading spinner shows
- ✅ Success message: "MFA wurde erfolgreich aktiviert"
- ✅ Redirects to dashboard after 2 seconds

### Test 3.4: Backup Codes Download
**Steps:**
1. On MFA setup page
2. Click "Backup-Codes herunterladen"

**Expected:**
- ✅ Downloads .txt file with backup codes
- ✅ File contains all backup codes
- ✅ File includes instructions

### Test 3.5: MFA Verification Page (Login Flow)
**Steps:**
1. Login with MFA-enabled account
2. After email/password, should redirect to MFA verify

**Expected:**
- ✅ Redirects to /auth/mfa-verify
- ✅ Shows 6-digit code input field
- ✅ Shows "Verwenden Sie einen Backup-Code" option
- ✅ Shows "Code überprüfen" button

### Test 3.6: MFA Code Validation
**Steps:**
1. On MFA verify page
2. Enter invalid code: 111111
3. Click "Code überprüfen"

**Expected:**
- ✅ Shows error: "Ungültiger Code"
- ✅ Does not redirect
- ✅ Can retry with different code

### Test 3.7: Successful MFA Verification
**Steps:**
1. On MFA verify page
2. Enter valid code: 123456 (mock)
3. Click "Code überprüfen"

**Expected:**
- ✅ Loading spinner shows
- ✅ Success message displays
- ✅ Redirects to /dashboard
- ✅ Full authentication complete

### Test 3.8: MFA with Backup Code
**Steps:**
1. On MFA verify page
2. Click "Verwenden Sie einen Backup-Code"
3. Enter backup code
4. Submit

**Expected:**
- ✅ Shows backup code input field
- ✅ Accepts 8-character backup code
- ✅ Success redirects to dashboard
- ✅ Shows warning: "Dieser Code kann nur einmal verwendet werden"

### Test 3.9: MFA Code Timeout
**Steps:**
1. On MFA verify page
2. Wait 60 seconds (if timeout implemented)

**Expected:**
- ✅ Shows timeout message (if implemented)
- ✅ Can request new code
- ✅ Or retry with same code (if code doesn't expire)

### Test 3.10: Disable MFA (Settings)
**Steps:**
1. Login with MFA-enabled account
2. Navigate to settings (if implemented)
3. Click "MFA deaktivieren"

**Expected:**
- ✅ Shows confirmation dialog
- ✅ Requires password confirmation
- ✅ Success message: "MFA wurde deaktiviert"
- ✅ Next login doesn't require MFA code

---

## Test Suite 4: Responsive Design - Mobile (12 tests)

### Setup
- Use Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
- Test on: iPhone 12 Pro (390x844), Samsung Galaxy S20 (360x800), iPad Air (820x1180)

### Test 4.1: Login Page Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /login
2. Check layout

**Expected:**
- ✅ Form fits screen width
- ✅ No horizontal scrolling
- ✅ Input fields are touch-friendly (min 44px height)
- ✅ Button is large enough for touch
- ✅ Links are readable and tappable

### Test 4.2: Sidebar Mobile Navigation
**Device:** iPhone 12 Pro
**Steps:**
1. Login successfully
2. Check sidebar on mobile

**Expected:**
- ✅ Sidebar is hidden by default
- ✅ Shows hamburger menu icon (if implemented)
- ✅ OR sidebar collapses to icons only
- ✅ Navigation is accessible

**Note:** If sidebar doesn't collapse, this is a bug to report.

### Test 4.3: Dashboard Mobile Layout
**Device:** iPhone 12 Pro
**Steps:**
1. On /dashboard
2. Scroll through page

**Expected:**
- ✅ Stats cards stack vertically
- ✅ All content fits screen width
- ✅ No horizontal scrolling
- ✅ Text is readable without zooming

### Test 4.4: Customer List Mobile View
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /customers
2. Check table display

**Expected:**
- ✅ Table is responsive (scrollable or card layout)
- ✅ Action buttons are touch-friendly
- ✅ Search and filters are accessible
- ✅ "Neuer Kunde" button visible and tappable

### Test 4.5: Customer Detail Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /customers/1
2. Check layout

**Expected:**
- ✅ Action buttons wrap on mobile (flex-wrap)
- ✅ 👥 Kontakte button wraps below
- ✅ 📍 Standorte button wraps below
- ✅ ✏️ Bearbeiten button accessible
- ✅ All tabs accessible (Übersicht, Tickets, etc.)

### Test 4.6: Create Customer Form Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /customers/new
2. Fill out form

**Expected:**
- ✅ All input fields fit screen
- ✅ Dropdown selects are touch-friendly
- ✅ Textarea resizes properly
- ✅ Submit button accessible at bottom
- ✅ Can scroll through entire form

### Test 4.7: Contacts Page Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /customers/1/contacts
2. Check card layout

**Expected:**
- ✅ Contact cards stack vertically
- ✅ Cards are full-width on mobile
- ✅ Avatar and info are readable
- ✅ Edit/Delete buttons accessible

### Test 4.8: Locations Page Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. Navigate to /customers/1/locations
2. Check card layout

**Expected:**
- ✅ Location cards stack vertically
- ✅ Cards are full-width on mobile
- ✅ Address info is readable
- ✅ Type badges display correctly

### Test 4.9: Status Workflow Dropdown Mobile
**Device:** iPhone 12 Pro
**Steps:**
1. On customer detail page
2. Click status badge to open workflow dropdown

**Expected:**
- ✅ Dropdown opens without overflow
- ✅ Fits within screen width
- ✅ Touch targets are large enough
- ✅ Backdrop closes dropdown on tap

### Test 4.10: Tablet Layout (iPad Air)
**Device:** iPad Air (820x1180)
**Steps:**
1. Navigate through all pages
2. Check layout

**Expected:**
- ✅ Sidebar visible and functional
- ✅ Grid layouts show 2 columns (contacts, locations)
- ✅ Customer table shows all columns
- ✅ Forms use 2-column layout (grid-cols-2)

### Test 4.11: Portrait vs Landscape
**Device:** iPhone 12 Pro
**Steps:**
1. View /customers in portrait
2. Rotate to landscape
3. Check layout adjustments

**Expected:**
- ✅ Layout adapts to landscape orientation
- ✅ No broken layouts or overlaps
- ✅ Content remains accessible

### Test 4.12: Touch Gestures
**Device:** iPhone 12 Pro
**Steps:**
1. Try scrolling on various pages
2. Try tapping all interactive elements

**Expected:**
- ✅ Smooth scrolling
- ✅ No accidental double-taps
- ✅ Links and buttons respond to touch
- ✅ Form inputs activate keyboard properly

---

## Test Suite 5: Navigation & Routing (15 tests)

### Test 5.1: Sidebar Navigation
**Steps:**
1. Login and go to dashboard
2. Click each sidebar item in order

**Expected:**
- ✅ Dashboard → /dashboard
- ✅ Kunden → /customers
- ✅ Tickets → /tickets (placeholder page or 404)
- ✅ Projekte → /projects (placeholder or 404)
- ✅ Rechnungen → /invoices (placeholder or 404)
- ✅ Berichte → /reports (placeholder or 404)
- ✅ Assets → /assets (placeholder or 404)

### Test 5.2: Active Route Highlighting
**Steps:**
1. Navigate to each route
2. Check sidebar highlighting

**Expected:**
- ✅ Current route is highlighted (blue border-left)
- ✅ Previous route loses highlighting
- ✅ Icon and text color change for active route

### Test 5.3: Breadcrumb Navigation
**Steps:**
1. Navigate to /customers/1/contacts
2. Check breadcrumb trail

**Expected:**
- ✅ Shows: Kunden → ABC GmbH → Kontakte
- ✅ Each breadcrumb is clickable
- ✅ Clicking "Kunden" goes to /customers
- ✅ Clicking "ABC GmbH" goes to /customers/1

### Test 5.4: Customer List → Detail Navigation
**Steps:**
1. On /customers page
2. Click "Anzeigen" on first customer

**Expected:**
- ✅ Navigates to /customers/1
- ✅ Customer detail page loads
- ✅ Breadcrumb shows customer name

### Test 5.5: Customer Detail → Edit Navigation
**Steps:**
1. On /customers/1 page
2. Click "✏️ Bearbeiten" button

**Expected:**
- ✅ Navigates to /customers/1/edit
- ✅ Edit form loads with customer data
- ✅ Breadcrumb shows "Bearbeiten"

### Test 5.6: Edit → Detail Back Navigation
**Steps:**
1. On /customers/1/edit page
2. Click "Abbrechen" button

**Expected:**
- ✅ Returns to /customers/1
- ✅ No data saved
- ✅ Customer detail page displays

### Test 5.7: Customer Detail → Contacts Navigation
**Steps:**
1. On /customers/1 page
2. Click "👥 Kontakte" button

**Expected:**
- ✅ Navigates to /customers/1/contacts
- ✅ Contact list loads
- ✅ Breadcrumb shows "Kunden → ABC GmbH → Kontakte"

### Test 5.8: Contacts → Create Navigation
**Steps:**
1. On /customers/1/contacts page
2. Click "➕ Neuer Kontakt" button

**Expected:**
- ✅ Navigates to /customers/1/contacts/new
- ✅ Create contact form loads
- ✅ Customer name displays in header

### Test 5.9: Create Contact → Success Redirect
**Steps:**
1. On /customers/1/contacts/new
2. Fill form and submit

**Expected:**
- ✅ Shows success message with checkmark
- ✅ Auto-redirects to /customers/1/contacts after 1.5 seconds
- ✅ New contact appears in list (mock)

### Test 5.10: Customer Detail → Locations Navigation
**Steps:**
1. On /customers/1 page
2. Click "📍 Standorte" button

**Expected:**
- ✅ Navigates to /customers/1/locations
- ✅ Location list loads
- ✅ Breadcrumb shows "Kunden → ABC GmbH → Standorte"

### Test 5.11: Locations → Create Navigation
**Steps:**
1. On /customers/1/locations page
2. Click "➕ Neuer Standort" button

**Expected:**
- ✅ Navigates to /customers/1/locations/new
- ✅ Create location form loads
- ✅ Customer name displays in header

### Test 5.12: Browser Back Button
**Steps:**
1. Navigate: /customers → /customers/1 → /customers/1/contacts
2. Click browser back button twice

**Expected:**
- ✅ First back: /customers/1
- ✅ Second back: /customers
- ✅ Correct page renders each time

### Test 5.13: Browser Forward Button
**Steps:**
1. After using back button (from 5.12)
2. Click browser forward button twice

**Expected:**
- ✅ First forward: /customers/1
- ✅ Second forward: /customers/1/contacts
- ✅ Correct page renders each time

### Test 5.14: Delete Customer → Redirect
**Steps:**
1. On /customers/1 page
2. Click "🗑️ Löschen"
3. Type customer name and confirm

**Expected:**
- ✅ Shows delete modal
- ✅ After confirmation, redirects to /customers
- ✅ Shows success message (if implemented)
- ✅ Customer removed from list (mock)

### Test 5.15: Deep Link Access
**Steps:**
1. Copy URL: http://10.255.20.15:5173/customers/1/contacts
2. Open new browser tab
3. Paste URL and navigate

**Expected:**
- ✅ If logged in: loads contacts page directly
- ✅ If logged out: redirects to /login, then back to /customers/1/contacts after login (if redirect implemented)

---

## Test Suite 6: Status Workflow Testing (8 tests)

### Test 6.1: Status Badge Display (List View)
**Steps:**
1. Navigate to /customers
2. Check status badges in table

**Expected:**
- ✅ ABC GmbH shows: ✅ Aktiv (green)
- ✅ XYZ AG shows: 👀 Interessent (blue)
- ✅ Consulting Partners shows: 🔍 Lead (gray)
- ✅ Digital Media shows: 💤 Inaktiv (yellow)
- ✅ All badges have correct colors and icons

### Test 6.2: Status Filter Dropdown
**Steps:**
1. On /customers page
2. Click status filter dropdown

**Expected:**
- ✅ Shows: Alle
- ✅ Shows: 🔍 Lead
- ✅ Shows: 👀 Interessent
- ✅ Shows: ✅ Aktiv
- ✅ Shows: 💤 Inaktiv
- ✅ Shows: ❌ Gekündigt

### Test 6.3: Filter by Status
**Steps:**
1. On /customers page
2. Select "Lead" from status filter

**Expected:**
- ✅ Only shows customers with Lead status
- ✅ Shows "Consulting Partners" (id: 5)
- ✅ Other customers hidden
- ✅ Count updates: "1 Kunden gefunden"

### Test 6.4: Status Workflow Display (Detail View)
**Steps:**
1. Navigate to /customers/1 (ABC GmbH - Active)
2. Check status badge next to company name

**Expected:**
- ✅ Shows: ✅ Aktiv (green badge)
- ✅ Has dropdown arrow (▼)
- ✅ Badge is clickable

### Test 6.5: Open Status Workflow Dropdown
**Steps:**
1. On /customers/1 page
2. Click status badge (✅ Aktiv)

**Expected:**
- ✅ Dropdown opens below badge
- ✅ Shows "Status ändern" header
- ✅ Shows workflow description: "Aktiv → Inaktiv oder Gekündigt"
- ✅ Shows "Aktueller Status" section with ✅ Aktiv
- ✅ Shows "Mögliche Status" section
- ✅ Shows "Alle Status" section

### Test 6.6: Status Workflow - Valid Transitions
**Steps:**
1. Customer status: Aktiv
2. Open status dropdown
3. Check available options

**Expected:**
- ✅ "Mögliche Status" shows: 💤 Inaktiv, ❌ Gekündigt
- ✅ These options have blue "Ändern →" text
- ✅ "Alle Status" shows: 🔍 Lead, 👀 Interessent (grayed out)
- ✅ Grayed options have gray "Ändern →" text

### Test 6.7: Change Customer Status
**Steps:**
1. Customer status: Aktiv
2. Open status dropdown
3. Click "💤 Inaktiv" in "Mögliche Status"

**Expected:**
- ✅ Shows loading spinner (⏳)
- ✅ Dropdown closes after ~500ms
- ✅ Badge updates to: 💤 Inaktiv (yellow)
- ✅ Status persists (refresh page to check)

### Test 6.8: Status Workflow - Full Lifecycle Test
**Steps:**
1. Navigate to customer with "Lead" status
2. Change: Lead → Interessent
3. Change: Interessent → Aktiv
4. Change: Aktiv → Inaktiv
5. Change: Inaktiv → Aktiv
6. Change: Aktiv → Gekündigt
7. Change: Gekündigt → Lead (restart cycle)

**Expected:**
- ✅ Each transition succeeds
- ✅ Badge color/icon updates correctly
- ✅ Workflow descriptions adjust per status
- ✅ Only valid next steps show in "Mögliche Status"
- ✅ Full workflow cycle completes

---

## Test Suite 7: Cross-Browser Testing (6 tests)

### Test 7.1: Chrome
**Steps:**
1. Open site in Google Chrome
2. Run Tests 1.1-1.7 (Basic auth flow)

**Expected:**
- ✅ All tests pass
- ✅ No console errors
- ✅ Layout renders correctly

### Test 7.2: Firefox
**Steps:**
1. Open site in Mozilla Firefox
2. Run Tests 1.1-1.7 (Basic auth flow)

**Expected:**
- ✅ All tests pass
- ✅ No console errors
- ✅ Layout renders correctly

### Test 7.3: Safari (macOS) or Edge (Windows)
**Steps:**
1. Open site in Safari (Mac) or Edge (Windows)
2. Run Tests 1.1-1.7 (Basic auth flow)

**Expected:**
- ✅ All tests pass
- ✅ No console errors
- ✅ Layout renders correctly

### Test 7.4: Browser Console Errors
**Steps:**
1. In each browser, open DevTools Console
2. Navigate through key pages: /login, /dashboard, /customers, /customers/1

**Expected:**
- ✅ No red errors in console
- ✅ No 404 errors for assets
- ✅ No React warnings
- ✅ Only expected dev messages (if any)

### Test 7.5: Network Tab Inspection
**Steps:**
1. Open DevTools → Network tab
2. Navigate through site
3. Check for failed requests

**Expected:**
- ✅ All assets load successfully (200 status)
- ✅ No 404 or 500 errors
- ✅ Fast page loads (< 2 seconds)

### Test 7.6: Browser Storage
**Steps:**
1. In each browser, open DevTools → Application
2. Check Local Storage after login

**Expected:**
- ✅ Auth token stored correctly
- ✅ Token format is valid (mock JWT)
- ✅ Token persists after page refresh

---

## Bug Reporting Template

Use this template when reporting bugs:

```markdown
### Bug: [Short Description]

**Severity:** Critical / High / Medium / Low
**Browser:** Chrome 120 / Firefox 121 / Safari 17
**Device:** Desktop / iPhone 12 Pro / iPad Air
**Test:** Suite X, Test Y.Z

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Screenshots:**
[Attach if applicable]

**Console Errors:**
[Paste any errors from DevTools Console]

**Additional Notes:**

```

---

## Test Results Summary

After completing all tests, fill out this summary:

### Overview
- **Total Tests:** 84
- **Tests Passed:** ___
- **Tests Failed:** ___
- **Tests Skipped:** ___
- **Bugs Found:** ___

### Test Suite Results
- [ ] Suite 1: Full Authentication Flow (15 tests)
- [ ] Suite 2: Password Reset Flow (8 tests)
- [ ] Suite 3: MFA Setup & Verification (10 tests)
- [ ] Suite 4: Responsive Design - Mobile (12 tests)
- [ ] Suite 5: Navigation & Routing (15 tests)
- [ ] Suite 6: Status Workflow Testing (8 tests)
- [ ] Suite 7: Cross-Browser Testing (6 tests)

### Critical Issues Found
1.
2.
3.

### Recommendations
1.
2.
3.

### Sign-off
- **Tester:** _______________
- **Date:** _______________
- **Approved for Production:** Yes / No / With Conditions

---

## Notes for Developers

### Known Limitations (Mock Data)
- All API calls are simulated with setTimeout
- Authentication uses mock tokens (no real JWT validation)
- MFA codes are hardcoded: 123456
- Password reset tokens are not validated server-side
- Customer data is not persisted (resets on page refresh)

### Features Not Yet Implemented
- Real API integration (Sprint 4+)
- Ticket management pages
- Project management pages
- Invoice/billing pages
- Reports/analytics pages
- Asset management pages
- Mobile hamburger menu (sidebar should collapse but might not)
- Session timeout warnings
- Real-time notifications

### Performance Targets
- Initial page load: < 2 seconds
- Route navigation: < 500ms
- Form submission: < 1 second (including mock delay)
- TypeScript compilation: 0 errors

---

**End of Manual Testing Guide - Session 3**
