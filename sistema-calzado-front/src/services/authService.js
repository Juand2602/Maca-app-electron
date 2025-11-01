import api from "./api";

export const authService = {
  // Login
  login: async (credentials) => {
    try {
      // Limpiar cualquier mensaje de logout anterior
      sessionStorage.removeItem('logoutMessageShown')
      
      // Realizamos la petición real al backend
      const response = await api.post("/auth/signin", {
        username: credentials.username,
        password: credentials.password,
      });

      // Formateamos la respuesta para que coincida con lo que espera el frontend
      const { token, username, fullName, role, email } = response.data;

      // Guardamos el token y la fecha de expiración en localStorage
      const tokenData = {
        token: token,
        expiresAt: new Date().getTime() + (7 * 24 * 60 * 60 * 1000) // 7 días
      }
      localStorage.setItem('tokenData', JSON.stringify(tokenData))

      return {
        user: {
          id: username, // Usamos username como id temporal
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" "),
          email: email,
          role: role,
          username: username,
          warehouse: credentials.warehouse,
          lastLogin: new Date().toISOString(),
        },
        token: token,
      };
    } catch (error) {
      // Si hay un error, lo propagamos para que el store lo maneje
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      // Limpiar todos los datos de autenticación
      localStorage.removeItem('tokenData')
      localStorage.removeItem('user')
      localStorage.removeItem('auth-storage')
      sessionStorage.removeItem('logoutMessageShown')
    } catch (error) {
      console.warn("Error al hacer logout en servidor:", error);
    }
  },

  // Verificar token
  verifyToken: async () => {
    try {
      // Verificamos si el token ha expirado
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      if (!tokenData.token || new Date().getTime() > tokenData.expiresAt) {
        throw new Error('Token expirado')
      }
      
      // El backend no tiene endpoint de verificación, pero podríamos implementarlo
      // Por ahora, simplemente verificamos que el token sea válido haciendo una petición
      const response = await api.get("/auth/test");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear usuario para un empleado (NUEVO MÉTODO)
  createUserForEmployee: async (employeeId) => {
    try {
      const response = await api.post(`/auth/create-user/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("Error al crear usuario para el empleado:", error);
      throw error;
    }
  },

  // Configurar token en headers de axios
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  },

  // Limpiar token
  clearAuthToken: () => {
    delete api.defaults.headers.common["Authorization"];
  },

  // Verificar si el token está expirado
  isTokenExpired: () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      if (!tokenData.token) return true
      
      // Verificamos si el token ha expirado
      return new Date().getTime() > tokenData.expiresAt
    } catch (e) {
      return true
    }
  },

  // Obtener token almacenado
  getStoredToken: () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      return tokenData.token || null
    } catch (e) {
      return null
    }
  },
};