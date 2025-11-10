import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DeleteCustomerModal } from '../../components/modals/DeleteCustomerModal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { ErrorEmptyState } from '../../components/common/EmptyState';
import { api } from '../../lib/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
  type: string;
  created_at: string;
  customer_number?: string;
}

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lead' | 'prospect' | 'active' | 'inactive' | 'churned'>('all');
  const [contractFilter, setContractFilter] = useState<'all' | 'managed' | 'project' | 'support'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/customers');
        setCustomers(response.data.data || response.data);
      } catch (err: any) {
        console.error('Failed to fetch customers:', err);
        setError(err.response?.data?.message || 'Fehler beim Laden der Kundendaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchTerm));

      // Status filter
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

      // Contract filter
      const matchesContract = contractFilter === 'all' || customer.type === contractFilter;

      return matchesSearch && matchesStatus && matchesContract;
    });
  }, [customers, searchTerm, statusFilter, contractFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete({ id: customer.id, name: customer.name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (customerId: string) => {
    try {
      // Soft delete customer via API
      await api.delete(`/customers/${customerId}`);

      // Remove customer from local state
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));

      // Close modal
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete customer:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Kunden');
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
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

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kundenverwaltung (CRM)</h1>
            <p className="mt-1 text-sm text-gray-500">Lädt Kundendaten...</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <LoadingSkeleton variant="table" count={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kundenverwaltung (CRM)</h1>
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
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Kundenverwaltung (CRM)</h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredCustomers.length} Kunden gefunden
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to="/customers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">➕</span>
                Neuer Kunde
              </Link>
            </div>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Suche
              </label>
              <input
                type="text"
                id="search"
                placeholder="Name, E-Mail, Telefon..."
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
                <option value="lead">🔍 Lead</option>
                <option value="prospect">👀 Interessent</option>
                <option value="active">✅ Aktiv</option>
                <option value="inactive">💤 Inaktiv</option>
                <option value="churned">❌ Gekündigt</option>
              </select>
            </div>

            {/* Contract Type Filter */}
            <div>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">
                Vertragstyp
              </label>
              <select
                id="contract"
                value={contractFilter}
                onChange={(e) => {
                  setContractFilter(e.target.value as typeof contractFilter);
                  handleFilterChange();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle</option>
                <option value="managed">Managed Services</option>
                <option value="project">Projektvertrag</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Firma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kundentyp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      Keine Kunden gefunden. Passen Sie Ihre Suchkriterien an oder fügen Sie einen neuen Kunden hinzu.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.customer_number || 'Neue Kunde'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email || 'Keine E-Mail'}</div>
                        <div className="text-xs text-gray-500">{customer.phone || 'Keine Telefonnummer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={customer.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractTypeBadge(customer.type)}`}>
                          {getContractTypeLabel(customer.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Anzeigen
                        </Link>
                        <Link
                          to={`/customers/${customer.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Bearbeiten
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredCustomers.length > 0 && (
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
                        {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
                      </span>
                      {' '}von{' '}
                      <span className="font-medium">{filteredCustomers.length}</span>
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
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
      </div>

      {/* Delete Customer Modal */}
      {customerToDelete && (
        <DeleteCustomerModal
          isOpen={isDeleteModalOpen}
          customerName={customerToDelete.name}
          customerId={customerToDelete.id}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </DashboardLayout>
  );
}
