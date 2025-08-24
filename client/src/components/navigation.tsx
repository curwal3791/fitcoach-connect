import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dumbbell, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GlobalSearch from "@/components/global-search";

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: null },
  { id: 'classes', name: 'Classes', icon: null },
  { id: 'routines', name: 'Routines', icon: null },
  { id: 'exercises', name: 'Exercises', icon: null },
  { id: 'programs', name: 'Programs', icon: null },
  { id: 'calendar', name: 'Calendar', icon: null },
  { id: 'clients', name: 'Clients', icon: null },
  { id: 'presentation', name: 'Present', icon: null },
];

export default function Navigation({ currentTab, onTabChange }: NavigationProps) {
  const { user } = useAuth();
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
      window.location.href = '/';
    },
    onError: () => {
      // Clear local data even if API call fails
      localStorage.removeItem('auth_token');
      queryClient.clear();
      window.location.href = '/';
    },
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  return (
    <nav className="bg-white shadow-sm border-b border-border" data-testid="navigation-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity"
              onClick={() => {
                // Create a special route for landing page that shows for authenticated users
                window.location.href = '/landing';
              }}
              data-testid="button-logo-home"
            >
              <Dumbbell className="text-primary text-xl mr-3" />
              <span className="text-xl font-bold text-gray-900">FitFlow</span>
            </button>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      navigate(item.id === 'dashboard' ? '/' : `/${item.id}`);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      currentTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                    data-testid={`nav-${item.id}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Global Search */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>


            
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={(user as any)?.profileImageUrl || ''} alt="Profile" />
                    <AvatarFallback>{getInitials((user as any)?.firstName, (user as any)?.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>

                <DropdownMenuItem 
                  className="w-full flex items-center cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
