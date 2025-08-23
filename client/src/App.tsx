import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Classes from "@/pages/classes";
import Routines from "@/pages/routines";
import Exercises from "@/pages/exercises";
import Calendar from "@/pages/calendar";
import Clients from "@/pages/clients";
import Presentation from "@/pages/presentation";
import CoachConsole from "@/pages/coach-console";
import CoachConsoleDemo from "@/pages/coach-console-demo";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [location] = useLocation();

  // Handle URL-based navigation
  useEffect(() => {
    if (location.startsWith("/routines")) {
      setCurrentTab("routines");
    } else if (location === "/classes") {
      setCurrentTab("classes");
    } else if (location === "/exercises") {
      setCurrentTab("exercises");
    } else if (location === "/calendar") {
      setCurrentTab("calendar");
    } else if (location === "/clients") {
      setCurrentTab("clients");
    } else if (location === "/presentation") {
      setCurrentTab("presentation");
    } else {
      setCurrentTab("dashboard");
    }
  }, [location]);

  const renderCurrentView = () => {
    switch (currentTab) {
      case "dashboard":
        return <Dashboard />;
      case "classes":
        return <Classes />;
      case "routines":
        return <Routines />;
      case "exercises":
        return <Exercises />;
      case "calendar":
        return <Calendar />;
      case "clients":
        return <Clients />;
      case "presentation":
        return <Presentation />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={AuthenticatedApp} />
          <Route path="/routines/:id" component={AuthenticatedApp} />
          <Route path="/routines" component={AuthenticatedApp} />
          <Route path="/classes" component={AuthenticatedApp} />
          <Route path="/exercises" component={AuthenticatedApp} />
          <Route path="/calendar" component={AuthenticatedApp} />
          <Route path="/clients" component={AuthenticatedApp} />
          <Route path="/presentation" component={AuthenticatedApp} />
          <Route path="/coach-console/:eventId" component={CoachConsole} />
          <Route path="/demo/coach-console" component={CoachConsoleDemo} />
        </>
      )}
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
