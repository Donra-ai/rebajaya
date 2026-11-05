'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { Lock, Plus, ArrowLeft, Delete, Sparkles, Check, AlertCircle, Droplets, Trash2 } from 'lucide-react';

interface AuthScreenProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onCreateProfile: (profile: UserProfile) => void;
  onResetAllData?: () => Promise<void>;
}

const AVATAR_OPTIONS = [
  '🏃', '🥑', '🥗', '💪', '🧘', '⚡',
  '🚴', '🍎', '👨‍🦳', '👩‍🦰', '🧔', '🎯'
];

export default function AuthScreen({
  profiles,
  onSelectProfile,
  onCreateProfile,
  onResetAllData,
}: AuthScreenProps) {
  // Estados de vista: 'list' (selección), 'pin' (ingresar pin), 'create' (nuevo usuario)
  const [view, setView] = useState<'list' | 'pin' | 'create'>(
    profiles.length === 0 ? 'create' : 'list'
  );
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [pinErrorMsg, setPinErrorMsg] = useState<string>('');

  // Formulario nuevo usuario
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🏃');
  const [newPin, setNewPin] = useState('');
  const [currentWeight, setCurrentWeight] = useState<number>(75);
  const [targetWeight, setTargetWeight] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [age, setAge] = useState<number>(30);
  const [hasBariatric, setHasBariatric] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  // Cálculo automático de agua basado en hidratación científica (~30 ml por kg de peso corporal)
  const calculatedWater = Math.max(
    1500,
    Math.round(((Number(currentWeight) || 75) * 30) / 250) * 250
  );

  // Si no hay perfiles, forzar vista de creación
  useEffect(() => {
    if (profiles.length === 0) {
      setView('create');
    }
  }, [profiles]);

  // Soporte para teclado físico al ingresar PIN
  useEffect(() => {
    if (view !== 'pin' || !selectedProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePressDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setView('list');
        setPinInput('');
        setPinError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedProfile, pinInput]);

  // Manejar dígito presionado
  const handlePressDigit = (digit: string) => {
    if (pinInput.length >= 4) return;
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(false);

    // Cuando completa 4 dígitos, validar inmediatamente
    if (nextPin.length === 4 && selectedProfile) {
      if (nextPin === selectedProfile.pin) {
        // PIN correcto
        onSelectProfile(selectedProfile);
      } else {
        // PIN incorrecto
        setPinError(true);
        setPinErrorMsg('PIN incorrecto. Intenta de nuevo.');
        setTimeout(() => {
          setPinInput('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClearPin = () => {
    setPinInput('');
    setPinError(false);
  };

  // Crear nuevo perfil
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Por favor escribe tu nombre');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setCreateError('El PIN debe ser de exactamente 4 dígitos numéricos');
      return;
    }

    const created: UserProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      avatar,
      pin: newPin,
      age: Number(age) || 30,
      heightCm: Number(heightCm) || 170,
      initialWeightKg: Number(currentWeight) || 75,
      currentWeightKg: Number(currentWeight) || 75,
      targetWeightKg: Number(targetWeight) || 70,
      dailyWaterTargetMl: calculatedWater,
      hasBariatricSurgery: hasBariatric,
      isMainUser: profiles.length === 0,
      createdAt: new Date().toISOString(),
    };

    onCreateProfile(created);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Luces y brillo de fondo decorativo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera / Marca */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 shadow-xl shadow-cyan-500/20 text-slate-950 font-black text-2xl mb-3">
          R
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1">
          Rebaja<span className="text-cyan-400">YA</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">
          Nutrición, Hábitos & Metas Personales
        </p>
      </div>

      {/* Contenedor Principal */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* VISTA 1: LISTADO DE PERFILES */}
        {view === 'list' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-center text-white mb-2">
              ¿Quién eres?
            </h2>
            <p className="text-xs text-center text-slate-400 mb-6">
              Selecciona tu perfil e ingresa con tu PIN de 4 dígitos.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProfile(p);
                    setPinInput('');
                    setPinError(false);
                    setView('pin');
                  }}
                  className="flex flex-col items-center p-4 bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 rounded-2xl transition-all duration-200 active:scale-95 group text-center"
                >
                  <span className="text-4xl p-2 bg-slate-800/80 group-hover:scale-110 rounded-2xl mb-2 transition-transform shadow-inner">
                    {p.avatar}
                  </span>
                  <span className="font-bold text-sm text-white truncate max-w-full">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>PIN</span>
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setCreateError('');
                setView('create');
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Nuevo Perfil</span>
            </button>

            {onResetAllData && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        '¿Estás seguro de que deseas eliminar TODOS los perfiles y datos para comenzar 100% desde cero? Esta acción no se puede deshacer.'
                      )
                    ) {
                      await onResetAllData();
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar todos los perfiles y empezar de cero</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: TECLADO PIN ULTRA-ACCESIBLE */}
        {view === 'pin' && selectedProfile && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setView('list');
                setPinInput('');
                setPinError(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a perfiles</span>
            </button>

            <div className="text-center mb-5">
              <span className="text-4xl inline-block p-2 bg-slate-800 rounded-2xl mb-2 shadow-inner">
                {selectedProfile.avatar}
              </span>
              <h3 className="text-xl font-bold text-white">¡Hola, {selectedProfile.name}!</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ingresa tu PIN de 4 dígitos</p>
            </div>

            {/* Indicador de 4 dígitos */}
            <div className={`flex justify-center items-center gap-4 mb-4 ${pinError ? 'animate-bounce' : ''}`}>
              {[0, 1, 2, 3].map((i) => {
                const filled = pinInput.length > i;
                return (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      pinError
                        ? 'bg-rose-500 shadow-lg shadow-rose-500/50 scale-110'
                        : filled
                        ? 'bg-cyan-400 shadow-md shadow-cyan-400/50 scale-125'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs text-rose-400 text-center font-semibold mb-3 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pinErrorMsg}</span>
              </p>
            )}

            {/* Teclado Numérico Gigante Táctil */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePressDigit(digit)}
                  className="py-4 bg-slate-950/80 hover:bg-slate-800 active:bg-cyan-500/20 active:scale-95 border border-slate-800 hover:border-slate-700 rounded-2xl text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              <button
                onClick={handleClearPin}
                className="py-4 bg-slate-950/40 hover:bg-slate-800 active:scale-95 border border-slate-800/80 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center justify-center"
                title="Limpiar"
              >
                Limpiar
              </button>

              <button
                onClick={() => handlePressDigit('0')}
                className="py-4 bg-slate-950/80 hover:bg-slate-800 active:bg-cyan-500/20 active:scale-95 border border-slate-800 hover:border-slate-700 rounded-2xl text-xl font-bold text-white transition-all shadow-sm flex items-center justify-center"
              >
                0
              </button>

              <button
                onClick={handleBackspace}
                className="py-4 bg-slate-950/40 hover:bg-slate-800 active:scale-95 border border-slate-800/80 rounded-2xl text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
                title="Borrar"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VISTA 3: ONBOARDING / CREAR NUEVO PERFIL */}
        {view === 'create' && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setView('list');
                  setCreateError('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-3 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a perfiles</span>
              </button>
            )}

            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {profiles.length === 0 ? '¡Bienvenido a RebajaYA!' : 'Crear Nuevo Perfil'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configura tu cuenta en 30 segundos con un PIN de 4 dígitos.
              </p>
            </div>

            {createError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tu Nombre o Apodo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Andrés, Carlos, María..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Selector de Avatar */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Elige tu Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setAvatar(av)}
                      className={`text-2xl p-2 rounded-xl border transition-all ${
                        avatar === av
                          ? 'bg-cyan-500/20 border-cyan-400 scale-110 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN de 4 dígitos */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Crea tu PIN de 4 Dígitos
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setNewPin(val);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-[0.4em] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Este PIN será tu llave para entrar siempre a tu cuenta.
                </span>
              </div>

              {/* Metas de Peso y Agua */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Peso Actual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Peso Meta (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Estatura y Edad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Estatura (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Edad (años)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Opción Cirugía Bariátrica */}
              <div
                onClick={() => setHasBariatric(!hasBariatric)}
                className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-white block">
                    ¿Tienes Cirugía Bariátrica?
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Activa la regla de separación de líquidos y prioridad de proteína
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasBariatric}
                  onChange={(e) => setHasBariatric(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {/* Cálculo automático de agua por la IA */}
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-2xl flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl flex-shrink-0">
                  <Droplets className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-cyan-300">Meta de Agua IA</span>
                    <span className="text-xs font-black text-cyan-200 px-2.5 py-0.5 bg-cyan-500/20 border border-cyan-400/30 rounded-full font-mono">
                      {calculatedWater} ml / día
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Calculada automáticamente por la IA para tu peso corporal (~30 ml por kg). Tu Nutricionista IA la adaptará.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>¡Comenzar mi transformación!</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
