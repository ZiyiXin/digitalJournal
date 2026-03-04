import type {Space} from '../types';

type JsonOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function requestJson<T>(path: string, options: JsonOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
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
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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
    throw new Error(message);
  }

  const payload = (await response.json()) as {url: string};
  return payload.url;
}
