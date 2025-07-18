
export interface StudySubject {
  id: string;
  name: string;
  topics?: StudyTopic[];
  weight?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  color?: string;
  priority?: number;
  lastStudied?: Date;
  totalTime?: number;
  customSubject?: boolean;
}

export interface StudyTopic {
  id: string;
  name: string;
  subjectId: string;
  subtopics?: StudySubtopic[];
  weight?: number;
  completed?: boolean;
  lastStudied?: Date;
  totalTime?: number;
}

export interface StudySubtopic {
  id: string;
  name: string;
  topicId: string;
  weight?: number;
  completed?: boolean;
  lastStudied?: Date;
  totalTime?: number;
}

export interface DailyTask {
  id: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  plannedHours: number;
  studiedHours: number;
  completed: boolean;
  color: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DailyStudyLog {
  date: string;
  tasks: DailyTask[];
  totalPlannedHours: number;
  totalStudiedHours: number;
  completed: boolean;
}

export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  notes?: string;
  performance?: 'low' | 'medium' | 'high';
  taskId?: string;
}

export interface PomodoroSettings {
  studyTime: number;
  breakTime: number;
  longBreakTime: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  soundEnabled: boolean;
}

export interface StudyPlan {
  id?: string;
  type: 'cycle' | 'schedule';
  examDate?: Date;
  daysUntilExam?: number;
  subjects: StudySubject[];
  data?: any;
  cycle?: CycleDay[];
  weekly?: WeeklySchedule[];
  totalHours: number;
  focusAreas: string[];
  intensity?: 'low' | 'medium' | 'high';
  methodology?: 'pomodoro' | 'timeboxing' | 'custom';
  weeklyHourLimit?: number;
}

export interface CycleDay {
  day: number;
  dayName: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  color: string;
  duration: string;
  focus: string;
  priority: number;
  tasks: DailyTask[];
  totalPlannedHours: number;
}

export interface WeeklySchedule {
  day: string;
  subjects: {
    name: string;
    topic?: string;
    color: string;
    duration: string;
    priority: string;
    timeSlot?: string;
  }[];
  tasks: DailyTask[];
  totalPlannedHours: number;
}

export interface ExamType {
  id: string;
  name: string;
  description: string;
  defaultSubjects?: string[];
  recommendedHours?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StudyGoal {
  id: string;
  subject: string;
  topic?: string;
  targetHours: number;
  deadline: Date;
  completed: boolean;
  progress: number;
}
