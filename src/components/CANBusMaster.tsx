/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CustomCANMessage, CANBusErrorLog } from "../types";
import { 
  Zap, AlertOctagon, RefreshCw, Plus, Trash2, Send, 
  Wifi, WifiOff, FileText, X, Check, Activity, ShieldAlert
} from "lucide-react";

interface CANBusMasterProps {
  customCanMessages: CustomCANMessage[];
  setCustomCanMessages: React.Dispatch<React.SetStateAction<CustomCANMessage[]>>;
  canBusError: "NONE" | "BUS_OFF" | "CRC_ERROR" | "STUFFING_ERROR" | "ACK_ERROR" | "ARBITRATION_LOSS";
  setCanBusError: (val: "NONE" | "BUS_OFF" | "CRC_ERROR" | "STUFFING_ERROR" | "ACK_ERROR" | "ARBITRATION_LOSS") => void;
  canErrorLogs: CANBusErrorLog[];
  setCanErrorLogs: React.Dispatch<React.SetStateAction<CANBusErrorLog[]>>;
  sendIndividualCANMessage: (msg: CustomCANMessage) => void;
}

export function CANBusMaster({
  customCanMessages,
  setCustomCanMessages,
  canBusError,
  setCanBusError,
  canErrorLogs,
  setCanErrorLogs,
  sendIndividualCANMessage
}: CANBusMasterProps) {
  // Local state for the message creator form
  const [newArbId, setNewArbId] = useState("0x3E5");
  const [newName, setNewName] = useState("Dynamic Radar Angle");
  const [newPayload, setNewPayload] = useState("0A 32 FF B0 00 00 00 01");
  const [newRate, setNewRate] = useState(100); // ms
  const [errorMessage, setErrorMessage] = useState("");

  const validateAndAddMessage = () => {
    setErrorMessage("");
    
    // Check Arbitration ID
    const arbIdPattern = /^0x[0-9A-Fa-f]{1,3}$/;
    if (!arbIdPattern.test(newArbId)) {
      setErrorMessage("Arbitration ID must be 11-bit hex format (e.g., 0x1A0 or 0x3E5, up to 0x7FF).");
      return;
    }

    // Clean payload
    const cleanPayloadStr = newPayload.replace(/\s+/g, "").toUpperCase();
    if (cleanPayloadStr.length !== 16 || !/^[0-9A-Fa-f]{16}$/.test(cleanPayloadStr)) {
      setErrorMessage("Payload must represent exactly 8 hex bytes (e.g. 16 hex characters; spaces are allowed).");
      return;
    }

    // Format payload with spaces
    const formattedBytes: string[] = [];
    for (let i = 0; i < 16; i += 2) {
      formattedBytes.push(cleanPayloadStr.slice(i, i + 2));
    }
    const formattedPayload = formattedBytes.join(" ");

    const newMessage: CustomCANMessage = {
      id: `custom_${Date.now()}`,
      name: newName || `CAN Msg ${newArbId}`,
      arbitrationId: newArbId.toUpperCase(),
      payload: formattedPayload,
      transmissionRate: newRate,
      active: true
    };

    setCustomCanMessages(prev => [...prev, newMessage]);
    
    // Reset inputs
    setNewArbId("0x" + Math.floor(Math.random() * 1000 + 100).toString(16).toUpperCase());
    setNewName("Dynamic Sensor " + Math.floor(Math.random() * 90 + 10));
    setNewPayload("00 00 00 00 00 00 00 00");
  };

  const deleteMessage = (id: string) => {
    setCustomCanMessages(prev => prev.filter(m => m.id !== id));
  };

  const toggleActive = (id: string) => {
    setCustomCanMessages(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, active: !m.active };
      }
      return m;
    }));
  };

  const triggerBusError = (errorType: typeof canBusError) => {
    setCanBusError(errorType);

    if (errorType === "NONE") {
      const resetLog: CANBusErrorLog = {
        id: `err_log_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: "BUS_OFF",
        severity: "LOW",
        message: "CAN Core Transceivers Reset. Normal signaling recovered."
      };
      setCanErrorLogs(prev => [resetLog, ...prev]);
      return;
    }

    let detailMsg = "";
    let sev: CANBusErrorLog["severity"] = "HIGH";

    switch (errorType) {
      case "BUS_OFF":
        detailMsg = "CAN controller entered Bus-Off state due to Transmit Error Counter (TEC) > 255. High-impedance isolated.";
        sev = "CRITICAL";
        break;
      case "CRC_ERROR":
        detailMsg = "Cyclic Redundancy Check (CRC) mismatched at receiver. Interjected checksum bit corruption.";
        sev = "HIGH";
        break;
      case "STUFFING_ERROR":
        detailMsg = "Bit Stuffing violation: Detected 6 consecutive identical bit levels on High-Speed Differential.";
        sev = "MEDIUM";
        break;
      case "ACK_ERROR":
        detailMsg = "Acknowledgment failure: No receiving nodes asserted ACK slot. Transmitter repeating frame.";
        sev = "HIGH";
        break;
      case "ARBITRATION_LOSS":
        detailMsg = "Bus Collision: Multiple devices transmitting simultaneously. Arbitration priority lost on leading zero bits.";
        sev = "LOW";
        break;
    }

    const newErrorLog: CANBusErrorLog = {
      id: `err_log_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: errorType,
      severity: sev,
      message: detailMsg
    };

    setCanErrorLogs(prev => {
      const capped = prev.length > 50 ? prev.slice(0, 50) : prev;
      return [newErrorLog, ...capped];
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full text-zinc-200 select-none animate-fade-in font-sans">
      
      {/* Col 1: CAN Bus Topology Representation & Error Simulators */}
      <div className="flex flex-col space-y-6 lg:col-span-1">
        
        {/* Network Topology */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-sky-500/10 border border-sky-500/30 text-sky-450 rounded font-bold">TOPOLOGY</span>
            <h3 className="text-sm font-semibold text-zinc-100">CAN-Bus Network Topology</h3>
          </div>

          {/* Interactive Topology Graph */}
          <div className="bg-[#0c0c0e] border border-[#1c1c1f] rounded p-4 flex flex-col items-center justify-center relative min-h-[160px]">
            
            {/* Trunk Line */}
            <div className={`absolute left-4 right-4 h-1 rounded ${canBusError === "BUS_OFF" ? "bg-rose-950/60" : "bg-blue-600 animate-pulse"} transition-colors duration-500`}></div>
            
            {/* Terminating resistors */}
            <div className="absolute left-[8px] top-[74px] px-1 py-0.5 bg-zinc-800 border border-zinc-750 rounded text-[7px] text-zinc-500 font-mono font-bold leading-none">120Ω</div>
            <div className="absolute right-[8px] top-[74px] px-1 py-0.5 bg-zinc-800 border border-zinc-750 rounded text-[7px] text-zinc-500 font-mono font-bold leading-none">120Ω</div>

            {/* Nodes connected */}
            <div className="grid grid-cols-4 gap-2 w-full relative z-10 my-4 text-center">
              
              {/* Node 1: Engine ECU */}
              <div className="flex flex-col items-center">
                <div className={`h-8 w-12 rounded border flex flex-col items-center justify-center font-bold text-[8px] tracking-tight leading-none ${
                  canBusError === "BUS_OFF" ? "bg-rose-950/15 border-rose-900/40 text-rose-500" : "bg-blue-950/20 border-blue-800/40 text-blue-400"
                }`}>
                  ECU
                </div>
                <div className="w-0.5 h-6 bg-zinc-700/60"></div>
                <span className="text-[7.5px] text-zinc-500 mt-1 uppercase font-semibold font-mono">Engine</span>
              </div>

              {/* Node 2: ADAS Controller */}
              <div className="flex flex-col items-center">
                <div className={`h-8 w-12 rounded border flex flex-col items-center justify-center font-bold text-[8px] tracking-tight leading-none ${
                  canBusError === "BUS_OFF" ? "bg-rose-950/15 border-rose-900/40 text-rose-500" : "bg-violet-950/20 border-violet-800/40 text-violet-400"
                }`}>
                  ADAS
                </div>
                <div className="w-0.5 h-6 bg-zinc-700/60"></div>
                <span className="text-[7.5px] text-zinc-500 mt-1 uppercase font-semibold font-mono">Radar/Lidar</span>
              </div>

              {/* Node 3: Telem Router */}
              <div className="flex flex-col items-center">
                <div className={`h-8 w-12 rounded border flex flex-col items-center justify-center font-bold text-[8px] tracking-tight leading-none ${
                  canBusError === "BUS_OFF" ? "bg-rose-950/15 border-rose-900/40 text-rose-500" : "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                }`}>
                  TCU
                </div>
                <div className="w-0.5 h-6 bg-zinc-700/60"></div>
                <span className="text-[7.5px] text-zinc-500 mt-1 uppercase font-semibold font-mono">Cloud</span>
              </div>

              {/* Node 4: OBD Connector */}
              <div className="flex flex-col items-center">
                <div className={`h-8 w-12 rounded border flex flex-col items-center justify-center font-bold text-[8px] tracking-tight leading-none ${
                  canBusError === "BUS_OFF" ? "bg-rose-950/15 border-rose-900/40 text-rose-500" : "bg-amber-950/20 border-amber-800/40 text-amber-400"
                }`}>
                  OBD
                </div>
                <div className="w-0.5 h-6 bg-zinc-700/60"></div>
                <span className="text-[7.5px] text-zinc-500 mt-1 uppercase font-semibold font-mono">Logger Port</span>
              </div>

            </div>

            {/* Network signaling flow description */}
            <div className="text-[10px] text-zinc-400 w-full text-center font-mono mt-1 pt-2 border-t border-zinc-950 flex items-center justify-center gap-1.5">
              <Activity size={10} className={`${canBusError === "BUS_OFF" ? "text-zinc-650" : "text-emerald-500 animate-pulse"}`} />
              <span>
                Status: {canBusError === "NONE" ? "HIGH-SPEED CAN (500 Kbps) RX/TX ACTIVE" : `BUS DISTURBED [${canBusError}]`}
              </span>
            </div>
          </div>
        </div>

        {/* Bus Error Injection Panel */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex-1">
          <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded font-bold">ERROR INJECTOR</span>
            <h3 className="text-sm font-semibold text-zinc-100">Simulate Hardware Bus Faults</h3>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] text-zinc-450 leading-relaxed mb-3">
              Trigger specific Physical (PHY) layers or Controller Layer error states to stress-test your Android VHAL and safety mechanisms.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              
              {/* Bus Off */}
              <button
                id="inject-err-bus-off"
                onClick={() => triggerBusError(canBusError === "BUS_OFF" ? "NONE" : "BUS_OFF")}
                className={`p-2.5 rounded border text-left flex flex-col justify-between h-20 transition duration-150 cursor-pointer ${
                  canBusError === "BUS_OFF"
                    ? "bg-rose-500/15 border-rose-500/60 text-rose-300 animate-pulse"
                    : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-450 hover:border-zinc-750 hover:text-zinc-100"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-[11px]">Bus Off Isolation</span>
                  <AlertOctagon size={12} className={canBusError === "BUS_OFF" ? "text-rose-500" : "text-zinc-500"} />
                </div>
                <span className="text-[9px] text-zinc-500 leading-tight">Shuts off all transceiver relays. Silence.</span>
              </button>

              {/* CRC Mismatch */}
              <button
                id="inject-err-crc"
                onClick={() => triggerBusError(canBusError === "CRC_ERROR" ? "NONE" : "CRC_ERROR")}
                className={`p-2.5 rounded border text-left flex flex-col justify-between h-20 transition duration-150 cursor-pointer ${
                  canBusError === "CRC_ERROR"
                    ? "bg-rose-500/15 border-rose-500/60 text-rose-300"
                    : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-450 hover:border-zinc-750 hover:text-zinc-100"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-[11px]">CRC Checksum</span>
                  <Activity size={12} className={canBusError === "CRC_ERROR" ? "text-rose-500 animate-pulse" : "text-zinc-500"} />
                </div>
                <span className="text-[9px] text-zinc-500 leading-tight">Corrupts the polynomial feedback check byte.</span>
              </button>

              {/* Bit Stuffing */}
              <button
                id="inject-err-stuffing"
                onClick={() => triggerBusError(canBusError === "STUFFING_ERROR" ? "NONE" : "STUFFING_ERROR")}
                className={`p-2.5 rounded border text-left flex flex-col justify-between h-20 transition duration-150 cursor-pointer ${
                  canBusError === "STUFFING_ERROR"
                    ? "bg-rose-500/15 border-rose-500/60 text-rose-300"
                    : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-450 hover:border-zinc-750 hover:text-zinc-100"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-[11px]">Stuff Bit Violation</span>
                  <WifiOff size={12} className={canBusError === "STUFFING_ERROR" ? "text-rose-500" : "text-zinc-500"} />
                </div>
                <span className="text-[9px] text-zinc-500 leading-tight">Blocks stuff-bit insertions (6 identical bits).</span>
              </button>

              {/* ACK Failure */}
              <button
                id="inject-err-ack"
                onClick={() => triggerBusError(canBusError === "ACK_ERROR" ? "NONE" : "ACK_ERROR")}
                className={`p-2.5 rounded border text-left flex flex-col justify-between h-20 transition duration-150 cursor-pointer ${
                  canBusError === "ACK_ERROR"
                    ? "bg-rose-500/15 border-rose-500/60 text-rose-300"
                    : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-450 hover:border-zinc-750 hover:text-zinc-100"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-[11px]">ACK Fail (Recessive)</span>
                  <X size={12} className={canBusError === "ACK_ERROR" ? "text-rose-500" : "text-zinc-500"} />
                </div>
                <span className="text-[9px] text-zinc-500 leading-tight">Forces ACK slots to remain recessive logic 1.</span>
              </button>

            </div>

            {/* Collision Loss / Jitter Rate */}
            <button
              id="inject-err-arbitration"
              onClick={() => triggerBusError(canBusError === "ARBITRATION_LOSS" ? "NONE" : "ARBITRATION_LOSS")}
              className={`w-full p-2 rounded border text-left text-xs transition duration-150 cursor-pointer ${
                canBusError === "ARBITRATION_LOSS"
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                  : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-400 hover:border-zinc-750 hover:text-zinc-200"
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span>Simulate High Collision Rate (Arbitration Loss)</span>
                <span className="text-[9.5px] px-1 bg-amber-500/15 border border-amber-500/20 rounded text-amber-400">BUS NOISE</span>
              </div>
              <p className="text-[9px] text-zinc-500 mt-1 font-mono">Forces transmit collisions, causing random 50ms-300ms delays on frames as prioritize sweeps occur.</p>
            </button>

            {/* Clear active states button if any exist */}
            {canBusError !== "NONE" && (
              <button
                id="clear-all-can-errors"
                onClick={() => triggerBusError("NONE")}
                className="w-full mt-1.5 flex items-center justify-center space-x-1 py-1.5 px-3 uppercase rounded font-black text-[10px] tracking-wider bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 transition cursor-pointer"
              >
                <Check size={11} />
                <span>Recover Bus Transceiver Link</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Col 2: Custom CAN Message Manager */}
      <div className="flex flex-col space-y-6 lg:col-span-1">
        
        {/* Creator Form */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md">
          <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded font-bold">CREATOR</span>
            <h3 className="text-sm font-semibold text-zinc-100 font-sans">Define Custom CAN Message</h3>
          </div>

          <div className="space-y-3.5 text-xs select-text">
            
            {/* Arb ID and Label Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1 font-bold">ARBITRATION ID</label>
                <input
                  id="can-form-arb-id"
                  type="text"
                  value={newArbId}
                  onChange={(e) => setNewArbId(e.target.value)}
                  placeholder="0x1A0"
                  className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-250 outline-none focus:border-zinc-750 font-mono font-bold uppercase tracking-wider"
                />
              </div>
              
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1 font-bold">SIGNAL LABEL</label>
                <input
                  id="can-form-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Brake Position"
                  className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-250 outline-none focus:border-zinc-750 font-medium"
                />
              </div>
            </div>

            {/* Hex Payload string */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1 font-bold">PAYLOAD (8 HEX BYTES / DLC 8)</label>
              <input
                id="can-form-payload"
                type="text"
                value={newPayload}
                onChange={(e) => setNewPayload(e.target.value)}
                placeholder="00 00 FF AA 32 C1 00 00"
                className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-200 outline-none focus:border-zinc-750 font-mono text-center tracking-widest font-black"
              />
              <span className="text-[8.5px] text-zinc-600 font-mono mt-1 block">Hex pairs separated by space (automatic formatting parses on submit)</span>
            </div>

            {/* Transmission settings */}
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1 font-bold">BROADCAST INTERVAL</label>
              <select
                id="can-form-rate"
                value={newRate}
                onChange={(e) => setNewRate(parseInt(e.target.value))}
                className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded px-2.5 py-1.5 text-zinc-350 outline-none focus:border-zinc-750 font-mono cursor-pointer"
              >
                <option value="10">Periodic (10 ms) - High Speed High Priority</option>
                <option value="50">Periodic (50 ms) - Vehicle Control Streams</option>
                <option value="100">Periodic (100 ms) - Chassis Systems (ACC/BSM)</option>
                <option value="500">Periodic (500 ms) - Thermal & Cabin Air</option>
                <option value="1000">Periodic (1000 ms) - Low Speed Diagnostics</option>
                <option value="0">Manual / Intermittent (Inject One-Shot Only)</option>
              </select>
            </div>

            {/* Error notifications */}
            {errorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2 rounded text-[10.5px] font-mono leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Submit button */}
            <button
              id="submit-custom-can-btn"
              onClick={validateAndAddMessage}
              className="w-full py-2 px-4 rounded font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition text-center select-none cursor-pointer"
            >
              Add Custom CAN Broadcast Registry
            </button>

          </div>
        </div>

        {/* Informational Guidelines card */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex-1 text-xs select-text text-zinc-400 space-y-3.5 leading-relaxed">
          <div className="flex items-center space-x-1.5 text-blue-400 font-bold border-b border-[#1c1c1f] pb-1.5 uppercase font-mono tracking-wider">
            <ShieldAlert size={12} />
            <span>AAOS Controller & VHAL Bridging</span>
          </div>
          <p>
            In Android Automotive OS, VHAL properties bridge structural CAN signals into high-level Java frameworks.
          </p>
          <p className="font-mono text-[10px] bg-[#0c0c0e] border border-[#1c1c1f] p-1.5 rounded text-zinc-500">
            SOCKET ➔ CAN CONTROLLER ➔ ANDROID BINDER (VHAL SERVICE) ➔ CARPROPERTYMANAGER ➔ COCKPIT APP
          </p>
          <p>
            Enabling high-frequency custom signals here exercises the bus bandwidth limits. If <span className="text-rose-400 font-semibold font-mono">Bus Off</span> is injected, transmissions cease and the VHAL triggers continuous device-loss chimes immediately.
          </p>
        </div>

      </div>

      {/* Col 3: Live Custom Message Broadcaster Panel & Incident Logs Terminal */}
      <div className="flex flex-col space-y-6 lg:col-span-1">
        
        {/* Active Registry Broadcasting Monitoring */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col h-[280px]">
          <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
            <span className="p-1 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded font-bold">MONITOR</span>
            <h3 className="text-sm font-semibold text-zinc-100">Live CAN Message Broadcaster</h3>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {customCanMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-600 text-xs">
                <WifiOff size={16} className="mb-1 text-zinc-750" />
                <span>No user-defined periodic CAN signals.</span>
              </div>
            ) : (
              customCanMessages.map((msg) => {
                const isOffState = canBusError === "BUS_OFF";
                return (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-md border flex flex-col space-y-1 ${
                      isOffState 
                        ? "bg-rose-950/5 border-rose-950/20 text-rose-500/60" 
                        : msg.active 
                          ? "bg-[#0c0c0e] border-[#1c1c1f]" 
                          : "bg-zinc-950/40 border-[#1c1c1f]/40 opacity-55"
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10.5px]">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="font-mono font-black border border-[#1a1a1e] px-1 rounded bg-[#111114] text-sky-450 tracking-wide text-[9.5px]">
                          {msg.arbitrationId}
                        </span>
                        <span className="font-bold text-zinc-250 truncate">{msg.name}</span>
                      </div>
                      
                      {/* Controls inside entry */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {/* Play / pause toggle */}
                        <button
                          id={`toggle-broadcast-msg-${msg.id}`}
                          onClick={() => toggleActive(msg.id)}
                          disabled={isOffState}
                          className={`px-1 rounded text-[8px] font-mono font-extrabold uppercase py-0.5 border cursor-pointer select-none ${
                            msg.active 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                              : "bg-zinc-800 text-zinc-550 border-zinc-750 hover:bg-zinc-750"
                          }`}
                        >
                          {msg.active ? "ACTIVE" : "PAUSED"}
                        </button>

                        {/* One shot force inject */}
                        <button
                          id={`force-oneshot-can-${msg.id}`}
                          onClick={() => sendIndividualCANMessage(msg)}
                          disabled={isOffState}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#111114] border border-[#1c1c1f] transition cursor-pointer shrink-0"
                          title="Inject One-Shot Frame Immediately"
                        >
                          <Send size={9.5} />
                        </button>

                        {/* Delete */}
                        <button
                          id={`delete-can-msg-${msg.id}`}
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 rounded text-rose-450 hover:text-rose-450 hover:bg-rose-500/10 border border-transparent transition cursor-pointer shrink-0"
                          title="Delete message definition"
                        >
                          <Trash2 size={9.5} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-550 pt-0.5">
                      <span className="truncate max-w-[170px] text-emerald-450">{msg.payload}</span>
                      <span>
                        {msg.transmissionRate > 0 ? `${msg.transmissionRate} ms` : "OnChange"}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bus Fault Incident log terminal */}
        <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-3 shadow-md flex flex-col h-[240px]">
          <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-1.5 mb-2 shrink-0">
            <div className="flex items-center space-x-1.5 text-zinc-250 font-bold text-xs">
              <FileText size={12} className="text-rose-400" />
              <span>Fault incident Log</span>
            </div>
            {canErrorLogs.length > 0 && (
              <button
                id="clear-can-err-logs-btn"
                onClick={() => setCanErrorLogs([])}
                className="text-rose-400/80 hover:text-rose-300 text-[10px] font-semibold cursor-pointer"
              >
                Clear Log
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9.5px] text-zinc-400 select-text leading-normal scrollbar-thin scrollbar-thumb-zinc-800">
            {canErrorLogs.length === 0 ? (
              <span className="text-zinc-650 block italic p-2 font-sans text-center mt-6">CAN bus healthy. No faults occurred.</span>
            ) : (
              canErrorLogs.map((log) => {
                const sevColors = 
                  log.severity === "CRITICAL" 
                    ? "text-rose-400 animate-pulse font-bold" 
                    : log.severity === "HIGH" 
                      ? "text-rose-400" 
                      : log.severity === "MEDIUM" 
                        ? "text-amber-400" 
                        : "text-zinc-400";
                return (
                  <div key={log.id} className="border-b border-zinc-950 pb-1.5">
                    <span className="text-zinc-600">[{log.timestamp}]</span>{" "}
                    <span className={`${sevColors} font-black`}>[{log.type}]</span>{" "}
                    <span className="text-zinc-350">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
