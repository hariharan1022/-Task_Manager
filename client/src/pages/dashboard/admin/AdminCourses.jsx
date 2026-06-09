import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Users,
  Video,
  ChevronRight,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../../utils/axios.js";
import { Spinner, EmptyState, Modal, ProgressBar } from "../../../components/common/index.jsx";
import { toast } from "react-hot-toast";

const blankCourse = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "Programming",
  level: "Beginner",
  duration: "4 weeks",
  instructor: "Skyrovix Academy",
  thumbnail: "",
  learningObjectives: [],
  requirements: [],
  tags: [],
  videoUrl: "",
  isPublished: true,
  isFeatured: false,
};

export default function AdminCourses() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blankCourse);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/courses/admin/all")
      .then((r) => setItems(r.data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((c) =>
    !search ||
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.title || !form.category) {
      toast.error("Title and category are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/courses", form);
      toast.success("Course created");
      setOpen(false);
      setForm(blankCourse);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Unpublish this course? Students won't see it anymore.")) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success("Course unpublished");
      load();
    } catch (err) {
      toast.error("Failed to unpublish");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Courses
          </h1>
          <p className="mt-1 text-text-secondary text-sm">
            Manage training programs, modules, and lessons.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary h-10 text-sm">
          <Plus size={16} /> New course
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="input pl-10 h-11"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first training program to get started."
          cta={
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={16} /> New course
            </button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              <div className="h-32 bg-gradient-to-br from-primary to-accent relative">
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <BookOpen size={36} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {c.isFeatured && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-[9px] font-bold text-ink">
                      FEATURED
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.isPublished ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}>
                    {c.isPublished ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {c.category} · {c.level}
                </div>
                <h3 className="mt-1 font-bold text-ink line-clamp-1">{c.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Video size={11} /> {c.totalLessons || 0} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {c.enrolledCount || 0}
                  </span>
                </div>
                <div className="mt-3 flex gap-1">
                  <button
                    onClick={() => navigate(`/dashboard/admin/courses/${c._id}`)}
                    className="btn-primary h-9 text-xs flex-1"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => remove(c._id)}
                    className="btn-secondary h-9 text-xs"
                    title="Unpublish"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title="Create new course">
          <div className="space-y-3">
            <div>
              <label className="label">Title *</label>
              <input
                className="input h-11"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Python Programming"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select
                  className="input h-11"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {[
                    "Programming",
                    "Web Development",
                    "Mobile Development",
                    "Data Science",
                    "Database",
                    "Cloud & DevOps",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Level</label>
                <select
                  className="input h-11"
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Short description</label>
              <input
                className="input h-11"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                placeholder="One-line pitch"
              />
            </div>
            <div>
              <label className="label">Thumbnail URL</label>
              <input
                className="input h-11"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div>
              <label className="label">Duration</label>
              <input
                className="input h-11"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 8 weeks"
              />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                />
                Published
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) =>
                    setForm({ ...form, isFeatured: e.target.checked })
                  }
                />
                Featured
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-secondary h-10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary h-10 text-sm"
              >
                Create course
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
