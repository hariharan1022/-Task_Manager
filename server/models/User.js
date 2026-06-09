import { createModel } from "../config/modelFactory.js";
import bcrypt from "bcryptjs";

const User = createModel("users", {
  _id: "id",
  id: "id",
  fullName: "full_name",
  email: "email",
  password: "password",
  phone: "phone",
  college: "college",
  department: "department",
  graduationYear: "graduation_year",
  profilePhoto: "profile_photo",
  linkedinProfile: "linkedin_profile",
  githubUrl: "github_url",
  portfolioUrl: "portfolio_url",
  resumeUrl: "resume_url",
  skills: "skills",
  role: "role",
  isEmailVerified: "is_email_verified",
  emailOtp: "email_otp",
  emailOtpExpiresAt: "email_otp_expires_at",
  refreshTokenHash: "refresh_token_hash",
  lastActiveAt: "last_active_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
});

User.comparePassword = async function (plain, hashed) {
  return bcrypt.compare(plain, hashed);
};

const _origCreate = User.create.bind(User);
User.create = async function (data) {
  const pwd = String(data.password || "").trim();
  if (pwd.length >= 8) {
    const salt = await bcrypt.genSalt(12);
    data = { ...data, password: await bcrypt.hash(pwd, salt) };
  }
  return _origCreate(data);
};

const _origUpdate = User.findByIdAndUpdate.bind(User);
User.findByIdAndUpdate = async function (id, data, options) {
  if (data.password) {
    const pwd = String(data.password).trim();
    if (pwd.length >= 8) {
      const salt = await bcrypt.genSalt(12);
      data = { ...data, password: await bcrypt.hash(pwd, salt) };
    }
  }
  return _origUpdate(id, data, options);
};

export { User };
