// src/components/layout/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  ShoppingCart,
  Truck,
  Users,
  FileText,
  X,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin } = useAuthStore();

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
      name: "Facturas",
      href: "/invoices",
      icon: FileText,
      adminOnly: true,
    },
    {
      name: "Reportes",
      href: "/reports",
      icon: TrendingUp,
      adminOnly: true,
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

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-black shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                src={getAssetPath("logo-maca.png")}
                alt="MACA Logo"
                className="h-10 w-auto filter brightness-0 invert"
              />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white">MACA</h2>
              <p className="text-xs text-gray-400">Sistema Administrativo</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex-1 overflow-y-auto pb-20">
          <ul className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const itemActive = isActive(item.href);

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${
                        itemActive
                          ? "bg-white text-black"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }
                    `}
                    onClick={() => {
                      // Cerrar sidebar en mobile al navegar
                      onClose();
                    }}
                  >
                    <Icon
                      className={`h-5 w-5 mr-3 ${
                        itemActive ? "text-black" : "text-gray-400"
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-black">
          <div className="text-xs text-gray-400 text-center">
            <p className="font-semibold text-white">MACA</p>
            <p>Empresa de Calzado</p>
          </div>
        </div>
      </div>

      {/* Overlay - solo en mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
