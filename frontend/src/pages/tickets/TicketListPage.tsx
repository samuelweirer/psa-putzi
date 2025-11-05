import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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

// Mock data - will be replaced with API calls in Sprint 5
const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'TKT-2025-001',
    title: 'E-Mail-Server nicht erreichbar',
    description: 'Kunden können keine E-Mails senden oder empfangen',
    status: 'open',
    priority: 'urgent',
    customerId: '1',
    customerName: 'ABC GmbH',
    assignedToId: '1',
    assignedToName: 'Max Mustermann',
    createdAt: '2025-11-05T08:30:00',
    updatedAt: '2025-11-05T08:30:00',
    dueDate: '2025-11-05T12:00:00',
    category: 'incident',
  },
  {
    id: '2',
    ticketNumber: 'TKT-2025-002',
    title: 'VPN-Zugang für neuen Mitarbeiter',
    description: 'Neuer Mitarbeiter benötigt VPN-Zugang zum Firmennetzwerk',
    status: 'in_progress',
    priority: 'medium',
    customerId: '2',
    customerName: 'XYZ AG',
    assignedToId: '2',
    assignedToName: 'Anna Schmidt',
    createdAt: '2025-11-04T14:20:00',
    updatedAt: '2025-11-05T09:15:00',
    dueDate: '2025-11-06T17:00:00',
    category: 'service_request',
  },
  {
    id: '3',
    ticketNumber: 'TKT-2025-003',
    title: 'Drucker im Büro offline',
    description: 'Netzwerkdrucker im 2. Stock reagiert nicht',
    status: 'resolved',
    priority: 'low',
    customerId: '1',
    customerName: 'ABC GmbH',
    assignedToId: '1',
    assignedToName: 'Max Mustermann',
    createdAt: '2025-11-03T10:00:00',
    updatedAt: '2025-11-04T11:30:00',
    category: 'incident',
  },
  {
    id: '4',
    ticketNumber: 'TKT-2025-004',
    title: 'Software-Update für Buchhaltung',
    description: 'DATEV-Software auf neueste Version aktualisieren',
    status: 'waiting',
    priority: 'medium',
    customerId: '3',
    customerName: 'Tech Solutions Ltd.',
    assignedToId: '3',
    assignedToName: 'John Doe',
    createdAt: '2025-11-02T13:45:00',
    updatedAt: '2025-11-05T08:00:00',
    dueDate: '2025-11-07T17:00:00',
    category: 'change',
  },
  {
    id: '5',
    ticketNumber: 'TKT-2025-005',
    title: 'Backup-Fehler seit gestern',
    description: 'Nächtliches Backup schlägt fehl - Fehlermeldung im Log',
    status: 'open',
    priority: 'high',
    customerId: '4',
    customerName: 'Digital Media GmbH',
    createdAt: '2025-11-05T07:00:00',
    updatedAt: '2025-11-05T07:00:00',
    dueDate: '2025-11-05T18:00:00',
    category: 'incident',
  },
  {
    id: '6',
    ticketNumber: 'TKT-2025-006',
    title: 'Passwort zurücksetzen für Benutzer',
    description: 'Benutzer hat Passwort vergessen und benötigt Reset',
    status: 'closed',
    priority: 'low',
    customerId: '5',
    customerName: 'Consulting Partners',
    assignedToId: '2',
    assignedToName: 'Anna Schmidt',
    createdAt: '2025-11-01T09:30:00',
    updatedAt: '2025-11-01T10:15:00',
    category: 'service_request',
  },
  {
    id: '7',
    ticketNumber: 'TKT-2025-007',
    title: 'Wiederholte Netzwerkunterbrechungen',
    description: 'Mehrere Clients verlieren sporadisch Netzwerkverbindung',
    status: 'in_progress',
    priority: 'high',
    customerId: '1',
    customerName: 'ABC GmbH',
    assignedToId: '1',
    assignedToName: 'Max Mustermann',
    createdAt: '2025-11-04T16:00:00',
    updatedAt: '2025-11-05T09:30:00',
    dueDate: '2025-11-05T20:00:00',
    category: 'problem',
  },
];

export function TicketListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Ticket['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Ticket['priority']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Ticket['category']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    return mockTickets.filter((ticket) => {
      const matchesSearch =
        searchTerm === '' ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
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
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Ticket-Verwaltung</h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredTickets.length} Ticket(s) gefunden
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to="/tickets/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">➕</span>
                Neues Ticket
              </Link>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Suche
              </label>
              <input
                type="text"
                id="search"
                placeholder="Ticket-Nr., Titel, Kunde..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as typeof statusFilter);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="waiting">Wartend</option>
                <option value="resolved">Gelöst</option>
                <option value="closed">Geschlossen</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priorität
              </label>
              <select
                id="priority"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as typeof priorityFilter);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as typeof categoryFilter);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="incident">Störung</option>
                <option value="service_request">Service-Anfrage</option>
                <option value="problem">Problem</option>
                <option value="change">Änderung</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticket Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorität
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zugewiesen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                      Keine Tickets gefunden. Passen Sie Ihre Suchkriterien an oder erstellen Sie ein neues Ticket.
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</div>
                        <div className="text-sm text-gray-600">{ticket.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/customers/${ticket.customerId}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {ticket.customerName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                            ticket.status
                          )}`}
                        >
                          {getStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(
                            ticket.priority
                          )}`}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.assignedToName || (
                          <span className="text-gray-400 italic">Nicht zugewiesen</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Anzeigen
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Weiter
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Zeige{' '}
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
                      </span>
                      {' '}von{' '}
                      <span className="font-medium">{filteredTickets.length}</span>
                      {' '}Ergebnissen
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          return (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          );
                        })
                        .map((page, idx, arr) => {
                          if (idx > 0 && page - arr[idx - 1] > 1) {
                            return (
                              <>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              </>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Die angezeigten Tickets sind Platzhalterdaten.
            In Sprint 5 wird diese Seite mit dem Ticket-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
