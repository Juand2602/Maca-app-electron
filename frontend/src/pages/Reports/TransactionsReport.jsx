// frontend/src/pages/Reports/TransactionsReport.jsx
import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const TransactionsReport = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales'); // sales, purchases, inventory, profitLoss
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'sales', name: 'Ventas', icon: ShoppingCart, color: 'green' },
    { id: 'purchases', name: 'Compras', icon: Package, color: 'blue' },
    { id: 'profitLoss', name: 'Estado de Resultados', icon: TrendingUp, color: 'purple' }
  ];

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
      day: 'numeric'
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let data;
      switch (reportType) {
        case 'sales':
          data = await reportService.getSalesReport(dateRange.startDate, dateRange.endDate);
          break;
        case 'purchases':
          data = await reportService.getPurchasesReport(dateRange.startDate, dateRange.endDate);
          break;
        case 'profitLoss':
          data = await reportService.getProfitLossReport(dateRange.startDate, dateRange.endDate);
          break;
        default:
          data = await reportService.getSalesReport(dateRange.startDate, dateRange.endDate);
      }
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
  }, [reportType]);

  const exportToCSV = () => {
    if (!reportData) return;

    let csv = '';
    let filename = '';

    switch (reportType) {
      case 'sales':
        csv = 'Categoría,Cantidad,Total\n';
        reportData.salesByCategory.forEach(cat => {
          csv += `"${cat.category}",${cat.quantity},${cat.total}\n`;
        });
        filename = 'reporte_ventas.csv';
        break;
      case 'purchases':
        csv = 'Proveedor,Facturas,Total,Pagado,Pendiente\n';
        reportData.purchasesByProvider.forEach(prov => {
          csv += `"${prov.provider}",${prov.invoices},${prov.total},${prov.paid},${prov.pending}\n`;
        });
        filename = 'reporte_compras.csv';
        break;
      case 'profitLoss':
        csv = 'Concepto,Monto\n';
        csv += `"Ingresos Totales",${reportData.revenue.totalRevenue}\n`;
        csv += `"Descuentos",${reportData.revenue.totalDiscount}\n`;
        csv += `"Ingresos Netos",${reportData.revenue.netRevenue}\n`;
        csv += `"Costo de Ventas",${reportData.costs.costOfGoodsSold}\n`;
        csv += `"Utilidad Bruta",${reportData.costs.grossProfit}\n`;
        csv += `"Gastos Operativos",${reportData.expenses.operatingExpenses}\n`;
        csv += `"Utilidad Neta",${reportData.profit.netProfit}\n`;
        filename = 'estado_resultados.csv';
        break;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    toast.success('CSV descargado exitosamente');
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="select"
              >
                {reportTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de Fechas */}
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
          </div>

          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className="btn btn-primary"
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
            <button
              onClick={exportToCSV}
              disabled={!reportData || loading}
              className="btn btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </button>
          </div>
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
          {/* REPORTE DE VENTAS */}
          {reportType === 'sales' && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.summary.totalSales)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {reportData.summary.totalTransactions} transacciones
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Descuentos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.summary.totalDiscount)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Impuestos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.summary.totalTax)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(reportData.summary.averageTicket)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ventas por Categoría */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ventas por Categoría
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {reportData.salesByCategory.map((category) => (
                      <div
                        key={category.category}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {category.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            {category.quantity} unidades
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(category.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Productos */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top 10 Productos Más Vendidos
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
                            Producto
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Código
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Cantidad
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topProducts.map((product, index) => (
                          <tr key={product.code} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {product.product}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {product.code}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900">
                              {product.quantity}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                              {formatCurrency(product.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Métodos de Pago
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportData.paymentMethods.map((method) => (
                      <div
                        key={method.method}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <p className="text-sm text-gray-500 mb-1">
                          {method.method}
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(method.total)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {method.count} transacciones
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTE DE COMPRAS */}
          {reportType === 'purchases' && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Total Compras</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(reportData.summary.totalPurchases)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {reportData.summary.totalInvoices} facturas
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(reportData.summary.totalPaid)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {reportData.summary.paymentRate.toFixed(1)}% pagado
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Total Pendiente</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(reportData.summary.totalPending)}
                    </p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500">Facturas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {reportData.summary.totalInvoices}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compras por Proveedor */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Compras por Proveedor
                  </h3>
                </div>
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                            Proveedor
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Facturas
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Total
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Pagado
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                            Pendiente
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.purchasesByProvider.map((provider) => (
                          <tr key={provider.provider} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">
                              {provider.provider}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-900">
                              {provider.invoices}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">
                              {formatCurrency(provider.total)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-green-600">
                              {formatCurrency(provider.paid)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-red-600">
                              {formatCurrency(provider.pending)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ESTADO DE RESULTADOS */}
          {reportType === 'profitLoss' && (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500 mb-2">Ingresos Netos</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(reportData.revenue.netRevenue)}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Ingresos Totales</span>
                        <span className="font-medium">
                          {formatCurrency(reportData.revenue.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Descuentos</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(reportData.revenue.totalDiscount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <p className="text-sm text-gray-500 mb-2">Utilidad Neta</p>
                    <p className={`text-3xl font-bold ${
                      reportData.profit.netProfit >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(reportData.profit.netProfit)}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Margen Neto</span>
                        <span className={`font-medium ${
                          reportData.profit.netMargin >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {reportData.profit.netMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose Detallado */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Estado de Resultados Detallado
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {/* Ingresos */}
                    <div className="pb-4 border-b">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">INGRESOS</span>
                      </div>
                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ventas Brutas</span>
                          <span className="font-medium">
                            {formatCurrency(reportData.revenue.totalRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">(-) Descuentos</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(reportData.revenue.totalDiscount)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-medium text-gray-900">Ingresos Netos</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(reportData.revenue.netRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Costos */}
                    <div className="pb-4 border-b">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">COSTOS</span>
                      </div>
                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Costo de Ventas</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(reportData.costs.costOfGoodsSold)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-medium text-gray-900">Utilidad Bruta</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(reportData.costs.grossProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Margen Bruto</span>
                          <span className="font-medium text-green-600">
                            {reportData.costs.grossMargin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gastos */}
                    <div className="pb-4 border-b">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-900">GASTOS OPERATIVOS</span>
                      </div>
                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Gastos Operativos</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(reportData.expenses.operatingExpenses)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Utilidad Final */}
                    <div>
                      <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-lg font-bold text-gray-900">
                          UTILIDAD NETA
                        </span>
                        <span className={`text-xl font-bold ${
                          reportData.profit.netProfit >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(reportData.profit.netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionsReport;