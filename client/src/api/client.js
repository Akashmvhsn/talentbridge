const BASE = import.meta.env.VITE_API_URL || '/api';

export const tokenStore = {
  get: () => localStorage.getItem('tb_token'),
  set: (t) => localStorage.setItem('tb_token', t),
  clear: () => localStorage.removeItem('tb_token'),
};

async function request(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData; // browser sets the multipart boundary itself
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, b) => request(p, { method: 'POST', body: b || {} }),
  upload: (p, formData) => request(p, { method: 'POST', body: formData }),
  put: (p, b) => request(p, { method: 'PUT', body: b }),
  del: (p) => request(p, { method: 'DELETE' }),
};
