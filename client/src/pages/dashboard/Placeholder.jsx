import { Construction } from "lucide-react";

export default function Placeholder({ title }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-4">
        <Construction size={24} />
      </div>
      <h1 className="text-2xl font-display font-bold text-ink">{title}</h1>
      <p className="text-text-secondary mt-2 max-w-md mx-auto">
        This page is part of the next development phase. The core
        application → offer letter → tasks flow is fully working — this view
        will be wired up next.
      </p>
    </div>
  );
}
