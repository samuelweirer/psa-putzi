import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface FormData {
  title: string;
  description: string;
  customerId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'incident' | 'service_request' | 'problem' | 'change';
  assignedToId: string;
  dueDate: string;
}

// Mock data - will be replaced with API calls
const mockCustomers = [
  { id: '1', name: 'ABC GmbH' },
  { id: '2', name: 'XYZ AG' },
  { id: '3', name: 'Tech Solutions Ltd.' },
  { id: '4', name: 'Digital Media GmbH' },
  { id: '5', name: 'Consulting Partners' },
];

const mockTechnicians = [
  { id: '1', name: 'Max Mustermann' },
  { id: '2', name: 'Anna Schmidt' },
  { id: '3', name: 'John Doe' },
];

export function CreateTicketPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    customerId: '',
    priority: 'medium',
    category: 'incident',
    assignedToId: '',
    dueDate: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Titel ist erforderlich.';
    }
    if (formData.title.length < 10) {
      return 'Titel muss mindestens 10 Zeichen lang sein.';
    }
    if (!formData.description.trim()) {
      return 'Beschreibung ist erforderlich.';
    }
    if (formData.description.length < 20) {
      return 'Beschreibung muss mindestens 20 Zeichen lang sein.';
    }
    if (!formData.customerId) {
      return 'Kunde muss ausgewählt werden.';
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

      // In Sprint 5:
      // POST /api/tickets
      // body: formData
      // Response: { id, ticketNumber }

      const generatedTicketNumber = `TKT-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      setTicketNumber(generatedTicketNumber);
      setSuccess(true);

      // Navigate to ticket detail after 2 seconds
      setTimeout(() => {
        navigate(`/tickets/1`); // In real app: navigate to newly created ticket ID
      }, 2000);
    } catch (err) {
      setError('Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.');
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
              <h3 className="mt-4 text-lg font-medium text-gray-900">Ticket erstellt!</h3>
              <p className="mt-2 text-sm text-gray-500">
                Ticket <strong>{ticketNumber}</strong> wurde erfolgreich erstellt.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/tickets" className="text-blue-600 hover:text-blue-800">
                  Tickets
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li className="text-gray-700">Neues Ticket</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Neues Ticket erstellen</h1>
          <p className="mt-1 text-sm text-gray-500">
            Erfassen Sie ein neues Support-Ticket für einen Kunden
          </p>
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
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grundinformationen</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Kunde <span className="text-red-500">*</span>
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  required
                  value={formData.customerId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Kunde auswählen...</option>
                  {mockCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. E-Mail-Server nicht erreichbar"
                />
                <p className="mt-1 text-xs text-gray-500">Mindestens 10 Zeichen</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Beschreibung <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detaillierte Beschreibung des Problems..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mindestens 20 Zeichen - Je detaillierter, desto besser
                </p>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Klassifizierung</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Kategorie <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="incident">🔥 Störung</option>
                  <option value="service_request">📝 Service-Anfrage</option>
                  <option value="problem">🔍 Problem</option>
                  <option value="change">🔄 Änderung</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Störung = Sofortiger Handlungsbedarf
                </p>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priorität <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">🚨 Dringend</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Dringend = Geschäftskritisch, sofortige Reaktion
                </p>
              </div>
            </div>
          </div>

          {/* Assignment & Due Date */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Zuweisung & Frist</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">
                  Zuweisen an
                </label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  value={formData.assignedToId}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nicht zugewiesen (Auto-Assignment)</option>
                  {mockTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leer lassen für automatische Zuweisung
                </p>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Fällig am
                </label>
                <input
                  type="datetime-local"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional - Wird automatisch basierend auf SLA gesetzt
                </p>
              </div>
            </div>
          </div>

          {/* Priority Info Box */}
          {formData.priority === 'urgent' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Dringendes Ticket
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Dieses Ticket wird als <strong>dringend</strong> markiert und sofort an
                      verfügbare Techniker eskaliert. Nutzen Sie diese Priorität nur für
                      geschäftskritische Probleme, die sofortige Aufmerksamkeit erfordern.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <Link
              to="/tickets"
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
                  ➕ Ticket erstellen
                </>
              )}
            </button>
          </div>
        </form>

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Diese Seite simuliert die Ticket-Erstellung.
            In Sprint 5 wird sie mit dem Ticket-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
