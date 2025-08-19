import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { type ClassType, type Routine } from "@shared/schema";

const eventFormSchema = z.object({
  classTypeId: z.string().min(1, "Class type is required"),
  routineId: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required"),
  startTime: z.string().min(1, "Start time is required"),
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
}

export function CalendarEventForm({ 
  classTypes, 
  routines, 
  selectedDate, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CalendarEventFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      classTypeId: "",
      routineId: "none",
      eventDate: selectedDate.toISOString().split('T')[0],
      startTime: "09:00",
      duration: "60",
      location: "",
      notes: "",
    },
  });

  // Update date when selectedDate changes
  React.useEffect(() => {
    form.setValue('eventDate', selectedDate.toISOString().split('T')[0]);
  }, [selectedDate, form]);

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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input 
                    type="time" 
                    {...field} 
                    data-testid="input-start-time"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="15"
                    max="180"
                    step="15"
                    placeholder="60" 
                    {...field} 
                    data-testid="input-duration"
                  />
                </FormControl>
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
            {isLoading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}