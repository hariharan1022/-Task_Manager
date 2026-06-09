import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

let configured = false;

export function getCloudinary() {
  if (!configured) {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      configured = true;
    }
  }
  return configured ? cloudinary : null;
}
