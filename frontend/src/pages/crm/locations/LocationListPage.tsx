import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { DeleteCustomerModal } from '../../../components/modals/DeleteCustomerModal';
import { LoadingSkeleton } from '../../../components/common/LoadingSkeleton';
import { ErrorEmptyState } from '../../../components/common/EmptyState';
import { api } from '../../../lib/api';

interface Location {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  locationType: 'headquarters' | 'branch' | 'warehouse' | 'datacenter' | 'other';
  notes: string;
}

interface Customer {
  id: string;
  companyName: string;
}

export function LocationListPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch customer and locations from API
  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch customer details
        const customerResponse = await api.get(`/customers/${customerId}`);
        setCustomer(customerResponse.data.data || customerResponse.data);

        // Fetch locations for this customer
        const locationsResponse = await api.get(`/customers/${customerId}/locations`);
        setLocations(locationsResponse.data.data || locationsResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch locations:', err);
        setError(err.response?.data?.message || 'Fehler beim Laden der Standorte');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  const filteredLocations = locations.filter((location) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      location.addressLine1.toLowerCase().includes(searchLower) ||
      location.city.toLowerCase().includes(searchLower) ||
      location.postalCode.includes(searchTerm)
    );
  });

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete({
      id: location.id,
      name: location.name,
    });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (locationId: string) => {
    try {
      // Delete location via API
      await api.delete(`/customers/${customerId}/locations/${locationId}`);

      // Remove from local state
      setLocations((prev) => prev.filter((l) => l.id !== locationId));

      setIsDeleteModalOpen(false);
      setLocationToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete location:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Standorts');
      setIsDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  const getLocationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      headquarters: 'Hauptsitz',
      branch: 'Zweigstelle',
      warehouse: 'Lager',
      datacenter: 'Rechenzentrum',
      other: 'Sonstiges',
    };
    return labels[type] || type;
  };

  const getLocationTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      headquarters: '🏢',
      branch: '🏬',
      warehouse: '📦',
      datacenter: '💾',
      other: '📍',
    };
    return icons[type] || '📍';
  };

  const getLocationTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      headquarters: 'bg-blue-100 text-blue-800',
      branch: 'bg-green-100 text-green-800',
      warehouse: 'bg-yellow-100 text-yellow-800',
      datacenter: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Standorte</h1>
            <p className="mt-1 text-sm text-gray-500">Lädt Standortdaten...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Standorte</h1>
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
              <li className="text-gray-700">Standorte</li>
            </ol>
          </nav>

          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">
                Standorte - {customer.companyName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {filteredLocations.length} Standort(e) gefunden
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                to={`/customers/${customerId}/locations/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-2">➕</span>
                Neuer Standort
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
              placeholder="Name, Adresse, Stadt, PLZ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Locations List */}
        {filteredLocations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <span className="text-6xl mb-4 block">📍</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Standorte gefunden</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm
                ? 'Passen Sie Ihre Suchkriterien an oder fügen Sie einen neuen Standort hinzu.'
                : 'Beginnen Sie, indem Sie den ersten Standort für diesen Kunden hinzufügen.'}
            </p>
            {!searchTerm && (
              <Link
                to={`/customers/${customerId}/locations/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <span className="mr-2">➕</span>
                Ersten Standort hinzufügen
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Location Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">
                        {getLocationTypeIcon(location.locationType)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLocationTypeBadge(
                            location.locationType
                          )}`}
                        >
                          {getLocationTypeLabel(location.locationType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1 mb-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="mr-2">📍</span>
                      <div>
                        <div>{location.addressLine1}</div>
                        {location.addressLine2 && <div>{location.addressLine2}</div>}
                        <div>
                          {location.postalCode} {location.city}
                        </div>
                        <div>{location.country}</div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {location.notes && (
                    <div className="mb-4 text-sm text-gray-500 italic border-t pt-3">
                      "{location.notes}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Link
                      to={`/customers/${customerId}/locations/${location.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      ✏️ Bearbeiten
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(location)}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Development Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Entwicklungsmodus:</strong> Die angezeigten Standorte sind Platzhalterdaten
            (Customer ID: {customerId}). In Sprint 4 wird diese Seite mit dem CRM-Backend-Modul
            verbunden.
          </p>
        </div>
      </div>

      {/* Delete Location Modal */}
      {locationToDelete && (
        <DeleteCustomerModal
          isOpen={isDeleteModalOpen}
          customerName={locationToDelete.name}
          customerId={locationToDelete.id}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setLocationToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </DashboardLayout>
  );
}
