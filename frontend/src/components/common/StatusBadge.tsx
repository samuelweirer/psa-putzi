interface StatusBadgeProps {
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const statusConfig = {
    lead: {
      label: 'Lead',
      icon: '🔍',
      classes: 'bg-gray-100 text-gray-800 border border-gray-300',
    },
    prospect: {
      label: 'Interessent',
      icon: '👀',
      classes: 'bg-blue-100 text-blue-800 border border-blue-300',
    },
    active: {
      label: 'Aktiv',
      icon: '✅',
      classes: 'bg-green-100 text-green-800 border border-green-300',
    },
    inactive: {
      label: 'Inaktiv',
      icon: '💤',
      classes: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    },
    churned: {
      label: 'Gekündigt',
      icon: '❌',
      classes: 'bg-red-100 text-red-800 border border-red-300',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md ${sizeClasses[size]} ${config.classes}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}
