import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  BookOpen,
  StickyNote,
} from "lucide-react";
import { api } from "../../utils/axios.js";
import { Spinner } from "../../components/common/index.jsx";
import { toast } from "react-hot-toast";

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/
  );
  return m ? m[1] : null;
}

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/courses/${courseId}/learning`)
      .then((r) => {
        setData(r.data);
        setNotes("");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load course");
        if (err.response?.status === 403 || err.response?.status === 404) {
          navigate("/dashboard/my-courses");
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, navigate]);

  const onMarkComplete = async () => {
    try {
      await api.post(`/courses/${courseId}/lessons/${courseId}/complete`);
      const refreshed = await api.get(`/courses/${courseId}/learning`);
      setData(refreshed.data);
      toast.success("Course completed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark complete");
    }
  };

  const onSaveNotes = () => {
    setSavedNotes(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedNotes(false), 1500);
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner size={32} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-16 text-text-secondary">
        Course not available
      </div>
    );
  }

  const { course, currentLesson, progress } = data;
  const videoId = currentLesson ? getYouTubeId(currentLesson.videoUrl) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate("/dashboard/my-courses")}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-ink"
        >
          <ArrowLeft size={14} /> Back to my courses
        </button>
        <div className="text-sm font-semibold text-ink">
          {progress.completed} / {progress.total} ·{" "}
          <span className="text-primary">{progress.percentage}%</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="aspect-video bg-black relative">
            {videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                title={course.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : currentLesson?.videoUrl ? (
              <video
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <PlayCircle size={48} className="opacity-50" />
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-ink">
                {course.title}
              </h1>
              <div className="text-xs text-text-secondary mt-1">
                {course.instructor}
              </div>
            </div>
            <button
              onClick={onMarkComplete}
              className={`h-10 text-sm ${progress.completed ? "btn-success" : "btn-primary"}`}
            >
              <CheckCircle2 size={14} /> {progress.completed ? "Completed" : "Mark complete"}
            </button>
          </div>

          <div className="mt-5 flex gap-1 border-b border-border">
            {[
              { key: "overview", label: "Overview", icon: BookOpen },
              { key: "notes", label: "Notes", icon: StickyNote },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition border-b-2 -mb-px ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-ink"
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "overview" && (
              <p className="text-sm text-text-secondary leading-relaxed">
                {course.description || currentLesson?.description}
              </p>
            )}
            {tab === "notes" && (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={onSaveNotes}
                  placeholder="Take notes for this course…"
                  className="input min-h-[180px] py-3"
                />
                <div className="mt-2 text-xs text-text-secondary">
                  {savedNotes ? "✓ Notes saved locally" : "Notes auto-save when you click away"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
