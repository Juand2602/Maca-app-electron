// frontend/src/pages/Reports/ReportsPage.jsx
import { useState } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  FileText, 
  Calendar,
  Download,
  TrendingUp
} from 'lucide-react';
import TransactionsReport from './TransactionsReport';
import EmployeeCommissionsReport from './EmployeeCommissionsReport';

const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('transactions');

  const reports = [
    {
      id: 'transactions',
      name: 'Reporte de Transacciones',
      icon: FileText,
      description: 'Ventas, compras e inventario',
      color: 'blue'
    },
    {
      id: 'commissions',
      name: 'Comisiones de Empleados',
      icon: DollarSign,
      description: 'Cálculo de comisiones por ventas',
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500">
          Genera reportes detallados de tu negocio
        </p>
      </div>

      {/* Selector de Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;

          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                isActive
                  ? `border-${report.color}-500 bg-${report.color}-50`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  isActive 
                    ? `bg-${report.color}-100` 
                    : 'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    isActive 
                      ? `text-${report.color}-600` 
                      : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-semibold mb-1 ${
                    isActive 
                      ? `text-${report.color}-900` 
                      : 'text-gray-900'
                  }`}>
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenido del Reporte */}
      <div className="mt-6">
        {activeReport === 'transactions' && <TransactionsReport />}
        {activeReport === 'commissions' && <EmployeeCommissionsReport />}
      </div>
    </div>
  );
};

export default ReportsPage;