import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  Square, 
  Users, 
  Clock, 
  CheckCircle, 
  UserCheck, 
  Timer,
  BarChart3,
  FileText,
  ArrowRight,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Timer component for exercise timing
function ExerciseTimer({ 
  duration, 
  isActive, 
  onComplete, 
  onReset 
}: { 
  duration: number; 
  isActive: boolean; 
  onComplete: () => void;
  onReset: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (isActive && isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, isRunning, timeLeft, onComplete]);

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setTimeLeft(duration);
    setIsRunning(false);
    onReset();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={isRunning ? "destructive" : "default"}
          onClick={toggleTimer}
          disabled={!isActive || timeLeft === 0}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={resetTimer}>
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
          <span className="text-xs text-gray-500">{formatTime(duration)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}

function CoachConsole() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sessionNotes, setSessionNotes] = useState("");
  const [quickMetrics, setQuickMetrics] = useState<Record<string, { rpe?: number; notes?: string }>>({});
  
  // Fetch console data
  const { data: consoleData, isLoading } = useQuery({
    queryKey: ["/api/events", eventId, "console"],
    enabled: !!eventId,
    retry: false,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${eventId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error(`Failed to start session: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "console"] });
      toast({ title: "Session started!", description: "Class is now in progress" });
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/events/${eventId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionNotes: notes }),
      });
      if (!response.ok) throw new Error(`Failed to complete session: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "console"] });
      toast({ title: "Session completed!", description: "Class summary generated" });
    },
  });

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, status }),
      });
      if (!response.ok) throw new Error(`Failed to update attendance: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "console"] });
      toast({ title: "Attendance updated", description: "Client check-in recorded" });
    },
  });

  // Record metrics mutation
  const recordMetricsMutation = useMutation({
    mutationFn: async (metrics: any[]) => {
      const response = await fetch(`/api/events/${eventId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      if (!response.ok) throw new Error(`Failed to record metrics: ${response.statusText}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Metrics saved", description: "Performance data recorded" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!consoleData) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h1>
          <p className="text-gray-600">This event may not exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  const { event, routine, enrolledClients, attendanceRecords } = consoleData || {};
  const isSessionActive = event?.sessionStatus === "in_progress";
  const isSessionCompleted = event?.sessionStatus === "completed";
  const currentExercise = routine?.exercises?.[currentExerciseIndex];

  const handleCheckIn = (clientId: string, status: string) => {
    checkinMutation.mutate({ clientId, status });
  };

  const handleCompleteSession = () => {
    if (event) {
      completeSessionMutation.mutate(sessionNotes);
    }
  };

  const handleNextExercise = () => {
    if (routine?.exercises && currentExerciseIndex < routine.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const attendanceMap = new Map(attendanceRecords?.map((a: any) => [a.clientId, a.status]) || []);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="coach-console">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
          <p className="text-gray-600">
            {event?.startDatetime ? new Date(event.startDatetime).toLocaleDateString() : "TBD"} at {event?.location || "Studio"}
          </p>
          <Badge 
            variant={isSessionActive ? "default" : isSessionCompleted ? "secondary" : "outline"}
            className="mt-2"
          >
            {event?.sessionStatus?.replace('_', ' ').toUpperCase() || "SCHEDULED"}
          </Badge>
        </div>
        
        {/* Session Controls */}
        <div className="flex space-x-2">
          {!isSessionActive && !isSessionCompleted && (
            <Button 
              onClick={() => startSessionMutation.mutate()}
              disabled={startSessionMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Class
            </Button>
          )}
          
          {isSessionActive && (
            <Button 
              onClick={handleCompleteSession}
              disabled={completeSessionMutation.isPending}
              variant="destructive"
            >
              <Square className="w-4 h-4 mr-2" />
              Complete Class
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Roster & Check-in */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Class Roster ({enrolledClients?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrolledClients?.map((client: any) => {
                  const status = attendanceMap.get(client.id);
                  const isPresent = status === "present";
                  
                  return (
                    <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{client.firstName} {client.lastName}</p>
                        {client.medicalNotes && (
                          <p className="text-xs text-amber-600">⚠️ Medical notes</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isPresent ? "default" : "outline"}
                        onClick={() => handleCheckIn(client.id, isPresent ? "absent" : "present")}
                        disabled={checkinMutation.isPending}
                      >
                        {isPresent ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Present
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check In
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
                
                {(!enrolledClients || enrolledClients.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No clients enrolled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Routine Progress */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Workout Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routine ? (
                <div className="space-y-4">
                  {/* Progress overview */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Exercise {currentExerciseIndex + 1} of {routine.exercises.length}</span>
                    <span className="text-sm font-medium">
                      {Math.round(((currentExerciseIndex + 1) / routine.exercises.length) * 100)}%
                    </span>
                  </div>
                  <Progress value={((currentExerciseIndex + 1) / routine.exercises.length) * 100} />

                  {/* Current Exercise */}
                  {currentExercise && (
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="font-semibold text-lg">{currentExercise.exercise.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{currentExercise.exercise.description}</p>
                      
                      {/* Exercise details */}
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        {currentExercise.durationSeconds && (
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-1 font-medium">{Math.floor(currentExercise.durationSeconds / 60)}m {currentExercise.durationSeconds % 60}s</span>
                          </div>
                        )}
                        {currentExercise.repetitions && (
                          <div>
                            <span className="text-gray-500">Reps:</span>
                            <span className="ml-1 font-medium">{currentExercise.repetitions}</span>
                          </div>
                        )}
                        {currentExercise.sets && (
                          <div>
                            <span className="text-gray-500">Sets:</span>
                            <span className="ml-1 font-medium">{currentExercise.sets}</span>
                          </div>
                        )}
                        {currentExercise.restSeconds && (
                          <div>
                            <span className="text-gray-500">Rest:</span>
                            <span className="ml-1 font-medium">{currentExercise.restSeconds}s</span>
                          </div>
                        )}
                      </div>

                      {/* Timer */}
                      {currentExercise.durationSeconds && isSessionActive && (
                        <ExerciseTimer
                          duration={currentExercise.durationSeconds}
                          isActive={true}
                          onComplete={() => toast({ title: "Exercise complete!", description: "Time to move to the next exercise" })}
                          onReset={() => {}}
                        />
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handlePreviousExercise}
                      disabled={currentExerciseIndex === 0}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNextExercise}
                      disabled={!routine.exercises || currentExerciseIndex >= routine.exercises.length - 1}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No routine selected for this class</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Notes & Metrics */}
        <div className="space-y-6">
          {/* Session Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this session..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="min-h-24"
              />
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="w-5 h-5 mr-2" />
                Class Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Overall Class RPE (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Rate intensity"
                    value={quickMetrics.class?.rpe || ""}
                    onChange={(e) => setQuickMetrics(prev => ({
                      ...prev,
                      class: { ...prev.class, rpe: parseInt(e.target.value) || undefined }
                    }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Quick Notes</label>
                  <Input
                    placeholder="Energy level, modifications made..."
                    value={quickMetrics.class?.notes || ""}
                    onChange={(e) => setQuickMetrics(prev => ({
                      ...prev,
                      class: { ...prev.class, notes: e.target.value }
                    }))}
                  />
                </div>

                {Object.keys(quickMetrics).length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Convert quick metrics to proper format for recording
                      const metricsToRecord = Object.entries(quickMetrics).map(([key, value]) => ({
                        clientId: key === 'class' ? null : key,
                        metricType: 'rpe',
                        value: value.rpe?.toString() || '',
                        notes: value.notes || '',
                        routineExerciseId: currentExercise?.id || null,
                      })).filter(m => m.value);
                      
                      if (metricsToRecord.length > 0) {
                        recordMetricsMutation.mutate(metricsToRecord);
                        setQuickMetrics({});
                      }
                    }}
                    disabled={recordMetricsMutation.isPending}
                  >
                    Save Metrics
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CoachConsole;