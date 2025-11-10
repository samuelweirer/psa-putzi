import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { api } from '../../../lib/api';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
  isBilling: boolean;
  isTechnical: boolean;
  notes: string;
}

interface Customer {
  id: string;
  companyName: string;
}

export function CreateContactPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch customer name for breadcrumb
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
      try {
        const response = await api.get(`/customers/${customerId}`);
        setCustomer(response.data.data || response.data);
      } catch (err) {
        console.error('Failed to fetch customer:', err);
      }
    };
    fetchCustomer();
  }, [customerId]);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    isPrimary: false,
    isBilling: false,
    isTechnical: false,
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.firstName.trim()) {
      return 'Vorname ist erforderlich.';
    }
    if (!formData.lastName.trim()) {
      return 'Nachname ist erforderlich.';
    }
    if (!formData.email.trim()) {
      return 'E-Mail ist erforderlich.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    if (!formData.phone.trim()) {
      return 'Telefonnummer ist erforderlich.';
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
      // Transform camelCase to snake_case for backend
      const backendData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone_office: formData.phone || null, // Map single phone to phone_office
        title: formData.jobTitle || null,
        is_primary: formData.isPrimary,
        is_billing: formData.isBilling,
        is_technical: formData.isTechnical,
        notes: formData.notes || null,
      };

      // Create contact via API
      await api.post(`/customers/${customerId}/contacts`, backendData);

      setSuccess(true);

      // Navigate back to contact list after 1.5 seconds
      setTimeout(() => {
        navigate(`/customers/${customerId}/contacts`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create contact:', err);
      setError(err.response?.data?.message || 'Fehler beim Erstellen des Kontakts. Bitte versuchen Sie es erneut.');
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Kontakt erstellt!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Der neue Kontakt wurde erfolgreich hinzugefügt.
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
                  {customer?.companyName || 'Kunde'}
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li>
                <Link
                  to={`/customers/${customerId}/contacts`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Kontakte
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li className="text-gray-700">Neuer Kontakt</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Neuen Kontakt hinzufügen</h1>
          {customer && <p className="mt-1 text-sm text-gray-500">für {customer.companyName}</p>}
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
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Persönliche Informationen</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Vorname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Max"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Nachname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mustermann"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                  Position / Abteilung
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. IT-Leiter, Geschäftsführer, Buchhaltung"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformationen</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-Mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="max.mustermann@beispiel.de"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+49 30 12345678"
                />
              </div>
            </div>
          </div>

          {/* Contact Roles */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktart</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isPrimary"
                    name="isPrimary"
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPrimary" className="font-medium text-gray-700">
                    ⭐ Hauptansprechpartner
                  </label>
                  <p className="text-gray-500">
                    Dieser Kontakt ist der primäre Ansprechpartner für diesen Kunden
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isBilling"
                    name="isBilling"
                    type="checkbox"
                    checked={formData.isBilling}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isBilling" className="font-medium text-gray-700">
                    💶 Rechnungsempfänger
                  </label>
                  <p className="text-gray-500">Erhält Rechnungen und Zahlungsaufforderungen</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isTechnical"
                    name="isTechnical"
                    type="checkbox"
                    checked={formData.isTechnical}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isTechnical" className="font-medium text-gray-700">
                    🔧 Technischer Kontakt
                  </label>
                  <p className="text-gray-500">
                    Erhält technische Benachrichtigungen und Support-Anfragen
                  </p>
                </div>
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
                placeholder="Interne Notizen zum Kontakt..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <Link
              to={`/customers/${customerId}/contacts`}
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
                  ➕ Kontakt hinzufügen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
