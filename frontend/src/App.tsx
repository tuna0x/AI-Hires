import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index.tsx";
import AuthLayout from "./components/auth/AuthLayout.tsx";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./components/auth/RequireAuth";
import { ADMIN_AREA_PERMISSIONS } from "./lib/permissions";

// Tải động (Lazy loading) các trang để giảm tối đa kích thước bundle ban đầu
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const CvChecker = lazy(() => import("./pages/CvChecker.tsx"));
const Results = lazy(() => import("./pages/Results.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Interview = lazy(() => import("./pages/Interview.tsx"));
const InterviewResult = lazy(() => import("./pages/InterviewResult.tsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx"));
const Scoring = lazy(() => import("./pages/admin/Scoring.tsx"));
const Questions = lazy(() => import("./pages/admin/Questions.tsx"));
const Skills = lazy(() => import("./pages/admin/Skills.tsx"));
const Logs = lazy(() => import("./pages/admin/Logs.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const BlogIndex = lazy(() => import("./pages/blog/BlogIndex.tsx"));
const BlogPost = lazy(() => import("./pages/blog/BlogPost.tsx"));
const Login = lazy(() => import("./pages/auth/Login.tsx"));
const Signup = lazy(() => import("./pages/auth/Signup.tsx"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.tsx"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage.tsx"));

// Các trang ứng viên và nhà tuyển dụng mới
const Jobs = lazy(() => import("./pages/Jobs.tsx"));
const JobDetail = lazy(() => import("./pages/JobDetail.tsx"));
const MyResumes = lazy(() => import("./pages/MyResumes.tsx"));
const Applications = lazy(() => import("./pages/Applications.tsx"));
const DashboardHR = lazy(() => import("./pages/hr/DashboardHR.tsx"));
const JobsHR = lazy(() => import("./pages/hr/JobsHR.tsx"));
const ApplicantsHR = lazy(() => import("./pages/hr/ApplicantsHR.tsx"));


const queryClient = new QueryClient();
const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <span className="text-sm text-muted-foreground animate-pulse">Đang tải trang...</span>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Auth Layout Route for flawless tab transitions without unmounting context */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Tuyển dụng / Jobs */}
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/my-resumes" element={<RequireAuth><MyResumes /></RequireAuth>} />
              <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/cv-analysis" element={<CvChecker />} />
              <Route path="/cv-checker" element={<CvChecker />} />
              <Route path="/results" element={<Results />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/interview/results/:sessionId" element={<RequireAuth><InterviewResult /></RequireAuth>} />

              <Route
                path="/admin"
                element={
                  <RequireAuth anyPermissions={ADMIN_AREA_PERMISSIONS}>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Navigate to="/admin/hr/dashboard" replace />} />
                <Route path="scoring" element={<RequireAuth permission="manage:scoring"><Scoring /></RequireAuth>} />
                <Route path="questions" element={<RequireAuth permission="manage:questions"><Questions /></RequireAuth>} />
                <Route path="skills" element={<RequireAuth permission="manage:skills"><Skills /></RequireAuth>} />
                <Route path="users" element={<RequireAuth permission="manage:users"><AdminUsers /></RequireAuth>} />
                <Route path="logs" element={<RequireAuth permission="view:logs"><Logs /></RequireAuth>} />
                
                {/* Tuyển dụng (HR Portal) tích hợp vào Admin */}
                <Route path="hr" element={<Navigate to="/admin/hr/dashboard" replace />} />
                <Route path="hr/dashboard" element={<RequireAuth permission="view:hr:dashboard"><DashboardHR /></RequireAuth>} />
                <Route path="hr/jobs" element={<RequireAuth permission="manage:jobs"><JobsHR /></RequireAuth>} />
                <Route path="hr/applicants" element={<RequireAuth permission="manage:applicants"><ApplicantsHR /></RequireAuth>} />
              </Route>
              {/* <Route path="/pricing" element={<Pricing />} /> */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
