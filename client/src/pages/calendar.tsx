import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Clock, MapPin, Plus, Edit, Trash2, PlayCircle, Monitor } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CalendarEvent, ClassType, Routine } from "@shared/schema";
import CalendarEventForm from "@/components/calendar-event-form";
import ClassEnrollment from "@/components/class-enrollment";
import { useToast } from "@/hooks/use-toast";

// Utility functions
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

function Calendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Fetch data
  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    retry: false,
  });

  const { data: classTypes = [] } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    retry: false,
  });

  const { data: routines = [] } = useQuery<Routine[]>({
    queryKey: ["/api/routines"],
    retry: false,
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest(`/api/calendar/events/${eventData.id}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      // Force refetch of calendar events to ensure UI updates with new data
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      queryClient.refetchQueries({ queryKey: ["/api/calendar/events"] });
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleFormSubmit = (formData: any) => {
    // Process form data to create proper event data structure
    const selectedClassType = classTypes?.find(ct => ct.id === formData.classTypeId);
    const selectedRoutine = routines?.find(r => r.id === formData.routineId);
    
    // Create start datetime from form fields - avoid timezone issues
    const [year, month, day] = formData.eventDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day); // month is 0-indexed
    startDate.setHours(parseInt(formData.startHour), parseInt(formData.startMinute), 0, 0);
    
    // Create end datetime based on duration
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + parseInt(formData.duration));
    
    // Create title from class type and routine (if selected)
    const title = selectedRoutine 
      ? `${selectedClassType?.name || 'Class'}: ${selectedRoutine.name}`
      : selectedClassType?.name || 'Fitness Class';
    
    const eventData = {
      title,
      classTypeId: formData.classTypeId,
      routineId: formData.routineId && formData.routineId !== "none" ? formData.routineId : null,
      startDatetime: startDate.toISOString(),
      endDatetime: endDate.toISOString(),
      location: formData.location || "",
      notes: formData.notes || "",
    };

    if (editingEvent) {
      updateEventMutation.mutate({ ...eventData, id: editingEvent.id });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Utility functions
  const getEventsByDate = (date: Date) => {
    if (!events) return [];
    return events.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.startDatetime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getDayEvents = () => {
    return getEventsByDate(selectedDate);
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      'border-primary bg-primary/10',
      'border-fitness-600 bg-fitness-600/10',
      'border-red-500 bg-red-500/10',
      'border-yellow-500 bg-yellow-500/10',
      'border-purple-500 bg-purple-500/10',
    ];
    return colors[index % colors.length];
  };

  // Helper function for quick scheduling
  const handleQuickSchedule = (date: Date) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const isLoading = eventsLoading || !classTypes || !routines;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
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
                    .filter((event: CalendarEvent) => new Date(event.startDatetime) > new Date())
                    .slice(0, 8)
                    .map((event: CalendarEvent, index: number) => (
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
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/coach-console/${event.id}`);
                              }}
                              data-testid={`button-coach-console-upcoming-${event.id}`}
                              className="h-7 bg-green-600 hover:bg-green-700 text-white px-2"
                              title="Start Class"
                            >
                              <PlayCircle className="w-3 h-3" />
                            </Button>
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
                  {events && events.filter((event: CalendarEvent) => new Date(event.startDatetime) > new Date()).length === 0 && (
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
                                variant="default"
                                onClick={() => navigate(`/coach-console/${event.id}`)}
                                data-testid={`button-coach-console-event-${event.id}`}
                                className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                                title="Start Class"
                              >
                                <Monitor className="w-3 h-3 mr-1" />
                                Coach Console
                              </Button>
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