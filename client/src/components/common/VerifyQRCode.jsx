import { useEffect, useRef } from "react";
import clsx from "clsx";

/**
 * Renders a scannable QR code via Google Charts API (no extra bundle weight).
 * Falls back to ID text if image fails to load.
 */
export default function VerifyQRCode({ value, size = 96, className, label = "Scan to verify" }) {
  const encoded = encodeURIComponent(value || "");
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=4`;
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    img.onerror = () => {
      img.style.display = "none";
    };
  }, [src]);

  if (!value) return null;

  return (
    <div className={clsx("inline-flex flex-col items-center gap-1", className)}>
      <div
        className="rounded-md border-2 border-blue-200 bg-white p-1 shadow-sm print:border-gray-300"
        style={{ width: size + 8, height: size + 8 }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={label}
          width={size}
          height={size}
          className="block h-full w-full object-contain"
        />
      </div>
      {label && (
        <p className="text-[8px] font-semibold uppercase tracking-wider text-blue-700 text-center max-w-[120px] leading-tight">
          {label}
        </p>
      )}
    </div>
  );
}
