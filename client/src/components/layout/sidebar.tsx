import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Warehouse, 
  BarChart3, 
  Package, 
  ArrowLeftRight, 
  Building2, 
  Truck, 
  Settings, 
  LogOut,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Movimientos', href: '/movements', icon: ArrowLeftRight },
  { name: 'Bodegas', href: '/warehouses', icon: Building2 },
  { name: 'Proveedores', href: '/suppliers', icon: Truck },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const getUserInitials = (user: any) => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: any) => {
    if (!user) return 'Usuario';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Usuario';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      administrator: 'Administrador',
      operator: 'Operador',
      viewer: 'Consulta'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50",
        isMobile && "fixed inset-y-0 left-0",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && "transition-transform duration-300 ease-in-out",
        !isMobile && "relative"
      )}>
        {/* Logo and mobile close button */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">InventoryPro</h1>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User Info */}
        <div className="px-4 mt-6">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium" data-testid="text-user-initials">
                {getUserInitials(user)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" data-testid="text-user-name">
                {getUserDisplayName(user)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-user-role">
                {user?.role ? getRoleDisplayName(user.role) : 'Usuario'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 px-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                data-testid={`link-${item.name.toLowerCase()}`}
              >
                <div className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900 border-r-2 border-primary-500 text-primary-700 dark:text-primary-200"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                )}>
                  <Icon className={cn(
                    "mr-3 flex-shrink-0 h-4 w-4",
                    isActive 
                      ? "text-primary-500" 
                      : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                  )} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="flex-shrink-0 px-4 pb-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </>
  );
}
