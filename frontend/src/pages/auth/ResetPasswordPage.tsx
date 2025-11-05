import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setError('Ungültiger oder fehlender Reset-Token. Bitte fordern Sie einen neuen Link an.');
    }
  }, [token]);

  // Password requirement checks
  const passwordRequirements = [
    { met: password.length >= 8, text: 'Mindestens 8 Zeichen' },
    { met: /[A-Z]/.test(password), text: 'Ein Großbuchstabe (A-Z)' },
    { met: /[a-z]/.test(password), text: 'Ein Kleinbuchstabe (a-z)' },
    { met: /\d/.test(password), text: 'Eine Zahl (0-9)' },
    { met: /[^a-zA-Z0-9]/.test(password), text: 'Ein Sonderzeichen (!@#$%^&*)' },
  ];

  const validateForm = (): string | null => {
    if (!password || !confirmPassword) {
      return 'Bitte füllen Sie alle Felder aus.';
    }
    if (password !== confirmPassword) {
      return 'Die Passwörter stimmen nicht überein.';
    }

    // Check all password requirements
    const unmetRequirements = passwordRequirements.filter(req => !req.met);
    if (unmetRequirements.length > 0) {
      return `Passwort erfüllt nicht alle Anforderungen: ${unmetRequirements.map(r => r.text).join(', ')}`;
    }

    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!token) {
      setError('Ungültiger Reset-Token.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/password/reset', {
        token,
        new_password: password, // Backend uses snake_case
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts. Der Link könnte abgelaufen sein.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
          </div>

          {/* Success Message */}
          <div className="bg-white shadow rounded-lg p-6 space-y-4 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <span className="text-2xl">✓</span>
            </div>

            <h3 className="text-lg font-medium text-gray-900">
              Passwort erfolgreich zurückgesetzt!
            </h3>

            <p className="text-sm text-gray-600">
              Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </p>

            <p className="text-xs text-gray-500">
              Sie werden in 3 Sekunden zur Anmeldeseite weitergeleitet...
            </p>

            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Jetzt anmelden
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Neues Passwort festlegen
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
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Neues Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mindestens 8 Zeichen"
              />

              {/* Password Requirements Checklist */}
              {password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Passwort-Anforderungen:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                        {req.met ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-600'}`}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort wiederholen"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwörter stimmen nicht überein</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !token}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort zurücksetzen'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
