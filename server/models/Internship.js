import { createModel } from "../config/modelFactory.js";

const InternshipProgram = createModel("internship_programs", {
  _id: "id",
  id: "id",
  title: "title",
  domain: "domain",
  duration: "duration",
  description: "description",
  skills: "skills",
  stipend: "stipend",
  coverImage: "cover_image",
  tasks: "tasks",
  isActive: "is_active",
  certificateTemplate: "certificate_template",
  offerLetterTemplate: "offer_letter_template",
  createdBy: "created_by",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { InternshipProgram };
