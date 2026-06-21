/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { ProtocolMessage, ProtocolType } from "../types";
import { Play, Pause, Trash2, Download, Search, Check, AlertCircle } from "lucide-react";

interface ProtocolTracerProps {
  logs: ProtocolMessage[];
  clearLogs: () => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

export function ProtocolTracer({ logs, clearLogs, isPaused, setIsPaused }: ProtocolTracerProps) {
  const [selectedType, setSelectedType] = useState<ProtocolType | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<ProtocolMessage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesType = selectedType === "ALL" || log.type === selectedType;
    const matchesSearch = 
      log.arbitrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.propertyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.payload.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.channel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Handle Autoscroll
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Export logs to JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sdv_vh_diag_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Human breakdown of hex arrays (for deep details drawer)
  const getPayloadBreakdownByLog = (log: ProtocolMessage): { bytes: string[]; description: string }[] => {
    const cleanBytes = log.payload.replace(/[\[\]]/g, "").trim().split(/\s+/);
    
    if (log.type === "CAN" && log.arbitrationId === "0x1A0") {
      return [
        { bytes: cleanBytes.slice(0, 2), description: "Vehicle Speed (km/h) as Big-Endian 16-bit Integer" },
        { bytes: cleanBytes.slice(2, 3), description: "Virtual Throttle Intake Position % (0-255 mapped to 0-100)" },
        { bytes: cleanBytes.slice(3, 4), description: "Brake Fluid Pressure (psi)" },
        { bytes: cleanBytes.slice(4, 5), description: "Drivetrain Friction Checksum & Alive Rolling Counter (0x00-0x0F)" }
      ];
    }
    
    if (log.type === "CAN" && log.arbitrationId === "0x1B2") {
      return [
        { bytes: cleanBytes.slice(0, 2), description: "Steering Angle Wheel Shaft Vector (-4500 to 4500 offset, resolution 0.1°)" },
        { bytes: cleanBytes.slice(2, 3), description: "Column Turn Indicator Relay State (00=Neutral, 01=Left, 02=Right)" },
        { bytes: cleanBytes.slice(3, 5), description: "Calculated Drivetrain Torque Demands (Nm)" }
      ];
    }

    if (log.type === "VHAL") {
      return [
        { bytes: cleanBytes, description: "Android Automotive OS Binder parcel content. Transmits updated node value and validation state to CarPropertyManager framework." }
      ];
    }

    if (log.type === "OBD2") {
      return [
        { bytes: cleanBytes.slice(0, 1), description: "Frame payload length" },
        { bytes: cleanBytes.slice(1, 2), description: "PID Response Code (Diagnostic mode requested + 0x40)" },
        { bytes: cleanBytes.slice(2, 3), description: "PID Identifier Hex representation" },
        { bytes: cleanBytes.slice(3), description: "Response bytes holding formatted diagnostic parameter return" }
      ];
    }

    return [
      { bytes: cleanBytes, description: "Raw hexadecimal communication register frame containing telemetry parameters." }
    ];
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] border border-[#1c1c1f] rounded-lg overflow-hidden shadow-lg">
      
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between p-3 gap-3 bg-[#0c0c0e] border-b border-[#1c1c1f]">
        <div className="flex items-center space-x-2">
          <div className="p-1 px-1.5 text-[10px] font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded">
            TRACEPORT
          </div>
          <h3 className="font-semibold text-zinc-100 text-sm">Real-time Bus Diagnostics</h3>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Pause Feed */}
          <button
            id="pause-feed-btn"
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded border transition duration-150 cursor-pointer ${
              isPaused 
                ? "bg-amber-500/15 border-amber-500/40 text-amber-400" 
                : "bg-[#111114] border-[#1c1c1f] hover:border-zinc-700 text-zinc-300"
            }`}
          >
            {isPaused ? (
              <>
                <Play size={12} className="fill-amber-400" />
                <span>Resume Feed</span>
              </>
            ) : (
              <>
                <Pause size={12} className="fill-zinc-300" />
                <span>Pause Live</span>
              </>
            )}
          </button>

          {/* Export */}
          <button
            id="export-logs-btn"
            onClick={handleExport}
            disabled={logs.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded border border-[#1c1c1f] hover:border-zinc-700 bg-[#111114] text-zinc-300 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download size={12} />
            <span>Export Logs</span>
          </button>

          {/* Delete All */}
          <button
            id="clear-logs-btn"
            onClick={clearLogs}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition duration-150 cursor-pointer"
            title="Clear Feed Window"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-b border-[#1c1c1f] bg-[#111114]/65 text-xs shrink-0">
        
        {/* Toggle Channel Filter Buttons */}
        <div className="md:col-span-3 flex border-b md:border-b-0 md:border-r border-[#1c1c1f]">
          <button
            id="filter-all-btn"
            onClick={() => setSelectedType("ALL")}
            className={`flex-1 py-2 text-center font-semibold border-b-2 transition duration-200 cursor-pointer ${
              selectedType === "ALL" 
                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Stream ({logs.length})
          </button>
          <button
            id="filter-can-btn"
            onClick={() => setSelectedType("CAN")}
            className={`flex-1 py-2 text-center font-semibold border-b-2 transition duration-200 cursor-pointer ${
              selectedType === "CAN" 
                ? "border-blue-500 text-blue-400 bg-blue-500/5" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            CAN-bus
          </button>
          <button
            id="filter-vhal-btn"
            onClick={() => setSelectedType("VHAL")}
            className={`flex-1 py-2 text-center font-semibold border-b-2 transition duration-200 cursor-pointer ${
              selectedType === "VHAL" 
                ? "border-violet-500 text-violet-400 bg-violet-500/5" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            VHAL Binder
          </button>
          <button
            id="filter-obd2-btn"
            onClick={() => setSelectedType("OBD2")}
            className={`flex-1 py-2 text-center font-semibold border-b-2 transition duration-200 cursor-pointer ${
              selectedType === "OBD2" 
                ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/5" 
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            OBD-II
          </button>
        </div>

        {/* Local Search Input */}
        <div className="flex items-center px-2 py-1.5 bg-[#0c0c0e]/40">
          <Search size={14} className="text-zinc-500 mr-2 shrink-0" />
          <input
            id="trace-search-input"
            type="text"
            placeholder="Search payload, hex, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-zinc-200 placeholder-zinc-500 text-xs outline-none"
          />
        </div>
      </div>

      {/* Live Log Content Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Log list */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-2 font-mono scrollbar-thin scrollbar-thumb-zinc-800"
          >
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-550 text-xs font-sans">
                <AlertCircle className="mb-2 text-zinc-650" size={18} />
                <p>No telemetry packets match filters.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Make adjustments, spawn obstacles, or trigger simulated scripts.</p>
              </div>
            ) : (
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-[#1c1c1f] text-zinc-500 text-[10px]">
                    <th className="py-1">TIME</th>
                    <th className="py-1">TYPE</th>
                    <th className="py-1">CHANNEL / ADDR</th>
                    <th className="py-1">PAYLOAD (HEX / PARCEL)</th>
                    <th className="py-1 hidden lg:table-cell">SUMMARY</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const typeColor = 
                      log.type === "CAN" 
                        ? "text-blue-400 bg-blue-400/10 border-blue-400/20" 
                        : log.type === "VHAL" 
                          ? "text-violet-400 bg-violet-400/10 border-violet-400/20" 
                          : "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20";
                    
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className="border-b border-[#1c1c1f]/40 hover:bg-[#111114] cursor-pointer transition duration-100 group"
                      >
                        <td className="py-1 text-zinc-500 pr-2 select-none">{log.timestamp}</td>
                        <td className="py-0.5 pr-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${typeColor}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-1 font-semibold text-zinc-300 pr-2 max-w-[120px] truncate">
                          {log.arbitrationId || log.propertyId || log.channel}
                        </td>
                        <td className="py-1 text-emerald-400 group-hover:text-amber-400 font-mono pr-2 truncate max-w-[200px] lg:max-w-xs transition-colors duration-150">
                          {log.payload}
                        </td>
                        <td className="py-1 text-zinc-350 hidden lg:table-cell max-w-xs truncate font-sans">
                          {log.summary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bottom Status bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#0c0c0e] border-t border-[#1c1c1f] text-[10px] text-zinc-400 bg-opacity-95">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Bus Rate: {isPaused ? "PAUSED" : "2.5 kB/s"}</span>
            </div>
            <label className="flex items-center space-x-1 cursor-pointer select-none">
              <input
                id="autoscroll-chk"
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-[#1c1c1f] bg-[#111114] text-emerald-500 outline-none w-3 h-3 accent-emerald-500"
              />
              <span>Auto Scroll</span>
            </label>
          </div>
        </div>

        {/* Hex Breakdown side panel */}
        {selectedLog && (
          <div className="w-80 border-l border-[#1c1c1f] bg-[#0c0c0e] relative overflow-y-auto p-4 flex flex-col shrink-0 select-none">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-xs text-blue-400 font-bold tracking-wider">HEX DECODE INSPECTION</h4>
                <p className="text-xs font-semibold text-zinc-150 font-mono mt-0.5">
                  {selectedLog.arbitrationId || selectedLog.propertyId || "Channel Event"}
                </p>
              </div>
              <button 
                id="close-decoder-btn"
                onClick={() => setSelectedLog(null)} 
                className="text-zinc-400 hover:text-zinc-100 font-bold border border-[#1c1c1f] px-2 rounded-md py-0.5 bg-[#111114] text-xs cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-400">
              <div className="bg-[#111114] p-2.5 rounded border border-[#1c1c1f]">
                <span className="text-[10px] text-zinc-500 block mb-1">Timestamp REGISTER</span>
                <span className="text-zinc-200">{selectedLog.timestamp}</span>
              </div>

              <div className="bg-[#111114] p-2.5 rounded border border-[#1c1c1f]">
                <span className="text-[10px] text-zinc-500 block mb-1">Port Channel Path</span>
                <span className="text-blue-400">{selectedLog.channel}</span>
              </div>

              <div className="bg-[#111114] p-2.5 rounded border border-[#1c1c1f]">
                <span className="text-[10px] text-zinc-500 block mb-1">Raw Payload Stream</span>
                <p className="text-emerald-400 font-bold tracking-wider">{selectedLog.payload}</p>
              </div>

              <div className="bg-[#111114] p-2.5 rounded border border-[#1c1c1f] mb-2 font-sans">
                <span className="text-[10px] text-zinc-500 block mb-1 font-mono">Signaling Intent</span>
                <p className="text-zinc-200 not-italic leading-relaxed">{selectedLog.summary}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#52525b] block mb-2 font-bold tracking-wider">BITPACK BYTE BREAKDOWN</span>
                <div className="space-y-2 font-mono">
                  {getPayloadBreakdownByLog(selectedLog).map((chunk, idx) => (
                    <div key={idx} className="bg-[#111114]/60 p-2 rounded border border-[#1c1c1f] text-[10px]">
                      <div className="flex items-center space-x-1.5 mb-1 text-zinc-300">
                        {chunk.bytes.map((b, bIdx) => (
                          <span key={bIdx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1 rounded font-bold">
                            {b}
                          </span>
                        ))}
                      </div>
                      <span className="text-zinc-450 leading-normal font-sans">{chunk.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
