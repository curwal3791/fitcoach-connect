import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertCalendarEventSchema,
  type CalendarEvent, 
  type ClassType,
  type Routine,
  type InsertCalendarEvent 
} from "@shared/schema";
import { z } from "zod";

const eventFormSchema = insertCalendarEventSchema.extend({
  title: z.string().min(1, "Event title is required"),
  startDatetime: z.string().min(1, "Start date and time is required"),
  endDatetime: z.string().min(1, "End date and time is required"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const { data: events, isLoading: eventsLoading } = useQuery<(CalendarEvent & { classType?: ClassType; routine?: Routine })[]>({
    queryKey: ["/api/calendar/events"],
    enabled: isAuthenticated,
  });

  const { data: classTypes, isLoading: classTypesLoading } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    enabled: isAuthenticated,
  });

  const { data: routines, isLoading: routinesLoading } = useQuery<Routine[]>({
    queryKey: ["/api/routines"],
    enabled: isAuthenticated,
  });

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      startDatetime: "",
      endDatetime: "",
      location: "",
      notes: "",
      classTypeId: "",
      routineId: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        ...data,
        startDatetime: new Date(data.startDatetime).toISOString(),
        endDatetime: new Date(data.endDatetime).toISOString(),
      };
      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Event created successfully",
      });
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
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventsByDate = (date: Date) => {
    if (!events) return [];
    const dateStr = date.toDateString();
    return events.filter(event => 
      new Date(event.startDatetime).toDateString() === dateStr
    );
  };

  const getDayEvents = () => {
    return getEventsByDate(selectedDate);
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      'bg-primary/10 text-primary border-primary',
      'bg-fitness-600/10 text-fitness-600 border-fitness-600',
      'bg-red-500/10 text-red-600 border-red-500',
      'bg-yellow-500/10 text-yellow-600 border-yellow-500',
      'bg-purple-500/10 text-purple-600 border-purple-500',
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="lg:col-span-2 h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="calendar-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar & Scheduling</h1>
          <p className="text-gray-600 mt-1">Manage your class schedule and events</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-event">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} data-testid="input-event-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDatetime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            data-testid="input-event-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDatetime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field} 
                            data-testid="input-event-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event-class-type">
                              <SelectValue placeholder="Select class type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No class type</SelectItem>
                            {classTypes?.map((classType) => (
                              <SelectItem key={classType.id} value={classType.id}>
                                {classType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="routineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routine</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-event-routine">
                              <SelectValue placeholder="Select routine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No routine</SelectItem>
                            {routines?.map((routine) => (
                              <SelectItem key={routine.id} value={routine.id}>
                                {routine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Studio A, Gym, Online, etc." 
                          {...field} 
                          data-testid="input-event-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-event"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createEventMutation.isPending}
                    data-testid="button-create-event"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mini Calendar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                <div className="text-center p-1">Su</div>
                <div className="text-center p-1">Mo</div>
                <div className="text-center p-1">Tu</div>
                <div className="text-center p-1">We</div>
                <div className="text-center p-1">Th</div>
                <div className="text-center p-1">Fr</div>
                <div className="text-center p-1">Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay() + i);
                  
                  const isCurrentMonth = startDate.getMonth() === selectedDate.getMonth();
                  const isToday = startDate.toDateString() === new Date().toDateString();
                  const isSelected = startDate.toDateString() === selectedDate.toDateString();
                  const hasEvents = getEventsByDate(startDate).length > 0;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(startDate)}
                      className={`
                        p-1 text-xs rounded hover:bg-gray-100 transition-colors relative
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isToday ? 'bg-primary text-primary-foreground' : ''}
                        ${isSelected && !isToday ? 'bg-gray-200' : ''}
                      `}
                      data-testid={`calendar-date-${startDate.toISOString().split('T')[0]}`}
                    >
                      {startDate.getDate()}
                      {hasEvents && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-fitness-600 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Events */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {formatDate(selectedDate.toISOString())}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {getDayEvents().length > 0 ? (
                    getDayEvents().map((event, index) => (
                      <div 
                        key={event.id}
                        className={`p-4 rounded-lg border-l-4 ${getColorForIndex(index)}`}
                        data-testid={`event-item-${event.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2" data-testid={`event-title-${event.id}`}>
                              {event.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span data-testid={`event-time-${event.id}`}>
                                  {formatTime(event.startDatetime)} - {formatTime(event.endDatetime)}
                                </span>
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span data-testid={`event-location-${event.id}`}>
                                    {event.location}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {event.classType && (
                                <Badge variant="outline" data-testid={`event-class-type-${event.id}`}>
                                  {event.classType.name}
                                </Badge>
                              )}
                              {event.routine && (
                                <Badge variant="outline" data-testid={`event-routine-${event.id}`}>
                                  {event.routine.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12" data-testid="text-no-events">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg text-gray-500">No events scheduled</p>
                      <p className="text-sm text-gray-400">Add an event to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
