import { createModel } from "../config/modelFactory.js";

const IDCard = createModel("id_cards", {
  _id: "id",
  id: "id",
  student: "student_id",
  application: "application_id",
  internId: "intern_id",
  pdfURL: "pdf_url",
  validFrom: "valid_from",
  validUntil: "valid_until",
  issuedAt: "issued_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { IDCard };
