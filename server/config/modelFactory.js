import supabase from "./supabase.js";

class QueryBuilder {
  constructor(tableName, fieldMap, reverseMap, filter = {}) {
    this._table = tableName;
    this._fieldMap = fieldMap;
    this._reverseMap = reverseMap;
    this._filter = { ...filter };
    this._select = "*";
    this._sort = {};
    this._limitVal = null;
    this._offsetVal = null;
    this._populates = [];
  }

  select(fields) {
    if (fields && typeof fields === "string") {
      this._select = fields;
    }
    return this;
  }

  sort(sortObj) {
    if (sortObj) this._sort = { ...this._sort, ...sortObj };
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  skip(n) {
    this._offsetVal = n;
    return this;
  }

  lean() {
    return this;
  }

  populate(path, select, opts) {
    this._populates.push({ path, select, ...(opts || {}) });
    return this;
  }

  _toDBField(field) {
    return this._fieldMap[field] || field;
  }

  _fromDB(obj) {
    if (!obj) return obj;
    const result = {};
    for (const [dbKey, value] of Object.entries(obj)) {
      const jsKey = this._reverseMap[dbKey];
      const targetKey = jsKey !== undefined ? jsKey : dbKey;
      result[targetKey] = value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Date)
        ? this._fromDB(value)
        : value;
    }
    if (result.id && !result._id) result._id = result.id;
    if (result._id && !result.id) result.id = result._id;
    return result;
  }

  _fromDBList(arr) {
    return (arr || []).map((d) => this._fromDB(d));
  }

  _buildSelectWithJoins() {
    if (this._select !== "*") return this._select;

    const joins = [];
    for (const pop of this._populates) {
      const field = this._toDBField(pop.path);
      const refField = `${field}:${field}_id`;
      const nested = [];
      if (pop.select) {
        const fields = pop.select.split(" ").filter(Boolean);
        for (const f of fields) {
          const clean = f.replace(/^[+-]/, "");
          nested.push(this._toDBField(clean));
        }
      }
      // Handle nested populate (populate within populate)
      if (pop.populate) {
        const nestedPop = pop.populate;
        const nestedField = this._toDBField(nestedPop.path);
        const nestedRef = `${nestedField}:${nestedField}_id`;
        if (nestedPop.select) {
          const nf = nestedPop.select.split(" ").filter(Boolean);
          const nestedSelects = nf.map((f) => this._toDBField(f.replace(/^[+-]/, ""))).join(",");
          joins.push(`${refField}(${nestedRef}(${nestedSelects}),${nested.map((f) => f).join(",")})`);
          continue;
        }
      }
      if (nested.length) {
        joins.push(`${refField}(${nested.join(",")})`);
      } else {
        joins.push(refField);
      }
    }

    if (joins.length) {
      return `*,${joins.join(",")}`;
    }
    return "*";
  }

  async exec() {
    const selectStr = this._buildSelectWithJoins();
    let query = supabase.from(this._table).select(selectStr);

    // Apply filters with $or support
    const filters = this._filter;
    for (const [key, value] of Object.entries(filters)) {
      if (!value && value !== false && value !== 0) continue;
      const dbKey = this._toDBField(key);
      if (dbKey === "_id" || key === "_id") {
        query = query.eq("id", value);
      } else if (key === "$or" && Array.isArray(value)) {
        const orParts = [];
        for (const cond of value) {
          for (const [k, v] of Object.entries(cond)) {
            const dk = this._toDBField(k);
            if (v && typeof v === "object" && "$regex" in v) {
              orParts.push(`${dk}.ilike.%${String(v.$regex)}%`);
            } else if (v && typeof v === "object" && "$in" in v) {
              const arr = v.$in.map((x) => String(x).replace(/,/g, "\\,")).join(",");
              orParts.push(`${dk}.in.(${arr})`);
            } else {
              orParts.push(`${dk}.eq.${String(v)}`);
            }
          }
        }
        if (orParts.length) query = query.or(orParts.join(","));
      } else if (value && typeof value === "object") {
        if ("$gte" in value) query = query.gte(dbKey, value.$gte);
        if ("$lte" in value) query = query.lte(dbKey, value.$lte);
        if ("$in" in value) {
          if (value.$in.length) query = query.in(dbKey, value.$in);
        }
        if ("$ne" in value) query = query.neq(dbKey, value.$ne);
        if ("$regex" in value) {
          query = query.ilike(dbKey, `%${String(value.$regex)}%`);
        }
      } else {
        query = query.eq(dbKey, value);
      }
    }

    // Apply sort
    for (const [field, dir] of Object.entries(this._sort)) {
      const dbKey = this._toDBField(field);
      query = query.order(dbKey, { ascending: dir === 1 || dir === "asc" });
    }

    // Apply limit/offset
    if (this._limitVal) query = query.limit(this._limitVal);
    if (this._offsetVal) query = query.range(this._offsetVal || 0, (this._offsetVal || 0) + (this._limitVal || 1000) - 1);

    const { data, error } = await query;
    if (error) throw error;
    if (this._single) {
      if (!data || (Array.isArray(data) && data.length === 0)) return null;
      const item = Array.isArray(data) ? data[0] : data;
      return item ? this._fromDB(item) : null;
    }
    return this._fromDBList(data);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }

  finally(fn) {
    return this.exec().finally(fn);
  }
}

export function createModel(tableName, fieldMap) {
  const reverseMap = {};
  for (const [k, v] of Object.entries(fieldMap)) reverseMap[v] = k;

  function toDB(obj) {
    if (!obj) return obj;
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "select") continue;
      const dbKey = fieldMap[key] || key;
      if (key === "_id") continue;
      result[dbKey] = value;
    }
    return result;
  }

  function fromDB(obj) {
    if (!obj) return obj;
    const result = {};
    for (const [dbKey, value] of Object.entries(obj)) {
      const jsKey = reverseMap[dbKey];
      result[jsKey || dbKey] = value;
    }
    if (result.id && !result._id) result._id = result.id;
    if (result._id && !result.id) result.id = result._id;
    return result;
  }

  function fromDBList(arr) {
    return (arr || []).map(fromDB);
  }

  function buildFilterQuery(supabaseQuery, filter) {
    if (!filter) return supabaseQuery;
    for (const [key, value] of Object.entries(filter)) {
      if (!value && value !== false && value !== 0) continue;
      const dbKey = fieldMap[key] || key;
      if (dbKey === "_id" || key === "_id") {
        supabaseQuery = supabaseQuery.eq("id", value);
      } else if (key === "$or" && Array.isArray(value)) {
        const orParts = [];
        for (const cond of value) {
          for (const [k, v] of Object.entries(cond)) {
            const dk = fieldMap[k] || k;
            if (v && typeof v === "object" && "$regex" in v) {
              orParts.push(`${dk}.ilike.%${String(v.$regex)}%`);
            } else if (v && typeof v === "object" && "$in" in v) {
              const arr = v.$in.map((x) => String(x)).join(",");
              orParts.push(`${dk}.in.(${arr})`);
            } else {
              orParts.push(`${dk}.eq.${String(v)}`);
            }
          }
        }
        if (orParts.length) supabaseQuery = supabaseQuery.or(orParts.join(","));
      } else if (value && typeof value === "object") {
        if ("$gte" in value) supabaseQuery = supabaseQuery.gte(dbKey, value.$gte);
        if ("$lte" in value) supabaseQuery = supabaseQuery.lte(dbKey, value.$lte);
        if ("$in" in value && value.$in.length) supabaseQuery = supabaseQuery.in(dbKey, value.$in);
        if ("$ne" in value) supabaseQuery = supabaseQuery.neq(dbKey, value.$ne);
        if ("$regex" in value) {
          supabaseQuery = supabaseQuery.ilike(dbKey, `%${String(value.$regex).replace(/%/g, "%25")}%`);
        }
      } else {
        supabaseQuery = supabaseQuery.eq(dbKey, value);
      }
    }
    return supabaseQuery;
  }

  const model = {
    find(filter = {}) {
      return new QueryBuilder(tableName, fieldMap, reverseMap, filter);
    },

    findById(id) {
      const qb = new QueryBuilder(tableName, fieldMap, reverseMap, { _id: id });
      qb._single = true;
      return qb;
    },

    findOne(filter) {
      const qb = new QueryBuilder(tableName, fieldMap, reverseMap, filter);
      qb._single = true;
      return qb;
    },

    async countDocuments(filter = {}) {
      let query = supabase.from(tableName).select("*", { count: "exact", head: true });
      query = buildFilterQuery(query, filter);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },

    async create(data) {
      const dbData = toDB(data);
      delete dbData.id;
      const { data: result, error } = await supabase.from(tableName).insert(dbData).select().single();
      if (error) throw error;
      return fromDB(result);
    },

    _resolveOperators(data) {
      if (!data || typeof data !== "object") return data;
      const hasSet = "$set" in data;
      const merged = {};
      for (const [k, v] of Object.entries(data)) {
        if (k === "$set") Object.assign(merged, v);
        else if (k !== "$setOnInsert" && k !== "$inc") merged[k] = v;
      }
      return merged;
    },

    async findByIdAndUpdate(id, data, options = {}) {
      const resolved = this._resolveOperators(data);
      const dbData = toDB(resolved);
      delete dbData.id;
      let query = supabase.from(tableName).update(dbData).eq("id", id);
      if (options.new !== false) query = query.select().single();
      const { data: result, error } = await query;
      if (error) throw error;
      return result ? fromDB(result) : null;
    },

    async findOneAndUpdate(filter, data, options = {}) {
      const mergedFilter = {};
      for (const [k, v] of Object.entries(filter)) {
        if (k === "$set" || k === "$setOnInsert" || k === "$inc") continue;
        mergedFilter[k] = v;
      }
      const existing = await this.findOne(mergedFilter);
      if (!existing) {
        if (options.upsert) {
          const resolved = this._resolveOperators(data);
          const createData = { ...mergedFilter, ...resolved };
          if (data.$setOnInsert) {
            for (const [k, v] of Object.entries(data.$setOnInsert)) {
              if (!(k in createData)) createData[k] = v;
            }
          }
          return this.create(createData);
        }
        return null;
      }
      return this.findByIdAndUpdate(existing.id, data, options);
    },

    async findByIdAndDelete(id) {
      const { data, error } = await supabase.from(tableName).delete().eq("id", id).select().single();
      if (error) return null;
      return data ? fromDB(data) : null;
    },

    async deleteMany(filter = {}) {
      let query = supabase.from(tableName).delete();
      query = buildFilterQuery(query, filter);
      const { error } = await query;
      if (error) throw error;
    },

    async updateMany(filter, data) {
      let query = supabase.from(tableName).update(toDB(data));
      query = buildFilterQuery(query, filter);
      const { error } = await query;
      if (error) throw error;
    },

    async distinct(field, filter = {}) {
      const dbKey = fieldMap[field] || field;
      let query = supabase.from(tableName).select(dbKey);
      query = buildFilterQuery(query, filter);
      const { data, error } = await query;
      if (error) throw error;
      return [...new Set((data || []).map((r) => r[dbKey]).filter(Boolean))];
    },

    async insertMany(items) {
      const dbItems = items.map((i) => {
        const d = toDB(i);
        delete d.id;
        return d;
      });
      const { data, error } = await supabase.from(tableName).insert(dbItems).select();
      if (error) throw error;
      return fromDBList(data);
    },

    async aggregate(pipeline) {
      let data = await this.find({});
      const jsData = Array.isArray(data) ? data : [];
      for (const stage of pipeline) {
        if (stage.$group) {
          const grouped = {};
          const { _id, ...aggs } = stage.$group;
          for (const doc of jsData) {
            let key;
            if (_id === null) key = "_all";
            else if (typeof _id === "string") key = doc[_id.replace("$", "")];
            else {
              key = Object.entries(_id)
                .map(([k, v]) => `${k}:${doc[typeof v === "string" ? v.replace("$", "") : v]}`)
                .join("|");
            }
            if (!grouped[key]) grouped[key] = {};
            for (const [aggField, aggExpr] of Object.entries(aggs)) {
              if (!grouped[key][aggField]) grouped[key][aggField] = 0;
              if (aggExpr.$sum === 1) grouped[key][aggField] += 1;
              else grouped[key][aggField] += doc[aggExpr.$sum.replace("$", "")] || 1;
            }
          }
          data = Object.entries(grouped).map(([k, v]) => ({ _id: k, ...v }));
        }
        if (stage.$bucket) {
          const field = (stage.$bucket.groupBy || "").replace("$", "");
          const boundaries = stage.$bucket.boundaries || [];
          const output = stage.$bucket.output || {};
          data = boundaries.slice(0, -1).map((min, i) => {
            const max = boundaries[i + 1];
            const count = jsData.filter((d) => {
              const val = Number(d[field]) || 0;
              return val >= min && val < max;
            }).length;
            const entry = { _id: `${min}-${max}` };
            for (const k of Object.keys(output)) entry[k] = count;
            return entry;
          });
        }
        if (stage.$match) {
          data = jsData.filter((d) => {
            return Object.entries(stage.$match).every(([k, v]) => {
              if (v && typeof v === "object" && "$gte" in v) return d[k] >= v.$gte;
              if (v && typeof v === "object" && "$lte" in v) return d[k] <= v.$lte;
              return d[k] === v;
            });
          });
        }
        if (stage.$sort) {
          const [field, dir] = Object.entries(stage.$sort)[0];
          data.sort((a, b) => (dir === -1 ? -1 : 1) * (String(a[field] || "").localeCompare(String(b[field] || ""))));
        }
        if (stage.$limit) data = data.slice(0, stage.$limit);
      }
      return data;
    },
  };

  return model;
}
