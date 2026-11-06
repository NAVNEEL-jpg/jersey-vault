import { API_BASE } from './config/api.js';

export function getStoredAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.includes('auth-token') || key.startsWith('sb-')) {
        try {
          const item = localStorage.getItem(key);
          if (!item) continue;
          const parsed = JSON.parse(item);
          const token = parsed?.access_token || parsed?.currentSession?.access_token;
          if (token && typeof token === 'string' && token.split('.').length === 3) {
            return token;
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  return null;
}

class ExpressQueryBuilder {
  constructor(table) {
    this.table = table;
    this.params = new URLSearchParams();
    this.action = 'select'; // 'select' | 'insert' | 'update' | 'delete'
    this.bodyPayload = null;
    this.isSingle = false;
  }

  select(columns = '*') {
    this.action = 'select';
    this.params.set('select', columns);
    return this;
  }

  eq(column, value) {
    this.params.set(column, `eq.${value}`);
    return this;
  }

  neq(column, value) {
    this.params.set(column, `neq.${value}`);
    return this;
  }

  in(column, values) {
    const list = Array.isArray(values) ? values.join(',') : String(values);
    this.params.set(column, `in.(${list})`);
    return this;
  }

  ilike(column, pattern) {
    this.params.set(column, `ilike.${pattern}`);
    return this;
  }

  order(column, options = {}) {
    const dir = options.ascending === false ? 'desc' : 'asc';
    this.params.set('order', `${column}.${dir}`);
    return this;
  }

  limit(count) {
    this.params.set('limit', String(count));
    return this;
  }

  single() {
    this.isSingle = true;
    this.params.set('single', 'true');
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    this.params.set('single', 'true');
    return this;
  }

  insert(values) {
    this.action = 'insert';
    this.bodyPayload = values;
    return this;
  }

  update(values) {
    this.action = 'update';
    this.bodyPayload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  // Make the builder directly awaitable (just like supabase.from(...))
  async then(resolve, reject) {
    try {
      const url = `${API_BASE}/api/db/${this.table}?${this.params.toString()}`;
      let method = 'GET';
      let body = undefined;
      const headers = { 'Content-Type': 'application/json' };

      // Attach Supabase auth token if available (admin authorization for navneeldutta@gmail.com)
      const token = getStoredAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (this.action === 'insert') {
        method = 'POST';
        body = JSON.stringify(this.bodyPayload);
      } else if (this.action === 'update') {
        method = 'PATCH';
        body = JSON.stringify(this.bodyPayload);
      } else if (this.action === 'delete') {
        method = 'DELETE';
      }

      const res = await fetch(url, { method, headers, body });
      const json = await res.json().catch(() => ({ data: null, error: { message: res.statusText } }));

      if (!res.ok) {
        const result = { data: null, error: json.error || { message: `Request failed with status ${res.status}` } };
        return resolve(result);
      }

      const result = { data: json.data, error: json.error || null };
      return resolve(result);
    } catch (err) {
      const errorResult = { data: null, error: { message: err.message } };
      return resolve(errorResult);
    }
  }
}

export const express = {
  // Database operations (backed by Cloudflare R2 via Express backend)
  from(table) {
    return new ExpressQueryBuilder(table);
  },

  // Media storage operations (backed by Cloudflare R2 bucket via Express backend)
  storage: {
    from(bucket) {
      return {
        async upload(fileName, file, explicitToken = null) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileName', fileName);

            const headers = {};
            const token = explicitToken || getStoredAuthToken();
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE}/api/db/storage/${encodeURIComponent(bucket)}/upload`, {
              method: 'POST',
              headers,
              body: formData,
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              const msg = err.error?.message || err.message || `Upload failed with status ${res.status}`;
              return { data: null, error: { message: msg } };
            }

            const json = await res.json();
            return { data: json.data, error: null };
          } catch (err) {
            return { data: null, error: { message: err.message || 'Upload failed' } };
          }
        },

        getPublicUrl(filePath) {
          const publicDomain = 'https://pub-d7ef29e16fdd45ccb2e5e07e3e81b251.r2.dev';
          const cleanBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
          const cleanPath = filePath.replace(/^\/+/, '');
          return {
            data: {
              publicUrl: `${publicDomain}/${cleanBucket}/${cleanPath}`
            }
          };
        }
      };
    }
  },

  // Admin endpoints wrapped cleanly
  admin: {
    async getStats(token) {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },

    async getSettings(token) {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },

    async updateSettings(settings, token) {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      return res.json();
    },

    async getUsers(token, page = 1, search = '', limit = 50) {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search?.trim()) params.set('search', search.trim());
      const res = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },

    async deleteUser(userId, token) {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },

    async getOrders(token) {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      return Array.isArray(data) ? data : [];
    },

    async getEdgeLimits(token) {
      const res = await fetch(`${API_BASE}/api/admin/edge-limits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },

    async updateOrderStatus(orderId, status, token) {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      return res.json();
    }
  }
};

// Aliases for compatibility
export const cloudflare = express;
export default express;
