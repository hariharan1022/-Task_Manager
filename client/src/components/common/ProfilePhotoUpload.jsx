import { useRef } from "react";
import { Camera, X } from "lucide-react";
import toast from "react-hot-toast";

const MAX_BYTES = 900_000;

export default function ProfilePhotoUpload({ value, onChange, name }) {
  const inputRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a JPG or PNG image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Photo must be under 900 KB. Try a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.onerror = () => toast.error("Could not read image");
    reader.readAsDataURL(file);
  };

  const clear = () => onChange("");

  return (
    <div className="space-y-2">
      <span className="label">Student photo (for ID card & certificate)</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-28 w-28 rounded-full border-4 border-primary/20 bg-surface overflow-hidden shadow-sm">
          {value ? (
            <img src={value} alt={name || "Student"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary-light text-primary text-2xl font-bold">
              {(name || "U")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => inputRef.current?.click()}
          >
            <Camera size={16} /> Upload photo
          </button>
          {value && (
            <button type="button" className="btn-ghost text-sm text-danger" onClick={clear}>
              <X size={16} /> Remove photo
            </button>
          )}
          <p className="text-xs text-text-secondary max-w-[220px]">
            JPG or PNG, max 900 KB. This photo appears on your intern ID card and certificate.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
