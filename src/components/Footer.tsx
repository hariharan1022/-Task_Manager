import { Logo } from "./Logo";
import msme from "@/assets/msme.png";
import { Link } from "@tanstack/react-router";
import { Linkedin, Instagram, MessageCircle, Mail, ArrowUpRight } from "lucide-react";

export function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative border-t border-border/50 bg-[#f8fafc] dark:bg-[#020617]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
              A task-based virtual internship platform by Skyrovix — build real skills, earn a recognised certificate.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <a href="https://www.linkedin.com/in/hariharan-s-92b566381" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl border border-border/60 bg-white/50 dark:bg-[#0f172a]/50 text-muted-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30 hover:bg-[#0A66C2]/5 transition-all">
                <Linkedin className="size-4" />
              </a>
              <a href="https://www.instagram.com/skyrovix_web" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl border border-border/60 bg-white/50 dark:bg-[#0f172a]/50 text-muted-foreground hover:text-[#E4405F] hover:border-[#E4405F]/30 hover:bg-[#E4405F]/5 transition-all">
                <Instagram className="size-4" />
              </a>
              <a href="https://wa.me/919940773204" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-xl border border-border/60 bg-white/50 dark:bg-[#0f172a]/50 text-muted-foreground hover:text-[#25D366] hover:border-[#25D366]/30 hover:bg-[#25D366]/5 transition-all">
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { to: "/domains", label: "Internship Domains" },
                { to: "/courses", label: "Courses" },
                { to: "/about", label: "About Us" },
                { to: "/contact", label: "Contact" },
                { to: "/verify-certificate", label: "Verify Certificate" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                    <ArrowUpRight className="size-3 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:skyrovix@gmail.com" className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="size-3.5" /> skyrovix@gmail.com
                </a>
              </li>
              <li className="text-sm text-muted-foreground">India</li>
            </ul>
          </div>

          {/* MSME */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Registered with</h4>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border/60 bg-white/60 dark:bg-[#0f172a]/60 px-4 py-3.5 shadow-sm">
              <img src={msme} alt="MSME Registered" className="h-10 w-auto object-contain" />
              <div className="leading-tight">
                <p className="text-xs font-semibold text-foreground">MSME Registered</p>
                <p className="text-[10px] font-mono text-muted-foreground">UDYAM-TN-17-0076606</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/50 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Skyrovix. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</Link>
            <button onClick={scrollToTop} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">Back to top</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
