import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  children?: ReactNode;
}

/**
 * Empty State Component
 *
 * Displays a friendly empty state when there's no data to show.
 * Includes optional primary and secondary actions.
 *
 * Usage:
 * <EmptyState
 *   icon="📝"
 *   title="Keine Tickets vorhanden"
 *   description="Erstellen Sie Ihr erstes Ticket, um loszulegen."
 *   action={{
 *     label: "Ticket erstellen",
 *     to: "/tickets/new"
 *   }}
 * />
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>

      {children && <div className="mb-6">{children}</div>}

      {(action || secondaryAction) && (
        <div className="flex items-center justify-center space-x-3">
          {action && (
            action.to ? (
              <Link
                to={action.to}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.to ? (
              <Link
                to={secondaryAction.to}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Predefined Empty States for common scenarios
 */

export function NoResultsEmptyState({ searchTerm }: { searchTerm?: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="Keine Ergebnisse gefunden"
      description={
        searchTerm
          ? `Keine Ergebnisse für "${searchTerm}". Versuchen Sie eine andere Suche.`
          : 'Keine Ergebnisse gefunden. Versuchen Sie eine andere Suche.'
      }
    />
  );
}

export function NoDataEmptyState({ entityName }: { entityName: string }) {
  return (
    <EmptyState
      icon="📭"
      title={`Keine ${entityName} vorhanden`}
      description={`Es wurden noch keine ${entityName} erstellt.`}
    />
  );
}

export function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Fehler beim Laden"
      description="Die Daten konnten nicht geladen werden. Bitte versuchen Sie es erneut."
      action={
        onRetry
          ? {
              label: 'Erneut versuchen',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

export function UnauthorizedEmptyState() {
  return (
    <EmptyState
      icon="🔒"
      title="Keine Berechtigung"
      description="Sie haben keine Berechtigung, auf diese Ressource zuzugreifen."
      action={{
        label: 'Zur Startseite',
        to: '/',
      }}
    />
  );
}

export function MaintenanceEmptyState() {
  return (
    <EmptyState
      icon="🔧"
      title="Wartungsarbeiten"
      description="Diese Funktion ist vorübergehend nicht verfügbar. Wir arbeiten daran, sie so schnell wie möglich wieder online zu bringen."
    />
  );
}
