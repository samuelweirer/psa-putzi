import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DeleteCustomerModal } from '../../components/modals/DeleteCustomerModal';
import { StatusWorkflow } from '../../components/common/StatusWorkflow';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorEmptyState } from '../../components/common/EmptyState';
import { api } from '../../lib/api';

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
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

type TabType = 'overview' | 'tickets' | 'contracts' | 'invoices';

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch customer data from API
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch customer details
        const customerResponse = await api.get(`/customers/${customerId}`);
        setCustomer(customerResponse.data.data || customerResponse.data);

        // Note: Tickets, contracts, and invoices will be integrated in their respective modules
        // For now, they remain empty arrays
        setTickets([]);
        setContracts([]);
        setInvoices([]);
      } catch (err: any) {
        console.error('Failed to fetch customer:', err);
        setError(err.response?.data?.message || 'Fehler beim Laden der Kundendaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const handleDeleteCustomer = async (id: string) => {
    try {
      // Soft delete customer via API
      await api.delete(`/customers/${id}`);

      // Close modal
      setIsDeleteModalOpen(false);

      // Navigate back to customer list with success message
      navigate('/customers', {
        state: { message: `Kunde "${customer?.companyName}" wurde gelöscht.` },
      });
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Kunden');
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned') => {
    if (!customer) return;

    try {
      // Update customer status via API
      await api.patch(`/customers/${customerId}`, { status: newStatus });

      // Update local state
      setCustomer((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      console.error('Failed to update customer status:', err);
      setError(err.response?.data?.message || 'Fehler beim Aktualisieren des Status');
    }
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

  const getContractStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getContractStatusLabel = (status: string) => {
    const labels = {
      active: 'Aktiv',
      expired: 'Abgelaufen',
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kundendetails</h1>
            <p className="mt-1 text-sm text-gray-500">Lädt Kundendaten...</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <LoadingSkeleton variant="card" count={2} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kundendetails</h1>
          </div>
          <ErrorEmptyState onRetry={() => window.location.reload()} />
        </div>
      </DashboardLayout>
    );
  }

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
                <StatusWorkflow
                  currentStatus={customer.status}
                  onStatusChange={handleStatusChange}
                />
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractTypeBadge(customer.contractType)}`}>
                  {getContractTypeLabel(customer.contractType)}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Kunde seit {customer.createdAt} • Letzte Aktivität: {customer.lastActivity}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 md:mt-0 md:ml-4">
              <Link
                to={`/customers/${customerId}/contacts`}
                className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                👥 Kontakte
              </Link>
              <Link
                to={`/customers/${customerId}/locations`}
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                📍 Standorte
              </Link>
              <Link
                to={`/customers/${customerId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ✏️ Bearbeiten
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                🗑️ Löschen
              </button>
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
              Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`${
                activeTab === 'contracts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Verträge ({contracts.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rechnungen ({invoices.length})
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
              {tickets.length === 0 ? (
                <li className="px-4 py-12 text-center text-sm text-gray-500">
                  Keine Tickets vorhanden. Tickets werden im Tickets-Modul verwaltet.
                </li>
              ) : (
                tickets.map((ticket) => (
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
                ))
              )}
            </ul>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Verträge</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {contracts.length === 0 ? (
                <li className="px-4 py-12 text-center text-sm text-gray-500">
                  Keine Verträge vorhanden. Verträge werden im Billing-Modul verwaltet.
                </li>
              ) : (
                contracts.map((contract) => (
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractStatusBadge(contract.status)}`}>
                          {getContractStatusLabel(contract.status)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
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
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                        Keine Rechnungen vorhanden. Rechnungen werden im Billing-Modul verwaltet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Customer Modal */}
      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        customerName={customer.companyName}
        customerId={customerId || ''}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCustomer}
      />
    </DashboardLayout>
  );
}
