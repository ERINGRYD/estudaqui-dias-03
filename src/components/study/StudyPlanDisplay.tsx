import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, Settings, Clock, Target, CheckCircle2, Shuffle, AlertTriangle } from 'lucide-react';
import { StudyPlan, StudySession, StudySubject, DailyTask } from '@/types/study';
import PlanAdjustmentModal from './PlanAdjustmentModal';
import CycleConfiguration from './CycleConfiguration';
import StudyDayCard from './StudyDayCard';
import { useStudyProgress } from '@/hooks/useStudyProgress';

interface CycleConfig {
  forceAllSubjects: boolean;
  subjectsPerCycle: number;
  rotationIntensity: number;
  focusMode: 'balanced' | 'priority' | 'difficulty';
  avoidConsecutive: boolean;
}

interface StudyPlanDisplayProps {
  studyPlan: StudyPlan;
  subjectLevels: Record<string, string>;
  studySessions?: StudySession[];
  onBack: () => void;
  onStartTimer: (subject: string, topic?: string, subtopic?: string, taskId?: string) => void;
  onUpdatePlan?: (updatedPlan: StudyPlan) => void;
  onRegenerateCycle?: (config: CycleConfig) => void;
}

const StudyPlanDisplay: React.FC<StudyPlanDisplayProps> = ({ 
  studyPlan, 
  subjectLevels, 
  studySessions = [],
  onBack, 
  onStartTimer,
  onUpdatePlan = () => {},
  onRegenerateCycle
}) => {
  const [showCycleConfig, setShowCycleConfig] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  
  const {
    toggleTaskCompletion,
    getDailyProgress,
    getWeeklyHours,
    initializeDailyLog
  } = useStudyProgress();

  // Initialize daily logs from cycle data - FIXED: Better synchronization
  useEffect(() => {
    console.log('🔄 SYNC DEBUG - useEffect triggered:', {
      hasCycle: !!studyPlan.cycle,
      initialized,
      attempts: initializationAttempts
    });

    if (studyPlan.cycle && !initialized && initializationAttempts < 3) {
      console.log('🚀 SYNC DEBUG - Starting SYNCHRONOUS initialization...');
      
      setInitializationAttempts(prev => prev + 1);
      
      // FIXED: Use synchronous processing to ensure proper order
      const initializeAllDays = () => {
        let successCount = 0;
        const totalDays = studyPlan.cycle!.length;
        
        studyPlan.cycle!.forEach((day, index) => {
          const cycleStartDate = new Date();
          const dayDate = new Date(cycleStartDate);
          dayDate.setDate(dayDate.getDate() + index);
          const dateKey = dayDate.toDateString();
          
          console.log(`📅 SYNC DEBUG - Processing day ${index} (${day.dayName}) - Date: ${dateKey}`);
          
          // FIXED: Clean and validate tasks before initialization
          const cleanTasks: DailyTask[] = day.tasks && day.tasks.length > 0 
            ? day.tasks.map(task => ({
                id: task.id,
                subject: task.subject,
                topic: typeof task.topic === 'string' ? task.topic : undefined,
                subtopic: typeof task.subtopic === 'string' ? task.subtopic : undefined,
                plannedHours: Number(task.plannedHours) || 2.5,
                studiedHours: 0,
                completed: false,
                color: task.color || '#8884d8',
                priority: task.priority || 'medium'
              }))
            : [{
                id: `auto-task-${day.day}-${day.subject.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
                subject: day.subject,
                topic: undefined,
                subtopic: undefined,
                plannedHours: day.totalPlannedHours || 2.5,
                studiedHours: 0,
                completed: false,
                color: day.color || '#8884d8',
                priority: 'medium'
              }];

          console.log(`📝 SYNC DEBUG - Clean tasks for day ${index}:`, cleanTasks);

          // FIXED: Call initializeDailyLog and verify result
          const result = initializeDailyLog(dateKey, cleanTasks);
          if (result) {
            successCount++;
            console.log(`✅ SYNC DEBUG - Day ${index} initialized successfully`);
          } else {
            console.error(`❌ SYNC DEBUG - Day ${index} initialization failed`);
          }
        });

        console.log(`📊 SYNC DEBUG - Initialization complete: ${successCount}/${totalDays} days`);
        
        // FIXED: Only mark as initialized if ALL days were successful
        if (successCount === totalDays) {
          setInitialized(true);
          console.log('🎉 SYNC DEBUG - All days initialized successfully!');
        } else {
          console.error('⚠️ SYNC DEBUG - Not all days were initialized, will retry...');
          // Reset to try again
          setTimeout(() => {
            setInitializationAttempts(0);
          }, 500);
        }
      };

      // FIXED: Run initialization immediately, not in timeout
      initializeAllDays();
    }
  }, [studyPlan.cycle, initialized, initializationAttempts, initializeDailyLog]);

  // FIXED: Add effect to monitor daily logs and force re-render
  useEffect(() => {
    if (initialized) {
      console.log('🔍 SYNC DEBUG - Verifying all daily logs are present...');
      let missingDays = 0;
      
      studyPlan.cycle?.forEach((day, index) => {
        const cycleStartDate = new Date();
        const dayDate = new Date(cycleStartDate);
        dayDate.setDate(dayDate.getDate() + index);
        const dateKey = dayDate.toDateString();
        const dailyLog = getDailyProgress(dateKey);
        
        if (!dailyLog || !dailyLog.tasks || dailyLog.tasks.length === 0) {
          missingDays++;
          console.warn(`⚠️ SYNC DEBUG - Day ${index} (${dateKey}) still missing daily log`);
        }
      });
      
      if (missingDays > 0) {
        console.error(`❌ SYNC DEBUG - ${missingDays} days still missing logs, resetting initialization...`);
        setInitialized(false);
        setInitializationAttempts(0);
      } else {
        console.log('✅ SYNC DEBUG - All daily logs verified present');
      }
    }
  }, [initialized, studyPlan.cycle, getDailyProgress]);

  const levelLabels: Record<string, { label: string; color: string; weight: number }> = {
    beginner: { label: 'Iniciante', color: 'bg-red-100 text-red-800', weight: 3 },
    intermediate: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800', weight: 2 },
    advanced: { label: 'Avançado', color: 'bg-green-100 text-green-800', weight: 1 }
  };

  const handleRegenerateCycle = (config: CycleConfig) => {
    if (onRegenerateCycle) {
      console.log('🔄 SYNC DEBUG - Regenerating cycle, resetting initialization...');
      setInitialized(false);
      setInitializationAttempts(0);
      onRegenerateCycle(config);
      setShowCycleConfig(false);
    }
  };

  const handleToggleTaskComplete = (dayIndex: number, taskId: string) => {
    if (!studyPlan.cycle) return;
    
    const cycleStartDate = new Date();
    const dayDate = new Date(cycleStartDate);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    const dateKey = dayDate.toDateString();
    
    console.log(`Toggling task completion for day ${dayIndex}, task ${taskId}, date ${dateKey}`);
    toggleTaskCompletion(dateKey, taskId);
  };

  // Calculate if weekly hours exceed limit
  const calculateWeeklyHoursCheck = () => {
    if (!studyPlan.cycle || !studyPlan.weeklyHourLimit) return { isOverLimit: false, totalHours: 0 };
    
    let weeklyTotal = 0;
    const daysInWeek = studyPlan.cycle.slice(0, 7);
    
    daysInWeek.forEach(day => {
      weeklyTotal += day.totalPlannedHours || 0;
    });
    
    return {
      isOverLimit: weeklyTotal > studyPlan.weeklyHourLimit,
      totalHours: weeklyTotal,
      limit: studyPlan.weeklyHourLimit
    };
  };

  const weeklyCheck = calculateWeeklyHoursCheck();

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <Card className="bg-gradient-to-r from-study-primary to-study-accent text-study-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {studyPlan.type === 'cycle' ? '🔄 Ciclo de Estudos' : '📅 Agenda Semanal'}
              </h2>
              <p className="opacity-90">
                Plano personalizado de estudos com tarefas diárias
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{studyPlan.totalHours}h</div>
              <div className="opacity-90">por semana</div>
              {weeklyCheck.isOverLimit && (
                <div className="flex items-center space-x-1 text-red-200 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Limite excedido: {weeklyCheck.totalHours.toFixed(1)}h</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-white/30">
              📚 {studyPlan.focusAreas.length} áreas prioritárias
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30">
              🎯 {Object.keys(subjectLevels).length} disciplinas
            </Badge>
            {studyPlan.daysUntilExam && (
              <Badge className="bg-white/20 text-white border-white/30">
                ⏳ {studyPlan.daysUntilExam} dias restantes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Hours Warning */}
      {weeklyCheck.isOverLimit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Limite Semanal Excedido</h3>
                <p className="text-sm text-red-600">
                  O plano atual soma {weeklyCheck.totalHours.toFixed(1)}h por semana, 
                  excedendo o limite de {weeklyCheck.limit}h. 
                  Considere rebalancear as tarefas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FIXED: Add initialization status display */}
      {!initialized && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-700">
              <Clock className="h-5 w-5 animate-spin" />
              <div>
                <h3 className="font-medium">Inicializando Plano de Estudos</h3>
                <p className="text-sm text-yellow-600">
                  Configurando tarefas diárias... (Tentativa {initializationAttempts}/3)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Visualization */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tarefas Diárias</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          {studyPlan.type === 'cycle' && studyPlan.cycle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Seu Ciclo de Estudos (14 dias)</h3>
                  <p className="text-sm text-muted-foreground">
                    Marque as tarefas como concluídas conforme você estuda
                  </p>
                  {/* FIXED: Add initialization status */}
                  {!initialized && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚙️ Inicializando tarefas... Aguarde alguns segundos.
                    </p>
                  )}
                </div>
                <Dialog open={showCycleConfig} onOpenChange={setShowCycleConfig}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Shuffle className="h-4 w-4 mr-2" />
                      Reconfigurar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Configuração do Ciclo</DialogTitle>
                    </DialogHeader>
                    <CycleConfiguration
                      studyPlan={studyPlan}
                      subjects={studyPlan.subjects}
                      subjectLevels={subjectLevels}
                      onUpdatePlan={onUpdatePlan}
                      onRegenerateCycle={handleRegenerateCycle}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {studyPlan.cycle.map((day, index) => {
                  const cycleStartDate = new Date();
                  const dayDate = new Date(cycleStartDate);
                  dayDate.setDate(dayDate.getDate() + index);
                  const dateKey = dayDate.toDateString();
                  const dailyLog = getDailyProgress(dateKey);
                  
                  // FIXED: Enhanced debugging for day 0
                  if (index === 0) {
                    console.log(`🎯 DAY 0 FINAL DEBUG - Rendering:`, { 
                      dayName: day.dayName, 
                      dateKey, 
                      dailyLog: dailyLog ? {
                        taskCount: dailyLog.tasks.length,
                        tasks: dailyLog.tasks.map(t => ({ id: t.id, subject: t.subject }))
                      } : 'NO LOG',
                      cycleDay: {
                        taskCount: day.tasks ? day.tasks.length : 0,
                        tasks: day.tasks ? day.tasks.map(t => ({ id: t.id, subject: t.subject })) : 'NO TASKS'
                      },
                      initialized
                    });
                  }
                  
                  return (
                    <StudyDayCard
                      key={`${index}-${dateKey}`}
                      dayName={`${day.dayName} - Dia ${day.day}`}
                      date={dayDate}
                      dailyLog={dailyLog}
                      onToggleTaskComplete={(taskId) => handleToggleTaskComplete(index, taskId)}
                      onStartTimer={onStartTimer}
                      isOverLimit={weeklyCheck.isOverLimit && index < 7}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Sistema de tarefas disponível apenas para planos de ciclo</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studyPlan.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={studyPlan.type === 'cycle' ? 'percentage' : 'hours'}
                      >
                        {studyPlan.data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Matérias Prioritárias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(subjectLevels)
                    .filter(([_, level]) => {
                      const levelInfo = levelLabels[level as string];
                      return levelInfo && levelInfo.weight >= 2;
                    })
                    .map(([subject, level]) => {
                      const levelInfo = levelLabels[level as string];
                      if (!levelInfo) return null;
                      
                      return (
                        <div key={subject} className="flex items-center justify-between p-3 bg-study-secondary/20 rounded-lg border border-study-primary/20">
                          <div>
                            <div className="font-medium">{subject}</div>
                            <div className="text-sm text-muted-foreground">
                              Nível: {levelInfo.label}
                            </div>
                          </div>
                          <Badge className={levelInfo.color}>
                            {levelInfo.weight === 3 ? 'Crítica' : 'Importante'}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hours Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horas por Matéria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyPlan.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey={studyPlan.type === 'cycle' ? 'hoursPerWeek' : 'hours'} 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Study Progress Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso Esperado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(subjectLevels).map(([subject, level]) => {
                    const levelInfo = levelLabels[level as string];
                    if (!levelInfo) return null;

                    const progress = levelInfo.weight === 3 ? 15 : 
                                   levelInfo.weight === 2 ? 45 : 75;
                    return (
                      <div key={subject}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">{subject}</span>
                          <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <CycleConfiguration
            studyPlan={studyPlan}
            subjects={studyPlan.subjects}
            subjectLevels={subjectLevels}
            onUpdatePlan={onUpdatePlan}
            onRegenerateCycle={handleRegenerateCycle}
          />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <div className="flex gap-3">
              <PlanAdjustmentModal
                studyPlan={studyPlan}
                subjects={studyPlan.subjects}
                subjectLevels={subjectLevels}
                onUpdatePlan={onUpdatePlan}
              >
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Ajustar Plano</span>
                </Button>
              </PlanAdjustmentModal>
              
              <Button 
                className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90"
                onClick={() => onStartTimer('')}
              >
                <Clock className="h-4 w-4" />
                <span>Começar a Estudar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyPlanDisplay;
