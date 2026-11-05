'use client';

import React, { useState, useEffect } from 'react';
import { MealItem, MealPlan, UserProfile } from '@/types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Utensils,
  Calendar,
  RefreshCw,
  ShoppingCart,
  Bot,
  X,
  Check,
  Loader2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface MealScheduleProps {
  plan: MealPlan;
  completedMealIds: string[];
  onToggleMeal: (mealId: string) => void;
  onOpenDietModal: () => void;
  onUpdatePlan?: (updatedPlan: MealPlan) => void;
  userProfile?: UserProfile;
}

const DAYS_OF_WEEK = [
  { key: 'lunes', label: 'Lun', full: 'Lunes' },
  { key: 'martes', label: 'Mar', full: 'Martes' },
  { key: 'miercoles', label: 'Mié', full: 'Miércoles' },
  { key: 'jueves', label: 'Jue', full: 'Jueves' },
  { key: 'viernes', label: 'Vie', full: 'Viernes' },
  { key: 'sabado', label: 'Sáb', full: 'Sábado' },
  { key: 'domingo', label: 'Dom', full: 'Domingo' },
];

const STANDARD_EQUIVALENCES = [
  {
    category: '🥩 Proteínas equivalentes',
    items: ['150g Pechuga de pollo', '2 Huevos enteros', '1 Lata de atún al natural', '150g Pescado blanco', '150g Tofu firme'],
  },
  {
    category: '🥔 Carbohidratos equivalentes',
    items: ['1/2 taza Arroz integral', '1 Papa mediana cocida', '1 Batata pequeña', '40g Avena en hojuelas', '1 Arepa o tortilla de maíz'],
  },
  {
    category: '🥑 Grasas saludables',
    items: ['1/4 Aguacate', '1 cucharada Aceite de oliva', '10 Almendras o nueces', '1 cda Mantequilla de maní sin azúcar'],
  },
];

export default function MealSchedule({
  plan,
  completedMealIds,
  onToggleMeal,
  onOpenDietModal,
  onUpdatePlan,
  userProfile,
}: MealScheduleProps) {
  // Detectar día de la semana actual
  const getTodayKey = (): string => {
    const day = new Date().getDay(); // 0 domingo, 1 lunes...
    const map = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return map[day];
  };

  const todayKey = getTodayKey();
  const [selectedDay, setSelectedDay] = useState<string>(todayKey);
  const [currentTotalMinutes, setCurrentTotalMinutes] = useState<number | null>(null);

  // Estados para modal de sustitución
  const [substituteMeal, setSubstituteMeal] = useState<MealItem | null>(null);
  const [pantryInput, setPantryInput] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Estados para modal de lista de compras
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [checkedGroceries, setCheckedGroceries] = useState<Record<string, boolean>>({});

  // Estado para lectura con voz (Web Speech API)
  const [speakingMealId, setSpeakingMealId] = useState<string | null>(null);

  const handleSpeakMeal = (meal: MealItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Tu navegador no cuenta con soporte de voz.');
      return;
    }

    if (speakingMealId === meal.id) {
      window.speechSynthesis.cancel();
      setSpeakingMealId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMealId(meal.id);

    const speechText = `${meal.name}. Programada a las ${meal.time} horas. ${meal.description}. Consejo clínico de la doctora Lucía: ${meal.tips || 'Buen provecho y mastica con calma.'}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMealId(null);
    utterance.onerror = () => setSpeakingMealId(null);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const now = new Date();
    setCurrentTotalMinutes(now.getHours() * 60 + now.getMinutes());
  }, []);

  // Obtener comidas para el día seleccionado
  const currentMeals: MealItem[] =
    plan.weeklyMeals && plan.weeklyMeals[selectedDay]
      ? plan.weeklyMeals[selectedDay]
      : plan.meals;

  const totalMeals = currentMeals.length;
  const completedCount = currentMeals.filter((m) => completedMealIds.includes(m.id)).length;
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

  // Sustituir con IA
  const handleAiReplace = async () => {
    if (!substituteMeal || !pantryInput.trim()) return;

    setIsReplacing(true);
    setReplaceError(null);
    setAiExplanation(null);

    try {
      const res = await fetch('/api/gemini/replace-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMeal: substituteMeal,
          availableIngredients: pantryInput.trim(),
          userProfile: userProfile
            ? {
                name: userProfile.name,
                weightKg: userProfile.currentWeightKg,
                targetKg: userProfile.targetWeightKg,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al adaptar la comida con IA');
      }

      setAiExplanation(data.explanation);

      // Actualizar comida en el plan actual
      if (onUpdatePlan) {
        const updatedMeals = currentMeals.map((m) =>
          m.id === substituteMeal.id ? data.newMeal : m
        );

        let updatedPlan: MealPlan;
        if (plan.weeklyMeals) {
          updatedPlan = {
            ...plan,
            weeklyMeals: {
              ...plan.weeklyMeals,
              [selectedDay]: updatedMeals,
            },
            meals: selectedDay === todayKey ? updatedMeals : plan.meals,
          };
        } else {
          updatedPlan = {
            ...plan,
            meals: updatedMeals,
          };
        }

        onUpdatePlan(updatedPlan);
      }

      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      setTimeout(() => {
        setSubstituteMeal(null);
        setPantryInput('');
      }, 1800);
    } catch (err: any) {
      setReplaceError(err.message || 'Hubo un error al adaptar el plato.');
    } finally {
      setIsReplacing(false);
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

  // Extraer lista consolidada de compras
  const getConsolidatedGroceries = () => {
    const allMeals: MealItem[] = plan.weeklyMeals
      ? Object.values(plan.weeklyMeals).flat()
      : plan.meals;

    const proteins = new Set<string>();
    const produce = new Set<string>();
    const carbs = new Set<string>();
    const pantry = new Set<string>();

    allMeals.forEach((m) => {
      const desc = m.description.toLowerCase();
      if (desc.includes('huevo') || desc.includes('huevos')) proteins.add('Huevos frescos');
      if (desc.includes('pollo') || desc.includes('pechuga')) proteins.add('Pechuga de pollo');
      if (desc.includes('atún') || desc.includes('atun')) proteins.add('Atún enlatado al natural');
      if (desc.includes('pescado')) proteins.add('Pescado blanco (merluza o tilapia)');
      if (desc.includes('lenteja') || desc.includes('lentejas')) proteins.add('Lentejas secas');
      if (desc.includes('yogurt')) proteins.add('Yogurt griego natural sin azúcar');
      if (desc.includes('queso')) proteins.add('Queso bajo en sal / fresco');
      if (desc.includes('carne') || desc.includes('ternera')) proteins.add('Carne magra de res');

      if (desc.includes('espinaca')) produce.add('Espinacas frescas');
      if (desc.includes('tomate')) produce.add('Tomates');
      if (desc.includes('pepino')) produce.add('Pepinos');
      if (desc.includes('manzana')) produce.add('Manzanas verdes');
      if (desc.includes('plátano') || desc.includes('banana')) produce.add('Plátanos / Bananos');
      if (desc.includes('lechuga') || desc.includes('rúcula')) produce.add('Lechuga o Rúcula');
      if (desc.includes('calabacín') || desc.includes('calabaza')) produce.add('Calabacín o Calabaza');
      if (desc.includes('limón') || desc.includes('limon')) produce.add('Limones');
      if (desc.includes('champiñón') || desc.includes('champiñones')) produce.add('Champiñones');
      if (desc.includes('zanahoria')) produce.add('Zanahorias');
      if (desc.includes('brócoli') || desc.includes('brocoli')) produce.add('Brócoli fresco');

      if (desc.includes('avena')) carbs.add('Avena en hojuelas');
      if (desc.includes('pan integral')) carbs.add('Pan 100% integral');
      if (desc.includes('arroz')) carbs.add('Arroz integral');
      if (desc.includes('quinoa')) carbs.add('Quinoa');
      if (desc.includes('papa') || desc.includes('papas')) carbs.add('Papas');
      if (desc.includes('batata') || desc.includes('camote')) carbs.add('Batatas o Camotes');

      if (desc.includes('aceite de oliva')) pantry.add('Aceite de oliva virgen extra');
      if (desc.includes('almendra') || desc.includes('nuez') || desc.includes('frutos secos')) pantry.add('Frutos secos (almendras/nueces)');
      if (desc.includes('chía') || desc.includes('chia')) pantry.add('Semillas de chía');
      if (desc.includes('aguacate')) pantry.add('Aguacates maduros');
      if (desc.includes('canela')) pantry.add('Canela en polvo');
    });

    return [
      { category: '🥩 Proteínas & Lácteos', items: Array.from(proteins) },
      { category: '🥬 Frutas & Verduras', items: Array.from(produce) },
      { category: '🌾 Carbohidratos & Granos', items: Array.from(carbs) },
      { category: '🥑 Grasas & Despensa Básica', items: Array.from(pantry) },
    ];
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Cabecera del Cronograma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Utensils className="w-6 h-6" />
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Menú Semanal</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">{plan.title}</p>
        </div>

        {/* Acciones Rápidas (Lista de Mercado & Asistente IA) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGroceryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <ShoppingCart className="w-4 h-4 text-cyan-400" />
            <span>Lista del Mercado</span>
          </button>

          <button
            onClick={onOpenDietModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Consultar Nutricionista IA</span>
          </button>
        </div>
      </div>

      {/* SELECTOR INTERACTIVO DE DÍAS DE LA SEMANA */}
      <div className="mb-5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Planifica tu semana
        </label>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDay === d.key;
            const isToday = todayKey === d.key;

            return (
              <button
                key={d.key}
                onClick={() => setSelectedDay(d.key)}
                className={`py-2 px-1 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-emerald-500 to-teal-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20 scale-105 z-10'
                    : isToday
                    ? 'bg-slate-800/90 text-white font-bold border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-xs uppercase">{d.label}</span>
                {isToday && (
                  <span
                    className={`text-[9px] px-1 rounded-full font-bold mt-0.5 ${
                      isSelected ? 'bg-slate-950 text-white' : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    Hoy
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de progreso del día */}
      <div className="mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
          <span>
            Comidas de {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.full}
          </span>
          <span className="text-emerald-400 font-bold">
            {completedCount} de {totalMeals} comidas ({progressPct}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Lista de Comidas del Día Seleccionado */}
      <div className="space-y-4">
        {currentMeals.map((meal) => {
          const isDone = completedMealIds.includes(meal.id);
          const badge = getMealBadge(meal.type);

          const [mealHours, mealMins] = meal.time.split(':').map(Number);
          const mealTotalMins = (mealHours || 0) * 60 + (mealMins || 0);
          const isUpcomingOrCurrent =
            selectedDay === todayKey &&
            currentTotalMinutes !== null &&
            Math.abs(currentTotalMinutes - mealTotalMins) <= 60;

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

                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      {meal.time} hrs
                    </span>

                    {isUpcomingOrCurrent && !isDone && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500 text-slate-950 animate-bounce">
                        ¡Hora de comer!
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                    {meal.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                    {meal.description}
                  </p>

                  {meal.tips && (
                    <p className="mt-2 text-xs text-amber-300/90 flex items-center gap-1.5 italic">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                      <span>Consejo: {meal.tips}</span>
                    </p>
                  )}

                  {/* Botones de acción de la comida */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setSubstituteMeal(meal);
                        setPantryInput('');
                        setReplaceError(null);
                        setAiExplanation(null);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-semibold active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>¿No tienes este alimento? Sustituir</span>
                    </button>

                    <button
                      onClick={() => handleSpeakMeal(meal)}
                      className={`text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-semibold active:scale-95 border ${
                        speakingMealId === meal.id
                          ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold animate-pulse shadow-md shadow-teal-500/30'
                          : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                      }`}
                      title="Escuchar preparación y consejo en voz alta"
                    >
                      {speakingMealId === meal.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Pausar voz</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                          <span>Escuchar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Botón Gigante de Marcado Rápido */}
                <div className="sm:self-center">
                  <button
                    onClick={() => handleToggle(meal.id)}
                    className={`w-full sm:w-auto px-5 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 shadow-lg ${
                      isDone
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 shadow-emerald-950/30'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 stroke-[2.5] ${
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

      {/* MODAL DE SUSTITUCIÓN DE ALIMENTO */}
      {substituteMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSubstituteMeal(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Sustituir Alimento</h3>
                <p className="text-xs text-slate-400">
                  {substituteMeal.name} ({substituteMeal.time} hrs)
                </p>
              </div>
            </div>

            {/* SECCIÓN 1: ADAPTAR CON IA (LO QUE TIENES EN CASA) */}
            <div className="p-4 bg-slate-950/70 border border-cyan-800/40 rounded-2xl mb-5">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-1.5">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>¿Qué tienes en tu nevera o cocina hoy?</span>
              </label>
              <p className="text-[11px] text-slate-400 mb-3">
                Dile a la Dra. Lucía qué ingredientes tienes a mano y adaptará este plato en 2 segundos.
              </p>

              <textarea
                rows={2}
                placeholder="Ej: Solo tengo 2 huevos, atún en lata, tomate y una rebanada de pan..."
                value={pantryInput}
                onChange={(e) => setPantryInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none mb-3"
              />

              {replaceError && (
                <div className="p-3 mb-3 bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{replaceError}</span>
                </div>
              )}

              {aiExplanation && (
                <div className="p-3 mb-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{aiExplanation}</span>
                </div>
              )}

              <button
                onClick={handleAiReplace}
                disabled={isReplacing || !pantryInput.trim()}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 active:scale-95"
              >
                {isReplacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dra. Lucía está adaptando tu comida...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Adaptar esta comida con lo que tengo</span>
                  </>
                )}
              </button>
            </div>

            {/* SECCIÓN 2: EQUIVALENCIAS CLÍNICAS RÁPIDAS */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Equivalencias Médicas Rápidas</span>
              </h4>

              <div className="space-y-3">
                {STANDARD_EQUIVALENCES.map((eq, i) => (
                  <div key={i} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      {eq.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {eq.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-lg border border-slate-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LISTA DE COMPRAS DEL MERCADO */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowGroceryModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Lista de Mercado Semanal</h3>
                <p className="text-xs text-slate-400">
                  Ingredientes necesarios para cumplir tu plan sin desperdiciar nada.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              {getConsolidatedGroceries().map((cat, idx) => (
                <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2.5">
                    {cat.category}
                  </h4>
                  <div className="space-y-2">
                    {cat.items.map((item, i) => {
                      const isChecked = !!checkedGroceries[item];
                      return (
                        <label
                          key={i}
                          className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setCheckedGroceries((prev) => ({
                                ...prev,
                                [item]: !prev[item],
                              }))
                            }
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={isChecked ? 'line-through text-slate-500' : ''}>
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGroceryModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              Cerrar Lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
