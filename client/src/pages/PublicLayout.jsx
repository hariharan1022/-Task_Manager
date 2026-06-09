import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar.jsx";
import Footer from "../components/common/Footer.jsx";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1">
        <Outlet />
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
