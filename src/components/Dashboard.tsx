/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VehicleSensors, ADASState, DiagnosticsState, VehiclePropertyId } from "../types";
import { DIAGNOSTIC_CODE_LIB } from "../data";
import { 
  ShieldAlert, Zap, Compass, Thermometer, BatteryCharging, 
  Orbit, AlertTriangle, RefreshCw, Radio 
} from "lucide-react";

interface DashboardProps {
  sensors: VehicleSensors;
  setSensors: (updater: (prev: VehicleSensors) => VehicleSensors) => void;
  adas: ADASState;
  setAdas: (updater: (prev: ADASState) => ADASState) => void;
  diagnostics: DiagnosticsState;
  triggerFault: (code: string) => void;
  clearFault: (code: string) => void;
  resetAllSensors: () => void;
}

export function Dashboard({
  sensors,
  setSensors,
  adas,
  setAdas,
  diagnostics,
  triggerFault,
  clearFault,
  resetAllSensors
}: DashboardProps) {

  // Check if a diagnostic trouble code is currently injected
  const isDtcActive = (code: string) => diagnostics.activeDtc.includes(code);

  const toggleFault = (code: string) => {
    if (isDtcActive(code)) {
      clearFault(code);
    } else {
      triggerFault(code);
    }
  };

  // Helper colors for Severity level of faults
  const getSeverityBadgeColor = (severity: "LOW" | "MEDIUM" | "HIGH") => {
    switch (severity) {
      case "LOW": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "MEDIUM": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "HIGH": return "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse";
    }
  };

  // Dynamic ADAS status rings and colors
  const getLkaStatusColor = () => {
    switch (adas.lkaStatus) {
      case "IDLE": return "text-zinc-500 bg-[#0c0c0e] border-[#1c1c1f]";
      case "MONITORING": return "text-emerald-400 bg-emerald-500/5 border-emerald-500/25";
      case "WARNING": return "text-amber-400 bg-amber-500/10 border-amber-500/35 animate-pulse";
      case "INTERVENING": return "text-blue-400 bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/25 animate-pulse";
    }
  };

  const getAccStatusColor = () => {
    switch (adas.accStatus) {
      case "OFF": return "text-zinc-500 bg-[#0c0c0e] border-[#1c1c1f]";
      case "STANDBY": return "text-amber-500 bg-amber-500/5 border-amber-500/20";
      case "ACTIVE": return "text-emerald-400 bg-emerald-500/5 border-emerald-500/25";
      case "LOCK": return "text-blue-400 bg-blue-500/10 border-blue-500/40 animate-pulse";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none animate-fade-in">
      
      {/* COLUMN 1: GAUGES & SPEEDOMETER HUB */}
      <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-5 shadow-md flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2.5">
          <div className="flex items-center space-x-2">
            <Orbit size={15} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Cockpit Telemetry</h3>
          </div>
          <button 
            id="reset-gauges-btn"
            onClick={resetAllSensors}
            className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-bold border border-[#1c1c1f] hover:border-zinc-700 bg-[#0c0c0e] text-zinc-400 rounded transition cursor-pointer"
          >
            <RefreshCw size={10} />
            <span>Reset Sensors</span>
          </button>
        </div>

        {/* Big Speed Dial Display */}
        <div className="flex flex-col items-center justify-center py-4 relative">
          {/* Circular speed arc */}
          <div className="w-36 h-36 rounded-full border-4 border-[#1c1c1f] border-t-blue-500 border-r-blue-500 flex flex-col items-center justify-center shadow-lg relative bg-[#0c0c0e]">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">km/h</span>
            <span className="text-4xl font-mono font-black text-white italic transition-all leading-none">
              {sensors.speed.toFixed(0)}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 mt-2">
              Gear Selection: <span className="text-blue-400 font-bold">{sensors.gear}</span>
            </span>
            
            {/* Speed indicator bar background */}
            <div className="absolute inset-0.5 rounded-full border border-dashed border-zinc-800 opacity-20"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full mt-5 text-center text-xs">
            <div className="bg-[#0c0c0e] p-2 rounded-md border border-[#1c1c1f]">
              <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">EST. ENGINE RPM</span>
              <span className="font-mono text-emerald-400 font-bold">{(sensors.speed * 62 + 750).toFixed(0)}</span>
            </div>
            <div className="bg-[#0c0c0e] p-2 rounded-md border border-[#1c1c1f]">
              <span className="text-[10px] text-zinc-500 block mb-0.5 uppercase tracking-wider">ODOMETER TOTAL</span>
              <span className="font-mono text-zinc-350 font-bold">{sensors.odometer.toFixed(1)} km</span>
            </div>
          </div>
        </div>

        {/* Quick Throttles and Brake Overrides */}
        <div className="space-y-4 pt-2">
          {/* Gear Shifter Box */}
          <div className="flex justify-between items-center bg-[#0c0c0e] p-2.5 rounded-md border border-[#1c1c1f] text-xs">
            <span className="text-zinc-400 font-medium">Virtual Transmission Shifter</span>
            <div className="flex items-center space-x-1.5 font-bold">
              {(["P", "R", "N", "D"] as const).map((g) => (
                <button
                  id={`gear-shifter-${g}`}
                  key={g}
                  onClick={() => setSensors(prev => ({ ...prev, gear: g }))}
                  className={`w-7 h-7 flex items-center justify-center rounded border transition duration-150 cursor-pointer ${
                    sensors.gear === g 
                      ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow font-black" 
                      : "bg-[#111114] border-[#1c1c1f] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Throttle slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Accelerator input (Throttle Override)</span>
              <span className="font-mono text-emerald-400 font-bold">{sensors.throttle}%</span>
            </div>
            <input 
              id="dashboard-throttle-slider"
              type="range"
              min="0"
              max="100"
              value={sensors.throttle}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors(prev => {
                  let nextSpeed = prev.speed;
                  if (prev.gear === "D") {
                    nextSpeed = val * 1.6; // Scale simple speed
                  } else if (prev.gear === "R") {
                    nextSpeed = val * 0.35; // slower backup cap
                  } else if (prev.gear === "N" || prev.gear === "P") {
                    nextSpeed = 0;
                  }
                  return {
                    ...prev,
                    throttle: val,
                    speed: nextSpeed
                  };
                });
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Brake slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Electronic Brake Pressure Override</span>
              <span className="font-mono text-rose-400 font-bold">{sensors.brake}%</span>
            </div>
            <input 
              id="dashboard-brake-slider"
              type="range"
              min="0"
              max="100"
              value={sensors.brake}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors(prev => {
                  let speedFactor = (100 - val) / 100;
                  return {
                    ...prev,
                    brake: val,
                    speed: prev.speed * speedFactor,
                    throttle: val > 20 ? 0 : prev.throttle // reset throttle under hard brake
                  };
                });
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* COLUMN 2: VHAL OVERRIDES & OTHER SENSORS */}
      <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-5 shadow-md flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2.5">
          <div className="flex items-center space-x-2">
            <Compass size={15} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest">Thermal & Kinematic Core</h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">NODE_COUNT: 11</span>
        </div>

        {/* Sliders for steering, charging, batteries */}
        <div className="space-y-5 flex-1">
          {/* Steering Wheel slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Steering Wheel Angle VHAL</span>
              <span className="font-mono text-blue-400 font-bold">{sensors.steeringAngle.toFixed(0)}°</span>
            </div>
            <input 
              id="dashboard-steering-range-slider"
              type="range"
              min="-450"
              max="450"
              value={sensors.steeringAngle}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSensors(prev => ({ ...prev, steeringAngle: val }));
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-650">
              <span>Full Counter (Left)</span>
              <span>Center</span>
              <span>Full Counter (Right)</span>
            </div>
          </div>

          {/* Battery State of Charge tracker */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <BatteryCharging size={13} className="text-amber-400 animate-pulse" />
                <span>EV Battery State of Charge (SoC)</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{sensors.batterySoc}%</span>
            </div>
            <div className="w-full bg-[#0c0c0e] rounded-full h-2.5 overflow-hidden border border-[#1c1c1f]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${sensors.batterySoc}%` }}
              ></div>
            </div>
            <input 
              id="dashboard-soc-range-slider"
              type="range"
              min="0"
              max="100"
              value={sensors.batterySoc}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors(prev => ({ ...prev, batterySoc: val }));
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            
            {/* Battery temperature */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-450">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Thermometer size={12} className="text-rose-400" />
                  <span>Battery Temp</span>
                </span>
                <span className="font-mono text-zinc-150 font-bold">{sensors.batteryTemp}°C</span>
              </div>
              <input 
                id="dashboard-battery-temp-slider"
                type="range"
                min="0"
                max="100"
                value={sensors.batteryTemp}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSensors(prev => ({ ...prev, batteryTemp: val }));
                }}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Cabin Temp */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-450">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Thermometer size={12} className="text-blue-400" />
                  <span>Cabin Climate</span>
                </span>
                <span className="font-mono text-zinc-150 font-bold">{sensors.cabinTemp}°C</span>
              </div>
              <input 
                id="dashboard-cabin-temp-slider"
                type="range"
                min="14"
                max="32"
                value={sensors.cabinTemp}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSensors(prev => ({ ...prev, cabinTemp: val }));
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

          </div>

          {/* Wheel Pressure grid display */}
          <div className="bg-[#0c0c0e] p-2.5 px-3 rounded-md border border-[#1c1c1f] text-xs text-zinc-400 flex flex-col space-y-1.5">
            <span className="font-semibold text-zinc-350">Wheel Tire Pressure Monitoring (VHAL TPMS)</span>
            <div className="grid grid-cols-2 gap-2 text-center text-[10.5px]">
              <div className="bg-[#111114] p-1 rounded font-mono border border-[#1c1c1f]">
                FL: <span className="text-emerald-400 font-bold">34.2 psi</span>
              </div>
              <div className="bg-[#111114] p-1 rounded font-mono border border-[#1c1c1f]">
                FR: <span className="text-emerald-400 font-bold">34.5 psi</span>
              </div>
              <div className="bg-[#111114] p-1 rounded font-mono border border-[#1c1c1f]">
                RL: <span className="text-emerald-400 font-bold">33.9 psi</span>
              </div>
              <div className="bg-[#111114] p-1 rounded font-mono border border-[#1c1c1f]">
                RR: <span className="text-emerald-400 font-bold">34.1 psi</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* COLUMN 3: ADAS STATUS & DTC DIAGNOSTIC INJECTOR */}
      <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-5 shadow-md flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2.5">
          <div className="flex items-center space-x-2">
            <Zap size={15} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest">ADAS Calibration & OBD-II</h3>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {/* MIL Check Engine indicator */}
            <span className={`w-3.5 h-3.5 rounded-full border border-[#1c1c1f] flex items-center justify-center ${
              diagnostics.milActive ? "bg-amber-500 text-[#0c0c0e] font-bold animate-pulse text-[8px]" : "bg-[#0c0c0e] text-zinc-650 text-[8px]"
            }`} title="Check Engine MIL Light">
              {diagnostics.milActive ? "!" : "o"}
            </span>
            <span className="text-[10px] text-zinc-450 font-mono">MIL: {diagnostics.milActive ? "ACTIVE" : "OFF"}</span>
          </div>
        </div>

        {/* 1. ADAS states toggles */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">ADAS Target States</span>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Lane Keep Assist status */}
            <div className={`p-2.5 rounded-md border flex flex-col space-y-1 ${getLkaStatusColor()}`}>
              <span className="text-[9px] text-slate-500 font-bold">LKA STATUS</span>
              <span className="font-bold">{adas.lkaStatus}</span>
              <button 
                id="toggle-lka-status-btn"
                onClick={() => setAdas(prev => ({ 
                  ...prev, 
                  lkaStatus: prev.lkaStatus === "MONITORING" ? "WARNING" : prev.lkaStatus === "WARNING" ? "INTERVENING" : "MONITORING" 
                }))}
                className="text-[9px] text-left underline font-semibold mt-1 opacity-70 hover:opacity-100 outline-none"
              >
                Force State Sweep
              </button>
            </div>

            {/* Cruise Control status */}
            <div className={`p-2.5 rounded-md border flex flex-col space-y-1 ${getAccStatusColor()}`}>
              <span className="text-[9px] text-slate-500 font-bold">ACC ACTIVE</span>
              <span className="font-bold">{adas.accStatus}</span>
              <button 
                id="toggle-acc-status-btn"
                onClick={() => setAdas(prev => ({ 
                  ...prev, 
                  accStatus: prev.accStatus === "LOCK" ? "ACTIVE" : "LOCK" 
                }))}
                className="text-[9px] text-left underline font-semibold mt-1 opacity-70 hover:opacity-100 outline-none"
              >
                Cycle Radar Lock
              </button>
            </div>
          </div>

          {/* Blind Spot togglers */}
          <div className="flex justify-between items-center bg-[#0c0c0e] p-2 px-3 rounded border border-[#1c1c1f] text-xs">
            <span className="text-zinc-400 font-medium">Braking Pre-Alert Warnings</span>
            <div className="flex items-center space-x-2 font-bold">
              <button 
                id="toggle-bsm-left-chg-btn"
                onClick={() => setAdas(prev => ({ ...prev, bsmLeftAlert: !prev.bsmLeftAlert }))}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${adas.bsmLeftAlert ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-[#111114] text-zinc-500 border-[#1c1c1f]"}`}
              >
                BSM-Left
              </button>
              <button 
                id="toggle-bsm-right-chg-btn"
                onClick={() => setAdas(prev => ({ ...prev, bsmRightAlert: !prev.bsmRightAlert }))}
                className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${adas.bsmRightAlert ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-[#111114] text-zinc-500 border-[#1c1c1f]"}`}
              >
                BSM-Right
              </button>
            </div>
          </div>
        </div>

        {/* 2. Diagnostic Trouble Codes Grid */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">OBD-II DTC Injector Panel</span>
            <span className="text-[9px] font-mono text-rose-400 bg-rose-500/10 px-1 rounded font-bold border border-rose-500/10">
              {diagnostics.activeDtc.length} Injected Faults
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs h-[115px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {DIAGNOSTIC_CODE_LIB.map((diag) => {
              const active = isDtcActive(diag.code);
              return (
                <button
                  id={`dtc-injector-${diag.code}`}
                  key={diag.code}
                  onClick={() => toggleFault(diag.code)}
                  className={`p-2.5 rounded-md border text-left flex flex-col justify-between transition group duration-150 cursor-pointer ${
                    active 
                      ? "bg-rose-500/15 border-rose-500/50 text-rose-300" 
                      : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-400 hover:border-zinc-750 hover:text-white"
                  }`}
                  title={diag.description}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-mono font-black italic tracking-wide">{diag.code}</span>
                    <span className={`text-[8px] px-1 rounded font-bold uppercase ${
                      active ? "bg-rose-500 text-white" : "bg-[#111114] text-zinc-500"
                    }`}>
                      {diag.severity}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-zinc-500 mt-1 truncate w-full group-hover:text-zinc-200">
                    {diag.system} System
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Diagnostic log summaries */}
        <div className="bg-[#0c0c0e] p-2.5 rounded border border-[#1c1c1f] text-[10px] font-mono text-zinc-400 flex flex-col space-y-1">
          <span className="font-sans font-semibold text-zinc-400">Diag System State</span>
          {diagnostics.activeDtc.length === 0 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Radio size={8} className="animate-pulse" />
              <span>OBD registers stable. No diagnostic codes reported.</span>
            </span>
          ) : (
            <span className="text-rose-400 font-bold flex items-start gap-1 leading-normal">
              <AlertTriangle size={10} className="shrink-0 mt-0.5 text-rose-500 animate-bounce" />
              <span>DTC Injected: [{diagnostics.activeDtc.join(", ")}]. Check engine light active. vhal triggers tracking faults.</span>
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
