import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/dashboard/Sidebar.jsx";
import Topbar from "../../components/dashboard/Topbar.jsx";
import MobileNav from "../../components/dashboard/MobileNav.jsx";

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="lg:pl-64 flex flex-col min-h-screen print:pl-0">
        <div className="print:hidden">
          <Topbar
            mobileOpen={mobileOpen}
            onMobileOpen={() => setMobileOpen(true)}
            onMobileClose={() => setMobileOpen(false)}
          />
          <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>
        <div className="flex-1 p-3 sm:p-4 lg:p-8 max-w-[100vw] overflow-x-hidden print:p-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
