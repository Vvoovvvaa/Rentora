import axios, { AxiosError } from "axios";
import type { Admin, AuthResponse, ChatMessage, ChatRoom, CompareResponse, Property, PropertyMapBounds, ReportReason, SearchParams, User } from "@/types/models";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") { const token = localStorage.getItem("rentora_token"); if (token) config.headers.Authorization = `Bearer ${token}`; }
  return config;
});
// Admin API has its own server and accepts only tokens with payload.type === "ADMIN".
// The default path is proxied by next.config.ts to avoid browser CORS assumptions.
export const adminApiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || "/admin-api" });
adminApiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("rentora_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export function apiMessage(error: unknown) {
  const payload = (error as AxiosError<{ message?: string | string[] }>).response?.data;
  const message = payload?.message;
  if (Array.isArray(message)) return message[0];
  if (message) return message;
  if ((error as AxiosError).request) return "We couldn’t reach Rentora. Check that the API is running.";
  return "Something went wrong. Please try again.";
}
export const authApi = {
  login: (data: { gmail: string; password: string }) => api.post<AuthResponse>("/auth/login", data).then(r => r.data),
  register: (data: { name: string; phone: string; age: number; gmail: string; password: string }) => api.post<AuthResponse>("/auth/register", data).then(r => r.data),
  sendCode: (email: string) => api.post("/auth/sendCode", { email }).then(r => r.data),
  verify: (data: { gmail: string; code: string }) => api.post("/auth/Verify", data).then(r => r.data),
  forgot: (gmail: string) => api.post("/auth/forget", { gmail }).then(r => r.data),
  newPassword: (data: { code: string; newPassword: string }) => api.post("/auth/NewPassword", data).then(r => r.data),
};
export const propertiesApi = {
  all: () => api.get<Property[]>("/properties").then(r => r.data),
  map: (bounds: PropertyMapBounds, filters: SearchParams = {}) => api.get<Property[]>("/properties/map", { params: { ...bounds, ...filters } }).then(r => r.data),
  myMap: (bounds: PropertyMapBounds, filters: SearchParams = {}) => api.get<Property[]>("/properties/my/map", { params: { ...bounds, ...filters } }).then(r => r.data),
  one: (id: string | number) => api.post<Property>(`/properties/find/${id}`).then(r => r.data),
  search: (params: SearchParams) => api.get<Property[]>("/search", { params }).then(r => r.data),
  mine: () => api.get<Property[]>("/properties/my").then(r => r.data),
  create: (data: FormData) => api.post<Property>("/properties/create", data).then(r => r.data),
  update: (id: number, data: Partial<Property>) => api.patch<Property>(`/properties/${id}`, data).then(r => r.data),
  archive: (id: number) => api.post(`/properties/archive/${id}`).then(r => r.data),
  restore: (id: number) => api.post<{ message: string }>(`/properties/restore/${id}`).then(r => r.data),
  compare: (firstId: number, secondId: number) => api.post<CompareResponse>(`/properties/comapre/${firstId}/${secondId}`).then(r => r.data),
  report: (propertyId: number, data: { report: ReportReason; description: string }) => api.post<{ message: string }>(`/properties/report/${propertyId}`, data).then(r => r.data),
};
export const userApi = {
  me: () => api.get<User>("/user/me").then(r => r.data),
  update: (data: FormData) => api.post<User>("/user/change", data).then(r => r.data),
  favorites: () => api.get<Array<{ property: Property }>>("/user/fav").then(r => r.data),
  toggleFavorite: (id: number) => api.post<{ status: "added" | "removed" }>(`/user/fav/${id}`).then(r => r.data),
};
export const chatApi = {
  rooms: () => api.get<ChatRoom[]>("/chat/rooms").then(r => r.data),
  createRoom: (propertyId: number) => api.post<ChatRoom>("/chat/room", { propertyId }).then(r => r.data),
  messages: (roomId: number) => api.get<ChatMessage[]>(`/chat/${roomId}/messages`).then(r => r.data),
};
export const adminAuthApi = {
  login: (data: { gmail: string; password: string }) => adminApiClient.post<{ accessToken: string }>("/admin-auth/login", data).then(r => r.data),
};
export const adminUsersApi = {
  all: () => adminApiClient.get<User[]>("/admins/users").then(r => r.data),
  one: (id: number) => adminApiClient.post<User>(`/admins/find/${id}`).then(r => r.data),
  search: (data: { name?: string; gmail?: string; phone?: string }) => adminApiClient.post<User[]>("/admins/search", data).then(r => r.data),
  block: (id: number) => adminApiClient.post<{ message: string }>(`/admins/block/${id}`).then(r => r.data),
  unblock: (id: number) => adminApiClient.post<{ message: string }>(`/admins/unBlock/${id}`).then(r => r.data),
  me: () => adminApiClient.get<Admin>("/admins/me").then(r => r.data),
  admins: () => adminApiClient.get<Admin[]>("/admins/all-admins").then(r => r.data),
  oneAdmin: (id: number) => adminApiClient.post<Admin>(`/admins/admin/${id}`).then(r => r.data),
  deleteAdmin: (id: number) => adminApiClient.post<{ message: string }>(`/admins/delete-admin/${id}`).then(r => r.data),
};
export const adminPropertiesApi = {
  all: () => adminApiClient.get<Property[]>("/admins-properties").then(r => r.data),
  one: (id: number) => adminApiClient.post<Property>(`/admins-properties/${id}`).then(r => r.data),
  pending: () => adminApiClient.get<Property[]>("/admins-properties/pending").then(r => r.data),
  accept: (id: number) => adminApiClient.post<{ message: string }>(`/admins-properties/accept/${id}`).then(r => r.data),
  reject: (id: number) => adminApiClient.post<{ message: string }>(`/admins-properties/reject/${id}`).then(r => r.data),
  archive: (id: number) => adminApiClient.post<{ message: string }>(`/admins-properties/archive/${id}`).then(r => r.data),
  restore: (id: number) => adminApiClient.post<{ message: string }>(`/admins-properties/resotre/${id}`).then(r => r.data),
  delete: (id: number) => adminApiClient.delete<{ message: string }>(`/admins-properties/delete/${id}`).then(r => r.data),
};
