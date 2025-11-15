// frontend/src/services/reportService.js
import api from './api';

class ReportService {
  
  /**
   * Reporte de Ventas
   */
  async getSalesReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/sales', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  }
  
  /**
   * Reporte de Compras
   */
  async getPurchasesReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/purchases', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching purchases report:', error);
      throw error;
    }
  }
  
  /**
   * Reporte de Inventario
   */
  async getInventoryReport() {
    try {
      const response = await api.get('/reports/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }
  }
  
  /**
   * Estado de Resultados (P&L)
   */
  async getProfitLossReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/profit-loss', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching profit & loss report:', error);
      throw error;
    }
  }
  
  /**
   * Reporte de Proveedores
   */
  async getProvidersReport() {
    try {
      const response = await api.get('/reports/providers');
      return response.data;
    } catch (error) {
      console.error('Error fetching providers report:', error);
      throw error;
    }
  }
  
  /**
   * Reporte de Comisiones de Empleados
   */
  async getEmployeeCommissionsReport(startDate, endDate) {
    try {
      const response = await api.get('/reports/employee-commissions', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching employee commissions report:', error);
      throw error;
    }
  }
}

export default new ReportService();