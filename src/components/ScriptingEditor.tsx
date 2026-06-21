/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ScriptScenario, ScriptCommand, VehicleSensors } from "../types";
import { PRESET_SCENARIOS } from "../data";
import { 
  Play, Pause, RotateCcw, ArrowRight, Plus, Trash, 
  Settings, Zap, ShieldAlert, Cpu, Timer, MessageSquare 
} from "lucide-react";

interface ScriptingEditorProps {
  activeScenario: ScriptScenario | null;
  isRunning: boolean;
  isPaused: boolean;
  currentCommandIndex: number;
  loopEnabled: boolean;
  setLoopEnabled: (val: boolean) => void;
  loadScenario: (scenario: ScriptScenario) => void;
  startScript: () => void;
  pauseScript: () => void;
  stopScript: () => void;
  stepScript: () => void;
  executionLogs: string[];
  clearExecutionLogs: () => void;
  onCustomScenarioCreated: (scenario: ScriptScenario) => void;
}

export function ScriptingEditor({
  activeScenario,
  isRunning,
  isPaused,
  currentCommandIndex,
  loopEnabled,
  setLoopEnabled,
  loadScenario,
  startScript,
  pauseScript,
  stopScript,
  stepScript,
  executionLogs,
  clearExecutionLogs,
  onCustomScenarioCreated
}: ScriptingEditorProps) {
  
  // Custom script builder state
  const [customName, setCustomName] = useState("Custom Sensor Cycle");
  const [customDesc, setCustomDesc] = useState("A developer-defined VHAL sensor sweep testing custom thresholds.");
  const [customCommands, setCustomCommands] = useState<ScriptCommand[]>([]);
  
  // New step creation state
  const [actionType, setActionType] = useState<ScriptCommand["action"]>("SET_SENSOR");
  const [paramSensor, setParamSensor] = useState<string>("speed");
  const [paramValue, setParamValue] = useState<string>("80");
  const [paramDuration, setParamDuration] = useState<number>(1000);
  const [paramCode, setParamCode] = useState<string>("P0101");
  const [paramMessage, setParamMessage] = useState<string>("Injected Fault Vector");

  const addCustomStep = () => {
    let parsedValue: any = paramValue;
    // Attempt parsing numbers or string values
    if (paramSensor === "gear") {
      parsedValue = paramValue.toUpperCase();
    } else if (paramSensor === "accStatus" || paramSensor === "lkaStatus") {
      parsedValue = paramValue.toUpperCase();
    } else if (!isNaN(Number(paramValue))) {
      parsedValue = Number(paramValue);
    }

    const newCommand: ScriptCommand = {
      id: `custom_${Date.now()}_${customCommands.length}`,
      action: actionType,
      params: {
        sensor: (actionType === "SET_SENSOR" || actionType === "SET_ADAS") ? (paramSensor as any) : undefined,
        value: (actionType === "SET_SENSOR" || actionType === "SET_ADAS") ? parsedValue : undefined,
        duration: actionType === "WAIT" ? paramDuration : undefined,
        code: (actionType === "TRIGGER_FAULT" || actionType === "CLEAR_FAULT") ? paramCode : undefined,
        message: actionType === "ALERT_MSG" ? paramMessage : undefined,
      }
    };

    setCustomCommands([...customCommands, newCommand]);
  };

  const deleteCustomStep = (idx: number) => {
    const updated = [...customCommands];
    updated.splice(idx, 1);
    setCustomCommands(updated);
  };

  const compileAndLoadCustom = () => {
    if (customCommands.length === 0) return;
    const compiled: ScriptScenario = {
      id: `custom_${Date.now()}`,
      name: customName || "Custom Test Sweep",
      description: customDesc || "User defined dynamic sensory sweep sequence.",
      difficulty: "Intermediate",
      commands: [...customCommands]
    };
    onCustomScenarioCreated(compiled);
    loadScenario(compiled);
  };

  const getCommandIcon = (action: ScriptCommand["action"]) => {
    switch (action) {
      case "SET_SENSOR": return <Cpu size={14} className="text-emerald-400" />;
      case "SET_ADAS": return <Zap size={14} className="text-sky-400" />;
      case "TRIGGER_FAULT": return <ShieldAlert size={14} className="text-rose-400 animate-pulse" />;
      case "CLEAR_FAULT": return <ShieldAlert size={14} className="text-teal-400" />;
      case "WAIT": return <Timer size={14} className="text-amber-400" />;
      case "ALERT_MSG": return <MessageSquare size={14} className="text-fuchsia-400" />;
      default: return <Settings size={14} className="text-slate-400" />;
    }
  };

  const getCommandSummary = (cmd: ScriptCommand) => {
    const p = cmd.params;
    switch (cmd.action) {
      case "SET_SENSOR":
        return `Set Sensor ${String(p.sensor).toUpperCase()} to ${p.value}`;
      case "SET_ADAS":
        return `Configure ADAS [${String(p.sensor).toUpperCase()}] ➔ ${p.value}`;
      case "TRIGGER_FAULT":
        return `Inject DTC Error Code [${p.code}] into OBD-II register`;
      case "CLEAR_FAULT":
        return `Clear DTC Error Code [${p.code}]`;
      case "WAIT":
        return `Hold and stream data for ${p.duration} ms`;
      case "ALERT_MSG":
        return `Echo Script Alert: "${p.message}"`;
      default:
        return "Unknown simulation operation";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full select-none">
      
      {/* Col 1: Preset Scenarios Loader & Custom Builder */}
      <div className="lg:col-span-1 flex flex-col space-y-6">
        
        {/* Preset Library Panel */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col h-[320px]">
          <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded font-bold">LIBRARY</span>
            <h3 className="text-sm font-semibold text-zinc-100">Functional Test Scenarios</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {PRESET_SCENARIOS.map((scen) => {
              const diffColors = 
                scen.difficulty === "Beginner" 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                  : scen.difficulty === "Intermediate" 
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20" 
                    : "bg-rose-500/15 text-rose-400 border-rose-500/20";
              const isActive = activeScenario?.id === scen.id;

              return (
                <div 
                  key={scen.id}
                  onClick={() => loadScenario(scen)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex flex-col space-y-2 ${
                    isActive 
                      ? "bg-blue-600/15 border-blue-500/50" 
                      : "bg-[#0c0c0e] border-[#1c1c1f] hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-zinc-200">{scen.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${diffColors}`}>
                      {scen.difficulty}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-450 leading-normal">{scen.description}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="text-zinc-500">{scen.commands.length} Commands</span>
                    {isActive && <span className="text-blue-400 font-bold flex items-center">Active <ArrowRight size={10} className="ml-1" /></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Script Sequence Builder Form */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex-1">
          <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded font-bold">COMPILER</span>
            <h3 className="text-sm font-semibold text-zinc-100">Step Sequencer Creator</h3>
          </div>

          <div className="space-y-3 text-xs select-text">
            {/* Metadata inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Scenario Name</label>
                <input 
                  id="custom-scenario-name-input"
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Cycle Telemetry"
                  className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1">Brief Description</label>
                <input 
                  id="custom-scenario-desc-input"
                  type="text" 
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="VHAL telemetry sweeps"
                  className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                />
              </div>
            </div>

            {/* Current Draft Steps count & Actions Selector */}
            <div className="bg-[#0c0c0e] p-2.5 rounded border border-[#1c1c1f] space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                <span className="font-bold text-[10px] text-zinc-400">Add Command Step</span>
                <span className="text-[9px] text-blue-400 font-mono font-bold">{customCommands.length} draft steps</span>
              </div>

              {/* Action type */}
              <div>
                <label className="text-[9px] text-zinc-500 block mb-1 font-bold">ACTION OPERATION</label>
                <select 
                  id="builder-action-select"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="SET_SENSOR">SET_SENSOR (Change speed, throttle, gear...)</option>
                  <option value="SET_ADAS">SET_ADAS (Edit cruise status, gap settings, steering LKA...)</option>
                  <option value="TRIGGER_FAULT">TRIGGER_FAULT (Inject active OBD-II DTC)</option>
                  <option value="CLEAR_FAULT">CLEAR_FAULT (Erase OBD-II Trouble Code)</option>
                  <option value="WAIT">WAIT (Bypass and sleep execution)</option>
                  <option value="ALERT_MSG">ALERT_MSG (Display warning popup in simulation feed)</option>
                </select>
              </div>

              {/* Action specific sub-inputs */}
              {actionType === "SET_SENSOR" && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                  <div>
                    <label className="text-[9px] text-zinc-500 block">Sensor Selection</label>
                    <select
                      id="builder-sensor-select"
                      value={paramSensor}
                      onChange={(e) => setParamSensor(e.target.value)}
                      className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-1.5 py-1 text-zinc-350 outline-none cursor-pointer"
                    >
                      <option value="speed">speed (km/h)</option>
                      <option value="gear">gear (P, R, N, D)</option>
                      <option value="throttle">throttle (%)</option>
                      <option value="brake">brake (%)</option>
                      <option value="batterySoc">batterySoc (%)</option>
                      <option value="batteryTemp">batteryTemp (°C)</option>
                      <option value="steeringAngle">steeringAngle (deg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 block">Override Value</label>
                    <input 
                      id="builder-sensor-val-input"
                      type="text" 
                      value={paramValue} 
                      onChange={(e) => setParamValue(e.target.value)}
                      placeholder="e.g. 110 or P"
                      className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-200 outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              )}

              {actionType === "SET_ADAS" && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                  <div>
                    <label className="text-[9px] text-zinc-500 block">ADAS Parameter</label>
                    <select
                      id="builder-adas-select"
                      value={paramSensor}
                      onChange={(e) => setParamSensor(e.target.value)}
                      className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-1.5 py-1 text-zinc-350 outline-none cursor-pointer"
                    >
                      <option value="accStatus">accStatus (OFF, STANDBY, ACTIVE, LOCK)</option>
                      <option value="accSetSpeed">accSetSpeed (km/h)</option>
                      <option value="lkaStatus">lkaStatus (IDLE, MONITORING, WARNING, INTERVENING)</option>
                      <option value="aebStatus">aebStatus (idle, warning, active)</option>
                      <option value="targetDistance">targetDistance (meters)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-zinc-500 block">ADAS State Value</label>
                    <input 
                      id="builder-adas-val-input"
                      type="text" 
                      value={paramValue} 
                      onChange={(e) => setParamValue(e.target.value)}
                      placeholder="e.g. ACTIVE or 35"
                      className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-200 outline-none focus:border-zinc-700"
                    />
                  </div>
                </div>
              )}

              {actionType === "TRIGGER_FAULT" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-zinc-500 block">Select Fault DTC</label>
                    <select
                      id="builder-fault-select"
                      value={paramCode}
                      onChange={(e) => setParamCode(e.target.value)}
                      className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-1.5 py-1 text-zinc-350 outline-none cursor-pointer"
                    >
                      <option value="P0A7F">P0A7F (Heat Runaway Pack)</option>
                      <option value="U0121">U0121 (Lost ABS Comm)</option>
                      <option value="P0101">P0101 (MAF Circuit Fault)</option>
                      <option value="U0100">U0100 (Lost ECM Comm)</option>
                      <option value="C1001">C1001 (Camera Lens Blocked)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <span className="text-[10px] text-rose-450 font-bold leading-none mb-1">Check Engine Lit</span>
                  </div>
                </div>
              )}

              {actionType === "CLEAR_FAULT" && (
                <div>
                  <label className="text-[9px] text-zinc-500 block">Fault Code DTC to clear</label>
                  <input 
                    id="builder-clear-fault-input"
                    type="text" 
                    value={paramCode} 
                    onChange={(e) => setParamCode(e.target.value)}
                    placeholder="P0101"
                    className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              )}

              {actionType === "WAIT" && (
                <div>
                  <label className="text-[9px] text-zinc-500 block">Sleep Delay (milliseconds)</label>
                  <input 
                    id="builder-wait-input"
                    type="number" 
                    step="100"
                    min="100"
                    value={paramDuration} 
                    onChange={(e) => setParamDuration(parseInt(e.target.value) || 1000)}
                    className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              )}

              {actionType === "ALERT_MSG" && (
                <div>
                  <label className="text-[9px] text-zinc-500 block">Message Text Accent</label>
                  <input 
                    id="builder-alert-input"
                    type="text" 
                    value={paramMessage} 
                    onChange={(e) => setParamMessage(e.target.value)}
                    placeholder="Simulating highway merger..."
                    className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2 py-1 text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              )}

              {/* Inject Command button */}
              <button 
                id="add-custom-step-btn"
                onClick={addCustomStep}
                className="w-full mt-2 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded font-bold text-xs bg-[#111114] hover:bg-zinc-800 text-blue-400 border border-blue-500/25 transition cursor-pointer"
              >
                <Plus size={12} />
                <span>Append Draft Step</span>
              </button>
            </div>

            {/* Custom Draft Steps array visualization */}
            {customCommands.length > 0 && (
              <div className="max-h-[140px] overflow-y-auto space-y-1.5 border-t border-b border-slate-850 py-2">
                {customCommands.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between p-1.5 bg-slate-950/40 rounded border border-slate-900 text-[10px]">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-slate-600 text-[9px]">#{idx+1}</span>
                      {getCommandIcon(item.action)}
                      <span className="text-slate-300 truncate font-mono">{getCommandSummary(item)}</span>
                    </div>
                    <button 
                      id={`delete-custom-step-${idx}`}
                      onClick={() => deleteCustomStep(idx)} 
                      className="text-rose-400 hover:text-rose-300 px-1 hover:bg-rose-500/10 rounded transition shrink-0"
                    >
                      <Trash size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Compile and Load btn */}
            <button
              id="compile-load-script-btn"
              onClick={compileAndLoadCustom}
              disabled={customCommands.length === 0}
              className="w-full py-2 px-4 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-slate-150 transition disabled:opacity-40 disabled:cursor-not-allowed text-center select-none"
            >
              Compile & Inject Custom Scenario
            </button>
          </div>
        </div>

      </div>

      {/* Col 2 & 3 Combined: Active Script Execution Flow Monitor & Run Console */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        
        {/* Playback Control Hub */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-md flex flex-col">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Automated Pipeline Workbench</h3>
              <p className="text-xs text-slate-400 leading-normal mt-0.5">
                Loaded: <span className="font-bold text-sky-400 font-mono">{activeScenario ? activeScenario.name : "None (Select from Library)"}</span>
              </p>
            </div>
            
            {/* Playback Buttons Group */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
              
              {/* Play / Pause Toggle */}
              {isRunning && !isPaused ? (
                <button
                  id="script-pause-btn"
                  onClick={pauseScript}
                  className="p-1.5 px-3 flex items-center space-x-1 font-semibold text-xs rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/20 transition duration-150"
                  title="Pause Scenario Execution"
                >
                  <Pause size={12} className="fill-amber-400" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  id="script-play-btn"
                  onClick={startScript}
                  disabled={!activeScenario}
                  className="p-1.5 px-3 flex items-center space-x-1 font-semibold text-xs rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition duration-150 disabled:opacity-40"
                  title="Start Scenario Timeline"
                >
                  <Play size={12} className="fill-emerald-400" />
                  <span>{isPaused ? "Resume" : "Run Script"}</span>
                </button>
              )}

              {/* Single Step */}
              <button
                id="script-step-btn"
                onClick={stepScript}
                disabled={!activeScenario || (isRunning && !isPaused)}
                className="p-1.5 px-2.5 flex items-center space-x-1 font-semibold text-xs rounded-md bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 transition duration-150 disabled:opacity-40"
                title="Execute Current Step only"
              >
                <ArrowRight size={12} />
                <span>Step</span>
              </button>

              {/* Reset/Stop */}
              <button
                id="script-stop-btn"
                onClick={stopScript}
                disabled={!activeScenario}
                className="p-1.5 px-2.5 flex items-center space-x-1 font-semibold text-xs text-rose-400 hover:bg-rose-500/10 rounded-md bg-slate-900 border border-red-950/40 transition duration-150 disabled:opacity-40"
                title="Stop Scenario & Reset VHAL Overrides"
              >
                <RotateCcw size={12} />
                <span>Stop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            
            {/* Steps Timeline Track List (3 cols on md) */}
            <div className="md:col-span-3 border border-[#1c1c1f] rounded-lg p-3 bg-[#0c0c0e] flex flex-col h-[280px]">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
                <span>TIMELINE STEP INDEX</span>
                <label className="flex items-center space-x-1 select-none cursor-pointer">
                  <input 
                    id="loop-script-chk"
                    type="checkbox" 
                    checked={loopEnabled}
                    onChange={(e) => setLoopEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#1c1c1f] text-blue-500 bg-[#111114] cursor-pointer outline-none accent-blue-550"
                  />
                  <span>Auto Loop</span>
                </label>
              </div>

              {activeScenario ? (
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                  {activeScenario.commands.map((cmd, index) => {
                    const isPassed = index < currentCommandIndex;
                    const isCurrent = index === currentCommandIndex && isRunning;
                    const isPending = index > currentCommandIndex || !isRunning;

                    let bgStyle = "bg-[#0c0c0e] text-zinc-550 border-[#1c1c1f]/50";
                    if (isPassed) {
                      bgStyle = "bg-emerald-500/5 text-emerald-500/70 border-emerald-500/15";
                    } else if (isCurrent) {
                      bgStyle = isPaused 
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/40 font-semibold ring-1 ring-amber-500/20" 
                        : "bg-blue-500/10 text-blue-300 border-blue-500/50 font-semibold ring-1 ring-blue-500/30";
                    }

                    return (
                      <div
                        key={cmd.id}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between transition gap-2 ${bgStyle}`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          {/* Step Index Circle */}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            isCurrent 
                              ? isPaused ? "bg-amber-400 text-slate-950" : "bg-blue-500 text-white" 
                              : isPassed 
                                ? "bg-emerald-500/25 text-emerald-400" 
                                : "bg-[#111114] border border-[#1c1c1f] text-zinc-500"
                          }`}>
                            {index + 1}
                          </div>

                          {/* Action Type Icon */}
                          <div className="shrink-0">{getCommandIcon(cmd.action)}</div>
                          
                          {/* Descriptive text */}
                          <span className={`font-mono text-[10.5px] truncate ${
                            isCurrent ? "text-zinc-100" : isPassed ? "text-zinc-400" : "text-zinc-500"
                          }`}>
                            {getCommandSummary(cmd)}
                          </span>
                        </div>

                        {/* Status tag */}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono shrink-0">
                          {isCurrent 
                            ? isPaused ? "PAUSED" : "ACTIVE" 
                            : isPassed 
                              ? "PASS" 
                              : "READY"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-550 text-xs">
                  <p>No automated script has been loaded into memory.</p>
                  <p className="text-[10px] text-zinc-600 mt-1 font-medium">Pick an ADAS test flight from the presets, or compile a custom sequencing pass below.</p>
                </div>
              )}
            </div>

            {/* Run Logs Console Output (1 col on md) */}
            <div className="md:col-span-1 border border-[#1c1c1f] rounded-lg p-3 bg-[#0c0c0e] flex flex-col h-[280px]">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
                <span>VHAL TERMINAL LOGS</span>
                <button
                  id="clear-terminal-logs-btn"
                  onClick={clearExecutionLogs}
                  className="text-rose-400/80 hover:text-rose-300 text-[10px] font-semibold cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 font-mono text-[10px] text-zinc-400 leading-normal select-text">
                {executionLogs.length === 0 ? (
                  <span className="text-zinc-650 block italic">Sim execution channel idle...</span>
                ) : (
                  executionLogs.map((logStr, idx) => (
                    <div key={idx} className="border-b border-zinc-950 pb-1 text-zinc-350">
                      {logStr}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
