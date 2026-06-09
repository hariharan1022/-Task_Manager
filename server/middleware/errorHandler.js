export function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  if (err.code && err.code.startsWith("PGRST")) {
    if (err.code === "PGRST301") {
      return res.status(503).json({ message: "Database not connected" });
    }
    if (err.code === "PGRST116") {
      return res.status(404).json({ message: "Resource not found" });
    }
    if (err.code === "23505") {
      return res.status(409).json({ message: "Duplicate value" });
    }
    if (err.code === "22P02" || err.code === "23502") {
      return res.status(400).json({ message: "Invalid data format" });
    }
  }
  if (err.code === 23505) {
    return res.status(409).json({ message: "Duplicate value" });
  }
  if (err.message && err.message.includes("duplicate key")) {
    return res.status(409).json({ message: "Duplicate value" });
  }
  if (err.message && err.message.includes("violates foreign key")) {
    return res.status(400).json({ message: "Referenced resource not found" });
  }
  if (err.message && err.message.includes("violates not-null")) {
    return res.status(400).json({ message: "Required field is missing" });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}
