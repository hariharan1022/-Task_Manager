import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import http from "node:http";
import https from "node:https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../../client/public");

// ---------- Palette ----------
const C = {
  bgTop: "#070f22",
  bgBot: "#102a4f",
  bgGlow: "#1a3a6b",
  navy: "#0a1a36",
  navyPanel: "#0d2147",
  navyPanelEdge: "#1a3361",
  gold: "#d4a017",
  goldLight: "#f0c84b",
  goldDark: "#9c7a0c",
  goldSoft: "#e8c766",
  ivory: "#f6f1e3",
  white: "#ffffff",
  text: "#ecf2ff",
  textMuted: "#9fb0c8",
  textDim: "#6b7d99",
  trackDim: "#1c3358",
  merit: "#7c3aed",
  elite: "#d4a017",
  certified: "#5eead4",
};

function gradeTier(percentage, grade) {
  if (percentage >= 90) return { label: "ELITE", accent: C.elite, soft: "#fde68a" };
  if (percentage >= 75) return { label: "MERIT", accent: C.merit, soft: "#ddd6fe" };
  return { label: "CERTIFIED", accent: C.certified, soft: "#ccfbf1" };
}

function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function safeImage(p) {
  try { if (p && fs.existsSync(p)) return p; } catch {}
  return null;
}

function tryFetchRemoteImage(url) {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//i.test(url)) return resolve(null);
    const lib = url.startsWith("https") ? https : http;
    let req;
    try {
      req = lib.get(url, { timeout: 4000 }, (res) => {
        if (res.statusCode !== 200) { res.resume(); return resolve(null); }
        const chunks = []; res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      });
    } catch { return resolve(null); }
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function resolvePhoto(profilePhoto) {
  if (!profilePhoto) return null;
  const local = safeImage(profilePhoto);
  if (local) return fs.readFileSync(local);
  return await tryFetchRemoteImage(profilePhoto);
}

function initialsOf(name) {
  return (name || "INTERN")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------- Drawing helpers ----------
function drawBackground(doc, pageW, pageH) {
  // Deep navy diagonal gradient
  const bg = doc.linearGradient(0, 0, pageW, pageH);
  bg.stop(0, C.bgTop).stop(1, C.bgBot);
  doc.rect(0, 0, pageW, pageH).fill(bg);

  // Soft gold radial highlight from top-center
  const glow = doc.radialGradient(pageW / 2, -80, 60, pageW / 2, -80, 520);
  glow.stop(0, "#d4a01755").stop(0.6, "#d4a01710").stop(1, "#d4a01700");
  doc.rect(0, 0, pageW, pageH).fill(glow);

  // Subtle bottom vignette
  const vg = doc.radialGradient(pageW / 2, pageH + 60, 40, pageW / 2, pageH + 60, 420);
  vg.stop(0, "#00000055").stop(1, "#00000000");
  doc.rect(0, 0, pageW, pageH).fill(vg);
}

function drawNetworkPattern(doc, pageW, pageH) {
  // Faint constellation/network: nodes + connecting lines
  doc.save();
  doc.opacity(0.10);
  // Deterministic-ish positions
  const nodes = [
    [70, 80], [160, 50], [250, 110], [120, 200], [60, 320],
    [180, 380], [80, 480], [220, 520], [340, 80], [430, 140],
    [520, 60], [600, 130], [690, 70], [760, 180], [700, 300],
    [780, 380], [740, 470], [620, 520], [520, 470], [410, 510],
    [330, 440], [380, 340], [470, 280], [560, 350], [650, 250],
    [510, 190], [600, 420], [350, 250], [440, 90], [290, 320],
  ];
  const edges = [
    [0,1],[1,2],[0,3],[3,4],[4,5],[5,6],[6,7],[2,8],[8,9],[9,10],
    [10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],
    [18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],
    [26,27],[27,28],[28,29],[29,2],[8,29],[14,24],[16,18],[11,25],
  ];
  doc.strokeColor(C.gold).lineWidth(0.4);
  for (const [a, b] of edges) {
    const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  }
  doc.fillColor(C.gold);
  for (const [x, y] of nodes) doc.circle(x, y, 1.2).fill();
  doc.restore();
}

function drawHexagon(doc, cx, cy, r) {
  doc.save();
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 6; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath();
  doc.restore();
  return pts;
}

function drawCornerAccents(doc, pageW, pageH) {
  const m = 24;
  const len = 42;
  const off = 8;
  doc.save();
  doc.strokeColor(C.gold).lineWidth(1.2);
  // Top-left
  doc.moveTo(m, m + len).lineTo(m, m).lineTo(m + len, m).stroke();
  // Top-right
  doc.moveTo(pageW - m - len, m).lineTo(pageW - m, m).lineTo(pageW - m, m + len).stroke();
  // Bottom-left
  doc.moveTo(m, pageH - m - len).lineTo(m, pageH - m).lineTo(m + len, pageH - m).stroke();
  // Bottom-right
  doc.moveTo(pageW - m - len, pageH - m).lineTo(pageW - m, pageH - m).lineTo(pageW - m, pageH - m - len).stroke();

  // Small diamond accents at inner corners
  const d = 4;
  doc.fillColor(C.gold);
  const diamonds = [
    [m + 2, m + 2], [pageW - m - 2, m + 2],
    [m + 2, pageH - m - 2], [pageW - m - 2, pageH - m - 2],
  ];
  for (const [x, y] of diamonds) {
    doc.moveTo(x, y - d).lineTo(x + d, y).lineTo(x, y + d).lineTo(x - d, y).closePath().fill();
  }
  doc.restore();
}

function drawBorderFrame(doc, pageW, pageH) {
  doc.save();
  // Outer thin gold line
  doc.strokeColor(C.gold).lineWidth(0.8).opacity(0.85);
  doc.rect(34, 34, pageW - 68, pageH - 68).stroke();
  // Inner very thin ivory line
  doc.strokeColor(C.ivory).lineWidth(0.4).opacity(0.35);
  doc.rect(40, 40, pageW - 80, pageH - 80).stroke();
  doc.restore();
}

function drawStar(doc, cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  doc.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < 10; i++) doc.lineTo(pts[i][0], pts[i][1]);
  doc.closePath();
}

function drawMedallion(doc, cx, cy) {
  doc.save();
  // Outer dark ring
  doc.lineWidth(3).strokeColor(C.goldDark).circle(cx, cy, 34).stroke();
  doc.lineWidth(1).strokeColor(C.gold).circle(cx, cy, 30).stroke();
  // Filled disc
  const disc = doc.radialGradient(cx - 6, cy - 8, 4, cx, cy, 30);
  disc.stop(0, "#fde68a").stop(0.5, C.gold).stop(1, C.goldDark);
  doc.circle(cx, cy, 28).fill(disc);
  doc.lineWidth(0.8).strokeColor(C.goldDark).circle(cx, cy, 28).stroke();
  // Star
  doc.fillColor("#3a2400");
  drawStar(doc, cx, cy, 16, 6.5);
  doc.fill();
  // Ribbon tails below
  doc.fillColor(C.gold);
  doc.moveTo(cx - 14, cy + 26).lineTo(cx - 8, cy + 26).lineTo(cx - 10, cy + 46).lineTo(cx - 16, cy + 42).closePath().fill();
  doc.moveTo(cx + 14, cy + 26).lineTo(cx + 8, cy + 26).lineTo(cx + 10, cy + 46).lineTo(cx + 16, cy + 42).closePath().fill();
  doc.moveTo(cx - 10, cy + 42).lineTo(cx, cy + 36).lineTo(cx + 10, cy + 42).lineTo(cx, cy + 50).closePath().fill();
  doc.restore();
}

function drawGradeHexagon(doc, cx, cy, r, label, accent) {
  doc.save();
  // Outer glow ring
  const pts = drawHexagon(doc, cx, cy, r + 3);
  doc.fillOpacity(0.25).fillColor(accent).fill();
  doc.fillOpacity(1);
  // Solid hex
  drawHexagon(doc, cx, cy, r);
  doc.fillColor(C.navy).fill();
  doc.lineWidth(1.4).strokeColor(accent).stroke();
  // Inner thin hex
  drawHexagon(doc, cx, cy, r - 5);
  doc.lineWidth(0.5).strokeColor(accent).opacity(0.6).stroke();
  doc.opacity(1);
  // Text
  doc.fillColor(accent).font("Helvetica-Bold").fontSize(r > 28 ? 11 : 9);
  doc.text(label, cx - r, cy - r * 0.45, { width: r * 2, align: "center" });
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(6);
  doc.text("CLASS", cx - r, cy + r * 0.15, { width: r * 2, align: "center" });
  doc.restore();
}

function drawAvatar(doc, cx, cy, r, photoBuf, name) {
  doc.save();
  // Gold ring
  doc.lineWidth(2.5).strokeColor(C.gold).circle(cx, cy, r).stroke();
  doc.lineWidth(0.8).strokeColor(C.ivory).opacity(0.4).circle(cx, cy, r - 3).stroke();
  doc.opacity(1);
  // Clip circle for photo
  doc.circle(cx, cy, r - 2).clip();
  if (photoBuf) {
    try { doc.image(photoBuf, cx - r, cy - r, { width: r * 2, height: r * 2, cover: [r * 2, r * 2] }); }
    catch { drawAvatarInitials(doc, cx, cy, r, name); }
  } else {
    drawAvatarInitials(doc, cx, cy, r, name);
  }
  doc.restore();
}

function drawAvatarInitials(doc, cx, cy, r, name) {
  const g = doc.linearGradient(cx - r, cy - r, cx + r, cy + r);
  g.stop(0, C.navyPanel).stop(1, C.bgGlow);
  doc.rect(cx - r, cy - r, r * 2, r * 2).fill(g);
  doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(r * 0.7);
  doc.text(initialsOf(name), cx - r, cy - r * 0.3, { width: r * 2, align: "center" });
}

function drawFlourish(doc, cx, y, w) {
  doc.save();
  doc.strokeColor(C.gold).lineWidth(0.8);
  const half = w / 2;
  doc.moveTo(cx - half, y).lineTo(cx - 8, y).stroke();
  doc.moveTo(cx + 8, y).lineTo(cx + half, y).stroke();
  // Center diamond
  doc.fillColor(C.gold);
  doc.moveTo(cx, y - 4).lineTo(cx + 4, y).lineTo(cx, y + 4).lineTo(cx - 4, y).closePath().fill();
  // End dots
  doc.circle(cx - half, y, 1.6).fill();
  doc.circle(cx + half, y, 1.6).fill();
  doc.restore();
}

function drawScoreRing(doc, cx, cy, r, pct) {
  doc.save();
  // Track
  doc.lineWidth(7).strokeColor(C.trackDim).circle(cx, cy, r).stroke();
  // Progress arc
  const start = -Math.PI / 2;
  const end = start + (Math.max(0, Math.min(100, pct)) / 100) * Math.PI * 2;
  doc.lineWidth(7).strokeColor(C.gold).lineCap("round");
  const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
  doc.moveTo(sx, sy).arc(cx, cy, r, start, end).stroke();
  doc.lineCap("butt");
  // Inner subtle ring
  doc.lineWidth(0.5).strokeColor(C.gold).opacity(0.35).circle(cx, cy, r - 6).stroke();
  doc.opacity(1);
  doc.restore();
}

function drawPanel(doc, x, y, w, h) {
  doc.save();
  const g = doc.linearGradient(x, y, x, y + h);
  g.stop(0, C.navyPanel).stop(1, C.navy);
  doc.roundedRect(x, y, w, h, 10).fill(g);
  doc.lineWidth(0.8).strokeColor(C.navyPanelEdge).roundedRect(x, y, w, h, 10).stroke();
  // Top accent line
  doc.strokeColor(C.gold).lineWidth(0.6).opacity(0.6);
  doc.moveTo(x + 12, y + 1).lineTo(x + w - 12, y + 1).stroke();
  doc.opacity(1);
  doc.restore();
}

function drawDetailChip(doc, x, y, w, h, label, value) {
  doc.save();
  doc.lineWidth(0.5).strokeColor(C.navyPanelEdge);
  doc.roundedRect(x, y, w, h, 6).fillAndStroke("#0b1d3d", C.navyPanelEdge);
  doc.fillColor(C.textMuted).font("Helvetica-Bold").fontSize(6.5);
  doc.text(String(label).toUpperCase(), x + 8, y + 6, { width: w - 16, align: "left", characterSpacing: 1 });
  doc.fillColor(C.text).font("Helvetica-Bold").fontSize(9.5);
  doc.text(String(value || "—"), x + 8, y + 17, { width: w - 16, align: "left", ellipsis: true });
  doc.restore();
}

function drawQrPlaceholder(doc, x, y, size) {
  doc.save();
  doc.roundedRect(x, y, size, size, 3).fillAndStroke("#0b1d3d", C.gold);
  const n = 7;
  const cell = (size - 10) / n;
  doc.fillColor(C.gold);
  // Random-looking deterministic pattern
  const seed = [
    1,0,1,1,0,0,1,
    0,1,0,0,1,1,0,
    1,1,0,1,0,1,1,
    0,0,1,1,1,0,1,
    1,0,1,0,1,1,0,
    0,1,1,0,0,1,1,
    1,1,0,1,1,0,1,
  ];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (seed[r * n + c]) doc.rect(x + 5 + c * cell, y + 5 + r * cell, cell - 0.6, cell - 0.6).fill();
  }
  // Corner finders
  const corners = [[0,0],[n-3,0],[0,n-3]];
  for (const [cr, cc] of corners) {
    doc.roundedRect(x + 5 + cc * cell, y + 5 + cr * cell, cell * 3, cell * 3, 1.5).fillAndStroke(C.gold, C.gold);
    doc.roundedRect(x + 5 + (cc+0.5) * cell, y + 5 + (cr+0.5) * cell, cell * 2, cell * 2, 1).fill("#0b1d3d");
  }
  doc.restore();
}

async function drawRealQR(doc, x, y, size, url) {
  if (!url) {
    drawQrPlaceholder(doc, x, y, size);
    return;
  }
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: Math.round(size * 4), margin: 1, color: { dark: "#0a1a36", light: "#ffffff" } });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buf = Buffer.from(base64, "base64");
    doc.image(buf, x, y, { width: size, height: size });
  } catch {
    drawQrPlaceholder(doc, x, y, size);
  }
}

// ---------- Main builder ----------
export async function buildCertificatePDF(payload) {
  const {
    studentName = "INTERN",
    college = "",
    degree = "",
    year = null,
    program = "",
    domain = "",
    duration = "",
    percentage = 0,
    grade = "Good",
    issuedAt,
    internId = "",
    profilePhoto = "",
    company = {},
  } = payload;

  const tier = gradeTier(percentage, grade);
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const pageW = doc.page.width;
  const pageH = doc.page.height;

  // --- Background layers ---
  drawBackground(doc, pageW, pageH);
  drawNetworkPattern(doc, pageW, pageH);
  drawBorderFrame(doc, pageW, pageH);
  drawCornerAccents(doc, pageW, pageH);

  // --- Top composition ---
  const photoBuf = await resolvePhoto(profilePhoto);

  // Left: Grade hexagon badge
  drawGradeHexagon(doc, 78, 86, 30, tier.label, tier.accent);

  // Center: Medallion
  drawMedallion(doc, pageW / 2, 88);

  // Right: Avatar (circular photo)
  drawAvatar(doc, pageW - 78, 86, 30, photoBuf, studentName);

  // --- Wordmark + title ---
  doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(8);
  doc.text((company.name || "SKYROVIX").toUpperCase(), 0, 138, {
    width: pageW, align: "center", characterSpacing: 4,
  });

  doc.fillColor(C.text).font("Times-Bold").fontSize(30);
  doc.text("Certificate of Completion", 0, 152, {
    width: pageW, align: "center", characterSpacing: 1,
  });

  doc.fillColor(C.textMuted).font("Helvetica-Oblique").fontSize(9);
  doc.text("Internship Achievement Award", 0, 188, { width: pageW, align: "center" });

  // Decorative flourish
  drawFlourish(doc, pageW / 2, 208, 220);

  // --- "Presented to" + Name (hero) ---
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(9);
  doc.text("This certificate is proudly presented to", 0, 222, { width: pageW, align: "center" });

  doc.fillColor(C.goldLight).font("Times-Bold").fontSize(34);
  doc.text(studentName.toUpperCase(), 30, 238, {
    width: pageW - 60, align: "center", characterSpacing: 2,
  });

  drawFlourish(doc, pageW / 2, 288, 260);

  // --- Program line ---
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(9);
  doc.text("for the successful completion of the", 0, 298, { width: pageW, align: "center" });

  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(16);
  doc.text(program || "Internship Program", 40, 312, { width: pageW - 80, align: "center" });
  if (domain) {
    doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(9);
    doc.text(domain.toUpperCase(), 40, 332, { width: pageW - 80, align: "center", characterSpacing: 2 });
  }

  // --- Score panel ---
  const panelY = 360;
  const panelH = 110;
  const panelX = 60;
  const panelW = pageW - 120;
  drawPanel(doc, panelX, panelY, panelW, panelH);

  // Left side of panel: progress ring
  const ringCx = panelX + 60;
  const ringCy = panelY + panelH / 2;
  drawScoreRing(doc, ringCx, ringCy, 30, percentage);
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(20);
  doc.text(String(Math.round(percentage)), ringCx - 30, ringCy - 13, { width: 60, align: "center" });
  doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(8);
  doc.text("PERCENT", ringCx - 30, ringCy + 9, { width: 60, align: "center", characterSpacing: 1.5 });

  // Divider
  doc.save();
  doc.strokeColor(C.navyPanelEdge).lineWidth(0.5);
  doc.moveTo(ringCx + 48, panelY + 22).lineTo(ringCx + 48, panelY + panelH - 22).stroke();
  doc.restore();

  // Right side of panel: details
  const rightX = ringCx + 64;
  const rightW = panelX + panelW - rightX - 20;

  // Grade pill
  doc.save();
  doc.fillColor(tier.accent).opacity(0.15);
  doc.roundedRect(rightX, panelY + 20, 78, 20, 10).fill();
  doc.opacity(1);
  doc.lineWidth(0.8).strokeColor(tier.accent).roundedRect(rightX, panelY + 20, 78, 20, 10).stroke();
  doc.fillColor(tier.soft).font("Helvetica-Bold").fontSize(9);
  doc.text(tier.label, rightX, panelY + 24, { width: 78, align: "center", characterSpacing: 1.5 });
  doc.restore();

  // Metric labels
  const mY = panelY + 50;
  doc.fillColor(C.textMuted).font("Helvetica-Bold").fontSize(7);
  doc.text("MENTOR-REVIEWED PROJECTS", rightX, mY, { width: rightW / 2, characterSpacing: 1.2 });
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(11);
  doc.text(`${percentage}/100`, rightX, mY + 10);

  doc.fillColor(C.textMuted).font("Helvetica-Bold").fontSize(7);
  doc.text("PROGRAM GRADE", rightX + rightW / 2, mY, { width: rightW / 2, characterSpacing: 1.2 });
  doc.fillColor(C.white).font("Helvetica-Bold").fontSize(11);
  doc.text(grade || "—", rightX + rightW / 2, mY + 10);

  // Sub-line
  doc.fillColor(C.textDim).font("Helvetica-Oblique").fontSize(8);
  doc.text(
    `Awarded for consistent performance, on-time submissions, and quality of work.`,
    rightX, mY + 30, { width: rightW }
  );

  // --- Details strip (chips) ---
  const chipY = panelY + panelH + 14;
  const chipH = 34;
  const gap = 10;
  const chips = [
    ["COLLEGE", college],
    ["DEPARTMENT", degree],
    ["GRADUATION", year ? `Class of ${year}` : "—"],
    ["INTERN ID", internId],
  ];
  const chipTotalW = panelW - gap * (chips.length - 1);
  const chipW = chipTotalW / chips.length;
  chips.forEach((c, i) => {
    drawDetailChip(doc, panelX + i * (chipW + gap), chipY, chipW, chipH, c[0], c[1]);
  });

  // --- Bottom row: signature | date | verify ---
  const bottomY = chipY + chipH + 22;

  // Left: signature block
  const sigPath = safeImage(path.join(PUBLIC_DIR, "founder-signature.png"));
  const sigX = panelX;
  if (sigPath) {
    try { doc.image(sigPath, sigX, bottomY - 14, { width: 110, height: 28 }); } catch {}
  } else {
    doc.save();
    doc.strokeColor(C.gold).lineWidth(0.7);
    doc.moveTo(sigX, bottomY + 12).lineTo(sigX + 120, bottomY + 12).stroke();
    doc.restore();
  }
  doc.fillColor(C.text).font("Helvetica-Bold").fontSize(9);
  doc.text(company.founderName || "Hariharan S", sigX, bottomY + 18);
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(7.5);
  doc.text(`${company.founderTitle || "Founder & CEO"} · ${company.name || "SKYROVIX"}`, sigX, bottomY + 30);

  // Center: issue date
  const centerX = pageW / 2 - 60;
  doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(8);
  doc.text("ISSUED ON", centerX, bottomY - 6, { width: 120, align: "center", characterSpacing: 1.5 });
  doc.fillColor(C.text).font("Times-Bold").fontSize(11);
  doc.text(formatDate(issuedAt), centerX, bottomY + 6, { width: 120, align: "center" });
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(7.5);
  doc.text(duration || "Internship program", centerX, bottomY + 20, { width: 120, align: "center" });

  // Right: QR + verify
  const qrSize = 46;
  const qrX = pageW - panelX - qrSize;
  const verifyUrl = `${(company.website || "").replace(/\/$/, "")}/verify?q=${encodeURIComponent(payload.id || payload.certificateId || "")}`;
  await drawRealQR(doc, qrX, bottomY - 12, qrSize, verifyUrl);
  doc.fillColor(C.textMuted).font("Helvetica-Bold").fontSize(6.5);
  doc.text("SCAN TO VERIFY", qrX - 30, bottomY + qrSize - 8, { width: qrSize + 30, align: "right", characterSpacing: 1.2 });
  doc.fillColor(C.textDim).font("Helvetica").fontSize(6.5);
  const vShort = verifyUrl.replace(/^https?:\/\//, "");
  doc.text(vShort, panelX + 160, bottomY + qrSize - 8, { width: qrX - 30 - panelX - 160, align: "right" });

  // --- Footer bar ---
  const footerY = pageH - 52;
  doc.save();
  // Thin gold rule
  doc.strokeColor(C.gold).lineWidth(0.5).opacity(0.5);
  doc.moveTo(panelX, footerY - 6).lineTo(panelX + panelW, footerY - 6).stroke();
  doc.opacity(1);
  doc.fillColor(C.gold).font("Courier-Bold").fontSize(7);
  doc.text(`CERT ID  ${payload.id || payload.certificateId || ""}`, panelX, footerY);
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(7);
  doc.text(verifyUrl, 0, footerY + 11, { width: pageW, align: "center" });
  doc.restore();

  // --- Join Our Community ---
  const comm = (company.community || {});
  const commY = footerY + 28;
  doc.save();
  doc.fillColor(C.gold).font("Helvetica-Bold").fontSize(7);
  doc.text("JOIN OUR COMMUNITY", 0, commY, { width: pageW, align: "center", characterSpacing: 1.5 });
  doc.fillColor(C.textMuted).font("Helvetica").fontSize(6.5);
  const commParts = [];
  if (comm.linkedin) commParts.push(`LinkedIn  ${comm.linkedin}`);
  if (comm.instagram) commParts.push(`Insta  ${comm.instagram}`);
  if (comm.telegram) commParts.push(`Telegram  ${comm.telegram}`);
  if (comm.whatsapp) commParts.push(`WhatsApp  ${comm.whatsapp}`);
  doc.text(commParts.join("   |   "), 0, commY + 11, { width: pageW, align: "center" });
  doc.restore();

  doc.end();
  return doc;
}

export async function generateCertificatePDF(payload) {
  const doc = await buildCertificatePDF(payload);
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function writeCertificatePDF(payload, outDir) {
  const buffer = await generateCertificatePDF(payload);
  fs.mkdirSync(outDir, { recursive: true });
  const rawId = payload.certificateId || payload.id || "certificate";
  const safeId = String(rawId).replace(/[^a-z0-9_-]/gi, "_");
  const filePath = path.join(outDir, `${safeId}.pdf`);
  fs.writeFileSync(filePath, buffer);
  return { filePath, fileName: `${safeId}.pdf`, buffer };
}
