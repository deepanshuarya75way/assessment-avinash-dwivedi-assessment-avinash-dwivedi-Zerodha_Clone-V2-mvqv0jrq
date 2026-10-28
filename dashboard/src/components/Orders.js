import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import "./Orders.css";

const API = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";
let owner = "guest";
try { owner = JSON.parse(localStorage.getItem("zerodhaUser")).email || "guest"; } catch {}

const KEYS = ["status", "mode", "product", "symbol", "minPrice", "maxPrice", "minQty",
  "maxQty", "minValue", "maxValue", "from", "to", "sortBy", "sortOrder", "limit"];
const COLUMNS = [["Time", "executedAt"], ["Type"], ["Instrument", "name"], ["Product"],
  ["Qty.", "qty"], ["Price", "price"], ["Value", "value"], ["Status"]];
const NUMBERS = [["minPrice", "Min price"], ["maxPrice", "Max price"], ["minQty", "Min qty"],
  ["maxQty", "Max qty"], ["minValue", "Min value"], ["maxValue", "Max value"]];
const SELECTS = {
  status: ["COMPLETE", "PENDING", "CANCELLED", "REJECTED"],
  mode: ["BUY", "SELL"],
  product: ["CNC", "MIS", "NRML"],
};

const Orders = () => {
  const [sp, setSp] = useSearchParams();
  const params = Object.fromEntries(sp); // the URL is the single source of truth
  const [draft, setDraft] = useState(params);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [views, setViews] = useState([]);
  const key = sp.toString();

  const loadViews = () =>
    axios.get(`${API}/views`, { params: { owner } }).then((r) => setViews(r.data));
  useEffect(() => { loadViews().catch(() => {}); }, []);

  useEffect(() => {
    setDraft(params);
    const { view, ...query } = params;
    axios.get(`${API}/orders/search`, { params: query })
      .then((r) => { setData(r.data); setError(""); })
      .catch((e) => { setData(null); setError(e.response?.data?.message || "Could not load orders"); });
  }, [key]);

  // Update the URL; any change resets to page 1 unless a page is given.
  const go = (changes, page) => {
    const next = { ...params, ...changes, page };
    Object.keys(next).forEach((k) => (next[k] === undefined || next[k] === "") && delete next[k]);
    setSp(next);
  };

  const sortBy = params.sortBy || "executedAt";
  const sortOrder = params.sortOrder || "desc";
  const sort = (col) =>
    go({ sortBy: col, sortOrder: col === sortBy && sortOrder === "desc" ? "asc" : "desc" });

  // ----- saved views -----
  const current = () => Object.fromEntries(KEYS.filter((k) => params[k]).map((k) => [k, params[k]]));
  const active = views.find((v) => v._id === params.view);
  const viewCall = async (fn) => {
    try { await fn(); await loadViews(); } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };
  const saveNew = () => {
    const name = window.prompt("Name for this view");
    if (name) viewCall(async () => {
      const r = await axios.post(`${API}/views`, { owner, name, query: current() });
      setSp({ ...params, view: r.data._id });
    });
  };
  const rename = () => {
    const name = window.prompt("New name", active.name);
    if (name) viewCall(() => axios.put(`${API}/views/${active._id}`, { owner, name }));
  };
  const update = () =>
    viewCall(() => axios.put(`${API}/views/${active._id}`, { owner, query: current() }));
  const remove = () =>
    window.confirm(`Delete "${active.name}"?`) &&
    viewCall(async () => {
      await axios.delete(`${API}/views/${active._id}`, { params: { owner } });
      const { view, ...rest } = params;
      setSp(rest);
    });
  const applyView = (id) => {
    const v = views.find((x) => x._id === id);
    setSp(v ? { ...v.query, view: v._id } : {});
  };

  return (
    <div className="ox">
      <h3 className="title">Orders {data && `(${data.total})`}</h3>

      <div className="ox-bar">
        <select value={active?._id || ""} onChange={(e) => applyView(e.target.value)}>
          <option value="">Saved views…</option>
          {views.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
        <button onClick={saveNew}>Save as view</button>
        {active && <button onClick={update}>Update</button>}
        {active && <button onClick={rename}>Rename</button>}
        {active && <button onClick={remove}>Delete</button>}
      </div>

      <form className="ox-bar" onSubmit={(e) => { e.preventDefault(); go(draft); }}>
        <input placeholder="Symbol" value={draft.symbol || ""}
          onChange={(e) => setDraft({ ...draft, symbol: e.target.value })} />
        {Object.entries(SELECTS).map(([k, opts]) => (
          <select key={k} value={draft[k] || ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}>
            <option value="">{k}: all</option>
            {opts.map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        {NUMBERS.map(([k, label]) => (
          <input key={k} type="number" min="0" placeholder={label} value={draft[k] || ""}
            onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
        ))}
        <input type="date" value={draft.from || ""} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        <input type="date" value={draft.to || ""} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        <button type="submit">Apply</button>
        <button type="button" onClick={() => setSp({})}>Clear</button>
      </form>

      {error && <p className="ox-err">{error}</p>}

      {data && data.total === 0 && (
        <div className="ox-empty">
          No orders match these filters. Try widening the ranges or clearing a filter.
        </div>
      )}

      {data && data.total > 0 && (
        <>
          <table>
            <thead>
              <tr>
                {COLUMNS.map(([label, col]) => (
                  <th key={label} onClick={col ? () => sort(col) : undefined}>
                    {label}{col === sortBy ? (sortOrder === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id}>
                  <td>{new Date(o.executedAt).toLocaleString("en-IN")}</td>
                  <td className={o.mode}>{o.mode}</td>
                  <td>{o.name}</td>
                  <td>{o.product}</td>
                  <td>{o.qty}</td>
                  <td>{o.price?.toFixed(2)}</td>
                  <td>{o.value?.toFixed(2)}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ox-bar">
            <button disabled={data.page <= 1} onClick={() => go({}, data.page - 1)}>Prev</button>
            <span> Page {data.page} of {data.totalPages} </span>
            <button disabled={data.page >= data.totalPages} onClick={() => go({}, data.page + 1)}>Next</button>
            <select value={data.limit} onChange={(e) => go({ limit: e.target.value })}>
              {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;