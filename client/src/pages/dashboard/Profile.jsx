import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { api } from "../../utils/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Card, Input, Spinner } from "../../components/common/index.jsx";
import ProfilePhotoUpload from "../../components/common/ProfilePhotoUpload.jsx";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    college: "",
    department: "",
    graduationYear: "",
    profilePhoto: "",
    linkedinProfile: "",
    githubUrl: "",
    portfolioUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/users/profile")
      .then((res) => {
        if (cancelled) return;
        const u = res.data.user;
        setForm({
          fullName: u.fullName || "",
          phone: u.phone || "",
          college: u.college || "",
          department: u.department || "",
          graduationYear: u.graduationYear || "",
          profilePhoto: u.profilePhoto || "",
          linkedinProfile: u.linkedinProfile || "",
          githubUrl: u.githubUrl || "",
          portfolioUrl: u.portfolioUrl || "",
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : undefined,
      };
      const { data } = await api.put("/users/profile", payload);
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save profile";
      console.error("[Profile] save error:", msg, err.response?.data, err.response?.status);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Profile</h1>
        <p className="text-text-secondary text-sm mt-1">
          Upload your photo for the ID card and certificate. Keep other details up to date.
        </p>
      </div>

      <Card>
        <ProfilePhotoUpload
          value={form.profilePhoto}
          onChange={(profilePhoto) => setForm((f) => ({ ...f, profilePhoto }))}
          name={form.fullName}
        />

        <form className="space-y-4 mt-6" onSubmit={onSubmit}>
          <Input label="Full name" name="fullName" value={form.fullName} onChange={onChange} required />
          <Input label="Phone" name="phone" value={form.phone} onChange={onChange} />
          <Input label="College" name="college" value={form.college} onChange={onChange} />
          <Input label="Department" name="department" value={form.department} onChange={onChange} />
          <Input
            label="Graduation year"
            name="graduationYear"
            type="number"
            value={form.graduationYear}
            onChange={onChange}
          />
          <Input
            label="LinkedIn profile URL"
            name="linkedinProfile"
            value={form.linkedinProfile}
            onChange={onChange}
            placeholder="https://linkedin.com/in/…"
          />
          <Input
            label="GitHub URL"
            name="githubUrl"
            value={form.githubUrl}
            onChange={onChange}
          />
          <Input
            label="Portfolio URL"
            name="portfolioUrl"
            value={form.portfolioUrl}
            onChange={onChange}
          />
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Save changes
          </button>
        </form>
      </Card>
    </div>
  );
}
