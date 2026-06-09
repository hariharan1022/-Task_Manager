import { Router } from "express";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { Certificate } from "../models/Certificate.js";
import { buildCertificatePayload } from "../utils/buildCertificatePayload.js";
import { ensureCertificateForApplication } from "../utils/issueCertificate.js";

const router = Router();

router.get("/verify/:certId", async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certId,
    })
      .populate(
        "student",
        "fullName college department graduationYear profilePhoto"
      )
      .populate({
        path: "application",
        populate: { path: "internship", select: "title domain duration" },
      });
    if (!cert) {
      return res
        .status(404)
        .json({ valid: false, message: "Certificate not found" });
    }
    const certificate = buildCertificatePayload(
      cert,
      cert.student,
      cert.application,
      cert.application?.internship
    );
    certificate.pdfURL = cert.pdfURL || "";
    res.json({ valid: true, certificate });
  } catch (err) {
    next(err);
  }
});

router.get("/:certId/download", async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certId,
    });
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    if (cert.application) {
      await ensureCertificateForApplication(cert.application).catch(() => null);
    }
    const refreshed = await Certificate.findOne({
      certificateId: req.params.certId,
    });
    const filePath = refreshed?.pdfPath || cert.pdfPath;
    if (!filePath || !fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ message: "Certificate PDF is not available yet" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
