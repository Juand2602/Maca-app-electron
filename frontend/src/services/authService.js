import api from "./api";

export const authService = {
  login: async (credentials) => {
    try {
      sessionStorage.removeItem('logoutMessageShown')
      
      const response = await api.post("/auth/signin", {
        username: credentials.username,
        password: credentials.password,
        warehouse: credentials.warehouse, // NUEVO: Enviar bodega
      });

      const { token, username, fullName, role, email, warehouse } = response.data;

      const tokenData = {
        token: token,
        expiresAt: new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
      }
      localStorage.setItem('tokenData', JSON.stringify(tokenData))

      return {
        user: {
          id: username,
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" "),
          email: email,
          role: role,
          username: username,
          warehouse: warehouse, // NUEVO: Incluir bodega en usuario
          lastLogin: new Date().toISOString(),
        },
        token: token,
      };
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      localStorage.removeItem('tokenData')
      localStorage.removeItem('user')
      localStorage.removeItem('auth-storage')
      sessionStorage.removeItem('logoutMessageShown')
    } catch (error) {
      console.warn("Error al hacer logout en servidor:", error);
    }
  },

  verifyToken: async () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      if (!tokenData.token || new Date().getTime() > tokenData.expiresAt) {
        throw new Error('Token expirado')
      }
      
      const response = await api.get("/auth/test");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createUserForEmployee: async (employeeId) => {
    try {
      const response = await api.post(`/auth/create-user/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error("Error al crear usuario para el empleado:", error);
      throw error;
    }
  },

  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  },

  clearAuthToken: () => {
    delete api.defaults.headers.common["Authorization"];
  },

  isTokenExpired: () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      if (!tokenData.token) return true
      
      return new Date().getTime() > tokenData.expiresAt
    } catch (e) {
      return true
    }
  },

  getStoredToken: () => {
    try {
      const tokenData = JSON.parse(localStorage.getItem('tokenData') || '{}')
      return tokenData.token || null
    } catch (e) {
      return null
    }
  },
};