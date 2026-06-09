import crypto from "crypto";

const YEAR = () => new Date().getFullYear();

export function generateCertificateId() {
  return `CERT-${YEAR()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function generateInternId() {
  return `INT-${YEAR()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export function generateInternNumber() {
  return `INTERN-${YEAR()}-${String(crypto.randomInt(0, 99999)).padStart(5, "0")}`;
}
