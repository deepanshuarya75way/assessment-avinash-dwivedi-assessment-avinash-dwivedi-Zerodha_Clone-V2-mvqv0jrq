const express = require("express");
const mongoose = require("mongoose");

const { OrdersModel } = require("../model/OrdersModel");
const { SavedViewModel } = require("../model/SavedViewModel");
const {
  parseOrderQuery,
  STATUSES,
  PRODUCTS,
  SORT_FIELDS,
  PAGE_SIZES,
} = require("../utils/orderQuery");

const router = express.Router();

const MAX_VIEWS_PER_OWNER = 25;

const normalizeOwner = (raw) => {
  const owner = String(raw || "guest").trim().toLowerCase();
  return owner.length > 0 && owner.length <= 100 ? owner : null;
};

const validateName = (raw) => {
  const name = String(raw || "").trim();
  if (!name) return { error: "Give the view a name." };
  if (name.length > 40) return { error: "View names can be at most 40 characters." };
  return { name };
};

const viewJson = (v) => ({
  _id: v._id,
  name: v.name,
  query: v.query || {},
  createdAt: v.createdAt,
  updatedAt: v.updatedAt,
});

// ---------- Order book explorer ----------

router.get("/orders/meta", (req, res) => {
  res.json({
    statuses: STATUSES,
    products: PRODUCTS,
    sortFields: SORT_FIELDS,
    pageSizes: PAGE_SIZES,
  });
});

router.get("/orders/search", async (req, res) => {
  try {
    const { errors, filter, sort, page, limit, normalized } = parseOrderQuery(req.query);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const total = await OrdersModel.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const appliedPage = Math.min(page, totalPages);

    const orders = await OrdersModel.find(filter)
      .sort(sort)
      .skip((appliedPage - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      orders,
      total,
      page: appliedPage,
      limit,
      totalPages,
      appliedFilters: normalized,
    });
  } catch (error) {
    console.error("Order search error:", error);
    return res.status(500).json({ message: "Could not load orders" });
  }
});


router.get("/views", async (req, res) => {
  try {
    const owner = normalizeOwner(req.query.owner);
    if (!owner) return res.status(400).json({ message: "Invalid owner" });

    const views = await SavedViewModel.find({ owner })
      .collation({ locale: "en", strength: 2 })
      .sort({ name: 1 })
      .lean();
    return res.json(views.map(viewJson));
  } catch (error) {
    console.error("List views error:", error);
    return res.status(500).json({ message: "Could not load saved views" });
  }
});

router.post("/views", async (req, res) => {
  try {
    const owner = normalizeOwner(req.body.owner);
    if (!owner) return res.status(400).json({ message: "Invalid owner" });

    const { name, error } = validateName(req.body.name);
    if (error) return res.status(400).json({ message: error });

    const { errors, normalized } = parseOrderQuery(req.body.query || {});
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    if ((await SavedViewModel.countDocuments({ owner })) >= MAX_VIEWS_PER_OWNER) {
      return res.status(400).json({
        message: `You can save up to ${MAX_VIEWS_PER_OWNER} views. Delete one first.`,
      });
    }

    const view = await new SavedViewModel({ owner, name, query: normalized }).save();
    return res.status(201).json(viewJson(view));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You already have a view with that name." });
    }
    console.error("Create view error:", error);
    return res.status(500).json({ message: "Could not save the view" });
  }
});

router.put("/views/:id", async (req, res) => {
  try {
    const owner = normalizeOwner(req.body.owner);
    if (!owner) return res.status(400).json({ message: "Invalid owner" });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "View not found" });
    }

    const update = {};
    if (req.body.name !== undefined) {
      const { name, error } = validateName(req.body.name);
      if (error) return res.status(400).json({ message: error });
      update.name = name;
    }
    if (req.body.query !== undefined) {
      const { errors, normalized } = parseOrderQuery(req.body.query || {});
      if (errors.length) return res.status(400).json({ message: errors[0], errors });
      update.query = normalized;
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const view = await SavedViewModel.findOneAndUpdate(
      { _id: req.params.id, owner },
      { $set: update },
      { new: true }
    );
    if (!view) return res.status(404).json({ message: "View not found" });
    return res.json(viewJson(view));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You already have a view with that name." });
    }
    console.error("Update view error:", error);
    return res.status(500).json({ message: "Could not update the view" });
  }
});

router.delete("/views/:id", async (req, res) => {
  try {
    const owner = normalizeOwner(req.query.owner);
    if (!owner) return res.status(400).json({ message: "Invalid owner" });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "View not found" });
    }

    const result = await SavedViewModel.deleteOne({ _id: req.params.id, owner });
    if (!result.deletedCount) return res.status(404).json({ message: "View not found" });
    return res.json({ message: "View deleted" });
  } catch (error) {
    console.error("Delete view error:", error);
    return res.status(500).json({ message: "Could not delete the view" });
  }
});

module.exports = router;