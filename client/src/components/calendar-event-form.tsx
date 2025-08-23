import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type ClassType, type Routine, type CalendarEvent } from "@shared/schema";

const eventFormSchema = z.object({
  classTypeId: z.string().min(1, "Class type is required"),
  routineId: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  startHour: z.string().min(1, "Start hour is required"),
  startMinute: z.string().min(1, "Start minute is required"),
  duration: z.string().min(1, "Duration is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface CalendarEventFormProps {
  classTypes: ClassType[] | undefined;
  routines: Routine[] | undefined;
  selectedDate: Date;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  editingEvent?: CalendarEvent | null;
}

export function CalendarEventForm({ 
  classTypes, 
  routines, 
  selectedDate, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  editingEvent = null
}: CalendarEventFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      classTypeId: "",
      routineId: "none",
      eventDate: selectedDate.toISOString().split('T')[0],
      startHour: "09",
      startMinute: "00",
      duration: "60",
      location: "",
      notes: "",
    },
  });

  // Update form when editing event or date changes
  React.useEffect(() => {
    if (editingEvent) {
      const startDate = new Date(editingEvent.startDatetime);
      const endDate = new Date(editingEvent.endDatetime);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (60 * 1000));
      
      form.reset({
        classTypeId: editingEvent.classTypeId || "",
        routineId: editingEvent.routineId || "none",
        eventDate: startDate.toISOString().split('T')[0],
        startHour: startDate.getHours().toString().padStart(2, '0'),
        startMinute: startDate.getMinutes().toString().padStart(2, '0'),
        duration: duration.toString(),
        location: editingEvent.location || "",
        notes: editingEvent.notes || "",
      });
    } else {
      form.setValue('eventDate', selectedDate.toISOString().split('T')[0]);
    }
  }, [selectedDate, editingEvent, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="classTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-class-type">
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
              <FormLabel>Routine (Optional)</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-routine">
                    <SelectValue placeholder="Select a routine" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No routine</SelectItem>
                  {routines?.map((routine) => (
                    <SelectItem key={routine.id} value={routine.id}>
                      {routine.name} {routine.totalDuration ? `(${Math.round(routine.totalDuration / 60)} min)` : ''}
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
          name="eventDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  data-testid="input-event-date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="startHour"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hour</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-start-hour">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
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
            name="startMinute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minute</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-start-minute">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['00', '15', '30', '45'].map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
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
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="75">1h 15m</SelectItem>
                    <SelectItem value="90">1h 30m</SelectItem>
                    <SelectItem value="105">1h 45m</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="150">2h 30m</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
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
              <FormLabel>Location (Optional)</FormLabel>
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Additional notes..." 
                  {...field} 
                  data-testid="input-event-notes" 
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
            onClick={onCancel}
            data-testid="button-cancel-event"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            data-testid="button-create-event"
          >
            {isLoading ? (editingEvent ? "Updating..." : "Creating...") : (editingEvent ? "Update Event" : "Create Event")}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CalendarEventForm;