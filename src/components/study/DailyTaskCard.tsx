
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import { DailyTask } from '@/types/study';
import { cn } from '@/lib/utils';

interface DailyTaskCardProps {
  task: DailyTask;
  onToggleComplete: () => void;
  onStartTimer: (subject: string, topic?: string, subtopic?: string, taskId?: string) => void;
}

const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
  task,
  onToggleComplete,
  onStartTimer
}) => {
  const progressPercentage = (task.studiedHours / task.plannedHours) * 100;
  
  const priorityStyles = {
    low: 'border-l-blue-500',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500'
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all duration-200",
      priorityStyles[task.priority],
      task.completed && "bg-muted/50 opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleComplete}
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                task.completed 
                  ? "bg-green-500 border-green-500 text-white" 
                  : "border-gray-300 hover:border-green-400"
              )}
            >
              {task.completed && <CheckCircle2 className="h-4 w-4" />}
            </button>
            
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium text-sm",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.subject}
              </h4>
              {task.topic && (
                <p className="text-xs text-muted-foreground mt-1">
                  📖 {task.topic}
                </p>
              )}
              {task.subtopic && (
                <p className="text-xs text-muted-foreground">
                  • {task.subtopic}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {priorityLabels[task.priority]}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={task.completed}
              onClick={() => onStartTimer(task.subject, task.topic, task.subtopic, task.id)}
              className="flex items-center space-x-1"
            >
              <Play className="h-3 w-3" />
              <span className="text-xs">Estudar</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.studiedHours.toFixed(1)}h / {task.plannedHours.toFixed(1)}h</span>
            </div>
            <span className="text-xs font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTaskCard;
