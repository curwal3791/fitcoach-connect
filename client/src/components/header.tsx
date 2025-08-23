import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/');
    },
    onError: () => {
      // Clear local data even if API call fails
      localStorage.removeItem('auth_token');
      queryClient.clear();
      navigate('/');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">F</span>
          </div>
          <span className="font-bold text-xl">FitFlow</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </a>
          <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
            Services
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#community" className="text-sm font-medium hover:text-primary transition-colors">
            Community
          </a>
        </nav>

        {!isLoading && (
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user.firstName || user.email}!
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/')}
                    data-testid="button-dashboard"
                  >
                    Return to Dashboard
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  {logoutMutation.isPending ? "Logging out..." : "Log Out"}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/login'}
                  data-testid="button-login"
                >
                  Log In
                </Button>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = '/register'}
                  data-testid="button-get-started"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
