import { useState, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';

interface FormData {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  locationType: 'headquarters' | 'branch' | 'warehouse' | 'datacenter' | 'other';
  notes: string;
}

const mockCustomer = {
  id: '1',
  companyName: 'ABC GmbH',
};

export function CreateLocationPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const customer = mockCustomer;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    locationType: 'branch',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Standortname ist erforderlich.';
    }
    if (!formData.addressLine1.trim()) {
      return 'Straße/Hausnummer ist erforderlich.';
    }
    if (!formData.city.trim()) {
      return 'Stadt ist erforderlich.';
    }
    if (!formData.postalCode.trim()) {
      return 'Postleitzahl ist erforderlich.';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In Sprint 4:
      // POST /api/customers/:customerId/locations
      // body: formData

      setSuccess(true);

      // Navigate back to location list after 1.5 seconds
      setTimeout(() => {
        navigate(`/customers/${customerId}/locations`);
      }, 1500);
    } catch (err) {
      setError('Fehler beim Erstellen des Standorts. Bitte versuchen Sie es erneut.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Standort erstellt!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Der neue Standort wurde erfolgreich hinzugefügt.
              </p>
              <p className="mt-2 text-sm text-gray-400">Sie werden weitergeleitet...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/customers" className="text-blue-600 hover:text-blue-800">
                  Kunden
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li>
                <Link to={`/customers/${customerId}`} className="text-blue-600 hover:text-blue-800">
                  {customer.companyName}
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li>
                <Link
                  to={`/customers/${customerId}/locations`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Standorte
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li className="text-gray-700">Neuer Standort</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Neuen Standort hinzufügen</h1>
          <p className="mt-1 text-sm text-gray-500">für {customer.companyName}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Standortinformationen</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Standortname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. Hauptsitz Berlin, Lager Hamburg"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">
                  Standorttyp <span className="text-red-500">*</span>
                </label>
                <select
                  id="locationType"
                  name="locationType"
                  required
                  value={formData.locationType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="headquarters">🏢 Hauptsitz</option>
                  <option value="branch">🏬 Zweigstelle</option>
                  <option value="warehouse">📦 Lager</option>
                  <option value="datacenter">💾 Rechenzentrum</option>
                  <option value="other">📍 Sonstiges</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                  Straße und Hausnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="addressLine1"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Musterstraße 123"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                  Adresszusatz
                </label>
                <input
                  type="text"
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Gebäude A, 3. Stock"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  PLZ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Stadt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Berlin"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Land <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Deutschland">Deutschland</option>
                  <option value="Österreich">Österreich</option>
                  <option value="Schweiz">Schweiz</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notizen</h3>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Interne Notizen
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Interne Notizen zum Standort..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <Link
              to={`/customers/${customerId}/locations`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Wird erstellt...
                </>
              ) : (
                <>
                  ➕ Standort hinzufügen
                </>
              )}
            </button>
          </div>
        </form>

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Diese Seite simuliert die Standorterstellung
            (Customer ID: {customerId}). In Sprint 4 wird sie mit dem CRM-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
