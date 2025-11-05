import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface MFASetupData {
  secret: string;
  qrCode: string;
  recoveryCodes: string[];
}

export function MFASetupPage() {
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [savedCodes, setSavedCodes] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  // If user already has MFA enabled, redirect to dashboard
  useEffect(() => {
    if (user?.mfaEnabled) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch MFA setup data on mount
  useEffect(() => {
    const fetchSetupData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.post('/auth/mfa/setup');
        setSetupData({
          secret: data.secret,
          qrCode: data.qr_code || data.qrCode, // Handle both snake_case and camelCase
          recoveryCodes: data.recovery_codes || data.recoveryCodes,
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Fehler beim Laden der MFA-Einrichtung.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetupData();
  }, []);

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Bitte geben Sie einen 6-stelligen Code ein.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/auth/mfa/verify', {
        code: verificationCode,
      });
      setStep('complete');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ungültiger Code. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const downloadRecoveryCodes = () => {
    if (!setupData) return;

    const codesText = setupData.recoveryCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'putzi-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSavedCodes(true);
  };

  const copyRecoveryCodes = () => {
    if (!setupData) return;

    navigator.clipboard.writeText(setupData.recoveryCodes.join('\n'));
    setSavedCodes(true);
  };

  if (isLoading && !setupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          <p className="mt-2 text-center text-sm text-gray-600">
            Zwei-Faktor-Authentifizierung einrichten
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

        {/* Step 1: Show QR Code and Secret */}
        {step === 'setup' && setupData && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Schritt 1: QR-Code scannen</h3>

              <div className="flex justify-center">
                <img
                  src={setupData.qrCode}
                  alt="MFA QR Code"
                  className="border-2 border-gray-300 rounded"
                />
              </div>

              <p className="text-sm text-gray-600">
                Scannen Sie diesen QR-Code mit Ihrer Authenticator-App
                (z.B. Google Authenticator, Authy, Microsoft Authenticator)
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oder geben Sie diesen Code manuell ein:
                </label>
                <code className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-center font-mono text-sm">
                  {setupData.secret}
                </code>
              </div>
            </div>

            {/* Recovery Codes */}
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Schritt 2: Wiederherstellungscodes speichern</h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Wichtig: Speichern Sie diese Codes an einem sicheren Ort!
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Sie benötigen diese Codes, falls Sie keinen Zugriff auf Ihre Authenticator-App haben.
                </p>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded p-4">
                <div className="grid grid-cols-1 gap-2 font-mono text-sm">
                  {setupData.recoveryCodes.map((code, index) => (
                    <div key={index} className="text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={downloadRecoveryCodes}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Herunterladen
                </button>
                <button
                  onClick={copyRecoveryCodes}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Kopieren
                </button>
              </div>

              <div className="flex items-center">
                <input
                  id="saved-codes"
                  type="checkbox"
                  checked={savedCodes}
                  onChange={(e) => setSavedCodes(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="saved-codes" className="ml-2 block text-sm text-gray-900">
                  Ich habe die Wiederherstellungscodes gespeichert
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              disabled={!savedCodes}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter zur Verifizierung
            </button>
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Schritt 3: Code verifizieren</h3>

              <p className="text-sm text-gray-600">
                Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein:
              </p>

              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError('');
                  }}
                  maxLength={6}
                  placeholder="000000"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('setup')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Zurück
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verifizieren...' : 'Verifizieren'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6 space-y-4 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <span className="text-2xl">✓</span>
              </div>

              <h3 className="text-lg font-medium text-gray-900">
                MFA erfolgreich aktiviert!
              </h3>

              <p className="text-sm text-gray-600">
                Ihr Konto ist jetzt durch Zwei-Faktor-Authentifizierung geschützt.
              </p>

              <button
                onClick={handleComplete}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Zum Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
