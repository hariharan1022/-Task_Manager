import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  ClipboardList,
  FileCheck,
  Award,
  ChevronRight,
  BookOpen,
  Trophy,
  ListChecks,
  BarChart3,
  TrendingUp,
  Clock,
} from "lucide-react";
import { api } from "../../../utils/axios.js";
import { Card, Spinner } from "../../../components/common/index.jsx";

const statConfig = [
  { key: "totalStudents", label: "Students", icon: Users, tone: "primary" },
  { key: "totalCourses", label: "Courses", icon: BookOpen, tone: "violet" },
  { key: "totalEnrollments", label: "Enrollments", icon: TrendingUp, tone: "success" },
  { key: "activePrograms", label: "Internships", icon: GraduationCap, tone: "blue" },
  { key: "pendingAssignmentSubmissions", label: "Pending assignments", icon: ListChecks, tone: "warning" },
  { key: "completedExams", label: "Exams taken", icon: Trophy, tone: "amber" },
  { key: "passedResults", label: "Passed courses", icon: Award, tone: "success" },
  { key: "pendingSubmissions", label: "Pending reviews", icon: Clock, tone: "danger" },
];

const toneStyles = {
  primary: "bg-primary-light text-primary",
  violet: "bg-violet-50 text-violet-700",
  blue: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  success: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

const quickLinks = [
  {
    to: "/dashboard/admin/courses",
    title: "Manage courses",
    desc: "Create and edit training programs, modules, and lessons.",
    icon: BookOpen,
  },
  {
    to: "/dashboard/admin/exams",
    title: "Manage exams",
    desc: "Build 100-question MCQ exams and add questions in bulk.",
    icon: Trophy,
  },
  {
    to: "/dashboard/admin/assignments",
    title: "Review assignments",
    desc: "Grade student assignment submissions and provide feedback.",
    icon: ListChecks,
  },
  {
    to: "/dashboard/admin/programs",
    title: "Manage internships",
    desc: "Create internship programs with 5 mentor-reviewed tasks.",
    icon: GraduationCap,
  },
  {
    to: "/dashboard/admin/analytics",
    title: "View analytics",
    desc: "Top courses, score distribution, and recent results.",
    icon: BarChart3,
  },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="flex justify-center py-16">
        <Spinner />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statConfig.map(({ key, label, icon: Icon, tone }) => (
          <Card key={key} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-medium">{label}</span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}
              >
                <Icon size={16} />
              </div>
            </div>
            <div className="text-2xl font-display font-bold text-ink mt-2">
              {stats?.[key] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-lg font-display font-semibold text-ink mb-4">Quick actions</h2>
        <ul className="divide-y divide-border">
          {quickLinks.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center justify-between gap-4 py-4 group hover:bg-surface/80 -mx-2 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink group-hover:text-primary transition">
                      {item.title}
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted shrink-0 group-hover:text-primary transition"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="bg-gradient-soft border-primary/20">
        <h3 className="font-semibold text-ink">Admin credentials</h3>
        <p className="text-sm text-text-secondary mt-1">
          Demo admin: <code className="text-xs bg-white px-1.5 py-0.5 rounded">admin@skyrovix.local</code>{" "}
          / <code className="text-xs bg-white px-1.5 py-0.5 rounded">Admin@12345</code>
        </p>
        <p className="text-sm text-text-secondary mt-1">
          Demo student: <code className="text-xs bg-white px-1.5 py-0.5 rounded">student@skyrovix.local</code>{" "}
          / <code className="text-xs bg-white px-1.5 py-0.5 rounded">Student@12345</code>
        </p>
      </Card>
    </div>
  );
}
