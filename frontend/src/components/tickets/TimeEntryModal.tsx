import { useState, FormEvent } from 'react';

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: TimeEntryFormData) => void;
  ticketId: string;
}

export interface TimeEntryFormData {
  description: string;
  hours: number;
  date: string;
  billable: boolean;
}

export function TimeEntryModal({ isOpen, onClose, onSubmit, ticketId }: TimeEntryModalProps) {
  const [formData, setFormData] = useState<TimeEntryFormData>({
    description: '',
    hours: 0,
    date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
    billable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.description.trim()) {
      setError('Beschreibung ist erforderlich');
      return;
    }
    if (formData.hours <= 0) {
      setError('Stunden müssen größer als 0 sein');
      return;
    }
    if (formData.hours > 24) {
      setError('Stunden können nicht größer als 24 sein');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In Sprint 5: POST /api/tickets/:id/time-entries
      // body: formData

      onSubmit(formData);

      // Reset form
      setFormData({
        description: '',
        hours: 0,
        date: new Date().toISOString().slice(0, 16),
        billable: true,
      });

      onClose();
    } catch (err) {
      setError('Fehler beim Speichern der Zeiterfassung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Zeit erfassen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Fehleranalyse durchgeführt"
            />
            <p className="mt-1 text-xs text-gray-500">
              Beschreiben Sie die durchgeführte Arbeit
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                Stunden <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="hours"
                name="hours"
                required
                step="0.25"
                min="0"
                max="24"
                value={formData.hours || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-gray-500">
                In 0.25h-Schritten (z.B. 1.5h = 1h 30min)
              </p>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Datum & Zeit <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="billable"
              name="billable"
              type="checkbox"
              checked={formData.billable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="billable" className="ml-2 block text-sm text-gray-700">
              Abrechenbar (wird dem Kunden in Rechnung gestellt)
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Hinweis:</strong> Die Zeiterfassung wird mit Ihrer Benutzer-ID gespeichert
              und erscheint im Ticket-Verlauf.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Speichert...
                </>
              ) : (
                <>
                  ⏱️ Zeit erfassen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
