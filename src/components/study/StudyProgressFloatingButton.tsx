
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { StudySession, StudySubject } from '@/types/study';
import StudyProgressModal from './StudyProgressModal';

interface StudyProgressFloatingButtonProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
  visible?: boolean;
}

const StudyProgressFloatingButton: React.FC<StudyProgressFloatingButtonProps> = ({ 
  studySessions,
  subjects,
  visible = true 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!visible || studySessions.length === 0) return null;

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = studySessions.filter(session => 
      session.startTime.toDateString() === today
    );
    
    if (todaySessions.length === 0) {
      return { totalTime: 0, completedSessions: 0 };
    }
    
    const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const completedSessions = todaySessions.filter(session => session.completed).length;
    
    return { totalTime, completedSessions };
  };

  const stats = getTodayStats();

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="group relative rounded-full shadow-2xl bg-gradient-to-br from-study-primary to-study-accent hover:from-study-primary/90 hover:to-study-accent/90 text-white border-2 border-white/20 p-4 h-auto transition-all duration-300 hover:scale-105 hover:shadow-3xl backdrop-blur-sm"
          variant="default"
        >
          <div className="flex flex-col items-center space-y-1">
            <div className="relative">
              <TrendingUp className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-study-success rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold tracking-wide">{stats.totalTime}min</div>
              <div className="text-xs opacity-90 font-medium">{stats.completedSessions} sessões</div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-study-primary/50 to-study-accent/50 opacity-0 group-hover:opacity-30 blur-sm transition-all duration-300"></div>
        </Button>
      </div>

      <StudyProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studySessions={studySessions}
        subjects={subjects}
      />
    </>
  );
};

export default StudyProgressFloatingButton;
