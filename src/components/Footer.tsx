import { Logo } from "./Logo";
import msme from "@/assets/msme.png";
import { Link } from "@tanstack/react-router";
import { Linkedin, Instagram, MessageCircle, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">A task-based virtual internship platform by Skyrovix IT Solutions — build real skills, earn a recognised certificate.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/domains" className="hover:text-foreground">Domains</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/verify-certificate" className="hover:text-foreground">Verify Certificate</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="mailto:skyrovix@gmail.com" className="flex items-center gap-2 hover:text-foreground"><Mail className="size-3.5" /> skyrovix@gmail.com</a></li>
            <li>India</li>
          </ul>
          <h4 className="mb-3 mt-5 text-sm font-semibold">Follow Us</h4>
          <div className="flex items-center gap-2.5">
            <a href="https://www.linkedin.com/in/hariharan-s-92b566381" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"><Linkedin className="size-4" /></a>
            <a href="https://www.instagram.com/skyrovix_web" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50"><Instagram className="size-4" /></a>
            <a href="https://wa.me/919940773204" target="_blank" rel="noopener noreferrer" className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-green-300 hover:text-green-600 hover:bg-green-50"><MessageCircle className="size-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Registered with</h4>
          <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
            <img src={msme} alt="MSME Registered" className="h-10 w-auto object-contain" />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-gray-700">MSME Registered</p>
              <p className="text-[10px] font-mono text-gray-500">UDYAM-TN-17-0076606</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        <div className="mb-2 flex items-center justify-center gap-4">
          <Link to="/privacy" className="hover:text-foreground underline underline-offset-2">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground underline underline-offset-2">Terms of Service</Link>
        </div>
        © {new Date().getFullYear()} Skyrovix IT Solutions. All rights reserved.
      </div>
    </footer>
  );
}
