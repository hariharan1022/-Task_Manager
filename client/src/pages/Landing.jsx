import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  FileText,
  Linkedin,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Video,
  Zap,
  Quote,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  GraduationCap,
  Brain,
  Database,
  Smartphone,
  Globe,
  Cpu,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../utils/axios.js";
import { toast } from "react-hot-toast";
import PlatformStats from "../components/common/PlatformStats.jsx";
import { COMPANY } from "../constants/company.js";

const courseCategories = [
  { name: "Web Development", icon: Globe, color: "from-blue-500 to-cyan-500", count: 6 },
  { name: "Programming", icon: Code2, color: "from-purple-500 to-pink-500", count: 5 },
  { name: "Data Science", icon: Brain, color: "from-amber-500 to-orange-500", count: 2 },
  { name: "Mobile Development", icon: Smartphone, color: "from-emerald-500 to-teal-500", count: 1 },
  { name: "Database", icon: Database, color: "from-rose-500 to-red-500", count: 2 },
  { name: "Cloud & DevOps", icon: Cpu, color: "from-indigo-500 to-violet-500", count: 1 },
];

const internshipDomains = [
  { name: "Full Stack (MERN)", duration: "2 Months", skills: ["React", "Node.js", "MongoDB"] },
  { name: "Full Stack (MEAN)", duration: "2 Months", skills: ["Angular", "Node.js", "MongoDB"] },
  { name: "Flutter Mobile Dev", duration: "2 Months", skills: ["Flutter", "Dart", "Firebase"] },
  { name: "Web Development", duration: "1 Month", skills: ["HTML", "CSS", "JavaScript"] },
];

const successStories = [
  {
    name: "Ananya R.",
    role: "Software Engineer at TCS",
    image: "A",
    quote:
      "The MERN internship at Skyrovix gave me the hands-on experience I needed. Got placed within 2 months of completion.",
    rating: 5,
  },
  {
    name: "Karthik S.",
    role: "ML Engineer at Startup",
    image: "K",
    quote:
      "The Machine Learning course was world-class. I built 5 real projects and landed my dream job with a 12 LPA package.",
    rating: 5,
  },
  {
    name: "Meera J.",
    role: "Frontend Developer at Infosys",
    image: "M",
    quote:
      "The React course, the mentor reviews, and the certificate all helped me stand out. Worth every minute invested.",
    rating: 5,
  },
  {
    name: "Vikram P.",
    role: "Full Stack Developer",
    image: "V",
    quote:
      "Started with zero coding knowledge. The structured curriculum and daily tasks kept me on track. Now earning 8 LPA.",
    rating: 5,
  },
  {
    name: "Priya N.",
    role: "Data Scientist at Wipro",
    image: "P",
    quote:
      "The AI course at Skyrovix is at par with international platforms. The certificate is recognized by top companies.",
    rating: 5,
  },
  {
    name: "Arun K.",
    role: "DevOps Engineer at Cognizant",
    image: "A",
    quote:
      "The DevOps & Cloud program helped me transition from a manual tester to a DevOps engineer in 6 months.",
    rating: 5,
  },
];

const platforms = ["Coursera", "Udemy", "Internshala", "LinkedIn Learning", "Great Learning"];

const features = [
  {
    icon: BookOpen,
    title: "20+ Expert-Led Courses",
    desc: "From Python and Java to React, Node, Flutter, ML, and AI — every course is structured with videos, assignments, and a final exam.",
    color: "from-blue-500 to-cyan-500",
    link: "/courses",
    linkText: "Browse catalog",
  },
  {
    icon: Video,
    title: "Learn by Watching",
    desc: "Curated HD video lessons from top instructors. Take notes, track progress, and resume exactly where you left off.",
    color: "from-purple-500 to-pink-500",
    link: "/courses",
    linkText: "Start learning",
  },
  {
    icon: Trophy,
    title: "Assignments + Exams",
    desc: "Submit assignments (50 marks) and take 100-question MCQ exams auto-converted to 50 marks. Pass both to earn your grade.",
    color: "from-amber-500 to-orange-500",
    link: "/courses",
    linkText: "See how grading works",
  },
  {
    icon: Briefcase,
    title: "Real Internships",
    desc: "Apply to mentor-reviewed internship tracks across Web, MERN, MEAN, Flutter, and more — earn an offer letter and a verifiable certificate.",
    color: "from-emerald-500 to-teal-500",
    link: "/internships",
    linkText: "Explore internships",
  },
  {
    icon: Award,
    title: "Verifiable Certificates",
    desc: "Every certificate carries a unique ID and a QR code that recruiters can scan on our public verification portal.",
    color: "from-rose-500 to-red-500",
    link: "/verify",
    linkText: "Verify a certificate",
  },
  {
    icon: ShieldCheck,
    title: "Built for Hiring",
    desc: "LinkedIn-shareable milestones, mentor-reviewed submissions, and IDs with digital signatures — proof of work employers trust.",
    color: "from-indigo-500 to-violet-500",
    link: "/register",
    linkText: "Create free account",
  },
];

function SectionHeader({ chip, title, subtitle }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
      <span className="chip bg-primary-light text-primary border border-primary/15 mb-4 inline-block">
        {chip}
      </span>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-ink tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-text-secondary text-base sm:text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function VerifyBox() {
  const [id, setId] = useState("");
  const navigate = useNavigate();
  const onVerify = (e) => {
    e.preventDefault();
    if (!id.trim()) {
      toast.error("Enter a certificate, offer letter, or intern ID");
      return;
    }
    navigate(`/verify?q=${encodeURIComponent(id.trim())}`);
  };
  return (
    <form
      onSubmit={onVerify}
      className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto"
    >
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Enter Certificate ID (e.g. CERT-2025-XXXX) or Intern ID"
          className="input pl-10 h-12 text-sm sm:text-base"
        />
      </div>
      <button type="submit" className="btn-primary h-12 px-6">
        <ShieldCheck size={16} /> Verify
      </button>
    </form>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("Message received! We'll get back to you soon.");
      setForm({ name: "", email: "", message: "" });
      setSending(false);
    }, 800);
  };
  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          chip="Get in touch"
          title="Have questions? We'd love to hear from you"
          subtitle="Reach out for course inquiries, partnership opportunities, or any support needs."
        />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="card p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-brand text-white flex items-center justify-center flex-shrink-0 shadow-glow">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink">Email us</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                    {COMPANY.email}
                  </a>
                </p>
                <p className="text-xs text-text-muted mt-1">We reply within 24 hours</p>
              </div>
            </div>
            <div className="card p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center flex-shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink">Call us</h3>
                <p className="text-sm text-text-secondary mt-1">
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="hover:text-primary">
                    {COMPANY.phone}
                  </a>
                </p>
                <p className="text-xs text-text-muted mt-1">Mon - Sat, 9 AM - 6 PM IST</p>
              </div>
            </div>
            <div className="card p-6 flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink">Visit us</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {COMPANY.address}
                </p>
                <p className="text-xs text-text-muted mt-1">By appointment only</p>
              </div>
            </div>
          </div>
          <form onSubmit={submit} className="card p-6 sm:p-8 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input h-11"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[120px] py-3"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what you'd like to know..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full h-11"
            >
              {sending ? "Sending..." : <>Send message <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  useEffect(() => {
    api
      .get("/stats/public")
      .then((r) => setStats(r.data))
      .catch(() => {});
    api
      .get("/courses", { params: { featured: "true" } })
      .then((r) => {
        const items = r.data?.items || r.data?.courses || r.data || [];
        setFeaturedCourses(items.slice(0, 6));
      })
      .catch(() => setFeaturedCourses([]));
  }, []);
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft -z-20" />
        <div className="absolute inset-0 hero-grid -z-10 opacity-90" />
        <div className="absolute top-0 right-0 w-[min(100%,28rem)] h-[min(100%,28rem)] bg-primary/15 rounded-full blur-3xl -z-10 animate-float" />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-accent/15 rounded-full blur-3xl -z-10 animate-float"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="inline-flex items-center gap-2 chip bg-white/90 border border-primary/20 text-primary shadow-sm mb-6 px-3 py-1.5">
                <Sparkles size={14} className="text-primary shrink-0" />
                <span className="font-semibold">New cohorts open this month</span>
              </div>

              <h1 className="text-[2rem] leading-[1.12] sm:text-5xl lg:text-6xl font-display font-extrabold text-ink tracking-tight break-words">
                Learn, build, and launch your{" "}
                <span className="text-primary sm:bg-gradient-brand sm:bg-clip-text sm:text-transparent">
                  tech career
                </span>
                .
              </h1>

              <p className="mt-5 text-base sm:text-lg text-text-secondary max-w-xl leading-relaxed">
                Industry-grade training programs, hands-on internships, and a verified
                certificate that employers trust. Start your journey today.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/courses"
                  className="btn-primary text-base px-6 py-3.5 w-full sm:w-auto justify-center shadow-glow"
                >
                  Explore courses <ArrowRight size={18} />
                </Link>
                <Link
                  to="/internships"
                  className="btn-secondary text-base px-6 py-3.5 w-full sm:w-auto justify-center bg-white/90"
                >
                  Browse internships
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary">
                <span className="font-semibold text-ink">As featured on:</span>
                {platforms.map((p) => (
                  <span key={p} className="font-medium opacity-70 hover:opacity-100 transition">
                    {p}
                  </span>
                ))}
              </div>

              <div className="mt-10">
                <PlatformStats />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="relative lg:pl-4"
            >
              <div className="absolute -inset-6 bg-gradient-brand opacity-[0.12] blur-3xl rounded-[2rem] -z-10" />
              <div className="card p-5 sm:p-6 relative z-10 border-primary/10 shadow-glow-lg">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/80">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="ml-2 text-[11px] sm:text-xs text-text-secondary font-mono truncate">
                    skyrovix / dashboard
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-primary-light to-accent-light/40 border border-primary/10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-brand text-white flex items-center justify-center shadow-glow">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">
                          Full Stack (MERN)
                        </div>
                        <div className="text-xs text-text-secondary">
                          16 weeks · 24 lessons · Assignment + Exam
                        </div>
                      </div>
                    </div>
                    <span className="self-start sm:self-center text-xs font-bold text-primary bg-white px-2.5 py-1 rounded-full border border-primary/20">
                      In progress
                    </span>
                  </div>

                  <div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-2 rounded-full transition-all ${
                            n <= 2 ? "bg-gradient-brand shadow-sm" : "bg-border"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-text-secondary mt-2 font-medium">
                      Module 2 of 4 · 40% complete
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Assignment", value: "45/50" },
                      { label: "Exam", value: "38/50" },
                      { label: "Grade", value: "A" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl bg-surface border border-border/80 p-3 text-center sm:text-left"
                      >
                        <div className="text-[10px] uppercase text-text-secondary tracking-wider font-semibold">
                          {item.label}
                        </div>
                        <div className="text-sm font-bold text-ink mt-1">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="hidden sm:flex absolute top-2 right-2 z-20 items-center gap-2 rounded-2xl bg-white border border-border px-3 py-2 shadow-glow text-xs font-semibold text-ink max-w-[calc(100%-1rem)]"
              >
                <Linkedin size={14} className="text-[#0A66C2] shrink-0" />
                <span className="truncate">Share-ready milestones</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="hidden sm:flex absolute bottom-2 left-2 z-20 items-center gap-2 rounded-2xl bg-gradient-brand text-white px-3 py-2 shadow-glow text-xs font-semibold"
              >
                <Zap size={14} className="shrink-0" />
                Mentor reviewed
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="Why Skyrovix"
            title="Everything you need to go from learner to hired"
            subtitle="A complete training + internship + verification platform built for outcomes — not just content."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={f.link}
                  className="group block card p-6 h-full hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}
                  >
                    <f.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-ink flex items-center gap-1.5">
                    {f.title}
                    <ChevronRight
                      size={16}
                      className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                    />
                  </h3>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    {f.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    {f.linkText} <ArrowRight size={12} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className="py-12 sm:py-16 bg-white border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: "Active Learners", value: stats?.totalInterns || "12,500+", icon: Users, color: "from-purple-500 to-pink-500" },
              { label: "Courses Available", value: "20+", icon: BookOpen, color: "from-blue-500 to-cyan-500" },
              { label: "Certificates Issued", value: "5,200+", icon: Award, color: "from-amber-500 to-orange-500" },
              { label: "Avg. Rating", value: "4.8/5", icon: Star, color: "from-emerald-500 to-teal-500" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center sm:text-left p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-surface to-white border border-border/60"
              >
                <div
                  className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} text-white items-center justify-center shadow-md mb-3`}
                >
                  <s.icon size={20} />
                </div>
                <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-text-secondary mt-1 font-medium">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING PROGRAMS */}
      <section id="training" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="Training Programs"
            title="Industry-grade courses for every skill level"
            subtitle="From beginner to advanced — 20+ courses across programming, web, mobile, data, cloud, and AI."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {courseCategories.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/courses"
                  className="group block card p-6 hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}
                  >
                    <c.icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-ink flex items-center gap-1.5">
                    {c.name}
                    <ChevronRight
                      size={16}
                      className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                    />
                  </h3>
                  <p className="text-sm text-text-secondary mt-2">
                    {c.count}+ courses available
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/courses" className="btn-primary">
              View all courses <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="Featured Courses"
            title="Most popular programs this month"
            subtitle="Hand-picked courses that learners are loving right now."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(featuredCourses.length > 0
              ? featuredCourses
              : []
            ).map((c, i) => (
              <motion.div
                key={c._id || c.id || c.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/courses/${c._id || c.id}`}
                  className="group block card overflow-hidden hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-32 bg-gradient-to-br from-primary to-accent relative overflow-hidden">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 hero-grid opacity-30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-white">
                      {c.level}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-ink text-lg flex items-center gap-1.5">
                      {c.title}
                      <ChevronRight
                        size={16}
                        className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all"
                      />
                    </h3>
                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed line-clamp-2">
                      {c.shortDescription || "Explore this course on Skyrovix."}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Video size={12} /> {c.duration || "Self-paced"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {(c.enrolledCount || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={12} className="fill-current" /> {(c.rating || 4.7).toFixed ? c.rating.toFixed(1) : c.rating}
                      </span>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                      View course <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/courses" className="btn-secondary">
              Browse all courses <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* INTERNSHIP PROGRAMS */}
      <section id="internships" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="Internship Programs"
            title="Gain real-world experience with industry mentors"
            subtitle="Hands-on internships with 5 mentor-reviewed tasks, an offer letter, and a verifiable certificate."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {internshipDomains.map((d, i) => (
              <motion.div
                key={d.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="card p-5 hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary-light text-primary flex items-center justify-center mb-3">
                  <Briefcase size={20} />
                </div>
                <h3 className="font-bold text-ink">{d.name}</h3>
                <p className="text-xs text-text-secondary mt-1">{d.duration}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {d.skills.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary border border-primary/15"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <Link
                  to="/internships"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:gap-2 transition-all"
                >
                  Apply now <ArrowRight size={12} />
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/internships" className="btn-primary">
              View all internships <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="How It Works"
            title="Your journey from learning to earning"
            subtitle="A clear path that takes you from beginner to job-ready."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Choose a course",
                desc: "Pick from 20+ courses across programming, web, mobile, data, and AI.",
                icon: BookOpen,
              },
              {
                step: "02",
                title: "Learn by doing",
                desc: "Watch videos, complete assignments, and take exams to test your knowledge.",
                icon: PlayCircle,
              },
              {
                step: "03",
                title: "Apply to internship",
                desc: "Use your learning to tackle real-world tasks reviewed by industry mentors.",
                icon: Briefcase,
              },
              {
                step: "04",
                title: "Get certified",
                desc: "Earn verifiable certificates and stand out in the job market.",
                icon: Award,
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative card p-6 group hover:shadow-glow hover:border-primary/20 hover:-translate-y-1 transition-all"
              >
                <span className="text-3xl font-display font-extrabold text-primary sm:bg-gradient-brand sm:bg-clip-text sm:text-transparent">
                  {s.step}
                </span>
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center mt-3 group-hover:scale-110 transition-transform">
                  <s.icon size={20} />
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDENT SUCCESS STORIES */}
      <section id="testimonials" className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            chip="Student Success Stories"
            title="Real outcomes from real learners"
            subtitle="Hear from students who transformed their careers with Skyrovix."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {successStories.map((t, i) => (
              <motion.div
                key={t.name + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.06 }}
                className="card p-6 hover:shadow-glow hover:border-primary/20 transition-all"
              >
                <Quote
                  size={24}
                  className="text-primary/30 mb-2"
                />
                <p className="text-sm text-ink leading-relaxed">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-brand text-white flex items-center justify-center font-bold shadow-glow">
                    {t.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{t.name}</div>
                    <div className="text-xs text-text-secondary truncate">{t.role}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, k) => (
                    <Star key={k} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATE VERIFICATION */}
      <section className="section-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-brand text-white items-center justify-center mb-5 shadow-glow">
              <ShieldCheck size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white">
              Verify any certificate
            </h2>
            <p className="text-slate-200 mt-3 max-w-xl mx-auto text-sm sm:text-base">
              Enter a certificate ID, offer letter number, or intern ID to verify its
              authenticity instantly.
            </p>
            <div className="mt-8">
              <VerifyBox />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONTACT */}
      <ContactSection />

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 sm:p-12 text-center text-white shadow-glow-lg">
          <div className="absolute inset-0 hero-grid opacity-40" />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-tight">
              Ready to launch your career?
            </h2>
            <p className="mt-3 text-purple-100 max-w-md mx-auto text-sm sm:text-base">
              Join 12,500+ learners building their future with Skyrovix today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold bg-white text-primary hover:bg-purple-50 transition shadow-lg min-h-[48px]"
              >
                Create free account
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold border-2 border-white/40 text-white hover:bg-white/10 transition min-h-[48px]"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
