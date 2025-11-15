import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/layout/Layout";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProductDetails from "./pages/Inventory/ProductDetails";
import InventoryList from "./pages/Inventory/InventoryList";
import AddProduct from "./pages/Inventory/AddProduct";
import EditProduct from "./pages/Inventory/EditProduct";
import SalesList from "./pages/Sales/SalesList";
import NewSale from "./pages/Sales/NewSale";
import SaleDetails from "./pages/Sales/SaleDetails";
import ProvidersList from "./pages/Providers/ProvidersList";
import AddProvider from "./pages/Providers/AddProvider";
import EditProvider from "./pages/Providers/EditProvider";
import ProviderDetails from "./pages/Providers/ProviderDetails";
import EmployeesList from "./pages/Employees/EmployeesList";
import AddEmployee from "./pages/Employees/AddEmployee";
import EditEmployee from "./pages/Employees/EditEmployee";
import EmployeeDetails from "./pages/Employees/EmployeeDetails";
import Invoices from "./pages/Accounting/Invoices";
import AddInvoice from "./pages/Accounting/AddInvoice";
import InvoiceDetails from "./pages/Accounting/InvoiceDetails";
import ReportsPage from "./pages/Reports/ReportsPage";
import Profile from "./pages/Profile/Profile";
import UpdateNotification from "./components/UpdateNotification";

console.log('✅ App.jsx loaded')

function App() {
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    console.log('🔄 Initializing auth store...')
    initialize();
    setIsInitialized(true);
    console.log('✅ Auth store initialized')
  }, [initialize]);

  if (!isInitialized) {
    console.log('⏳ App initializing...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  console.log('✅ App rendering. isAuthenticated:', isAuthenticated)

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const PublicRoute = ({ children }) => {
    return !isAuthenticated ? children : <Navigate to="/" replace />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route index element={<Dashboard />} />
                  
                  {/* Perfil */}
                  <Route path="profile" element={<Profile />} />

                  {/* Inventario */}
                  <Route path="inventory" element={<InventoryList />} />
                  <Route path="inventory/add" element={<AddProduct />} />
                  <Route path="inventory/edit/:id" element={<EditProduct />} />
                  <Route path="inventory/details/:id" element={<ProductDetails />} />

                  {/* Ventas */}
                  <Route path="sales" element={<SalesList />} />
                  <Route path="sales/new" element={<NewSale />} />
                  <Route path="sales/:id" element={<SaleDetails />} />

                  {/* Proveedores */}
                  <Route path="providers" element={<ProvidersList />} />
                  <Route path="providers/add" element={<AddProvider />} />
                  <Route path="providers/edit/:id" element={<EditProvider />} />
                  <Route path="providers/:id" element={<ProviderDetails />} />

                  {/* Empleados - Solo para administradores */}
                  {user?.role === "ADMIN" && (
                    <>
                      <Route path="employees" element={<EmployeesList />} />
                      <Route path="employees/add" element={<AddEmployee />} />
                      <Route path="employees/edit/:id" element={<EditEmployee />} />
                      <Route path="employees/details/:id" element={<EmployeeDetails />} />
                    </>
                  )}

                  {/* CORREGIDO: Facturas directamente - Solo para administradores */}
                  {user?.role === "ADMIN" && (
                    <>
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="invoices/add" element={<AddInvoice />} />
                      <Route path="invoices/:id" element={<InvoiceDetails />} />
                    </>
                  )}

                  {/* Reportes - Solo para administradores */}
                  {user?.role === "ADMIN" && (
                    <Route path="reports" element={<ReportsPage />} />
                  )}

                  {/* Ruta catch-all para rutas no encontradas */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      
      <UpdateNotification />
    </div>
  );
}

export default App;