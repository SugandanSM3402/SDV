/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// AAOS VHAL Property IDs (Standardized Android Vehicle Properties)
export enum VehiclePropertyId {
  PERF_VEHICLE_SPEED = "0x11200204", // Speed in m/s (mapped to km/h for developers)
  STEERING_WHEEL_ANGLE = "0x11200304", // Angle in degrees
  GEAR_SELECTION = "0x11400400", // P=1, R=2, N=4, D=8
  EV_BATTERY_LEVEL = "0x11600a06", // SOC %
  ENV_CABIN_TEMP = "0x11600302", // Temperature in Celsius
  ENGINE_COOLANT_TEMP = "0x1160030a", // Temperature in Celsius (or Battery Temp)
  TIRE_PRESSURE = "0x11600508", // Tire pressure in kPa (4 wheels)
  OBD2_LIVE_FRAME = "0x11e00d00", // OBD-II diagnostic snapshot
  OBD2_FREEZE_FRAME = "0x11e00d01", // Freeze frame fault snapshot
  ADAS_LKA_STATE = "0x11e00f01", // Lane Keep Assist state (0=off, 1=on, 2=warning, 3=intervening)
  ADAS_ACC_STATE = "0x11e00f02", // Cruise control (0=off, 1=on, 2=active-tracking, 3=override)
  ADAS_AEB_TRIGGERED = "0x11e00f03", // AEB warning or braking (0=idle, 1=warning, 2=active-braking)
}

export type GearType = "P" | "R" | "N" | "D";

export interface WheelPressures {
  frontLeft: number; // in psi or kPa
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

export interface ADASState {
  lkaEnabled: boolean;
  lkaStatus: "IDLE" | "MONITORING" | "WARNING" | "INTERVENING";
  accEnabled: boolean;
  accStatus: "OFF" | "STANDBY" | "ACTIVE" | "LOCK";
  accSetSpeed: number; // km/h
  accGapSetting: number; // 1 to 4 bars
  aebActive: boolean;
  aebPreWarning: boolean;
  bsmLeftAlert: boolean;
  bsmRightAlert: boolean;
}

export interface DiagnosticsState {
  milActive: boolean; // Malfunction Indicator Lamp (Check Engine)
  activeDtc: string[]; // e.g. ["P0101", "P0300"]
  obdProtocol: "ISO15765_CAN" | "ISO9141" | "SAE_J1850";
  dtcLog: DiagnosticCodeEvent[];
}

export interface DiagnosticCodeEvent {
  timestamp: string;
  code: string;
  description: string;
  type: "ACTIVE" | "PENDING" | "CLEARED";
}

export interface VehicleSensors {
  speed: number;        // km/h
  steeringAngle: number; // degrees (-450 to +450)
  gear: GearType;
  throttle: number;      // 0 to 100%
  brake: number;         // 0 to 100%
  batterySoc: number;    // 0 to 100%
  batteryTemp: number;   // °C
  cabinTemp: number;     // °C
  rpm: number;           // Calculated/Mocked
  wheelPressures: WheelPressures;
  odometer: number;      // total km (slowly climbing)
}

export type ProtocolType = "CAN" | "VHAL" | "OBD2";

export interface ProtocolMessage {
  id: string; // Message UUID
  timestamp: string; // HH:MM:SS.SSS
  type: ProtocolType;
  channel: string; // e.g. "CAN_BUS_HS", "VHAL_BINDER", "OBD_K_LINE"
  arbitrationId?: string; // CAN ID e.g. "0x1A0"
  propertyId?: string; // VHAL ID e.g. "0x11200204"
  payload: string; // hex data string
  summary: string; // human-readable explanation
  direction: "TX" | "RX";
}

export interface ScriptCommand {
  id: string;
  action: "SET_SENSOR" | "TRIGGER_FAULT" | "CLEAR_FAULT" | "WAIT" | "ALERT_MSG" | "SET_ADAS" | "LOOP_RESET" | "SEND_CAN" | "TRIGGER_CAN_ERROR" | "CLEAR_CAN_ERROR" | "LOAD_PROFILE";
  params: {
    sensor?: string;
    value?: any;
    duration?: number; // for WAIT in ms
    code?: string; // for TRIGGER_FAULT / CLEAR_FAULT
    message?: string; // for ALERT_MSG
    arbitrationId?: string; // for SEND_CAN
    payload?: string; // for SEND_CAN
    errorType?: string; // for TRIGGER_CAN_ERROR
    profileName?: string; // for LOAD_PROFILE
  };
}

export interface ScriptScenario {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  commands: ScriptCommand[];
}

export interface ScriptingState {
  currentScenarioId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  currentCommandIndex: number;
  executionLog: string[];
  loopEnabled: boolean;
}

export interface SimulationObstacle {
  id: string;
  distance: number; // meters ahead of our vehicle
  speed: number;    // km/h of the target vehicle
  lane: "LEFT" | "CENTER" | "RIGHT"; // lane relative to us
  width: number;    // width meters
}

export interface DIagnosticCodeDetails {
  code: string;
  system: "Engine" | "Transmission" | "Chassis" | "AD_ADAS" | "High-Voltage Battery";
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  vhalTriggerProp: VehiclePropertyId;
}

export interface CustomCANMessage {
  id: string;
  name: string;
  arbitrationId: string;
  payload: string;
  transmissionRate: number; // in ms, 0 means On Change or Manual
  active: boolean;
  lastSent?: string;
}

export interface CANBusErrorLog {
  id: string;
  timestamp: string;
  type: "BUS_OFF" | "CRC_ERROR" | "STUFFING_ERROR" | "ACK_ERROR" | "ARBITRATION_LOSS";
  arbitrationId?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

export interface SensorProfile {
  id: string;
  name: string;
  description: string;
  isPreset?: boolean;
  speed: number;
  steeringAngle: number;
  gear: GearType;
  throttle: number;
  brake: number;
  batterySoc: number;
  batteryTemp: number;
  cabinTemp: number;
  camera: {
    resolution: "720p" | "1080p" | "4K";
    fps: 15 | 30 | 60;
    obstruction: "None" | "Raindrops" | "Mud Splatter" | "Heavy Snow";
    glare: "Low" | "Medium" | "High";
    failure: "None" | "Sensor Dropout" | "Signal Noise" | "Image Freeze";
  };
  radar: {
    range: number;
    clutter: "Low" | "Medium" | "High";
    interference: boolean;
    velNoise: number;
    failure: "None" | "Target Blindness" | "Frequency Jamming" | "Full Outage";
  };
  gps: {
    lat: number;
    lng: number;
    satellites: number;
    lock: "None" | "2D" | "3D" | "DGPS";
    hdop: number;
    failure: "None" | "Multipath Echo" | "Satellite Droop" | "Coordinates Frozen";
  };
  imu: {
    alphaBias: number;
    gyroNoise: number;
    driftRate: number;
    calibration: "Calibrated" | "Uncalibrated" | "Drift Fault";
  };
}

