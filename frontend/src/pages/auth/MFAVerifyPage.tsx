import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function MFAVerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();

  // Get temp token from localStorage (set during login)
  const tempToken = localStorage.getItem('mfaTempToken');

  useEffect(() => {
    // If no temp token, redirect to login
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Bitte geben Sie einen 6-stelligen Code ein.');
      return;
    }

    if (!tempToken) {
      setError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/mfa/verify', {
        temp_token: tempToken,
        code,
      });

      // Store tokens (backend uses snake_case)
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      localStorage.removeItem('mfaTempToken');

      // Set user state (convert snake_case to camelCase)
      setUser({
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        role: data.user.role,
        mfaEnabled: data.user.mfa_enabled || false,
      });

      setIsAuthenticated(true);

      // Redirect to original destination or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ungültiger Code. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('mfaTempToken');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-blue-600">
            PUTZI
          </h2>
          <p className="mt-2 text-center text-xs font-medium text-gray-500">
            Platform for Unified Ticketing & Zero Integration-Gaps
          </p>
          <p className="mt-1 text-center text-sm italic text-gray-600">
            „Saubere Prozesse – PUTZI macht's rein."
          </p>
          <p className="mt-4 text-center text-sm text-gray-600">
            Zwei-Faktor-Authentifizierung
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Authentifizierungscode
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein
              </p>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setError('');
                }}
                maxLength={6}
                placeholder="000000"
                className="mt-2 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                autoFocus
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifizieren...' : 'Verifizieren'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600">
              Kein Zugriff auf Ihre Authenticator-App?
            </p>
            <button
              type="button"
              className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-500"
              onClick={() => {
                // TODO: Implement recovery code verification
                alert('Wiederherstellungscodes werden in einer zukünftigen Version unterstützt.');
              }}
            >
              Wiederherstellungscode verwenden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
