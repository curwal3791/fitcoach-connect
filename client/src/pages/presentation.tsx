import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Square, 
  Plus,
  Maximize2,
  Minimize2
} from "lucide-react";
import type { Routine, RoutineExercise, Exercise } from "@shared/schema";

export default function Presentation() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const { data: routines, isLoading: routinesLoading } = useQuery<Routine[]>({
    queryKey: ["/api/routines"],
    enabled: isAuthenticated,
  });

  const { data: selectedRoutine, isLoading: routineLoading } = useQuery<Routine & { 
    exercises: (RoutineExercise & { exercise: Exercise })[] 
  }>({
    queryKey: ["/api/routines", selectedRoutineId],
    enabled: !!selectedRoutineId,
  });

  // Reset state when routine changes
  useEffect(() => {
    if (selectedRoutineId) {
      setCurrentExerciseIndex(0);
      setIsPlaying(false);
      setHasStarted(false);
    }
  }, [selectedRoutineId]);

  // Timer effect
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleNextExercise(); // Auto-advance to next exercise
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, timeRemaining]);

  // Set initial time when exercise changes
  useEffect(() => {
    if (selectedRoutine?.exercises && selectedRoutine.exercises[currentExerciseIndex]) {
      const exercise = selectedRoutine.exercises[currentExerciseIndex];
      setTimeRemaining(exercise.durationSeconds || 60);
      // Only auto-start if we've started the presentation already
      if (hasStarted && currentExerciseIndex > 0) {
        setIsPlaying(true);
      }
    }
  }, [currentExerciseIndex, selectedRoutine, hasStarted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedRoutine?.exercises) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePreviousExercise();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextExercise();
          break;
        case 'Escape':
          e.preventDefault();
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, selectedRoutine, isFullscreen]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNextExercise = () => {
    if (selectedRoutine?.exercises && currentExerciseIndex < selectedRoutine.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setHasStarted(false);
    setCurrentExerciseIndex(0);
    if (selectedRoutine?.exercises) {
      setTimeRemaining(selectedRoutine.exercises[0]?.durationSeconds || 60);
    }
  };

  const handleAddTime = () => {
    setTimeRemaining(prev => prev + 30);
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!selectedRoutine?.exercises || selectedRoutine.exercises.length === 0) return 0;
    return Math.round(((currentExerciseIndex + 1) / selectedRoutine.exercises.length) * 100);
  };

  const getCurrentExercise = () => {
    return selectedRoutine?.exercises[currentExerciseIndex];
  };

  const getUpcomingExercises = () => {
    if (!selectedRoutine?.exercises) return [];
    return selectedRoutine.exercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 4);
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
        return 'bg-red-600';
      case 'cardio':
        return 'bg-blue-600';
      case 'flexibility':
        return 'bg-green-600';
      case 'balance':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
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

  if (!selectedRoutineId) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" data-testid="presentation-page">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Presentation Mode</h1>
          <p className="text-gray-600 mt-1">Select a routine to start your presentation</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="routine-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Routine
                  </label>
                  <Select onValueChange={setSelectedRoutineId}>
                    <SelectTrigger data-testid="select-presentation-routine">
                      <SelectValue placeholder="Select a routine..." />
                    </SelectTrigger>
                    <SelectContent>
                      {routinesLoading ? (
                        <div className="p-2">Loading routines...</div>
                      ) : routines && routines.length > 0 ? (
                        routines.map((routine) => (
                          <SelectItem key={routine.id} value={routine.id}>
                            {routine.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">No routines available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={toggleFullscreen}
                  variant="outline" 
                  className="w-full"
                  data-testid="button-fullscreen"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Enter Fullscreen Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Routine Preview Cards */}
          {routines && routines.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routines.map((routine) => (
                <Card 
                  key={routine.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
                  onClick={() => setSelectedRoutineId(routine.id)}
                  data-testid={`routine-preview-${routine.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {routine.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {routine.description || "No description"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRoutineId(routine.id);
                        }}
                        data-testid={`button-select-routine-${routine.id}`}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                          Exercises
                        </span>
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                          {Math.round((routine.totalDuration || 0) / 60)}min
                        </span>
                      </div>
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        General
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  const upcomingExercises = getUpcomingExercises();

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} min-h-screen bg-gray-900 text-white`} data-testid="presentation-mode">
      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-gray-700">
        <div>
          <h1 className="text-3xl font-bold" data-testid="presentation-routine-title">
            {selectedRoutine?.name || "Loading..."}
          </h1>
          <p className="text-gray-300">
            {selectedRoutine?.description || "Workout routine presentation"}
          </p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">Exercise</p>
            <p className="text-2xl font-bold" data-testid="presentation-exercise-counter">
              {currentExerciseIndex + 1} of {selectedRoutine?.exercises?.length || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Progress</p>
            <p className="text-2xl font-bold text-primary" data-testid="presentation-progress">
              {getProgress()}%
            </p>
          </div>
          <div className="flex space-x-2">
            {!isFullscreen && (
              <Button 
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="border-gray-500 text-white hover:bg-gray-600"
                data-testid="button-enter-fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </Button>
            )}
            {isFullscreen && (
              <Button 
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="border-gray-500 text-white hover:bg-gray-600"
                data-testid="button-exit-fullscreen"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </Button>
            )}
            <Button 
              onClick={handleStop}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-end-session"
            >
              <Square className="w-4 h-4 mr-2 text-white" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8 min-h-0 flex-1">
        {/* Current Exercise */}
        <div className="lg:col-span-3 flex flex-col">
          {routineLoading ? (
            <div className="bg-gray-800 rounded-2xl p-8 flex-1 flex items-center justify-center">
              <Skeleton className="h-32 w-64" />
            </div>
          ) : currentExercise ? (
            <div className="bg-gray-800 rounded-2xl p-8 flex-1 flex flex-col justify-center">
              <div className="text-center">
                <div className="mb-8">
                  <h2 className="text-6xl font-bold mb-4" data-testid="presentation-current-exercise">
                    {currentExercise.exercise.name}
                  </h2>
                  <p className="text-2xl text-gray-300" data-testid="presentation-current-description">
                    {currentExercise.exercise.description || "Follow the exercise instructions"}
                  </p>
                  {currentExercise.exercise.equipmentNeeded && currentExercise.exercise.equipmentNeeded !== 'None' && (
                    <div className="mt-4 flex items-center justify-center">
                      <div className="bg-yellow-600 px-4 py-2 rounded-full text-sm font-medium">
                        🏋️ Equipment: {currentExercise.exercise.equipmentNeeded}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timer Circle */}
                <div className="relative mx-auto w-64 h-64 mb-8">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none" 
                      className="text-gray-700"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none" 
                      className="text-primary" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * timeRemaining) / (currentExercise.durationSeconds || 60)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold" data-testid="presentation-timer">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-lg text-gray-400">remaining</div>
                    </div>
                  </div>
                </div>

                {/* Exercise Details */}
                <div className="flex justify-center gap-12 max-w-md mx-auto">
                  {currentExercise.repetitions && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary" data-testid="presentation-reps">
                        {currentExercise.repetitions}
                      </p>
                      <p className="text-gray-400">Reps</p>
                    </div>
                  )}
                  {currentExercise.sets && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary" data-testid="presentation-sets">
                        {currentExercise.sets}
                      </p>
                      <p className="text-gray-400">Sets</p>
                    </div>
                  )}
                </div>

                {/* Music Info */}
                {currentExercise.musicTitle && (
                  <div className="mt-6 text-center">
                    <p className="text-lg text-gray-300" data-testid="presentation-music">
                      🎵 {currentExercise.musicTitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl p-8 flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-xl">No exercises in this routine</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Button 
              onClick={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
              variant="outline"
              size="lg"
              className="border-gray-500 text-white hover:bg-gray-600"
              data-testid="button-previous-exercise"
            >
              <SkipBack className="w-6 h-6 text-white" />
            </Button>
            <Button 
              onClick={handlePlayPause}
              size="lg"
              className="px-8 bg-primary hover:bg-primary/90"
              data-testid="button-play-pause"
            >
              {!hasStarted ? <Play className="w-6 h-6 text-white" /> : (isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />)}
            </Button>
            <Button 
              onClick={handleNextExercise}
              disabled={!selectedRoutine?.exercises || currentExerciseIndex >= selectedRoutine.exercises.length - 1}
              variant="outline"
              size="lg"
              className="border-gray-500 text-white hover:bg-gray-600"
              data-testid="button-next-exercise"
            >
              <SkipForward className="w-6 h-6 text-white" />
            </Button>
            <Button 
              onClick={handleAddTime}
              variant="outline"
              size="lg"
              className="border-gray-500 text-white hover:bg-gray-600"
              data-testid="button-add-time"
            >
              <Plus className="w-4 h-4 mr-2 text-white" />
              +30s
            </Button>
          </div>
          
          {/* Auto-flow indicator */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
              {!hasStarted ? "Press play to start workout" : "Exercises advance automatically • Press spacebar to pause/resume"}
            </p>
          </div>
        </div>

        {/* Upcoming Exercises */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-2xl p-6 h-full">
            <h3 className="text-xl font-semibold mb-6 text-center">Up Next</h3>
            <div className="space-y-4">
              {upcomingExercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-gray-700 rounded-lg p-4" data-testid={`upcoming-exercise-${index}`}>
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm">🏃</span>
                    </div>
                    <div>
                      <h4 className="font-medium" data-testid={`upcoming-exercise-name-${index}`}>
                        {exercise.exercise.name}
                      </h4>
                      <p className="text-sm text-gray-400" data-testid={`upcoming-exercise-duration-${index}`}>
                        {formatTime(exercise.durationSeconds || 60)}
                      </p>
                    </div>
                  </div>
                  {exercise.musicTitle && (
                    <p className="text-xs text-gray-400" data-testid={`upcoming-exercise-music-${index}`}>
                      🎵 {exercise.musicTitle}
                    </p>
                  )}
                </div>
              ))}
              
              {upcomingExercises.length === 0 && (
                <div className="text-center text-gray-400 py-8" data-testid="text-no-upcoming">
                  <p>No more exercises</p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span data-testid="presentation-progress-text">
                  Exercise {currentExerciseIndex + 1} of {selectedRoutine?.exercises?.length || 0}
                </span>
                <span data-testid="presentation-progress-percentage">
                  {getProgress()}%
                </span>
              </div>
              <Progress value={getProgress()} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
