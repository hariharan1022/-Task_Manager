import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  uploadsDir: process.env.UPLOADS_DIR || "uploads",
  supabase: {
    url: process.env.SUPABASE_URL || "https://bkkunsjahduiwlqxguat.supabase.co",
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  autoAcceptApplications:
    process.env.AUTO_ACCEPT_APPLICATIONS === "true" ||
    (process.env.AUTO_ACCEPT_APPLICATIONS !== "false" &&
      (process.env.NODE_ENV || "development") === "development"),
  company: {
    name: process.env.COMPANY_NAME || "skyrovix",
    website: process.env.COMPANY_WEBSITE || "https://hariharan1022.github.io/-Task_Manager/",
    email: process.env.COMPANY_EMAIL || "skyrovix@gmail.com",
    phone: process.env.COMPANY_PHONE || "+91 9940773204",
    address: process.env.COMPANY_ADDRESS || "Pudukkottai, Tamil Nadu, India",
    linkedin: process.env.COMPANY_LINKEDIN || "https://www.linkedin.com/in/hariharan-s-92b566381",
    instagram: process.env.COMPANY_INSTAGRAM || "https://www.instagram.com/skyrovix_web",
    telegram: process.env.COMPANY_TELEGRAM || "9940773204",
    whatsapp: process.env.COMPANY_WHATSAPP || "9940773204",
  },
};
