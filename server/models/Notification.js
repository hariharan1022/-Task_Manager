import { createModel } from "../config/modelFactory.js";

const Notification = createModel("notifications", {
  _id: "id",
  id: "id",
  student: "student_id",
  type: "type",
  title: "title",
  body: "body",
  link: "link",
  read: "read",
  meta: "meta",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

export { Notification };
