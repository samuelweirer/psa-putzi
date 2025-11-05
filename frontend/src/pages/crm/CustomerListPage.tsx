import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  contractType: 'managed' | 'project' | 'support';
  createdAt: string;
}

// Mock data - will be replaced with API calls in Sprint 4
const mockCustomers: Customer[] = [
  {
    id: '1',
    companyName: 'ABC GmbH',
    contactPerson: 'Max Mustermann',
    email: 'max@abc-gmbh.de',
    phone: '+49 30 12345678',
    status: 'active',
    contractType: 'managed',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    companyName: 'XYZ AG',
    contactPerson: 'Anna Schmidt',
    email: 'anna.schmidt@xyz.de',
    phone: '+49 89 87654321',
    status: 'active',
    contractType: 'project',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    companyName: 'Tech Solutions Ltd.',
    contactPerson: 'John Doe',
    email: 'john@techsolutions.com',
    phone: '+49 40 11223344',
    status: 'active',
    contractType: 'support',
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    companyName: 'Digital Media GmbH',
    contactPerson: 'Sarah Weber',
    email: 'sarah@digitalmedia.de',
    phone: '+43 1 5556677',
    status: 'inactive',
    contractType: 'managed',
    createdAt: '2023-11-05',
  },
  {
    id: '5',
    companyName: 'Consulting Partners',
    contactPerson: 'Michael Bauer',
    email: 'm.bauer@consulting.de',
    phone: '+49 69 99887766',
    status: 'active',
    contractType: 'project',
    createdAt: '2024-04-01',
  },
  {
    id: '6',
    companyName: 'IT Services Austria',
    contactPerson: 'Maria Huber',
    email: 'maria@itservices.at',
    phone: '+43 662 333444',
    status: 'active',
    contractType: 'managed',
    createdAt: '2024-01-22',
  },
  {
    id: '7',
    companyName: 'Software Factory',
    contactPerson: 'Thomas Klein',
    email: 'thomas@softwarefactory.de',
    phone: '+49 30 22334455',
    status: 'inactive',
    contractType: 'support',
    createdAt: '2023-09-14',
  },
  {
    id: '8',
    companyName: 'Cloud Systems GmbH',
    contactPerson: 'Lisa Schneider',
    email: 'lisa@cloudsystems.de',
    phone: '+49 89 66778899',
    status: 'active',
    contractType: 'managed',
    createdAt: '2024-05-12',
  },
];

export function CustomerListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [contractFilter, setContractFilter] = useState<'all' | 'managed' | 'project' | 'support'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter and search customers
  const filteredCustomers = useMemo(() => {
    return mockCustomers.filter((customer) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm);

      // Status filter
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;

      // Contract filter
      const matchesContract = contractFilter === 'all' || customer.contractType === contractFilter;

      return matchesSearch && matchesStatus && matchesContract;
    });
  }, [searchTerm, statusFilter, contractFilter]);

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

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Aktiv' : 'Inaktiv';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <option value="active">Aktiv</option>
                <option value="inactive">Inaktiv</option>
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
                    Ansprechpartner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vertragstyp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      Keine Kunden gefunden. Passen Sie Ihre Suchkriterien an oder fügen Sie einen neuen Kunden hinzu.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.companyName}</div>
                        <div className="text-xs text-gray-500">seit {customer.createdAt}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.contactPerson}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-xs text-gray-500">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(customer.status)}`}>
                          {getStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getContractTypeBadge(customer.contractType)}`}>
                          {getContractTypeLabel(customer.contractType)}
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

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Die angezeigten Kundendaten sind Platzhalterdaten.
            In Sprint 4 wird diese Seite mit dem CRM-Backend-Modul verbunden.
          </p>
        </div>
      </div>
    </div>
  );
}
