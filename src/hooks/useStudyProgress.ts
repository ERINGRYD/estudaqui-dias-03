
import { useState, useEffect } from 'react';
import { DailyTask, DailyStudyLog, StudySession } from '@/types/study';

export const useStudyProgress = () => {
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyStudyLog>>({});

  useEffect(() => {
    const saved = localStorage.getItem('studyProgress');
    if (saved) {
      try {
        setDailyLogs(JSON.parse(saved));
        console.log('📚 PROGRESS DEBUG - Loaded daily logs from localStorage:', Object.keys(JSON.parse(saved)));
      } catch (error) {
        console.error('Error loading study progress:', error);
      }
    }
  }, []);

  const saveToDailyLogs = (logs: Record<string, DailyStudyLog>) => {
    setDailyLogs(logs);
    localStorage.setItem('studyProgress', JSON.stringify(logs));
    console.log('💾 PROGRESS DEBUG - Saved daily logs to localStorage:', Object.keys(logs));
  };

  const updateTaskProgress = (dateKey: string, taskId: string, studiedHours: number, completed?: boolean) => {
    const updatedLogs = { ...dailyLogs };
    
    if (!updatedLogs[dateKey]) {
      console.warn(`No daily log found for date: ${dateKey}`);
      return;
    }

    const taskIndex = updatedLogs[dateKey].tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      console.warn(`Task ${taskId} not found in daily log for ${dateKey}`);
      return;
    }

    updatedLogs[dateKey].tasks[taskIndex] = {
      ...updatedLogs[dateKey].tasks[taskIndex],
      studiedHours: Math.min(studiedHours, updatedLogs[dateKey].tasks[taskIndex].plannedHours),
      completed: completed !== undefined ? completed : studiedHours >= updatedLogs[dateKey].tasks[taskIndex].plannedHours
    };

    // Recalculate totals
    updatedLogs[dateKey].totalStudiedHours = updatedLogs[dateKey].tasks.reduce((sum, task) => sum + task.studiedHours, 0);
    updatedLogs[dateKey].completed = updatedLogs[dateKey].tasks.every(task => task.completed);

    console.log(`Updated task progress for ${dateKey}, task ${taskId}:`, updatedLogs[dateKey].tasks[taskIndex]);
    saveToDailyLogs(updatedLogs);
  };

  const toggleTaskCompletion = (dateKey: string, taskId: string) => {
    const updatedLogs = { ...dailyLogs };
    
    if (!updatedLogs[dateKey]) {
      console.warn(`No daily log found for date: ${dateKey}`);
      return;
    }

    const taskIndex = updatedLogs[dateKey].tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      console.warn(`Task ${taskId} not found in daily log for ${dateKey}`);
      return;
    }

    const task = updatedLogs[dateKey].tasks[taskIndex];
    const newCompleted = !task.completed;
    
    updatedLogs[dateKey].tasks[taskIndex] = {
      ...task,
      completed: newCompleted,
      studiedHours: newCompleted ? task.plannedHours : task.studiedHours
    };

    // Recalculate totals
    updatedLogs[dateKey].totalStudiedHours = updatedLogs[dateKey].tasks.reduce((sum, task) => sum + task.studiedHours, 0);
    updatedLogs[dateKey].completed = updatedLogs[dateKey].tasks.every(task => task.completed);

    console.log(`Toggled task completion for ${dateKey}, task ${taskId}. New state:`, newCompleted);
    saveToDailyLogs(updatedLogs);
  };

  const initializeDailyLog = (dateKey: string, tasks: DailyTask[]) => {
    console.log(`🎯 INIT DEBUG - Starting initialization for ${dateKey} with ${tasks.length} tasks`);
    
    // FIXED: Check current state SYNCHRONOUSLY
    const currentLogs = dailyLogs;
    const existingLog = currentLogs[dateKey];
    
    if (existingLog && existingLog.tasks && existingLog.tasks.length > 0) {
      console.log(`📅 INIT DEBUG - Daily log for ${dateKey} already exists with ${existingLog.tasks.length} tasks, keeping existing data`);
      return existingLog;
    }

    // FIXED: Strict validation
    if (!tasks || tasks.length === 0) {
      console.error(`❌ INIT DEBUG - No tasks provided for ${dateKey}!`);
      return null;
    }

    // FIXED: Clean and validate tasks with better error handling
    const validatedTasks = tasks
      .filter(task => {
        if (!task) {
          console.warn(`🚫 INIT DEBUG - Null/undefined task filtered out`);
          return false;
        }
        if (!task.id) {
          console.warn(`🚫 INIT DEBUG - Task without ID filtered out:`, task);
          return false;
        }
        if (!task.subject) {
          console.warn(`🚫 INIT DEBUG - Task without subject filtered out:`, task);
          return false;
        }
        if (!task.plannedHours || task.plannedHours <= 0) {
          console.warn(`🚫 INIT DEBUG - Task with invalid plannedHours filtered out:`, task);
          return false;
        }
        return true;
      })
      .map(task => {
        // FIXED: Ensure all fields are properly typed
        const cleanTask: DailyTask = { 
          id: String(task.id),
          subject: String(task.subject),
          topic: task.topic && typeof task.topic === 'string' ? task.topic : undefined,
          subtopic: task.subtopic && typeof task.subtopic === 'string' ? task.subtopic : undefined,
          plannedHours: Math.max(0.5, Number(task.plannedHours)),
          studiedHours: 0, 
          completed: false,
          color: task.color || '#8884d8',
          priority: task.priority || 'medium'
        };
        
        console.log(`✅ INIT DEBUG - Validated task:`, cleanTask);
        return cleanTask;
      });

    if (validatedTasks.length === 0) {
      console.error(`❌ INIT DEBUG - No valid tasks remaining for ${dateKey}! Original tasks:`, tasks);
      return null;
    }

    const newLog: DailyStudyLog = {
      date: dateKey,
      tasks: validatedTasks,
      totalPlannedHours: validatedTasks.reduce((sum, task) => sum + task.plannedHours, 0),
      totalStudiedHours: 0,
      completed: false
    };

    console.log(`✅ INIT DEBUG - Created daily log for ${dateKey}:`, newLog);

    // FIXED: Immediate state update with proper merging
    const updatedLogs = { ...currentLogs, [dateKey]: newLog };
    
    // FIXED: Force immediate state update
    setDailyLogs(updatedLogs);
    localStorage.setItem('studyProgress', JSON.stringify(updatedLogs));
    
    console.log(`💾 INIT DEBUG - Immediately saved and updated state for ${dateKey}`);
    
    // FIXED: Verify the update was successful
    setTimeout(() => {
      const verifyLogs = JSON.parse(localStorage.getItem('studyProgress') || '{}');
      const verifyLog = verifyLogs[dateKey];
      if (verifyLog && verifyLog.tasks && verifyLog.tasks.length > 0) {
        console.log(`✅ INIT DEBUG - Verification successful for ${dateKey}: ${verifyLog.tasks.length} tasks`);
      } else {
        console.error(`❌ INIT DEBUG - Verification failed for ${dateKey}`);
      }
    }, 100);
    
    return newLog;
  };

  const updateFromSession = (session: StudySession) => {
    if (!session.taskId || !session.endTime) return;

    const dateKey = session.startTime.toDateString();
    const sessionHours = session.duration / 60; // Convert minutes to hours

    const currentLog = dailyLogs[dateKey];
    if (!currentLog) {
      console.warn(`No daily log found for session date: ${dateKey}`);
      return;
    }

    const task = currentLog.tasks.find(t => t.id === session.taskId);
    if (!task) {
      console.warn(`Task ${session.taskId} not found in daily log for ${dateKey}`);
      return;
    }

    const newStudiedHours = task.studiedHours + sessionHours;
    updateTaskProgress(dateKey, session.taskId, newStudiedHours);
  };

  const getDailyProgress = (dateKey: string) => {
    const result = dailyLogs[dateKey] || null;
    
    // FIXED: Enhanced debugging for specific dates
    if (dateKey.includes('Tue Jul 08 2025')) {
      console.log(`🎯 PROGRESS DEBUG - getDailyProgress for DAY 0 (${dateKey}):`, 
        result ? `Found log with ${result.tasks.length} tasks` : 'NO LOG FOUND'
      );
      if (result && result.tasks) {
        console.log(`📝 PROGRESS DEBUG - Day 0 tasks:`, result.tasks.map(t => ({ id: t.id, subject: t.subject })));
      }
    }
    
    return result;
  };

  const getWeeklyHours = (weekStart: Date) => {
    let totalPlanned = 0;
    let totalStudied = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toDateString();
      
      const log = dailyLogs[dateKey];
      if (log) {
        totalPlanned += log.totalPlannedHours;
        totalStudied += log.totalStudiedHours;
      }
    }

    return { totalPlanned, totalStudied };
  };

  return {
    dailyLogs,
    updateTaskProgress,
    toggleTaskCompletion,
    initializeDailyLog,
    updateFromSession,
    getDailyProgress,
    getWeeklyHours
  };
};
