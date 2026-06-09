import { Router } from "express";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/profile", authRequired, async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
});

router.put("/profile", authRequired, async (req, res, next) => {
  try {
    const allowed = [
      "fullName",
      "phone",
      "college",
      "department",
      "graduationYear",
      "linkedinProfile",
      "githubUrl",
      "portfolioUrl",
      "skills",
      "profilePhoto",
      "resumeUrl",
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.delete("/account", authRequired, async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
