/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DIagnosticCodeDetails, ScriptScenario, VehiclePropertyId } from "./types";

export const DIAGNOSTIC_CODE_LIB: DIagnosticCodeDetails[] = [
  {
    code: "P0101",
    system: "Engine",
    severity: "MEDIUM",
    description: "Mass Air Flow (MAF) Sensor Circuit Range/Performance Problem. Engine may run slightly rich or experience rough idles during simulation.",
    vhalTriggerProp: VehiclePropertyId.ENGINE_COOLANT_TEMP
  },
  {
    code: "P0300",
    system: "Engine",
    severity: "HIGH",
    description: "Random/Multiple Cylinder Misfire Detected. Triggers instantaneous drivetrain power derate and triggers emergency hazard strobe.",
    vhalTriggerProp: VehiclePropertyId.ENGINE_COOLANT_TEMP
  },
  {
    code: "P0A7F",
    system: "High-Voltage Battery",
    severity: "HIGH",
    description: "Hybrid/EV Battery Pack Deterioration. Rapidly climbs battery pack temperature, triggers rapid Battery Thermal Runaway, and activates Limp Home logic.",
    vhalTriggerProp: VehiclePropertyId.ENGINE_COOLANT_TEMP
  },
  {
    code: "U0100",
    system: "Chassis",
    severity: "HIGH",
    description: "Lost Communication with ECM/PCM. Triggers VHAL binding crash, freezing Speedometer at current digit and causing active sensory timeouts.",
    vhalTriggerProp: VehiclePropertyId.OBD2_LIVE_FRAME
  },
  {
    code: "C0040",
    system: "Chassis",
    severity: "MEDIUM",
    description: "Brake Pedal Position Sensor 'A' Circuit. Triggers electronic brake-force distribution failure, locking rear brakes and overriding LKA systems.",
    vhalTriggerProp: VehiclePropertyId.OBD2_FREEZE_FRAME
  },
  {
    code: "U0121",
    system: "AD_ADAS",
    severity: "HIGH",
    description: "Lost Communication with Anti-Lock Brake System (ABS) Control Module. Instantly disarms LKA, alerts adaptive cruise targets, and blanks dashboard sensor feeds.",
    vhalTriggerProp: VehiclePropertyId.ADAS_AEB_TRIGGERED
  },
  {
    code: "B1204",
    system: "AD_ADAS",
    severity: "MEDIUM",
    description: "Front Radar Obstruction / Calibration Error. Shuts down Adaptive Cruise Control (ACC) and locks forward obstacle tracking to undefined state.",
    vhalTriggerProp: VehiclePropertyId.ADAS_ACC_STATE
  },
  {
    code: "C1001",
    system: "AD_ADAS",
    severity: "MEDIUM",
    description: "Lane Assist Camera Module Blocked (Rain/Snow/Fog). Front-facing optical classification is compromised; driver must take steering control immediately.",
    vhalTriggerProp: VehiclePropertyId.ADAS_LKA_STATE
  }
];

export const PRESET_SCENARIOS: ScriptScenario[] = [
  {
    id: "highway_acc_aeb",
    name: "Adaptive Cruise & Emergency Stop",
    description: "Simulates high-speed cruise control locking onto a slowing lead vehicle. If the driver does not override and vehicle proximity collapses to 8 meters, the ADAS module activates Automatic Emergency Braking (AEB).",
    difficulty: "Beginner",
    commands: [
      { id: "1", action: "ALERT_MSG", params: { message: "Initializing test: ACC Cruise at 120 km/h." } },
      { id: "2", action: "SET_SENSOR", params: { sensor: "gear", value: "D" } },
      { id: "3", action: "SET_SENSOR", params: { sensor: "speed", value: 120 } },
      { id: "4", action: "SET_SENSOR", params: { sensor: "throttle", value: 45 } },
      { id: "5", action: "SET_ADAS", params: { sensor: "accStatus", value: "ACTIVE" } },
      { id: "6", action: "SET_ADAS", params: { sensor: "accSetSpeed", value: 120 } },
      { id: "7", action: "SET_ADAS", params: { sensor: "targetDistance", value: 110 } },
      { id: "8", action: "WAIT", params: { duration: 2500 } },
      { id: "9", action: "ALERT_MSG", params: { message: "Lead vehicle decelerating rapidly. ACC locking target." } },
      { id: "10", action: "SET_ADAS", params: { sensor: "accStatus", value: "LOCK" } },
      { id: "11", action: "SET_ADAS", params: { sensor: "targetDistance", value: 50 } },
      { id: "12", action: "SET_SENSOR", params: { sensor: "speed", value: 95 } },
      { id: "13", action: "SET_SENSOR", params: { sensor: "throttle", value: 0 } },
      { id: "14", action: "SET_SENSOR", params: { sensor: "brake", value: 20 } },
      { id: "15", action: "WAIT", params: { duration: 2000 } },
      { id: "16", action: "ALERT_MSG", params: { message: "Critical obstacle threshold breached (Distance < 15m)!" } },
      { id: "17", action: "SET_ADAS", params: { sensor: "aebStatus", value: "warning" } },
      { id: "18", action: "SET_ADAS", params: { sensor: "targetDistance", value: 12 } },
      { id: "19", action: "WAIT", params: { duration: 1000 } },
      { id: "20", action: "ALERT_MSG", params: { message: "AEB ACTIVE: Forcing full electronic braking (100% brake, 0% speed)!" } },
      { id: "21", action: "SET_ADAS", params: { sensor: "aebStatus", value: "active" } },
      { id: "22", action: "SET_SENSOR", params: { sensor: "speed", value: 0 } },
      { id: "23", action: "SET_SENSOR", params: { sensor: "brake", value: 100 } },
      { id: "24", action: "SET_ADAS", params: { sensor: "targetDistance", value: 4.5 } },
      { id: "25", action: "WAIT", params: { duration: 3000 } },
      { id: "26", action: "ALERT_MSG", params: { message: "Test Complete: Vehicle halted safely before target." } },
      { id: "27", action: "SET_ADAS", params: { sensor: "aebStatus", value: "idle" } },
      { id: "28", action: "SET_SENSOR", params: { sensor: "brake", value: 0 } }
    ]
  },
  {
    id: "battery_thermal_runaway",
    name: "EV Battery System Overrun",
    description: "Simulates DC Fast Charging thermal runaway. Internal battery resistance spikes temperature to 80°C. VHAL reports high-voltage failures; the vehicle disables propulsion and engages Limp Home mode.",
    difficulty: "Advanced",
    commands: [
      { id: "b1", action: "ALERT_MSG", params: { message: "Fast Charge Initiated. SoC at 85%. Temp rising slowly." } },
      { id: "b2", action: "SET_SENSOR", params: { sensor: "gear", value: "P" } },
      { id: "b3", action: "SET_SENSOR", params: { sensor: "batterySoc", value: 85 } },
      { id: "b4", action: "SET_SENSOR", params: { sensor: "batteryTemp", value: 42 } },
      { id: "b5", action: "WAIT", params: { duration: 2000 } },
      { id: "b6", action: "SET_SENSOR", params: { sensor: "batteryTemp", value: 55 } },
      { id: "b7", action: "ALERT_MSG", params: { message: "WARNING: High-Voltage Battery Core Temperature > 55°C." } },
      { id: "b8", action: "WAIT", params: { duration: 1500 } },
      { id: "b9", action: "SET_SENSOR", params: { sensor: "batteryTemp", value: 68 } },
      { id: "b10", action: "TRIGGER_FAULT", params: { code: "P0A7F" } }, // Battery pack degradation
      { id: "b11", action: "ALERT_MSG", params: { message: "FAULT DETECTED: P0A7F High Critical Thermal Stress. Check Engine Light Active." } },
      { id: "b12", action: "WAIT", params: { duration: 2000 } },
      { id: "b13", action: "SET_SENSOR", params: { sensor: "batteryTemp", value: 79 } },
      { id: "b14", action: "ALERT_MSG", params: { message: "Emergency Battery Depressurization Valve Opened. Overriding Propulsion." } },
      { id: "b15", action: "SET_SENSOR", params: { sensor: "gear", value: "N" } },
      { id: "b16", action: "SET_SENSOR", params: { sensor: "throttle", value: 0 } },
      { id: "b17", action: "SET_SENSOR", params: { sensor: "speed", value: 0 } },
      { id: "b18", action: "WAIT", params: { duration: 3000 } },
      { id: "b19", action: "ALERT_MSG", params: { message: "Battery temperature cooling. Extinguishing fault condition..." } },
      { id: "b20", action: "SET_SENSOR", params: { sensor: "batteryTemp", value: 45 } },
      { id: "b21", action: "CLEAR_FAULT", params: { code: "P0A7F" } },
      { id: "b22", action: "SET_SENSOR", params: { sensor: "gear", value: "P" } },
      { id: "b23", action: "ALERT_MSG", params: { message: "Battery cells stabilized, charging suspended. Runaway test complete." } }
    ]
  },
  {
    id: "abs_sensor_dropout",
    name: "High-Speed Wheel ABS Failure",
    description: "Simulates sudden speed sensor dropout on the Front-Left wheel. Under heavy braking, this causes ABS telemetry mismatch. Visualizes structural VHAL warning timeouts and LKA autopilot disengagement.",
    difficulty: "Intermediate",
    commands: [
      { id: "c1", action: "ALERT_MSG", params: { message: "Cruising at 90 km/h with Lane Assist and Adaptive Cruise engaged." } },
      { id: "c2", action: "SET_SENSOR", params: { sensor: "gear", value: "D" } },
      { id: "c3", action: "SET_SENSOR", params: { sensor: "speed", value: 90 } },
      { id: "c4", action: "SET_ADAS", params: { sensor: "accStatus", value: "ACTIVE" } },
      { id: "c5", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "MONITORING" } },
      { id: "c6", action: "WAIT", params: { duration: 2000 } },
      { id: "c7", action: "ALERT_MSG", params: { message: "Injecting ABS Wheel Mismatch on CAN Channel 1..." } },
      { id: "c8", action: "TRIGGER_FAULT", params: { code: "U0121" } }, // Lost ABS communication
      { id: "c9", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "WARNING" } },
      { id: "c10", action: "SET_ADAS", params: { sensor: "accStatus", value: "OFF" } }, // Safety cutout
      { id: "c11", action: "SET_SENSOR", params: { sensor: "throttle", value: 0 } },
      { id: "c12", action: "WAIT", params: { duration: 1500 } },
      { id: "c13", action: "ALERT_MSG", params: { message: "ABS fault disarms Autopilot loop. High-Contrast warning chimed." } },
      { id: "c14", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "IDLE" } },
      { id: "c15", action: "SET_SENSOR", params: { sensor: "brake", value: 40 } },
      { id: "c16", action: "SET_SENSOR", params: { sensor: "speed", value: 45 } },
      { id: "c17", action: "WAIT", params: { duration: 2000 } },
      { id: "c18", action: "SET_SENSOR", params: { sensor: "speed", value: 0 } },
      { id: "c19", action: "SET_SENSOR", params: { sensor: "brake", value: 0 } },
      { id: "c20", action: "ALERT_MSG", params: { message: "Vehicle brought to manual stop safely. Clearing faults." } },
      { id: "c21", action: "CLEAR_FAULT", params: { code: "U0121" } }
    ]
  },
  {
    id: "lane_drift_warning",
    name: "Autopilot Lane Drift Recovery",
    description: "Simulates vehicle drifting to the left margin due to steering windage or driver hands-free timeout. LKA sensor detects drift, alerts the cockpit, and initiates steering override torque.",
    difficulty: "Beginner",
    commands: [
      { id: "d1", action: "ALERT_MSG", params: { message: "Autopilot lane monitoring online. Road curvature Ahead." } },
      { id: "d2", action: "SET_SENSOR", params: { sensor: "speed", value: 80 } },
      { id: "d3", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "MONITORING" } },
      { id: "d4", action: "WAIT", params: { duration: 2000 } },
      { id: "d5", action: "ALERT_MSG", params: { message: "Starting left-drift vector simulation." } },
      { id: "d6", action: "SET_SENSOR", params: { sensor: "steeringAngle", value: -12 } },
      { id: "d7", action: "WAIT", params: { duration: 1500 } },
      { id: "d8", action: "ALERT_MSG", params: { message: "Lane Keep Warning active! Dashboard steering override engaged." } },
      { id: "d9", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "WARNING" } },
      { id: "d10", action: "WAIT", params: { duration: 1000 } },
      { id: "d11", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "INTERVENING" } },
      { id: "d12", action: "ALERT_MSG", params: { message: "LKA Corrective Torque: steering angle forced back to 0°." } },
      { id: "d13", action: "SET_SENSOR", params: { sensor: "steeringAngle", value: 2 } },
      { id: "d14", action: "WAIT", params: { duration: 1000 } },
      { id: "d15", action: "SET_SENSOR", params: { sensor: "steeringAngle", value: 0 } },
      { id: "d16", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "MONITORING" } },
      { id: "d17", action: "ALERT_MSG", params: { message: "Vehicle stabilized back to lane center. Scenario complete." } }
    ]
  },
  {
    id: "can_bus_crc_failure",
    name: "CAN-Bus Mismatch Interference",
    description: "Simulates severe electromagnetic interference on high-priority vehicle data. Injects continuous CRC mismatch codes into the CAN controller, triggering VHAL loss codes and disarming lane-keep system feedback.",
    difficulty: "Intermediate",
    commands: [
      { id: "can1", action: "ALERT_MSG", params: { message: "Starting CAN transmission test sequence under normal conditions." } },
      { id: "can2", action: "SEND_CAN", params: { arbitrationId: "0x1A0", payload: "08 B2 0F 12 CC CC AA BB" } },
      { id: "can3", action: "WAIT", params: { duration: 1500 } },
      { id: "can4", action: "ALERT_MSG", params: { message: "Injecting electromagnetic interference (EMI). CRC bit errors spike." } },
      { id: "can5", action: "TRIGGER_CAN_ERROR", params: { errorType: "CRC_ERROR" } },
      { id: "can6", action: "SEND_CAN", params: { arbitrationId: "0x1A0", payload: "08 B2 0F 12 CC CC FF BB" } },
      { id: "can7", action: "SEND_CAN", params: { arbitrationId: "0x320", payload: "00 00 11 AA BB B0 00 F0" } },
      { id: "can8", action: "TRIGGER_FAULT", params: { code: "U0100" } },
      { id: "can9", action: "WAIT", params: { duration: 2500 } },
      { id: "can10", action: "ALERT_MSG", params: { message: "Interference cleared. Software restarting transceivers..." } },
      { id: "can11", action: "CLEAR_CAN_ERROR", params: {} },
      { id: "can12", action: "CLEAR_FAULT", params: { code: "U0100" } },
      { id: "can13", action: "ALERT_MSG", params: { message: "Transmissions resumed. Engine and Cabin temperature logs stable." } }
    ]
  },
  {
    id: "storm_profile_load",
    name: "Torrential Storm Sensor Mock",
    description: "Simulates sudden weather deterioration by in-flight injection of our Torrential Storm sensor profile. GPS locks are lost, camera lens gets obstructed, and radar clutter peaks.",
    difficulty: "Intermediate",
    commands: [
      { id: "prm1", action: "ALERT_MSG", params: { message: "Initiating remote profile injection sequence into VHAL workspace." } },
      { id: "prm2", action: "WAIT", params: { duration: 1500 } },
      { id: "prm3", action: "LOAD_PROFILE", params: { profileName: "Blinding Torrential Storm Fail" } },
      { id: "prm4", action: "ALERT_MSG", params: { message: "Storm Profile active. Optical glass obstructed, GPS locks compromised." } },
      { id: "prm5", action: "SET_ADAS", params: { sensor: "lkaStatus", value: "WARNING" } },
      { id: "prm6", action: "TRIGGER_FAULT", params: { code: "C1001" } },
      { id: "prm7", action: "WAIT", params: { duration: 3000 } },
      { id: "prm8", action: "ALERT_MSG", params: { message: "Rain clears. Loading factory-calibrated cruise profile to restore stability." } },
      { id: "prm9", action: "CLEAR_FAULT", params: { code: "C1001" } },
      { id: "prm10", action: "LOAD_PROFILE", params: { profileName: "Pristine Highway Cruise" } }
    ]
  }
];

// Helper to generate a realistic OBD-II CAN Hex string
export function generateOBD2PayLoad(pid: string, responseBytes: string[]): string {
  // Classic OBD-II CAN frame: [Len, Mode, PID, Data0, Data1, Data2, Data3, Data4]
  const len = (2 + responseBytes.length).toString(16).padStart(2, "0").toUpperCase();
  const hexValues = [len, "41", pid, ...responseBytes];
  while (hexValues.length < 8) {
    hexValues.push("CC"); // Padding byte common in CAN frames
  }
  return hexValues.join(" ");
}

// Generate raw VHAL event payload
export function generateVHALPayload(propId: string, value: any): string {
  // Mimic basic binder transactions
  const valueHex = typeof value === "number" 
    ? "0x" + Math.floor(value).toString(16).toUpperCase().padStart(8, "0")
    : typeof value === "string" 
      ? "str:" + btoa(value).slice(0, 8)
      : value ? "0x00000001" : "0x00000000";
  return `VHAL_EVENT: { prop: ${propId}, value: ${valueHex}, status: OK_STABLE }`;
}

// Helper to create a realistic mock CAN frame
export function generateCANframe(arbitrationId: string, dataBytes: string[]): string {
  const padded = [...dataBytes];
  while (padded.length < 8) {
    padded.push("00");
  }
  return `CAN_MSG [ID: ${arbitrationId} DLC: ${dataBytes.length}] [${padded.join(" ")}]`;
}
