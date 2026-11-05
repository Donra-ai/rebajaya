'use client';

import React, { useEffect, useState } from 'react';
import { UserProfile, MealPlan, WeightLog, FamilyReaction } from '@/types';
import {
  getProfiles,
  getActiveProfileId,
  setActiveProfileId,
  saveProfile,
  getMealPlan,
  saveMealPlan,
  getCompletedMealsToday,
  toggleMealCompleted,
  getWaterToday,
  addWater,
  resetWaterToday,
  getWeightHistory,
  addWeight,
  getReactions,
  addReaction,
} from '@/lib/storage';
import WaterTracker3D from '@/components/WaterTracker3D';
import MealSchedule from '@/components/MealSchedule';
import WeightProgress from '@/components/WeightProgress';
import FamilyHub from '@/components/FamilyHub';
import AiDietGenerator from '@/components/AiDietGenerator';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import AuthScreen from '@/components/AuthScreen';
import { Sparkles, Calendar, Lock, ChevronDown, CheckCircle, LogOut } from 'lucide-react';

export default function HomePage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [completedMealIds, setCompletedMealIds] = useState<string[]>([]);
  const [waterAmount, setWaterAmount] = useState<number>(0);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [reactions, setReactions] = useState<FamilyReaction[]>([]);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hoy' | 'comunidad' | 'peso'>('hoy');
  const [todayStr, setTodayStr] = useState<string>('');
  const [dateFormatted, setDateFormatted] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carga inicial de datos
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    setTodayStr(today);

    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(now);
    setDateFormatted(formatted);

    async function loadData() {
      setIsLoading(true);
      const allProfiles = await getProfiles();
      setProfiles(allProfiles);

      const activeId = getActiveProfileId();
      const current = activeId ? allProfiles.find((p) => p.id === activeId) || null : null;

      if (current) {
        setActiveProfile(current);
        const plan = await getMealPlan(current.id);
        setMealPlan(plan);

        const doneMeals = getCompletedMealsToday(current.id, today);
        setCompletedMealIds(doneMeals);

        const water = getWaterToday(current.id, today);
        setWaterAmount(water);

        const history = await getWeightHistory(current.id);
        setWeightHistory(history);
      } else {
        setActiveProfile(null);
      }

      setReactions(getReactions());
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Iniciar sesión con un perfil (tras verificar PIN en AuthScreen)
  const handleLoginProfile = async (target: UserProfile) => {
    setActiveProfileId(target.id);
    setActiveProfile(target);

    const plan = await getMealPlan(target.id);
    setMealPlan(plan);

    const doneMeals = getCompletedMealsToday(target.id, todayStr);
    setCompletedMealIds(doneMeals);

    const water = getWaterToday(target.id, todayStr);
    setWaterAmount(water);

    const history = await getWeightHistory(target.id);
    setWeightHistory(history);
  };

  // Cerrar sesión o cambiar de perfil
  const handleLogout = () => {
    setActiveProfileId(null);
    setActiveProfile(null);
    setMealPlan(null);
  };

  // Cambiar de perfil desde la vista de comunidad
  const handleSelectProfile = async (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (!target) return;
    handleLoginProfile(target);
  };

  // Crear nuevo perfil
  const handleCreateProfile = async (newProfile: UserProfile) => {
    await saveProfile(newProfile);
    const updated = await getProfiles();
    setProfiles(updated);
    await handleLoginProfile(newProfile);
  };

  // Marcar/Desmarcar comida
  const handleToggleMeal = async (mealId: string) => {
    if (!activeProfile) return;
    await toggleMealCompleted(activeProfile.id, mealId, todayStr);
    const updated = getCompletedMealsToday(activeProfile.id, todayStr);
    setCompletedMealIds(updated);
  };

  // Añadir agua
  const handleAddWater = async (amount: number) => {
    if (!activeProfile) return;
    const newTotal = await addWater(activeProfile.id, amount, todayStr);
    setWaterAmount(newTotal);
  };

  const handleResetWater = () => {
    if (!activeProfile) return;
    resetWaterToday(activeProfile.id, todayStr);
    setWaterAmount(0);
  };

  // Añadir peso
  const handleAddWeight = async (weight: number, notes?: string, photoUrl?: string) => {
    if (!activeProfile) return;
    await addWeight(activeProfile.id, weight, notes, photoUrl);
    const history = await getWeightHistory(activeProfile.id);
    setWeightHistory(history);

    // Actualizar perfil local
    setActiveProfile({
      ...activeProfile,
      currentWeightKg: weight,
    });
  };

  // Nuevo plan aplicado desde IA / PDF
  const handlePlanCreated = async (newPlan: MealPlan, updatedProfileData?: Partial<UserProfile>) => {
    await saveMealPlan(newPlan);
    setMealPlan(newPlan);

    if (updatedProfileData && activeProfile) {
      const merged: UserProfile = { ...activeProfile, ...updatedProfileData };
      await saveProfile(merged);
      setActiveProfile(merged);
    }
  };

  // Enviar apoyo / reacción
  const handleSendReaction = async (
    type: 'aplauso' | 'corazon' | 'fuerza' | 'felicitacion',
    message: string
  ) => {
    if (!activeProfile) return;
    await addReaction({
      senderName: activeProfile.name,
      senderAvatar: activeProfile.avatar,
      receiverId: activeProfile.id,
      type,
      message,
    });
    setReactions(getReactions());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cyan-300">Cargando RebajaYA...</h2>
        </div>
      </div>
    );
  }

  // Si no hay perfil activo, mostrar la pantalla de autenticación por PIN / Onboarding
  if (!activeProfile || !mealPlan) {
    return (
      <AuthScreen
        profiles={profiles}
        onSelectProfile={handleLoginProfile}
        onCreateProfile={handleCreateProfile}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
      {/* Barra Superior con Selector de Perfil */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
              R
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                Rebaja<span className="text-cyan-400">YA</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-semibold uppercase tracking-wider">
                Nutrición & Hábitos Diarios
              </span>
            </div>
          </div>

          {/* Perfil Activo y Botón de Bloqueo / Cambio de Usuario */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xl">{activeProfile.avatar}</span>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-white block truncate max-w-[120px]">
                  {activeProfile.name}
                </span>
                <span className="text-[10px] text-cyan-400 block -mt-0.5">
                  Meta: {activeProfile.targetWeightKg} kg
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all active:scale-95"
              title="Cambiar de usuario o bloquear sesión con PIN"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Cambiar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* Banner de Saludo y Fecha */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateFormatted}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ¡Hola, {activeProfile.name}! 👋
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Hoy es un día perfecto para cuidar tu salud y dar un paso más hacia tu meta de{' '}
              <span className="text-emerald-400 font-bold">{activeProfile.targetWeightKg} kg</span>.
            </p>
          </div>

          {/* Acceso directo para configurar dieta con IA / PDF */}
          <div className="sm:self-end">
            <button
              onClick={() => setIsDietModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Subir PDF o Consultar IA</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación Móvil */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 mb-6 sm:hidden">
          <button
            onClick={() => setActiveTab('hoy')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'hoy'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400'
            }`}
          >
            Mi Día
          </button>
          <button
            onClick={() => setActiveTab('peso')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'peso'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400'
            }`}
          >
            Peso
          </button>
          <button
            onClick={() => setActiveTab('comunidad')}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'comunidad'
                ? 'bg-pink-500 text-slate-950 shadow-md shadow-pink-500/20'
                : 'text-slate-400'
            }`}
          >
            Comunidad
          </button>
        </div>

        {/* Grid de Contenido en Escritorio / Vista seleccionada en Móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Columna Izquierda: Vaso 3D de Agua + Progreso de Peso */}
          <div
            className={`lg:col-span-5 space-y-6 ${
              activeTab === 'hoy' || activeTab === 'peso' ? 'block' : 'hidden sm:block'
            }`}
          >
            {/* Vaso 3D de Agua */}
            <div className={activeTab === 'peso' ? 'hidden sm:block' : 'block'}>
              <WaterTracker3D
                currentMl={waterAmount}
                targetMl={activeProfile.dailyWaterTargetMl}
                onAddWater={handleAddWater}
                onReset={handleResetWater}
              />
            </div>

            {/* Progreso de Peso */}
            <div className={activeTab === 'hoy' ? 'hidden sm:block' : 'block'}>
              <WeightProgress
                profile={activeProfile}
                weightHistory={weightHistory}
                onAddWeight={handleAddWeight}
              />
            </div>
          </div>

          {/* Columna Derecha: Cronograma de Dieta + Círculo de Apoyo */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              activeTab === 'hoy' || activeTab === 'comunidad' ? 'block' : 'hidden sm:block'
            }`}
          >
            {/* Cronograma de Comidas del Día */}
            <div className={activeTab === 'comunidad' ? 'hidden sm:block' : 'block'}>
              <MealSchedule
                plan={mealPlan}
                completedMealIds={completedMealIds}
                onToggleMeal={handleToggleMeal}
                onOpenDietModal={() => setIsDietModalOpen(true)}
                onUpdatePlan={handlePlanCreated}
                userProfile={activeProfile}
              />
            </div>

            {/* Círculo de Apoyo y Motivación Compartida */}
            <div className={activeTab === 'hoy' ? 'hidden sm:block' : 'block'}>
              <FamilyHub
                currentProfile={activeProfile}
                profiles={profiles}
                reactions={reactions}
                onSelectProfile={handleSelectProfile}
                onCreateProfile={handleCreateProfile}
                onSendReaction={handleSendReaction}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Asistente de Dieta (Gemini PDF / Nutricionista IA) */}
      <AiDietGenerator
        profile={activeProfile}
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        onPlanCreated={handlePlanCreated}
      />

      {/* Notificación de Instalación PWA */}
      <PwaInstallPrompt />
    </main>
  );
}
