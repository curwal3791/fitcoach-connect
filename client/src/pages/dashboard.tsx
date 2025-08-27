import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatsCard from "@/components/stats-card";
import { Plus, Play, Edit, ListCheck, CalendarDays, Clock, Users2, TrendingUp, BarChart3, PieChart, Zap, Search, Calendar, BookOpen, Target, Timer, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart, Pie } from 'recharts';
import { apiRequest } from "@/lib/queryClient";

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

interface AnalyticsData {
  weeklyActivity: Array<{ week: string; routines: number; classes: number }>;
  popularExercises: Array<{ name: string; count: number; category: string }>;
  classTypeDistribution: Array<{ name: string; count: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; totalMinutes: number; avgDuration: number }>;
}

interface ClassType {
  id: string;
  name: string;
  description?: string;
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
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [isNewRoutineOpen, setIsNewRoutineOpen] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [selectedClassTypeId, setSelectedClassTypeId] = useState<string>("");

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

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/dashboard/analytics"],
    enabled: isAuthenticated,
  });

  const { data: classTypes, isLoading: classTypesLoading } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    enabled: isAuthenticated,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  // Create routine mutation
  const createRoutineMutation = useMutation({
    mutationFn: async (routineData: { name: string; description?: string; classTypeId?: string }) => {
      return await apiRequest("/api/routines", "POST", routineData);
    },
    onSuccess: (newRoutine) => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] });
      setIsNewRoutineOpen(false);
      setRoutineName("");
      setRoutineDescription("");
      setSelectedClassTypeId("");
      toast({
        title: "Success",
        description: "Routine created successfully!",
      });
      // Navigate to the routine builder
      setLocation(`/routines`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create routine. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup duplicate class types mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/cleanup-duplicate-class-types", "POST");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Cleanup Complete",
        description: `Found ${data.duplicatesFound} duplicates, removed ${data.duplicatesRemoved}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup duplicate class types. Please try again.",
        variant: "destructive",
      });
    },
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

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];
  
  const getCategoryColor = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'Cardio': '#ef4444',
      'Strength': '#3b82f6', 
      'Flexibility': '#10b981',
      'Balance': '#f59e0b',
      'HIIT': '#8b5cf6',
      'Yoga': '#06b6d4',
      'General': '#6b7280'
    };
    return categoryColors[category] || '#6b7280';
  };

  const handleCreateRoutine = () => {
    if (!routineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a routine name.",
        variant: "destructive",
      });
      return;
    }

    createRoutineMutation.mutate({
      name: routineName.trim(),
      description: routineDescription.trim() || undefined,
      classTypeId: selectedClassTypeId && selectedClassTypeId !== "none" ? selectedClassTypeId : undefined,
    });
  };

  const handleRoutineClick = (routineId: string) => {
    setLocation(`/routines`);
  };

  const quickActions = [
    {
      title: "Quick Workout",
      description: "Start a 15-min routine",
      icon: Zap,
      color: "bg-orange-500",
      action: () => setLocation('/presentation')
    },
    {
      title: "Find Exercise",
      description: "Search exercise database",
      icon: Search,
      color: "bg-blue-500", 
      action: () => setLocation('/exercises')
    },
    {
      title: "Schedule Class",
      description: "Add to calendar",
      icon: Calendar,
      color: "bg-green-500",
      action: () => setLocation('/calendar')
    },
    {
      title: "Browse Routines",
      description: "View all workouts",
      icon: BookOpen,
      color: "bg-purple-500",
      action: () => setLocation('/routines')
    },
    {
      title: "Create Class Type",
      description: "Add new class category",
      icon: Target,
      color: "bg-pink-500",
      action: () => setLocation('/classes')
    },
    {
      title: "Manage Clients",
      description: "Track client progress",
      icon: Users,
      color: "bg-teal-500",
      action: () => setLocation('/clients')
    },
    {
      title: "Quick Timer",
      description: "Start interval timer",
      icon: Timer,
      color: "bg-indigo-500",
      action: () => {
        // Show a timer notification with countdown
        toast({
          title: "30-Second Timer",
          description: "Get ready for your next exercise!",
        });
        
        // Start countdown
        let countdown = 30;
        const interval = setInterval(() => {
          countdown--;
          if (countdown === 15) {
            toast({
              title: "15 seconds left",
              description: "Almost there!",
            });
          } else if (countdown === 5) {
            toast({
              title: "5 seconds left",
              description: "Final countdown!",
            });
          } else if (countdown === 0) {
            toast({
              title: "Time's up!",
              description: "Great work! Rest or move to next exercise.",
            });
            clearInterval(interval);
          }
        }, 1000);
      }
    }
  ];

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

      {/* Top Priority: Upcoming Schedule with Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-4 mb-8">
        {/* Upcoming Schedule - Takes up 3/4 width */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                Upcoming Schedule
              </CardTitle>
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
                  {upcomingEvents.slice(0, 5).map((event, index) => {
                    const borderColor = getBorderColorForIndex(index);
                    const colorClasses = getColorForIndex(index);
                    
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 ${borderColor} bg-white hover:shadow-md transition-all duration-200 cursor-pointer`}
                        onClick={() => setLocation(`/coach-console/${event.id}`)}
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center`}>
                            <CalendarDays className={`w-6 h-6 ${colorClasses.icon}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(event.startTime).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                              </span>
                              {event.duration && (
                                <span className="flex items-center">
                                  <Timer className="w-4 h-4 mr-1" />
                                  {event.duration}min
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/presentation/${event.routineId}`);
                            }}
                            data-testid={`present-${event.id}`}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Present
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/coach-console/${event.id}`);
                            }}
                            data-testid={`console-${event.id}`}
                          >
                            Console
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No upcoming classes</p>
                  <p className="text-sm mb-4">Schedule your first fitness class to get started</p>
                  <Button onClick={() => setLocation("/calendar")} data-testid="button-schedule-first">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule a Class
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Right side */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-orange-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setLocation("/calendar")}
                className="w-full justify-start"
                data-testid="button-quick-schedule"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Class
              </Button>
              <Button
                onClick={() => setLocation("/routines")}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-quick-routine"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Create Routine
              </Button>
              <Button
                onClick={() => setLocation("/clients")}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-quick-clients"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Clients
              </Button>
              <Button
                onClick={() => setLocation("/exercises")}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-quick-exercises"
              >
                <Search className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
              <Button
                onClick={() => setLocation("/presentation")}
                variant="outline"
                className="w-full justify-start"
                data-testid="button-quick-workout"
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Workout
              </Button>
              <Button
                onClick={() => cleanupMutation.mutate()}
                variant="outline"
                className="w-full justify-start"
                disabled={cleanupMutation.isPending}
                data-testid="button-cleanup-duplicates"
              >
                <ListCheck className="w-4 h-4 mr-2" />
                {cleanupMutation.isPending ? "Cleaning..." : "Cleanup Data"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Cards - Moved below schedule */}
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

      {/* Top Section with Upcoming Schedule and Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* Upcoming Schedule - Now prominently positioned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-primary" />
              Upcoming Schedule
            </CardTitle>
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
                {upcomingEvents.slice(0, 5).map((event, index) => {
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

        {/* Weekly Activity Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Weekly Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analyticsData?.weeklyActivity ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analyticsData.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="routines" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="classes" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <TrendingUp className="w-12 h-12 mb-4 text-gray-300" />
                <p>No activity data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-fitness-600" />
              Monthly Workout Minutes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analyticsData?.monthlyTrends ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="totalMinutes" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <BarChart3 className="w-12 h-12 mb-4 text-gray-300" />
                <p>No trend data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-purple-600" />
              Class Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : analyticsData?.classTypeDistribution && analyticsData.classTypeDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.classTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.classTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {analyticsData.classTypeDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No class data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Exercises - Full Width */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" />
              Popular Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analyticsData?.popularExercises && analyticsData.popularExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {analyticsData.popularExercises.slice(0, 9).map((exercise, index) => (
                  <div key={exercise.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
                        style={{ backgroundColor: getCategoryColor(exercise.category) }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate" data-testid={`popular-exercise-${index}`}>
                          {exercise.name}
                        </p>
                        <p className="text-sm text-gray-500">{exercise.category}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-700 ml-4" data-testid={`exercise-count-${index}`}>
                      {exercise.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No exercise data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Routines - Full Width */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Recent Routines</CardTitle>
              <Dialog open={isNewRoutineOpen} onOpenChange={setIsNewRoutineOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-routine">
                    <Plus className="w-4 h-4 mr-2" />
                    New Routine
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]" aria-describedby="create-routine-description">
                  <DialogHeader>
                    <DialogTitle>Create New Routine</DialogTitle>
                  </DialogHeader>
                  <p id="create-routine-description" className="text-sm text-gray-600 mb-4">
                    Create a new workout routine with exercises and timing.
                  </p>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="routine-name">Routine Name</Label>
                      <Input
                        id="routine-name"
                        placeholder="Enter routine name..."
                        value={routineName}
                        onChange={(e) => setRoutineName(e.target.value)}
                        data-testid="input-routine-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routine-description">Description (Optional)</Label>
                      <Textarea
                        id="routine-description"
                        placeholder="Describe your routine..."
                        value={routineDescription}
                        onChange={(e) => setRoutineDescription(e.target.value)}
                        data-testid="input-routine-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class-type">Class Type (Optional)</Label>
                      <Select value={selectedClassTypeId} onValueChange={setSelectedClassTypeId}>
                        <SelectTrigger data-testid="select-class-type">
                          <SelectValue placeholder="Select a class type..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Class Type</SelectItem>
                          {classTypes?.map((classType) => (
                            <SelectItem key={classType.id} value={classType.id}>
                              {classType.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsNewRoutineOpen(false)}
                      data-testid="button-cancel-routine"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateRoutine}
                      disabled={createRoutineMutation.isPending}
                      data-testid="button-create-routine"
                    >
                      {createRoutineMutation.isPending ? "Creating..." : "Create Routine"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {routinesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : routines && routines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {routines.slice(0, 6).map((routine, index) => {
                  const colors = getColorForIndex(index);
                  return (
                    <div
                      key={routine.id}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      data-testid={`routine-item-${routine.id}`}
                      onClick={() => handleRoutineClick(routine.id)}
                    >
                      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mr-4`}>
                        <ListCheck className={`${colors.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" data-testid={`routine-name-${routine.id}`}>
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
                      <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-play-${routine.id}`}
                          onClick={() => setLocation('/presentation')}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          data-testid={`button-edit-${routine.id}`}
                          onClick={() => handleRoutineClick(routine.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500" data-testid="text-no-routines">
                <ListCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No routines yet. Create your first routine to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
