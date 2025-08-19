import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/stats-card";
import { Plus, Play, Edit, ListCheck, CalendarDays, Clock, Users2 } from "lucide-react";

interface Routine {
  id: string;
  name: string;
  description?: string;
  totalDuration: number;
  exerciseCount: number;
  classType?: {
    name: string;
  };
}

interface DashboardStats {
  totalRoutines: number;
  totalExercises: number;
  weeklyClasses: number;
  avgDuration: number;
  classTypes: number;
}

interface TodayClass {
  id: string;
  title: string;
  startDatetime: string;
  location?: string;
  classType?: {
    name: string;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: routines, isLoading: routinesLoading } = useQuery<Routine[]>({
    queryKey: ["/api/routines"],
    enabled: isAuthenticated,
  });

  const { data: allEvents, isLoading: eventsLoading } = useQuery<TodayClass[]>({
    queryKey: ["/api/calendar/events"],
    enabled: isAuthenticated,
  });

  // Get upcoming 5 events
  const upcomingEvents = allEvents
    ?.filter(event => new Date(event.startDatetime) >= new Date())
    ?.sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime())
    ?.slice(0, 5) || [];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      { bg: 'bg-primary/10', icon: 'text-primary' },
      { bg: 'bg-fitness-600/10', icon: 'text-fitness-600' },
      { bg: 'bg-red-500/10', icon: 'text-red-600' },
      { bg: 'bg-yellow-500/10', icon: 'text-yellow-600' },
      { bg: 'bg-purple-500/10', icon: 'text-purple-600' },
    ];
    return colors[index % colors.length];
  };

  const getBorderColorForIndex = (index: number) => {
    const colors = [
      'border-primary',
      'border-fitness-600',
      'border-red-500',
      'border-yellow-500',
      'border-purple-500',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="dashboard-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-welcome">
          Welcome back!
        </h1>
        <p className="text-gray-600 mt-1">Ready to create amazing workouts today?</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Routines"
          value={stats?.totalRoutines ?? 0}
          icon={ListCheck}
          iconColor="text-primary"
          bgColor="bg-primary/10"
        />
        <StatsCard
          title="This Week"
          value={stats?.weeklyClasses ?? 0}
          icon={CalendarDays}
          iconColor="text-fitness-600"
          bgColor="bg-fitness-600/10"
        />
        <StatsCard
          title="Avg Duration"
          value={`${stats?.avgDuration ?? 0}m`}
          icon={Clock}
          iconColor="text-yellow-600"
          bgColor="bg-yellow-500/10"
        />
        <StatsCard
          title="Class Types"
          value={stats?.classTypes ?? 0}
          icon={Users2}
          iconColor="text-purple-600"
          bgColor="bg-purple-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Routines */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Routines</CardTitle>
                <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-routine">
                  <Plus className="w-4 h-4 mr-2" />
                  New Routine
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {routinesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : routines && routines.length > 0 ? (
                <div className="space-y-4">
                  {routines.slice(0, 5).map((routine, index) => {
                    const colors = getColorForIndex(index);
                    return (
                      <div
                        key={routine.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        data-testid={`routine-item-${routine.id}`}
                      >
                        <div className="flex items-center">
                          <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mr-4`}>
                            <ListCheck className={`${colors.icon}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900" data-testid={`routine-name-${routine.id}`}>
                              {routine.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              <span data-testid={`routine-duration-${routine.id}`}>
                                {formatDuration(routine.totalDuration)}
                              </span>
                              {' • '}
                              <span data-testid={`routine-exercises-${routine.id}`}>
                                {routine.exerciseCount} exercises
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-play-${routine.id}`}>
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${routine.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-routines">
                  <ListCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No routines yet. Create your first routine to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Schedule */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Upcoming Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => {
                    const borderColor = getBorderColorForIndex(index);
                    return (
                      <div 
                        key={event.id} 
                        className={`border-l-4 ${borderColor} pl-4`}
                        data-testid={`event-item-${event.id}`}
                      >
                        <p className={`text-sm font-medium ${getBorderColorForIndex(index).replace('border-', 'text-')}`}>
                          {new Date(event.startDatetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })} - {formatTime(event.startDatetime)}
                        </p>
                        <h4 className="font-semibold text-gray-900" data-testid={`event-title-${event.id}`}>
                          {event.title}
                        </h4>
                        {event.location && (
                          <p className="text-sm text-gray-600" data-testid={`event-location-${event.id}`}>
                            {event.location}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500" data-testid="text-no-events">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming classes scheduled.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
