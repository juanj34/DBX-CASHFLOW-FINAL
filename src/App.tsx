import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Map from "./pages/Map";
import Dashboard from "./pages/Dashboard";
import ROICalculator from "./pages/ROICalculator";
import OICalculator from "./pages/OICalculator";
import AccountSettings from "./pages/AccountSettings";
import QuotesDashboard from "./pages/QuotesDashboard";
import CashflowView from "./pages/CashflowView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/map" element={<Map />} />
              <Route path="/map-config" element={<Dashboard />} />
              <Route path="/roi-calculator" element={<ROICalculator />} />
              <Route path="/cashflow-generator" element={<OICalculator />} />
              <Route path="/cashflow/:quoteId" element={<OICalculator />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/my-quotes" element={<QuotesDashboard />} />
              <Route path="/view/:shareToken" element={<CashflowView />} />
              {/* Redirects for old routes */}
              <Route path="/oi-calculator" element={<Navigate to="/cashflow-generator" replace />} />
              <Route path="/cash-statement" element={<Navigate to="/cashflow-generator" replace />} />
              <Route path="/dashboard" element={<Navigate to="/map-config" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
