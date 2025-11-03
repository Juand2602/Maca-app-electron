import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';
import { getEmployeeById, changeEmployeeStatus } from '../../services/employeesService';
import toast from 'react-hot-toast';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await getEmployeeById(id);
        setEmployee(data);
      } catch (err) {
        setError('No se pudo cargar la información del empleado');
        toast.error('Error al cargar los datos del empleado');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!employee) return;
    
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activar' : 'desactivar';
    
    if (window.confirm(`¿Estás seguro de ${action} este empleado?`)) {
      try {
        await changeEmployeeStatus(id, newStatus);
        setEmployee({ ...employee, status: newStatus });
        toast.success(`Empleado ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      } catch (err) {
        toast.error(`Error al ${action} el empleado`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateYearsOfService = (hireDate) => {
    if (!hireDate) return 0;
    const years = (new Date() - new Date(hireDate)) / (365.25 * 24 * 60 * 60 * 1000);
    return Math.floor(years);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to="/employees"
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Volver a empleados
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">Detalles del Empleado</h1>
          </div>
        </div>
        
        <div className="card bg-red-50 border border-red-200">
          <div className="card-body">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error || 'Empleado no encontrado'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/employees"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Volver a empleados
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">Detalles del Empleado</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleToggleStatus}
            className={`btn ${
              employee.status === 'ACTIVE' 
                ? 'btn-warning' 
                : 'btn-success'
            }`}
          >
            {employee.status === 'ACTIVE' ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Activar
              </>
            )}
          </button>
          <Link
            to={`/employees/edit/${employee.id}`}
            className="btn btn-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Employee Info Banner */}
      <div className={`card ${
        employee.status === 'ACTIVE' 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
          : 'bg-gradient-to-r from-red-50 to-pink-50'
      }`}>
        <div className="card-body">
          <div className="flex items-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
              employee.status === 'ACTIVE' 
                ? 'bg-green-100' 
                : 'bg-red-100'
            }`}>
              <User className={`h-8 w-8 ${
                employee.status === 'ACTIVE' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-gray-600">
                {employee.position} - {employee.department}
              </p>
              <div className="flex items-center mt-1">
                {employee.status === 'ACTIVE' ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  employee.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-medium text-gray-900">ID Empleado</p>
              <p className="text-lg font-bold text-gray-900">{employee.id}</p>
              <p className="text-sm text-gray-500">Documento: {employee.document}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <User className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Información Personal
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                  <p className="text-sm text-gray-900">{employee.firstName} {employee.lastName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Documento</p>
                  <p className="text-sm text-gray-900">{employee.document}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de nacimiento</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.birthDate)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Género</p>
                  <p className="text-sm text-gray-900">{employee.gender || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Estado civil</p>
                  <p className="text-sm text-gray-900">{employee.maritalStatus || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Ciudad</p>
                  <p className="text-sm text-gray-900">{employee.city || 'No especificada'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Dirección</p>
                  <p className="text-sm text-gray-900">{employee.address || 'No especificada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <Briefcase className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Información Laboral
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cargo</p>
                  <p className="text-sm text-gray-900">{employee.position || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Departamento</p>
                  <p className="text-sm text-gray-900">{employee.department || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de ingreso</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.hireDate)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Antigüedad</p>
                  <p className="text-sm text-gray-900">
                    {calculateYearsOfService(employee.hireDate)} {calculateYearsOfService(employee.hireDate) === 1 ? 'año' : 'años'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Salario</p>
                  <p className="text-sm text-gray-900">{formatCurrency(employee.salary)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de contrato</p>
                  <p className="text-sm text-gray-900">{employee.contractType || 'No especificado'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Horario de trabajo</p>
                  <p className="text-sm text-gray-900">{employee.workSchedule || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <Heart className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Contacto de Emergencia
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre</p>
                  <p className="text-sm text-gray-900">{employee.emergencyContactName || 'No especificado'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <p className="text-sm text-gray-900">{employee.emergencyContactPhone || 'No especificado'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Parentesco</p>
                  <p className="text-sm text-gray-900">{employee.emergencyContactRelationship || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contacto */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <Mail className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Contacto
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{employee.email || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-sm text-gray-900">{employee.phone || 'No especificado'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dirección</p>
                    <p className="text-sm text-gray-900">{employee.address || 'No especificada'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Sistema */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Información de Sistema
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Usuario asociado</p>
                  <p className="text-sm text-gray-900">{employee.username || 'No tiene usuario'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Última actualización</p>
                  <p className="text-sm text-gray-900">{formatDate(employee.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          {employee.notes && (
            <div className="card">
              <div className="card-body">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="h-6 w-6 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notas
                  </h3>
                </div>

                <p className="text-sm text-gray-900">{employee.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;