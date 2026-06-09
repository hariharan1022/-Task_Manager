import { Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { Card } from "../../components/common/index.jsx";

const faqs = [
  {
    q: "How do I apply for an internship?",
    a: "Browse Internships, open a program, sign in, fill the short form, and submit. In local dev, applications are accepted automatically so you can start tasks right away.",
  },
  {
    q: "Where are my tasks?",
    a: "After acceptance, open Dashboard → Tasks. Complete all 5 submissions to progress toward your certificate.",
  },
  {
    q: "How do I get my offer letter?",
    a: "Once accepted, go to Dashboard → Offer Letter. You can view and print your offer from there.",
  },
  {
    q: "When do I get a certificate?",
    a: "After all 5 tasks are approved by a mentor, your application moves to completed and your certificate appears under Dashboard → Certificate.",
  },
];

export default function Help() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Help Center</h1>
        <p className="text-text-secondary text-sm mt-1">
          Quick answers for students using skyrovix.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((f) => (
          <Card key={f.q}>
            <div className="flex gap-3">
              <HelpCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-ink">{f.q}</h2>
                <p className="text-sm text-text-secondary mt-1 leading-relaxed">{f.a}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm text-text-secondary">
          Still stuck? Email{" "}
          <a href="mailto:skyrovix@gmail.com" className="text-primary font-semibold">
            skyrovix@gmail.com
          </a>{" "}
          or return to{" "}
          <Link to="/dashboard" className="text-primary font-semibold">
            your dashboard
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
