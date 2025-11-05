import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  customerName: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  category: 'incident' | 'service_request' | 'problem' | 'change';
}

interface Comment {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

interface TimeEntry {
  id: string;
  user: string;
  description: string;
  hours: number;
  date: string;
  billable: boolean;
}

// Mock data
const mockTicket: Ticket = {
  id: '1',
  ticketNumber: 'TKT-2025-001',
  title: 'E-Mail-Server nicht erreichbar',
  description: `Seit heute Morgen 08:00 Uhr können unsere Mitarbeiter keine E-Mails mehr senden oder empfangen.

Der Exchange-Server scheint nicht mehr zu reagieren. Alle Outlook-Clients zeigen "Verbindung wird hergestellt..." an, aber es wird keine Verbindung aufgebaut.

Betroffen sind ca. 45 Mitarbeiter im Hauptbüro.

Bereits durchgeführte Schritte:
- Server-Neustart durchgeführt - keine Änderung
- Netzwerkverbindung geprüft - Server ist erreichbar
- Exchange-Dienste laufen laut Task-Manager

Bitte um schnellstmögliche Lösung, da dies geschäftskritisch ist.`,
  status: 'in_progress',
  priority: 'urgent',
  customerId: '1',
  customerName: 'ABC GmbH',
  assignedToId: '1',
  assignedToName: 'Max Mustermann',
  createdAt: '2025-11-05T08:30:00',
  updatedAt: '2025-11-05T10:15:00',
  dueDate: '2025-11-05T12:00:00',
  category: 'incident',
};

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Max Mustermann',
    authorRole: 'Techniker',
    content: 'Ticket angenommen. Schaue mir das Problem sofort an.',
    createdAt: '2025-11-05T08:35:00',
    isInternal: false,
  },
  {
    id: '2',
    author: 'Max Mustermann',
    authorRole: 'Techniker',
    content: 'Problem identifiziert: Exchange-Mailbox-Datenbank ist voll (100% Kapazität). Werde nun alte Mails archivieren.',
    createdAt: '2025-11-05T09:15:00',
    isInternal: true,
  },
  {
    id: '3',
    author: 'Anna Schmidt',
    authorRole: 'Kunde',
    content: 'Vielen Dank für die schnelle Rückmeldung! Wie lange wird die Behebung ungefähr dauern?',
    createdAt: '2025-11-05T09:30:00',
    isInternal: false,
  },
  {
    id: '4',
    author: 'Max Mustermann',
    authorRole: 'Techniker',
    content: 'Archivierung läuft. Sollte in ca. 30-45 Minuten abgeschlossen sein. Dann ist der Service wieder verfügbar.',
    createdAt: '2025-11-05T09:35:00',
    isInternal: false,
  },
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    user: 'Max Mustermann',
    description: 'Fehleranalyse und Diagnose',
    hours: 0.75,
    date: '2025-11-05T08:35:00',
    billable: true,
  },
  {
    id: '2',
    user: 'Max Mustermann',
    description: 'Mailbox-Archivierung durchgeführt',
    hours: 1.0,
    date: '2025-11-05T09:15:00',
    billable: true,
  },
];

type TabType = 'details' | 'comments' | 'time' | 'history';

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // In real app, fetch ticket data based on ticketId
  const ticket = mockTicket;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In Sprint 5: POST /api/tickets/:id/comments
    // body: { content: newComment, isInternal }

    setNewComment('');
    // Refresh comments
  };

  const getStatusBadge = (status: Ticket['status']) => {
    const badges = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return badges[status];
  };

  const getStatusLabel = (status: Ticket['status']) => {
    const labels = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      waiting: 'Wartend',
      resolved: 'Gelöst',
      closed: 'Geschlossen',
    };
    return labels[status];
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return badges[priority];
  };

  const getPriorityLabel = (priority: Ticket['priority']) => {
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      urgent: 'Dringend',
    };
    return labels[priority];
  };

  const getCategoryLabel = (category: Ticket['category']) => {
    const labels = {
      incident: 'Störung',
      service_request: 'Service-Anfrage',
      problem: 'Problem',
      change: 'Änderung',
    };
    return labels[category];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalHours = mockTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const billableHours = mockTimeEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <li className="text-gray-700">{ticket.ticketNumber}</li>
            </ol>
          </nav>

          <div className="md:flex md:items-start md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                    ticket.status
                  )}`}
                >
                  {getStatusLabel(ticket.status)}
                </span>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(
                    ticket.priority
                  )}`}
                >
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>
              <h2 className="text-lg text-gray-700 mb-2">{ticket.title}</h2>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>
                  Kunde:{' '}
                  <Link
                    to={`/customers/${ticket.customerId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {ticket.customerName}
                  </Link>
                </span>
                <span>•</span>
                <span>Zugewiesen: {ticket.assignedToName || 'Nicht zugewiesen'}</span>
                <span>•</span>
                <span>Erstellt: {formatDate(ticket.createdAt)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:ml-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                ✏️ Bearbeiten
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50">
                🗑️ Löschen
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                ✓ Lösen
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              📋 Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              💬 Kommentare ({mockComments.length})
            </button>
            <button
              onClick={() => setActiveTab('time')}
              className={`${
                activeTab === 'time'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              ⏱️ Zeiterfassung ({totalHours.toFixed(2)}h)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              📜 Verlauf
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Beschreibung</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</div>
            </div>

            {/* Ticket Info */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ticket-Informationen</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kategorie</dt>
                    <dd className="text-sm text-gray-900">{getCategoryLabel(ticket.category)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fällig am</dt>
                    <dd className="text-sm text-gray-900">
                      {ticket.dueDate ? formatDate(ticket.dueDate) : 'Nicht gesetzt'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Zuletzt aktualisiert</dt>
                    <dd className="text-sm text-gray-900">{formatDate(ticket.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Zuständigkeit</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Kunde</dt>
                    <dd className="text-sm">
                      <Link
                        to={`/customers/${ticket.customerId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {ticket.customerName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Zugewiesen an</dt>
                    <dd className="text-sm text-gray-900">
                      {ticket.assignedToName || (
                        <span className="text-gray-400 italic">Nicht zugewiesen</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Comment List */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kommunikation</h3>
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`border-l-4 pl-4 py-3 ${
                      comment.isInternal ? 'border-yellow-400 bg-yellow-50' : 'border-blue-400 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-500">({comment.authorRole})</span>
                        {comment.isInternal && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded">
                            Intern
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Neuer Kommentar</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Kommentar hinzufügen..."
              />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="internal"
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="internal" className="ml-2 text-sm text-gray-700">
                    Interner Kommentar (nur für Techniker sichtbar)
                  </label>
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💬 Kommentar hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="space-y-6">
            {/* Time Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Gesamt</div>
                <div className="text-3xl font-bold text-gray-900">{totalHours.toFixed(2)}h</div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Abrechenbar</div>
                <div className="text-3xl font-bold text-green-600">{billableHours.toFixed(2)}h</div>
              </div>
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Nicht abrechenbar</div>
                <div className="text-3xl font-bold text-gray-600">
                  {(totalHours - billableHours).toFixed(2)}h
                </div>
              </div>
            </div>

            {/* Time Entries */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Zeiteinträge</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  ➕ Zeit erfassen
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Benutzer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Beschreibung
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Datum
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Stunden
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Abrechenbar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockTimeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.user}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {entry.hours.toFixed(2)}h
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {entry.billable ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">−</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Änderungsverlauf</h3>
            <div className="text-sm text-gray-500 italic">
              Verlauf wird in Sprint 5 implementiert.
            </div>
          </div>
        )}

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Die angezeigten Daten sind Platzhalterdaten (Ticket ID: {ticketId}).
            In Sprint 5 wird diese Seite mit dem Ticket-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
