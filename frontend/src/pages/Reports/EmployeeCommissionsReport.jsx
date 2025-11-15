// frontend/src/pages/Reports/EmployeeCommissionsReport.jsx
import { useState, useEffect } from 'react';
import { Calendar, Download, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const EmployeeCommissionsReport = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [reportData, setReportData] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getEmployeeCommissionsReport(
        dateRange.startDate, 
        dateRange.endDate
      );
      setReportData(data);
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const exportToCSV = () => {
    if (!reportData) return;

    // Crear CSV
    let csv = 'Empleado,Total Ventas,Cantidad Ventas,% Comisión,Total Comisión\n';
    
    reportData.employees.forEach(emp => {
      csv += `"${emp.employeeName}",${emp.totalSales},${emp.salesCount},${emp.commissionRate}%,${emp.totalCommission}\n`;
    });

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comisiones_empleados_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('CSV descargado exitosamente');
  };

  const viewEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({
                  ...dateRange,
                  startDate: new Date(e.target.value)
                })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange({
                  ...dateRange,
                  endDate: new Date(e.target.value)
                })}
                className="input"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <div className="spinner h-4 w-4 mr-2"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </button>
            </div>
          </div>

          {reportData && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={exportToCSV}
                disabled={loading}
                className="btn btn-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resultados */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner h-8 w-8 mr-3"></div>
          <span className="text-gray-600">Generando reporte...</span>
        </div>
      )}

      {!loading && reportData && (
        <>
          {/* Resumen General */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-gray-500">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.summary.totalSales)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {reportData.summary.totalSalesCount} transacciones
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-500">Total Comisiones</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(reportData.summary.totalCommissions)}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm text-gray-500">Empleados Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.summary.employeesCount}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-sm text-gray-500">Comisión Promedio</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    reportData.summary.totalCommissions / reportData.summary.employeesCount || 0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Comisiones por Empleado */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Comisiones por Empleado
              </h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Empleado
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Total Ventas
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Cantidad
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        % Comisión
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Total Comisión
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.employees.map((employee, index) => (
                      <tr key={employee.employeeId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {employee.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {employee.salesCount} ventas realizadas
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                          {formatCurrency(employee.totalSales)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">
                          {employee.salesCount}
                        </td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.commissionRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-right text-green-600">
                          {formatCurrency(employee.totalCommission)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => viewEmployeeDetails(employee)}
                            className="btn btn-sm btn-secondary"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan="2" className="py-3 px-4 text-sm text-gray-900">
                        TOTAL
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {formatCurrency(reportData.summary.totalSales)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {reportData.summary.totalSalesCount}
                      </td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-sm text-right text-green-600">
                        {formatCurrency(reportData.summary.totalCommissions)}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalle de Empleado */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Detalle de Comisiones
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedEmployee.employeeName}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Resumen del Empleado */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Total Ventas</p>
                  <p className="text-xl font-bold text-blue-900">
                    {formatCurrency(selectedEmployee.totalSales)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">% Comisión</p>
                  <p className="text-xl font-bold text-purple-900">
                    {selectedEmployee.commissionRate}%
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Total a Pagar</p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(selectedEmployee.totalCommission)}
                  </p>
                </div>
              </div>

              {/* Detalle de Ventas */}
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Ventas ({selectedEmployee.salesCount})
              </h4>
              <div className="space-y-4">
                {selectedEmployee.sales.map((sale) => (
                  <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.saleNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(sale.date)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Cliente: {sale.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Venta</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(sale.total)}
                        </p>
                        <p className="text-sm text-green-600 font-medium mt-1">
                          Comisión: {formatCurrency(sale.commission)}
                        </p>
                      </div>
                    </div>

                    {/* Items de la venta */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Productos vendidos:
                      </p>
                      <div className="space-y-1">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.product} x{item.quantity}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total a Pagar al Empleado</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedEmployee.totalCommission)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="btn btn-primary"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeCommissionsReport;