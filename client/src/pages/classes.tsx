import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, Calendar, Dumbbell, Zap, ArrowLeft, Clock, Activity, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClassTypeSchema, insertRoutineSchema, type ClassType, type InsertClassType, type Routine } from "@shared/schema";
import { z } from "zod";

const classTypeFormSchema = insertClassTypeSchema.omit({ 
  id: true, 
  createdByUserId: true, 
  createdAt: true, 
  isDefault: true 
});

const routineFormSchema = insertRoutineSchema.omit({
  id: true,
  createdByUserId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Routine name is required"),
});

type ClassTypeFormData = z.infer<typeof classTypeFormSchema>;
type RoutineFormData = z.infer<typeof routineFormSchema>;

export default function Classes() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [isCreateRoutineDialogOpen, setIsCreateRoutineDialogOpen] = useState(false);

  const form = useForm<ClassTypeFormData>({
    resolver: zodResolver(classTypeFormSchema),
    defaultValues: {
      name: "",
      description: null,
    },
  });

  const routineForm = useForm<RoutineFormData>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      name: "",
      description: null,
      classTypeId: "",
      isPublic: false,
    },
  });

  // Fetch class types
  const { data: classTypes = [], isLoading } = useQuery<ClassType[]>({
    queryKey: ["/api/class-types"],
    retry: false,
  });

  // Fetch routines for selected class
  const { data: classRoutines = [], isLoading: routinesLoading } = useQuery<(Routine & { exerciseCount: number })[]>({
    queryKey: ["/api/routines"],
    enabled: !!selectedClass,
    select: (data) => selectedClass ? data.filter(routine => routine.classTypeId === selectedClass.id) : [],
  });

  // Create class type mutation
  const createClassType = useMutation({
    mutationFn: async (data: ClassTypeFormData) => {
      return await apiRequest("POST", "/api/class-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-types"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Class type created successfully!",
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
        description: "Failed to create class type. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update class type mutation
  const updateClassType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClassTypeFormData> }) => {
      return await apiRequest("PATCH", `/api/class-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-types"] });
      setEditingClass(null);
      form.reset();
      toast({
        title: "Success",
        description: "Class type updated successfully!",
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
        description: "Failed to update class type. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete class type mutation
  const deleteClassType = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/class-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-types"] });
      toast({
        title: "Success",
        description: "Class type deleted successfully!",
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
        description: "Failed to delete class type. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create routine mutation
  const createRoutine = useMutation({
    mutationFn: async (data: RoutineFormData) => {
      return await apiRequest("POST", "/api/routines", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routines"] });
      setIsCreateRoutineDialogOpen(false);
      routineForm.reset();
      toast({
        title: "Success",
        description: "Routine created successfully!",
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
        description: "Failed to create routine. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClassTypeFormData) => {
    if (editingClass) {
      updateClassType.mutate({ id: editingClass.id, data });
    } else {
      createClassType.mutate(data);
    }
  };

  const handleEdit = (classType: ClassType) => {
    setEditingClass(classType);
    form.reset({
      name: classType.name,
      description: classType.description || null,
    });
  };

  const handleDelete = (id: string) => {
    deleteClassType.mutate(id);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingClass(null);
    form.reset();
  };

  const onRoutineSubmit = (data: RoutineFormData) => {
    createRoutine.mutate({
      ...data,
      classTypeId: selectedClass?.id || "",
    });
  };

  const handleCloseRoutineDialog = () => {
    setIsCreateRoutineDialogOpen(false);
    routineForm.reset();
  };

  const getClassIcon = (className: string) => {
    const name = className.toLowerCase();
    if (name.includes('hiit') || name.includes('cardio')) return <Zap className="w-5 h-5" />;
    if (name.includes('strength') || name.includes('weight')) return <Dumbbell className="w-5 h-5" />;
    if (name.includes('yoga') || name.includes('pilates')) return <Users className="w-5 h-5" />;
    return <Calendar className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      </div>
    );
  }

  // If a class is selected, show class detail view
  if (selectedClass) {
    return (
      <div className="p-6 space-y-6" data-testid="class-detail-page">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedClass(null)}
              className="flex items-center gap-2"
              data-testid="button-back-to-classes"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Classes
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid={`text-class-name-${selectedClass.id}`}>
                {selectedClass.name}
              </h1>
              {selectedClass.description && (
                <p className="text-gray-600 mt-1">{selectedClass.description}</p>
              )}
            </div>
          </div>
          <Dialog open={isCreateRoutineDialogOpen} onOpenChange={setIsCreateRoutineDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-add-routine-to-class">
                <Plus className="w-4 h-4" />
                Add New Routine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Routine to {selectedClass.name}</DialogTitle>
                <DialogDescription>
                  Create a new workout routine for this class type.
                </DialogDescription>
              </DialogHeader>
              <Form {...routineForm}>
                <form onSubmit={routineForm.handleSubmit(onRoutineSubmit)} className="space-y-4">
                  <FormField
                    control={routineForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routine Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter routine name" {...field} data-testid="input-routine-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={routineForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your routine..." 
                            {...field}
                            value={field.value || ""}
                            data-testid="input-routine-description"
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
                      onClick={handleCloseRoutineDialog}
                      data-testid="button-cancel-routine"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRoutine.isPending}
                      data-testid="button-create-routine"
                    >
                      {createRoutine.isPending ? "Creating..." : "Create Routine"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Routines for this class */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Routines for {selectedClass.name}</h2>
          {routinesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : classRoutines.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {classRoutines.map((routine, index) => (
                    <div 
                      key={routine.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/routines?edit=${routine.id}`)}
                      data-testid={`routine-item-${routine.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Dumbbell className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors" data-testid={`routine-name-${routine.id}`}>
                                {routine.name}
                              </h3>
                              {routine.description && (
                                <p className="text-sm text-gray-500 truncate">{routine.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 ml-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`routine-date-${routine.id}`}>
                              {new Date(routine.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            <span data-testid={`routine-exercises-${routine.id}`}>
                              {routine.exerciseCount || 0} exercises
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span data-testid={`routine-duration-${routine.id}`}>
                              {Math.round((routine.totalDuration || 0) / 60)} min
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12" data-testid="text-no-routines-for-class">
              <div className="text-gray-500">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No routines yet for {selectedClass.name}</p>
                <p className="text-sm">Create your first routine for this class!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-classes-title">
            Class Types
          </h1>
          <p className="mt-2 text-gray-600" data-testid="text-classes-description">
            Create and manage different types of fitness classes. Each class type can have multiple routines.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen || !!editingClass} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsCreateDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-create-class">
              <Plus className="w-4 h-4" />
              Create Class Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingClass ? "Edit Class Type" : "Create New Class Type"}
              </DialogTitle>
              <DialogDescription>
                {editingClass 
                  ? "Update the details of your class type." 
                  : "Create a new class type to organize your routines."
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., HIIT, Yoga, Strength Training"
                          data-testid="input-class-name"
                          {...field}
                        />
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
                          placeholder="Describe this class type, target audience, and key benefits..."
                          className="min-h-[100px]"
                          data-testid="textarea-class-description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClassType.isPending || updateClassType.isPending}
                    data-testid="button-save-class"
                  >
                    {createClassType.isPending || updateClassType.isPending
                      ? (editingClass ? "Updating..." : "Creating...")
                      : (editingClass ? "Update Class" : "Create Class")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Types Grid */}
      {classTypes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-title">
              No Class Types Created
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4" data-testid="text-empty-description">
              Get started by creating your first class type. This will help you organize your routines by different fitness styles.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-class">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Class Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classTypes.map((classType: ClassType) => (
            <Card key={classType.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClass(classType)} data-testid={`card-class-${classType.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {getClassIcon(classType.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-class-name-${classType.id}`}>
                        {classType.name}
                      </CardTitle>
                      {classType.isDefault && (
                        <Badge variant="secondary" className="mt-1">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(classType);
                      }}
                      data-testid={`button-edit-class-${classType.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {!classType.isDefault && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-delete-class-${classType.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Class Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{classType.name}"? This action cannot be undone and will affect any routines associated with this class type.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(classType.id)}
                              data-testid={`button-confirm-delete-${classType.id}`}
                            >
                              Delete Class Type
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              {classType.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground" data-testid={`text-class-description-${classType.id}`}>
                    {classType.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}