import { Router } from "express";
import { publicStats } from "../controllers/statsController.js";

const router = Router();

router.get("/public", publicStats);

export default router;
