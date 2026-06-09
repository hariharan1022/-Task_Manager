import { env } from "../config/env.js";

export async function sendEmail({ to, subject, html, text }) {
  if (!env.smtp.host || !env.smtp.user) {
    console.log(`[email:dev] to=${to} subject=${subject}`);
    if (text) console.log(text);
    return { queued: false, dev: true };
  }
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: Number(env.smtp.port) || 587,
    secure: Number(env.smtp.port) === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
  return { queued: true };
}
