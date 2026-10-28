const STATUSES = ["COMPLETE", "PENDING", "CANCELLED", "REJECTED"];
const MODES = ["BUY", "SELL"];
const PRODUCTS = ["CNC", "MIS", "NRML"];
const SORT_FIELDS = ["executedAt", "price", "qty", "value", "name"];
const PAGE_SIZES = [5, 10, 20, 50, 100];

const DEFAULT_SORT_BY = "executedAt";
const DEFAULT_SORT_ORDER = "desc";
const DEFAULT_LIMIT = 10;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const asString = (value) => {
  if (Array.isArray(value)) return value.join(",");
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const parseEnumList = (raw, allowed, label, errors) => {
  const text = asString(raw);
  if (!text) return [];
  const values = [...new Set(text.split(",").map((v) => v.trim().toUpperCase()).filter(Boolean))];
  const bad = values.filter((v) => !allowed.includes(v));
  if (bad.length) {
    errors.push(`Unknown ${label} "${bad.join(", ")}". Use: ${allowed.join(", ")}.`);
    return [];
  }
  return allowed.filter((v) => values.includes(v));
};

const parseNumber = (raw, label, errors) => {
  const text = asString(raw);
  if (!text) return undefined;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) {
    errors.push(`${label} must be a number that is 0 or more.`);
    return undefined;
  }
  return n;
};

const parseDay = (raw, label, errors) => {
  const text = asString(raw);
  if (!text) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) {
    const [, y, m, d] = match.map(Number);
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (
      probe.getUTCFullYear() === y &&
      probe.getUTCMonth() === m - 1 &&
      probe.getUTCDate() === d
    ) {
      return Date.UTC(y, m - 1, d) - IST_OFFSET_MS; // start of that IST day
    }
  }
  errors.push(`${label} must be a valid date in YYYY-MM-DD format.`);
  return undefined;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseOrderQuery = (input = {}) => {
  const errors = [];
  const normalized = {};
  const filter = {};

  const status = parseEnumList(input.status, STATUSES, "status", errors);
  if (status.length) {
    normalized.status = status.join(",");
    filter.status = { $in: status };
  }

  const mode = parseEnumList(input.mode, MODES, "transaction type", errors);
  if (mode.length) {
    normalized.mode = mode.join(",");
    filter.mode = { $in: mode };
  }

  const product = parseEnumList(input.product, PRODUCTS, "product", errors);
  if (product.length) {
    normalized.product = product.join(",");
    filter.product = { $in: product };
  }

  const symbol = asString(input.symbol);
  if (symbol) {
    if (symbol.length > 30) {
      errors.push("Symbol search must be 30 characters or fewer.");
    } else {
      normalized.symbol = symbol;
      filter.name = { $regex: escapeRegex(symbol), $options: "i" };
    }
  }

  const ranges = [
    ["Price", "minPrice", "maxPrice", "price"],
    ["Quantity", "minQty", "maxQty", "qty"],
    ["Trade value", "minValue", "maxValue", "value"],
  ];
  for (const [label, minKey, maxKey, field] of ranges) {
    const min = parseNumber(input[minKey], `Minimum ${label.toLowerCase()}`, errors);
    const max = parseNumber(input[maxKey], `Maximum ${label.toLowerCase()}`, errors);
    if (field === "qty") {
      if (min !== undefined && !Number.isInteger(min)) errors.push("Minimum quantity must be a whole number.");
      if (max !== undefined && !Number.isInteger(max)) errors.push("Maximum quantity must be a whole number.");
    }
    if (min !== undefined && max !== undefined && min > max) {
      errors.push(`Minimum ${label.toLowerCase()} cannot be greater than the maximum.`);
      continue;
    }
    if (min !== undefined) {
      normalized[minKey] = String(min);
      filter[field] = { ...(filter[field] || {}), $gte: min };
    }
    if (max !== undefined) {
      normalized[maxKey] = String(max);
      filter[field] = { ...(filter[field] || {}), $lte: max };
    }
  }

  const fromStart = parseDay(input.from, "From date", errors);
  const toStart = parseDay(input.to, "To date", errors);
  if (fromStart !== undefined && toStart !== undefined && fromStart > toStart) {
    errors.push("From date cannot be after the To date.");
  } else {
    if (fromStart !== undefined) {
      normalized.from = asString(input.from);
      filter.executedAt = { ...(filter.executedAt || {}), $gte: new Date(fromStart) };
    }
    if (toStart !== undefined) {
      normalized.to = asString(input.to);
      filter.executedAt = { ...(filter.executedAt || {}), $lte: new Date(toStart + DAY_MS - 1) };
    }
  }

  let sortBy = DEFAULT_SORT_BY;
  const sortByRaw = asString(input.sortBy);
  if (sortByRaw) {
    if (SORT_FIELDS.includes(sortByRaw)) sortBy = sortByRaw;
    else errors.push(`Cannot sort by "${sortByRaw}". Use: ${SORT_FIELDS.join(", ")}.`);
  }
  let sortOrder = DEFAULT_SORT_ORDER;
  const sortOrderRaw = asString(input.sortOrder).toLowerCase();
  if (sortOrderRaw) {
    if (["asc", "desc"].includes(sortOrderRaw)) sortOrder = sortOrderRaw;
    else errors.push('Sort order must be "asc" or "desc".');
  }
  if (sortBy !== DEFAULT_SORT_BY) normalized.sortBy = sortBy;
  if (sortOrder !== DEFAULT_SORT_ORDER) normalized.sortOrder = sortOrder;

  let limit = DEFAULT_LIMIT;
  const limitRaw = asString(input.limit);
  if (limitRaw) {
    const n = Number(limitRaw);
    if (PAGE_SIZES.includes(n)) limit = n;
    else errors.push(`Page size must be one of ${PAGE_SIZES.join(", ")}.`);
  }
  if (limit !== DEFAULT_LIMIT) normalized.limit = String(limit);

  let page = 1;
  const pageRaw = asString(input.page);
  if (pageRaw) {
    const n = Number(pageRaw);
    if (Number.isInteger(n) && n >= 1) page = n;
    else errors.push("Page must be a whole number 1 or above.");
  }

  const dir = sortOrder === "asc" ? 1 : -1;
  const sort = { [sortBy]: dir, _id: dir }; 

  return { errors, filter, sort, page, limit, normalized };
};

module.exports = {
  parseOrderQuery,
  STATUSES,
  MODES,
  PRODUCTS,
  SORT_FIELDS,
  PAGE_SIZES,
};