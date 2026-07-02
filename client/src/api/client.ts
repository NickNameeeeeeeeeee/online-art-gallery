import axios from "axios";
import type { Artwork, ArtworkSnapshot, Collection, Favorite, User } from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("galleryToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "The request could not be completed.";
  }
  return error instanceof Error ? error.message : "The request could not be completed.";
};

export const toSnapshot = (artwork: Artwork): ArtworkSnapshot => ({
  source: artwork.source,
  sourceId: artwork.sourceId,
  title: artwork.title,
  artist: artwork.artist,
  date: artwork.date,
  medium: artwork.medium,
  imageUrl: artwork.imageUrl,
  thumbnailUrl: artwork.thumbnailUrl,
  museumName: artwork.museumName,
  museumUrl: artwork.museumUrl,
  isPublicDomain: artwork.isPublicDomain,
  creditLine: artwork.creditLine || "",
});

export const galleryApi = {
  featured: async () => (await api.get<{ data: Artwork[] }>("/artworks/featured")).data.data,
  search: async (params: {
    query: string;
    source: "all" | "met" | "artic";
    page: number;
    limit: number;
    publicDomain: boolean;
  }) => (await api.get("/artworks", { params })).data,
  artwork: async (source: string, id: string) =>
    (await api.get<{ data: Artwork }>(`/artworks/${source}/${id}`)).data.data,
  register: async (payload: { name: string; email: string; password: string }) =>
    (await api.post<{ data: { user: User; token: string } }>("/auth/register", payload)).data.data,
  login: async (payload: { email: string; password: string }) =>
    (await api.post<{ data: { user: User; token: string } }>("/auth/login", payload)).data.data,
  me: async () => (await api.get<{ data: User }>("/auth/me")).data.data,
  changePassword: async (payload: { currentPassword: string; newPassword: string }) =>
    (await api.put<{ data: { message: string } }>("/auth/password", payload)).data.data,
  favorites: async () => (await api.get<{ data: Favorite[] }>("/favorites")).data.data,
  addFavorite: async (artwork: ArtworkSnapshot) =>
    (await api.post<{ data: Favorite }>("/favorites", { artwork })).data.data,
  removeFavorite: async (source: string, sourceId: string) => api.delete(`/favorites/${source}/${sourceId}`),
  collections: async () => (await api.get<{ data: Collection[] }>("/collections")).data.data,
  collection: async (id: string) => (await api.get<{ data: Collection }>(`/collections/${id}`)).data.data,
  publicCollection: async (slug: string) =>
    (await api.get<{ data: Collection }>(`/collections/public/${slug}`)).data.data,
  createCollection: async (payload: Partial<Collection>) =>
    (await api.post<{ data: Collection }>("/collections", payload)).data.data,
  updateCollection: async (id: string, payload: Partial<Collection>) =>
    (await api.put<{ data: Collection }>(`/collections/${id}`, payload)).data.data,
  deleteCollection: async (id: string) => api.delete(`/collections/${id}`),
};
