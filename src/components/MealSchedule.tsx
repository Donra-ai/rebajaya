'use client';

import React from 'react';
import { MealItem, MealPlan } from '@/types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, Sparkles, Utensils, AlertCircle, FileText, Bot } from 'lucide-react';

interface MealScheduleProps {
  plan: MealPlan;
  completedMealIds: string[];
  onToggleMeal: (mealId: string) => void;
  onOpenDietModal: () => void;
}

export default function MealSchedule({
  plan,
  completedMealIds,
  onToggleMeal,
  onOpenDietModal,
}: MealScheduleProps) {
  const [currentTotalMinutes, setCurrentTotalMinutes] = React.useState<number | null>(null);

  React.useEffect(() => {
    const now = new Date();
    setCurrentTotalMinutes(now.getHours() * 60 + now.getMinutes());
  }, []);

  const totalMeals = plan.meals.length;
  const completedCount = completedMealIds.length;
  const progressPct = totalMeals > 0 ? Math.round((completedCount / totalMeals) * 100) : 0;

  const handleToggle = (mealId: string) => {
    const isNowDone = !completedMealIds.includes(mealId);
    onToggleMeal(mealId);

    if (isNowDone) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b'],
      });
    }
  };

  // Determinar ícono y color según tipo de comida
  const getMealBadge = (type: string) => {
    switch (type) {
      case 'desayuno':
        return { label: 'Desayuno', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'media_manana':
        return { label: 'Media Mañana', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'almuerzo':
        return { label: 'Almuerzo Principal', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'merienda':
        return { label: 'Merienda', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'cena':
        return { label: 'Cena', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      default:
        return { label: 'Comida', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Cabecera del Cronograma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Utensils className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Horarios y Dieta</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">{plan.title}</p>
        </div>

        {/* Acciones de Dieta / Botón de cambio */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDietModal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Actualizar Plan (IA / PDF)</span>
          </button>
        </div>
      </div>

      {/* Barra de progreso del día */}
      <div className="mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-300 mb-2">
          <span>Progreso de comidas hoy</span>
          <span className="text-emerald-400">
            {completedCount} de {totalMeals} comidas ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Lista de Comidas del Plan */}
      <div className="space-y-4">
        {plan.meals.map((meal, index) => {
          const isDone = completedMealIds.includes(meal.id);
          const badge = getMealBadge(meal.type);

          // Parsear hora en minutos para saber si ya pasó o es la siguiente
          const [mealHours, mealMins] = meal.time.split(':').map(Number);
          const mealTotalMins = (mealHours || 0) * 60 + (mealMins || 0);
          const isUpcomingOrCurrent = currentTotalMinutes !== null && Math.abs(currentTotalMinutes - mealTotalMins) <= 60;

          return (
            <div
              key={meal.id}
              className={`relative rounded-2xl p-5 border transition-all duration-200 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80'
                  : isUpcomingOrCurrent
                  ? 'bg-gradient-to-br from-slate-800/90 to-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Información de la comida */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    <span className="flex items-center gap-1 text-sm font-bold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      {meal.time} hrs
                    </span>

                    {isUpcomingOrCurrent && !isDone && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-emerald-500 text-slate-950 animate-bounce">
                        ¡Hora de comer!
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-xl font-bold ${
                      isDone ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {meal.name}
                  </h3>

                  <p className="mt-2 text-base text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    {meal.description}
                  </p>

                  {meal.tips && (
                    <p className="mt-2 text-xs text-amber-300/90 flex items-center gap-1.5 italic">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                      <span>Consejo: {meal.tips}</span>
                    </p>
                  )}
                </div>

                {/* Botón Gigante de Marcado Rápido */}
                <div className="sm:self-center">
                  <button
                    onClick={() => handleToggle(meal.id)}
                    className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 shadow-lg ${
                      isDone
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 shadow-emerald-950/30'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-7 h-7 stroke-[2.5] ${
                        isDone ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-950'
                      }`}
                    />
                    <span>{isDone ? '¡Comido! ✅' : '¡Listo, ya comí!'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {plan.summary && (
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-sm text-slate-400">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            Indicaciones del Plan Nutricional:
          </p>
          <p className="leading-relaxed">{plan.summary}</p>
        </div>
      )}
    </div>
  );
}
