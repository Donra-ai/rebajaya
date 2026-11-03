'use client';

import React, { useState } from 'react';
import { UserProfile, FamilyReaction } from '@/types';
import confetti from 'canvas-confetti';
import { Users, Heart, ThumbsUp, Flame, Trophy, Plus, Check, Lock, Sparkles } from 'lucide-react';

interface FamilyHubProps {
  currentProfile: UserProfile;
  profiles: UserProfile[];
  reactions: FamilyReaction[];
  onSelectProfile: (profileId: string) => void;
  onCreateProfile: (newProfile: UserProfile) => void;
  onSendReaction: (type: 'aplauso' | 'corazon' | 'fuerza' | 'felicitacion', message: string) => void;
}

const AVATAR_OPTIONS = ['👨‍🦳', '👩‍🦳', '🧔', '👩', '👦', '👧', '👴', '👵', '💪', '🥗'];

export default function FamilyHub({
  currentProfile,
  profiles,
  reactions,
  onSelectProfile,
  onCreateProfile,
  onSendReaction,
}: FamilyHubProps) {
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👨‍🦳');
  const [pin, setPin] = useState('1234');
  const [initialWeight, setInitialWeight] = useState(80);
  const [targetWeight, setTargetWeight] = useState(72);
  const [customMsg, setCustomMsg] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      name: name.trim(),
      avatar,
      pin: pin.trim() || '1234',
      initialWeightKg: Number(initialWeight),
      currentWeightKg: Number(initialWeight),
      targetWeightKg: Number(targetWeight),
      dailyWaterTargetMl: 2000,
      createdAt: new Date().toISOString(),
    };

    onCreateProfile(newProfile);
    setShowNewUserModal(false);
    setName('');
  };

  const handleQuickReaction = (type: 'aplauso' | 'corazon' | 'fuerza' | 'felicitacion', defaultText: string) => {
    onSendReaction(type, customMsg.trim() || defaultText);
    setCustomMsg('');

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Comunidad Familiar</h2>
            <p className="text-sm text-slate-400">Apoyo y motivación mutua</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewUserModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Agregar Familiar</span>
        </button>
      </div>

      {/* Lista de Miembros Familiares */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Perfiles de la Familia
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const isSelected = p.id === currentProfile.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950/40 to-slate-800 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-3xl p-1 bg-slate-800/80 rounded-xl">{p.avatar}</span>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm text-white truncate">{p.name}</span>
                    {p.isMainUser && <span className="text-xs text-amber-400" title="Papá">⭐</span>}
                  </div>
                  <span className="text-xs text-slate-400 block truncate">
                    {p.currentWeightKg} kg ➔ {p.targetWeightKg} kg
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reacciones Rápidas de Ánimo para Papá */}
      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 mb-6">
        <span className="text-xs font-bold text-slate-300 block mb-2">
          Enviar Ánimo a {currentProfile.name}
        </span>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <button
            onClick={() => handleQuickReaction('aplauso', '¡Bravo! Excelente disciplina hoy 👏')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span className="text-2xl mb-1">👏</span>
            <span className="text-[10px] font-bold text-slate-300">¡Bravo!</span>
          </button>

          <button
            onClick={() => handleQuickReaction('corazon', '¡Te queremos mucho y estamos orgullosos! ❤️')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span className="text-2xl mb-1">❤️</span>
            <span className="text-[10px] font-bold text-slate-300">Cariño</span>
          </button>

          <button
            onClick={() => handleQuickReaction('fuerza', '¡Con toda la fuerza, si se puede! 💪')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span className="text-2xl mb-1">💪</span>
            <span className="text-[10px] font-bold text-slate-300">Fuerza</span>
          </button>

          <button
            onClick={() => handleQuickReaction('felicitacion', '¡Gran avance en tus metas! 🏆')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span className="text-2xl mb-1">🏆</span>
            <span className="text-[10px] font-bold text-slate-300">Campeón</span>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje de apoyo..."
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
          <button
            onClick={() => handleQuickReaction('corazon', customMsg || '¡Te queremos!')}
            disabled={!customMsg.trim()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Muro de Reacciones */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Mensajes y Reacciones Recientes
        </span>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {reactions.slice(0, 10).map((r) => (
            <div
              key={r.id}
              className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-start gap-3 text-xs"
            >
              <span className="text-xl">{r.senderAvatar}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{r.senderName}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-300 mt-0.5">{r.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Agregar Familiar (Sin necesidad de correo) */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">Nuevo Familiar</h3>
            <p className="text-xs text-slate-400 mb-5">
              Sin registros molestos ni correos requeridos.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre o Apodo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mamá, Hermano Carlos, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Selecciona Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setAvatar(av)}
                      className={`text-2xl p-2 rounded-xl border ${
                        avatar === av
                          ? 'bg-emerald-500/20 border-emerald-500 scale-110'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Peso Actual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={initialWeight}
                    onChange={(e) => setInitialWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Meta Deseada (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">PIN de Seguridad (4 dígitos)</label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 text-sm"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="py-3 px-4 rounded-xl font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 text-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Crear Perfil</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
