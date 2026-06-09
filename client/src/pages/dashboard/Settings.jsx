import { Link } from "react-router-dom";
import { Bell, KeyRound, Mail, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Card } from "../../components/common/index.jsx";

export default function Settings() {
  const { user, remember, setRemember } = useAuth();

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">
          Account preferences and security.
        </p>
      </div>

      <Card>
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <Mail size={18} className="text-primary" /> Account
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          Signed in as <strong className="text-ink">{user?.email}</strong>
        </p>
        <label className="mt-4 flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border text-primary focus:ring-primary"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="text-sm text-ink">Remember me on this device</span>
        </label>
      </Card>

      <Card>
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <Shield size={18} className="text-primary" /> Security
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          Update your password or recover access if you forgot it.
        </p>
        <Link to="/forgot-password" className="btn-secondary mt-4 inline-flex">
          <KeyRound size={16} /> Reset password
        </Link>
      </Card>

      <Card>
        <h2 className="font-semibold text-ink flex items-center gap-2">
          <Bell size={18} className="text-primary" /> Email updates
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          Application status and task review emails are sent to your registered address.
          In development, messages also appear in the API server console.
        </p>
      </Card>
    </div>
  );
}
