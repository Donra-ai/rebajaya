'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, MealPlan, MealItem } from '@/types';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  X,
  Clock,
  Droplets,
  Sparkles,
  Volume2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NotificationManagerProps {
  profile: UserProfile | null;
  plan: MealPlan | null;
  completedMealIds: string[];
  waterAmount: number;
  onToggleMeal: (mealId: string) => void;
  onAddWater: (amount: number) => void;
}

interface ActiveToast {
  id: string;
  type: 'meal' | 'water';
  title: string;
  message: string;
  mealId?: string;
  waterAmountToAdd?: number;
  timeStr: string;
}

// Reproducir sonido suave y agradable con Web Audio API (sin depender de archivos mp3 externos)
function playGentleChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Campana melódica dual: D5 (587 Hz) a A5 (880 Hz)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.18);

    osc2.frequency.setValueAtTime(880.0, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.45);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.25);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.85);
  } catch (err) {
    // Si el navegador bloquea audio antes de interacción
  }
}

export default function NotificationManager({
  profile,
  plan,
  completedMealIds,
  waterAmount,
  onToggleMeal,
  onAddWater,
}: NotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  // Inicializar estado de soporte de notificaciones
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
      }
      const savedSetting = localStorage.getItem('rebajaya_notifications_enabled');
      if (savedSetting !== null) {
        setNotificationsEnabled(savedSetting === 'true');
      }
    }
  }, []);

  // Solicitar permiso al usuario
  const requestPermission = async () => {
    if (!isSupported) {
      alert('Tu navegador no cuenta con soporte nativo de notificaciones web.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setNotificationsEnabled(true);
        localStorage.setItem('rebajaya_notifications_enabled', 'true');
        playGentleChime();
        try {
          new Notification('🔔 ¡Recordatorios Activados!', {
            body: 'Te avisaremos si pasan 5 minutos de una comida o si olvidas hidratarte.',
            icon: '/favicon.ico',
          });
        } catch (e) {
          console.warn('Notification test error', e);
        }
      }
    } catch (err) {
      console.warn('Error al pedir permiso de notificaciones', err);
    }
  };

  const toggleNotificationsEnabled = () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    localStorage.setItem('rebajaya_notifications_enabled', nextVal ? 'true' : 'false');
  };

  // Función para disparar tanto la notificación nativa como el Toast visual
  const triggerReminder = useCallback(
    (toast: ActiveToast) => {
      // 1. Mostrar Toast en pantalla
      setActiveToast(toast);

      // 2. Tocar sonido
      playGentleChime();

      // 3. Notificación nativa del sistema operativo / navegador
      if (isSupported && permission === 'granted' && notificationsEnabled) {
        try {
          new Notification(toast.title, {
            body: toast.message,
            icon: '/favicon.ico',
            tag: toast.id,
          });
        } catch (e) {
          console.warn('Error disparando notificación nativa', e);
        }
      }
    },
    [isSupported, permission, notificationsEnabled]
  );

  // Intervalo de verificación cada 30 segundos
  useEffect(() => {
    if (!profile || !notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMins = currentHours * 60 + currentMinutes;
      const todayStr = now.toISOString().split('T')[0];

      const dayKeys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const todayKey = dayKeys[now.getDay()];

      // 1. VERIFICAR COMIDAS (Si han pasado 5 minutos y no se ha marcado)
      if (plan) {
        const todayMeals: MealItem[] =
          plan.weeklyMeals && plan.weeklyMeals[todayKey]
            ? plan.weeklyMeals[todayKey]
            : plan.meals || [];

        for (const meal of todayMeals) {
          // Si ya está completada, ignorar
          if (completedMealIds.includes(meal.id)) continue;

          const [h, m] = (meal.time || '08:00').split(':').map(Number);
          const mealTotalMins = (h || 0) * 60 + (m || 0);

          // Diferencia en minutos
          const diffMins = currentTotalMins - mealTotalMins;

          // Si han pasado 5 minutos y hasta 90 minutos de retraso
          if (diffMins >= 5 && diffMins <= 90) {
            const reminderKey = `rebajaya_reminder_meal_${profile.id}_${meal.id}_${todayStr}`;
            const alreadyReminded = localStorage.getItem(reminderKey);

            if (!alreadyReminded) {
              localStorage.setItem(reminderKey, Date.now().toString());

              const mealTypeName: Record<string, string> = {
                desayuno: 'Desayuno',
                media_manana: 'Media Mañana',
                almuerzo: 'Almuerzo Principal',
                merienda: 'Merienda',
                cena: 'Cena',
              };

              const typeTitle = mealTypeName[meal.type] || 'Comida';
              const bariatricNote = profile.hasBariatricSurgery
                ? ' Recuerda no tomar líquidos con los alimentos.'
                : '';

              triggerReminder({
                id: `meal-${meal.id}`,
                type: 'meal',
                title: `⏰ ¡Hora de tu ${typeTitle}! (${meal.time} hrs)`,
                message: `Han pasado ${diffMins} min de tu hora programada. Recuerda comer: "${meal.name}" para cuidar tu energía y metabolismo.${bariatricNote}`,
                mealId: meal.id,
                timeStr: meal.time,
              });

              // Disparar solo un recordatorio por ciclo
              return;
            }
          }
        }
      }

      // 2. VERIFICAR HIDRATACIÓN (Mañana, Tarde y Noche)
      const targetWater = profile.dailyWaterTargetMl || 2000;

      // MAÑANA (Entre 10:30 y 12:30 si no ha tomado agua o menos de 250ml)
      if (currentTotalMins >= 10 * 60 + 30 && currentTotalMins <= 12 * 60 + 30) {
        const morningKey = `rebajaya_reminder_water_morning_${profile.id}_${todayStr}`;
        if (!localStorage.getItem(morningKey) && waterAmount < 250) {
          localStorage.setItem(morningKey, Date.now().toString());
          triggerReminder({
            id: `water-morning-${todayStr}`,
            type: 'water',
            title: '💧 Recordatorio de Hidratación (Mañana)',
            message:
              'Aún no has registrado agua esta mañana. Recuerda beber 1 vaso de agua a sorbos lentos para activar tu digestión.',
            waterAmountToAdd: 250,
            timeStr: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          });
          return;
        }
      }

      // TARDE (Entre 15:00 y 17:30 si lleva menos del 45% de la meta)
      if (currentTotalMins >= 15 * 60 && currentTotalMins <= 17 * 60 + 30) {
        const afternoonKey = `rebajaya_reminder_water_afternoon_${profile.id}_${todayStr}`;
        const minAfternoon = Math.round(targetWater * 0.45);
        if (!localStorage.getItem(afternoonKey) && waterAmount < minAfternoon) {
          localStorage.setItem(afternoonKey, Date.now().toString());
          triggerReminder({
            id: `water-afternoon-${todayStr}`,
            type: 'water',
            title: '💧 Pausa de Hidratación (Tarde)',
            message: `Llevas ${waterAmount} ml de tu meta de ${targetWater} ml. Es un excelente momento para hidratarte antes de tu siguiente comida.`,
            waterAmountToAdd: 250,
            timeStr: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          });
          return;
        }
      }

      // NOCHE (Entre 19:30 y 21:30 si lleva menos del 75% de la meta)
      if (currentTotalMins >= 19 * 60 + 30 && currentTotalMins <= 21 * 60 + 30) {
        const nightKey = `rebajaya_reminder_water_night_${profile.id}_${todayStr}`;
        const minNight = Math.round(targetWater * 0.75);
        if (!localStorage.getItem(nightKey) && waterAmount < minNight) {
          localStorage.setItem(nightKey, Date.now().toString());
          triggerReminder({
            id: `water-night-${todayStr}`,
            type: 'water',
            title: '💧 Meta de Hidratación del Día (Noche)',
            message: `¡Casi termina el día! Llevas ${waterAmount} ml de ${targetWater} ml. Toma unos sorbos con calma para cumplir tu meta diaria.`,
            waterAmountToAdd: 250,
            timeStr: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          });
          return;
        }
      }
    };

    // Ejecutar chequeo al montar y cada 30 segundos
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [profile, plan, completedMealIds, waterAmount, notificationsEnabled, triggerReminder]);

  // Manejar acción rápida desde el Toast
  const handleToastAction = () => {
    if (!activeToast) return;

    if (activeToast.type === 'meal' && activeToast.mealId) {
      onToggleMeal(activeToast.mealId);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } else if (activeToast.type === 'water' && activeToast.waterAmountToAdd) {
      onAddWater(activeToast.waterAmountToAdd);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    }

    setActiveToast(null);
  };

  return (
    <>
      {/* BOTÓN EN CABECERA (CAMPANA DE RECORDATORIOS) */}
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`relative p-2 rounded-2xl border transition-all active:scale-95 flex items-center justify-center ${
            permission === 'granted' && notificationsEnabled
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Configurar recordatorios de comidas y agua"
        >
          {notificationsEnabled && permission === 'granted' ? (
            <BellRing className="w-4 h-4 text-amber-400" />
          ) : (
            <Bell className="w-4 h-4" />
          )}

          {/* Indicador de estado */}
          {notificationsEnabled && permission === 'granted' && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
          )}
        </button>

        {/* POPOVER DE CONFIGURACIÓN DE NOTIFICACIONES */}
        {showSettings && (
          <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Bell className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">Recordatorios Médicos</h4>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              {/* Notificaciones del navegador */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                <span className="font-bold text-slate-200 block mb-1">
                  Permiso en tu Navegador / Móvil
                </span>
                <p className="text-[11px] text-slate-400 mb-2">
                  {permission === 'granted'
                    ? '✅ Notificaciones nativas activadas'
                    : permission === 'denied'
                    ? '⚠️ Permiso bloqueado en el navegador'
                    : 'Aún no has concedido permisos para avisos en pantalla'}
                </p>

                {permission !== 'granted' && (
                  <button
                    onClick={requestPermission}
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Conceder Permiso al Navegador</span>
                  </button>
                )}
              </div>

              {/* Interruptor general */}
              <label className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-2xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-200 block">Avisos automáticos</span>
                  <span className="text-[10px] text-slate-400">
                    Avisar a los 5 min de una comida y en horarios de agua
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={toggleNotificationsEnabled}
                  className="w-4 h-4 text-amber-500 bg-slate-900 border-slate-700 rounded focus:ring-amber-500 cursor-pointer"
                />
              </label>

              {/* Botón de probar sonido */}
              <button
                type="button"
                onClick={playGentleChime}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Probar Sonido de Campana</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center italic">
              Diseñado para que nunca te saltes un plato ni te falte hidratación.
            </p>
          </div>
        )}
      </div>

      {/* TOAST FLOTANTE VISUAL (APARECE CUANDO HAY UN RECORDATORIO ACTIVO) */}
      {activeToast && (
        <div className="fixed top-16 sm:top-20 right-4 left-4 sm:left-auto sm:w-[420px] z-50 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`border rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative ${
              activeToast.type === 'meal'
                ? 'bg-slate-900/95 border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-900/95 border-cyan-500/50 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
            }`}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setActiveToast(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div
                className={`p-2.5 rounded-2xl flex-shrink-0 ${
                  activeToast.type === 'meal'
                    ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/30 animate-bounce'
                    : 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/30 animate-pulse'
                }`}
              >
                {activeToast.type === 'meal' ? (
                  <Clock className="w-6 h-6 stroke-[2.5]" />
                ) : (
                  <Droplets className="w-6 h-6 stroke-[2.5]" />
                )}
              </div>

              <div className="pr-6">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                    activeToast.type === 'meal'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {activeToast.type === 'meal' ? 'Comida Pendiente' : 'Hidratación Vital'}
                </span>
                <h4 className="text-base font-bold text-white leading-snug">
                  {activeToast.title}
                </h4>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800 mb-4">
              {activeToast.message}
            </p>

            {/* Acciones Rápidas */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToastAction}
                className={`flex-1 py-3 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 text-slate-950 ${
                  activeToast.type === 'meal'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-cyan-500/20'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {activeToast.type === 'meal' ? '¡Listo, ya comí!' : 'Tomar +250 ml de Agua'}
                </span>
              </button>

              <button
                onClick={() => setActiveToast(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Posponer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
