import { Logo } from "./Logo";
import msme from "@/assets/msme.png";
import { Link } from "@tanstack/react-router";

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
            <li>skyrovix@gmail.com</li>
            <li>India</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Registered with</h4>
          <div className="flex items-center gap-3 rounded-lg bg-white p-3 max-w-[180px]">
            <img src={msme} alt="MSME" className="h-12 object-contain" />
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Skyrovix IT Solutions. All rights reserved.
      </div>
    </footer>
  );
}
