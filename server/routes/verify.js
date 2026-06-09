import { Router } from "express";
import { verifyDocument, verifySearch } from "../controllers/verifyController.js";

const router = Router();

router.get("/search", verifySearch);
router.get("/:type/:id", verifyDocument);

export default router;
