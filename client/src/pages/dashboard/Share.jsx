import { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Card } from "../../components/common/index.jsx";
import toast from "react-hot-toast";

export default function Share() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/register?ref=${encodeURIComponent(user?.email || "friend")}`;
  const message = `Join me on skyrovix Internships — apply to real programs and earn a verifiable certificate! ${shareUrl}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link manually");
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Share with Friends</h1>
        <p className="text-text-secondary text-sm mt-1">
          Invite classmates to browse internships on skyrovix.
        </p>
      </div>

      <Card>
        <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-4">
          <Share2 size={22} />
        </div>
        <label className="label">Your invite link</label>
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" readOnly value={shareUrl} />
          <button type="button" className="btn-primary" onClick={() => copy(shareUrl)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <label className="label mt-4">Suggested message</label>
        <textarea className="input min-h-[88px] text-sm" readOnly value={message} />
        <button type="button" className="btn-secondary w-full mt-3" onClick={() => copy(message)}>
          Copy message
        </button>
      </Card>
    </div>
  );
}
