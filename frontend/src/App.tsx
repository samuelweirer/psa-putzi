import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { MFASetupPage } from './pages/auth/MFASetupPage';
import { MFAVerifyPage } from './pages/auth/MFAVerifyPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerListPage } from './pages/crm/CustomerListPage';
import { CustomerDetailPage } from './pages/crm/CustomerDetailPage';
import { CreateCustomerPage } from './pages/crm/CreateCustomerPage';
import { EditCustomerPage } from './pages/crm/EditCustomerPage';
import { ContactListPage } from './pages/crm/contacts/ContactListPage';
import { CreateContactPage } from './pages/crm/contacts/CreateContactPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/mfa-verify" element={<MFAVerifyPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auth/mfa-setup"
            element={
              <ProtectedRoute>
                <MFASetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <CustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <CreateCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId/edit"
            element={
              <ProtectedRoute>
                <EditCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId/contacts"
            element={
              <ProtectedRoute>
                <ContactListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId/contacts/new"
            element={
              <ProtectedRoute>
                <CreateContactPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId"
            element={
              <ProtectedRoute>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
