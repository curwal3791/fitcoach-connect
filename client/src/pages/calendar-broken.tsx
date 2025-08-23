import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, MapPin, Clock, Edit, Trash2 } from "lucide-react";
import { ClassEnrollment } from "@/components/class-enrollment";
import { 
  type CalendarEvent, 
  type ClassType,
  type Routine,
} from "@shared/schema";
import { CalendarEventForm } from "@/components/calendar-event-form";

type EventFormData = {
  classTypeId: string;
  routineId?: string;
  eventDate: string;
  startHour: string;
  startMinute: string;
  duration: string;
  location?: string;
  notes?: string;
};

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      // Get the selected class type for the title
      const selectedClassType = classTypes?.find(ct => ct.id === data.classTypeId);
      const title = selectedClassType?.name || "Fitness Class";
      
      // Calculate start and end times
      const startTime = `${data.startHour}:${data.startMinute}`;
      const startDateTime = new Date(`${data.eventDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (parseInt(data.duration) * 60 * 1000));
      
      const eventData = {
        title,
        classTypeId: data.classTypeId || null,
        routineId: (data.routineId && data.routineId !== "none") ? data.routineId : null,
        startDatetime: startDateTime.toISOString(),
        endDatetime: endDateTime.toISOString(),
        location: data.location || null,
        notes: data.notes || null,
        isRecurring: false,
        recurrencePattern: null,
      };
      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setIsCreateDialogOpen(false);
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

  const handleFormSubmit = (data: EventFormData) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventFormData }) => {
      // Get the selected class type for the title
      const selectedClassType = classTypes?.find(ct => ct.id === data.classTypeId);
      const title = selectedClassType?.name || "Fitness Class";
      
      // Calculate start and end times
      const startTime = `${data.startHour}:${data.startMinute}`;
      const startDateTime = new Date(`${data.eventDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (parseInt(data.duration) * 60 * 1000));
      
      const eventData = {
        title,
        classTypeId: data.classTypeId || null,
        routineId: (data.routineId && data.routineId !== "none") ? data.routineId : null,
        startDatetime: startDateTime.toISOString(),
        endDatetime: endDateTime.toISOString(),
        location: data.location || null,
        notes: data.notes || null,
        isRecurring: false,
        recurrencePattern: null,
      };
      const response = await apiRequest("PUT", `/api/calendar/events/${id}`, eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully",
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
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/calendar/events/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
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
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    const startDate = new Date(event.startDatetime);
    setSelectedDate(startDate);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(id);
    }
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

  // Helper function for quick scheduling
  const handleQuickSchedule = (date: Date, startHour: number = 9) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
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
              <DialogTitle>Schedule Class</DialogTitle>
            </DialogHeader>
            <CalendarEventForm
              classTypes={classTypes}
              routines={routines}
              selectedDate={selectedDate}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createEventMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            {editingEvent && (
              <CalendarEventForm
                classTypes={classTypes}
                routines={routines}
                selectedDate={selectedDate}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingEvent(null);
                }}
                isLoading={updateEventMutation.isPending}
                editingEvent={editingEvent}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                      onDoubleClick={() => handleQuickSchedule(startDate)}
                      className={`
                        p-1 text-xs rounded hover:bg-gray-100 transition-colors relative
                        ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                        ${isToday ? 'bg-primary text-primary-foreground' : ''}
                        ${isSelected && !isToday ? 'bg-gray-200' : ''}
                      `}
                      data-testid={`calendar-date-${startDate.toISOString().split('T')[0]}`}
                      title="Double-click to quickly schedule a class"
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

        {/* Upcoming Classes List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events && events
                    .filter(event => new Date(event.startDatetime) > new Date())
                    .slice(0, 8)
                    .map((event, index) => (
                      <div 
                        key={event.id}
                        className={`p-3 rounded-lg border-l-4 ${getColorForIndex(index)} hover:bg-gray-50 transition-colors cursor-pointer`}
                        onClick={() => setSelectedDate(new Date(event.startDatetime))}
                        data-testid={`upcoming-event-${event.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm" data-testid={`event-title-${event.id}`}>
                              {event.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-600 mt-1">
                              <span>
                                {formatTime(event.startDatetime.toString())}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDate(event.startDatetime.toString())}
                              </span>
                              {event.location && (
                                <>
                                  <span>•</span>
                                  <span>{event.location}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-2">
                              {event.classType && (
                                <Badge variant="outline" className="text-xs" data-testid={`event-class-type-${event.id}`}>
                                  {event.classType.name}
                                </Badge>
                              )}
                              {event.routine && (
                                <Badge variant="outline" className="text-xs" data-testid={`event-routine-${event.id}`}>
                                  {event.routine.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <ClassEnrollment 
                              eventId={event.id} 
                              eventTitle={event.title}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              data-testid={`button-edit-upcoming-${event.id}`}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              data-testid={`button-delete-upcoming-${event.id}`}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                  {events && events.filter(event => new Date(event.startDatetime) > new Date()).length === 0 && (
                    <div className="text-center py-8">
                      <CalendarIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500">No upcoming classes scheduled</p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setIsCreateDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Your First Class
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Day Events */}
      <div className="mb-8">
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
                                {formatTime(event.startDatetime.toString())} - {formatTime(event.endDatetime.toString())}
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
                          <div className="flex items-center justify-between">
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
                            <div className="flex space-x-1">
                              <ClassEnrollment 
                                eventId={event.id} 
                                eventTitle={event.title}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditEvent(event)}
                                data-testid={`button-edit-event-${event.id}`}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteEvent(event.id)}
                                data-testid={`button-delete-event-${event.id}`}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No events scheduled for this day</p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => setIsCreateDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event for {formatDate(selectedDate.toISOString())}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Calendar;
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
                                  {formatTime(event.startDatetime.toString())} - {formatTime(event.endDatetime.toString())}
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
                            <div className="flex items-center justify-between">
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
                              <div className="flex space-x-1">
                                <ClassEnrollment 
                                  eventId={event.id} 
                                  eventTitle={event.title}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditEvent(event)}
                                  data-testid={`button-edit-event-${event.id}`}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteEvent(event.id)}
                                  data-testid={`button-delete-event-${event.id}`}
                                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12" data-testid="text-no-events">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg text-gray-500">No events scheduled</p>
                      <p className="text-sm text-gray-400 mb-6">Schedule a class for this day</p>
                      
                      <Button
                        onClick={() => handleQuickSchedule(selectedDate)}
                        className="bg-primary hover:bg-primary/90 mb-4"
                        data-testid="button-add-event-empty-day"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
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
