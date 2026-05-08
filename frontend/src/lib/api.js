const BASE = '/api/v1';

export const api = {
  get: (path) => fetch(`${BASE}${path}`).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  post: (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw r.text().then(t => { throw new Error(t); }); return r.json(); }),
  put: (path, body) => fetch(`${BASE}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  patch: (path, body = {}) => fetch(`${BASE}${path}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  delete: (path) => fetch(`${BASE}${path}`, { method: 'DELETE' }).then(r => { if (!r.ok) throw new Error(r.statusText); if (r.status === 204) return null; return r.json(); }),
};

export async function fetchApi(path, options = {}) {
  const { raw, method = 'GET', body, headers = {} } = options;
  const opts = { method, headers: { "Content-Type": "application/json", ...headers } };
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (raw) return res;
  if (!res.ok) {
     const t = await res.text();
     throw new Error(t || res.statusText);
  }
  return res.json();
}
