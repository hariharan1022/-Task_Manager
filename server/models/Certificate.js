import { createModel } from "../config/modelFactory.js";

const Certificate = createModel("certificates", {
  _id: "id",
  id: "id",
  student: "student_id",
  application: "application_id",
  certificateId: "certificate_id",
  pdfURL: "pdf_url",
  pdfPath: "pdf_path",
  issuedAt: "issued_at",
  linkedInPostUrl: "linkedin_post_url",
  score: "score",
  grade: "grade",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Certificate };
