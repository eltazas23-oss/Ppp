/**
 * TrackSelectorModal.tsx
 * High-End FIA Official Track Selection Modal for Apex GT.
 * Allows drivers to choose between the Monaco-style Classic Ring and the new
 * Apex Super Speedway GP (Ultra-long straight + Hairpin + Chicane + Fast Sweeper).
 */

import React from 'react';
import { Flag, Gauge, Zap, Check, ArrowRight, ShieldCheck, MapPin, Award } from 'lucide-react';
import { CircuitId, CIRCUITS } from '../game/career/CircuitConfig';
import { playUiClick, playUiHover, playModeSelectChime } from '../utils/uiAudio';

interface TrackSelectorModalProps {
  selectedCircuit: CircuitId;
  onSelectCircuit: (id: CircuitId) => void;
  onClose: () => void;
}

export const TrackSelectorModal: React.FC<TrackSelectorModalProps> = ({
  selectedCircuit,
  onSelectCircuit,
  onClose,
}) => {
  const circuitList = Object.values(CIRCUITS);

  const handleSelect = (id: CircuitId) => {
    playModeSelectChime();
    onSelectCircuit(id);
  };

  const handleConfirm = () => {
    playUiClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl text-white relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-red-600/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-1">
              <Zap className="w-3.5 h-3.5 fill-red-500" />
              <span>CALENDARIO OFICIAL FIA GRAN PREMIO</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black italic tracking-wide text-white">
              SELECTOR DE CIRCUITO Y TRAZADO
            </h2>
          </div>
          <button
            onClick={() => {
              playUiClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Circuit Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {circuitList.map((circuit) => {
            const isSelected = selectedCircuit === circuit.id;
            return (
              <div
                key={circuit.id}
                onClick={() => handleSelect(circuit.id)}
                onMouseEnter={() => playUiHover()}
                className={`cursor-pointer rounded-xl p-5 border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-red-500 bg-red-950/20 shadow-xl shadow-red-950/50 scale-[1.01]'
                    : 'border-white/10 bg-neutral-900/60 hover:border-white/20 hover:bg-neutral-800/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{circuit.flag}</span>
                      <div>
                        <h3 className="font-black text-lg tracking-wide text-white leading-tight">
                          {circuit.name}
                        </h3>
                        <p className="text-xs text-neutral-400 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-red-400" />
                          {circuit.subtitle} ({circuit.country})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Circuit Minimap SVG */}
                  <div className="h-32 bg-neutral-950/90 rounded-lg flex items-center justify-center p-3 mb-4 border border-white/5 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full stroke-red-500 fill-none stroke-[4] stroke-linecap-round stroke-linejoin-round drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                      <path d={circuit.previewSvgPath} />
                    </svg>
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono text-neutral-500 uppercase">
                      {circuit.id === 'square_gp' ? '4 CURVAS 90°' : 'RECTA 600M + CHICANE'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4 min-h-[36px]">
                    {circuit.description}
                  </p>
                </div>

                {/* Circuit Metrics Grid */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] bg-neutral-950/80 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <div className="text-neutral-500 text-[8px] uppercase font-bold">Longitud</div>
                    <div className="font-mono font-bold text-neutral-200 mt-0.5">{circuit.lengthMeters} m</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[8px] uppercase font-bold">Curvas</div>
                    <div className="font-mono font-bold text-neutral-200 mt-0.5">{circuit.turnsCount}</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[8px] uppercase font-bold">Vel. Punta</div>
                    <div className="font-mono font-bold text-amber-400 mt-0.5">{circuit.topSpeedKmh} km/h</div>
                  </div>
                  <div>
                    <div className="text-neutral-500 text-[8px] uppercase font-bold">Dificultad</div>
                    <div className={`font-bold mt-0.5 ${circuit.difficulty === 'Experto' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {circuit.difficulty}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Trazado homologado para Carrera Gran Premio (5 Monoplazas), Práctica Libre y Multijugador 1v1</span>
          </div>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-red-950/80 transition-all"
          >
            <span>CONFIRMAR CIRCUITO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
