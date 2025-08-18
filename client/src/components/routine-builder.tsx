import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, GripVertical, Plus, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertExerciseSchema, type Exercise, type RoutineExercise, type ClassType } from "@shared/schema";
import { z } from "zod";

const exerciseFormSchema = insertExerciseSchema.omit({
  id: true,
  createdByUserId: true,
  isPublic: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Exercise name is required"),
  category: z.enum(["strength", "cardio", "flexibility", "balance"]),
  difficultyLevel: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

interface RoutineBuilderProps {
  exercises: Exercise[];
  classTypes: ClassType[];
  routineExercises: (RoutineExercise & { exercise: Exercise })[];
  onAddExercise: (exerciseId: string, orderIndex: number) => void;
  onUpdateExercise: (id: string, data: Partial<RoutineExercise>) => void;
  onRemoveExercise: (id: string) => void;
  onReorderExercises: (exerciseIds: string[]) => void;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isCreateExerciseDialogOpen, setIsCreateExerciseDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    },
  });

  // Create exercise mutation
  const createExercise = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      return await apiRequest("POST", "/api/exercises", data);
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
    const newOrder = [...routineExercises];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    
    const reorderedIds = newOrder.map(item => item.id);
    onReorderExercises(reorderedIds);
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
                                data-testid="input-new-exercise-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={exerciseForm.control}
                          name="equipmentNeeded"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Equipment Needed</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Dumbbells, Mat" {...field} data-testid="input-new-exercise-equipment" />
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
                              <Input placeholder="e.g., Chest, Shoulders" {...field} data-testid="input-new-exercise-primary" />
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

            {/* Routine Exercises Table */}
            {routineExercises.length > 0 && (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">#</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Exercise</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Duration</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Reps/Sets</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Rest</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Music</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routineExercises.map((routineExercise, index) => (
                        <tr 
                          key={routineExercise.id} 
                          className="border-b border-gray-200 hover:bg-white transition-colors"
                          data-testid={`routine-exercise-${routineExercise.id}`}
                        >
                          <td className="py-4 px-4 text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 ${getCategoryColor(routineExercise.exercise.category)} rounded-md flex items-center justify-center mr-3`}>
                                <span className="text-xs">{getCategoryIcon(routineExercise.exercise.category)}</span>
                              </div>
                              <span className="font-medium text-gray-900" data-testid={`exercise-name-${routineExercise.id}`}>
                                {routineExercise.exercise.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={routineExercise.durationSeconds || ''}
                                onChange={(e) => onUpdateExercise(routineExercise.id, { 
                                  durationSeconds: parseInt(e.target.value) || 0 
                                })}
                                className="w-16 text-sm"
                                placeholder="60"
                                data-testid={`input-duration-${routineExercise.id}`}
                              />
                              <span className="text-sm text-gray-600 ml-1">sec</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={routineExercise.repetitions || ''}
                                onChange={(e) => onUpdateExercise(routineExercise.id, { 
                                  repetitions: parseInt(e.target.value) || 0 
                                })}
                                className="w-12 text-sm"
                                placeholder="15"
                                data-testid={`input-reps-${routineExercise.id}`}
                              />
                              <span className="text-sm text-gray-600">x</span>
                              <Input
                                type="number"
                                value={routineExercise.sets || ''}
                                onChange={(e) => onUpdateExercise(routineExercise.id, { 
                                  sets: parseInt(e.target.value) || 0 
                                })}
                                className="w-12 text-sm"
                                placeholder="3"
                                data-testid={`input-sets-${routineExercise.id}`}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                value={routineExercise.restSeconds || ''}
                                onChange={(e) => onUpdateExercise(routineExercise.id, { 
                                  restSeconds: parseInt(e.target.value) || 0 
                                })}
                                className="w-16 text-sm"
                                placeholder="30"
                                data-testid={`input-rest-${routineExercise.id}`}
                              />
                              <span className="text-sm text-gray-600 ml-1">sec</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              type="text"
                              value={routineExercise.musicTitle || ''}
                              onChange={(e) => onUpdateExercise(routineExercise.id, { 
                                musicTitle: e.target.value 
                              })}
                              className="w-full text-sm"
                              placeholder="Song title - Artist"
                              data-testid={`input-music-${routineExercise.id}`}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" data-testid={`button-drag-${routineExercise.id}`}>
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => onRemoveExercise(routineExercise.id)}
                                data-testid={`button-remove-${routineExercise.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
