import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: number;
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Kunden', path: '/customers', icon: '🏢', badge: 45 },
    { name: 'Tickets', path: '/tickets', icon: '🎫', badge: 23 },
    { name: 'Projekte', path: '/projects', icon: '📋', badge: 12 },
    { name: 'Rechnungen', path: '/invoices', icon: '💶', badge: 8 },
    { name: 'Berichte', path: '/reports', icon: '📈' },
    { name: 'Assets', path: '/assets', icon: '💻' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">PUTZI</h1>
        <p className="text-xs text-gray-500 mt-1 italic">
          „Saubere Prozesse – PUTZI macht's rein."
        </p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive(item.path)
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-1">
          <li>
            <Link
              to="/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/settings')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">⚙️</span>
              <span className="text-sm">Einstellungen</span>
            </Link>
          </li>
          <li>
            <Link
              to="/help"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/help')
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">❓</span>
              <span className="text-sm">Hilfe</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
