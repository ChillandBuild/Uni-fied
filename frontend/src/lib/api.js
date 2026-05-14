const BASE = '/api/v1';

async function handleResponse(r) {
  if (r.ok) {
    if (r.status === 204) return null;
    return r.json();
  }
  let msg = r.statusText;
  try { const t = await r.text(); if (t) msg = t; } catch {}
  throw new Error(msg);
}

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`).then(handleResponse),
  post: (path, body) =>
    fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  put: (path, body) =>
    fetch(`${BASE}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  patch: (path, body = {}) =>
    fetch(`${BASE}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(handleResponse),
  delete: (path) =>
    fetch(`${BASE}${path}`, { method: 'DELETE' }).then(handleResponse),
};

export async function fetchApi(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return handleResponse(res);
}
