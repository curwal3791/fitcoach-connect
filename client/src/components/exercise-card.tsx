import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus } from "lucide-react";
import type { Exercise } from "@shared/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onAddToRoutine?: (exercise: Exercise) => void;
}

const difficultyColors = {
  Beginner: "bg-fitness-600/10 text-fitness-700",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-red-500/10 text-red-700",
};

const categoryColors = {
  strength: "bg-red-500/10 text-red-700",
  cardio: "bg-blue-500/10 text-blue-700", 
  flexibility: "bg-green-500/10 text-green-700",
  balance: "bg-purple-500/10 text-purple-700",
};

export default function ExerciseCard({ exercise, onEdit, onAddToRoutine }: ExerciseCardProps) {
  const difficultyColor = difficultyColors[exercise.difficultyLevel] || "bg-gray-100 text-gray-700";
  const categoryColor = categoryColors[exercise.category] || "bg-gray-100 text-gray-700";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`exercise-card-${exercise.id}`}>
      {exercise.imageUrl && (
        <img 
          src={exercise.imageUrl} 
          alt={exercise.name}
          className="w-full h-48 object-cover"
          data-testid={`exercise-image-${exercise.id}`}
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900" data-testid={`exercise-name-${exercise.id}`}>
            {exercise.name}
          </h3>
          <Badge className={difficultyColor} data-testid={`exercise-difficulty-${exercise.id}`}>
            {exercise.difficultyLevel}
          </Badge>
        </div>
        
        {exercise.description && (
          <p className="text-gray-600 text-sm mb-4" data-testid={`exercise-description-${exercise.id}`}>
            {exercise.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <Badge variant="outline" className={categoryColor} data-testid={`exercise-category-${exercise.id}`}>
            {exercise.category}
          </Badge>
          {exercise.equipmentNeeded && (
            <span data-testid={`exercise-equipment-${exercise.id}`}>
              {exercise.equipmentNeeded}
            </span>
          )}
          {exercise.primaryMuscles && (
            <span data-testid={`exercise-muscles-${exercise.id}`}>
              {exercise.primaryMuscles}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => onEdit(exercise)}
              data-testid={`button-edit-exercise-${exercise.id}`}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {onAddToRoutine && (
            <Button 
              className="flex-1 bg-primary/10 text-primary hover:bg-primary/20" 
              onClick={() => onAddToRoutine(exercise)}
              data-testid={`button-add-exercise-${exercise.id}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add to Routine
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
