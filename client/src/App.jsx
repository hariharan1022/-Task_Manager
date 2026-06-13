import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Internships from "./pages/Internships.jsx";
import InternshipDetail from "./pages/InternshipDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import VerifyCertificate from "./pages/VerifyCertificate.jsx";
import VerifyDocument from "./pages/VerifyDocument.jsx";
import PublicLayout from "./pages/PublicLayout.jsx";
import Contact from "./pages/Contact.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import DashboardLayout from "./pages/dashboard/Layout.jsx";
import Overview from "./pages/dashboard/Overview.jsx";
import MyInternships from "./pages/dashboard/MyInternships.jsx";
import Tasks from "./pages/dashboard/Tasks.jsx";
import Profile from "./pages/dashboard/Profile.jsx";
import OfferLetter from "./pages/dashboard/OfferLetter.jsx";
import Certificate from "./pages/dashboard/Certificate.jsx";
import IdCard from "./pages/dashboard/IdCard.jsx";
import Share from "./pages/dashboard/Share.jsx";
import PhysicalCertificate from "./pages/dashboard/PhysicalCertificate.jsx";
import Leaderboard from "./pages/dashboard/Leaderboard.jsx";
import Notifications from "./pages/dashboard/Notifications.jsx";
import Settings from "./pages/dashboard/Settings.jsx";
import Help from "./pages/dashboard/Help.jsx";
import MyCourses from "./pages/dashboard/MyCourses.jsx";
import CourseLearning from "./pages/dashboard/CourseLearning.jsx";
import CourseAssignments from "./pages/dashboard/CourseAssignments.jsx";
import CourseExams from "./pages/dashboard/CourseExams.jsx";
import TakeExam from "./pages/dashboard/TakeExam.jsx";
import CourseResults from "./pages/dashboard/CourseResults.jsx";
import AdminShell from "./pages/dashboard/admin/AdminShell.jsx";
import AdminOverview from "./pages/dashboard/admin/AdminOverview.jsx";
import AdminPrograms from "./pages/dashboard/admin/AdminPrograms.jsx";
import AdminApplications from "./pages/dashboard/admin/AdminApplications.jsx";
import AdminSubmissions from "./pages/dashboard/admin/AdminSubmissions.jsx";
import AdminCourses from "./pages/dashboard/admin/AdminCourses.jsx";
import AdminCourseEditor from "./pages/dashboard/admin/AdminCourseEditor.jsx";
import AdminAssignments from "./pages/dashboard/admin/AdminAssignments.jsx";
import AdminExams from "./pages/dashboard/admin/AdminExams.jsx";
import AdminQuestions from "./pages/dashboard/admin/AdminQuestions.jsx";
import AdminAnalytics from "./pages/dashboard/admin/AdminAnalytics.jsx";
import AdminPaymentApprovals from "./pages/dashboard/admin/AdminPaymentApprovals.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import GuestRoute from "./routes/GuestRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/internships/:id" element={<InternshipDetail />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/verify" element={<VerifyDocument />} />
        <Route path="/verify-certificate/:id" element={<VerifyCertificate />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="my-internships" element={<MyInternships />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="offer-letter" element={<OfferLetter />} />
        <Route path="certificate" element={<Certificate />} />
        <Route path="profile" element={<Profile />} />
        <Route path="id-card" element={<IdCard />} />
        <Route path="share" element={<Share />} />
        <Route path="physical-certificate" element={<PhysicalCertificate />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route path="my-courses" element={<MyCourses />} />
        <Route
          path="courses/:courseId/learn/:lessonId?"
          element={<CourseLearning />}
        />
        <Route
          path="courses/:courseId/assignments"
          element={<CourseAssignments />}
        />
        <Route path="courses/:courseId/exams" element={<CourseExams />} />
        <Route
          path="courses/:courseId/exams/:examId"
          element={<TakeExam />}
        />
        <Route path="courses/:courseId/result" element={<CourseResults />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/:id" element={<AdminCourseEditor />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/:examId/questions" element={<AdminQuestions />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="payment-approvals" element={<AdminPaymentApprovals />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <PublicLayout>
            <div className="min-h-[60vh] flex items-center justify-center">
              Page not found
            </div>
          </PublicLayout>
        }
      />
    </Routes>
  );
}
