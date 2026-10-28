import axios from 'axios';

import type {
  Admin,
  Agency,
  AiChatRequest,
  AiChatResponse,
  AuthResponse,
  ChatMessage,
  ChatRoom,
  CompareResponse,
  Property,
  PropertyMapBounds,
  PropertyPriceHistoryEntry,
  ReportReason,
  SearchParams,
  SubscriptionPlan,
  SubscriptionPlanName,
  CurrentSubscription,
  SupportStatus,
  SupportTicket,
  SupportTicketType,
  User,
} from '@/types/models';

import { getStoredLocale, t } from '@/lib/i18n';

import {
  emitAuthFailure,
  getAuthFailureKind,
  USER_TOKEN_KEY,
} from '@/lib/auth-session';

type MessageResponse = {
  message: string;
};

export type AdminAgency = Agency & {
  verificationRejectionReason?: string | null;
  owner?: Pick<User, 'id' | 'name' | 'gmail' | 'phone'> | null;
};

type ApiErrorResponse = {
  message?: string | string[];
};

type ChatRoomApiResponse = {
  id: number;
  propertyId?: number | null;
  ownerId?: number | null;
  clientId?: number | null;
  property?: Property | null;
  owner?: User | null;
  client?: User | null;
  createdAt?: string;
};

function normalizeChatRoom(room: ChatRoomApiResponse): ChatRoom {
  const propertyId = room.propertyId ?? room.property?.id;
  const ownerId = room.ownerId ?? room.owner?.id;
  const clientId = room.clientId ?? room.client?.id;

  if (
    typeof propertyId !== 'number' ||
    !Number.isFinite(propertyId) ||
    typeof ownerId !== 'number' ||
    !Number.isFinite(ownerId) ||
    typeof clientId !== 'number' ||
    !Number.isFinite(clientId)
  ) {
    throw new Error('Invalid chat room response from API');
  }

  return {
    id: room.id,
    propertyId,
    ownerId,
    clientId,
    property: room.property ?? undefined,
    owner: room.owner ?? undefined,
    client: room.client ?? undefined,
    createdAt: room.createdAt,
  };
}

// Keep HTTP requests same-origin. Next.js proxies /api to the Nest server in
// next.config.ts, so a LAN visitor never tries to call its own localhost.
export const API_URL = '/api';

export function getSocketServerUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (typeof window === 'undefined') {
    return configured || 'http://localhost:2000';
  }

  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:2000`;
  }

  try {
    const socketUrl = new URL(configured);
    const currentHost = window.location.hostname;

    const configuredIsLocal =
      socketUrl.hostname === 'localhost' ||
      socketUrl.hostname === '127.0.0.1';

    const currentIsLocal =
      currentHost === 'localhost' ||
      currentHost === '127.0.0.1';

    if (configuredIsLocal && !currentIsLocal) {
      socketUrl.hostname = currentHost;
    }

    return socketUrl.origin;
  } catch {
    return window.location.origin;
  }
}

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(USER_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers.set('Accept-Language', getStoredLocale());
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (typeof window !== 'undefined') {
      const requestUrl = axios.isAxiosError(error)
        ? String(error.config?.url ?? '')
        : '';

      const isPublicAuthRequest = requestUrl.startsWith('/auth/');
      const failure = isPublicAuthRequest ? null : getAuthFailureKind(error);

      if (failure && localStorage.getItem(USER_TOKEN_KEY)) {
        emitAuthFailure(failure);
      }
    }

    const rejectionError =
      error instanceof Error ? error : new Error('Unknown API error');

    return Promise.reject(rejectionError);
  },
);

/*
 * ============================================================
 * Admin API
 * ============================================================
 *
 * Admin API has its own server and accepts only tokens
 * with payload.type === "ADMIN".
 *
 * The default path is proxied by next.config.ts
 * to avoid browser CORS assumptions.
 */

export const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_API_URL || '/admin-api',
});

adminApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rentora_admin_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function apiMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return 'Something went wrong. Please try again.';
  }

  const message = error.response?.data?.message;

  if (!message && error.request) {
    return t('errors.network');
  }

  if (Array.isArray(message)) {
    return message[0] || 'Something went wrong. Please try again.';
  }

  if (message) {
    return message;
  }

  if (error.request) {
    return 'We couldn’t reach Rentora. Check that the API is running.';
  }

  return 'Something went wrong. Please try again.';
}

/*
 * ============================================================
 * Auth
 * ============================================================
 */

export const authApi = {
  login: (data: { gmail: string; password: string }) =>
    api
      .post<AuthResponse>('/auth/login', data)
      .then((response) => response.data),

  register: (data: {
    name: string;
    phone: string;
    age: number;
    gmail: string;
    password: string;
  }) =>
    api
      .post<AuthResponse>('/auth/register', data)
      .then((response) => response.data),

  sendCode: (email: string) =>
    api
      .post<MessageResponse>('/auth/sendCode', { email })
      .then((response) => response.data),

  verify: (data: { gmail: string; code: string }) =>
    api
      .post<MessageResponse>('/auth/Verify', data)
      .then((response) => response.data),

  forgot: (gmail: string) =>
    api
      .post<MessageResponse>('/auth/forget', { gmail })
      .then((response) => response.data),

  newPassword: (data: { code: string; newPassword: string }) =>
    api
      .post<MessageResponse>('/auth/NewPassword', data)
      .then((response) => response.data),

  logout: () =>
    api
      .post<MessageResponse>('/auth/logout')
      .then((response) => response.data),
};

/*
 * ============================================================
 * Subscriptions
 * ============================================================
 */

export const subscriptionApi = {
  plans: () =>
    api
      .get<SubscriptionPlan[]>('/subscription/plans')
      .then((response) => response.data),

  me: () =>
    api
      .get<CurrentSubscription>('/subscription/me')
      .then((response) => response.data),

  // TODO: Replace with the real checkout endpoint once payments are connected.
  testPurchase: (plan: Exclude<SubscriptionPlanName, 'FREE'>) =>
    api
      .post<unknown>('/subscription/test-purchase', { plan })
      .then((response) => response.data),
};

/*
 * ============================================================
 * Properties
 * ============================================================
 */

export const propertiesApi = {
  all: () =>
    api
      .get<Property[]>('/properties')
      .then((response) => response.data),

  map: (bounds: PropertyMapBounds, filters: SearchParams = {}) =>
    api
      .get<Property[]>('/properties/map', {
        params: {
          ...bounds,
          ...filters,
        },
      })
      .then((response) => response.data),

  myMap: (bounds: PropertyMapBounds, filters: SearchParams = {}) =>
    api
      .get<Property[]>('/properties/my/map', {
        params: {
          ...bounds,
          ...filters,
        },
      })
      .then((response) => response.data),

  one: (id: string | number) => {
    const propertyId = Number(id);

    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      return Promise.reject(new Error('Invalid property id'));
    }

    return api
      .post<Property>(`/properties/find/${propertyId}`)
      .then((response) => response.data);
  },

  priceHistory: (id: string | number) =>
    api
      .get<PropertyPriceHistoryEntry[]>(`/properties/${id}/price-history`)
      .then((response) => response.data),

  search: (params: SearchParams) =>
    api
      .get<Property[]>('/search', { params })
      .then((response) => response.data),

  mine: () =>
    api
      .get<Property[]>('/properties/my')
      .then((response) => response.data),

  create: (data: FormData) =>
    api
      .post<Property>('/properties/create', data)
      .then((response) => response.data),

  update: (id: number, data: Partial<Property>) =>
    api
      .patch<Property>(`/properties/${id}`, data)
      .then((response) => response.data),

  archive: (id: number) =>
    api
      .post<MessageResponse>(`/properties/archive/${id}`)
      .then((response) => response.data),

  restore: (id: number) =>
    api
      .post<MessageResponse>(`/properties/restore/${id}`)
      .then((response) => response.data),

  compare: (firstId: number, secondId: number) =>
    api
      .post<CompareResponse>(`/properties/comapre/${firstId}/${secondId}`)
      .then((response) => response.data),

  report: (
    propertyId: number,
    data: {
      report: ReportReason;
      description: string;
    },
  ) =>
    api
      .post<MessageResponse>(`/properties/report/${propertyId}`, data)
      .then((response) => response.data),

  // Activate a boost for one of the current user's properties.
  activateBoops: (id: number) =>
    api
      .post<{
        message: string;
        boopsRemaining: number;
        propertyId: number;
        expiresAt: string;
      }>(`/properties/boops/${id}`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Agency
 * ============================================================
 */

export const agencyApi = {
  create: (data: FormData) =>
    api
      .post<MessageResponse>('/agency/create', data)
      .then((response) => response.data),

  mine: () =>
    api
      .get<Agency>('/agency/my')
      .then((response) => response.data),

  one: (id: string | number) =>
    api
      .get<Agency>(`/agency/one/${id}`)
      .then((response) => response.data),

  all: () =>
    api
      .get<Agency[]>('/agency/all')
      .then((response) => response.data),

  change: (data: FormData) =>
    api
      .patch<MessageResponse>('/agency/change', data)
      .then((response) => response.data),

  delete: (id: number) =>
    api
      .delete<MessageResponse>(`/agency/${id}`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * User
 * ============================================================
 */

export const userApi = {
  me: () =>
    api
      .get<User>('/user/me')
      .then((response) => response.data),

  update: (data: FormData) =>
    api
      .post<User>('/user/change', data)
      .then((response) => response.data),

  favorites: () =>
    api
      .get<
        Array<{
          property: Property;
        }>
      >('/user/fav')
      .then((response) => response.data),

  toggleFavorite: (id: number) =>
    api
      .post<{
        status: 'added' | 'removed';
      }>(`/user/fav/${id}`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Rentora AI
 * ============================================================
 */

export const aiApi = {
  chat: (data: AiChatRequest) =>
    api
      .post<AiChatResponse>('/ai/chat', data)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Chat
 * ============================================================
 */

export const chatApi = {
  rooms: () =>
    api
      .get<ChatRoomApiResponse[]>('/chat/rooms')
      .then((response) => response.data.map(normalizeChatRoom)),

  createRoom: (propertyId: number) =>
    api
      .post<ChatRoomApiResponse>('/chat/room', { propertyId })
      .then((response) => normalizeChatRoom(response.data)),

  messages: (roomId: number) =>
    api
      .get<ChatMessage[]>(`/chat/${roomId}/messages`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Support
 * ============================================================
 */

export const supportApi = {
  create: (data: {
    ticket: SupportTicketType;
    subject: string;
    message: string;
  }) =>
    api
      .post<MessageResponse>('/support/create', data)
      .then((response) => response.data),

  mine: () =>
    api
      .get<SupportTicket[]>('/support')
      .then((response) => response.data),

  one: (id: number) =>
    api
      .get<SupportTicket>(`/support/${id}`)
      .then((response) => response.data),

  cancel: (id: number) =>
    api
      .post<MessageResponse>(`/support/${id}`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Admin Auth
 * ============================================================
 */

export const adminAuthApi = {
  login: (data: { gmail: string; password: string }) =>
    adminApiClient
      .post<{
        accessToken: string;
      }>('/admin-auth/login', data)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Admin Users
 * ============================================================
 */

export const adminUsersApi = {
  all: () =>
    adminApiClient
      .get<User[]>('/admins/users')
      .then((response) => response.data),

  one: (id: number) =>
    adminApiClient
      .post<User>(`/admins/find/${id}`)
      .then((response) => response.data),

  search: (data: { name?: string; gmail?: string; phone?: string }) =>
    adminApiClient
      .post<User[]>('/admins/search', data)
      .then((response) => response.data),

  block: (id: number) =>
    adminApiClient
      .post<MessageResponse>(`/admins/block/${id}`)
      .then((response) => response.data),

  unblock: (id: number) =>
    adminApiClient
      .post<MessageResponse>(`/admins/unBlock/${id}`)
      .then((response) => response.data),

  me: () =>
    adminApiClient
      .get<Admin>('/admins/me')
      .then((response) => response.data),

  admins: () =>
    adminApiClient
      .get<Admin[]>('/admins/all-admins')
      .then((response) => response.data),

  oneAdmin: (id: number) =>
    adminApiClient
      .post<Admin>(`/admins/admin/${id}`)
      .then((response) => response.data),

  deleteAdmin: (id: number) =>
    adminApiClient
      .post<MessageResponse>(`/admins/delete-admin/${id}`)
      .then((response) => response.data),
};

/*
 * ============================================================
 * Admin Properties
 * ============================================================
 */

export const adminPropertiesApi = {
  active: () =>
    adminApiClient
      .get<Property[]>('/admins-properties/active')
      .then((response) => response.data),

  // Compatibility alias for existing callers.
  all: () =>
    adminApiClient
      .get<Property[]>('/admins-properties/active')
      .then((response) => response.data),

  pending: () =>
    adminApiClient
      .get<Property[]>('/admins-properties/pending')
      .then((response) => response.data),

  rejected: () =>
    adminApiClient
      .get<Property[]>('/admins-properties/rejected')
      .then((response) => response.data),

  expired: () =>
    adminApiClient
      .get<Property[]>('/admins-properties/expired')
      .then((response) => response.data),

  one: (id: number) =>
    adminApiClient
      .post<Property>(`/admins-properties/${id}`)
      .then((response) => response.data),

  accept: (id: number) =>
    adminApiClient
      .post<MessageResponse>(
        `/admins-properties/accept/${id}`,
      )
      .then((response) => response.data),

  reject: (id: number) =>
    adminApiClient
      .post<MessageResponse>(
        `/admins-properties/reject/${id}`,
      )
      .then((response) => response.data),

  archive: (id: number) =>
    adminApiClient
      .post<MessageResponse>(
        `/admins-properties/archive/${id}`,
      )
      .then((response) => response.data),

  restore: (id: number) =>
    adminApiClient
      .post<MessageResponse>(
        `/admins-properties/resotre/${id}`,
      )
      .then((response) => response.data),

  delete: (id: number) =>
    adminApiClient
      .delete<MessageResponse>(
        `/admins-properties/delete/${id}`,
      )
      .then((response) => response.data),
};
/*
 * ============================================================
 * Admin Support
 * ============================================================
 */

export const adminSupportApi = {
  all: () =>
    adminApiClient
      .get<SupportTicket[]>('/support-admin')
      .then((response) => response.data),

  byStatus: (status: SupportStatus) =>
    adminApiClient
      .get<SupportTicket[]>('/support-admin/status', {
        params: { status },
      })
      .then((response) => response.data),

  one: (id: number) =>
    adminApiClient
      .post<SupportTicket>(`/support-admin/${id}`)
      .then((response) => response.data),

  accept: (id: number) =>
    adminApiClient
      .post<{
        message: string;
        support: SupportTicket;
      }>(`/support-admin/accept/${id}`)
      .then((response) => response.data),

  close: (id: number) =>
    adminApiClient
      .post<MessageResponse>(`/support-admin/close/${id}`)
      .then((response) => response.data),

  respond: (id: number, message: string) =>
    adminApiClient
      .post<MessageResponse>(`/support-admin/response/${id}`, {
        message,
      })
      .then((response) => response.data),
};

/*
 * ============================================================
 * Admin Agencies
 * ============================================================
 */

export const adminAgenciesApi = {
  pending: () =>
    adminApiClient
      .get<AdminAgency[]>('/admins-agency/pending')
      .then((response) => response.data),

  verified: () =>
    adminApiClient
      .get<AdminAgency[]>('/admins-agency/confirms')
      .then((response) => response.data),

  rejected: () =>
    adminApiClient
      .get<AdminAgency[]>('/admins-agency/rejects')
      .then((response) => response.data),

  approve: (id: number) =>
    adminApiClient
      .post<MessageResponse>(`/admins-agency/confirm/${id}`)
      .then((response) => response.data),

  reject: (id: number, reason: string) =>
    adminApiClient
      .post<MessageResponse>(`/admins-agency/reject/${id}`, { reason })
      .then((response) => response.data),

  remove: (id: number, deleteReason: string) =>
    adminApiClient
      .delete<MessageResponse>(`/admins-agency/${id}`, {
        data: { deleteReason },
      })
      .then((response) => response.data),
};