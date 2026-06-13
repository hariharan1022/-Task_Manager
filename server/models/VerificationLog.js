import { createModel } from "../config/modelFactory.js";

const VerificationLog = createModel("verification_logs", {
  _id: "id",
  id: "id",
  paymentId: "payment_id",
  applicationId: "application_id",
  studentId: "student_id",
  certificateId: "certificate_id",
  action: "action",
  performedBy: "performed_by",
  details: "details",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { VerificationLog };
