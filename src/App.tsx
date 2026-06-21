/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  VehicleSensors, ADASState, DiagnosticsState, ProtocolMessage, 
  ScriptScenario, ScriptCommand, VehiclePropertyId, CustomCANMessage, CANBusErrorLog, SensorProfile 
} from "./types";
import { Header } from "./components/Header";
import { CarCanvas } from "./components/CarCanvas";
import { Dashboard } from "./components/Dashboard";
import { ProtocolTracer } from "./components/ProtocolTracer";
import { ScriptingEditor } from "./components/ScriptingEditor";
import { CANBusMaster } from "./components/CANBusMaster";
import { SensorProfiles } from "./components/SensorProfiles";
import { DIAGNOSTIC_CODE_LIB, generateCANframe, generateOBD2PayLoad, generateVHALPayload } from "./data";
import { Radio, Sliders, PlayCircle, Eye, Bug, ShieldCheck, Cpu } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "canbus" | "profiles" | "scripting">("dashboard");

  // ==========================================
  // CUSTOM CAN AND SENSOR PROFILES STATE MODELS
  // ==========================================
  const [customCanMessages, setCustomCanMessages] = useState<CustomCANMessage[]>([
    {
      id: "can_p1",
      name: "Steering Column Angle Vector",
      arbitrationId: "0x1B2",
      payload: "02 A0 00 00 F1 FF 00 00",
      transmissionRate: 50,
      active: true
    },
    {
      id: "can_p2",
      name: "Adaptive Radar Lead Range",
      arbitrationId: "0x320",
      payload: "42 0A 12 00 0F C1 00 A0",
      transmissionRate: 100,
      active: true
    },
    {
      id: "can_p3",
      name: "Ambient Cabin Air Level",
      arbitrationId: "0x4B0",
      payload: "15 16 00 1E 20 22 AB 00",
      transmissionRate: 500,
      active: true
    }
  ]);

  const [canBusError, setCanBusError] = useState<"NONE" | "BUS_OFF" | "CRC_ERROR" | "STUFFING_ERROR" | "ACK_ERROR" | "ARBITRATION_LOSS">("NONE");
  const [canErrorLogs, setCanErrorLogs] = useState<CANBusErrorLog[]>([]);

  // 3 elaborate visual sensor presets
  const initialPresets: SensorProfile[] = [
    {
      id: "preset_hwy",
      name: "Pristine Highway Cruise",
      description: "Perfect sunny day, high-fidelity ADAS lock-on, zero noise calibration.",
      isPreset: true,
      speed: 110,
      steeringAngle: 0,
      gear: "D",
      throttle: 60,
      brake: 0,
      batterySoc: 85,
      batteryTemp: 32,
      cabinTemp: 21,
      camera: {
        resolution: "4K",
        fps: 60,
        obstruction: "None",
        glare: "Low",
        failure: "None"
      },
      radar: {
        range: 250,
        clutter: "Low",
        interference: false,
        velNoise: 0.1,
        failure: "None"
      },
      gps: {
        lat: 37.4220,
        lng: -122.0841,
        satellites: 18,
        lock: "DGPS",
        hdop: 0.8,
        failure: "None"
      },
      imu: {
        alphaBias: 0.01,
        gyroNoise: 0.005,
        driftRate: 0.001,
        calibration: "Calibrated"
      }
    },
    {
      id: "preset_storm",
      name: "Blinding Torrential Storm Fail",
      description: "Severe rain, glass splatters, heavy cloud satellite blackout.",
      isPreset: true,
      speed: 55,
      steeringAngle: -4,
      gear: "D",
      throttle: 25,
      brake: 0,
      batterySoc: 74,
      batteryTemp: 28,
      cabinTemp: 20,
      camera: {
        resolution: "720p",
        fps: 15,
        obstruction: "Mud Splatter",
        glare: "High",
        failure: "Signal Noise"
      },
      radar: {
        range: 75,
        clutter: "High",
        interference: true,
        velNoise: 3.5,
        failure: "Target Blindness"
      },
      gps: {
        lat: 37.4295,
        lng: -122.0910,
        satellites: 4,
        lock: "2D",
        hdop: 6.2,
        failure: "Satellite Droop"
      },
      imu: {
        alphaBias: 0.25,
        gyroNoise: 0.12,
        driftRate: 0.05,
        calibration: "Uncalibrated"
      }
    },
    {
      id: "preset_offroad",
      name: "Steep Off-Road Mountain Climb",
      description: "Low-range crawl, heavy structural gradient tilt, bad GPS locking coordinates.",
      isPreset: true,
      speed: 15,
      steeringAngle: 32,
      gear: "D",
      throttle: 35,
      brake: 5,
      batterySoc: 62,
      batteryTemp: 49,
      cabinTemp: 22,
      camera: {
        resolution: "1080p",
        fps: 30,
        obstruction: "Raindrops",
        glare: "Medium",
        failure: "None"
      },
      radar: {
        range: 45,
        clutter: "Medium",
        interference: false,
        velNoise: 1.5,
        failure: "None"
      },
      gps: {
        lat: 37.7749,
        lng: -122.4194,
        satellites: 0,
        lock: "None",
        hdop: 9.9,
        failure: "Coordinates Frozen"
      },
      imu: {
        alphaBias: 0.82,
        gyroNoise: 0.08,
        driftRate: 0.15,
        calibration: "Drift Fault"
      }
    }
  ];

  const [savedProfiles, setSavedProfiles] = useState<SensorProfile[]>(() => {
    const raw = localStorage.getItem("sdv_sensors_saved_profiles");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filteredSaved = parsed.filter(p => !p.isPreset);
          return [...initialPresets, ...filteredSaved];
        }
      } catch (e) {
        console.error("Failed loading persistent sensor profiles", e);
      }
    }
    return initialPresets;
  });

  const [activeProfileName, setActiveProfileName] = useState<string>("Pristine Highway Cruise");
  const [activeProfile, setActiveProfile] = useState<SensorProfile>(initialPresets[0]);

  useEffect(() => {
    localStorage.setItem("sdv_sensors_saved_profiles", JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  const deleteProfile = (id: string) => {
    setSavedProfiles(prev => prev.filter(p => p.id !== id));
    appendToExecutionLogs(`Sensor profiles updated. Profile removed from system.`);
  };

  const saveNewProfile = (newP: SensorProfile) => {
    setSavedProfiles(prev => {
      const filtered = prev.filter(p => p.name !== newP.name);
      return [...filtered, newP];
    });
  };

  const loadAndApplyProfile = (profile: SensorProfile) => {
    setActiveProfileName(profile.name);
    setActiveProfile(profile);
    
    setSensors(prev => ({
      ...prev,
      speed: profile.speed,
      steeringAngle: profile.steeringAngle,
      gear: profile.gear,
      throttle: profile.throttle,
      brake: profile.brake,
      batterySoc: profile.batterySoc,
      batteryTemp: profile.batteryTemp,
      cabinTemp: profile.cabinTemp
    }));

    if (profile.camera.failure !== "None" || profile.camera.obstruction !== "None") {
      setAdas(p => ({ ...p, lkaStatus: "WARNING" }));
    }
    if (profile.radar.failure !== "None") {
      setAdas(p => ({ ...p, accStatus: "OFF" }));
    }

    appendToExecutionLogs(`VHAL SYNCHRONIZED: Successfully injected sensor profile "${profile.name}".`);
    appendToLogs(
      "VHAL",
      "VHAL_BINDER",
      `PROFILE INJECTED: Switched active testing calibration to "${profile.name}"`,
      `str:${btoa(profile.name).slice(0, 10)}`,
      undefined,
      "0x11020300"
    );
  };

  const sendIndividualCANMessage = (msg: CustomCANMessage) => {
    if (canBusError === "BUS_OFF") return;

    let finalPayload = msg.payload;
    let summaryMsg = `USER_CAN_ONESHOT: [${msg.name}] single transmission`;
    
    if (canBusError === "CRC_ERROR") {
      finalPayload = msg.payload.slice(0, -2) + "EE";
      summaryMsg = `[CRC ERROR] USER_CAN_ONESHOT: [${msg.name}] broadcast with mismatched CRC`;
    } else if (canBusError === "STUFFING_ERROR") {
      finalPayload = "FF FF FF FF FF FF FF FF";
      summaryMsg = `[STUFF ERROR] USER_CAN_ONESHOT: Stuff bit violation`;
    } else if (canBusError === "ACK_ERROR") {
      summaryMsg = `[ACK FAIL] USER_CAN_ONESHOT: Frame lost, ACK slot remains recessive`;
    }

    appendToLogs(
      "CAN",
      "CAN_BUS_HS",
      summaryMsg,
      generateCANframe(msg.arbitrationId, finalPayload.split(" ")),
      msg.arbitrationId
    );
  };

  // ==========================================
  // 1. VEHICLE SENSOR STATE MODEL
  // ==========================================
  const [sensors, setSensors] = useState<VehicleSensors>({
    speed: 0,
    steeringAngle: 0,
    gear: "P",
    throttle: 0,
    brake: 0,
    batterySoc: 92,
    batteryTemp: 24,
    cabinTemp: 21,
    rpm: 750,
    wheelPressures: {
      frontLeft: 34.2,
      frontRight: 34.5,
      rearLeft: 33.9,
      rearRight: 34.1
    },
    odometer: 14210.4
  });

  // ==========================================
  // 2. ADAS SYSTEM STATE MODEL
  // ==========================================
  const [adas, setAdas] = useState<ADASState>({
    lkaEnabled: true,
    lkaStatus: "IDLE",
    accEnabled: false,
    accStatus: "OFF",
    accSetSpeed: 90,
    accGapSetting: 3,
    aebActive: false,
    aebPreWarning: false,
    bsmLeftAlert: false,
    bsmRightAlert: false
  });

  const [targetDistance, setTargetDistance] = useState<number>(120); // starts far away

  // ==========================================
  // 3. OBD-II DIAGNOSTICS & FAULTS STATE MODEL
  // ==========================================
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    milActive: false,
    activeDtc: [],
    obdProtocol: "ISO15765_CAN",
    dtcLog: []
  });

  // ==========================================
  // 4. PROTOCOL SNIFFER & LOGGING STATE MODEL
  // ==========================================
  const [logs, setLogs] = useState<ProtocolMessage[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const logCounterRef = useRef<number>(0);

  const appendToLogs = (type: ProtocolMessage["type"], channel: string, summary: string, payload: string, arbitrationId?: string, propertyId?: string) => {
    if (isPaused) return;

    const pad = (n: number) => n.toString().padStart(2, "0");
    const now = new Date();
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${now.getMilliseconds().toString().padEnd(3, "0")}`;

    logCounterRef.current += 1;
    const newLog: ProtocolMessage = {
      id: `log_${Date.now()}_${logCounterRef.current}`,
      timestamp: timeStr,
      type,
      channel,
      summary,
      payload,
      arbitrationId,
      propertyId,
      direction: "RX"
    };

    setLogs((prev) => {
      // Cap at maximum 300 logs for memory & speed containment
      const capped = prev.length > 300 ? prev.slice(-300) : prev;
      return [...capped, newLog];
    });
  };

  // ==========================================
  // 5. TEST SEQUENCE RUNNER STATE MACHINE
  // ==========================================
  const [activeScenario, setActiveScenario] = useState<ScriptScenario | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPausedScript, setIsPausedScript] = useState<boolean>(false);
  const [currentCommandIndex, setCurrentCommandIndex] = useState<number>(0);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear execution engine
  const appendToExecutionLogs = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => [...prev, `[${timeStr}] ${msg}`]);
  };

  // Safe reset to normal parameters
  const resetAllSensors = () => {
    setSensors({
      speed: 0,
      steeringAngle: 0,
      gear: "P",
      throttle: 0,
      brake: 0,
      batterySoc: 90,
      batteryTemp: 22,
      cabinTemp: 21,
      rpm: 750,
      wheelPressures: {
        frontLeft: 34.0,
        frontRight: 34.0,
        rearLeft: 34.0,
        rearRight: 34.0
      },
      odometer: 14210.4
    });

    setAdas({
      lkaEnabled: true,
      lkaStatus: "IDLE",
      accEnabled: false,
      accStatus: "OFF",
      accSetSpeed: 90,
      accGapSetting: 3,
      aebActive: false,
      aebPreWarning: false,
      bsmLeftAlert: false,
      bsmRightAlert: false
    });
    setTargetDistance(120);
    appendToExecutionLogs("Reset all sensory registers to baseline idle state.");
  };

  // OBD-II Fault Triggers
  const triggerFault = (code: string) => {
    const detail = DIAGNOSTIC_CODE_LIB.find(d => d.code === code);
    if (!detail) return;

    setDiagnostics((prev) => {
      if (prev.activeDtc.includes(code)) return prev;
      const updatedCodes = [...prev.activeDtc, code];
      const nowStr = new Date().toLocaleTimeString();
      return {
        ...prev,
        milActive: true,
        activeDtc: updatedCodes,
        dtcLog: [
          ...prev.dtcLog,
          { timestamp: nowStr, code, description: detail.description, type: "ACTIVE" }
        ]
      };
    });

    // Fire log events
    appendToLogs(
      "OBD2",
      "CAN_OBD_REG_3",
      `DTC TRAPPED: OBD MIL TRIGGERED! Code: ${code} - ${detail.description}`,
      `43 01 ${code.charCodeAt(0).toString(16).toUpperCase()} ${code.charCodeAt(1).toString(16).toUpperCase()}`,
      "0x7E8"
    );

    appendToExecutionLogs(`DTC INJECTED: Switched Mil Check Lamp active for code ${code} (${detail.system})`);
  };

  const clearFault = (code: string) => {
    setDiagnostics((prev) => {
      const updatedCodes = prev.activeDtc.filter(c => c !== code);
      const nowStr = new Date().toLocaleTimeString();
      const refDetail = DIAGNOSTIC_CODE_LIB.find(d => d.code === code);
      return {
        ...prev,
        milActive: updatedCodes.length > 0,
        activeDtc: updatedCodes,
        dtcLog: [
          ...prev.dtcLog,
          { timestamp: nowStr, code, description: refDetail?.description || "Diagnostic reset", type: "CLEARED" }
        ]
      };
    });

    appendToLogs(
      "OBD2",
      "CAN_OBD_REG_3",
      `DTC CLEARED: Erased Trouble register for [${code}] via simulated VHAL command`,
      "44 CC CC CC",
      "0x7E8"
    );

    appendToExecutionLogs(`DTC REMOVED: Injected fault code ${code} cleared from OBD snapshot registers.`);
  };

  // ==========================================
  // 6. BUS NETWORK PROTOCOLS LIVE GENERATOR & CAN CLOCK
  // ==========================================
  // Custom CAN periodic transmitter clock (10ms master resolution)
  const masterCanTickRef = useRef<number>(0);
  useEffect(() => {
    const clock = setInterval(() => {
      if (isPaused) return;
      if (canBusError === "BUS_OFF") return; // No custom broadcasts in Bus Off state

      masterCanTickRef.current += 10;
      
      customCanMessages.forEach(msg => {
        if (!msg.active || msg.transmissionRate <= 0) return;
        if (masterCanTickRef.current % msg.transmissionRate === 0) {
          
          let finalPayload = msg.payload;
          let summaryMsg = `USER_CAN: [${msg.name}] dynamic status broadcast`;
          
          if (canBusError === "CRC_ERROR") {
            finalPayload = msg.payload.slice(0, -2) + "EE"; // Corrupt CRC checksum byte
            summaryMsg = `[CRC ERROR] USER_CAN: [${msg.name}] bad redundant frame checksum payload`;
          } else if (canBusError === "STUFFING_ERROR") {
            finalPayload = "FF FF FF FF FF FF FF FF"; // Stuff bits violation
            summaryMsg = `[STUFF FAULT] USER_CAN Stuff bit insertion limit exceeded`;
          } else if (canBusError === "ACK_ERROR") {
            summaryMsg = `[ACK FAIL] USER_CAN: Frame lost on channel, recessive ACK slot`;
          } else if (canBusError === "ARBITRATION_LOSS") {
            summaryMsg = `[JITTER ARB] USER_CAN: Bus latency clash [${msg.arbitrationId}] (Jitter resolution resolved)`;
          }

          appendToLogs(
            "CAN",
            "CAN_BUS_HS",
            summaryMsg,
            generateCANframe(msg.arbitrationId, finalPayload.split(" ")),
            msg.arbitrationId
          );
        }
      });
    }, 10);
    return () => clearInterval(clock);
  }, [customCanMessages, isPaused, canBusError]);

  // Mimic live standard vehicle VHAL and CAN telemetry scrolling dynamically
  useEffect(() => {
    const handleDynamicTraffic = setInterval(() => {
      if (isPaused) return;

      const roll = Math.random();

      // If BUS OFF is active, periodically emit warning frames of lost hardware
      if (canBusError === "BUS_OFF") {
        if (roll < 0.25) {
          appendToLogs(
            "CAN",
            "CAN_BUS_HS",
            "🛑 [TRANSCEIVER FAIL] CAN Controller entered BUS_OFF lock. All communication halts.",
            "CAN_ERROR_FRAME_TX_RX_BUS_OFF",
            "0x000"
          );
        }
        return; // Halt standard CAN transmission!
      }
      
      // A. If Speed is non-zero, periodically dump high-speed CAN frames
      if (sensors.speed > 0 && roll < 0.3) {
        // CAN speed ID: 0x1A0
        const rawSpeedHex = Math.round(sensors.speed).toString(16).toUpperCase().padStart(4, "0");
        const throttleRaw = Math.round(sensors.throttle * 2.5).toString(16).toUpperCase().padStart(2, "0");
        const brakeRaw = Math.round(sensors.brake * 2.5).toString(16).toUpperCase().padStart(2, "0");
        const payload = [rawSpeedHex.slice(0, 2), rawSpeedHex.slice(2, 4), throttleRaw, brakeRaw, "00", "00", "00", "0F"];

        appendToLogs(
          "CAN",
          "CAN_BUS_HS",
          `SPEED_FRAME: V_MPH=${sensors.speed.toFixed(1)} km/h | THROTTLE=${sensors.throttle}% | BRAK_PSI=${sensors.brake}%`,
          generateCANframe("0x1A0", payload),
          "0x1A0"
        );
      }

      // B. If Steering is active, periodically dump steering frames
      if (sensors.steeringAngle !== 0 && roll > 0.3 && roll < 0.55) {
        const shiftedAngle = Math.round(sensors.steeringAngle + 450); 
        const steerHex = shiftedAngle.toString(16).toUpperCase().padStart(4, "0");
        const payload = [steerHex.slice(0, 2), steerHex.slice(2, 4), "00", "00", "00", "FF"];

        appendToLogs(
          "CAN",
          "CAN_BUS_HS",
          `STEER_ANGLE_FRAME: STR_RAD_ANGLE=${sensors.steeringAngle.toFixed(1)}°`,
          generateCANframe("0x1B2", payload),
          "0x1B2"
        );
      }

      // C. Injected active sensor profile telematics
      if (roll > 0.55 && roll < 0.7) {
        appendToLogs(
          "VHAL",
          "VHAL_BINDER",
          `CAM_STATUS: Res=${activeProfile.camera.resolution} | FPS=${activeProfile.camera.fps} | Lens=${activeProfile.camera.obstruction} | Error=${activeProfile.camera.failure}`,
          generateVHALPayload("0x11210100", activeProfile.camera.failure === "None" ? 1 : 0),
          undefined,
          "0x11210100"
        );
      }

      if (roll > 0.7 && roll < 0.8) {
        appendToLogs(
          "CAN",
          "CAN_BUS_HS",
          `GPS_TELEMETRY: Sats=${activeProfile.gps.satellites} | Fix=${activeProfile.gps.lock} | HDOP=${activeProfile.gps.hdop} | Status=${activeProfile.gps.failure}`,
          `CAN_MSG [0x2B4] [${activeProfile.gps.satellites.toString(16).padStart(2, "0").toUpperCase()} 00 00 00 0F AA BB CC]`,
          "0x2B4"
        );
      }

      // D. Periodically dump standard VHAL event streams for speed
      if (roll > 0.8 && roll < 0.9) {
        appendToLogs(
          "VHAL",
          "VHAL_BINDER",
          `CarPropertyManager speed telemetry sync: ${sensors.speed.toFixed(2)} m/s`,
          generateVHALPayload(VehiclePropertyId.PERF_VEHICLE_SPEED, sensors.speed / 3.6),
          undefined,
          VehiclePropertyId.PERF_VEHICLE_SPEED
        );
      }

      // E. Continuous battery discharge or crawl odometer
      if (sensors.speed > 0) {
        setSensors(prev => ({
          ...prev,
          odometer: prev.odometer + (prev.speed / 3600) * 0.1,
          batterySoc: prev.batterySoc > 2 ? Number((prev.batterySoc - 0.0008).toFixed(4)) : 2
        }));
      }

    }, 450);

    return () => clearInterval(handleDynamicTraffic);
  }, [sensors, isPaused, canBusError, activeProfile]);

  // ==========================================
  // 7. REAL-TIME MULTI-STAGE ADAS ALIGNMENTS
  // ==========================================
  // When speed, target distance, or active scripts shift, evaluate pre-collision alarms
  useEffect(() => {
    // If obstacle is very close and vehicle speed is moving
    if (targetDistance < 120 && sensors.speed > 0) {
      
      const relativeSpeedDiff = sensors.speed; // assuming stationary obstacle
      const timeToCollision = targetDistance / (relativeSpeedDiff / 3.6); // seconds

      // A. Automatic Emergency Braking (AEB) Trigger Zone (Distance < 8.5 meters or collision time < 0.6s)
      if (targetDistance <= 8.5 || timeToCollision < 0.6) {
        setAdas(prev => ({ ...prev, aebActive: true, aebPreWarning: false }));
        
        // Force mechanical braking if AEB is fully armed/active!
        setSensors(prev => ({
          ...prev,
          brake: 100, // smash brake physical override
          throttle: 0,
          speed: Math.max(0, prev.speed - 12) // rapidly drop velocity
        }));

        appendToLogs(
          "VHAL",
          "VHAL_BINDER",
          "ADAS_AEB_TRIGGERED status transition: ACTIVE_FULL_BRAKING",
          generateVHALPayload(VehiclePropertyId.ADAS_AEB_TRIGGERED, 2),
          undefined,
          VehiclePropertyId.ADAS_AEB_TRIGGERED
        );
      } 
      // B. Forward Collision Warning (FCW) zone (Distance < 32m and speed is high)
      else if (targetDistance < 32 && sensors.speed > 30) {
        setAdas(prev => ({ ...prev, aebActive: false, aebPreWarning: true }));
        appendToLogs(
          "CAN",
          "CAN_BUS_HS",
          `FCW_ALARM: Front collision sensor radar warning. Lead vehicle close: ${targetDistance.toFixed(1)}m. Collision risk!`,
          "CAN_MSG [0x2C0] [FF AA D2 C4 01 02 00 00]",
          "0x2C0"
        );
      } 
      // C. Normal active target locking
      else {
        setAdas(prev => ({ ...prev, aebActive: false, aebPreWarning: false }));
      }
    } else {
      // Clear warnings if obstacles clear out
      setAdas(prev => ({ ...prev, aebActive: false, aebPreWarning: false }));
    }
  }, [targetDistance, sensors.speed]);

  // ==========================================
  // 8. SCRIPT TIMELINE ENGINE TIMERS
  // ==========================================
  useEffect(() => {
    if (!isRunning || isPausedScript || !activeScenario) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const commands = activeScenario.commands;
    if (currentCommandIndex >= commands.length) {
      if (loopEnabled) {
        appendToExecutionLogs("Loop Limit Breached: Restarting scenario sweep from index 0.");
        setCurrentCommandIndex(0);
      } else {
        appendToExecutionLogs("Completed simulated automated workflow successfully.");
        setIsRunning(false);
      }
      return;
    }

    const command = commands[currentCommandIndex];
    appendToExecutionLogs(`Sequence Step [${currentCommandIndex + 1}/${commands.length}]: ${command.action}`);

    const executeStep = () => {
      const p = command.params;
      
      switch (command.action) {
        
        case "SET_SENSOR":
          if (p.sensor && p.value !== undefined) {
            setSensors((prev) => {
              let computedSpeed = prev.speed;
              if (p.sensor === "speed") {
                computedSpeed = Number(p.value);
              } else if (p.sensor === "throttle" && prev.gear === "D") {
                computedSpeed = Number(p.value) * 1.5;
              }
              return {
                ...prev,
                [p.sensor!]: p.value,
                speed: computedSpeed
              };
            });

            appendToLogs(
              "VHAL",
              "VHAL_BINDER",
              `Automation SET_SENSOR: override [${String(p.sensor).toUpperCase()}] to ${p.value}`,
              generateVHALPayload(VehiclePropertyId.PERF_VEHICLE_SPEED, Number(p.value)),
              undefined,
              VehiclePropertyId.PERF_VEHICLE_SPEED
            );
          }
          break;

        case "SET_ADAS":
          if (p.sensor) {
            if (p.sensor === "targetDistance") {
              setTargetDistance(Number(p.value));
            } else if (p.sensor === "aebStatus") {
              setAdas(prev => ({
                ...prev,
                aebActive: p.value === "active",
                aebPreWarning: p.value === "warning"
              }));
            } else {
              setAdas(prev => ({
                ...prev,
                [p.sensor!]: p.value
              }));
            }
            appendToLogs(
              "CAN",
              "CAN_BUS_HS",
              `Automation SET_ADAS: override [${String(p.sensor).toUpperCase()}] to ${p.value}`,
              "CAN_MSG [0x2A1] [D0 3E 4A E0 FF 12 00 00]",
              "0x2A1"
            );
          }
          break;

        case "TRIGGER_FAULT":
          if (p.code) {
            triggerFault(p.code);
          }
          break;

        case "CLEAR_FAULT":
          if (p.code) {
            clearFault(p.code);
          }
          break;

        case "ALERT_MSG":
          appendToLogs(
            "VHAL",
            "VHAL_BINDER",
            `SIMULATOR STATUS MSG: ${p.message}`,
            `str:${btoa(p.message || "").slice(0, 10)}`,
            undefined,
            "0x11000000"
          );
          break;

        case "SEND_CAN":
          if (p.arbitrationId && p.payload) {
            appendToLogs(
              "CAN",
              "CAN_BUS_HS",
              `AUTOMATION_CAN: [Auto-Injected Frame]`,
              generateCANframe(p.arbitrationId, p.payload.split(" ")),
              p.arbitrationId
            );
          }
          break;

        case "TRIGGER_CAN_ERROR":
          if (p.errorType) {
            setCanBusError(p.errorType as any);
            const errLog: CANBusErrorLog = {
              id: `log_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: p.errorType as any,
              severity: "CRITICAL",
              message: `Automated testing sequence injected transceiver error: ${p.errorType}`
            };
            setCanErrorLogs(prev => [errLog, ...prev]);
            appendToExecutionLogs(`TRIGGERED BUS FAULT: ${p.errorType}`);
          }
          break;

        case "CLEAR_CAN_ERROR":
          setCanBusError("NONE");
          appendToExecutionLogs("CLEARED BUS FAULT: Restored standard transceiver feedback.");
          break;

        case "LOAD_PROFILE":
          if (p.profileName) {
            const matchProfile = savedProfiles.find(pf => pf.name.toLowerCase() === p.profileName!.toLowerCase());
            if (matchProfile) {
              loadAndApplyProfile(matchProfile);
            } else {
              appendToExecutionLogs(`PROFILE NOT FOUND: Checked local profiles for "${p.profileName}" - no registration match.`);
            }
          }
          break;
          
        case "WAIT":
          // WAIT step delay handled natively below
          break;
      }

      // Schedule next step translation check
      const delay = command.action === "WAIT" ? (p.duration || 1000) : 800; // default 800ms between normal sweeps to look premium
      
      timerRef.current = setTimeout(() => {
        setCurrentCommandIndex(prev => prev + 1);
      }, delay);
    };

    executeStep();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, isPausedScript, currentCommandIndex, activeScenario]);

  // Handler functions for scripting editor callbacks
  const loadScenario = (scen: ScriptScenario) => {
    setActiveScenario(scen);
    setCurrentCommandIndex(0);
    setIsRunning(false);
    setIsPausedScript(false);
    appendToExecutionLogs(`Loaded VHAL automation workflow: "${scen.name}" (${scen.commands.length} Commands).`);
  };

  const startScript = () => {
    if (!activeScenario) return;
    setIsRunning(true);
    setIsPausedScript(false);
    appendToExecutionLogs(`Sequence pipeline active.`);
  };

  const pauseScript = () => {
    setIsPausedScript(true);
    appendToExecutionLogs(`Sequence pipeline paused. Overrides locked on state.`);
  };

  const stopScript = () => {
    setIsRunning(false);
    setIsPausedScript(false);
    setCurrentCommandIndex(0);
    appendToExecutionLogs(`Automated loop execution aborted.`);
    resetAllSensors();
  };

  const stepScript = () => {
    if (!activeScenario) return;
    // Tick index single step
    if (currentCommandIndex < activeScenario.commands.length) {
      setCurrentCommandIndex(prev => prev + 1);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    appendToLogs("VHAL", "VHAL_BINDER", "Sniffer buffer flushed manually by developer.", "00 00 00 00");
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-[#fafafa] font-sans overflow-hidden">
      
      {/* 1. Header Toolbar */}
      <Header 
        sensors={sensors}
        setSensors={setSensors}
        setAdas={setAdas}
        setTargetDistance={setTargetDistance}
        activeDtcCount={diagnostics.activeDtc.length}
      />

      {/* 2. Top-down 2D driving ADAS canvas viewport (renders in both tabs for immediate visual feedback!) */}
      <div className="p-4 pb-0 shrink-0 select-none">
        <CarCanvas 
          sensors={sensors}
          adas={adas}
          targetDistance={targetDistance}
          setTargetDistance={setTargetDistance}
        />
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
        
        {/* Workspace Tab Selector Buttons */}
        <div className="flex space-x-1.5 border-b border-[#1c1c1f] pb-3 shrink-0 select-none">
          <button
            id="tab-dashboard-btn"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow"
                : "bg-[#0c0c0e] border border-[#1c1c1f] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders size={13} />
            <span>Interactive Cockpit Panel</span>
          </button>

          <button
            id="tab-canbus-btn"
            onClick={() => setActiveTab("canbus")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
              activeTab === "canbus"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow"
                : "bg-[#0c0c0e] border border-[#1c1c1f] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Radio size={13} />
            <span>CAN Bus Master</span>
          </button>

          <button
            id="tab-profiles-btn"
            onClick={() => setActiveTab("profiles")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
              activeTab === "profiles"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow"
                : "bg-[#0c0c0e] border border-[#1c1c1f] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye size={13} />
            <span>Sensor Profiles</span>
          </button>

          <button
            id="tab-scripting-btn"
            onClick={() => setActiveTab("scripting")}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg border transition duration-150 cursor-pointer ${
              activeTab === "scripting"
                ? "bg-blue-600/20 border border-blue-500/50 text-blue-400 shadow"
                : "bg-[#0c0c0e] border border-[#1c1c1f] text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PlayCircle size={13} />
            <span>Sequence Automation Studio</span>
          </button>
        </div>

        {/* Tab Body (Renders the selected active sandbox view) */}
        <div className="flex-1 min-h-0 py-4 grid grid-rows-1 gap-4">
          
          {activeTab === "dashboard" && (
            <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 h-full">
              <Dashboard 
                sensors={sensors}
                setSensors={setSensors}
                adas={adas}
                setAdas={setAdas}
                diagnostics={diagnostics}
                triggerFault={triggerFault}
                clearFault={clearFault}
                resetAllSensors={resetAllSensors}
              />
            </div>
          )}

          {activeTab === "canbus" && (
            <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 h-full">
              <CANBusMaster 
                customCanMessages={customCanMessages}
                setCustomCanMessages={setCustomCanMessages}
                canBusError={canBusError}
                setCanBusError={setCanBusError}
                canErrorLogs={canErrorLogs}
                setCanErrorLogs={setCanErrorLogs}
                sendIndividualCANMessage={sendIndividualCANMessage}
              />
            </div>
          )}

          {activeTab === "profiles" && (
            <div className="overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 h-full">
              <SensorProfiles 
                savedProfiles={savedProfiles}
                activeProfileName={activeProfileName}
                loadAndApplyProfile={loadAndApplyProfile}
                deleteProfile={deleteProfile}
                saveNewProfile={saveNewProfile}
              />
            </div>
          )}

          {activeTab === "scripting" && (
            <div className="h-full">
              <ScriptingEditor 
                activeScenario={activeScenario}
                isRunning={isRunning}
                isPaused={isPausedScript}
                currentCommandIndex={currentCommandIndex}
                loopEnabled={loopEnabled}
                setLoopEnabled={setLoopEnabled}
                loadScenario={loadScenario}
                startScript={startScript}
                pauseScript={pauseScript}
                stopScript={stopScript}
                stepScript={stepScript}
                executionLogs={executionLogs}
                clearExecutionLogs={() => setExecutionLogs([])}
                onCustomScenarioCreated={(scen) => appendToExecutionLogs(`Compiled or updated custom test scenario sequence: ${scen.name}`)}
              />
            </div>
          )}

        </div>

        {/* 4. Scrollable Real-Time Diagnostic Bus Stream logs spanning the bottom of both workspaces */}
        <div className="h-56 shrink-0 mt-2 select-none">
          <ProtocolTracer 
            logs={logs}
            clearLogs={clearLogs}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
          />
        </div>

      </div>

    </div>
  );
}

