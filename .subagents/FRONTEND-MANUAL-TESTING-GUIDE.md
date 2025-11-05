# Frontend Manual Testing Guide

**Frontend URL:** http://10.255.20.15:5173/
**Backend API:** http://10.255.20.15:3001
**Date:** 2025-11-05
**Branch:** `claude/session-011CUa86VGPkHjf5rHUmwfvG`

---

## ✅ Automated Checks (Already Verified)

- **TypeScript Compilation:** ✅ PASSED (0 errors)
- **Dev Server:** ✅ RUNNING (http://10.255.20.15:5173/)
- **Backend Auth Service:** ✅ RUNNING (http://10.255.20.15:3001)
- **Route Configuration:** ✅ VERIFIED (all routes properly configured)
- **Code Quality:** ✅ VERIFIED (no obvious bugs found in code review)

---

## 📋 Manual Testing Checklist

### Test 1: Registration Flow (5 minutes)

**URL:** http://10.255.20.15:5173/auth/register

1. [ ] Navigate to registration page
2. [ ] Verify PUTZI branding displays
3. [ ] Fill out form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `testuser$(date +%s)@example.com` (use unique email!)
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
4. [ ] **Watch password requirements checklist** - all should show green checkmarks
5. [ ] Click "Registrieren"
6. [ ] **Expected:** Auto-login and redirect to Dashboard
7. [ ] **Expected:** User name "Test User" shows in header

**Screenshot checkpoint:** Dashboard after registration

---

### Test 2: Logout & Login Flow (3 minutes)

1. [ ] Click "Logout" button in Dashboard header
2. [ ] **Expected:** Redirect to login page
3. [ ] Enter credentials from Test 1
4. [ ] Click "Anmelden"
5. [ ] **Expected:** Redirect to Dashboard
6. [ ] **Expected:** User name displays in header

**Screenshot checkpoint:** Login page, Dashboard after login

---

### Test 3: Dashboard Exploration (5 minutes)

**URL:** http://10.255.20.15:5173/dashboard

1. [ ] Verify all 6 stats widgets display:
   - Offene Tickets (23)
   - Meine Tickets (7)
   - Aktive Kunden (45)
   - Offene Rechnungen (8)
   - Umsatz (€12,450)
   - Laufende Projekte (12)

2. [ ] Verify Quick Actions panel displays 4 actions

3. [ ] Verify Recent Activity feed shows 4 items

4. [ ] Click "Alle anzeigen →" link on "Aktive Kunden" widget
   - **Expected:** Navigate to /customers

**Screenshot checkpoint:** Full dashboard view

---

### Test 4: Customer List Page (10 minutes)

**URL:** http://10.255.20.15:5173/customers

1. [ ] Verify table displays 5 customers (first page)
2. [ ] Verify header shows "8 Kunden gefunden"

**Search Testing:**
3. [ ] Type "ABC" in search box
   - **Expected:** Filter to show only "ABC GmbH"
4. [ ] Clear search, type "max@"
   - **Expected:** Filter to show only customers with "max@" in email
5. [ ] Clear search

**Filter Testing:**
6. [ ] Select Status: "Inaktiv"
   - **Expected:** Show only inactive customers (2 customers)
7. [ ] Reset Status to "Alle"
8. [ ] Select Vertragstyp: "Managed Services"
   - **Expected:** Show only managed services customers
9. [ ] Reset to "Alle"

**Pagination Testing:**
10. [ ] Click page "2" button
    - **Expected:** Show customers 6-8 (3 customers)
11. [ ] Click "←" (back) button
    - **Expected:** Return to page 1

**Navigation Testing:**
12. [ ] Click "Anzeigen" link on first customer (ABC GmbH)
    - **Expected:** Navigate to /customers/1

**Screenshot checkpoints:** List view, search results, pagination

---

### Test 5: Customer Detail Page (8 minutes)

**URL:** http://10.255.20.15:5173/customers/1

1. [ ] Verify breadcrumb: "Kunden → ABC GmbH"
2. [ ] Verify customer name "ABC GmbH" in header
3. [ ] Verify status badge shows "Aktiv" (green)
4. [ ] Verify contract badge shows "Managed Services" (blue)

**Tab Testing:**
5. [ ] Click "Übersicht" tab (should be active by default)
   - [ ] Verify Contact Information section (left)
   - [ ] Verify Address section (right)
   - [ ] Verify all fields display correctly

6. [ ] Click "Tickets" tab
   - [ ] Verify 3 tickets display
   - [ ] Verify first ticket shows "Offen" status (red badge)
   - [ ] Verify priority badges display

7. [ ] Click "Verträge" tab
   - [ ] Verify 2 contracts display
   - [ ] Verify monthly values show (€2,500, €500)

8. [ ] Click "Rechnungen" tab
   - [ ] Verify 3 invoices display in table
   - [ ] Verify status badges (Ausstehend, Bezahlt)

**Navigation Testing:**
9. [ ] Click breadcrumb "Kunden" link
   - **Expected:** Return to customer list

**Screenshot checkpoints:** Each tab view

---

### Test 6: Create Customer Page (10 minutes)

**URL:** http://10.255.20.15:5173/customers/new

1. [ ] Click "Neuer Kunde" button from customer list
2. [ ] Verify breadcrumb: "Kunden → Neuer Kunde"
3. [ ] Verify 4 form sections display

**Validation Testing:**
4. [ ] Click "Kunde erstellen" with empty form
   - **Expected:** Error message "Firmenname ist erforderlich"

5. [ ] Fill only Firmenname: "Test GmbH", click submit
   - **Expected:** Error message about missing required field

6. [ ] Fill email with invalid format: "notanemail"
   - **Expected:** Error message "Ungültige E-Mail-Adresse"

**Successful Submission:**
7. [ ] Fill out complete form:
   - Firmenname: `Test Company GmbH`
   - Ansprechpartner: `John Doe`
   - Vertragstyp: `Managed Services`
   - E-Mail: `john@testcompany.de`
   - Telefon: `+49 30 99999999`
   - Website: `www.testcompany.de`
   - Straße: `Teststraße 1`
   - PLZ: `10115`
   - Stadt: `Berlin`
   - Land: `Deutschland`
   - Steuernummer: `DE999999999`
   - Notizen: `Test customer for QA`

8. [ ] Click "Kunde erstellen"
9. [ ] **Expected:** Success message displays with customer name
10. [ ] **Expected:** Auto-redirect to /customers after 2 seconds
11. [ ] **Expected:** New customer appears in list (should NOT actually save - it's mock!)

**Screenshot checkpoints:** Empty form, validation errors, success message

---

### Test 7: Password Reset Flow (10 minutes)

**URL:** http://10.255.20.15:5173/auth/forgot-password

1. [ ] Logout from dashboard
2. [ ] Navigate to login page
3. [ ] Click "Passwort vergessen?" link
4. [ ] Enter email from Test 1
5. [ ] Click "Link senden"
6. [ ] **Expected:** Success message displays
7. [ ] **Expected:** Blue box shows development mode notice about server logs

**Check Server Logs:**
8. [ ] SSH to server and check auth service logs:
   ```bash
   pm2 logs psa-auth-service --lines 50 | grep "reset"
   ```
9. [ ] Copy reset token from logs

**Reset Password:**
10. [ ] Navigate to: `http://10.255.20.15:5173/auth/reset-password?token=PASTE_TOKEN_HERE`
11. [ ] Enter new password: `NewPass1234!`
12. [ ] Confirm password: `NewPass1234!`
13. [ ] **Watch password requirements checklist** - all green
14. [ ] Click "Passwort zurücksetzen"
15. [ ] **Expected:** Success message
16. [ ] **Expected:** Auto-redirect to login after 3 seconds
17. [ ] Login with NEW password
18. [ ] **Expected:** Successful login to dashboard

**Screenshot checkpoints:** Forgot password, success, reset form, final success

---

### Test 8: MFA Setup & Verification (15 minutes)

**Prerequisites:** Authenticator app on phone (Google Authenticator, Authy, etc.)

**MFA Setup:**
1. [ ] Navigate to: http://10.255.20.15:5173/auth/mfa-setup
2. [ ] **Expected:** QR code displays
3. [ ] Scan QR code with authenticator app
4. [ ] **Expected:** App shows 6-digit code for "PUTZI (email@example.com)"
5. [ ] Verify recovery codes display (10 codes)
6. [ ] Click "Codes herunterladen" button
7. [ ] **Expected:** File downloads: `putzi-recovery-codes.txt`
8. [ ] Open file and verify 10 codes listed
9. [ ] Enter 6-digit code from authenticator app
10. [ ] Click "MFA aktivieren"
11. [ ] **Expected:** Success message
12. [ ] **Expected:** Redirect to dashboard

**MFA Login Test:**
13. [ ] Logout from dashboard
14. [ ] Navigate to login page
15. [ ] Enter email/password
16. [ ] Click "Anmelden"
17. [ ] **Expected:** Redirect to /auth/mfa-verify (NOT dashboard!)
18. [ ] Enter 6-digit code from authenticator app
19. [ ] Click "Verifizieren"
20. [ ] **Expected:** Redirect to dashboard
21. [ ] **Expected:** Successful authenticated session

**Screenshot checkpoints:** QR code, recovery codes, MFA verify page, success

---

### Test 9: Error States Testing (10 minutes)

**Login Errors:**
1. [ ] Go to login page
2. [ ] Enter wrong password
   - **Expected:** Red error box with message
3. [ ] Enter non-existent email
   - **Expected:** Red error box with message

**Registration Errors:**
4. [ ] Go to registration page
5. [ ] Try to register with existing email
   - **Expected:** Error message about duplicate email

**Password Validation:**
6. [ ] Enter password: `test` (too short)
   - **Expected:** Requirements checklist shows unmet requirements
7. [ ] Enter password: `testtest` (no uppercase)
   - **Expected:** "Ein Großbuchstabe" shows gray/unchecked
8. [ ] Enter password: `TESTTEST` (no lowercase)
   - **Expected:** "Ein Kleinbuchstabe" shows gray/unchecked

**Screenshot checkpoints:** Each error state

---

### Test 10: Responsive Design (5 minutes)

1. [ ] Open DevTools (F12)
2. [ ] Toggle device toolbar (Ctrl+Shift+M)
3. [ ] Test mobile view (iPhone SE - 375px):
   - [ ] Dashboard stats stack vertically
   - [ ] Navigation hamburger menu (if implemented)
   - [ ] Customer list table scrolls horizontally

4. [ ] Test tablet view (iPad - 768px):
   - [ ] Dashboard stats show 2 columns
   - [ ] Customer list table displays properly

5. [ ] Test desktop view (1920px):
   - [ ] Dashboard stats show 3 columns
   - [ ] All content fits properly

**Screenshot checkpoints:** Mobile, tablet, desktop views

---

## 🐛 Bug Reporting Template

If you find any issues during testing, create an issue file:

`.subagents/issues/2025-11-05-frontend-bug-DESCRIPTION.md`

```markdown
# Frontend Bug: [Short Description]

**Severity:** 🔴 Critical / 🟡 Important / 🟢 Minor
**Reported By:** [Your Name]
**Date:** 2025-11-05
**Module:** Frontend (React)

## Description
[What happened?]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Screenshots
[Attach screenshots if possible]

## Environment
- Browser: [Chrome/Firefox/Safari + version]
- Screen size: [Mobile/Tablet/Desktop]
- URL: [Full URL where bug occurred]

## Additional Context
[Any other relevant information]

## Recommended Fix
[If known]
```

---

## ✅ Testing Completion Checklist

After completing all tests above:

- [ ] All 10 test scenarios completed
- [ ] Screenshots captured for all checkpoints
- [ ] Any bugs reported in issues directory
- [ ] Update FRONTEND-TESTING-REPORT-2025-11-05.md with results
- [ ] Update frontend-agent status file with testing completion
- [ ] Notify PM of testing completion

---

## 📊 Expected Results Summary

**All tests should PASS with these conditions:**
- ✅ TypeScript compilation: 0 errors
- ✅ No console errors in browser DevTools
- ✅ All routes navigate correctly
- ✅ All forms validate properly
- ✅ All API calls succeed (auth service running)
- ✅ UI is responsive on all screen sizes
- ✅ German localization displays correctly
- ✅ Mock data displays in all CRM pages

---

**Estimated Testing Time:** 90 minutes (full comprehensive test)
**Quick Test (smoke test):** 20 minutes (Test 1-3 only)

**Last Updated:** 2025-11-05 10:25 UTC
**Created By:** Junior Developer 5 (Frontend Agent)
