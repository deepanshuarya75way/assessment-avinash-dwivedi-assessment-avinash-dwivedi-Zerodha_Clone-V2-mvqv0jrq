import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { stableKey } from "./ordersParams";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";

export const getOwner = () => {
  try {
    const user = JSON.parse(localStorage.getItem("zerodhaUser") || "null");
    return (user && (user.email || user._id)) || "guest";
  } catch {
    return "guest";
  }
};

const SavedViews = ({ currentQuery, activeViewId, onApplyView, onSelectView }) => {
  const owner = useMemo(getOwner, []);
  const [views, setViews] = useState([]);
  const [mode, setMode] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadViews = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/views`, { params: { owner } });
      setViews(res.data);
    } catch {
      setError("Could not load your saved views.");
    }
  }, [owner]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const active = views.find((v) => v._id === activeViewId) || null;
  const modified =
    active && currentQuery && stableKey(currentQuery) !== stableKey(active.query);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const openForm = (m) => {
    setMode(m);
    setName(m === "rename" && active ? active.name : "");
    setError("");
  };

  const closeForm = () => {
    setMode(null);
    setName("");
  };

  const submitName = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the view a name.");
      return;
    }
    run(async () => {
      if (mode === "save") {
        const res = await axios.post(`${BACKEND_URL}/views`, {
          owner,
          name: trimmed,
          query: currentQuery,
        });
        setViews((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        onSelectView(res.data._id);
      } else {
        const res = await axios.put(`${BACKEND_URL}/views/${active._id}`, {
          owner,
          name: trimmed,
        });
        setViews((prev) =>
          prev.map((v) => (v._id === res.data._id ? res.data : v)).sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      closeForm();
    });
  };

  const updateView = () =>
    run(async () => {
      const res = await axios.put(`${BACKEND_URL}/views/${active._id}`, {
        owner,
        query: currentQuery,
      });
      setViews((prev) => prev.map((v) => (v._id === res.data._id ? res.data : v)));
    });

  const deleteView = () => {
    if (!window.confirm(`Delete the view "${active.name}"?`)) return;
    run(async () => {
      await axios.delete(`${BACKEND_URL}/views/${active._id}`, { params: { owner } });
      setViews((prev) => prev.filter((v) => v._id !== active._id));
      onSelectView(null);
    });
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    closeForm();
    setError("");
    if (!id) onSelectView(null);
    else onApplyView(views.find((v) => v._id === id));
  };

  return (
    <div className="ox-views">
      <label className="ox-views-label" htmlFor="saved-view-select">
        Saved views
      </label>
      <select
        id="saved-view-select"
        value={active ? active._id : ""}
        onChange={handleSelect}
        disabled={busy}
      >
        <option value="">{views.length ? "— Custom (unsaved) —" : "No saved views yet"}</option>
        {views.map((v) => (
          <option key={v._id} value={v._id}>
            {v.name}
          </option>
        ))}
      </select>
      {modified && <span className="ox-modified">modified</span>}

      <div className="ox-views-actions">
        <button
          type="button"
          className="ox-btn"
          onClick={() => openForm("save")}
          disabled={busy || !currentQuery}
        >
          Save as new view
        </button>
        {active && (
          <>
            <button type="button" className="ox-btn" onClick={updateView} disabled={busy || !modified}>
              Update view
            </button>
            <button type="button" className="ox-btn" onClick={() => openForm("rename")} disabled={busy}>
              Rename
            </button>
            <button type="button" className="ox-btn ox-btn-danger" onClick={deleteView} disabled={busy}>
              Delete
            </button>
          </>
        )}
      </div>

      {mode && (
        <form className="ox-views-form" onSubmit={submitName}>
          <input
            type="text"
            value={name}
            maxLength={40}
            autoFocus
            placeholder={mode === "save" ? "Name for this view" : "New name"}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="ox-btn ox-btn-primary" disabled={busy}>
            {mode === "save" ? "Save" : "Rename"}
          </button>
          <button type="button" className="ox-btn" onClick={closeForm} disabled={busy}>
            Cancel
          </button>
        </form>
      )}

      {error && (
        <p className="ox-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default SavedViews;