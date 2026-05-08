import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CvChecker from "./pages/CvChecker.tsx";
import Results from "./pages/Results.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Interview from "./pages/Interview.tsx";
import InterviewResult from "./pages/InterviewResult.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import Scoring from "./pages/admin/Scoring.tsx";
import Questions from "./pages/admin/Questions.tsx";
import Skills from "./pages/admin/Skills.tsx";
import Logs from "./pages/admin/Logs.tsx";
// import Pricing from "./pages/Pricing.tsx"; // Pricing tạm ẩn — chưa cần thiết
import Contact from "./pages/Contact.tsx";
import BlogIndex from "./pages/blog/BlogIndex.tsx";
import BlogPost from "./pages/blog/BlogPost.tsx";
import Login from "./pages/auth/Login.tsx";
import Signup from "./pages/auth/Signup.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import ResetPassword from "./pages/auth/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import AuthLayout from "./components/auth/AuthLayout.tsx";
import { AuthProvider } from "./lib/auth";
import { RequireAuth } from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Auth Layout Route for flawless tab transitions without unmounting context */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/cv-analysis" element={<CvChecker />} />
          <Route path="/cv-checker" element={<CvChecker />} />
          <Route path="/results" element={<Results />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/interview/results/:sessionId" element={<RequireAuth><InterviewResult /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/admin/scoring" replace />} />
            <Route path="scoring" element={<Scoring />} />
            <Route path="questions" element={<Questions />} />
            <Route path="skills" element={<Skills />} />
            <Route path="logs" element={<Logs />} />
          </Route>
          {/* <Route path="/pricing" element={<Pricing />} /> */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<BlogIndex />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
