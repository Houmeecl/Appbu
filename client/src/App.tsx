import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import POSInterface from "@/pages/pos-interface";
import CertificadorPanel from "@/pages/certificador-panel";
import ValidationInterface from "@/pages/validation-interface";
import Dashboard from "@/pages/dashboard";
import AdminPanel from "@/pages/admin-panel";
import NotFound from "@/pages/not-found";

function Navigation() {
  const [activeInterface, setActiveInterface] = useState<string>("pos");

  const interfaces = [
    { id: "pos", label: "POS VecinoXpress", icon: "fas fa-mobile-alt", color: "text-blue-600" },
    { id: "certificador", label: "Panel Certificador", icon: "fas fa-certificate", color: "text-red-600" },
    { id: "validation", label: "Validación Pública", icon: "fas fa-search", color: "text-gray-600" },
    { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line", color: "text-gray-600" },
    { id: "admin", label: "Administración", icon: "fas fa-shield-alt", color: "text-purple-600" },
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8" aria-label="Tabs">
          {interfaces.map((iface) => (
            <Button
              key={iface.id}
              variant="ghost"
              onClick={() => setActiveInterface(iface.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeInterface === iface.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <i className={`${iface.icon} mr-2`}></i>
              {iface.label}
            </Button>
          ))}
        </nav>
      </div>
      
      {/* Interface Content */}
      <div className="min-h-screen">
        {activeInterface === "pos" && <POSInterface />}
        {activeInterface === "certificador" && <CertificadorPanel />}
        {activeInterface === "validation" && <ValidationInterface />}
        {activeInterface === "dashboard" && <Dashboard />}
        {activeInterface === "admin" && <AdminPanel />}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Navigation} />
      <Route path="/certificador" component={CertificadorPanel} />
      <Route path="/pos" component={POSInterface} />
      <Route path="/validation" component={ValidationInterface} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
