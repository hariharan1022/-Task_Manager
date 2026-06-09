import { useState } from "react";
import { Truck } from "lucide-react";
import { Card, Input, Textarea } from "../../components/common/index.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function PhysicalCertificate() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.fullName || "",
    address: "",
    city: "",
    pincode: "",
    phone: user?.phone || "",
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.address.trim() || !form.pincode.trim()) {
      toast.error("Please enter your full shipping address");
      return;
    }
    toast.success("Request received! We'll email you when physical shipping is available.");
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Physical Certificate</h1>
        <p className="text-text-secondary text-sm mt-1">
          Request a printed certificate shipped to your address after you complete a program.
        </p>
      </div>

      <Card>
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm mb-5">
          <Truck size={16} />
          Shipping is not live yet — submit your details to reserve a spot.
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Textarea
            label="Street address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            required
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            label="PIN / ZIP code"
            value={form.pincode}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <button type="submit" className="btn-primary w-full">
            Submit shipping request
          </button>
        </form>
      </Card>
    </div>
  );
}
