import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import RoutineBuilder from "@/components/routine-builder";
import { Plus, Printer, Save, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  insertRoutineSchema, 
  insertRoutineExerciseSchema,
  type Exercise, 
  type Routine, 
  type RoutineExercise,
  type ClassType,
  type InsertRoutine 
} from "@shared/schema";
import { z } from "zod";

const routineFormSchema = insertRoutineSchema.omit({
  id: true,
  createdByUserId: true, 
  createdAt: true,
  updatedAt: true,
  totalDuration: true,
}).extend({
  name: z.string().min(1, "Routine name is required"),
});

type RoutineFormData = z.infer<typeof routineFormSchema>;

export default function Routines() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState("New Routine");
  const [routineClassType, setRoutineClassType] = useState<string>("");
  const [filterClassType, setFilterClassType] = useState<string>("all");

  // Check for stored routine ID from navigation
  useEffect(() => {
    const storedRoutineId = localStorage.getItem('selectedRoutineId');
    if (storedRoutineId) {
      setSelectedRoutineId(storedRoutineId);
      localStorage.removeItem('selectedRoutineId');
    }
  }, []);

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

  const { data: routines, isLoading: routinesLoading } = useQuery<(Routine & { classType?: ClassType; exerciseCount: number })[]>({
    queryKey: ["/api/routines"],
    enabled: isAuthenticated,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
    enabled: isAuthenticated,
  });

  const { data: classTypes, isLoading: classTypesLoading } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    enabled: isAuthenticated,
  });

  const { data: selectedRoutine, isLoading: selectedRoutineLoading } = useQuery({
    queryKey: ["/api/routines", selectedRoutineId],
    enabled: !!selectedRoutineId,
  });

  const form = useForm<RoutineFormData>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      name: "",
      description: "",
      classTypeId: "",
      isPublic: false,
    },
  });

  const createRoutineMutation = useMutation({
    mutationFn: async (data: RoutineFormData) => {
      const response = await apiRequest("POST", "/api/routines", data);
      return response.json();
    },
    onSuccess: (newRoutine) => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      setIsCreateDialogOpen(false);
      setSelectedRoutineId(newRoutine.id);
      setRoutineName(newRoutine.name);
      setRoutineClassType(newRoutine.classTypeId || "");
      form.reset();
      toast({
        title: "Success",
        description: "Routine created successfully",
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
        description: "Failed to create routine",
        variant: "destructive",
      });
    },
  });

  // Check for class type from Classes page navigation
  useEffect(() => {
    const newRoutineClassType = localStorage.getItem('newRoutineClassType');
    if (newRoutineClassType && !createRoutineMutation.isPending) {
      const classTypeInfo = JSON.parse(newRoutineClassType);
      const routineData = {
        name: `New ${classTypeInfo.name} Routine`,
        description: "",
        classTypeId: classTypeInfo.id,
        isPublic: false,
      };
      
      createRoutineMutation.mutate(routineData);
      localStorage.removeItem('newRoutineClassType');
    }
  }, [createRoutineMutation.isPending]);

  const updateRoutineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertRoutine> }) => {
      const response = await apiRequest("PUT", `/api/routines/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      toast({
        title: "Success",
        description: "Routine updated successfully",
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
        description: "Failed to update routine",
        variant: "destructive",
      });
    },
  });

  const addExerciseToRoutineMutation = useMutation({
    mutationFn: async ({ routineId, exerciseId, orderIndex }: { routineId: string; exerciseId: string; orderIndex: number }) => {
      const response = await apiRequest("POST", `/api/routines/${routineId}/exercises`, {
        exerciseId,
        orderIndex,
        durationSeconds: 60,
        repetitions: 15,
        sets: 1,
        restSeconds: 30,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines", selectedRoutineId] });
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
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
        description: "Failed to add exercise to routine",
        variant: "destructive",
      });
    },
  });

  const updateRoutineExerciseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RoutineExercise> }) => {
      const response = await apiRequest("PUT", `/api/routines/${selectedRoutineId}/exercises/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines", selectedRoutineId] });
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
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
    },
  });

  const removeExerciseFromRoutineMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/routines/${selectedRoutineId}/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines", selectedRoutineId] });
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
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
    },
  });

  const onSubmit = (data: RoutineFormData) => {
    createRoutineMutation.mutate(data);
  };

  const handleAddExercise = (exerciseId: string, orderIndex: number) => {
    if (selectedRoutineId) {
      addExerciseToRoutineMutation.mutate({ routineId: selectedRoutineId, exerciseId, orderIndex });
    }
  };

  const handleUpdateExercise = (id: string, data: Partial<RoutineExercise>) => {
    updateRoutineExerciseMutation.mutate({ id, data });
  };

  const handleRemoveExercise = (id: string) => {
    removeExerciseFromRoutineMutation.mutate(id);
  };

  const handleReorderExercises = (exerciseIds: string[]) => {
    // TODO: Implement reorder API call
    toast({
      title: "Feature Coming Soon",
      description: "Exercise reordering will be available soon",
    });
  };

  const handleRoutineNameChange = (name: string) => {
    setRoutineName(name);
    if (selectedRoutineId) {
      updateRoutineMutation.mutate({ id: selectedRoutineId, data: { name } });
    }
  };

  const handleClassTypeChange = (classTypeId: string) => {
    setRoutineClassType(classTypeId);
    if (selectedRoutineId) {
      updateRoutineMutation.mutate({ id: selectedRoutineId, data: { classTypeId } });
    }
  };

  // Filter routines based on selected class type
  const filteredRoutines = routines?.filter(routine => {
    if (filterClassType === "all") return true;
    return routine.classTypeId === filterClassType;
  }) || [];

  const handleSaveRoutine = () => {
    if (selectedRoutineId) {
      updateRoutineMutation.mutate({ 
        id: selectedRoutineId, 
        data: { 
          name: routineName,
          classTypeId: routineClassType || null
        } 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="routines-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Routine Builder</h1>
          <p className="text-gray-600 mt-1">Create and manage your workout routines</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={() => window.print()}
            data-testid="button-print-preview"
          >
            <Printer className="w-4 h-4 mr-2" />
            Printer Preview
          </Button>
          <Button 
            onClick={handleSaveRoutine}
            disabled={!selectedRoutineId}
            data-testid="button-save-routine"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Routine
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-new-routine">
                <Plus className="w-4 h-4 mr-2" />
                New Routine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Routine</DialogTitle>
                <DialogDescription>
                  Create a new workout routine and assign it to a class type.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter routine name" {...field} data-testid="input-routine-name-create" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your routine..." 
                            {...field} 
                            data-testid="input-routine-description"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-routine-class-type">
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

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-routine"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRoutineMutation.isPending}
                      data-testid="button-create-routine"
                    >
                      {createRoutineMutation.isPending ? "Creating..." : "Create Routine"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedRoutineId ? (
        /* Routine List */
        <div>
          {/* Filter Controls */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Label htmlFor="filter-class-type" className="text-sm font-medium">Filter by Class Type:</Label>
              </div>
              <Select value={filterClassType} onValueChange={setFilterClassType}>
                <SelectTrigger className="w-48" id="filter-class-type" data-testid="select-filter-class-type">
                  <SelectValue placeholder="All class types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All class types</SelectItem>
                  {classTypes?.map((classType) => (
                    <SelectItem key={classType.id} value={classType.id}>
                      {classType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-500">
              {routines ? `${filteredRoutines.length} routine${filteredRoutines.length !== 1 ? 's' : ''}` : 'Loading...'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routinesLoading ? (
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : filteredRoutines && filteredRoutines.length > 0 ? (
            filteredRoutines.map((routine) => (
              <Card 
                key={routine.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedRoutineId(routine.id);
                  setRoutineName(routine.name);
                  setRoutineClassType(routine.classTypeId || "");
                }}
                data-testid={`routine-card-${routine.id}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`routine-title-${routine.id}`}>
                      {routine.name}
                    </CardTitle>
                    {routine.classType && (
                      <Badge variant="secondary" className="text-xs">
                        {routine.classType.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {routine.description && (
                    <p className="text-gray-600 text-sm mb-4">{routine.description}</p>
                  )}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{routine.exerciseCount} exercises</span>
                    <span>{Math.round((routine.totalDuration || 0) / 60)} min</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12" data-testid="text-no-routines">
              <div className="text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No routines yet</p>
                <p className="text-sm">Create your first routine to get started!</p>
              </div>
            </div>
          )}
          </div>
        </div>
      ) : (
        /* Routine Builder */
        <div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedRoutineId(null)}
            className="mb-6"
            data-testid="button-back-to-routines"
          >
            ← Back to Routines
          </Button>
          {exercisesLoading || classTypesLoading || selectedRoutineLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <RoutineBuilder
              exercises={exercises || []}
              classTypes={classTypes || []}
              routineExercises={(selectedRoutine as any)?.exercises || []}
              onAddExercise={handleAddExercise}
              onUpdateExercise={handleUpdateExercise}
              onRemoveExercise={handleRemoveExercise}
              onReorderExercises={handleReorderExercises}
              routineName={routineName}
              onRoutineNameChange={handleRoutineNameChange}
              totalDuration={(selectedRoutine as any)?.totalDuration || 0}
              classTypeId={routineClassType}
              onClassTypeChange={handleClassTypeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
