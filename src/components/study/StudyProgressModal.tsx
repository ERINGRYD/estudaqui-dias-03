
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Target, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { StudySession, StudySubject } from '@/types/study';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  studySessions: StudySession[];
  subjects: StudySubject[];
}

const StudyProgressModal: React.FC<StudyProgressModalProps> = ({
  isOpen,
  onClose,
  studySessions,
  subjects
}) => {
  const getProgressStats = () => {
    const today = new Date();
    const todayStr = today.toDateString();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    const todaySessions = studySessions.filter(session => 
      session.startTime.toDateString() === todayStr
    );

    const weekSessions = studySessions.filter(session => 
      isWithinInterval(session.startTime, { start: weekStart, end: weekEnd })
    );

    const totalTime = studySessions.length > 0 ? studySessions.reduce((sum, session) => sum + session.duration, 0) : 0;
    const todayTime = todaySessions.length > 0 ? todaySessions.reduce((sum, session) => sum + session.duration, 0) : 0;
    const weekTime = weekSessions.length > 0 ? weekSessions.reduce((sum, session) => sum + session.duration, 0) : 0;
    
    const completedSessions = studySessions.filter(session => session.completed).length;
    const todayCompleted = todaySessions.filter(session => session.completed).length;
    const weekCompleted = weekSessions.filter(session => session.completed).length;

    const subjectTime = studySessions.length > 0 ? studySessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>) : {};

    const topicProgress = studySessions.length > 0 ? studySessions.reduce((acc, session) => {
      if (session.topic) {
        const key = `${session.subject} - ${session.topic}`;
        acc[key] = (acc[key] || 0) + session.duration;
      }
      return acc;
    }, {} as Record<string, number>) : {};

    return { 
      totalTime, todayTime, weekTime, 
      completedSessions, todayCompleted, weekCompleted,
      subjectTime, topicProgress 
    };
  };

  const stats = getProgressStats();

  const subjectData = Object.entries(stats.subjectTime).map(([subject, minutes]) => {
    const subjectInfo = subjects.find(s => s.name === subject);
    return {
      subject,
      minutes,
      color: subjectInfo?.color || '#8884d8',
      percentage: Math.round((minutes / stats.totalTime) * 100)
    };
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-study-primary" />
            <span>Progresso dos Estudos</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumo</TabsTrigger>
            <TabsTrigger value="subjects">Por Matéria</TabsTrigger>
            <TabsTrigger value="topics">Por Tópico</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-study-primary" />
                    <span>Hoje</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-study-primary">{stats.todayTime}</div>
                    <div className="text-sm text-muted-foreground">minutos</div>
                    <Badge variant="outline">{stats.todayCompleted} sessões completas</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-study-accent" />
                    <span>Esta Semana</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-study-accent">{stats.weekTime}</div>
                    <div className="text-sm text-muted-foreground">minutos</div>
                    <Badge variant="outline">{stats.weekCompleted} sessões completas</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Target className="h-4 w-4 text-study-success" />
                    <span>Total</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-study-success">{stats.totalTime}</div>
                    <div className="text-sm text-muted-foreground">minutos</div>
                    <Badge variant="outline">{stats.completedSessions} sessões completas</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Matéria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ subject, percentage }) => `${subject}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="minutes"
                      >
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tempo por Matéria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.subjectTime).map(([subject, minutes]) => (
                    <div key={subject} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{subject}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-study-primary">{minutes}min</span>
                          <Badge variant="outline">
                            {Math.round((minutes / stats.totalTime) * 100)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={(minutes / stats.totalTime) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progresso por Tópico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(stats.topicProgress).map(([topicKey, minutes]) => (
                    <div key={topicKey} className="flex items-center justify-between p-3 bg-study-secondary/20 rounded-lg border border-study-primary/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-study-primary"></div>
                        <span className="font-medium">{topicKey}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-study-primary">{minutes}min</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round((minutes / stats.totalTime) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sessões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {studySessions.slice(-20).reverse().map((session, index) => (
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
                            {format(session.startTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudyProgressModal;
