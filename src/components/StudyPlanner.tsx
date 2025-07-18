import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BookOpen, Target, Brain, Clock, Calendar, ArrowLeft, Settings, TrendingUp, CheckCircle2 } from 'lucide-react';
import ExamSelection from './study/ExamSelection';
import ExamDateSelection from './study/ExamDateSelection';
import CustomSubjectSelection from './study/CustomSubjectSelection';
import AdvancedTopicManagement from './study/AdvancedTopicManagement';
import SubjectAssessment from './study/SubjectAssessment';
import StudyPlanDisplay from './study/StudyPlanDisplay';
import StudyHeaderInfo from './study/StudyHeaderInfo';
import HierarchicalTopicSelector from './study/HierarchicalTopicSelector';
import StudyPlanFloatingButton from './study/StudyPlanFloatingButton';
import StudyProgressFloatingButton from './study/StudyProgressFloatingButton';
import PomodoroTimer from './study/PomodoroTimer';
import StudyStatistics from './study/StudyStatistics';
import StudySessionHistory from './study/StudySessionHistory';
import TimerSettings from './study/TimerSettings';
import { StudySubject, StudySession, PomodoroSettings, StudyPlan, ExamType, DailyTask } from '@/types/study';
import { differenceInDays } from 'date-fns';
import { useStudyContext } from '@/contexts/StudyContext';
import { useStudyProgress } from '@/hooks/useStudyProgress';

interface WeightedSubject {
  subject: StudySubject;
  cycleWeight: number;
}

interface CycleConfig {
  forceAllSubjects: boolean;
  subjectsPerCycle: number;
  rotationIntensity: number;
  focusMode: 'balanced' | 'priority' | 'difficulty';
  avoidConsecutive: boolean;
}

interface SubjectFrequency {
  subject: StudySubject;
  targetFrequency: number;
  currentFrequency: number;
  weight: number;
}

const StudyPlanner: React.FC = () => {
  const {
    studySessions,
    setStudySessions,
    subjects: contextSubjects,
    setSubjects: setContextSubjects,
    studyPlan: contextStudyPlan,
    setStudyPlan: setContextStudyPlan,
    examDate,
    setExamDate,
    selectedExam,
    setSelectedExam,
    examTypes
  } = useStudyContext();

  const {
    dailyLogs,
    updateTaskProgress,
    toggleTaskCompletion,
    initializeDailyLog,
    updateFromSession,
    getDailyProgress,
    getWeeklyHours
  } = useStudyProgress();

  const [customSubjects, setCustomSubjects] = useState<StudySubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<StudySubject[]>([]);
  const [subjectLevels, setSubjectLevels] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(contextStudyPlan);
  const [planType, setPlanType] = useState('cycle');

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentSubtopic, setCurrentSubtopic] = useState('');
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    studyTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartSessions: false,
    soundEnabled: true
  });

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedExam && selectedExam !== 'custom') {
      const examType = examTypes.find(e => e.id === selectedExam);
      if (examType?.defaultSubjects) {
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'];
        
        const subjects = examType.defaultSubjects.map((name, index) => ({
          id: index.toString(),
          name,
          topics: [],
          weight: 2,
          color: colors[index % colors.length],
          priority: 1,
          customSubject: false,
          totalTime: 0
        }));
        
        setAllSubjects(subjects);
      }
    } else if (selectedExam === 'custom') {
      setAllSubjects(customSubjects);
    }
  }, [selectedExam, customSubjects]);

  const getCurrentSubjects = (): StudySubject[] => {
    return allSubjects;
  };

  const updateCurrentSubjects = (subjects: StudySubject[]) => {
    if (selectedExam === 'custom') {
      setCustomSubjects(subjects);
    }
    setAllSubjects(subjects);
    setContextSubjects(subjects);
  };

  const generateIntelligentCyclePlan = (
    subjects: StudySubject[],
    weeklyHours: number,
    config: CycleConfig
  ) => {
    console.log('🔄 Generating cycle with config:', config, 'Weekly hours:', weeklyHours);
    
    if (subjects.length === 0) {
      console.warn('⚠️ No subjects provided for cycle generation');
      return [];
    }

    const daysInCycle = 14;
    const totalCycleHours = weeklyHours * 2; // 2 semanas
    const averageHoursPerDay = Math.max(1.5, totalCycleHours / daysInCycle); // Minimum 1.5h per day
    
    console.log('📊 Total cycle hours:', totalCycleHours, 'Average per day:', averageHoursPerDay);

    // Preparar matérias com pesos - FIXED: Proper initialization
    const weightedSubjects = subjects.map(subject => {
      const level = subjectLevels[subject.name] || 'intermediate';
      const levelWeight = level === 'beginner' ? 3 : level === 'intermediate' ? 2 : 1;
      
      let finalWeight = levelWeight;
      
      // Ajustar peso baseado no modo de foco
      if (config.focusMode === 'priority') {
        finalWeight = levelWeight * 1.5;
      } else if (config.focusMode === 'difficulty') {
        finalWeight = levelWeight * 2;
      }
      
      return {
        ...subject,
        weight: finalWeight,
        timesUsed: 0,
        lastUsedDay: -3 // FIXED: Set to -3 to avoid conflicts with day 0
      };
    });

    // Determinar quais matérias incluir
    const subjectsToInclude = config.forceAllSubjects 
      ? weightedSubjects
      : weightedSubjects
          .sort((a, b) => b.weight - a.weight)
          .slice(0, config.subjectsPerCycle);

    console.log('📚 Subjects to include:', subjectsToInclude.map(s => `${s.name} (weight: ${s.weight})`));

    const cycle = [];
    const dayNames = [
      'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo',
      'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
    ];

    const weeklyLimit = weeklyHours;

    // Gerar cada dia do ciclo
    for (let day = 0; day < daysInCycle; day++) {
      console.log(`🗓️ Generating Day ${day + 1} (${dayNames[day]})`);
      
      const tasks: DailyTask[] = [];
      let dayHours = 0;
      const targetHours = Math.max(1.0, Math.min(averageHoursPerDay, weeklyLimit / 7)); // FIXED: Minimum 1h per day
      
      console.log(`⏰ Target hours for day ${day + 1}: ${targetHours}`);

      // Continuar adicionando matérias até atingir as horas do dia
      let attempts = 0;
      const maxAttempts = subjectsToInclude.length * 3; // Prevent infinite loops
      
      while (dayHours < targetHours && tasks.length < 4 && attempts < maxAttempts) {
        attempts++;
        
        // Encontrar a melhor matéria para este momento - FIXED: Better filtering logic
        const availableSubjects = subjectsToInclude.filter(subject => {
          // FIXED: Proper consecutive day logic
          if (config.avoidConsecutive && day > 0 && subject.lastUsedDay === day - 1) {
            console.log(`🚫 Skipping ${subject.name} - used on previous day (${subject.lastUsedDay})`);
            return false;
          }
          // Evitar repetir a mesma matéria no mesmo dia
          const alreadyInDay = tasks.some(task => task.subject === subject.name);
          if (alreadyInDay) {
            console.log(`🚫 Skipping ${subject.name} - already scheduled for day ${day + 1}`);
            return false;
          }
          return true;
        });

        console.log(`📋 Day ${day + 1} - Available subjects:`, availableSubjects.map(s => `${s.name} (used: ${s.timesUsed})`));

        if (availableSubjects.length === 0) {
          console.log(`⚠️ No available subjects for day ${day + 1}, breaking loop`);
          break;
        }

        // Selecionar matéria baseada no algoritmo de balanceamento
        let selectedSubject;
        
        if (config.focusMode === 'balanced') {
          selectedSubject = availableSubjects.reduce((min, current) => {
            if (current.timesUsed < min.timesUsed) return current;
            if (current.timesUsed === min.timesUsed && current.weight > min.weight) return current;
            return min;
          });
        } else {
          const weightedSelection = availableSubjects.map(subject => ({
            ...subject,
            adjustedWeight: subject.weight / Math.max(1, subject.timesUsed + 1)
          }));
          
          selectedSubject = weightedSelection.reduce((max, current) => 
            current.adjustedWeight > max.adjustedWeight ? current : max
          );
        }

        // Calcular duração para esta matéria neste dia - FIXED: Better duration calculation
        const remainingHours = targetHours - dayHours;
        const maxTaskDuration = Math.min(2.5, remainingHours); // Max 2.5h per task
        const minTaskDuration = 0.5; // Min 0.5h per task
        
        const taskDuration = Math.max(
          minTaskDuration,
          Math.min(maxTaskDuration, remainingHours / Math.max(1, 4 - tasks.length))
        );

        console.log(`✅ Selected ${selectedSubject.name} for ${taskDuration.toFixed(1)}h on day ${day + 1}`);

        // Criar tarefa com ID único
        const task: DailyTask = {
          id: `day${day + 1}-${selectedSubject.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          subject: selectedSubject.name,
          topic: selectedSubject.topics?.[0]?.name,
          subtopic: selectedSubject.topics?.[0]?.subtopics?.[0],
          plannedHours: Number(taskDuration.toFixed(1)),
          studiedHours: 0,
          completed: false,
          color: selectedSubject.color || '#8884d8',
          priority: selectedSubject.weight >= 3 ? 'high' : selectedSubject.weight >= 2 ? 'medium' : 'low'
        };

        tasks.push(task);

        // Atualizar controles
        selectedSubject.timesUsed++;
        selectedSubject.lastUsedDay = day;
        dayHours += taskDuration;
        
        console.log(`📝 Added task: ${task.subject} (${task.plannedHours}h) - Total day hours: ${dayHours.toFixed(1)}`);
      }

      const totalDayHours = tasks.reduce((sum, task) => sum + task.plannedHours, 0);
      
      console.log(`✅ Day ${day + 1} completed with ${tasks.length} tasks and ${totalDayHours.toFixed(1)}h total`);

      // Adicionar o dia ao ciclo
      cycle.push({
        day: day + 1,
        dayName: dayNames[day],
        subject: tasks.length === 1 ? tasks[0].subject : `${tasks.length} matérias`,
        topic: tasks.length === 1 ? tasks[0].topic : tasks.map(t => t.subject).join(', '),
        subtopic: tasks.length === 1 ? tasks[0].subtopic : `${tasks.length} sessões de estudo`,
        color: tasks.length > 0 ? tasks[0].color : '#8884d8',
        duration: `${totalDayHours.toFixed(1)}h`,
        focus: tasks.length === 1 ? (tasks[0].priority === 'high' ? 'Alta' : tasks[0].priority === 'medium' ? 'Média' : 'Baixa') : 'Múltiplas',
        priority: 1,
        tasks: tasks,
        totalPlannedHours: totalDayHours
      });

      // Inicializar log diário se não existir - FIXED: Proper date calculation
      const cycleStartDate = new Date();
      const dayDate = new Date(cycleStartDate);
      dayDate.setDate(dayDate.getDate() + day);
      const dateKey = dayDate.toDateString();
      
      console.log(`📅 Initializing daily log for day ${day + 1}: ${dateKey}`);
      initializeDailyLog(dateKey, tasks);
    }

    console.log('🎉 Cycle generation completed!', cycle.length, 'days generated');
    return cycle;
  };

  const startTimer = (subject: string, topic?: string, subtopic?: string, taskId?: string) => {
    if (!subject) return;
    
    setCurrentSubject(subject);
    setCurrentTopic(topic || '');
    setCurrentSubtopic(subtopic || '');
    setTimer(pomodoroSettings.studyTime);
    setTimerMode('study');
    setIsTimerRunning(true);
    setCurrentSession({
      id: Date.now().toString(),
      subject,
      topic,
      subtopic,
      startTime: new Date(),
      duration: 0,
      completed: false,
      taskId
    });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000 / 60);
      
      const completedSession: StudySession = {
        ...currentSession,
        endTime,
        duration,
        completed: false
      };
      
      setStudySessions(prev => [...prev, completedSession]);
      updateFromSession(completedSession);
    }
    
    setIsTimerRunning(false);
    setTimer(0);
    setCurrentSession(null);
    setCurrentSubject('');
    setCurrentTopic('');
    setCurrentSubtopic('');
  };

  const handleTimerSettingChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    setPomodoroSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerInterval.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerMode === 'study') {
              const isLongBreak = (completedSessions + 1) % pomodoroSettings.sessionsUntilLongBreak === 0;
              const breakTime = isLongBreak ? pomodoroSettings.longBreakTime : pomodoroSettings.breakTime;
              
              if (currentSession) {
                const completedSession: StudySession = {
                  ...currentSession,
                  endTime: new Date(),
                  duration: pomodoroSettings.studyTime / 60,
                  completed: true
                };
                
                setStudySessions(prev => [...prev, completedSession]);
                updateFromSession(completedSession);
                setCompletedSessions(prev => prev + 1);
              }
              
              setTimerMode('break');
              return breakTime;
            } else {
              setTimerMode('study');
              setCurrentSession(null);
              setIsTimerRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTimerRunning, timer, timerMode, currentSession, completedSessions, pomodoroSettings, updateFromSession]);

  const handleGeneratePlan = (generatedPlan: StudyPlan) => {
    console.log('Generating study plan with data:', generatedPlan);
    
    try {
      // Add weekly hour limit
      const planWithTasks = {
        ...generatedPlan,
        id: generatedPlan.id || Date.now().toString(),
        subjects: getCurrentSubjects(),
        examDate: examDate,
        weeklyHourLimit: generatedPlan.totalHours
      };

      console.log('Plan created with ID:', planWithTasks.id);
      
      // Update states
      setStudyPlan(planWithTasks);
      setContextStudyPlan(planWithTasks);
      
      // Update subjects in context
      setContextSubjects(getCurrentSubjects());
      
      // Save to localStorage for persistence
      try {
        const savedPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]');
        const updatedPlans = [...savedPlans, planWithTasks];
        localStorage.setItem('studyPlans', JSON.stringify(updatedPlans));
        console.log('Plan saved to localStorage');
      } catch (storageError) {
        console.warn('Failed to save plan to localStorage:', storageError);
      }
      
      // Advance to step 6
      setCurrentStep(6);
      console.log('Advanced to step 6 - plan display');
      
    } catch (error) {
      console.error('Error in handleGeneratePlan:', error);
      setCurrentStep(6);
    }
  };

  const handleRegenerateCycle = (config: CycleConfig) => {
    if (!studyPlan) return;
    
    console.log('🔄 Regenerating cycle with config:', config);
    
    const cycle = generateIntelligentCyclePlan(getCurrentSubjects(), studyPlan.totalHours, config);
    const updatedPlan = {
      ...studyPlan,
      cycle: cycle
    };
    
    setStudyPlan(updatedPlan);
    
    // Salvar no localStorage
    const savedPlans = JSON.parse(localStorage.getItem('studyPlans') || '[]');
    const updatedPlans = savedPlans.map((plan: StudyPlan) => 
      plan.id === updatedPlan.id ? updatedPlan : plan
    );
    localStorage.setItem('studyPlans', JSON.stringify(updatedPlans));
  };

  const handleUpdatePlan = (updatedPlan: StudyPlan) => {
    setStudyPlan(updatedPlan);
    setContextStudyPlan(updatedPlan);
  };

  const getNextSuggestion = () => {
    if (!studyPlan?.cycle) return '';
    const today = new Date().getDay();
    const todayCycle = studyPlan.cycle.find(c => c.dayName === ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][today]);
    return todayCycle ? `${todayCycle.subject}${todayCycle.topic ? ` - ${todayCycle.topic}` : ''}` : '';
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-study-primary mb-2">
          Planner de Estudos Inteligente
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Crie seu plano personalizado e acompanhe seu progresso com metodologia avançada
        </p>
      </div>

      <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-8 overflow-x-auto">
        {[
          { step: 1, label: 'Exame', icon: Target },
          { step: 2, label: 'Data', icon: Calendar },
          { step: 3, label: 'Matérias', icon: BookOpen },
          { step: 4, label: 'Tópicos', icon: Brain },
          { step: 5, label: 'Avaliação', icon: CheckCircle2 },
          { step: 6, label: 'Plano', icon: Clock }
        ].map(({ step, label, icon: Icon }) => (
          <div key={step} className="flex flex-col items-center space-y-1 sm:space-y-2 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
              currentStep >= step 
                ? 'bg-study-primary text-study-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {currentStep > step ? (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
            <span className={`text-xs ${
              currentStep >= step ? 'text-study-primary font-medium' : 'text-muted-foreground'
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <ExamSelection
          examTypes={examTypes}
          selectedExam={selectedExam}
          setSelectedExam={setSelectedExam}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <ExamDateSelection
          examDate={examDate}
          setExamDate={setExamDate}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <CustomSubjectSelection
          selectedSubjects={getCurrentSubjects()}
          setSelectedSubjects={updateCurrentSubjects}
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <AdvancedTopicManagement
          subjects={getCurrentSubjects()}
          setSubjects={updateCurrentSubjects}
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <SubjectAssessment
          subjects={getCurrentSubjects()}
          subjectLevels={subjectLevels}
          setSubjectLevels={setSubjectLevels}
          planType={planType}
          setPlanType={setPlanType}
          onBack={() => setCurrentStep(4)}
          onGeneratePlan={handleGeneratePlan}
        />
      )}

      {currentStep === 6 && studyPlan && (
        <div className="space-y-6">
          <StudyHeaderInfo
            examDate={examDate}
            selectedExam={selectedExam}
            examTypes={examTypes}
            nextSuggestion={getNextSuggestion()}
          />

          <StudyPlanDisplay
            studyPlan={studyPlan}
            subjectLevels={subjectLevels}
            studySessions={studySessions}
            onBack={() => setCurrentStep(5)}
            onStartTimer={startTimer}
            onUpdatePlan={handleUpdatePlan}
            onRegenerateCycle={handleRegenerateCycle}
          />
        </div>
      )}

      {currentStep === 7 && studyPlan && (
        <div className="space-y-6">
          <StudyHeaderInfo
            examDate={examDate}
            selectedExam={selectedExam}
            examTypes={examTypes}
            currentSubject={currentSubject}
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            compact={true}
          />

          <Card className="bg-gradient-to-r from-study-primary to-study-accent text-study-primary-foreground">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {timerMode === 'study' ? '📚 Sessão de Estudos' : '☕ Intervalo'}
                </h2>
                <p className="text-lg sm:text-xl opacity-90">
                  {timerMode === 'study' ? (
                    <>
                      {currentSubject || 'Selecione uma matéria'}
                      {currentTopic && <><br /><span className="text-base opacity-80">📖 {currentTopic}</span></>}
                      {currentSubtopic && <><br /><span className="text-sm opacity-70">• {currentSubtopic}</span></>}
                    </>
                  ) : 'Momento de descansar'}
                </p>
              </div>
            </CardContent>
          </Card>

          <PomodoroTimer
            subjects={getCurrentSubjects()}
            currentSubject={currentSubject}
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            timer={timer}
            isTimerRunning={isTimerRunning}
            timerMode={timerMode}
            currentSession={currentSession}
            pomodoroSettings={pomodoroSettings}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResumeTimer={resumeTimer}
            onStopTimer={stopTimer}
            onBackToPlanner={() => setCurrentStep(6)}
            onOpenSettings={() => setCurrentStep(8)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StudySessionHistory studySessions={studySessions} />
            <StudyStatistics studySessions={studySessions} />
          </div>
        </div>
      )}

      {currentStep === 8 && (
        <TimerSettings
          pomodoroSettings={pomodoroSettings}
          onSettingChange={handleTimerSettingChange}
          onSave={() => setCurrentStep(7)}
          onCancel={() => setCurrentStep(7)}
        />
      )}

      <StudyPlanFloatingButton 
        onClick={() => setCurrentStep(6)}
        visible={currentStep === 7 && !!studyPlan}
      />

      <StudyProgressFloatingButton
        studySessions={studySessions}
        subjects={getCurrentSubjects()}
        visible={studySessions.length > 0}
      />
    </div>
  );
};

export default StudyPlanner;
