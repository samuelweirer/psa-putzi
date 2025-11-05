# Frontend Manual Testing Guide - Session 2
## Navigation Sidebar + Edit Customer Features

**Date Created:** 2025-11-05
**Session:** claude/session-011CUa86VGPkHjf5rHUmwfvG
**Features to Test:** Navigation Sidebar, Edit Customer Page
**Estimated Testing Time:** 30 minutes
**Tester:** [Your Name]
**Frontend URL:** http://10.255.20.15:5173

---

## 📋 Pre-Testing Checklist

- [ ] Frontend dev server is running (`npm run dev` in `/opt/psa-putzi/frontend`)
- [ ] Auth service is running (port 3001)
- [ ] Browser console is open (F12) to check for errors
- [ ] You have test credentials ready (or can register new account)

---

## Test Suite 1: Navigation Sidebar (NEW) ✨

### Test 1.1: Sidebar Display and Branding
**Expected Result:** Sidebar displays with PUTZI branding and user info

**Steps:**
1. Log in to the application
2. Navigate to Dashboard page

**Verify:**
- [ ] Sidebar is visible on the left side (width: 256px)
- [ ] "PUTZI" logo is displayed at the top in blue
- [ ] Tagline shows: "„Saubere Prozesse – PUTZI macht's rein.""
- [ ] User profile section shows your initials in a blue circle
- [ ] User's full name is displayed
- [ ] User's email is displayed

**Screenshot:** `sidebar-display.png`

---

### Test 1.2: Navigation Menu Items
**Expected Result:** All menu items are visible with correct icons and badges

**Steps:**
1. Look at the main navigation section in the sidebar

**Verify:**
- [ ] **Dashboard** (📊 icon) - no badge
- [ ] **Kunden** (🏢 icon) - badge shows "45"
- [ ] **Tickets** (🎫 icon) - badge shows "23"
- [ ] **Projekte** (📋 icon) - badge shows "12"
- [ ] **Rechnungen** (💶 icon) - badge shows "8"
- [ ] **Berichte** (📈 icon) - no badge
- [ ] **Assets** (💻 icon) - no badge
- [ ] **Einstellungen** (⚙️ icon) at bottom - no badge
- [ ] **Hilfe** (❓ icon) at bottom - no badge

**Screenshot:** `sidebar-menu-items.png`

---

### Test 1.3: Active Route Highlighting
**Expected Result:** Current page is highlighted with blue background

**Steps:**
1. Navigate to Dashboard page
2. Navigate to Kunden (Customers) page
3. Navigate to Dashboard page again

**Verify:**
- [ ] On Dashboard: "Dashboard" menu item has blue background (`bg-blue-50`)
- [ ] On Dashboard: "Dashboard" text is blue (`text-blue-700`)
- [ ] On Kunden page: "Kunden" menu item has blue background
- [ ] On Kunden page: "Kunden" badge has blue background (`bg-blue-200`)
- [ ] Inactive items have gray background on hover only
- [ ] Only ONE item is highlighted at a time

**Screenshot:** `sidebar-active-highlighting.png`

---

### Test 1.4: Navigation Click Functionality
**Expected Result:** Clicking menu items navigates to correct pages

**Steps:**
1. Click "Dashboard" → Should navigate to `/dashboard`
2. Click "Kunden" → Should navigate to `/customers`
3. Click "Tickets" → Currently shows 404 or redirects (not implemented yet)
4. Click "Projekte" → Currently shows 404 or redirects (not implemented yet)
5. Click "Einstellungen" → Currently shows 404 or redirects (not implemented yet)

**Verify:**
- [ ] Dashboard navigation works ✅
- [ ] Kunden navigation works ✅
- [ ] Browser URL updates correctly
- [ ] No console errors during navigation
- [ ] Active highlighting updates immediately

**Console Errors:** [Note any errors here]

---

### Test 1.5: Top Bar and Logout
**Expected Result:** Top bar shows notifications and logout button

**Steps:**
1. Look at the top bar (right side)

**Verify:**
- [ ] "PSA Platform" title is displayed on the left
- [ ] Bell icon (🔔) for notifications is visible
- [ ] Red dot badge appears on bell icon (notification indicator)
- [ ] "Abmelden" (Logout) button is visible
- [ ] Clicking "Abmelden" logs you out
- [ ] After logout, you're redirected to `/login`

**Screenshot:** `topbar-logout.png`

---

## Test Suite 2: Edit Customer Page (NEW) ✨

### Test 2.1: Access Edit Customer Page
**Expected Result:** Edit page loads with customer data

**Steps:**
1. Navigate to `/customers`
2. Click "Anzeigen" on first customer (ABC GmbH)
3. Click "✏️ Bearbeiten" button in top right

**Verify:**
- [ ] URL changes to `/customers/1/edit`
- [ ] Loading spinner appears briefly
- [ ] Breadcrumb shows: Kunden → ABC GmbH → Bearbeiten
- [ ] Page title shows "Kunde bearbeiten"
- [ ] Form loads with customer data pre-filled

**Screenshot:** `edit-customer-page.png`

---

### Test 2.2: Pre-Filled Form Data
**Expected Result:** All fields are pre-populated with existing customer data

**Steps:**
1. On Edit Customer page, review all form fields

**Verify Pre-Filled Values:**
- [ ] **Firmenname:** "ABC GmbH"
- [ ] **Ansprechpartner:** "Max Mustermann"
- [ ] **E-Mail:** "max@abc-gmbh.de"
- [ ] **Telefon:** "+49 30 12345678"
- [ ] **Website:** "https://www.abc-gmbh.de"
- [ ] **Straße:** "Musterstraße 123"
- [ ] **PLZ:** "10115"
- [ ] **Stadt:** "Berlin"
- [ ] **Land:** "Deutschland"
- [ ] **Vertragstyp:** "Managed Services"
- [ ] **Status:** "Aktiv"
- [ ] **Umsatzsteuer-ID:** "DE123456789"
- [ ] **Notizen:** "Wichtiger Kunde seit 2020"

**Screenshot:** `edit-form-prefilled.png`

---

### Test 2.3: Form Validation
**Expected Result:** Validation errors display for invalid data

**Steps:**
1. Clear the "Firmenname" field
2. Click "Änderungen speichern"

**Verify:**
- [ ] Red error message appears: "Firmenname ist erforderlich."
- [ ] Form does NOT submit
- [ ] Browser required field validation appears

**Additional Validation Tests:**
1. Clear "E-Mail" field → Should show "E-Mail ist erforderlich."
2. Enter invalid email "test@" → Should show "Bitte geben Sie eine gültige E-Mail-Adresse ein."
3. Clear "Telefon" field → Should show "Telefonnummer ist erforderlich."

**Screenshot:** `edit-validation-errors.png`

---

### Test 2.4: Update Customer Data
**Expected Result:** Changes save successfully and redirect to detail page

**Steps:**
1. Make valid changes to customer data:
   - Change "Ansprechpartner" to "Anna Schmidt"
   - Change "Telefon" to "+49 30 99999999"
   - Change "Status" to "Inaktiv"
   - Add text to "Notizen": "Kunde aktualisiert am [today]"
2. Click "💾 Änderungen speichern"

**Verify:**
- [ ] Button shows "⏳ Speichern..." with spinning icon
- [ ] Button is disabled during save
- [ ] Success message appears after ~1 second:
  - Green checkmark icon (✓)
  - "Änderungen gespeichert!"
  - "Die Kundendaten wurden erfolgreich aktualisiert."
  - "Sie werden weitergeleitet..."
- [ ] After 1.5 seconds, redirects to `/customers/1`
- [ ] You're back on Customer Detail page

**Screenshot:** `edit-success-message.png`

**Note:** Changes are NOT persisted (mock data) - this is expected until Sprint 4 backend integration.

---

### Test 2.5: Cancel Edit
**Expected Result:** Cancel button returns to detail page without saving

**Steps:**
1. Navigate to Edit Customer page again
2. Make some changes to the form (don't save)
3. Click "Abbrechen" button

**Verify:**
- [ ] Immediately redirects to `/customers/1` (detail page)
- [ ] No success message appears
- [ ] No save operation occurs
- [ ] Changes are discarded

**Screenshot:** `edit-cancel-button.png`

---

### Test 2.6: Breadcrumb Navigation
**Expected Result:** Breadcrumb links navigate correctly

**Steps:**
1. On Edit Customer page, click "Kunden" in breadcrumb
2. Return to Edit page via "Bearbeiten" button
3. Click "ABC GmbH" in breadcrumb

**Verify:**
- [ ] Clicking "Kunden" → navigates to `/customers`
- [ ] Clicking customer name → navigates to `/customers/1`
- [ ] "Bearbeiten" text is not clickable (current page)
- [ ] Breadcrumb separator is "→" arrow

**Screenshot:** `edit-breadcrumb.png`

---

### Test 2.7: Edit Page with Sidebar Navigation
**Expected Result:** Sidebar navigation works on Edit page

**Steps:**
1. On Edit Customer page, try clicking sidebar items

**Verify:**
- [ ] Clicking "Dashboard" navigates away (without saving - expected)
- [ ] Clicking "Kunden" navigates to customer list
- [ ] Sidebar "Kunden" item is highlighted (active route starts with `/customers`)
- [ ] All sidebar functionality works normally

**Screenshot:** `edit-with-sidebar.png`

---

## Test Suite 3: Integration Tests

### Test 3.1: Full Customer Edit Workflow
**Expected Result:** Complete workflow works end-to-end

**Steps:**
1. Start at Dashboard
2. Click "Kunden" in sidebar
3. Click "Anzeigen" on a customer
4. Click "✏️ Bearbeiten" button
5. Change some fields
6. Click "Änderungen speichern"
7. Wait for redirect to detail page

**Verify:**
- [ ] No console errors during entire workflow
- [ ] Navigation is smooth (no page refreshes)
- [ ] Active route highlighting updates correctly
- [ ] Success message displays
- [ ] Redirect works correctly

**Time taken:** _____ seconds
**Console Errors:** [List any errors]

---

### Test 3.2: CustomerList "Bearbeiten" Link
**Expected Result:** "Bearbeiten" link in customer list works

**Steps:**
1. Navigate to `/customers`
2. Find "Bearbeiten" link in the Actions column
3. Click "Bearbeiten" for first customer

**Verify:**
- [ ] Navigates to `/customers/1/edit`
- [ ] Edit page loads with correct data
- [ ] Breadcrumb shows customer name

**Screenshot:** `customerlist-edit-link.png`

---

### Test 3.3: Responsive Design - Sidebar
**Expected Result:** Sidebar adapts to different screen sizes

**Steps:**
1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x667

**Verify:**
- [ ] Desktop: Sidebar visible, full width (256px)
- [ ] Tablet: Sidebar may need scroll
- [ ] Mobile: Sidebar should ideally collapse (not implemented yet - note as future enhancement)
- [ ] Content area adapts to remaining space

**Screenshots:**
- `sidebar-desktop.png`
- `sidebar-tablet.png`
- `sidebar-mobile.png`

**Issues Found:** [Note any responsive issues]

---

## Test Suite 4: Browser Compatibility

### Test 4.1: Chrome/Edge (Chromium)
**Expected Result:** All features work in Chrome

**Browser:** Chrome _____ / Edge _____

**Verify:**
- [ ] Sidebar displays correctly
- [ ] Navigation works
- [ ] Edit page loads
- [ ] Form validation works
- [ ] Success message displays
- [ ] No console errors

---

### Test 4.2: Firefox
**Expected Result:** All features work in Firefox

**Browser:** Firefox _____

**Verify:**
- [ ] Sidebar displays correctly
- [ ] Navigation works
- [ ] Edit page loads
- [ ] Form validation works
- [ ] Success message displays
- [ ] No console errors

---

### Test 4.3: Safari (if available)
**Expected Result:** All features work in Safari

**Browser:** Safari _____

**Verify:**
- [ ] Sidebar displays correctly
- [ ] Navigation works
- [ ] Edit page loads
- [ ] Form validation works
- [ ] Success message displays
- [ ] No console errors

---

## Test Suite 5: Performance and UX

### Test 5.1: Page Load Performance
**Expected Result:** Pages load quickly

**Steps:**
1. Open Network tab in DevTools
2. Navigate to different pages
3. Measure load times

**Verify:**
- [ ] Dashboard loads in < 1 second
- [ ] Customer List loads in < 1 second
- [ ] Edit page (with mock API delay) loads in ~500ms
- [ ] No unnecessary re-renders
- [ ] Sidebar doesn't flicker during navigation

**Load Times:**
- Dashboard: _____ ms
- Customer List: _____ ms
- Edit Customer: _____ ms

---

### Test 5.2: Loading States
**Expected Result:** User sees feedback during loading

**Steps:**
1. Navigate to Edit Customer page
2. Observe loading spinner
3. Save changes and observe button state

**Verify:**
- [ ] Loading spinner appears immediately
- [ ] Spinner is centered on page
- [ ] "Lade Kundendaten..." text displays
- [ ] Save button shows "⏳ Speichern..." during save
- [ ] Button is disabled during save
- [ ] User cannot click save multiple times

**Screenshot:** `loading-states.png`

---

## Test Suite 6: Error Handling

### Test 6.1: Invalid Customer ID
**Expected Result:** Graceful handling of invalid ID

**Steps:**
1. Navigate to `/customers/999999/edit` (non-existent customer)

**Current Behavior:**
- [ ] Page loads with mock data anyway (expected for now)
- [ ] In Sprint 4, should show 404 or error message

**Note:** Error handling will be improved with backend integration.

---

### Test 6.2: Network Errors (Future)
**Expected Result:** Error messages display for network issues

**Note:** Cannot fully test without real backend. Will test in Sprint 4.

---

## 🐛 Bugs Found

### Bug Template
**Bug ID:** [Sequential number]
**Severity:** [Low / Medium / High / Critical]
**Component:** [Sidebar / Edit Page / etc.]
**Description:** [What went wrong]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Behavior:** [What should happen]
**Actual Behavior:** [What actually happened]
**Screenshot:** [filename.png]
**Browser:** [Chrome / Firefox / Safari + version]
**Console Errors:** [Any errors]

---

## 📊 Test Summary

**Date Tested:** _____________________
**Tester:** _____________________
**Time Taken:** _____ minutes

### Test Results

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|---------|---------|---------|
| 1. Navigation Sidebar | 5 | __ | __ | __ |
| 2. Edit Customer Page | 7 | __ | __ | __ |
| 3. Integration Tests | 3 | __ | __ | __ |
| 4. Browser Compatibility | 3 | __ | __ | __ |
| 5. Performance & UX | 2 | __ | __ | __ |
| 6. Error Handling | 2 | __ | __ | __ |
| **TOTAL** | **22** | **__** | **__** | **__** |

### Overall Status
- [ ] ✅ All tests passed
- [ ] ⚠️ Minor issues found (see Bugs section)
- [ ] ❌ Critical issues found (see Bugs section)

### Notes
[Any additional observations or feedback]

---

## 📝 Recommendations for PM

### High Priority
- [ ] [List any critical issues that block release]

### Medium Priority
- [ ] Mobile sidebar collapse functionality (future enhancement)
- [ ] Keyboard navigation for sidebar (accessibility)
- [ ] Focus management after navigation

### Low Priority
- [ ] Tooltip on hover for sidebar icons
- [ ] Smooth scroll animations
- [ ] Dark mode support (future)

---

## ✅ Sign-Off

**Tester Signature:** _____________________
**Date:** _____________________

**Status:**
- [ ] Approved for merge
- [ ] Approved with minor issues
- [ ] Requires fixes before merge

---

**Last Updated:** 2025-11-05
**Document Version:** 1.0
**Related Files:**
- `/opt/psa-putzi/frontend/src/components/layout/Sidebar.tsx`
- `/opt/psa-putzi/frontend/src/components/layout/DashboardLayout.tsx`
- `/opt/psa-putzi/frontend/src/pages/crm/EditCustomerPage.tsx`
- `/opt/psa-putzi/frontend/src/App.tsx`

**Git Commits:**
- c588295 - Sidebar and DashboardLayout components
- fc3f27a - Integrate DashboardLayout into Dashboard page
- 54751ff - Integrate DashboardLayout into CustomerList page
- 29174d6 - Integrate DashboardLayout into CustomerDetail page
- 8398027 - Integrate DashboardLayout into CreateCustomer page
- 4e0001f - Add Edit Customer page with pre-filled form
