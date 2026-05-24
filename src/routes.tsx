import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy loading pages
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

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/cadastro/:slug" element={<PublicRegistration />} />
        <Route path="/planos" element={<LandingPage />} />
        <Route path="/demo" element={<Demo />} />
        
        <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
        
        <Route path="/contacts" element={<ProtectedRoute module="contacts"><Contacts /></ProtectedRoute>} />
        <Route path="/demands" element={<ProtectedRoute module="demands"><Demands /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute module="appointments"><Appointments /></ProtectedRoute>} />
        <Route path="/leaders" element={<ProtectedRoute module="leaders"><Leaders /></ProtectedRoute>} />
        <Route path="/leaders/new" element={<ProtectedRoute module="leaders"><LeaderRegistration /></ProtectedRoute>} />
        <Route path="/leaders/edit/:id" element={<ProtectedRoute module="leaders"><LeaderRegistration /></ProtectedRoute>} />
        <Route path="/marketing" element={<ProtectedRoute module="marketing"><Marketing /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute module="vehicles"><Vehicles /></ProtectedRoute>} />
        <Route path="/materials" element={<ProtectedRoute module="materials"><Materials /></ProtectedRoute>} />
        <Route path="/visit-requests" element={<ProtectedRoute module="visit_requests"><VisitRequests /></ProtectedRoute>} />
        <Route path="/registration-links" element={<ProtectedRoute module="registration_links"><RegistrationLinks /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute module="map"><Georeferencing /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute module="user_management"><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/tenants" element={<ProtectedRoute role="super_admin"><TenantManagement /></ProtectedRoute>} />
        <Route path="/admin/plans" element={<ProtectedRoute role="super_admin"><PlanManagement /></ProtectedRoute>} />
        <Route path="/backup" element={<ProtectedRoute role={["super_admin", "admin_gabinete"]}><Backup /></ProtectedRoute>} />
        <Route path="/campaign-files" element={<ProtectedRoute module="campaign_files"><CampaignFiles /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute role={["super_admin", "admin_gabinete"]}><Reports /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute module="chat"><Chat /></ProtectedRoute>} />
        <Route path="/financial" element={<ProtectedRoute module="financial"><Financial /></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute module="whatsapp"><WhatsApp /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
