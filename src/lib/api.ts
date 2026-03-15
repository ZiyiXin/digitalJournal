import type {AccountDashboardStats, AdminDashboardStats, ImageUploadResult, Space, User} from '../types';

type JsonOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

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

function parseApiErrorMessage(payloadText: string, fallbackMessage: string): string {
  try {
    const payload = JSON.parse(payloadText) as {error?: string};
    return payload.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
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
  avatarThumbnailImage?: string;
  heroImage?: string;
  heroThumbnailImage?: string;
  description?: string;
}): Promise<Space> {
  return requestJson<Space>('/api/spaces', {
    method: 'POST',
    body: payload,
  });
}

export async function updateSpaceMeta(
  id: string,
  payload: Partial<
    Pick<
      Space,
      'name' | 'avatarImage' | 'avatarThumbnailImage' | 'heroImage' | 'heroThumbnailImage' | 'description' | 'infoCapsules'
    >
  >,
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

export async function uploadImage(
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise<ImageUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.withCredentials = true;
    xhr.responseType = 'text';

    xhr.upload.addEventListener('progress', (event) => {
      if (!onProgress || !event.lengthComputable) return;
      const total = Math.max(event.total, 0);
      const loaded = Math.min(Math.max(event.loaded, 0), total);
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      onProgress({loaded, total, percent});
    });

    xhr.onerror = () => {
      reject(new ApiError('Network error', xhr.status || 0));
    };

    xhr.onabort = () => {
      reject(new ApiError('Upload aborted', xhr.status || 0));
    };

    xhr.onload = () => {
      const fallbackMessage = `${xhr.status} ${xhr.statusText}`.trim() || 'Upload failed';
      const responseText = typeof xhr.responseText === 'string' ? xhr.responseText : '';

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(parseApiErrorMessage(responseText, fallbackMessage), xhr.status));
        return;
      }

      try {
        const payload = JSON.parse(responseText) as ImageUploadResult;
        const total = file.size;
        if (onProgress) {
          onProgress({
            loaded: total,
            total,
            percent: 100,
          });
        }
        resolve(payload);
      } catch {
        reject(new ApiError('Invalid upload response', xhr.status));
      }
    };

    xhr.send(formData);
  });
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  return requestJson<AdminDashboardStats>('/api/admin/dashboard');
}

export async function fetchAccountDashboard(): Promise<AccountDashboardStats> {
  return requestJson<AccountDashboardStats>('/api/account/dashboard');
}
