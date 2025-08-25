import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExerciseSchema, type Exercise, type ClassType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import ExerciseCard from "@/components/exercise-card";

const exerciseFormSchema = insertExerciseSchema.pick({
  name: true,
  description: true,
  difficultyLevel: true,
  category: true,
  equipmentNeeded: true,
  primaryMuscles: true,
  secondaryMuscles: true,
  modifications: true,
  safetyNotes: true,
  classTypeId: true,
  isPublic: true,
}).extend({
  classTypeId: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export default function Exercises() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    equipment: "all",
    classType: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isFixing, setIsFixing] = useState(false);

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

  // Fetch exercises with filters - force fresh data for production
  const { data: exercises, isLoading: exercisesLoading, refetch: refetchExercises } = useQuery({
    queryKey: ["/api/exercises", filters],
    enabled: isAuthenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.category !== "all") params.append("category", filters.category);
      if (filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      if (filters.equipment !== "all") params.append("equipment", filters.equipment);
      if (filters.classType !== "all") params.append("classType", filters.classType);
      // Force cache-busting for production
      params.append("_t", Date.now().toString());
      
      return fetch(`/api/exercises?${params.toString()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }).then(res => res.json());
    },
  });

  // Fetch class types for the dropdown - force fresh data
  const { data: classTypes = [] } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    enabled: isAuthenticated,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      difficultyLevel: "Beginner",
      category: "strength",
      equipmentNeeded: "",
      primaryMuscles: "",
      secondaryMuscles: "",
      modifications: "",
      safetyNotes: "",
      classTypeId: "none",
      isPublic: false,
    },
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      const processedData = {
        ...data,
        classTypeId: data.classTypeId === "none" ? null : data.classTypeId
      };
      const response = await apiRequest("/api/exercises", { method: "POST", body: JSON.stringify(processedData), headers: { "Content-Type": "application/json" } });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Exercise created successfully",
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
        description: "Failed to create exercise",
        variant: "destructive",
      });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExerciseFormData }) => {
      const processedData = {
        ...data,
        classTypeId: data.classTypeId === "none" ? null : data.classTypeId
      };
      const response = await apiRequest(`/api/exercises/${id}`, { method: "PUT", body: JSON.stringify(processedData), headers: { "Content-Type": "application/json" } });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsEditDialogOpen(false);
      setSelectedExercise(null);
      form.reset();
      toast({
        title: "Success",
        description: "Exercise updated successfully",
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
        description: "Failed to update exercise",
        variant: "destructive",
      });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/exercises/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsDeleteDialogOpen(false);
      setSelectedExercise(null);
      toast({
        title: "Success",
        description: "Exercise deleted successfully",
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
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    },
  });

  // Fix exercises mutation for production
  const fixExercisesMutation = useMutation({
    mutationFn: () => apiRequest("/api/fix-exercises", {
      method: "POST",
    }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsFixing(false);
      toast({
        title: "Success",
        description: data.message || "Exercises fixed successfully!",
      });
    },
    onError: (error) => {
      setIsFixing(false);
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
        description: "Failed to fix exercises",
        variant: "destructive",
      });
    },
  });

  const handleFixExercises = () => {
    setIsFixing(true);
    fixExercisesMutation.mutate();
  };

  const onSubmit = (data: ExerciseFormData) => {
    if (selectedExercise) {
      updateExerciseMutation.mutate({ id: selectedExercise.id, data });
    } else {
      createExerciseMutation.mutate(data);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    form.reset({
      name: exercise.name,
      description: exercise.description || "",
      difficultyLevel: exercise.difficultyLevel,
      category: exercise.category,
      equipmentNeeded: exercise.equipmentNeeded || "",
      primaryMuscles: exercise.primaryMuscles || "",
      secondaryMuscles: exercise.secondaryMuscles || "",
      modifications: exercise.modifications || "",
      safetyNotes: exercise.safetyNotes || "",
      classTypeId: exercise.classTypeId || "none",
      isPublic: exercise.isPublic || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedExercise) {
      deleteExerciseMutation.mutate(selectedExercise.id);
    }
  };

  const handleAddToRoutine = (exercise: Exercise) => {
    toast({
      title: "Feature Coming Soon",
      description: "Add to routine functionality will be available soon",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-32 w-full mb-8" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="exercises-page">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exercise Database</h1>
            <p className="text-gray-600 mt-1">Browse and manage your exercise library</p>
          </div>
          <div className="flex gap-2">
            {exercises && !exercisesLoading && exercises.length < 80 && (
              <Button 
                onClick={handleFixExercises}
                disabled={isFixing}
                variant="outline"
                className="bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700"
                data-testid="button-fix-exercises"
              >
                {isFixing ? "Fixing..." : "Fix Missing Exercises"}
              </Button>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="button-add-exercise">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Exercise</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter exercise name" {...field} data-testid="input-exercise-name" />
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
                            placeholder="Describe the exercise..." 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-exercise-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-exercise-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="strength">Strength</SelectItem>
                              <SelectItem value="cardio">Cardio</SelectItem>
                              <SelectItem value="flexibility">Flexibility</SelectItem>
                              <SelectItem value="balance">Balance</SelectItem>
                              <SelectItem value="sports">Sports</SelectItem>
                              <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-exercise-class-type">
                                <SelectValue placeholder="Select class type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No specific class</SelectItem>
                              {classTypes && classTypes.length > 0 ? (
                                classTypes.map((classType: ClassType) => (
                                  <SelectItem key={classType.id} value={classType.id}>
                                    {classType.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-types" disabled>No class types available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficultyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-exercise-difficulty">
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="equipmentNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Needed</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Dumbbells, No Equipment" 
                            {...field} 
                            value={field.value || ""}
                            data-testid="input-exercise-equipment"
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
                      data-testid="button-cancel-exercise"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createExerciseMutation.isPending}
                      data-testid="button-save-exercise"
                    >
                      {createExerciseMutation.isPending ? "Creating..." : "Create Exercise"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Search exercises..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                    data-testid="input-search-exercises"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="balance">Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={filters.difficulty} onValueChange={(value) => setFilters({ ...filters, difficulty: value })}>
                  <SelectTrigger data-testid="select-filter-difficulty">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="equipment">Equipment</Label>
                <Select value={filters.equipment} onValueChange={(value) => setFilters({ ...filters, equipment: value })}>
                  <SelectTrigger data-testid="select-filter-equipment">
                    <SelectValue placeholder="Any Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Equipment</SelectItem>
                    <SelectItem value="No Equipment">No Equipment</SelectItem>
                    <SelectItem value="Dumbbells">Dumbbells</SelectItem>
                    <SelectItem value="Resistance Bands">Resistance Bands</SelectItem>
                    <SelectItem value="Mat">Mat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="classType">Class Type</Label>
                <Select value={filters.classType} onValueChange={(value) => setFilters({ ...filters, classType: value })}>
                  <SelectTrigger data-testid="select-filter-class-type">
                    <SelectValue placeholder="All Class Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Class Types</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    {classTypes && classTypes.length > 0 ? (
                      classTypes.map((classType: ClassType) => (
                        <SelectItem key={classType.id} value={classType.id}>
                          {classType.name}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercise Grid */}
        {exercisesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : exercises && exercises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="exercises-grid">
            {exercises.map((exercise: Exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddToRoutine={handleAddToRoutine}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12" data-testid="text-no-exercises">
            <div className="text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No exercises found</p>
              <p className="text-sm">Try adjusting your search filters or create a new exercise.</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter exercise name" {...field} data-testid="input-edit-exercise-name" />
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
                        placeholder="Describe the exercise..." 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-edit-exercise-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-exercise-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="cardio">Cardio</SelectItem>
                          <SelectItem value="flexibility">Flexibility</SelectItem>
                          <SelectItem value="balance">Balance</SelectItem>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-exercise-class-type">
                            <SelectValue placeholder="Select class type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No specific class</SelectItem>
                          {classTypes && classTypes.length > 0 ? (
                            classTypes.map((classType: ClassType) => (
                              <SelectItem key={classType.id} value={classType.id}>
                                {classType.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-types" disabled>No class types available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-exercise-difficulty">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="equipmentNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Needed</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Dumbbells, No Equipment" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-edit-exercise-equipment"
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
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedExercise(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-edit-exercise"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateExerciseMutation.isPending}
                  data-testid="button-update-exercise"
                >
                  {updateExerciseMutation.isPending ? "Updating..." : "Update Exercise"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedExercise?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedExercise(null);
              }}
              data-testid="button-cancel-delete-exercise"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteExerciseMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-exercise"
            >
              {deleteExerciseMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </>
  );
}