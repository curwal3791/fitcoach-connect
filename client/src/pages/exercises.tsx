import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import ExerciseCard from "@/components/exercise-card";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExerciseSchema, type Exercise, type InsertExercise, type ClassType } from "@shared/schema";
import { z } from "zod";

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  description: z.string().optional(),
  difficultyLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
  category: z.enum(["strength", "cardio", "flexibility", "balance", "sports", "rehabilitation"]),
  equipmentNeeded: z.string().nullable().optional(),
  primaryMuscles: z.string().nullable().optional(),
  secondaryMuscles: z.string().nullable().optional(),
  modifications: z.string().optional(),
  safetyNotes: z.string().optional(),
  classTypeId: z.string().optional(),
  isPublic: z.boolean().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export default function Exercises() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    difficulty: "all",
    equipment: "all",
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const { data: exercises, isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.category && filters.category !== 'all') searchParams.append('category', filters.category);
      if (filters.difficulty && filters.difficulty !== 'all') searchParams.append('difficulty', filters.difficulty);
      if (filters.equipment && filters.equipment !== 'all') searchParams.append('equipment', filters.equipment);
      
      const url = `/api/exercises${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      return response.json();
    },
    enabled: isAuthenticated,
  });

  const { data: classTypes, isLoading: classTypesLoading } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    enabled: isAuthenticated,
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
      // Convert "none" to null for the API
      const processedData = {
        ...data,
        classTypeId: data.classTypeId === "none" ? null : data.classTypeId
      };
      const response = await apiRequest("POST", "/api/exercises", processedData);
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

  const onSubmit = (data: ExerciseFormData) => {
    createExerciseMutation.mutate(data);
  };

  const handleAddToRoutine = (exercise: Exercise) => {
    // TODO: Implement add to routine functionality
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
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="exercises-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exercise Database</h1>
          <p className="text-gray-600 mt-1">Browse and manage your exercise library</p>
        </div>
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
                              classTypes.map((classType) => (
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

                <FormField
                  control={form.control}
                  name="primaryMuscles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Muscles</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Chest, Shoulders" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-exercise-muscles"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
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
  );
}
