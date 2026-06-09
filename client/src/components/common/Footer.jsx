import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Instagram, Youtube } from "lucide-react";
import Logo from "./Logo.jsx";
import { hashLink } from "../../utils/paths.js";
import { COMPANY } from "../../constants/company.js";

const socials = [
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
  { icon: Youtube, label: "YouTube", href: "https://youtube.com" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="min-w-0 lg:col-span-2">
            <div className="inline-flex rounded-xl bg-white px-3 py-2 shadow-sm">
              <Logo size="md" linkTo="/" />
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-md">
              SKYROVIX is a premium Training, Learning Management System, and
              Internship Portal — 20+ industry-grade courses, hands-on
              internships, mentor-reviewed tasks, and verifiable certificates.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-purple-300" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition">
                  {COMPANY.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-purple-300" />
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-white transition">
                  {COMPANY.phone}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin size={14} className="shrink-0 text-purple-300 mt-0.5" />
                {COMPANY.address}
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-primary/30 border border-white/10 hover:border-primary/30 flex items-center justify-center transition text-slate-300 hover:text-white"
                  aria-label={s.label}
                >
                  <s.icon size={14} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Platform</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Browse courses
                </Link>
              </li>
              <li>
                <Link to="/internships" className="hover:text-white transition">
                  Browse internships
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-white transition">
                  Verify documents
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Company</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition">
                  Email support
                </a>
              </li>
            </ul>
            <div className="text-white font-semibold mb-3 mt-6">Legal</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Categories</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Web Development
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Programming
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Data Science
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Mobile Development
                </Link>
              </li>
              <li>
                <Link to="/courses" className="hover:text-white transition">
                  Cloud & DevOps
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} SKYROVIX. All rights reserved.</span>
          <span>Est. 2024 · Built with ❤️ by Hariharan S &amp; Maheshwaran S</span>
        </div>
      </div>
    </footer>
  );
}
