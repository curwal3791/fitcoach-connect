import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Calendar, TrendingUp, Settings, Play, Target, Brain, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Program, ClassType, ProgramSession, ProgramEnrollment, Client } from "@shared/schema";

// Form schemas
const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  goal: z.string().min(1, "Goal is required"),
  durationWeeks: z.number().min(1, "Duration must be at least 1 week").max(52, "Duration cannot exceed 52 weeks"),
  classTypeId: z.string().optional(),
});

const sessionSchema = z.object({
  weekNumber: z.number().min(1, "Week number is required"),
  dayOfWeek: z.number().min(0, "Day of week is required").max(6, "Invalid day of week"),
  sessionName: z.string().min(1, "Session name is required"),
  routineId: z.string().optional(),
  baseParams: z.object({
    reps: z.number().optional(),
    time: z.number().optional(),
    weight: z.number().optional(),
    rpe: z.number().min(1).max(10).optional(),
  }).optional(),
  progressionRule: z.object({
    type: z.enum(["linear", "percentage", "rpe_based"]),
    param: z.enum(["reps", "time", "weight"]),
    increment: z.number(),
    floor: z.number().optional(),
    ceiling: z.number().optional(),
    deloadEvery: z.number().optional(),
    deloadPct: z.number().optional(),
  }).optional(),
});

type ProgramForm = z.infer<typeof programSchema>;
type SessionForm = z.infer<typeof sessionSchema>;

const GOAL_OPTIONS = [
  { value: "strength", label: "Strength Building", icon: "💪" },
  { value: "endurance", label: "Endurance Training", icon: "🏃" },
  { value: "weight_loss", label: "Weight Loss", icon: "⚖️" },
  { value: "flexibility", label: "Flexibility & Mobility", icon: "🧘" },
  { value: "general_fitness", label: "General Fitness", icon: "🏋️" },
];

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const PROGRESSION_TYPES = [
  { value: "linear", label: "Linear Progression", description: "Add consistent amounts each week" },
  { value: "percentage", label: "Percentage-based", description: "Increase by percentage each week" },
  { value: "rpe_based", label: "RPE-based", description: "Auto-adjust based on client feedback" },
];

export default function Programs() {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch programs
  const { data: programs = [], isLoading: programsLoading } = useQuery<(Program & { classType?: ClassType; enrollmentCount: number })[]>({
    queryKey: ['/api/programs'],
  });

  // Fetch class types for program creation
  const { data: classTypes = [] } = useQuery<ClassType[]>({
    queryKey: ['/api/class-types'],
  });

  // Fetch routines for session creation
  const { data: routines = [] } = useQuery({
    queryKey: ['/api/routines'],
  });

  // Fetch selected program details
  const { data: programDetails } = useQuery<Program & { sessions?: ProgramSession[] }>({
    queryKey: ['/api/programs', selectedProgram],
    enabled: !!selectedProgram,
  });

  // Fetch program enrollments
  const { data: enrollments = [] } = useQuery<(ProgramEnrollment & { client?: Client })[]>({
    queryKey: ['/api/programs', selectedProgram, 'enrollments'],
    enabled: !!selectedProgram,
  });

  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: ProgramForm) => {
      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create program');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Program created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive",
      });
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionForm) => {
      const response = await fetch(`/api/programs/${selectedProgram}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs', selectedProgram] });
      setShowSessionDialog(false);
      toast({
        title: "Success",
        description: "Session added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    },
  });

  // Generate schedule mutation
  const generateScheduleMutation = useMutation({
    mutationFn: async (weeks: number) => {
      const response = await fetch(`/api/programs/${selectedProgram}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks }),
      });
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Schedule generated and added to calendar",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate schedule",
        variant: "destructive",
      });
    },
  });

  // Forms
  const programForm = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      durationWeeks: 4,
      classTypeId: "",
    },
  });

  const sessionForm = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      weekNumber: 1,
      dayOfWeek: 1,
      sessionName: "",
      routineId: "",
      baseParams: {
        reps: 10,
        time: 60,
        weight: 0,
        rpe: 7,
      },
      progressionRule: {
        type: "linear",
        param: "reps",
        increment: 1,
        floor: 8,
        ceiling: 15,
        deloadEvery: 4,
        deloadPct: 0.1,
      },
    },
  });

  const onCreateProgram = (data: ProgramForm) => {
    createProgramMutation.mutate(data);
  };

  const onCreateSession = (data: SessionForm) => {
    createSessionMutation.mutate(data);
  };

  const handleGenerateSchedule = () => {
    if (programDetails && 'durationWeeks' in programDetails) {
      generateScheduleMutation.mutate(programDetails.durationWeeks);
    }
  };

  if (programsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Adaptive Program Builder</h1>
          <p className="text-muted-foreground">Create and manage multi-week training programs with automatic progression</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-program">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>
                Design a multi-week training program with automatic progression
              </DialogDescription>
            </DialogHeader>
            <Form {...programForm}>
              <form onSubmit={programForm.handleSubmit(onCreateProgram)} className="space-y-4">
                <FormField
                  control={programForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input placeholder="8-Week Strength Builder" {...field} data-testid="input-program-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={programForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Progressive strength training program designed to build muscle and increase overall strength..."
                          {...field} 
                          data-testid="input-program-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={programForm.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Goal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-program-goal">
                            <SelectValue placeholder="Select training goal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GOAL_OPTIONS.map((goal) => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.icon} {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={programForm.control}
                    name="durationWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (weeks)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="52"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-program-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={programForm.control}
                    name="classTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-program-class-type">
                              <SelectValue placeholder="Select class type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classTypes.map((classType) => (
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
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-program"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProgramMutation.isPending}
                    data-testid="button-save-program"
                  >
                    {createProgramMutation.isPending ? "Creating..." : "Create Program"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Programs Grid */}
      {!selectedProgram ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <Card 
              key={program.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProgram(program.id)}
              data-testid={`card-program-${program.id}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {program.durationWeeks} weeks • {program.goal?.replace('_', ' ')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <Brain className="h-3 w-3 mr-1" />
                      Smart
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {program.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{program.enrollmentCount} enrolled</span>
                      </div>
                      {program.classType && (
                        <Badge variant="outline" className="text-xs">
                          {program.classType.name}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 px-2">
                      <TrendingUp className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {programs.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No programs created yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first adaptive program to get started with automated progression training
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-program">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Program
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Program Details View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProgram(null)}
              data-testid="button-back-to-programs"
            >
              ← Back to Programs
            </Button>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleGenerateSchedule}
                disabled={generateScheduleMutation.isPending}
                data-testid="button-generate-schedule"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {generateScheduleMutation.isPending ? "Generating..." : "Generate Schedule"}
              </Button>
              <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-session">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add Training Session</DialogTitle>
                    <DialogDescription>
                      Configure a session with progression rules and target parameters
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...sessionForm}>
                    <form onSubmit={sessionForm.handleSubmit(onCreateSession)} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={sessionForm.control}
                          name="weekNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Week</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="input-session-week"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sessionForm.control}
                          name="dayOfWeek"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Day</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-session-day">
                                    <SelectValue placeholder="Day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {DAYS_OF_WEEK.map((day, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={sessionForm.control}
                          name="sessionName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Session Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Upper Body" {...field} data-testid="input-session-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={sessionForm.control}
                        name="routineId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Routine (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-session-routine">
                                  <SelectValue placeholder="Select routine" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(routines) && routines.map((routine: any) => (
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

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Base Parameters</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <FormField
                            control={sessionForm.control}
                            name="baseParams.reps"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reps</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-base-reps"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sessionForm.control}
                            name="baseParams.time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time (s)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-base-time"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sessionForm.control}
                            name="baseParams.weight"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-base-weight"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sessionForm.control}
                            name="baseParams.rpe"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Target RPE</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    max="10"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-base-rpe"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="font-medium">Progression Rules</h4>
                        <FormField
                          control={sessionForm.control}
                          name="progressionRule.type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Progression Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-progression-type">
                                    <SelectValue placeholder="Select progression type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PROGRESSION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div>
                                        <div className="font-medium">{type.label}</div>
                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={sessionForm.control}
                            name="progressionRule.param"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Parameter to Progress</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-progression-param">
                                      <SelectValue placeholder="Select parameter" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="reps">Reps</SelectItem>
                                    <SelectItem value="time">Time</SelectItem>
                                    <SelectItem value="weight">Weight</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sessionForm.control}
                            name="progressionRule.increment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Increment</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    data-testid="input-progression-increment"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={sessionForm.control}
                            name="progressionRule.floor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Value</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-progression-floor"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={sessionForm.control}
                            name="progressionRule.ceiling"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Value</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-progression-ceiling"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowSessionDialog(false)}
                          data-testid="button-cancel-session"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createSessionMutation.isPending}
                          data-testid="button-save-session"
                        >
                          {createSessionMutation.isPending ? "Adding..." : "Add Session"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {programDetails && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl">{programDetails.name}</CardTitle>
                    <CardDescription>
                      {programDetails.durationWeeks} weeks • {programDetails.goal?.replace('_', ' ')} • {enrollments.length} enrolled
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      <Brain className="h-4 w-4 mr-1" />
                      Adaptive
                    </Badge>
                    <Badge variant="outline">
                      <Zap className="h-4 w-4 mr-1" />
                      Auto-Progression
                    </Badge>
                  </div>
                </div>
                {programDetails.description && (
                  <p className="text-muted-foreground mt-2">{programDetails.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                    <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="enrollments" data-testid="tab-enrollments">Enrollments</TabsTrigger>
                    <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{programDetails.sessions?.length || 0}</div>
                          <p className="text-xs text-muted-foreground">Across {programDetails.durationWeeks} weeks</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{enrollments.filter(e => e.isActive).length}</div>
                          <p className="text-xs text-muted-foreground">Currently training</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Progression Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">Smart</div>
                          <p className="text-xs text-muted-foreground">RPE-based adaptation</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions" className="space-y-4">
                    <div className="space-y-4">
                      {programDetails.sessions?.map((session: any, index: number) => (
                        <Card key={session.id} data-testid={`card-session-${session.id}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">
                                  Week {session.weekNumber} - {session.sessionName}
                                </CardTitle>
                                <CardDescription>
                                  {DAYS_OF_WEEK[session.dayOfWeek]} • {session.routine?.name || 'No routine assigned'}
                                </CardDescription>
                              </div>
                              <Badge variant="outline">
                                {session.progressionRule?.type || 'linear'} progression
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {session.baseParams && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Base Parameters</h4>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  {session.baseParams.reps && (
                                    <div>
                                      <span className="text-muted-foreground">Reps:</span> {session.baseParams.reps}
                                    </div>
                                  )}
                                  {session.baseParams.time && (
                                    <div>
                                      <span className="text-muted-foreground">Time:</span> {session.baseParams.time}s
                                    </div>
                                  )}
                                  {session.baseParams.weight && (
                                    <div>
                                      <span className="text-muted-foreground">Weight:</span> {session.baseParams.weight}
                                    </div>
                                  )}
                                  {session.baseParams.rpe && (
                                    <div>
                                      <span className="text-muted-foreground">RPE:</span> {session.baseParams.rpe}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {session.progressionRule && (
                              <div className="mt-4 space-y-2">
                                <h4 className="font-medium text-sm">Progression Rule</h4>
                                <div className="text-sm text-muted-foreground">
                                  Increase {session.progressionRule.param} by {session.progressionRule.increment} 
                                  {session.progressionRule.floor && ` (min: ${session.progressionRule.floor})`}
                                  {session.progressionRule.ceiling && ` (max: ${session.progressionRule.ceiling})`}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}

                      {(!programDetails.sessions || programDetails.sessions.length === 0) && (
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Target className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No sessions configured</h3>
                            <p className="text-muted-foreground text-center mb-4">
                              Add training sessions to define your program structure
                            </p>
                            <Button onClick={() => setShowSessionDialog(true)} data-testid="button-add-first-session">
                              <Plus className="h-4 w-4 mr-2" />
                              Add First Session
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="enrollments" className="space-y-4">
                    <div className="space-y-4">
                      {enrollments.map((enrollment) => (
                        <Card key={enrollment.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">
                                  {enrollment.client ? `${enrollment.client.firstName} ${enrollment.client.lastName}` : 'Group Enrollment'}
                                </CardTitle>
                                <CardDescription>
                                  Started {new Date(enrollment.startDate).toLocaleDateString()} • Week {enrollment.currentWeek} of {programDetails.durationWeeks}
                                </CardDescription>
                              </div>
                              <Badge variant={enrollment.isActive ? "default" : "secondary"}>
                                {enrollment.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}

                      {enrollments.length === 0 && (
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No enrollments yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                              Enroll clients in this program to start their adaptive training journey
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Progression Tracking</CardTitle>
                          <CardDescription>Average progression across all enrollments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                            Analytics coming soon
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Readiness Trends</CardTitle>
                          <CardDescription>Client readiness and recovery patterns</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mx-auto mb-2" />
                            Analytics coming soon
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}