import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronUp, ChevronDown, Trash2, Plus, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertExerciseSchema, type Exercise, type RoutineExercise, type ClassType } from "@shared/schema";
import { z } from "zod";

const exerciseFormSchema = insertExerciseSchema;

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

interface RoutineBuilderProps {
  exercises: Exercise[];
  classTypes: ClassType[];
  routineExercises: (RoutineExercise & { exercise: Exercise })[];
  onAddExercise: (exerciseId: string, orderIndex: number) => void;
  onUpdateExercise: (id: string, data: Partial<RoutineExercise>) => void;
  onRemoveExercise: (id: string) => void;
  onReorderExercises: (fromIndex: number, toIndex: number) => void;
  routineName: string;
  onRoutineNameChange: (name: string) => void;
  totalDuration: number;
  classTypeId?: string;
  onClassTypeChange: (classTypeId: string) => void;
}

export default function RoutineBuilder({
  exercises,
  classTypes,
  routineExercises,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onReorderExercises,
  routineName,
  onRoutineNameChange,
  totalDuration,
  classTypeId,
  onClassTypeChange,
}: RoutineBuilderProps) {
  // Debug logging - remove after testing
  // console.log("RoutineBuilder classTypes:", classTypes);
  // console.log("RoutineBuilder classTypes length:", classTypes?.length);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isCreateExerciseDialogOpen, setIsCreateExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Local state for debounced input values
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [debounceTimeouts, setDebounceTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounced update function
  const debouncedUpdate = useCallback((exerciseId: string, field: string, value: any) => {
    // Clear existing timeout for this field
    if (debounceTimeouts[`${exerciseId}-${field}`]) {
      clearTimeout(debounceTimeouts[`${exerciseId}-${field}`]);
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      onUpdateExercise(exerciseId, { [field]: value });
      // Clean up timeout reference
      setDebounceTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[`${exerciseId}-${field}`];
        return newTimeouts;
      });
    }, 500); // 500ms debounce

    setDebounceTimeouts(prev => ({
      ...prev,
      [`${exerciseId}-${field}`]: timeoutId
    }));
  }, [onUpdateExercise, debounceTimeouts]);

  // Handle local input changes
  const handleLocalChange = useCallback((exerciseId: string, field: string, value: any) => {
    // Update local state immediately for responsive UI
    setLocalValues(prev => ({
      ...prev,
      [`${exerciseId}-${field}`]: value
    }));
    
    // Trigger debounced API update
    debouncedUpdate(exerciseId, field, value);
  }, [debouncedUpdate]);

  // Get current value (local or from props)
  const getCurrentValue = useCallback((exerciseId: string, field: string, defaultValue: any) => {
    const localKey = `${exerciseId}-${field}`;
    return localValues[localKey] !== undefined ? localValues[localKey] : defaultValue;
  }, [localValues]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts).forEach(clearTimeout);
    };
  }, [debounceTimeouts]);

  const exerciseForm = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      difficultyLevel: "Beginner",
      equipmentNeeded: "",
      primaryMuscles: "",
      secondaryMuscles: "",
      category: "strength",
      caloriesPerMinute: 5,
      modifications: "",
      safetyNotes: "",
      classTypeId: "none",
    },
  });

  // Create exercise mutation
  const createExercise = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      // Convert "none" to null for the API
      const processedData = {
        ...data,
        classTypeId: data.classTypeId === "none" ? null : data.classTypeId
      };
      return await apiRequest("POST", "/api/exercises", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setIsCreateExerciseDialogOpen(false);
      exerciseForm.reset();
      toast({
        title: "Success",
        description: "Exercise created successfully!",
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
        description: "Failed to create exercise. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onExerciseSubmit = (data: ExerciseFormData) => {
    createExercise.mutate(data);
  };

  const handleCloseExerciseDialog = () => {
    setIsCreateExerciseDialogOpen(false);
    exerciseForm.reset();
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return '💪';
      case 'cardio':
        return '❤️';
      case 'flexibility':
        return '🧘';
      case 'balance':
        return '⚖️';
      default:
        return '🏃';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-red-100 text-red-600';
      case 'cardio':
        return 'bg-blue-100 text-blue-600';
      case 'flexibility':
        return 'bg-green-100 text-green-600';
      case 'balance':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDragStart = (e: React.DragEvent, exerciseId: string) => {
    setDraggedItem(exerciseId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      const exercise = exercises.find(ex => ex.id === draggedItem);
      if (exercise) {
        onAddExercise(exercise.id, routineExercises.length);
      }
      setDraggedItem(null);
    }
  };

  const handleExerciseReorder = (fromIndex: number, toIndex: number) => {
    onReorderExercises(fromIndex, toIndex);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" data-testid="routine-builder">
      {/* Exercise Library */}
      <div className="lg:col-span-1">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Exercise Library</CardTitle>
              <Dialog open={isCreateExerciseDialogOpen} onOpenChange={setIsCreateExerciseDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90" data-testid="button-add-new-exercise">
                    <Plus className="w-4 h-4 mr-1" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Exercise</DialogTitle>
                    <DialogDescription>
                      Add a new exercise to your library that you can use in routines.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...exerciseForm}>
                    <form onSubmit={exerciseForm.handleSubmit(onExerciseSubmit)} className="space-y-4">
                      <FormField
                        control={exerciseForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Exercise Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter exercise name" {...field} data-testid="input-new-exercise-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={exerciseForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the exercise..." 
                                {...field}
                                value={field.value || ""}
                                data-testid="input-new-exercise-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={exerciseForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-new-exercise-category">
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
                          control={exerciseForm.control}
                          name="difficultyLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Difficulty</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-new-exercise-difficulty">
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

                        <FormField
                          control={exerciseForm.control}
                          name="classTypeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-new-exercise-class-type">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={exerciseForm.control}
                          name="equipmentNeeded"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Equipment Needed</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Dumbbells, Mat" {...field} value={field.value || ""} data-testid="input-new-exercise-equipment" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={exerciseForm.control}
                          name="caloriesPerMinute"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calories per Minute</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="5" 
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-new-exercise-calories"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={exerciseForm.control}
                        name="primaryMuscles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Muscles</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Chest, Shoulders" {...field} value={field.value || ""} data-testid="input-new-exercise-primary" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={exerciseForm.control}
                        name="modifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modifications (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Alternative variations for beginners or advanced..." 
                                {...field}
                                value={field.value || ""}
                                data-testid="input-new-exercise-modifications"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={exerciseForm.control}
                        name="safetyNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Safety Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Important safety considerations..." 
                                {...field}
                                value={field.value || ""}
                                data-testid="input-new-exercise-safety"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCloseExerciseDialog}
                          data-testid="button-cancel-exercise"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createExercise.isPending}
                          data-testid="button-create-exercise"
                        >
                          {createExercise.isPending ? "Creating..." : "Create Exercise"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-library"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant={selectedCategory === "cardio" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("cardio")}
                  data-testid="filter-cardio"
                >
                  Cardio
                </Button>
                <Button
                  variant={selectedCategory === "strength" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("strength")}
                  data-testid="filter-strength"
                >
                  Strength
                </Button>
                <Button
                  variant={selectedCategory === "flexibility" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("flexibility")}
                  data-testid="filter-flexibility"
                >
                  Flexibility
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, exercise.id)}
                  className="p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                  data-testid={`exercise-library-${exercise.id}`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${getCategoryColor(exercise.category)} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`}>
                      <span className="text-sm">{getCategoryIcon(exercise.category)}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm" data-testid={`exercise-name-${exercise.id}`}>
                        {exercise.name}
                      </h4>
                      <p className="text-xs text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {exercise.category}
                        </Badge>
                        {' • '}
                        <span>{exercise.primaryMuscles}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Routine Builder */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Input
                  value={routineName}
                  onChange={(e) => onRoutineNameChange(e.target.value)}
                  className="text-lg font-semibold border-none p-0 focus-visible:ring-0"
                  placeholder="Routine Name"
                  data-testid="input-routine-name"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Total Duration: <span className="font-medium" data-testid="text-total-duration">
                    {formatDuration(totalDuration)}
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={classTypeId} onValueChange={onClassTypeChange}>
                  <SelectTrigger className="w-40" data-testid="select-class-type">
                    <SelectValue placeholder="Class Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {classTypes.map((classType) => (
                      <SelectItem key={classType.id} value={classType.id}>
                        {classType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 min-h-32 flex items-center justify-center transition-colors ${
                draggedItem ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
              data-testid="routine-drop-zone"
            >
              <div>
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500">
                  {draggedItem ? 'Drop exercise here' : 'Drag exercises here to build your routine'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Or click exercises to add them manually
                </p>
              </div>
            </div>

            {/* Routine Exercises - Card Layout */}
            {routineExercises.length > 0 && (
              <div className="space-y-4">
                {routineExercises.map((routineExercise, index) => (
                  <Card 
                    key={routineExercise.id}
                    className="border-l-4 border-l-primary"
                    data-testid={`routine-exercise-${routineExercise.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900" data-testid={`exercise-name-${routineExercise.id}`}>
                              {routineExercise.exercise.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {routineExercise.exercise.category}
                              </Badge>
                              {routineExercise.exercise.primaryMuscles && (
                                <span className="text-sm text-gray-600">{routineExercise.exercise.primaryMuscles}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const currentIndex = routineExercises.findIndex(ex => ex.id === routineExercise.id);
                              if (currentIndex > 0) {
                                handleExerciseReorder(currentIndex, currentIndex - 1);
                              }
                            }}
                            disabled={index === 0}
                            data-testid={`button-move-up-${routineExercise.id}`}
                          >
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const currentIndex = routineExercises.findIndex(ex => ex.id === routineExercise.id);
                              if (currentIndex < routineExercises.length - 1) {
                                handleExerciseReorder(currentIndex, currentIndex + 1);
                              }
                            }}
                            disabled={index === routineExercises.length - 1}
                            data-testid={`button-move-down-${routineExercise.id}`}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onRemoveExercise(routineExercise.id)}
                            className="text-red-400 hover:text-red-600"
                            data-testid={`button-remove-${routineExercise.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Duration</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              type="number"
                              value={getCurrentValue(routineExercise.id, 'durationSeconds', routineExercise.durationSeconds || '')}
                              onChange={(e) => handleLocalChange(routineExercise.id, 'durationSeconds', parseInt(e.target.value) || 0)}
                              className="w-20 text-sm"
                              placeholder="60"
                              data-testid={`input-duration-${routineExercise.id}`}
                            />
                            <span className="text-sm text-gray-600 ml-2">seconds</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Repetitions</Label>
                          <Input
                            type="number"
                            value={getCurrentValue(routineExercise.id, 'repetitions', routineExercise.repetitions || '')}
                            onChange={(e) => handleLocalChange(routineExercise.id, 'repetitions', parseInt(e.target.value) || 0)}
                            className="w-20 text-sm mt-1"
                            placeholder="15"
                            data-testid={`input-reps-${routineExercise.id}`}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Sets</Label>
                          <Input
                            type="number"
                            value={getCurrentValue(routineExercise.id, 'sets', routineExercise.sets || '')}
                            onChange={(e) => handleLocalChange(routineExercise.id, 'sets', parseInt(e.target.value) || 0)}
                            className="w-20 text-sm mt-1"
                            placeholder="3"
                            data-testid={`input-sets-${routineExercise.id}`}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">Rest Time</Label>
                          <div className="flex items-center mt-1">
                            <Input
                              type="number"
                              value={getCurrentValue(routineExercise.id, 'restSeconds', routineExercise.restSeconds || '')}
                              onChange={(e) => handleLocalChange(routineExercise.id, 'restSeconds', parseInt(e.target.value) || 0)}
                              className="w-20 text-sm"
                              placeholder="30"
                              data-testid={`input-rest-${routineExercise.id}`}
                            />
                            <span className="text-sm text-gray-600 ml-2">seconds</span>
                          </div>
                        </div>
                      </div>

                      {/* Music Section - Much More Space */}
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Music & Song Assignment</Label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Input
                              type="text"
                              value={getCurrentValue(routineExercise.id, 'musicTitle', routineExercise.musicTitle || '')}
                              onChange={(e) => handleLocalChange(routineExercise.id, 'musicTitle', e.target.value)}
                              className="w-full"
                              placeholder="Song Title - Artist Name"
                              data-testid={`input-music-${routineExercise.id}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Example: "Eye of the Tiger - Survivor" or "Pump It - Black Eyed Peas"
                            </p>
                          </div>
                          <div>
                            <Input
                              type="text"
                              value={getCurrentValue(routineExercise.id, 'musicNotes', routineExercise.musicNotes || '')}
                              onChange={(e) => handleLocalChange(routineExercise.id, 'musicNotes', e.target.value)}
                              className="w-full"
                              placeholder="Music notes (BPM, energy level, cues)"
                              data-testid={`input-music-notes-${routineExercise.id}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Example: "130 BPM, High energy, Start at chorus"
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
