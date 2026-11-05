'use client';

import React, { useState } from 'react';
import { UserProfile, HealthBadge, WeightLog } from '@/types';
import confetti from 'canvas-confetti';
import {
  Flame,
  Award,
  CheckCircle2,
  Droplets,
  Utensils,
  Share2,
  Sparkles,
  X,
  Trophy,
  Lock,
} from 'lucide-react';

interface HabitStreakCardProps {
  profile: UserProfile;
  waterToday: number;
  waterTarget: number;
  completedMealsCount: number;
  totalMealsCount: number;
  weightHistory: WeightLog[];
  badges: HealthBadge[];
  streakDays: number;
}

export default function HabitStreakCard({
  profile,
  waterToday,
  waterTarget,
  completedMealsCount,
  totalMealsCount,
  weightHistory,
  badges,
  streakDays,
}: HabitStreakCardProps) {
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<HealthBadge | null>(null);

  const waterPct = waterTarget > 0 ? Math.min(100, Math.round((waterToday / waterTarget) * 100)) : 0;
  const isWaterDone = waterPct >= 100;

  const mealsPct =
    totalMealsCount > 0 ? Math.min(100, Math.round((completedMealsCount / totalMealsCount) * 100)) : 0;
  const isMealsDone = totalMealsCount > 0 && completedMealsCount >= totalMealsCount;

  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;
  const totalLostKg = Math.max(0, profile.initialWeightKg - profile.currentWeightKg);

  // Compartir en WhatsApp
  const handleShareWhatsApp = () => {
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    const message = `🌟 *¡Mis Logros de Salud de Hoy en RebajaYA!* 🌟
👤 *${profile.name}*
🔥 *Racha:* ${streakDays > 0 ? `${streakDays} días consecutivos` : '¡Día 1 de constancia!'}
💧 *Agua:* ${waterToday} ml / ${waterTarget} ml (${waterPct}%)
🥗 *Comidas:* ${completedMealsCount} de ${totalMealsCount} comidas del plan cumplidas
⚖️ *Peso actual:* ${profile.currentWeightKg} kg ${totalLostKg > 0 ? `(-${totalLostKg.toFixed(1)} kg logrados 🎉)` : ''}
🏅 *Medallas ganadas:* ${unlockedBadgesCount} de ${badges.length}

¡Avanzando hacia una vida más saludable y con energía, sin pasar hambre! 💪✨
https://rebajaya.vercel.app`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* LADO IZQUIERDO: Racha + Mensaje motivador */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-200 stroke-[2] animate-pulse" />
              </div>
              {streakDays > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow">
                  {streakDays}d
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {streakDays > 1
                    ? `¡${streakDays} Días de Racha Activa!`
                    : streakDays === 1
                    ? '¡Racha Iniciada Hoy!'
                    : 'Comienza tu Racha Hoy'}
                </h3>
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded-full border border-amber-500/30">
                  Constancia
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isWaterDone && isMealsDone
                  ? '🌟 ¡Día perfecto! Has completado tus hábitos clínicos de hoy.'
                  : 'Registra tu agua y comidas para seguir sumando días saludables.'}
              </p>
            </div>
          </div>

          {/* CENTRO: Indicadores Rápidos de Hoy */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Hábito Agua */}
            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                isWaterDone
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Agua</span>
                </span>
                {isWaterDone && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <div className="text-sm font-black text-white">
                {waterToday} <span className="text-[10px] text-slate-400 font-normal">/ {waterTarget} ml</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
            </div>

            {/* Hábito Comidas */}
            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                isMealsDone
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                <span className="flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Comidas</span>
                </span>
                {isMealsDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <div className="text-sm font-black text-white">
                {completedMealsCount}{' '}
                <span className="text-[10px] text-slate-400 font-normal">/ {totalMealsCount} comidas</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${mealsPct}%` }}
                />
              </div>
            </div>

            {/* Medallas Ganadas */}
            <button
              onClick={() => setShowBadgesModal(true)}
              className="col-span-2 sm:col-span-1 p-2.5 bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition-all group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-1">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Logros</span>
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-white">Ver ➔</span>
              </div>
              <div className="text-sm font-black text-white">
                {unlockedBadgesCount}{' '}
                <span className="text-[10px] text-slate-400 font-normal">/ {badges.length} medallas</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px]">
                {badges.slice(0, 4).map((b) => (
                  <span
                    key={b.id}
                    className={`transition-opacity ${b.isUnlocked ? 'opacity-100' : 'opacity-25 grayscale'}`}
                  >
                    {b.icon}
                  </span>
                ))}
              </div>
            </button>
          </div>

          {/* LADO DERECHO: Botón WhatsApp */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleShareWhatsApp}
              className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              title="Compartir tus logros de hoy por WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE MEDALLAS Y LOGROS */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBadgesModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
              <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-2xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Medallas de Constancia</h3>
                <p className="text-xs text-slate-400">
                  {unlockedBadgesCount} de {badges.length} desbloqueadas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {badges.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBadge(b)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    b.isUnlocked
                      ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{b.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-white block">{b.title}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          b.isUnlocked ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {b.isUnlocked ? '✅ Desbloqueada' : '🔒 Por desbloquear'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBadgesModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
