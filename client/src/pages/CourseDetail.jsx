import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Globe,
  Brain,
  Smartphone,
  Database,
  Cpu,
  Star,
  Users,
  Video,
  Award,
  PlayCircle,
  FileText,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../utils/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "../components/common/index.jsx";
import { toast } from "react-hot-toast";

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/
  );
  return m ? m[1] : null;
}

const categoryIcons = {
  Programming: Code2,
  "Web Development": Globe,
  "Data Science": Brain,
  "Mobile Development": Smartphone,
  Database: Database,
  "Cloud & DevOps": Cpu,
};

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const videoId = course ? getYouTubeId(course.videoUrl) : null;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/courses/${id}`)
      .then((r) => {
        setCourse(r.data.course);
        setEnrollment(r.data.enrollment);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Failed to load course")
      )
      .finally(() => setLoading(false));
  }, [id]);

  const onEnroll = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    setEnrolling(true);
    try {
      const { data } = await api.post(`/courses/${id}/enroll`);
      setEnrollment(data.enrollment);
      toast.success("Enrolled! Redirecting to your course…");
      setTimeout(() => {
        navigate(`/dashboard/courses/${id}/learn`);
      }, 700);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const onStartLearning = () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    if (!enrollment) {
      onEnroll();
      return;
    }
    navigate(`/dashboard/courses/${id}/learn`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={36} />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <BookOpen size={36} className="text-muted mx-auto" />
          <h1 className="mt-3 text-2xl font-bold text-ink">Course not found</h1>
          <Link to="/courses" className="btn-primary mt-5">
            Browse all courses
          </Link>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[course.category] || BookOpen;

  return (
    <div className="bg-gradient-soft min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-ink mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              <div className="h-48 sm:h-60 bg-gradient-to-br from-primary to-accent relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Icon size={80} className="opacity-90" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-bold uppercase tracking-wider text-ink">
                    {course.level}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white">
                    {course.category}
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
                  {course.title}
                </h1>
                <p className="mt-3 text-text-secondary leading-relaxed">
                  {course.description || course.shortDescription}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video size={14} /> {course.videoUrl ? "1 video lesson" : "Self-paced"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> {course.enrolledCount || 0} students
                  </span>
                  {course.rating > 0 && (
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <Star size={14} className="fill-current" /> {course.rating}
                    </span>
                  )}
                </div>
                <div className="mt-5 pt-5 border-t border-border/80 text-sm text-text-secondary">
                  Instructor: <span className="font-bold text-ink">{course.instructor}</span>
                </div>
              </div>
            </motion.div>

            {course.learningObjectives?.length > 0 && (
              <div className="card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" /> What you'll learn
                </h2>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {course.learningObjectives.map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm text-text-secondary">
                      <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.videoUrl && (
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
                  ) : (
                    <video
                      src={course.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              </div>
            )}

            {course.requirements?.length > 0 && (
              <div className="card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-ink mb-3">Requirements</h2>
                <ul className="space-y-1.5 text-sm text-text-secondary">
                  {course.requirements.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span>•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="card p-5 sm:p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-ink">
                  Free
                </span>
                <span className="text-sm text-text-secondary line-through">₹4,999</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-emerald-50 px-2 py-0.5 rounded-full">
                  100% Off
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Limited-time launch offer
              </p>
              {enrollment ? (
                <button
                  onClick={onStartLearning}
                  className="btn-primary w-full h-12 mt-5 text-base"
                >
                  <PlayCircle size={18} /> Continue learning
                </button>
              ) : (
                <button
                  onClick={onEnroll}
                  disabled={enrolling}
                  className="btn-primary w-full h-12 mt-5 text-base"
                >
                  {enrolling ? "Enrolling..." : <><PlayCircle size={18} /> Enroll for free</>}
                </button>
              )}
              <ul className="mt-5 space-y-2.5 text-sm">
                  {[
                    "Full video lesson",
                    "Downloadable PDF notes",
                    "Hands-on assignments",
                    "100-question MCQ exam",
                    "Verifiable certificate",
                  ].map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-ink text-sm mb-3">This course includes</h3>
              <div className="space-y-2.5 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-primary" /> Full lifetime access
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-primary" /> PDF resources
                </div>
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-primary" /> Certificate on completion
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-primary" /> Self-paced learning
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
