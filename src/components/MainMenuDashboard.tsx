/**
 * MainMenuDashboard.tsx
 * Modern, High-End AAA Racing Operations Hub for Apex GT.
 * Replaces the previous modal with a full-screen dashboard featuring:
 * - Driver profile and racing number customization
 * - Gran Premio F1 Career Mode (5 Cars Grid) with Laps, AI Difficulty, Starting Tire Compound, and FIA 2-Compound Rule
 * - Time Trial & Free Practice Mode (Solo)
 * - 1v1 Private Multiplayer Room (Create, Join, and Real-time Lobby Grid)
 * - 3D GLTF Model Garage Manager for Cars & Pit Crew
 * - Ergonomic Camera Distance & View Presets
 * - Quick Keyboard Controls Reference Guide
 * - Audio feedback on every click/tab transition
 */

import React, { useState } from 'react';
import {
  Play,
  Users,
  UserCheck,
  PlusCircle,
  LogIn,
  Copy,
  Check,
  Upload,
  Camera,
  Flag,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Gauge,
  Award,
  Settings,
  Car,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { CameraDistanceMode, CameraViewMode } from '../game/RacingGameEngine';
import { MultiplayerRoomState } from '../game/multiplayer/MultiplayerClient';
import { RaceDifficulty, RaceLapOption } from '../game/career/CareerTypes';
import { TireCompoundType } from '../game/physics/TireCompound';
import { playUiClick, playUiHover, playModeSelectChime } from '../utils/uiAudio';
import { CircuitId, getCircuitConfig } from '../game/career/CircuitConfig';
import { TrackSelectorModal } from './TrackSelectorModal';

interface MainMenuDashboardProps {
  selectedCircuit?: CircuitId;
  onSelectCircuit?: (id: CircuitId) => void;
  onStartSolo: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    laps: RaceLapOption,
    difficulty: RaceDifficulty,
    startingCompound: TireCompoundType
  ) => void;
  onStartFreePractice?: (
    cameraDistance: CameraDistanceMode,
    cameraMode: CameraViewMode,
    startingCompound: TireCompoundType
  ) => void;
  onCreateRoom: (options: {
    playerName: string;
    laps: number;
    car1Name: string;
    car2Name: string;
    crewName: string;
    cameraDistance: CameraDistanceMode;
    cameraMode: CameraViewMode;
    car1Data?: string;
    car2Data?: string;
    crewData?: string;
  }) => Promise<void>;
  onJoinRoom: (code: string, playerName: string, cameraDistance: CameraDistanceMode, cameraMode: CameraViewMode) => Promise<void>;
  onStartMultiplayerRace: () => void;
  onSetReady: (isReady: boolean) => void;
  onLeaveRoom: () => void;
  onBackToTitle: () => void;
  roomState: MultiplayerRoomState | null;
  playerId: 'p1' | 'p2' | null;
  isConnecting: boolean;
  errorMessage: string | null;
  onOpenModelUpload: (target: 'car1' | 'car2' | 'crew') => void;
  car1Name: string;
  car2Name: string;
  crewName: string;
}

export const MainMenuDashboard: React.FC<MainMenuDashboardProps> = ({
  selectedCircuit = 'square_gp',
  onSelectCircuit,
  onStartSolo,
  onStartFreePractice,
  onCreateRoom,
  onJoinRoom,
  onStartMultiplayerRace,
  onSetReady,
  onLeaveRoom,
  onBackToTitle,
  roomState,
  playerId,
  isConnecting,
  errorMessage,
  onOpenModelUpload,
  car1Name,
  car2Name,
  crewName,
}) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'grand_prix' | 'free_practice' | 'multiplayer' | 'garage'>('grand_prix');
  const [multiplayerSubView, setMultiplayerSubView] = useState<'create' | 'join'>('create');
  const [showTrackModal, setShowTrackModal] = useState<boolean>(false);
  const circuitConfig = getCircuitConfig(selectedCircuit);

  // Pilot Profile
  const [playerName, setPlayerName] = useState<string>('Piloto ' + Math.floor(100 + Math.random() * 900));
  const [carNumber, setCarNumber] = useState<string>('33');

  // Multiplayer inputs
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [multiplayerLaps, setMultiplayerLaps] = useState<number>(3);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Grand Prix Career setup
  const [careerLaps, setCareerLaps] = useState<RaceLapOption>(20);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('medium');
  const [startingCompound, setStartingCompound] = useState<TireCompoundType>('soft');

  // Camera Settings
  const [cameraDistance, setCameraDistance] = useState<CameraDistanceMode>('medium');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // Quick Controls Modal
  const [showControlsModal, setShowControlsModal] = useState(false);

  const isHost = playerId === 'p1';
  const isGuest = playerId === 'p2';
  const inRoom = Boolean(roomState && playerId);

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setIsCopied(true);
    playUiClick(1100);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateRoomSubmit = async () => {
    playUiClick(900);
    await onCreateRoom({
      playerName: playerName.trim() || 'Piloto 1 (Anfitrión)',
      laps: multiplayerLaps,
      car1Name,
      car2Name,
      crewName,
      cameraDistance,
      cameraMode,
    });
  };

  const handleJoinRoomSubmit = async () => {
    if (!joinCodeInput.trim()) return;
    playUiClick(900);
    await onJoinRoom(
      joinCodeInput.trim(),
      playerName.trim() || 'Piloto 2 (Invitado)',
      cameraDistance,
      cameraMode
    );
  };

  const handleToggleReady = () => {
    playUiClick(1000);
    const next = !isReady;
    setIsReady(next);
    onSetReady(next);
  };

  // --- ROOM LOBBY VIEW (WHEN CONNECTED IN 1v1 MULTIPLAYER) ---
  if (inRoom && roomState) {
    const p1 = roomState.players['p1'];
    const p2 = roomState.players['p2'];
    const canStart = isHost && p1 && p2 && p2.isReady;

    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 overflow-y-auto select-none">
        <div className="bg-neutral-900/95 border border-white/15 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-neutral-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white font-mono tracking-wide">
                    SALA MULTIJUGADOR 1 VS 1
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isHost ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                    {isHost ? 'ANFITRIÓN (POLE)' : 'INVITADO (PARRILLA)'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">Circuito Square Speedway · 2 Monoplazas en Pista</p>
              </div>
            </div>

            <button
              onClick={() => {
                playUiClick();
                onLeaveRoom();
              }}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Abandonar Sala</span>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Room ID Bar */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 font-mono">
                  CÓDIGO DE SALA PRIVADA
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-amber-400 mt-0.5">
                  {roomState.code}
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? '¡CÓDIGO COPIADO!' : 'COPIAR CÓDIGO'}</span>
              </button>
            </div>

            {/* Players Status Grid (P1 & P2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Player 1 (Host - Pole Position) */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-amber-500/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Flag className="w-3.5 h-3.5 text-amber-400" /> POLE POSITION · COCHE 1
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    LISTO
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 font-mono text-base">
                    1
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm text-white truncate">
                      {p1?.name || 'Anfitrión'}
                    </span>
                    <span className="text-xs text-neutral-400 truncate">
                      Modelo: {car1Name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player 2 (Guest - P2) */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-cyan-500/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Flag className="w-3.5 h-3.5 text-cyan-400" /> PARRILLA 2ª POSICIÓN · COCHE 2
                  </span>
                  {p2 ? (
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${p2.isReady ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'}`}>
                      {p2.isReady ? 'LISTO' : 'PREPARANDO...'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-white/5 text-[10px] font-bold animate-pulse">
                      ESPERANDO RIVAL...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 font-mono text-base">
                    2
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm text-white truncate">
                      {p2 ? p2.name : 'Esperando a que tu amigo se una...'}
                    </span>
                    <span className="text-xs text-neutral-400 truncate">
                      {p2 ? `Modelo: ${car2Name}` : 'Comparte el código arriba'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Host Exclusive Setup (Models & Laps) */}
            {isHost && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> CONFIGURACIÓN DEL ANFITRIÓN
                  </span>
                  <span className="text-[10px] text-neutral-400">Solo el Creador puede editar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => onOpenModelUpload('car1')}
                    className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 flex flex-col text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-bold text-amber-400 font-mono">COCHE J1 (TUYO)</span>
                      <Upload className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <span className="text-xs font-bold text-white truncate">{car1Name}</span>
                  </button>

                  <button
                    onClick={() => onOpenModelUpload('car2')}
                    className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 flex flex-col text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-bold text-cyan-400 font-mono">COCHE J2 (RIVAL)</span>
                      <Upload className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <span className="text-xs font-bold text-white truncate">{car2Name}</span>
                  </button>

                  <button
                    onClick={() => onOpenModelUpload('crew')}
                    className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 flex flex-col text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">MECÁNICOS PIT</span>
                      <Upload className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                    <span className="text-xs font-bold text-white truncate">{crewName}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Launch / Ready Button */}
            {isGuest ? (
              <button
                onClick={handleToggleReady}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider font-mono transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/60'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/60'
                }`}
              >
                {isReady ? <UserCheck className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span>{isReady ? '¡LISTO PARA CORRER! (ESPERANDO AL ANFITRIÓN)' : 'MARCAR COMO LISTO'}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playUiClick(1200);
                  onStartMultiplayerRace();
                }}
                disabled={!canStart}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wider font-mono transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  canStart
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-xl shadow-red-950/60 animate-pulse'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {!p2
                    ? 'ESPERANDO A QUE SE UNA EL JUGADOR 2...'
                    : !p2.isReady
                    ? 'ESPERANDO A QUE EL JUGADOR 2 MARQUE LISTO...'
                    : '¡LANZAR SALIDA 1 VS 1 (SEMÁFORO FIA)!'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN OPERATIONS DASHBOARD VIEW ---
  return (
    <div className="fixed inset-0 z-40 bg-neutral-950/90 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none animate-fade-in text-white font-sans">
      {/* Top Operations Header */}
      <header className="w-full px-4 sm:px-8 py-4 border-b border-white/10 bg-neutral-950/95 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Back to Title Screen */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playUiClick(600);
              onBackToTitle();
            }}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Volver a la Pantalla de Inicio"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">INICIO</span>
          </button>

          <div className="h-6 w-px bg-white/10" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
                APEX GT
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600/30 border border-red-500/40 text-[9px] font-black font-mono text-red-400 tracking-wider">
                RACE HUB
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">DASHBOARD DE OPERACIONES DE CARRERA</p>
          </div>
        </div>

        {/* Driver Passport Quick Config */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-white/10">
            <span className="text-[10px] font-bold text-neutral-400 font-mono">PILOTO:</span>
            <input
              type="text"
              value={playerName}
              maxLength={18}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none w-28 sm:w-36 font-mono border-b border-white/20 focus:border-amber-400 transition-colors"
              placeholder="Tu Nombre"
            />
            <div className="flex items-center gap-1 pl-1 border-l border-white/10">
              <span className="text-[10px] font-mono text-neutral-400">#</span>
              <input
                type="text"
                value={carNumber}
                maxLength={2}
                onChange={(e) => setCarNumber(e.target.value.replace(/\D/g, ''))}
                className="w-6 bg-transparent text-xs font-bold text-amber-400 font-mono focus:outline-none text-center"
                placeholder="33"
                title="Número de dorsal"
              />
            </div>
          </div>

          <button
            onClick={() => {
              playUiClick(850);
              setShowControlsModal(!showControlsModal);
            }}
            className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Guía de Controles"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-4 sm:mx-8 mt-4 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Mode Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900/90 border border-white/10 w-fit">
          <button
            onClick={() => {
              playUiClick(750);
              setActiveTab('grand_prix');
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'grand_prix'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-950/50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>GRAN PREMIO (5 COCHES)</span>
          </button>

          <button
            onClick={() => {
              playUiClick(750);
              setActiveTab('free_practice');
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'free_practice'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>VUELTAS LIBRES (TIME TRIAL)</span>
          </button>

          <button
            onClick={() => {
              playUiClick(750);
              setActiveTab('multiplayer');
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'multiplayer'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-950/50'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>MULTIJUGADOR 1v1</span>
          </button>

          <button
            onClick={() => {
              playUiClick(750);
              setActiveTab('garage');
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase font-mono transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'garage'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>GARAJE 3D & CÁMARAS</span>
          </button>
        </div>

        {/* Tab 1: Grand Prix F1 */}
        {activeTab === 'grand_prix' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left 2 Cols: Grand Prix Parameters */}
            <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                      CONFIGURACIÓN OFICIAL DEL GRAN PREMIO
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Parrilla de 5 monoplazas con IA adaptativa y telemetría de boxes
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>REGULACIÓN FIA 2026</span>
                </div>
              </div>

              {/* 0. Circuit Selector Banner */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{circuitConfig.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-400 font-mono uppercase">CIRCUITO SELECCIONADO</span>
                      <span className="text-[9px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded font-bold">{circuitConfig.badge}</span>
                    </div>
                    <h4 className="text-base font-black text-white">{circuitConfig.name}</h4>
                    <p className="text-xs text-neutral-400 font-mono">{circuitConfig.lengthMeters} m · {circuitConfig.turnsCount} Curvas · Top Speed: {circuitConfig.topSpeedKmh} km/h</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playUiClick(800);
                    setShowTrackModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 hover:text-white border border-red-500/40 font-bold text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <span>CAMBIAR CIRCUITO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Distance Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                  1. DISTANCIA DE CARRERA (NÚMERO DE VUELTAS):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([9, 20, 50] as RaceLapOption[]).map((laps) => (
                    <button
                      key={laps}
                      onClick={() => {
                        playUiClick(700);
                        setCareerLaps(laps);
                      }}
                      className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                        careerLaps === laps
                          ? 'bg-red-600/20 border-red-500 text-white shadow-md shadow-red-950/50'
                          : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-base font-black font-mono">
                        {laps} Vueltas
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {laps === 9 ? 'Sprint Race (~3 min)' : laps === 20 ? 'Gran Premio Oficial' : 'Resistencia Endurance'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. AI Difficulty */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                  2. DIFICULTAD DE LA IA RIVAL (4 RIVALES):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as RaceDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        playUiClick(700);
                        setDifficulty(diff);
                      }}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        difficulty === diff
                          ? diff === 'easy'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black'
                            : diff === 'medium'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-black'
                            : 'bg-red-600/20 border-red-500 text-red-300 font-black'
                          : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold font-mono block">
                          {diff === 'easy' ? 'Novato (Fácil)' : diff === 'medium' ? 'Challenger (Medio)' : 'Campeón (Élite F1)'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {diff === 'easy' ? 'IA con trazada suave' : diff === 'medium' ? 'IA equilibrada y adelantamientos' : 'Ritmo de pole y agresivo'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Tire Compound */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                  3. COMPUESTO DE NEUMÁTICOS DE SALIDA:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['soft', 'medium', 'hard'] as TireCompoundType[]).map((comp) => (
                    <button
                      key={comp}
                      onClick={() => {
                        playUiClick(700);
                        setStartingCompound(comp);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        startingCompound === comp
                          ? comp === 'soft'
                            ? 'bg-red-600/20 border-red-500 text-white'
                            : comp === 'medium'
                            ? 'bg-amber-600/20 border-amber-500 text-white'
                            : 'bg-neutral-800 border-white/40 text-white'
                          : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: comp === 'soft' ? '#ef4444' : comp === 'medium' ? '#eab308' : '#f8fafc',
                          }}
                        />
                        <span className="font-black text-sm font-mono uppercase">
                          {comp === 'soft' ? 'Blando (C3)' : comp === 'medium' ? 'Medio (C2)' : 'Duro (C1)'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {comp === 'soft'
                          ? 'Máximo agarre, alta degradación'
                          : comp === 'medium'
                          ? 'Equilibrio agarre / vida útil'
                          : 'Durabilidad extrema para stints largos'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FIA 2-Compound Rule Notice */}
              {careerLaps >= 20 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Normativa Oficial FIA:</strong> En carreras de {careerLaps} vueltas es obligatorio parar en boxes y montar <strong>dos compuestos distintos</strong> antes del final. Si no cumples la regla se aplicará penalización de 30 segundos.
                  </span>
                </div>
              )}
            </div>

            {/* Right 1 Col: Summary & Big Launch Button */}
            <div className="flex flex-col justify-between p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-black font-mono uppercase tracking-wider text-neutral-400">
                  RESUMEN DE SALIDA A PISTA
                </span>

                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 flex flex-col gap-2.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Piloto:</span>
                    <span className="font-bold text-white">{playerName} #{carNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Vueltas:</span>
                    <span className="font-bold text-red-400">{careerLaps} Vueltas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Dificultad IA:</span>
                    <span className="font-bold text-amber-400 capitalize">{difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Compuesto:</span>
                    <span className="font-bold text-cyan-400 uppercase">{startingCompound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Cámara:</span>
                    <span className="font-bold text-white capitalize">{cameraDistance}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-950/40 border border-white/5 flex flex-col gap-1 text-[11px] text-neutral-400">
                  <span className="font-bold text-neutral-300">Circuito Square Speedway:</span>
                  <span>4 Rectas de alta velocidad · Trampa de radar FIA a 300+ km/h · Zona DRS en la recta este</span>
                </div>
              </div>

              {/* Big Launch Button */}
              <button
                onClick={() => {
                  playModeSelectChime();
                  onStartSolo(cameraDistance, cameraMode, careerLaps, difficulty, startingCompound);
                }}
                className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:via-amber-400 hover:to-red-500 text-white font-black text-base tracking-[0.15em] uppercase font-mono shadow-xl shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>¡INICIAR GRAN PREMIO!</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Free Practice / Time Trial */}
        {activeTab === 'free_practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/80 border border-blue-500/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Gauge className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                    MODO 1 SOLO JUGADOR · VUELTAS LIBRES (TIME TRIAL)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Pista libre sin tráfico de IA ni penalizaciones de reglamento
                  </p>
                </div>
              </div>

              {/* Circuit Selector Banner for Free Practice */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{circuitConfig.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 font-mono uppercase">CIRCUITO SELECCIONADO</span>
                      <span className="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-bold">{circuitConfig.badge}</span>
                    </div>
                    <h4 className="text-base font-black text-white">{circuitConfig.name}</h4>
                    <p className="text-xs text-neutral-400 font-mono">{circuitConfig.lengthMeters} m · {circuitConfig.turnsCount} Curvas · Top Speed: {circuitConfig.topSpeedKmh} km/h</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playUiClick(800);
                    setShowTrackModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 hover:text-white border border-blue-500/40 font-bold text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <span>CAMBIAR CIRCUITO</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-sm text-neutral-300 leading-relaxed">
                <p>
                  Entrena tus trazadas, perfecciona los puntos de frenada y experimenta con la activación del DRS en la recta rápida. En este modo la pista está completamente despejada para ti.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-white/10">
                    <span className="text-[10px] text-neutral-400 font-mono block">OBJETIVO:</span>
                    <span className="text-xs font-bold text-white">Récord de Vuelta Rápida</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-white/10">
                    <span className="text-[10px] text-neutral-400 font-mono block">PIT LANE:</span>
                    <span className="text-xs font-bold text-emerald-400">Boxes Abiertos para Prácticas</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-white/10">
                    <span className="text-[10px] text-neutral-400 font-mono block">TRAFICO:</span>
                    <span className="text-xs font-bold text-cyan-400">Pista 100% Despejada</span>
                  </div>
                </div>
              </div>

              {/* Compound Choice for Time Trial */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                  COMPUESTO DE NEUMÁTICOS INICIAL:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['soft', 'medium', 'hard'] as TireCompoundType[]).map((comp) => (
                    <button
                      key={comp}
                      onClick={() => {
                        playUiClick(700);
                        setStartingCompound(comp);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        startingCompound === comp
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-neutral-950/60 border-white/10 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="capitalize text-xs font-mono">
                        {comp === 'soft' ? '🔴 Blando (C3)' : comp === 'medium' ? '🟡 Medio (C2)' : '⚪ Duro (C1)'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Free Practice */}
            <div className="flex flex-col justify-between p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-black font-mono uppercase tracking-wider text-blue-400">
                  ENTRENAMIENTO LIBRE
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ideal para jugadores que quieran familiarizarse con la física de derrape, el desgaste dinámico de las ruedas y la telemetría antes de disputar el Gran Premio.
                </p>
              </div>

              <button
                onClick={() => {
                  playModeSelectChime();
                  onStartFreePractice?.(cameraDistance, cameraMode, startingCompound);
                }}
                className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white font-black text-base tracking-[0.15em] uppercase font-mono shadow-xl shadow-blue-950/60 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Gauge className="w-5 h-5" />
                <span>¡ENTRAR A VUELTAS LIBRES!</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Multiplayer 1v1 */}
        {activeTab === 'multiplayer' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-neutral-900/80 border border-amber-500/20 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                      MULTIJUGADOR 1 VS 1 PRIVADO
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Compite cara a cara contra un amigo en tiempo real con sincronización de telemetría
                    </p>
                  </div>
                </div>

                {/* Subview Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-white/10">
                  <button
                    onClick={() => {
                      playUiClick(700);
                      setMultiplayerSubView('create');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      multiplayerSubView === 'create'
                        ? 'bg-amber-500 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Crear Sala
                  </button>
                  <button
                    onClick={() => {
                      playUiClick(700);
                      setMultiplayerSubView('join');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      multiplayerSubView === 'join'
                        ? 'bg-cyan-500 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Unirse a Sala
                  </button>
                </div>
              </div>

              {multiplayerSubView === 'create' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300">
                      NÚMERO DE VUELTAS DE LA SALA PRIVADA:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 3, 5, 10, 20].map((lap) => (
                        <button
                          key={lap}
                          onClick={() => {
                            playUiClick(700);
                            setMultiplayerLaps(lap);
                          }}
                          className={`w-12 h-12 rounded-xl text-sm font-black font-mono transition-all cursor-pointer ${
                            multiplayerLaps === lap
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-950/60'
                              : 'bg-neutral-950 text-neutral-400 border border-white/10 hover:text-white'
                          }`}
                        >
                          {lap}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col gap-2">
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      INFORMACIÓN PARA EL ANFITRIÓN:
                    </span>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Al crear la sala recibirás un código privado. Compártelo con tu amigo para que se conecte desde su dispositivo. Podrás cargar modelos 3D personalizados tanto para tu coche como para el de tu rival.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <label className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-300">
                    INTRODUCE EL CÓDIGO DE SALA PRIVADA:
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="PEGA EL CÓDIGO (EJ: APEX-924)"
                      className="flex-1 px-4 py-3.5 rounded-2xl bg-neutral-950 border border-white/20 text-white font-mono font-bold text-sm tracking-widest focus:outline-none focus:border-cyan-400 uppercase"
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    Pide a tu amigo el código de 8 caracteres generado en su pantalla para ingresar a su parrilla de salida.
                  </p>
                </div>
              )}
            </div>

            {/* Multiplayer Action Panel */}
            <div className="flex flex-col justify-between p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-black font-mono uppercase tracking-wider text-amber-400">
                  CONEXIÓN PADDOCK 1v1
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Semáforo oficial de 5 luces rojas simultáneas para ambos pilotos y visualización de la posición del rival en tiempo real.
                </p>
              </div>

              {multiplayerSubView === 'create' ? (
                <button
                  onClick={handleCreateRoomSubmit}
                  disabled={isConnecting}
                  className="mt-6 w-full py-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm tracking-[0.15em] uppercase font-mono shadow-xl shadow-amber-950/60 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                  <span>CREAR SALA Y OBTENER CÓDIGO</span>
                </button>
              ) : (
                <button
                  onClick={handleJoinRoomSubmit}
                  disabled={isConnecting || !joinCodeInput.trim()}
                  className={`mt-6 w-full py-5 rounded-2xl font-black text-sm tracking-[0.15em] uppercase font-mono transition-all flex items-center justify-center gap-3 ${
                    joinCodeInput.trim()
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-950/60 cursor-pointer active:scale-95'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isConnecting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  <span>UNIRSE A LA SALA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: 3D Garage & Cameras */}
        {activeTab === 'garage' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* 3D Model Manager */}
            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <Car className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                    GESTOR DE MODELOS 3D (.GLTF / .GLB)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Sustituye los modelos procedurales por tus propios coches 3D
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => onOpenModelUpload('car1')}
                  className="p-4 rounded-2xl bg-neutral-950/80 hover:bg-neutral-800/80 border border-white/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-amber-400 font-mono">COCHE 1 (TU MONOPLAZA)</span>
                    <span className="text-sm font-bold text-white">{car1Name}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 font-mono flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir 3D</span>
                  </div>
                </button>

                <button
                  onClick={() => onOpenModelUpload('car2')}
                  className="p-4 rounded-2xl bg-neutral-950/80 hover:bg-neutral-800/80 border border-white/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono">COCHE 2 (RIVAL MULTIJUGADOR)</span>
                    <span className="text-sm font-bold text-white">{car2Name}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 font-mono flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir 3D</span>
                  </div>
                </button>

                <button
                  onClick={() => onOpenModelUpload('crew')}
                  className="p-4 rounded-2xl bg-neutral-950/80 hover:bg-neutral-800/80 border border-white/10 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-emerald-400 font-mono">MECÁNICOS PIT CREW</span>
                    <span className="text-sm font-bold text-white">{crewName}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 font-mono flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir 3D</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Camera Settings */}
            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <Camera className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="text-base font-black text-white font-mono uppercase tracking-wide">
                    PREFERENCIAS DE CÁMARA
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Distancia y perspectiva predeterminada al saltar a pista
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold font-mono uppercase text-neutral-300">
                  DISTANCIA DE LA CÁMARA:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['near', 'medium', 'far'] as CameraDistanceMode[]).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => {
                        playUiClick(700);
                        setCameraDistance(dist);
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold font-mono capitalize transition-all cursor-pointer ${
                        cameraDistance === dist
                          ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-400'
                          : 'bg-neutral-950/60 text-neutral-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {dist === 'near' ? 'Cerca' : dist === 'medium' ? 'Media (Óptima)' : 'Lejos'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/10 flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-neutral-300 font-mono">
                  ACCESO RÁPIDO EN PISTA:
                </span>
                <p className="text-xs text-neutral-400">
                  Podrás alternar la cámara en cualquier instante durante la carrera pulsando la tecla <strong>C</strong> o tocando el botón de cámara en el HUD.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer System Bar */}
      <footer className="w-full px-4 sm:px-8 py-3 border-t border-white/10 bg-neutral-950/95 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 font-mono gap-3">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>MOTOR GRÁFICO WEBGL 2.0 LISTO</span>
          <span>·</span>
          <span>SISTEMA DE COLISIONES ACTIVO</span>
        </div>

        <div className="flex items-center gap-4">
          <span>APEX SCUDERIA PRO RACING</span>
        </div>
      </footer>

      {/* Controls Reference Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-fade-in font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-white">GUÍA DE CONTROLES DE CONDUCCIÓN</h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-amber-400 font-bold block">W / ↑</span>
                <span className="text-neutral-300">Acelerar a fondo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-amber-400 font-bold block">S / ↓</span>
                <span className="text-neutral-300">Frenar y marcha atrás</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-amber-400 font-bold block">A - D / ← →</span>
                <span className="text-neutral-300">Dirección y giro</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-amber-400 font-bold block">ESPACIO</span>
                <span className="text-neutral-300">Freno de Mano</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-cyan-400 font-bold block">D</span>
                <span className="text-neutral-300">Abrir DRS (Alerón)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-emerald-400 font-bold block">B</span>
                <span className="text-neutral-300">Pedir Pit Stop (Boxes)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-neutral-400 font-bold block">C</span>
                <span className="text-neutral-300">Cambiar Cámara</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-white/10">
                <span className="text-red-400 font-bold block">R</span>
                <span className="text-neutral-300">Reset en Pista</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Track Selector Modal */}
      {showTrackModal && (
        <TrackSelectorModal
          selectedCircuit={selectedCircuit}
          onSelectCircuit={(id) => {
            if (onSelectCircuit) {
              onSelectCircuit(id);
            }
          }}
          onClose={() => setShowTrackModal(false)}
        />
      )}
    </div>
  );
};
