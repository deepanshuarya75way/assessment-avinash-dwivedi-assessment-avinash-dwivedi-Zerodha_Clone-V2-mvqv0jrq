export const STATUSES = ["COMPLETE", "PENDING", "CANCELLED", "REJECTED"];
export const PRODUCTS = ["CNC", "MIS", "NRML"];
export const MODES = ["BUY", "SELL"];
export const PAGE_SIZES = [5, 10, 20, 50, 100];

export const FILTER_KEYS = [
  "status",
  "mode",
  "product",
  "symbol",
  "minPrice",
  "maxPrice",
  "minQty",
  "maxQty",
  "minValue",
  "maxValue",
  "from",
  "to",
];

export const VIEW_KEYS = [...FILTER_KEYS, "sortBy", "sortOrder", "limit"];

export const DEFAULT_SORT = { sortBy: "executedAt", sortOrder: "desc" };
export const DEFAULT_LIMIT = "10";

const splitList = (v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

export const draftFromParams = (params) => ({
  status: splitList(params.status),
  mode: splitList(params.mode)[0] || "",
  product: splitList(params.product),
  symbol: params.symbol || "",
  minPrice: params.minPrice || "",
  maxPrice: params.maxPrice || "",
  minQty: params.minQty || "",
  maxQty: params.maxQty || "",
  minValue: params.minValue || "",
  maxValue: params.maxValue || "",
  from: params.from || "",
  to: params.to || "",
});

export const paramsFromDraft = (draft) => {
  const out = {};
  if (draft.status.length) out.status = draft.status.join(",");
  if (draft.mode) out.mode = draft.mode;
  if (draft.product.length) out.product = draft.product.join(",");
  ["symbol", "minPrice", "maxPrice", "minQty", "maxQty", "minValue", "maxValue", "from", "to"].forEach(
    (k) => {
      const v = String(draft[k] ?? "").trim();
      if (v) out[k] = v;
    }
  );
  return out;
};

const num = (v) => (String(v).trim() === "" ? null : Number(v));

export const validateDraft = (d) => {
  const errors = [];
  const ranges = [
    ["price", "minPrice", "maxPrice", false],
    ["quantity", "minQty", "maxQty", true],
    ["trade value", "minValue", "maxValue", false],
  ];
  for (const [label, minKey, maxKey, whole] of ranges) {
    const min = num(d[minKey]);
    const max = num(d[maxKey]);
    let ok = true;
    for (const [value, which] of [[min, "Minimum"], [max, "Maximum"]]) {
      if (value === null) continue;
      if (!Number.isFinite(value) || value < 0) {
        errors.push(`${which} ${label} must be a number that is 0 or more.`);
        ok = false;
      } else if (whole && !Number.isInteger(value)) {
        errors.push(`${which} ${label} must be a whole number.`);
        ok = false;
      }
    }
    if (ok && min !== null && max !== null && min > max) {
      errors.push(`Minimum ${label} cannot be greater than the maximum.`);
    }
  }
  if (d.from && d.to && d.from > d.to) errors.push("From date cannot be after the To date.");
  if (d.symbol.trim().length > 30) errors.push("Symbol search must be 30 characters or fewer.");
  return errors;
};

export const countActiveFilters = (params) =>
  FILTER_KEYS.filter((k) => params[k]).length;

export const stableKey = (obj) =>
  JSON.stringify(Object.keys(obj || {}).sort().map((k) => [k, obj[k]]));