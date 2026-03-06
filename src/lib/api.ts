import type {AdminDashboardStats, Space, User} from '../types';

type JsonOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

async function requestJson<T>(path: string, options: JsonOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const err = (await response.json()) as {error?: string};
      if (err.error) message = err.error;
    } catch {
      // ignore json parse errors and keep fallback message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchMe(): Promise<User> {
  return requestJson<User>('/api/me');
}

export async function register(payload: {email: string; password: string; nickname: string}): Promise<User> {
  return requestJson<User>('/api/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function login(payload: {email: string; password: string}): Promise<User> {
  return requestJson<User>('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function logout(): Promise<void> {
  return requestJson<void>('/api/auth/logout', {
    method: 'POST',
  });
}

export async function changePassword(payload: {currentPassword: string; newPassword: string}): Promise<void> {
  return requestJson<void>('/api/auth/change-password', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchSpaces(): Promise<Space[]> {
  return requestJson<Space[]>('/api/spaces');
}

export async function createSpace(payload: {
  name: string;
  avatarImage: string;
  heroImage?: string;
  description?: string;
}): Promise<Space> {
  return requestJson<Space>('/api/spaces', {
    method: 'POST',
    body: payload,
  });
}

export async function updateSpaceMeta(
  id: string,
  payload: Partial<Pick<Space, 'name' | 'avatarImage' | 'heroImage' | 'description'>>,
): Promise<Space> {
  return requestJson<Space>(`/api/spaces/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteSpace(id: string): Promise<void> {
  return requestJson<void>(`/api/spaces/${id}`, {
    method: 'DELETE',
  });
}

export async function saveSpaceSnapshot(space: Space): Promise<Space> {
  return requestJson<Space>(`/api/spaces/${space.id}/full`, {
    method: 'PUT',
    body: space,
  });
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/uploads', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const err = (await response.json()) as {error?: string};
      if (err.error) message = err.error;
    } catch {
      // ignore json parse errors and keep fallback message
    }
    throw new ApiError(message, response.status);
  }

  const payload = (await response.json()) as {url: string};
  return payload.url;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  return requestJson<AdminDashboardStats>('/api/admin/dashboard');
}
