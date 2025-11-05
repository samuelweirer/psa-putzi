import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/password/reset-request', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
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
              E-Mail versendet!
            </h3>

            <p className="text-sm text-gray-600">
              Wir haben Ihnen einen Link zum Zurücksetzen des Passworts an <strong>{email}</strong> gesendet.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-xs text-blue-800">
                <strong>Entwicklungsmodus:</strong> In der Entwicklungsumgebung wird der Reset-Link in den Server-Logs angezeigt.
                In Produktion erhalten Sie eine E-Mail.
              </p>
            </div>

            <p className="text-xs text-gray-500">
              Haben Sie keine E-Mail erhalten? Überprüfen Sie Ihren Spam-Ordner oder fordern Sie einen neuen Link an.
            </p>

            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Zurück zur Anmeldung
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
            Passwort vergessen?
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
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
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="ihre.email@beispiel.de"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wird gesendet...' : 'Passwort zurücksetzen'}
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
