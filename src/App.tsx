import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth-new/ProtectedRoute";

// Eagerly load landing (first paint) and auth
import Landing from "./pages-new/Landing";
import Auth from "./pages-new/Auth";

// Lazy-load all other routes for code splitting
const Dashboard = lazy(() => import("./pages-new/Dashboard"));
const StrategyCreator = lazy(() => import("./pages-new/StrategyCreator"));
const SharedView = lazy(() => import("./pages-new/SharedView"));
const Account = lazy(() => import("./pages-new/Account"));

const LazyFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg">
    <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse" />
    <div className="mt-4 h-1.5 w-32 bg-theme-border rounded-full overflow-hidden">
      <div className="h-full w-1/2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-shimmer" />
    </div>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg px-4 text-center">
    <span className="font-mono text-6xl text-theme-accent font-bold mb-4">404</span>
    <h1 className="font-display text-xl text-theme-text mb-2">Page Not Found</h1>
    <p className="text-sm text-theme-text-muted mb-6">The page you're looking for doesn't exist.</p>
    <a href="/" className="text-sm text-theme-accent hover:underline">Back to Home</a>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LazyFallback />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/view/:shareToken" element={<SharedView />} />

                  {/* Protected */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/strategy/new" element={<ProtectedRoute><StrategyCreator /></ProtectedRoute>} />
                  <Route path="/strategy/:quoteId" element={<ProtectedRoute><StrategyCreator /></ProtectedRoute>} />
                  <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

                  {/* Legacy redirects */}
                  <Route path="/home" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/cashflow-generator" element={<Navigate to="/strategy/new" replace />} />
                  <Route path="/cashflow/:quoteId" element={<Navigate to="/strategy/new" replace />} />
                  <Route path="/my-quotes" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/account-settings" element={<Navigate to="/account" replace />} />
                  <Route path="/map-config" element={<Navigate to="/dashboard" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
