/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clock, Sliders, ShieldX, CheckCircle, Zap } from "lucide-react";
import { VehicleSensors, ADASState } from "../types";

interface HeaderProps {
  sensors: VehicleSensors;
  setSensors: (u: (prev: VehicleSensors) => VehicleSensors) => void;
  setAdas: (u: (prev: ADASState) => ADASState) => void;
  setTargetDistance: (val: number) => void;
  activeDtcCount: number;
}

export function Header({
  sensors,
  setSensors,
  setAdas,
  setTargetDistance,
  activeDtcCount
}: HeaderProps) {

  // Macro overrides
  const setMacroParkedIdle = () => {
    setSensors(prev => ({
      ...prev,
      speed: 0,
      steeringAngle: 0,
      gear: "P",
      throttle: 0,
      brake: 0,
      batterySoc: 92,
      batteryTemp: 24,
      cabinTemp: 21
    }));
    setAdas(prev => ({
      ...prev,
      lkaStatus: "IDLE",
      accStatus: "OFF",
      aebActive: false,
      aebPreWarning: false,
      bsmLeftAlert: false,
      bsmRightAlert: false
    }));
    setTargetDistance(120);
  };

  const setMacroCruising = () => {
    setSensors(prev => ({
      ...prev,
      speed: 105,
      steeringAngle: -1.2,
      gear: "D",
      throttle: 32,
      brake: 0,
      batterySoc: 74,
      batteryTemp: 32,
      cabinTemp: 22
    }));
    setAdas(prev => ({
      ...prev,
      lkaStatus: "MONITORING",
      accStatus: "ACTIVE",
      accSetSpeed: 110,
      aebActive: false,
      aebPreWarning: false,
      bsmLeftAlert: false,
      bsmRightAlert: false
    }));
    setTargetDistance(85);
  };

  const setMacroDangerZone = () => {
    setSensors(prev => ({
      ...prev,
      speed: 85,
      steeringAngle: 0,
      gear: "D",
      throttle: 0,
      brake: 45,
      batterySoc: 65,
      batteryTemp: 44,
      cabinTemp: 22
    }));
    setAdas(prev => ({
      ...prev,
      lkaStatus: "MONITORING",
      accStatus: "LOCK",
      accSetSpeed: 100,
      aebActive: false,
      aebPreWarning: true,
      bsmLeftAlert: true,
      bsmRightAlert: true
    }));
    setTargetDistance(18.5); // close obstacle!
  };

  return (
    <header className="bg-[#0c0c0e] border-b border-[#1c1c1f] p-4 shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
      
      {/* Brand & Subtraction */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/50 flex items-center justify-center font-black tracking-widest text-[#ffffff] shadow-md">
          <Zap size={22} className="text-blue-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-zinc-100 tracking-tight uppercase font-sans">
              AAOS Sensor Simulator <span className="text-xs font-normal text-zinc-500 ml-2">v2.4.0</span>
            </h1>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-bold tracking-wide uppercase font-mono animate-pulse">
              HIL ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-normal">
            Android Automotive VHAL Simulation environment for testing Diagnostics & Active ADAS
          </p>
        </div>
      </div>

      {/* Quick Macro Scenarios HUD */}
      <div className="flex flex-wrap items-center bg-[#111114] p-2 border border-[#1c1c1f] rounded-lg gap-2 text-xs">
        <span className="text-[9px] text-zinc-500 px-1 font-bold tracking-wider uppercase">PRESET MACROS:</span>
        
        <button
          id="macro-parked-btn"
          onClick={setMacroParkedIdle}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#09090b] border border-[#1c1c1f] hover:border-zinc-700 text-zinc-300 hover:text-white transition duration-150 cursor-pointer"
          title="Macro: Static parking condition"
        >
          <Clock size={11} className="text-zinc-500" />
          <span>Parked Idle</span>
        </button>

        <button
          id="macro-cruise-btn"
          onClick={setMacroCruising}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#09090b] border border-[#1c1c1f] hover:border-zinc-700 text-zinc-300 hover:text-white transition duration-150 cursor-pointer"
          title="Macro: Highway cruised flow"
        >
          <Sliders size={11} className="text-blue-400" />
          <span>Highway Cruise</span>
        </button>

        <button
          id="macro-hazard-btn"
          onClick={setMacroDangerZone}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-rose-900/20 border border-rose-500/40 hover:border-rose-500 text-rose-400 transition duration-150 cursor-pointer"
          title="Macro: Immediate obstacle hazard trigger"
        >
          <ShieldX size={11} className="text-rose-450 animate-pulse" />
          <span>Proximity Warning</span>
        </button>
      </div>

      {/* Diagnostic mini indicator panel */}
      <div className="hidden lg:flex items-center space-x-4 border-l border-[#1c1c1f] pl-4 h-9 text-xs">
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">VHAL BUS STATUS</span>
          {activeDtcCount === 0 ? (
            <span className="text-emerald-400 font-bold font-mono flex items-center justify-end uppercase mt-0.5 text-[11px]">
              <CheckCircle size={11} className="mr-1 inline" /> Nominal
            </span>
          ) : (
            <span className="text-rose-400 font-bold font-mono flex items-center justify-end animate-pulse uppercase mt-0.5 text-[11px]">
              <ShieldX size={11} className="mr-1 inline" /> {activeDtcCount} Faults
            </span>
          )}
        </div>
      </div>

    </header>
  );
}
