
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, Clock } from 'lucide-react';
import { StudySubject } from '@/types/study';

interface SubjectAssessmentProps {
  subjects: StudySubject[];
  subjectLevels: Record<string, string>;
  setSubjectLevels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  planType: string;
  setPlanType: (type: string) => void;
  onBack: () => void;
  onGeneratePlan: (plan: any) => void;
}

const SubjectAssessment = ({
  subjects,
  subjectLevels,
  setSubjectLevels,
  planType,
  setPlanType,
  onBack,
  onGeneratePlan
}: SubjectAssessmentProps) => {
  const levelLabels = {
    beginner: { label: 'Iniciante', color: 'bg-red-100 text-red-800', weight: 3, description: 'Preciso começar do básico' },
    intermediate: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800', weight: 2, description: 'Tenho conhecimento parcial' },
    advanced: { label: 'Avançado', color: 'bg-green-100 text-green-800', weight: 1, description: 'Domino bem o assunto' }
  };

  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'];

  const handleSubjectLevelChange = (subject: string, level: string) => {
    setSubjectLevels(prev => ({
      ...prev,
      [subject]: level
    }));
  };

  const isFormComplete = () => {
    return subjects.every(subject => subjectLevels[subject.name]);
  };

  const generateCyclePlan = (subjects: any[]) => {
    if (subjects.length === 0) return { cycle: [], totalHours: 0, focusAreas: [] };
    
    const totalWeight = subjects.reduce((sum, subject) => sum + subject.weight, 0);
    const cycleData = subjects.map(subject => ({
      ...subject,
      percentage: Math.round((subject.weight / totalWeight) * 100),
      hoursPerWeek: Math.round((subject.weight / totalWeight) * 40)
    }));

    const cycleDays = [];
    let currentDay = 0;
    
    subjects.forEach(subject => {
      const daysForSubject = Math.max(1, Math.round(subject.weight * 2));
      for (let i = 0; i < daysForSubject; i++) {
        cycleDays.push({
          day: currentDay % 7,
          dayName: weekDays[currentDay % 7],
          subject: subject.name,
          color: subject.color,
          duration: '2-3 horas',
          focus: subject.weight === 3 ? 'Fundamentos' : subject.weight === 2 ? 'Revisão e Exercícios' : 'Aprofundamento'
        });
        currentDay++;
      }
    });

    return {
      type: 'cycle',
      data: cycleData,
      cycle: cycleDays.slice(0, 14),
      totalHours: 40,
      focusAreas: subjects.filter(s => s.weight >= 2).map(s => s.name)
    };
  };

  const generateSchedulePlan = (subjects: any[]) => {
    const schedule = weekDays.map(day => ({ day, subjects: [] }));
    
    subjects.forEach((subject, index) => {
      const sessionsPerWeek = Math.max(1, subject.weight);
      
      for (let i = 0; i < sessionsPerWeek; i++) {
        const dayIndex = (index * 2 + i) % 7;
        schedule[dayIndex].subjects.push({
          name: subject.name,
          color: subject.color,
          duration: subject.weight === 3 ? '3h' : subject.weight === 2 ? '2h' : '1h',
          priority: subject.weight === 3 ? 'Alta' : subject.weight === 2 ? 'Média' : 'Baixa'
        });
      }
    });

    const weeklyData = subjects.map(subject => ({
      subject: subject.name.length > 10 ? subject.name.substring(0, 10) + '...' : subject.name,
      hours: subject.weight === 3 ? 9 : subject.weight === 2 ? 6 : 3,
      color: subject.color
    }));

    return {
      type: 'schedule',
      weekly: schedule,
      data: weeklyData,
      totalHours: weeklyData.length > 0 ? weeklyData.reduce((sum: number, item: any) => sum + item.hours, 0) : 0,
      focusAreas: subjects.filter(s => s.weight >= 2).map(s => s.name)
    };
  };

  const generateStudyPlan = () => {
    const subjectsWithWeights = subjects.map(subject => ({
      name: subject.name,
      level: subjectLevels[subject.name],
      weight: levelLabels[subjectLevels[subject.name] as keyof typeof levelLabels]?.weight || 2,
      color: colors[subjects.indexOf(subject) % colors.length]
    }));

    if (planType === 'cycle') {
      const plan = generateCyclePlan(subjectsWithWeights);
      onGeneratePlan(plan);
    } else {
      const plan = generateSchedulePlan(subjectsWithWeights);
      onGeneratePlan(plan);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-study-primary" />
          <span>Avalie seu nível de conhecimento</span>
        </CardTitle>
        <CardDescription>
          Para cada disciplina, selecione seu nível atual de conhecimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {subjects.map((subject) => (
            <div key={subject.id} className="border-b pb-4 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{subject.name}</h3>
                  {subjectLevels[subject.name] && (
                    <p className="text-sm text-gray-500">
                      {levelLabels[subjectLevels[subject.name] as keyof typeof levelLabels]?.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(levelLabels).map(([level, config]) => (
                    <button
                      key={level}
                      onClick={() => handleSubjectLevelChange(subject.name, level)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        subjectLevels[subject.name] === level
                          ? config.color + ' ring-2 ring-study-primary'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isFormComplete() && (
          <div className="mt-8 p-4 bg-study-secondary/20 rounded-lg border border-study-primary/20">
            <h3 className="font-medium text-study-primary mb-4">Escolha o tipo de cronograma:</h3>
            <RadioGroup value={planType} onValueChange={setPlanType}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cycle" id="cycle" />
                  <Label htmlFor="cycle" className="cursor-pointer">
                    <div className="font-medium">Ciclo de Estudos</div>
                    <div className="text-sm text-gray-600">Distribui as matérias em blocos rotativos</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="cursor-pointer">
                    <div className="font-medium">Agenda Semanal</div>
                    <div className="text-sm text-gray-600">Cronograma fixo para cada dia da semana</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          
          <Button 
            onClick={generateStudyPlan}
            disabled={!isFormComplete()}
            className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90 text-study-primary-foreground"
          >
            <Clock className="h-4 w-4" />
            <span>Gerar Plano de Estudos</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectAssessment;
