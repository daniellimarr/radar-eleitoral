import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy loading pages for better initial bundle size
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Contacts = lazy(() => import("@/pages/Contacts"));
const Demands = lazy(() => import("@/pages/Demands"));
const Appointments = lazy(() => import("@/pages/Appointments"));
const Leaders = lazy(() => import("@/pages/Leaders"));
const LeaderRegistration = lazy(() => import("@/pages/LeaderRegistration"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Materials = lazy(() => import("@/pages/Materials"));
const VisitRequests = lazy(() => import("@/pages/VisitRequests"));
const RegistrationLinks = lazy(() => import("@/pages/RegistrationLinks"));
const PublicRegistration = lazy(() => import("@/pages/PublicRegistration"));
const Georeferencing = lazy(() => import("@/pages/Georeferencing"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));
const Campaigns = lazy(() => import("@/pages/Campaigns"));
const Marketing = lazy(() => import("@/pages/Marketing"));
const Backup = lazy(() => import("@/pages/Backup"));
const CampaignFiles = lazy(() => import("@/pages/CampaignFiles"));
const Reports = lazy(() => import("@/pages/Reports"));
const Chat = lazy(() => import("@/pages/Chat"));
const TenantManagement = lazy(() => import("@/pages/TenantManagement"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const PlanManagement = lazy(() => import("@/pages/PlanManagement"));
const Financial = lazy(() => import("@/pages/Financial"));
const WhatsApp = lazy(() => import("@/pages/WhatsApp"));
const Demo = lazy(() => import("@/pages/Demo"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/cadastro/:slug" element={<PublicRegistration />} />
                <Route path="/planos" element={<LandingPage />} />
                <Route path="/demo" element={<Demo />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
                <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                <Route path="/demands" element={<ProtectedRoute><Demands /></ProtectedRoute>} />
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/leaders" element={<ProtectedRoute><Leaders /></ProtectedRoute>} />
                <Route path="/leaders/new" element={<ProtectedRoute><LeaderRegistration /></ProtectedRoute>} />
                <Route path="/leaders/edit/:id" element={<ProtectedRoute><LeaderRegistration /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
                <Route path="/visit-requests" element={<ProtectedRoute><VisitRequests /></ProtectedRoute>} />
                <Route path="/registration-links" element={<ProtectedRoute><RegistrationLinks /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><Georeferencing /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/tenants" element={<ProtectedRoute><TenantManagement /></ProtectedRoute>} />
                <Route path="/admin/plans" element={<ProtectedRoute><PlanManagement /></ProtectedRoute>} />
                <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
                <Route path="/campaign-files" element={<ProtectedRoute><CampaignFiles /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
                <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
