import { useState } from 'react';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  customerName: string;
  customerId: string;
  onClose: () => void;
  onConfirm: (customerId: string) => Promise<void>;
}

export function DeleteCustomerModal({
  isOpen,
  customerName,
  customerId,
  onClose,
  onConfirm,
}: DeleteCustomerModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(customerId);
      // Parent component handles success (redirect, etc.)
    } catch (error) {
      // Parent component handles error
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmText === customerName;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-200 rounded-t-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-900">
                Kunde löschen
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Diese Aktion kann nicht rückgängig gemacht werden!
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3">
              Sie sind dabei, den folgenden Kunden zu löschen:
            </p>
            <div className="bg-gray-100 rounded-md p-3 border border-gray-300">
              <p className="font-semibold text-gray-900">{customerName}</p>
              <p className="text-xs text-gray-600 mt-1">ID: {customerId}</p>
            </div>
          </div>

          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Folgende Daten werden gelöscht:
            </p>
            <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Alle Kontaktdaten des Kunden</li>
              <li>Zugehörige Standorte und Kontakte</li>
              <li>Verlinkungen zu Tickets und Projekten</li>
              <li>Vertragsinformationen</li>
            </ul>
            <p className="text-xs text-yellow-800 mt-2 font-medium">
              💡 Hinweis: Dies ist eine Soft-Delete-Operation. Daten können von Administratoren wiederhergestellt werden.
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Zur Bestätigung, geben Sie den Firmennamen ein:
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={customerName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-red-600 mt-1">
                Der eingegebene Name stimmt nicht überein.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Wird gelöscht...
              </>
            ) : (
              <>
                🗑️ Kunde löschen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
