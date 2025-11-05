import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  available: boolean;
}

interface AssignmentWorkflowProps {
  currentAssignee?: { id: string; name: string };
  onAssign: (userId: string) => Promise<void>;
  ticketId: string;
}

// Mock available technicians
const mockTechnicians: User[] = [
  { id: '1', name: 'Max Mustermann', email: 'max@example.com', role: 'Senior Techniker', available: true },
  { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', role: 'Techniker', available: true },
  { id: '3', name: 'John Doe', email: 'john@example.com', role: 'Junior Techniker', available: false },
  { id: '4', name: 'Maria Müller', email: 'maria@example.com', role: 'Senior Techniker', available: true },
];

export function AssignmentWorkflow({ currentAssignee, onAssign, ticketId }: AssignmentWorkflowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');

  const handleAssign = async (userId: string) => {
    setError('');
    setIsAssigning(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In Sprint 5: PATCH /api/tickets/:id
      // body: { assignedToId: userId }

      await onAssign(userId);
      setIsOpen(false);
    } catch (err) {
      setError('Fehler beim Zuweisen des Tickets');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('Möchten Sie die Zuweisung wirklich entfernen?')) {
      return;
    }

    setError('');
    setIsAssigning(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // In Sprint 5: PATCH /api/tickets/:id
      // body: { assignedToId: null }

      await onAssign('');
      setIsOpen(false);
    } catch (err) {
      setError('Fehler beim Entfernen der Zuweisung');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="relative">
      {/* Current Assignment Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        👤 {currentAssignee ? currentAssignee.name : 'Nicht zugewiesen'}
        <span className="ml-2">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Ticket zuweisen</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            {error && (
              <div className="mb-3 rounded-md bg-red-50 p-2 border border-red-200">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            {/* Current Assignment */}
            {currentAssignee && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Aktuell zugewiesen an:</p>
                    <p className="text-sm text-blue-700">{currentAssignee.name}</p>
                  </div>
                  <button
                    onClick={handleUnassign}
                    disabled={isAssigning}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            )}

            {/* Available Technicians */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                Verfügbare Techniker
              </p>
              {mockTechnicians
                .filter((tech) => tech.available)
                .map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => handleAssign(tech.id)}
                    disabled={isAssigning || tech.id === currentAssignee?.id}
                    className={`w-full text-left p-3 rounded-md border ${
                      tech.id === currentAssignee?.id
                        ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                        : 'border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {tech.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                        <p className="text-xs text-gray-500">{tech.role}</p>
                      </div>
                      {tech.id === currentAssignee?.id && (
                        <span className="text-xs text-blue-600">✓ Zugewiesen</span>
                      )}
                    </div>
                  </button>
                ))}

              {/* Unavailable Technicians */}
              {mockTechnicians.some((tech) => !tech.available) && (
                <>
                  <p className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">
                    Nicht verfügbar
                  </p>
                  {mockTechnicians
                    .filter((tech) => !tech.available)
                    .map((tech) => (
                      <div
                        key={tech.id}
                        className="p-3 rounded-md border border-gray-200 bg-gray-50 opacity-60"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-medium">
                            {tech.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{tech.name}</p>
                            <p className="text-xs text-gray-500">{tech.role} • Nicht verfügbar</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* Auto-Assignment Option */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleAssign('auto')}
                disabled={isAssigning}
                className="w-full p-3 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🤖</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">Automatisch zuweisen</p>
                    <p className="text-xs text-gray-500">
                      System wählt verfügbaren Techniker basierend auf Auslastung
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
