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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Map from "./pages/Map";
import Dashboard from "./pages/Dashboard";
import ROICalculator from "./pages/ROICalculator";
import OICalculator from "./pages/OICalculator";
import CashflowDashboard from "./pages/CashflowDashboard";
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
                <Route path="/view/:shareToken" element={<CashflowView />} />
                <Route path="/compare-view/:shareToken" element={<CompareView />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                <Route path="/map-config" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/roi-calculator" element={<Navigate to="/home" replace />} />
                <Route path="/cashflow-generator" element={<ProtectedRoute><OICalculator /></ProtectedRoute>} />
                <Route path="/cashflow/:quoteId" element={<ProtectedRoute><OICalculator /></ProtectedRoute>} />
                {/* Legacy Dashboard View - kept for reference */}
                <Route path="/legacy/cashflow-dashboard" element={<ProtectedRoute><CashflowDashboard /></ProtectedRoute>} />
                <Route path="/legacy/cashflow-dashboard/:quoteId" element={<ProtectedRoute><CashflowDashboard /></ProtectedRoute>} />
                {/* Redirects for old dashboard URLs */}
                <Route path="/cashflow-dashboard" element={<Navigate to="/cashflow-generator" replace />} />
                <Route path="/cashflow-dashboard/:quoteId" element={<Navigate to="/cashflow/:quoteId" replace />} />
                <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                <Route path="/my-quotes" element={<ProtectedRoute><QuotesDashboard /></ProtectedRoute>} />
                <Route path="/archived-quotes" element={<ProtectedRoute><ArchivedQuotes /></ProtectedRoute>} />
                <Route path="/quotes-analytics" element={<ProtectedRoute><QuotesAnalytics /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><QuotesCompare /></ProtectedRoute>} />
                <Route path="/developer-ranking" element={<ProtectedRoute><DeveloperRanking /></ProtectedRoute>} />
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
