
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, BarChart3, BookOpen } from 'lucide-react';
import StudyPlanner from '@/components/StudyPlanner';
import Dashboard from '@/components/Dashboard';
import Statistics from '@/components/Statistics';
import { StudyProvider, useStudyContext } from '@/contexts/StudyContext';

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState('planner');
  const { studySessions, subjects, studyPlan, examDate, selectedExam } = useStudyContext();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-muted/50 border border-border/50">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center space-x-2 data-[state=active]:bg-study-primary data-[state=active]:text-study-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="planner"
                className="flex items-center space-x-2 data-[state=active]:bg-study-primary data-[state=active]:text-study-primary-foreground"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Planner</span>
              </TabsTrigger>
              <TabsTrigger 
                value="statistics"
                className="flex items-center space-x-2 data-[state=active]:bg-study-primary data-[state=active]:text-study-primary-foreground"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Estatísticas</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <Dashboard 
              studySessions={studySessions}
              subjects={subjects}
              studyPlan={studyPlan}
              examDate={examDate}
              selectedExam={selectedExam}
            />
          </TabsContent>
          
          <TabsContent value="planner" className="mt-0">
            <StudyPlanner />
          </TabsContent>
          
          <TabsContent value="statistics" className="mt-0">
            <Statistics 
              studySessions={studySessions}
              subjects={subjects}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <StudyProvider>
      <IndexContent />
    </StudyProvider>
  );
};

export default Index;
