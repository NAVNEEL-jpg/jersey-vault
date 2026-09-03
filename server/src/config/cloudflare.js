import {
  getR2Table,
  updateR2Table,
  createProductInR2,
  updateProductInR2,
  deleteProductInR2,
  createTeamInR2,
  updateTeamInR2,
  deleteTeamInR2,
  uploadFileToR2,
} from '../services/r2Service.js';

class ServerCloudflareQueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderField = null;
    this.orderAsc = true;
    this.limitCount = null;
    this.selectedColumns = '*';
    this.isSingle = false;
    this.action = 'select';
    this.payload = null;
  }

  select(columns = '*') {
    this.action = 'select';
    this.selectedColumns = columns;
    return this;
  }

  eq(column, value) {
    this.filters.push(item => String(item[column]) === String(value));
    return this;
  }

  neq(column, value) {
    this.filters.push(item => String(item[column]) !== String(value));
    return this;
  }

  in(column, values) {
    const list = Array.isArray(values) ? values.map(String) : [String(values)];
    this.filters.push(item => list.includes(String(item[column])));
    return this;
  }

  ilike(column, pattern) {
    const clean = String(pattern).replace(/%/g, '').toLowerCase();
    this.filters.push(item => String(item[column] || '').toLowerCase().includes(clean));
    return this;
  }

  order(column, options = {}) {
    this.orderField = column;
    this.orderAsc = options.ascending !== false;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  insert(values) {
    this.action = 'insert';
    this.payload = values;
    return this;
  }

  update(values) {
    this.action = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  async then(resolve, reject) {
    try {
      if (this.action === 'insert') {
        const item = Array.isArray(this.payload) ? this.payload[0] : this.payload;
        let created = null;
        if (this.table === 'products') created = await createProductInR2(item);
        else if (this.table === 'teams') created = await createTeamInR2(item);
        else {
          const all = await getR2Table(this.table);
          created = { ...item, id: item.id || Date.now().toString() };
          await updateR2Table(this.table, [created, ...all]);
        }
        return resolve({ data: created, error: null });
      }

      let items = await getR2Table(this.table);

      // Apply filters
      for (const fn of this.filters) {
        items = items.filter(fn);
      }

      if (this.orderField) {
        items.sort((a, b) => {
          const valA = a[this.orderField] ?? '';
          const valB = b[this.orderField] ?? '';
          if (typeof valA === 'number' && typeof valB === 'number') {
            return this.orderAsc ? valA - valB : valB - valA;
          }
          return this.orderAsc
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        });
      }

      if (this.limitCount && this.limitCount > 0) {
        items = items.slice(0, this.limitCount);
      }

      if (this.selectedColumns !== '*') {
        const cols = this.selectedColumns.split(',').map(c => c.trim());
        items = items.map(item => {
          const res = {};
          cols.forEach(c => {
            if (c in item) res[c] = item[c];
          });
          return res;
        });
      }

      if (this.isSingle) {
        return resolve({
          data: items[0] || null,
          error: items[0] ? null : { message: 'Row not found', code: 'PGRST116' }
        });
      }

      return resolve({ data: items, error: null });
    } catch (err) {
      return resolve({ data: null, error: { message: err.message } });
    }
  }
}

export const cloudflare = {
  from(tableName) {
    return new ServerCloudflareQueryBuilder(tableName);
  },

  storage: {
    from(bucket) {
      return {
        async upload(filePath, buffer, options = {}) {
          try {
            const publicUrl = await uploadFileToR2(buffer, `${bucket}/${filePath}`, options.contentType || 'image/jpeg');
            return { data: { path: `${bucket}/${filePath}`, publicUrl }, error: null };
          } catch (err) {
            return { data: null, error: { message: err.message } };
          }
        },

        getPublicUrl(filePath) {
          const publicDomain = process.env.R2_PUBLIC_URL || 'https://pub-d7ef29e16fdd45ccb2e5e07e3e81b251.r2.dev';
          return { data: { publicUrl: `${publicDomain}/${bucket}/${filePath}` } };
        }
      };
    }
  }
};

export default cloudflare;
