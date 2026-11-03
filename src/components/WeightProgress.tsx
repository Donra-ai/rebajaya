'use client';

import React, { useState } from 'react';
import { UserProfile, WeightLog } from '@/types';
import confetti from 'canvas-confetti';
import { Scale, TrendingDown, Target, Plus, Minus, Check, Award, History } from 'lucide-react';

interface WeightProgressProps {
  profile: UserProfile;
  weightHistory: WeightLog[];
  onAddWeight: (weight: number, notes?: string) => void;
}

export default function WeightProgress({
  profile,
  weightHistory,
  onAddWeight,
}: WeightProgressProps) {
  const [inputWeight, setInputWeight] = useState<number>(profile.currentWeightKg || 80);
  const [showLogModal, setShowLogModal] = useState(false);
  const [note, setNote] = useState('');

  const initial = profile.initialWeightKg;
  const current = profile.currentWeightKg;
  const target = profile.targetWeightKg;

  const totalToLose = Math.max(0.1, initial - target);
  const lostSoFar = Math.max(0, initial - current);
  const remaining = Math.max(0, current - target);
  const progressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));

  const handleSaveWeight = () => {
    onAddWeight(inputWeight, note.trim() || undefined);
    setShowLogModal(false);
    setNote('');

    if (inputWeight < current) {
      // Celebración si bajó de peso
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Progreso de Peso</h2>
            <p className="text-sm text-slate-400">Objetivo saludable</p>
          </div>
        </div>

        <button
          onClick={() => {
            setInputWeight(profile.currentWeightKg);
            setShowLogModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm"
        >
          <Scale className="w-4 h-4" />
          <span>Anotar Peso</span>
        </button>
      </div>

      {/* 3 Tarjetas de Resumen (Inicial, Actual, Meta) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Peso Inicial</span>
          <span className="text-xl sm:text-2xl font-black text-slate-300">{initial}</span>
          <span className="text-xs text-slate-500 block">kg</span>
        </div>

        <div className="bg-gradient-to-b from-amber-500/10 to-orange-500/10 p-3.5 rounded-2xl border border-amber-500/30 text-center relative overflow-hidden">
          <div className="absolute top-1 right-2 text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-amber-400 block mb-1">Peso Actual</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300">{current}</span>
          <span className="text-xs text-amber-400/80 block">kg</span>
        </div>

        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs font-semibold text-slate-400 block mb-1">Meta Deseada</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400">{target}</span>
          <span className="text-xs text-slate-500 block">kg</span>
        </div>
      </div>

      {/* Barra de progreso visual con porcentaje */}
      <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <TrendingDown className="w-4 h-4" />
            <span>Has bajado {lostSoFar.toFixed(1)} kg</span>
          </div>
          <div className="text-slate-400 text-xs font-medium">
            Faltan {remaining.toFixed(1)} kg para la meta
          </div>
        </div>

        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-right mt-1.5">
          <span className="text-xs font-bold text-amber-400">{progressPct}% completado hacia tu meta</span>
        </div>
      </div>

      {/* Mini historial de últimas anotaciones */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <History className="w-3.5 h-3.5" />
          <span>Últimos Registros</span>
        </div>

        <div className="space-y-2">
          {weightHistory
            .slice(-4)
            .reverse()
            .map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-sm"
              >
                <div>
                  <span className="font-semibold text-slate-200">{entry.date}</span>
                  {entry.notes && <p className="text-xs text-slate-400 mt-0.5">{entry.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-white">{entry.weightKg} kg</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal / Selector Gigante de Peso para Papá */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-2xl font-bold text-white text-center mb-1">Registrar Nuevo Peso</h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Usa los botones grandes para ajustar tus kilos de hoy
            </p>

            {/* Ajustador de Peso Gigante */}
            <div className="flex items-center justify-center gap-4 my-6">
              <button
                onClick={() => setInputWeight((prev) => Math.max(30, Number((prev - 0.2).toFixed(1))))}
                className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white flex items-center justify-center text-3xl font-black border border-slate-700 shadow-lg"
              >
                <Minus className="w-8 h-8" />
              </button>

              <div className="text-center min-w-[140px]">
                <div className="text-5xl font-black text-amber-300 tracking-tight">{inputWeight}</div>
                <span className="text-slate-400 font-semibold text-sm">Kilogramos</span>
              </div>

              <button
                onClick={() => setInputWeight((prev) => Number((prev + 0.2).toFixed(1)))}
                className="w-16 h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white flex items-center justify-center text-3xl font-black border border-slate-700 shadow-lg"
              >
                <Plus className="w-8 h-8" />
              </button>
            </div>

            {/* Ajustes rápidos +/- 1 kg */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                onClick={() => setInputWeight((prev) => Math.max(30, Number((prev - 1).toFixed(1))))}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
              >
                - 1.0 kg
              </button>
              <button
                onClick={() => setInputWeight((prev) => Number((prev + 1).toFixed(1)))}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
              >
                + 1.0 kg
              </button>
            </div>

            {/* Nota opcional */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Nota (ej: En ayunas, antes del desayuno)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Botones de Confirmación */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveWeight}
                className="py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Guardar Peso</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
