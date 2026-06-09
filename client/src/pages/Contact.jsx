import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("Message sent! We'll be in touch within 24 hours.");
      setForm({ name: "", email: "", subject: "", message: "" });
      setSending(false);
    }, 700);
  };
  return (
    <div className="bg-gradient-soft min-h-screen py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="chip bg-primary-light text-primary border border-primary/15 mb-3 inline-block">
            <MessageCircle size={12} className="inline mr-1" /> Contact
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink">
            Get in touch with our team
          </h1>
          <p className="mt-3 text-text-secondary">
            Have a question, partnership idea, or feedback? Drop us a line.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {[
            { icon: Mail, label: "Email", value: "support@skyrovix.com", color: "from-purple-500 to-pink-500" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210", color: "from-blue-500 to-cyan-500" },
            { icon: MapPin, label: "Address", value: "Bengaluru, India", color: "from-amber-500 to-orange-500" },
          ].map((c) => (
            <div key={c.label} className="card p-5 text-center">
              <div
                className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} text-white items-center justify-center shadow-md mb-3`}
              >
                <c.icon size={20} />
              </div>
              <div className="text-sm font-bold text-ink">{c.label}</div>
              <div className="text-sm text-text-secondary mt-1">{c.value}</div>
            </div>
          ))}
        </div>
        <div className="card p-6 sm:p-8 max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-ink mb-1">Send us a message</h2>
          <p className="text-sm text-text-secondary mb-6">
            We typically respond within 24 hours.
          </p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input h-11"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Subject</label>
              <input
                className="input h-11"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Message *</label>
              <textarea
                className="input min-h-[140px] py-3"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us more..."
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={sending} className="btn-primary h-11 w-full sm:w-auto px-6">
                {sending ? "Sending..." : <><Send size={16} /> Send message</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
