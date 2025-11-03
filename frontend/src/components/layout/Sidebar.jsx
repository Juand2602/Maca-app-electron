import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Calculator,
  X,
  BarChart3,
  FileText,
  CreditCard,
  PieChart,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState({ accounting: false });

  // Elementos de navegación
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      adminOnly: false,
    },
    {
      name: "Inventario",
      href: "/inventory",
      icon: Package,
      adminOnly: false,
    },
    {
      name: "Ventas",
      href: "/sales",
      icon: ShoppingCart,
      adminOnly: false,
    },
    {
      name: "Proveedores",
      href: "/providers",
      icon: Truck,
      adminOnly: false,
    },
    {
      name: "Empleados",
      href: "/employees",
      icon: Users,
      adminOnly: true,
    },
    {
      name: "Contabilidad",
      key: "accounting",
      icon: Calculator,
      adminOnly: true,
      expandable: true,
      subItems: [
        {
          name: "Facturas",
          href: "/accounting/invoices",
          icon: FileText,
        },
      ],
    },
  ];

  // Filtrar elementos según el rol del usuario
  const filteredItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin()
  );

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const isParentActive = (item) => {
    if (item.subItems) {
      return item.subItems.some((subItem) => isActive(subItem.href));
    }
    return false;
  };

  const toggleMenu = (key) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Auto-expand accounting menu if we're on an accounting page
  const isAccountingActive = location.pathname.startsWith("/accounting");
  if (isAccountingActive && !expandedMenus.accounting) {
    setExpandedMenus((prev) => ({ ...prev, accounting: true }));
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
${isOpen ? "translate-x-0" : "-translate-x-full"}
`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Sistema</h2>
              <p className="text-xs text-gray-500">Administrativo</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems =
                item.expandable && item.subItems && item.subItems.length > 0;
              const isItemActive = hasSubItems
                ? isParentActive(item)
                : isActive(item.href);
              const isExpanded = hasSubItems && expandedMenus[item.key];

              return (
                <li key={item.name}>
                  {hasSubItems ? (
                    // Expandable parent item
                    <div>
                      <button
                        onClick={() => toggleMenu(item.key)}
                        className={`
w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
${
  isItemActive
    ? "bg-primary-100 text-primary-900"
    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
}
`}
                      >
                        <div className="flex items-center">
                          <Icon
                            className={`h-5 w-5 mr-3 ${
                              isItemActive
                                ? "text-primary-600"
                                : "text-gray-400"
                            }`}
                          />
                          {item.name}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      {/* Sub-navigation */}
                      {isExpanded && (
                        <ul className="mt-2 ml-4 space-y-1">
                          {item.subItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <li key={subItem.name}>
                                <Link
                                  to={subItem.href}
                                  className={`
flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
${
  isActive(subItem.href)
    ? "bg-primary-100 text-primary-900"
    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
}
`}
                                  onClick={() => {
                                    // Cerrar sidebar en mobile al navegar
                                    onClose();
                                  }}
                                >
                                  <SubIcon
                                    className={`h-4 w-4 mr-3 ${
                                      isActive(subItem.href)
                                        ? "text-primary-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  {subItem.name}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    // Regular navigation item
                    <Link
                      to={item.href}
                      className={`
sidebar-item
${isActive(item.href) ? "active" : ""}
`}
                      onClick={() => {
                        // Cerrar sidebar en mobile al navegar
                        onClose();
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>Sistema de Gestión</p>
            <p>Empresa de Calzado</p>
            <p className="mt-1 text-primary-600 font-medium">v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
