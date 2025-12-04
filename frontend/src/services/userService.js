import axios from "axios";
import { SERVICES, API_ENDPOINTS } from "../utils/constants";

const userApi = axios.create({
  baseURL: SERVICES.USER,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
userApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("asgardeo_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  // Users
  getAllUsers: async (params) => {
    const response = await userApi.get(API_ENDPOINTS.USERS, { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await userApi.get(`${API_ENDPOINTS.USERS}/${id}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await userApi.post(API_ENDPOINTS.USERS, userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await userApi.put(
      `${API_ENDPOINTS.USERS}/${id}`,
      userData
    );
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await userApi.patch(`${API_ENDPOINTS.USERS}/${id}/role`, {
      role,
    });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await userApi.delete(`${API_ENDPOINTS.USERS}/${id}`);
    return response.data;
  },

  // Stats
  getUserStats: async () => {
    const response = await userApi.get(`${API_ENDPOINTS.USERS}/stats`);
    return response.data;
  },
};
