import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { DeleteCustomerModal } from '../../../components/modals/DeleteCustomerModal';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorEmptyState } from '../../../components/common/EmptyState';
import { api } from '../../../lib/api';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  isPrimary: boolean;
  isBilling: boolean;
  isTechnical: boolean;
  notes: string;
}

interface Customer {
  id: string;
  companyName: string;
}

export function ContactListPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch customer and contacts from API
  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch customer details
        const customerResponse = await api.get(`/customers/${customerId}`);
        setCustomer(customerResponse.data.data || customerResponse.data);

        // Fetch contacts for this customer
        const contactsResponse = await api.get(`/customers/${customerId}/contacts`);
        setContacts(contactsResponse.data.data || contactsResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch contacts:', err);
        setError(err.response?.data?.message || 'Fehler beim Laden der Kontakte');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const filteredContacts = contacts.filter((contact) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.firstName.toLowerCase().includes(searchLower) ||
      contact.lastName.toLowerCase().includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      contact.jobTitle.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
    });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (contactId: string) => {
    try {
      // Delete contact via API
      await api.delete(`/customers/${customerId}/contacts/${contactId}`);

      // Remove from local state
      setContacts((prev) => prev.filter((c) => c.id !== contactId));

      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete contact:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Kontakts');
      setIsDeleteModalOpen(false);
      setContactToDelete(null);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Kontakte</h1>
            <p className="mt-1 text-sm text-gray-500">Lädt Kontaktdaten...</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <LoadingSkeleton variant="card" count={3} />
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
            <h1 className="text-2xl font-bold text-gray-900">Kontakte</h1>
          </div>
          <ErrorEmptyState onRetry={() => window.location.reload()} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/customers" className="text-blue-600 hover:text-blue-800">
                  Kunden
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li>
                <Link to={`/customers/${customerId}`} className="text-blue-600 hover:text-blue-800">
                  {customer.companyName}
                </Link>
              </li>
              <li className="text-gray-500">→</li>
              <li className="text-gray-700">Kontakte</li>
            </ol>
          </nav>

          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Kontakte - {customer.companyName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredContacts.length} Kontakt(e) gefunden
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to={`/customers/${customerId}/contacts/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">➕</span>
                Neuer Kontakt
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Suche
            </label>
            <input
              type="text"
              id="search"
              placeholder="Name, E-Mail, Telefon, Position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Contacts List */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <span className="text-6xl mb-4 block">👥</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Kontakte gefunden
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm
                ? 'Passen Sie Ihre Suchkriterien an oder fügen Sie einen neuen Kontakt hinzu.'
                : 'Beginnen Sie, indem Sie den ersten Kontakt für diesen Kunden hinzufügen.'}
            </p>
            {!searchTerm && (
              <Link
                to={`/customers/${customerId}/contacts/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Ersten Kontakt hinzufügen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Contact Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {contact.firstName[0]}
                          {contact.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{contact.jobTitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {contact.isPrimary && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        ⭐ Primär
                      </span>
                    )}
                    {contact.isBilling && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        💶 Rechnung
                      </span>
                    )}
                    {contact.isTechnical && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        🔧 Technisch
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📧</span>
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📞</span>
                      <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                        {contact.phone}
                      </a>
                    </div>
                  </div>

                  {/* Notes */}
                  {contact.notes && (
                    <div className="mb-4 text-sm text-gray-500 italic border-t pt-3">
                      "{contact.notes}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Link
                      to={`/customers/${customerId}/contacts/${contact.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      ✏️ Bearbeiten
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(contact)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                      disabled={contact.isPrimary}
                      title={contact.isPrimary ? 'Primärer Kontakt kann nicht gelöscht werden' : ''}
                    >
                      🗑️ Löschen
                    </button>
                  </div>

                  {contact.isPrimary && (
                    <p className="mt-2 text-xs text-gray-500 italic">
                      💡 Primärer Kontakt kann nicht gelöscht werden
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Contact Modal */}
      {contactToDelete && (
        <DeleteCustomerModal
          isOpen={isDeleteModalOpen}
          customerName={contactToDelete.name}
          customerId={contactToDelete.id}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setContactToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </DashboardLayout>
  );
}
