import { useState } from 'react';
import { StatusBadge } from './StatusBadge';

interface StatusWorkflowProps {
  currentStatus: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
  onStatusChange: (newStatus: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned') => Promise<void>;
  disabled?: boolean;
}

export function StatusWorkflow({ currentStatus, onStatusChange, disabled = false }: StatusWorkflowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const statusFlow = {
    lead: {
      next: ['prospect', 'active', 'churned'],
      description: 'Lead → Interessent → Aktiv',
    },
    prospect: {
      next: ['active', 'churned'],
      description: 'Interessent → Aktiv oder Gekündigt',
    },
    active: {
      next: ['inactive', 'churned'],
      description: 'Aktiv → Inaktiv oder Gekündigt',
    },
    inactive: {
      next: ['active', 'churned'],
      description: 'Inaktiv → Aktiv oder Gekündigt',
    },
    churned: {
      next: ['lead', 'prospect'],
      description: 'Gekündigt → Neu starten',
    },
  };

  const allStatuses = [
    { value: 'lead', label: 'Lead', icon: '🔍' },
    { value: 'prospect', label: 'Interessent', icon: '👀' },
    { value: 'active', label: 'Aktiv', icon: '✅' },
    { value: 'inactive', label: 'Inaktiv', icon: '💤' },
    { value: 'churned', label: 'Gekündigt', icon: '❌' },
  ] as const;

  const handleStatusChange = async (newStatus: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned') => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change status:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const nextStatuses = statusFlow[currentStatus].next;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isChanging}
        className="inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <StatusBadge status={currentStatus} />
        {!disabled && (
          <span className="text-gray-400 hover:text-gray-600">
            {isChanging ? '⏳' : '▼'}
          </span>
        )}
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Status ändern
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {statusFlow[currentStatus].description}
              </p>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Aktueller Status
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-between p-2 text-left bg-gray-50 rounded border border-gray-200"
                >
                  <StatusBadge status={currentStatus} size="sm" />
                  <span className="text-xs text-gray-500">Aktuell</span>
                </button>

                <div className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">
                  Mögliche Status
                </div>
                {allStatuses
                  .filter((s) => nextStatuses.includes(s.value as any))
                  .map((statusOption) => (
                    <button
                      key={statusOption.value}
                      type="button"
                      onClick={() => handleStatusChange(statusOption.value as any)}
                      disabled={isChanging}
                      className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <StatusBadge status={statusOption.value as any} size="sm" />
                      <span className="text-xs text-blue-600">Ändern →</span>
                    </button>
                  ))}

                {nextStatuses.length === 0 && (
                  <p className="text-xs text-gray-400 italic p-2">
                    Keine weiteren Status verfügbar
                  </p>
                )}

                <div className="text-xs font-medium text-gray-500 uppercase mt-4 mb-2">
                  Alle Status
                </div>
                {allStatuses
                  .filter((s) => !nextStatuses.includes(s.value as any) && s.value !== currentStatus)
                  .map((statusOption) => (
                    <button
                      key={statusOption.value}
                      type="button"
                      onClick={() => handleStatusChange(statusOption.value as any)}
                      disabled={isChanging}
                      className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed opacity-60"
                    >
                      <StatusBadge status={statusOption.value as any} size="sm" />
                      <span className="text-xs text-gray-400">Ändern →</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
