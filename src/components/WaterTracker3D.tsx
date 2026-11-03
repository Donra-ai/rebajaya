'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { Droplet, Plus, Minus, RotateCcw, Sparkles } from 'lucide-react';

interface WaterTracker3DProps {
  currentMl: number;
  targetMl: number;
  onAddWater: (amount: number) => void;
  onReset: () => void;
}

export default function WaterTracker3D({
  currentMl,
  targetMl,
  onAddWater,
  onReset,
}: WaterTracker3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const bubblesGroupRef = useRef<THREE.Group | null>(null);
  const [animating, setAnimating] = useState(false);

  const percentage = Math.min(100, Math.round((currentMl / targetMl) * 100));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 320;

    // 1. Escena, Cámara y Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 4.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 3, 10);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    // 3. Vaso de Cristal 3D
    const glassGroup = new THREE.Group();
    scene.add(glassGroup);

    const glassRadiusTop = 0.95;
    const glassRadiusBottom = 0.75;
    const glassHeight = 2.4;

    const glassGeometry = new THREE.CylinderGeometry(
      glassRadiusTop,
      glassRadiusBottom,
      glassHeight,
      32,
      1,
      true
    );
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      ior: 1.45,
      side: THREE.DoubleSide,
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.y = 0;
    glassGroup.add(glassMesh);

    // Base del vaso
    const baseGeometry = new THREE.CylinderGeometry(glassRadiusBottom, glassRadiusBottom, 0.08, 32);
    const baseMesh = new THREE.Mesh(baseGeometry, glassMaterial);
    baseMesh.position.y = -glassHeight / 2;
    glassGroup.add(baseMesh);

    // Borde superior brillante
    const rimGeometry = new THREE.TorusGeometry(glassRadiusTop, 0.03, 16, 40);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.1,
      metalness: 0.4,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = glassHeight / 2;
    glassGroup.add(rimMesh);

    // 4. Agua interior con volumen dinámico
    const waterGroup = new THREE.Group();
    glassGroup.add(waterGroup);

    const initialHeightRatio = Math.max(0.02, Math.min(1, currentMl / targetMl));
    const currentWaterHeight = (glassHeight - 0.2) * initialHeightRatio;

    const waterRadiusTop = glassRadiusBottom + (glassRadiusTop - glassRadiusBottom) * initialHeightRatio;
    const waterGeometry = new THREE.CylinderGeometry(
      waterRadiusTop * 0.96,
      glassRadiusBottom * 0.96,
      currentWaterHeight,
      32
    );
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.6,
      ior: 1.33,
    });
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.y = -glassHeight / 2 + 0.1 + currentWaterHeight / 2;
    waterGroup.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 5. Burbujas flotantes 3D
    const bubblesGroup = new THREE.Group();
    glassGroup.add(bubblesGroup);
    bubblesGroupRef.current = bubblesGroup;

    const bubbleGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 15; i++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        (Math.random() - 0.5) * 1.0,
        -glassHeight / 2 + 0.2 + Math.random() * (glassHeight * 0.7),
        (Math.random() - 0.5) * 1.0
      );
      bubblesGroup.add(bubble);
    }

    // 6. Animación y Rotación
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Suave balanceo del vaso
      glassGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.15;
      glassGroup.rotation.x = 0.08 + Math.cos(elapsedTime * 0.4) * 0.03;

      // Animar burbujas flotando hacia arriba
      bubblesGroup.children.forEach((b, index) => {
        b.position.y += 0.008 + (index % 4) * 0.002;
        if (b.position.y > -glassHeight / 2 + 0.1 + (waterMeshRef.current?.scale.y || 1) * currentWaterHeight) {
          b.position.y = -glassHeight / 2 + 0.15;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Actualizar altura del agua dinámicamente cuando cambia currentMl
  useEffect(() => {
    if (!waterMeshRef.current) return;
    const ratio = Math.max(0.04, Math.min(1, currentMl / targetMl));
    waterMeshRef.current.scale.set(1, ratio, 1);
    const glassHeight = 2.4;
    const waterBase = -glassHeight / 2 + 0.1;
    const currentHeight = (glassHeight - 0.2) * ratio;
    waterMeshRef.current.position.y = waterBase + currentHeight / 2;
  }, [currentMl, targetMl]);

  const handleAdd = (amount: number) => {
    setAnimating(true);
    onAddWater(amount);

    // Celebración con confeti si llega a la meta
    if (currentMl + amount >= targetMl && currentMl < targetMl) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0284c7', '#22c55e', '#fbbf24'],
      });
    }

    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/40 via-sky-950/30 to-slate-900 border border-blue-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Fondo con brillo */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Droplet className="w-7 h-7 fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Agua de Hoy</h2>
            <p className="text-sm text-cyan-200/80">Meta recomendada: {targetMl} ml</p>
          </div>
        </div>

        {percentage >= 100 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-sm font-semibold animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>¡Meta lograda!</span>
          </div>
        )}
      </div>

      {/* Contenedor del Vaso 3D */}
      <div className="relative flex flex-col items-center justify-center">
        <div ref={mountRef} className="w-full h-64 cursor-grab active:cursor-grabbing flex items-center justify-center" />

        {/* Indicador Numérico Grande para fácil lectura */}
        <div className="absolute bottom-2 text-center bg-slate-900/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-cyan-500/30 shadow-xl">
          <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-200">
            {currentMl} <span className="text-lg text-cyan-300 font-medium">/ {targetMl} ml</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-1.5 overflow-hidden border border-cyan-900">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-cyan-300 mt-1 block">{percentage}% cumplido</span>
        </div>
      </div>

      {/* Botones de acción gigantes pensados para tu papá */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAdd(250)}
          className={`flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white text-lg font-bold rounded-2xl shadow-lg shadow-cyan-600/30 transition-all duration-200 ${
            animating ? 'scale-95' : ''
          }`}
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span>+ 1 Vaso</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">250 ml</span>
        </button>

        <button
          onClick={() => handleAdd(500)}
          className="flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-200"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          <span>+ Botella</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">500 ml</span>
        </button>
      </div>

      {/* Acciones auxiliares (Deshacer / Reiniciar día) */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
        <button
          onClick={() => onAddWater(-250)}
          disabled={currentMl <= 0}
          className="flex items-center gap-1 hover:text-slate-200 disabled:opacity-40 transition-colors py-1 px-2"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>Restar 250 ml</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1 hover:text-rose-400 transition-colors py-1 px-2"
          title="Reiniciar el conteo de hoy"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar día</span>
        </button>
      </div>
    </div>
  );
}
