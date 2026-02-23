import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useContrastChecker } from "@/hooks/useContrastChecker";
import { useQuoteViewNotifications } from "@/hooks/useQuoteViewNotifications";
import { usePresentationViewNotifications } from "@/hooks/usePresentationViewNotifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OICalculator from "./pages/OICalculator";
import AccountSettings from "./pages/AccountSettings";
import QuotesDashboard from "./pages/QuotesDashboard";
import QuotesCompare from "./pages/QuotesCompare";
import QuotesAnalytics from "./pages/QuotesAnalytics";
import CashflowView from "./pages/CashflowView";
import DeveloperRanking from "./pages/DeveloperRanking";
import CompareView from "./pages/CompareView";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import ColorTest from "./pages/ColorTest";
import ArchivedQuotes from "./pages/ArchivedQuotes";
import PresentationsHub from "./pages/PresentationsHub";
import PresentationBuilder from "./pages/PresentationBuilder";
import PresentationView from "./pages/PresentationView";
import SnapshotView from "./pages/SnapshotView";
import SnapshotPrint from "./pages/SnapshotPrint";
import CashflowPrint from "./pages/CashflowPrint";
import ClientsManager from "./pages/ClientsManager";
import ClientPortal from "./pages/ClientPortal";
import OffPlanVsSecondary from "./pages/OffPlanVsSecondary";

import ClientPortfolioView from "./pages/ClientPortfolioView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to run contrast checker in development
function ContrastCheckerProvider({ children }: { children: React.ReactNode }) {
  useContrastChecker({ scanOnMount: true, scanOnMutation: false, debounceMs: 2000 });
  return <>{children}</>;
}

// Component to enable real-time notifications
function NotificationProvider({ children }: { children: React.ReactNode }) {
  useQuoteViewNotifications();
  usePresentationViewNotifications();
  return <>{children}</>;
}
function LegacyCompareRedirect() {
  const location = useLocation();
  return <Navigate to={`/compare${location.search}`} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <ContrastCheckerProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                {/* Main shared view route - Cashflow View */}
                <Route path="/view/:shareToken" element={<SnapshotView />} />
                <Route path="/view/:shareToken/print" element={<SnapshotPrint />} />
                {/* Legacy routes - kept for backward compatibility */}
                <Route path="/snapshot/:shareToken" element={<SnapshotView />} />
                <Route path="/snapshot/:shareToken/print" element={<SnapshotPrint />} />
                <Route path="/cashflow/:shareToken/print" element={<CashflowPrint />} />
                <Route path="/compare-view/:shareToken" element={<CompareView />} />
                <Route path="/present/:shareToken" element={<PresentationView />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/map-config" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/roi-calculator" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/cashflow-generator" element={<ProtectedRoute><OICalculator /></ProtectedRoute>} />
                <Route path="/cashflow/:quoteId" element={<ProtectedRoute><OICalculator /></ProtectedRoute>} />
                <Route path="/offplan-vs-secondary" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
                <Route path="/offplan-vs-secondary/:quoteId" element={<ProtectedRoute><OffPlanVsSecondary /></ProtectedRoute>} />
                {/* Redirects for old legacy URLs */}
                <Route path="/cashflow-dashboard" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/cashflow-dashboard/:quoteId" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/legacy/cashflow-dashboard" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/legacy/cashflow-dashboard/:quoteId" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                <Route path="/my-quotes" element={<ProtectedRoute><QuotesDashboard /></ProtectedRoute>} />
                <Route path="/archived-quotes" element={<ProtectedRoute><ArchivedQuotes /></ProtectedRoute>} />
                <Route path="/quotes-analytics" element={<ProtectedRoute><QuotesAnalytics /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><QuotesCompare /></ProtectedRoute>} />
                <Route path="/developer-ranking" element={<ProtectedRoute><DeveloperRanking /></ProtectedRoute>} />
                <Route path="/presentations" element={<ProtectedRoute><PresentationsHub /></ProtectedRoute>} />
                <Route path="/presentations/:id" element={<ProtectedRoute><PresentationBuilder /></ProtectedRoute>} />
                <Route path="/clients" element={<ProtectedRoute><ClientsManager /></ProtectedRoute>} />
                
                <Route path="/clients/:clientId/portfolio" element={<ProtectedRoute><ClientPortfolioView /></ProtectedRoute>} />
                <Route path="/portal/:portalToken" element={<ClientPortal />} />
                <Route path="/color-test" element={<ProtectedRoute><ColorTest /></ProtectedRoute>} />
                
                {/* Redirects for old routes */}
                <Route path="/oi-calculator" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/cash-statement" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/dashboard" element={<Navigate to="/map-config" replace />} />
                <Route path="/quotes" element={<Navigate to="/my-quotes" replace />} />
                <Route path="/quotes/compare" element={<LegacyCompareRedirect />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </NotificationProvider>
              </BrowserRouter>
            </ContrastCheckerProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
