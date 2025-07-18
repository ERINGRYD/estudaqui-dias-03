
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { StudySession } from '@/types/study';

interface StudySessionHistoryProps {
  studySessions: StudySession[];
}

const StudySessionHistory: React.FC<StudySessionHistoryProps> = ({ studySessions }) => {
  if (studySessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Histórico de Sessões</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {studySessions.slice(-10).reverse().map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-study-secondary/20 rounded-lg border border-study-primary/20">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  session.completed ? 'bg-study-success' : 'bg-study-warning'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-study-primary truncate">{session.subject}</div>
                  {session.topic && (
                    <div className="text-xs text-muted-foreground">📖 {session.topic}</div>
                  )}
                  {session.subtopic && (
                    <div className="text-xs text-muted-foreground pl-3">• {session.subtopic}</div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {session.startTime.toLocaleTimeString()} - {session.endTime?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-study-primary">{session.duration}min</div>
                <div className="text-sm text-muted-foreground">
                  {session.completed ? '✅ Completa' : '⏸️ Interrompida'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudySessionHistory;
