import { Modal } from "./Modal.jsx";
import { ShieldAlert, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SessionExpiredModal({ open, onClose }) {
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-warning flex items-center justify-center">
          <ShieldAlert size={26} />
        </div>
        <h3 className="mt-4 text-lg font-display font-bold text-ink">
          Your session expired
        </h3>
        <p className="mt-1.5 text-sm text-text-secondary">
          For your security we signed you out. Sign in again to pick up where you
          left off.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={onClose} className="btn-secondary">
            Not now
          </button>
          <button
            onClick={() => {
              onClose?.();
              navigate("/login", { replace: true });
            }}
            className="btn-primary"
          >
            <LogIn size={15} /> Sign in again
          </button>
        </div>
      </div>
    </Modal>
  );
}
