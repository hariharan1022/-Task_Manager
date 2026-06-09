import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function LogoutOverlay({ open }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
          <motion.div
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-[88%] max-w-sm rounded-3xl bg-white shadow-2xl border border-border overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-brand" />
            <div className="p-7 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-brand text-white flex items-center justify-center shadow-glow">
                <ShieldCheck size={26} />
              </div>
              <h3 className="mt-4 text-lg font-display font-bold text-ink">
                Signing you out…
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Securing your session and clearing credentials.
              </p>

              <div className="mt-5 h-1 w-full rounded-full bg-surface overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.9, ease: "easeInOut", repeat: Infinity }}
                  className="h-full w-1/3 bg-gradient-brand"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
