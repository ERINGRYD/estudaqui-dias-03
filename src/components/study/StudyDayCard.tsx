
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DailyStudyLog } from '@/types/study';
import DailyTaskCard from './DailyTaskCard';
import { cn } from '@/lib/utils';

interface StudyDayCardProps {
  dayName: string;
  date: Date;
  dailyLog: DailyStudyLog | null;
  onToggleTaskComplete: (taskId: string) => void;
  onStartTimer: (subject: string, topic?: string, subtopic?: string, taskId?: string) => void;
  isOverLimit?: boolean;
}

const StudyDayCard: React.FC<StudyDayCardProps> = ({
  dayName,
  date,
  dailyLog,
  onToggleTaskComplete,
  onStartTimer,
  isOverLimit = false
}) => {
  const isToday = date.toDateString() === new Date().toDateString();
  
  // FIXED: Better validation of dailyLog and tasks
  const hasValidTasks = dailyLog && dailyLog.tasks && Array.isArray(dailyLog.tasks) && dailyLog.tasks.length > 0;
  const progressPercentage = hasValidTasks 
    ? (dailyLog.totalStudiedHours / dailyLog.totalPlannedHours) * 100 
    : 0;

  const completedTasks = hasValidTasks ? dailyLog.tasks.filter(task => task.completed).length : 0;
  const totalTasks = hasValidTasks ? dailyLog.tasks.length : 0;

  // FIXED: Add debugging for day 0
  const isDayZero = dayName.includes('Dia 1'); // First day of cycle
  if (isDayZero) {
    console.log(`🔍 DAY 0 DEBUG - StudyDayCard rendering:`, {
      dayName,
      date: date.toDateString(),
      hasValidTasks,
      dailyLog: dailyLog ? {
        taskCount: dailyLog.tasks?.length || 0,
        tasks: dailyLog.tasks
      } : null
    });
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isToday && "ring-2 ring-study-primary",
      dailyLog?.completed && "bg-green-50 border-green-200",
      isOverLimit && "bg-red-50 border-red-200"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>{dayName}</span>
              {isToday && <Badge className="bg-study-primary">Hoje</Badge>}
              {dailyLog?.completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {isOverLimit && <AlertTriangle className="h-5 w-5 text-red-600" />}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </p>
          </div>
          
          {hasValidTasks && (
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {dailyLog.totalStudiedHours.toFixed(1)}h / {dailyLog.totalPlannedHours.toFixed(1)}h
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks} tarefas
              </p>
            </div>
          )}
        </div>

        {hasValidTasks && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {isOverLimit && (
              <p className="text-xs text-red-600 flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Este dia excede o limite semanal de horas</span>
              </p>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {hasValidTasks ? (
          <div className="space-y-3">
            {dailyLog.tasks.map((task) => {
              if (isDayZero) {
                console.log(`🔍 DAY 0 DEBUG - Rendering task:`, task);
              }
              return (
                <DailyTaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={() => onToggleTaskComplete(task.id)}
                  onStartTimer={onStartTimer}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {isDayZero 
                ? "⚙️ Carregando tarefas para o primeiro dia..." 
                : "Nenhuma tarefa programada para este dia"
              }
            </p>
            {isDayZero && (
              <p className="text-xs mt-2 text-yellow-600">
                Se as tarefas não aparecerem, tente reconfigurar o ciclo.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyDayCard;
