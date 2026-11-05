'use client';

import React, { useState, useRef } from 'react';
import { UserProfile, WeightLog } from '@/types';
import confetti from 'canvas-confetti';
import {
  Scale,
  TrendingDown,
  Target,
  Plus,
  Minus,
  Check,
  Award,
  History,
  Camera,
  Image as ImageIcon,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sliders,
  Calendar,
} from 'lucide-react';

interface WeightProgressProps {
  profile: UserProfile;
  weightHistory: WeightLog[];
  onAddWeight: (weight: number, notes?: string, photoUrl?: string) => void;
}

// Comprime una imagen en el navegador a JPEG liviano (50-80 KB) usando Canvas
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 900;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Calidad 0.72 = excelente nitidez y tamaño ultra reducido
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

export default function WeightProgress({
  profile,
  weightHistory,
  onAddWeight,
}: WeightProgressProps) {
  const [inputWeight, setInputWeight] = useState<number>(profile.currentWeightKg || 80);
  const [showLogModal, setShowLogModal] = useState(false);
  const [note, setNote] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Estados para Galería / Comparador "Antes vs. Hoy"
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 a 100%
  const [selectedPhotoDetail, setSelectedPhotoDetail] = useState<WeightLog | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = profile.initialWeightKg;
  const current = profile.currentWeightKg;
  const target = profile.targetWeightKg;

  const totalToLose = Math.max(0.1, initial - target);
  const lostSoFar = Math.max(0, initial - current);
  const remaining = Math.max(0, current - target);
  const progressPct = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));

  // Registros que tienen fotografía asociada
  const photosHistory = weightHistory.filter((w) => !!w.photoUrl);
  const earliestPhoto = photosHistory.length > 0 ? photosHistory[0] : null;
  const latestPhoto =
    photosHistory.length > 1 ? photosHistory[photosHistory.length - 1] : null;

  // Manejar captura o carga de foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file);
      setPhotoDataUrl(compressed);
    } catch (err) {
      console.error('Error al comprimir foto:', err);
      alert('Hubo un error al procesar tu foto. Intenta con otra imagen.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSaveWeight = () => {
    onAddWeight(inputWeight, note.trim() || undefined, photoDataUrl || undefined);
    setShowLogModal(false);
    setNote('');
    setPhotoDataUrl(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Progreso de Peso</h2>
            <p className="text-sm text-slate-400">Objetivo y transformación física</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Galería "Antes vs. Hoy" */}
          <button
            onClick={() => setShowGalleryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white font-bold rounded-2xl shadow-sm active:scale-95 transition-all text-xs"
            title="Ver comparador visual Antes vs. Hoy"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Fotos ({photosHistory.length})</span>
          </button>

          {/* Botón Anotar Peso */}
          <button
            onClick={() => {
              setInputWeight(profile.currentWeightKg);
              setPhotoDataUrl(null);
              setNote('');
              setShowLogModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm"
          >
            <Scale className="w-4 h-4" />
            <span>Anotar Peso</span>
          </button>
        </div>
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
          <span className="text-xs font-bold text-amber-400">
            {progressPct}% completado hacia tu meta
          </span>
        </div>
      </div>

      {/* Mini banner de motivación visual si tiene fotos */}
      {photosHistory.length > 0 && (
        <div
          onClick={() => setShowGalleryModal(true)}
          className="mb-5 p-3.5 bg-gradient-to-r from-cyan-950/40 to-teal-950/40 border border-cyan-800/40 rounded-2xl flex items-center justify-between cursor-pointer hover:border-cyan-600 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Transformación en Fotos
              </span>
              <p className="text-[11px] text-slate-400">
                {photosHistory.length === 1
                  ? 'Tienes 1 foto registrada. ¡Añade otra en tu próximo pesaje!'
                  : `Tienes ${photosHistory.length} fotos. Compara tu "Antes vs. Hoy"`}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            Ver ➔
          </span>
        </div>
      )}

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
                <div className="flex items-center gap-3">
                  {entry.photoUrl ? (
                    <button
                      onClick={() => setSelectedPhotoDetail(entry)}
                      className="relative w-10 h-10 rounded-lg overflow-hidden border border-cyan-500/40 group hover:ring-2 hover:ring-cyan-400 transition-all flex-shrink-0"
                      title="Ver foto de progreso"
                    >
                      <img
                        src={entry.photoUrl}
                        alt="Foto progreso"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-200">{entry.date}</span>
                    {entry.notes && (
                      <p className="text-xs text-slate-400 mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-white">
                    {entry.weightKg} kg
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL 1: REGISTRAR NUEVO PESO + FOTO OPCIONAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white text-center mb-1">
              Registrar Nuevo Peso
            </h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Ajusta tus kilos y añade una foto para ver tu cambio corporal
            </p>

            {/* Ajustador de Peso Gigante */}
            <div className="flex items-center justify-center gap-4 my-4">
              <button
                onClick={() =>
                  setInputWeight((prev) => Math.max(30, Number((prev - 0.2).toFixed(1))))
                }
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white flex items-center justify-center text-2xl font-black border border-slate-700 shadow-lg"
              >
                <Minus className="w-7 h-7" />
              </button>

              <div className="text-center min-w-[130px]">
                <div className="text-5xl font-black text-amber-300 tracking-tight">
                  {inputWeight}
                </div>
                <span className="text-slate-400 font-semibold text-xs">Kilogramos</span>
              </div>

              <button
                onClick={() => setInputWeight((prev) => Number((prev + 0.2).toFixed(1)))}
                className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white flex items-center justify-center text-2xl font-black border border-slate-700 shadow-lg"
              >
                <Plus className="w-7 h-7" />
              </button>
            </div>

            {/* Ajustes rápidos +/- 1 kg */}
            <div className="flex justify-center gap-2 mb-5">
              <button
                onClick={() =>
                  setInputWeight((prev) => Math.max(30, Number((prev - 1).toFixed(1))))
                }
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
              >
                - 1.0 kg
              </button>
              <button
                onClick={() =>
                  setInputWeight((prev) => Number((prev + 1).toFixed(1)))
                }
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 hover:bg-slate-700"
              >
                + 1.0 kg
              </button>
            </div>

            {/* FOTO DE PROGRESO OPCIONAL */}
            <div className="mb-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Foto de progreso físico (opcional)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">100% Privado</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photoDataUrl ? (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-cyan-500/40 max-h-48 bg-black flex items-center justify-center">
                  <img
                    src={photoDataUrl}
                    alt="Previsualización"
                    className="max-h-48 object-contain"
                  />
                  <button
                    onClick={() => setPhotoDataUrl(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-500 shadow-md transition-colors"
                    title="Eliminar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-xs font-semibold"
                  >
                    <Camera className="w-5 h-5 text-cyan-400" />
                    <span>{isProcessingPhoto ? 'Procesando...' : 'Tomar Foto'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition-all text-xs font-semibold"
                  >
                    <ImageIcon className="w-5 h-5 text-teal-400" />
                    <span>Galería</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nota opcional */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Nota (ej: En ayunas, antes del desayuno)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Botones de Confirmación */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowLogModal(false)}
                className="py-3 px-4 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveWeight}
                className="py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-xs"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Guardar Peso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GALERÍA DE TRANSFORMACIÓN "ANTES VS. HOY" */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowGalleryModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-500 to-teal-500 text-slate-950 rounded-xl">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Transformación Física</h3>
                <p className="text-xs text-slate-400">
                  Compara tu silueta corporal: "Antes vs. Hoy"
                </p>
              </div>
            </div>

            {photosHistory.length === 0 ? (
              /* ESTADO VACÍO: NO HAY FOTOS */
              <div className="text-center py-10 px-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">
                  Aún no tienes fotos de progreso
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                  Tomarte una foto semanal al registrar tu peso es la mejor manera de ver cómo
                  cambia tu figura y ganar motivación visual.
                </p>
                <button
                  onClick={() => {
                    setShowGalleryModal(false);
                    setInputWeight(profile.currentWeightKg);
                    setShowLogModal(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20"
                >
                  Tomar mi primera foto hoy
                </button>
              </div>
            ) : photosHistory.length === 1 ? (
              /* ESTADO CON 1 SOLA FOTO */
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-cyan-800/40 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-full mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tu foto de referencia inicial ("Antes")</span>
                  </div>
                  <div className="max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-xl mb-3">
                    <img
                      src={photosHistory[0].photoUrl}
                      alt="Foto inicial"
                      className="w-full object-cover max-h-80"
                    />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {photosHistory[0].weightKg} kg · {photosHistory[0].date}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                    ¡Excelente punto de partida! Registra tu próximo pesaje con otra foto para
                    desbloquear el comparador interactivo "Antes vs. Hoy".
                  </p>
                </div>
              </div>
            ) : (
              /* ESTADO CON 2 O MÁS FOTOS: COMPARADOR "ANTES VS. HOY" */
              <div className="space-y-6">
                {/* Banner de Kilos bajados entre la 1ra y última foto */}
                {earliestPhoto && latestPhoto && (
                  <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Transformación Visual Lograda
                      </span>
                      <p className="text-white text-sm font-bold mt-0.5">
                        {earliestPhoto.weightKg > latestPhoto.weightKg ? (
                          <>
                            ¡Has bajado{' '}
                            <span className="text-emerald-300 text-lg">
                              {(earliestPhoto.weightKg - latestPhoto.weightKg).toFixed(1)} kg
                            </span>{' '}
                            desde tu primera foto! 🎉
                          </>
                        ) : (
                          <>Manteniendo constancia y salud corporal 💪</>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {photosHistory.length} fotos acumuladas
                    </span>
                  </div>
                )}

                {/* COMPARADOR INTERACTIVO LADO A LADO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Foto "Antes" */}
                  {earliestPhoto && (
                    <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold">
                          ANTES (Inicio)
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {earliestPhoto.weightKg} kg
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[3/4] bg-black flex items-center justify-center">
                        <img
                          src={earliestPhoto.photoUrl}
                          alt="Foto antes"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2 text-center text-xs text-slate-400">
                        {earliestPhoto.date} {earliestPhoto.notes && `· ${earliestPhoto.notes}`}
                      </div>
                    </div>
                  )}

                  {/* Foto "Hoy" */}
                  {latestPhoto && (
                    <div className="bg-slate-950/70 p-4 rounded-2xl border border-emerald-500/40 ring-1 ring-emerald-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold">
                          HOY (Más reciente)
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {latestPhoto.weightKg} kg
                        </span>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-700 aspect-[3/4] bg-black flex items-center justify-center">
                        <img
                          src={latestPhoto.photoUrl}
                          alt="Foto hoy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-2 text-center text-xs text-slate-400">
                        {latestPhoto.date} {latestPhoto.notes && `· ${latestPhoto.notes}`}
                      </div>
                    </div>
                  )}
                </div>

                {/* TIMELINE DE TODAS LAS FOTOS HISTÓRICAS */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cronología de Fotos</span>
                  </h4>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {photosHistory.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedPhotoDetail(item)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 aspect-square bg-slate-950 transition-all hover:scale-105"
                      >
                        <img
                          src={item.photoUrl}
                          alt={`Registro ${item.date}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-1.5">
                          <span className="text-[11px] font-bold text-white">
                            {item.weightKg} kg
                          </span>
                          <span className="text-[9px] text-slate-300">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: VISTA EN DETALLE DE FOTO INDIVIDUAL */}
      {selectedPhotoDetail && selectedPhotoDetail.photoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-5 relative">
            <button
              onClick={() => setSelectedPhotoDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[70vh] flex items-center justify-center bg-black mb-3">
              <img
                src={selectedPhotoDetail.photoUrl}
                alt="Detalle foto"
                className="max-h-[70vh] object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-extrabold text-white text-base">
                  {selectedPhotoDetail.weightKg} kg
                </span>
                <p className="text-xs text-slate-400">{selectedPhotoDetail.date}</p>
                {selectedPhotoDetail.notes && (
                  <p className="text-xs text-amber-300/90 mt-1 italic">
                    "{selectedPhotoDetail.notes}"
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPhotoDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
