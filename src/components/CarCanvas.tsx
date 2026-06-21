/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { ADASState, VehicleSensors } from "../types";

interface CarCanvasProps {
  sensors: VehicleSensors;
  adas: ADASState;
  targetDistance: number; // current simulated obstacle distance (in meters)
  setTargetDistance: (dist: number) => void;
}

export function CarCanvas({ sensors, adas, targetDistance, setTargetDistance }: CarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const roadOffsetRef = useRef(0);
  const obstacleDistanceRef = useRef(targetDistance);

  // Sync ref for animation loop
  useEffect(() => {
    obstacleDistanceRef.current = targetDistance;
  }, [targetDistance]);

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localRoadOffset = 0;

    const draw = () => {
      // Handle resizing if container changed
      const width = canvas.width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.height = 140;

      // Clear dark dashboard background
      ctx.fillStyle = "#09090b"; // Elegant Dark deepest check
      ctx.fillRect(0, 0, width, height);

      // 1. Draw lanes scrolling left depending on speed
      const speedKmH = sensors.speed;
      const scrollSpeed = (speedKmH / 3.6) * 0.15; // Mapped speed
      localRoadOffset = (localRoadOffset - scrollSpeed) % 80;
      roadOffsetRef.current = localRoadOffset;

      // Road background (Dark asphalt gray)
      ctx.fillStyle = "#111114"; // Secondary layout background
      ctx.fillRect(0, 15, width, height - 30);

      // Draw Lane lines (Two solid lanes at borders, crawling dashed lanes in middle)
      ctx.strokeStyle = "#1c1c1f"; // Fine grey lines
      ctx.lineWidth = 3;
      
      // Top lane line
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(width, 20);
      ctx.stroke();

      // Bottom lane line
      ctx.beginPath();
      ctx.moveTo(0, height - 20);
      ctx.lineTo(width, height - 20);
      ctx.stroke();

      // Middle Lane dividers (Dashed lines, scrolling)
      ctx.strokeStyle = "#2d2d30"; // Sleek divider grey
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(localRoadOffset, height / 2);
      ctx.lineTo(width + 40, height / 2);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 2. Map Steering Angle to lateral position (Y-drift)
      // Steering angle -450 -> +450. Max drift is about 25px up or down from lane center.
      const lateralOffset = (sensors.steeringAngle / 450) * 28;
      const carX = 140;
      const laneCenterY = height / 2;
      const carY = laneCenterY + lateralOffset;

      // 3. Draw Radar/Sensor Cone (ACC Lock & AEB Warning)
      let sensorConeColor = "rgba(52, 211, 153, 0.1)"; // Default transparent emerald
      let sensorStroke = "#10b981";

      if (adas.aebActive || adas.aebPreWarning) {
        sensorConeColor = "rgba(239, 68, 68, 0.18)"; // Threat red
        sensorStroke = "#ef4444";
      } else if (adas.accStatus === "LOCK") {
        sensorConeColor = "rgba(59, 130, 246, 0.15)"; // Target blue
        sensorStroke = "#3b82f6";
      } else if (adas.lkaStatus === "WARNING" || adas.lkaStatus === "INTERVENING") {
        sensorConeColor = "rgba(245, 158, 11, 0.15)"; // Alert amber
        sensorStroke = "#f59e0b";
      }

      // Draw front-facing Radar cone
      const coneLength = 260;
      ctx.fillStyle = sensorConeColor;
      ctx.strokeStyle = sensorStroke;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(carX + 45, carY);
      ctx.lineTo(carX + 45 + coneLength, carY - 45);
      ctx.lineTo(carX + 45 + coneLength, carY + 45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Blind Spot sensors (rear arcs)
      // Left side blind spot
      if (adas.bsmLeftAlert) {
        ctx.strokeStyle = "#de7126";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(carX - 45, carY - 15, 20, Math.PI * 0.9, Math.PI * 1.4);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(carX - 45, carY - 15, 15, Math.PI * 0.9, Math.PI * 1.4);
        ctx.stroke();
      }
      
      // Right side blind spot
      if (adas.bsmRightAlert) {
        ctx.strokeStyle = "#de7126";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(carX - 45, carY + 15, 20, Math.PI * 0.6, Math.PI * 1.1, true);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(carX - 45, carY + 15, 15, Math.PI * 0.6, Math.PI * 1.1, true);
        ctx.stroke();
      }

      // 4. Draw Our Vehicle (Simulated AAOS Test Bench Car)
      ctx.save();
      ctx.translate(carX, carY);
      
      // Draw subtle tire skid marks if heavy braking is on
      if (sensors.brake > 60) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
        ctx.fillRect(-40, -14, 20, 4);
        ctx.fillRect(-40, 10, 20, 4);
      }

      // Main silver-blue chassis
      ctx.fillStyle = "#38bdf8"; // Sky-400
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = adas.aebActive ? 15 : 4;
      
      // Draw smooth automotive shape
      ctx.beginPath();
      ctx.roundRect(-35, -12, 70, 24, 6);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Overlap body features
      // Windshield & Glass
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(-5, -9, 22, 18, 3);
      ctx.fill();

      // Headlights (glowing yellow)
      ctx.fillStyle = sensors.speed > 0 ? "#fef08a" : "#ca8a04";
      ctx.fillRect(32, -10, 3, 4);
      ctx.fillRect(32, 6, 3, 4);

      // Rear tail-lights (glowing red when braking)
      ctx.fillStyle = sensors.brake > 10 ? "#ef4444" : "#991b1b";
      ctx.fillRect(-35, -9, 2, 4);
      ctx.fillRect(-35, 5, 2, 4);

      // Spoiler/Trim accent
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(-28, -6, 4, 12);

      // Calibration crosshair on our vehicle top (SDV Lab touch!)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(0, 6);
      ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
      ctx.stroke();

      // Steering angle visual indicator line on wheel
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(15, 0, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      // 5. Draw Obstacle (if spawned or simulated distance is > 0)
      const obstacleDist = obstacleDistanceRef.current;
      if (obstacleDist > 0 && obstacleDist < 120) {
        // Map distance in meters to canvas X coordinates
        // At 0m distance, obstacle touches car nose (carX + 35)
        // At 80m distance, obstacle is near far right of canvas
        const obstacleX = carX + 35 + (obstacleDist / 80) * (width - carX - 100);
        const obstacleY = laneCenterY; // Locked in center lane for simplicity

        // Draw distance tag line
        ctx.strokeStyle = adas.aebActive ? "rgba(239, 68, 68, 0.5)" : "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(carX + 35, carY);
        ctx.lineTo(obstacleX - 35, obstacleY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance text badge
        ctx.fillStyle = adas.aebActive 
          ? "rgba(239,68,68,0.9)" 
          : adas.aebPreWarning 
            ? "rgba(245,158,11,0.9)" 
            : "rgba(30,41,59,0.85)";
        ctx.borderRadius = 4;
        const textX = carX + 50 + (obstacleX - carX - 110) / 2;
        const textStr = `${obstacleDist.toFixed(1)} m`;
        ctx.font = "bold 11px font-mono, monospace";
        const textWidth = ctx.measureText(textStr).width;
        
        ctx.fillRect(textX - 8, height / 2 - 25, textWidth + 16, 16);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(textStr, textX, height / 2 - 13);

        // Draw Obstacle Vehicle (Threat car - Red/Orange)
        ctx.save();
        ctx.translate(obstacleX, obstacleY);
        
        ctx.fillStyle = "#f43f5e"; // Rose-500
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.roundRect(-30, -11, 60, 22, 5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Front window / highlights
        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.roundRect(-2, -8, 18, 16, 2);
        ctx.fill();

        // Warning target brackets
        ctx.strokeStyle = adas.aebActive ? "#ef4444" : "#f59e0b";
        ctx.lineWidth = 2;
        // Top-left
        ctx.beginPath(); ctx.moveTo(-35, -16); ctx.lineTo(-35, -10); ctx.moveTo(-35, -16); ctx.lineTo(-28, -16); ctx.stroke();
        // Top-right
        ctx.beginPath(); ctx.moveTo(35, -16); ctx.lineTo(35, -10); ctx.moveTo(35, -16); ctx.lineTo(28, -16); ctx.stroke();
        // Bottom-left
        ctx.beginPath(); ctx.moveTo(-35, 16); ctx.lineTo(-35, 10); ctx.moveTo(-35, 16); ctx.lineTo(-28, 16); ctx.stroke();
        // Bottom-right
        ctx.beginPath(); ctx.moveTo(35, 16); ctx.lineTo(35, 10); ctx.moveTo(35, 16); ctx.lineTo(28, 16); ctx.stroke();

        ctx.restore();
      }

      // 6. AEB Flash Warning Message overlay
      if (adas.aebActive) {
        ctx.fillStyle = "rgba(220, 38, 38, 0.85)";
        ctx.fillRect(width / 2 - 110, 10, 220, 28);
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(width / 2 - 107, 13, 214, 22);

        ctx.fillStyle = "#ffffff";
        ctx.font = "extrabold 12px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ CRITICAL AEB ACTIVATED ⚠️", width / 2, 28);
      } else if (adas.aebPreWarning) {
        // Red strobe flashing
        if (Math.floor(Date.now() / 250) % 2 === 0) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.85)";
          ctx.fillRect(width / 2 - 100, 10, 200, 28);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("COLLISION WARNING - FCW", width / 2, 28);
        }
      }

      // 7. Visual grid coordinates metadata (Lab simulator look)
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.font = "9px font-mono, JetBrains Mono, monospace";
      ctx.fillText(`CAR_X: ${carX.toFixed(1)}px | CAR_Y_OFFSET: ${lateralOffset.toFixed(1)}px`, 15, height - 25);
      ctx.fillText(`REF_CLK: ${Date.now().toString().slice(-6)} | VHAL_BUSY: FALSE`, 15, height - 13);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sensors, adas]);

  return (
    <div className="relative border border-[#1c1c1f] rounded-lg overflow-hidden bg-[#0c0c0e] shadow-md">
      {/* Top Banner overlay */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c0c0e] border-b border-[#1c1c1f] text-xs text-zinc-400 font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>AAOS VHAL 2D VIEWPORT</span>
        </div>
        <div>
          <span>CAR OFFSET: {sensors.steeringAngle === 0 ? "0.0° (CENTERED)" : `${sensors.steeringAngle > 0 ? "RIGHT" : "LEFT"} ${Math.abs(sensors.steeringAngle).toFixed(0)}°`}</span>
        </div>
      </div>
      
      {/* Canvas Holder */}
      <canvas ref={canvasRef} className="block w-full h-[140px]" />

      {/* Slide overlay for manual Obstacle adjustments */}
      <div className="p-3 bg-[#0c0c0e] border-t border-[#1c1c1f] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="text-zinc-300">
          <span className="font-semibold text-zinc-400">Obstacle Distance Control:</span>{" "}
          <span className="font-mono text-emerald-400 font-bold">{targetDistance > 115 ? "No Lead Vehicle" : `${targetDistance.toFixed(1)}m`}</span>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-2/3">
          <button 
            id="spawn-obstacle-btn"
            onClick={() => setTargetDistance(110)} 
            className="px-2.5 py-1 text-[11px] font-bold border border-blue-500/50 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded transition duration-150 shrink-0 cursor-pointer"
          >
            Spawn Lead Car
          </button>
          
          <input 
            id="obstacle-range-slider"
            type="range"
            min="4"
            max="120"
            step="0.5"
            value={targetDistance}
            onChange={(e) => setTargetDistance(parseFloat(e.target.value))}
            className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />

          <button 
            id="clear-obstacle-btn"
            onClick={() => setTargetDistance(120)} 
            className="px-2.5 py-1 text-[11px] font-bold border border-[#1c1c1f] hover:border-zinc-700 bg-[#111114] text-zinc-300 rounded transition duration-150 shrink-0 cursor-pointer"
          >
            Clear Obstacle
          </button>
        </div>
      </div>
    </div>
  );
}
