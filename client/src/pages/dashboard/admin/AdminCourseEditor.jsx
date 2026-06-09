import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { Spinner } from "../../../components/common/index.jsx";
import { toast } from "react-hot-toast";

export default function AdminCourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    api
      .get(`/courses/admin/${id}`)
      .then((r) => {
        setCourse(r.data.course);
      })
      .catch(() => toast.error("Failed to load course"))
      .finally(() => setLoading(false));
  }, [id]);

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      const payload = {
        title: course.title,
        shortDescription: course.shortDescription,
        description: course.description,
        thumbnail: course.thumbnail,
        duration: course.duration,
        category: course.category,
        level: course.level,
        instructor: course.instructor,
        videoUrl: course.videoUrl,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        learningObjectives: course.learningObjectives,
        requirements: course.requirements,
        tags: course.tags,
      };
      await api.put(`/courses/${id}`, payload);
      toast.success("Course details saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSavingMeta(false);
    }
  };

  if (loading)
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  if (!course)
    return <div className="text-center py-16 text-text-secondary">Not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link
            to="/dashboard/admin/courses"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-ink mb-2"
          >
            <ArrowLeft size={14} /> Back to courses
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            {course.title}
          </h1>
        </div>
        <button
          onClick={saveMeta}
          disabled={savingMeta}
          className="btn-primary h-10 text-sm"
        >
          <Save size={14} /> {savingMeta ? "Saving..." : "Save details"}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-ink text-sm">Course details</h3>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Title</label>
            <input
              className="input h-10"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              className="input h-10"
              value={course.category}
              onChange={(e) => setCourse({ ...course, category: e.target.value })}
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
              className="input h-10"
              value={course.level}
              onChange={(e) => setCourse({ ...course, level: e.target.value })}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div>
            <label className="label">Duration</label>
            <input
              className="input h-10"
              value={course.duration}
              onChange={(e) => setCourse({ ...course, duration: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Thumbnail URL</label>
            <input
              className="input h-10"
              value={course.thumbnail}
              onChange={(e) =>
                setCourse({ ...course, thumbnail: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Short description</label>
            <input
              className="input h-10"
              value={course.shortDescription}
              onChange={(e) =>
                setCourse({ ...course, shortDescription: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Full description</label>
            <textarea
              className="input min-h-[100px] py-3"
              value={course.description}
              onChange={(e) =>
                setCourse({ ...course, description: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-4 sm:col-span-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={course.isPublished}
                onChange={(e) =>
                  setCourse({ ...course, isPublished: e.target.checked })
                }
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={course.isFeatured}
                onChange={(e) =>
                  setCourse({ ...course, isFeatured: e.target.checked })
                }
              />
              Featured
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Video URL</label>
            <input
              className="input h-10"
              value={course.videoUrl || ""}
              onChange={(e) =>
                setCourse({ ...course, videoUrl: e.target.value })
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
