import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';

export function DashboardPage() {
  const { user } = useAuth();

  // Mock data - will be replaced with real API calls in Sprint 4-6
  const stats = {
    openTickets: 23,
    myTickets: 7,
    activeCustomers: 45,
    pendingInvoices: 8,
    monthlyRevenue: '€12,450',
    openProjects: 12,
  };

  const recentActivity = [
    { id: 1, type: 'ticket', title: 'Server down - Customer XYZ', time: '5 Min. ago', priority: 'high' },
    { id: 2, type: 'customer', title: 'New customer registered: ABC GmbH', time: '1 Std. ago', priority: 'normal' },
    { id: 3, type: 'invoice', title: 'Invoice #1234 paid', time: '2 Std. ago', priority: 'normal' },
    { id: 4, type: 'ticket', title: 'Password reset request', time: '3 Std. ago', priority: 'low' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Willkommen zurück, {user?.firstName}!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Hier ist Ihre Übersicht für heute
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* Open Tickets */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-100 text-red-600">
                      <span className="text-2xl">🎫</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Offene Tickets</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.openTickets}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                          <span className="sr-only">Increased by</span>
                          +3
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/tickets" className="font-medium text-blue-600 hover:text-blue-500">
                    Alle anzeigen →
                  </Link>
                </div>
              </div>
            </div>

            {/* My Tickets */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                      <span className="text-2xl">👤</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Meine Tickets</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.myTickets}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/tickets/my" className="font-medium text-blue-600 hover:text-blue-500">
                    Meine anzeigen →
                  </Link>
                </div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                      <span className="text-2xl">🏢</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Aktive Kunden</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.activeCustomers}</div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          +2
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/customers" className="font-medium text-blue-600 hover:text-blue-500">
                    Alle anzeigen →
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending Invoices */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-100 text-yellow-600">
                      <span className="text-2xl">💶</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Offene Rechnungen</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.pendingInvoices}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/invoices" className="font-medium text-blue-600 hover:text-blue-500">
                    Details →
                  </Link>
                </div>
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-600">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Umsatz (Monat)</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.monthlyRevenue}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/reports" className="font-medium text-blue-600 hover:text-blue-500">
                    Berichte →
                  </Link>
                </div>
              </div>
            </div>

            {/* Open Projects */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Laufende Projekte</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.openProjects}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/projects" className="font-medium text-blue-600 hover:text-blue-500">
                    Alle anzeigen →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout: Quick Actions + Recent Activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schnellaktionen</h3>
              <div className="space-y-3">
                <Link to="/tickets/new" className="w-full flex items-center px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-md text-left transition">
                  <span className="mr-3 text-2xl">➕</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Neues Ticket erstellen</div>
                    <div className="text-xs text-gray-500">Support-Anfrage erfassen</div>
                  </div>
                </Link>
                <Link to="/customers/new" className="w-full flex items-center px-4 py-3 bg-green-50 hover:bg-green-100 rounded-md text-left transition">
                  <span className="mr-3 text-2xl">🏢</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Kunden hinzufügen</div>
                    <div className="text-xs text-gray-500">Neuen Kunden anlegen</div>
                  </div>
                </Link>
                <button className="w-full flex items-center px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-md text-left transition" disabled title="Zeiterfassung kommt in Sprint 5">
                  <span className="mr-3 text-2xl opacity-50">⏱️</span>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Zeiterfassung starten</div>
                    <div className="text-xs text-gray-400">Kommt in Sprint 5</div>
                  </div>
                </button>
                <button className="w-full flex items-center px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-md text-left transition" disabled title="Rechnungserstellung kommt in Sprint 7">
                  <span className="mr-3 text-2xl opacity-50">💶</span>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Rechnung erstellen</div>
                    <div className="text-xs text-gray-400">Kommt in Sprint 7</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Letzte Aktivitäten</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, idx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== recentActivity.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.priority === 'high' ? 'bg-red-100' :
                              activity.priority === 'normal' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <span className="text-sm">
                                {activity.type === 'ticket' && '🎫'}
                                {activity.type === 'customer' && '🏢'}
                                {activity.type === 'invoice' && '💶'}
                              </span>
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900">{activity.title}</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500">
                              <span>{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link to="/activity" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Alle Aktivitäten anzeigen →
                </Link>
              </div>
            </div>
          </div>

          {/* Development Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Entwicklungsmodus:</strong> Die angezeigten Statistiken sind Platzhalterdaten.
              In Sprint 4-6 werden diese mit echten API-Aufrufen zu Tickets, Kunden und Projekten ersetzt.
            </p>
          </div>
        </div>
      </DashboardLayout>
  );
}
