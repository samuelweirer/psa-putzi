import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  contractType: 'managed' | 'project' | 'support';
  address: string;
  city: string;
  postalCode: string;
  country: string;
  website: string;
  taxId: string;
  createdAt: string;
  lastActivity: string;
}

interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface Contract {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  monthlyValue: string;
  status: 'active' | 'expired';
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
}

// Mock data - will be replaced with API calls in Sprint 4
const mockCustomer: Customer = {
  id: '1',
  companyName: 'ABC GmbH',
  contactPerson: 'Max Mustermann',
  email: 'max@abc-gmbh.de',
  phone: '+49 30 12345678',
  status: 'active',
  contractType: 'managed',
  address: 'Hauptstraße 123',
  city: 'Berlin',
  postalCode: '10115',
  country: 'Deutschland',
  website: 'www.abc-gmbh.de',
  taxId: 'DE123456789',
  createdAt: '2024-01-15',
  lastActivity: '2025-11-04',
};

const mockTickets: Ticket[] = [
  { id: '1', title: 'E-Mail-Server nicht erreichbar', status: 'open', priority: 'high', createdAt: '2025-11-04' },
  { id: '2', title: 'VPN-Zugang für neuen Mitarbeiter', status: 'in_progress', priority: 'medium', createdAt: '2025-11-03' },
  { id: '3', title: 'Drucker offline', status: 'closed', priority: 'low', createdAt: '2025-11-01' },
];

const mockContracts: Contract[] = [
  {
    id: '1',
    name: 'Managed Services Vertrag',
    type: 'managed',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    monthlyValue: '€2,500',
    status: 'active',
  },
  {
    id: '2',
    name: 'Backup-Service',
    type: 'support',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    monthlyValue: '€500',
    status: 'active',
  },
];

const mockInvoices: Invoice[] = [
  { id: '1', number: 'RE-2025-001', date: '2025-11-01', amount: '€3,000', status: 'pending' },
  { id: '2', number: 'RE-2025-002', date: '2025-10-01', amount: '€3,000', status: 'paid' },
  { id: '3', number: 'RE-2025-003', date: '2025-09-01', amount: '€3,000', status: 'paid' },
];

type TabType = 'overview' | 'tickets' | 'contracts' | 'invoices';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // In real app, fetch customer data based on customerId
  const customer = mockCustomer;

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Aktiv' : 'Inaktiv';
  };

  const getContractTypeBadge = (type: string) => {
    const badges = {
      managed: 'bg-blue-100 text-blue-800',
      project: 'bg-purple-100 text-purple-800',
      support: 'bg-green-100 text-green-800',
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getContractTypeLabel = (type: string) => {
    const labels = {
      managed: 'Managed Services',
      project: 'Projektvertrag',
      support: 'Support',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTicketStatusBadge = (status: string) => {
    const badges = {
      open: 'bg-red-100 text-red-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getTicketStatusLabel = (status: string) => {
    const labels = {
      open: 'Offen',
      in_progress: 'In Bearbeitung',
      closed: 'Geschlossen',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800',
    };
    return badges[priority as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getInvoiceStatusLabel = (status: string) => {
    const labels = {
      paid: 'Bezahlt',
      pending: 'Ausstehend',
      overdue: 'Überfällig',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/customers" className="text-blue-600 hover:text-blue-800">
                  Kunden
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li className="text-gray-700">{customer.companyName}</li>
            </ol>
          </nav>
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{customer.companyName}</h1>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(customer.status)}`}>
                  {getStatusLabel(customer.status)}
                </span>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractTypeBadge(customer.contractType)}`}>
                  {getContractTypeLabel(customer.contractType)}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Kunde seit {customer.createdAt} • Letzte Aktivität: {customer.lastActivity}
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <Link
                to={`/customers/${customerId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ✏️ Bearbeiten
              </Link>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                ➕ Ticket erstellen
              </button>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Tickets ({mockTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`${
                activeTab === 'contracts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Verträge ({mockContracts.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rechnungen ({mockInvoices.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kontaktinformationen</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ansprechpartner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.contactPerson}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${customer.email}`} className="text-blue-600 hover:text-blue-800">
                      {customer.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:text-blue-800">
                      {customer.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`https://${customer.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {customer.website}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Address */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Straße</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stadt</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.postalCode} {customer.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Land</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.country}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Steuernummer</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.taxId}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Tickets</h3>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                ➕ Neues Ticket
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {mockTickets.map((ticket) => (
                <li key={ticket.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Erstellt: {ticket.createdAt}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadge(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTicketStatusBadge(ticket.status)}`}>
                        {getTicketStatusLabel(ticket.status)}
                      </span>
                      <Link to={`/tickets/${ticket.id}`} className="text-blue-600 hover:text-blue-900 text-sm">
                        Anzeigen →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Verträge</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {mockContracts.map((contract) => (
                <li key={contract.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{contract.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {contract.startDate} bis {contract.endDate}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{contract.monthlyValue}/Monat</p>
                        <p className="text-xs text-gray-500">{getContractTypeLabel(contract.type)}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Rechnungen</h3>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                ➕ Neue Rechnung
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rechnungsnr.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Betrag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusBadge(invoice.status)}`}>
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900">
                          Anzeigen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Die angezeigten Daten sind Platzhalterdaten (Customer ID: {customerId}).
            In Sprint 4 wird diese Seite mit dem CRM-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
