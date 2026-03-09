import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Contacts from "@/pages/Contacts";
import Demands from "@/pages/Demands";
import Appointments from "@/pages/Appointments";
import Leaders from "@/pages/Leaders";
import LeaderRegistration from "@/pages/LeaderRegistration";
import Vehicles from "@/pages/Vehicles";
import Materials from "@/pages/Materials";
import VisitRequests from "@/pages/VisitRequests";
import RegistrationLinks from "@/pages/RegistrationLinks";
import PublicRegistration from "@/pages/PublicRegistration";
import Georeferencing from "@/pages/Georeferencing";
import UserManagement from "@/pages/UserManagement";
import Campaigns from "@/pages/Campaigns";
import Marketing from "@/pages/Marketing";
import Backup from "@/pages/Backup";
import CampaignFiles from "@/pages/CampaignFiles";
import Reports from "@/pages/Reports";
import Chat from "@/pages/Chat";
import TenantManagement from "@/pages/TenantManagement";
import PlanManagement from "@/pages/PlanManagement";
import Planos from "@/pages/Planos";
import Assinatura from "@/pages/Assinatura";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cadastro/:slug" element={<PublicRegistration />} />
            <Route path="/planos" element={<LandingPage />} />
            
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
            <Route path="/assinatura" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
}

export default App;
