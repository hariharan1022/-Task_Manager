import { createModel } from "../config/modelFactory.js";

const CertificatePayment = createModel("certificate_payments", {
  _id: "id",
  id: "id",
  student: "student_id",
  application: "application_id",
  certificateId: "certificate_id",
  studentName: "student_name",
  email: "email",
  programName: "program_name",
  amount: "amount",
  transactionId: "transaction_id",
  screenshotUrl: "screenshot_url",
  status: "status",
  rejectionReason: "rejection_reason",
  approvedAt: "approved_at",
  approvedBy: "approved_by",
  submittedAt: "submitted_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { CertificatePayment };