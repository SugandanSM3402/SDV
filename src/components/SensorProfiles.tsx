/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SensorProfile, GearType } from "../types";
import { 
  Camera, Compass, MapPin, Orbit, Save, Trash2, Check, 
  RotateCcw, ShieldCheck, ShieldAlert, Cpu, Layers, Sliders, Radio
} from "lucide-react";

interface SensorProfilesProps {
  savedProfiles: SensorProfile[];
  activeProfileName: string;
  loadAndApplyProfile: (profile: SensorProfile) => void;
  deleteProfile: (id: string) => void;
  saveNewProfile: (profile: SensorProfile) => void;
}

export function SensorProfiles({
  savedProfiles,
  activeProfileName,
  loadAndApplyProfile,
  deleteProfile,
  saveNewProfile
}: SensorProfilesProps) {
  
  // Local scratchpad profile for editing/creating a new sensor profile
  const [profileName, setProfileName] = useState("Custom Highway Sweeper");
  const [profileDesc, setProfileDesc] = useState("User configured diagnostic evaluation profile.");
  
  // General Vehicle Parameters
  const [speed, setSpeed] = useState(85);
  const [steering, setSteering] = useState(12);
  const [gear, setGear] = useState<GearType>("D");
  const [throttle, setThrottle] = useState(45);
  const [brake, setBrake] = useState(0);
  const [batterySoc, setBatterySoc] = useState(78);
  const [batteryTemp, setBatteryTemp] = useState(36);
  const [cabinTemp, setCabinTemp] = useState(21);

  // Camera Params
  const [camRes, setCamRes] = useState<"720p" | "1080p" | "4K">("1080p");
  const [camFps, setCamFps] = useState<15 | 30 | 60>(30);
  const [camObstruct, setCamObstruct] = useState<"None" | "Raindrops" | "Mud Splatter" | "Heavy Snow">("None");
  const [camGlare, setCamGlare] = useState<"Low" | "Medium" | "High">("Low");
  const [camFail, setCamFail] = useState<"None" | "Sensor Dropout" | "Signal Noise" | "Image Freeze">("None");

  // Radar Params
  const [radRange, setRadRange] = useState(180);
  const [radClutter, setRadClutter] = useState<"Low" | "Medium" | "High">("Low");
  const [radInterfere, setRadInterfere] = useState(false);
  const [radVelNoise, setRadVelNoise] = useState(1.2);
  const [radFail, setRadFail] = useState<"None" | "Target Blindness" | "Frequency Jamming" | "Full Outage">("None");

  // GPS Params
  const [gpsLat, setGpsLat] = useState(37.4220);
  const [gpsLng, setGpsLng] = useState(-122.0841);
  const [gpsSats, setGpsSats] = useState(12);
  const [gpsLock, setGpsLock] = useState<"None" | "2D" | "3D" | "DGPS">("3D");
  const [gpsHdop, setGpsHdop] = useState(1.0);
  const [gpsFail, setGpsFail] = useState<"None" | "Multipath Echo" | "Satellite Droop" | "Coordinates Frozen">("None");

  // IMU Params
  const [imuBias, setImuBias] = useState(0.05);
  const [imuNoise, setImuNoise] = useState(0.02);
  const [imuDrift, setImuDrift] = useState(0.01);
  const [imuCalib, setImuCalib] = useState<"Calibrated" | "Uncalibrated" | "Drift Fault">("Calibrated");

  // Message banner states
  const [notification, setNotification] = useState("");

  const handleApplyToScratchpad = (profile: SensorProfile) => {
    setProfileName(profile.name);
    setProfileDesc(profile.description);
    setSpeed(profile.speed);
    setSteering(profile.steeringAngle);
    setGear(profile.gear);
    setThrottle(profile.throttle);
    setBrake(profile.brake);
    setBatterySoc(profile.batterySoc);
    setBatteryTemp(profile.batteryTemp);
    setCabinTemp(profile.cabinTemp);
    
    setCamRes(profile.camera.resolution);
    setCamFps(profile.camera.fps);
    setCamObstruct(profile.camera.obstruction);
    setCamGlare(profile.camera.glare);
    setCamFail(profile.camera.failure);

    setRadRange(profile.radar.range);
    setRadClutter(profile.radar.clutter);
    setRadInterfere(profile.radar.interference);
    setRadVelNoise(profile.radar.velNoise);
    setRadFail(profile.radar.failure);

    setGpsLat(profile.gps.lat);
    setGpsLng(profile.gps.lng);
    setGpsSats(profile.gps.satellites);
    setGpsLock(profile.gps.lock);
    setGpsHdop(profile.gps.hdop);
    setGpsFail(profile.gps.failure);

    setImuBias(profile.imu.alphaBias);
    setImuNoise(profile.imu.gyroNoise);
    setImuDrift(profile.imu.driftRate);
    setImuCalib(profile.imu.calibration);

    setNotification(`Applied values from profile "${profile.name}" to workbench form.`);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleCompileAndSave = () => {
    const rawProfile: SensorProfile = {
      id: `profile_${Date.now()}`,
      name: profileName || "Custom Workspace Profile",
      description: profileDesc || "User configured ADAS testing thresholds.",
      speed,
      steeringAngle: steering,
      gear,
      throttle,
      brake,
      batterySoc,
      batteryTemp,
      cabinTemp,
      camera: {
        resolution: camRes,
        fps: camFps,
        obstruction: camObstruct,
        glare: camGlare,
        failure: camFail
      },
      radar: {
        range: radRange,
        clutter: radClutter,
        interference: radInterfere,
        velNoise: radVelNoise,
        failure: radFail
      },
      gps: {
        lat: gpsLat,
        lng: gpsLng,
        satellites: gpsSats,
        lock: gpsLock,
        hdop: gpsHdop,
        failure: gpsFail
      },
      imu: {
        alphaBias: imuBias,
        gyroNoise: imuNoise,
        driftRate: imuDrift,
        calibration: imuCalib
      }
    };

    saveNewProfile(rawProfile);
    setNotification(`Successfully compiled and saved Profile "${rawProfile.name}"!`);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleApplyCurrentWorkbenchToVehicle = () => {
    const compiledProfile: SensorProfile = {
      id: `current_active_sim`,
      name: profileName || "Active Simulator Tuning",
      description: profileDesc,
      speed,
      steeringAngle: steering,
      gear,
      throttle,
      brake,
      batterySoc,
      batteryTemp,
      cabinTemp,
      camera: {
        resolution: camRes,
        fps: camFps,
        obstruction: camObstruct,
        glare: camGlare,
        failure: camFail
      },
      radar: {
        range: radRange,
        clutter: radClutter,
        interference: radInterfere,
        velNoise: radVelNoise,
        failure: radFail
      },
      gps: {
        lat: gpsLat,
        lng: gpsLng,
        satellites: gpsSats,
        lock: gpsLock,
        hdop: gpsHdop,
        failure: gpsFail
      },
      imu: {
        alphaBias: imuBias,
        gyroNoise: imuNoise,
        driftRate: imuDrift,
        calibration: imuCalib
      }
    };
    loadAndApplyProfile(compiledProfile);
    setNotification(`Successfully synchronized workbench configuration to running VHAL registers.`);
    setTimeout(() => setNotification(""), 4000);
  };

  return (
    <div className="flex flex-col h-full text-zinc-200 select-none animate-fade-in font-sans space-y-5">
      
      {/* Top Banner Alert notification */}
      {notification && (
        <div className="bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 p-2.5 rounded-md text-xs font-mono tracking-wide flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <Radio size={12} className="text-indigo-400 animate-ping" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification("")} className="text-[10px] text-zinc-500 hover:text-zinc-300">Dismiss</button>
        </div>
      )}

      {/* Main Layout Divided into: Top Profile console, Bottom detailed parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Profile Loader & Save Console Panel (1/4 Column) */}
        <div className="lg:col-span-1 bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between space-y-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-2">
              <span className="p-1 text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded font-bold">PROFILES</span>
              <h3 className="text-sm font-semibold text-zinc-100">Dynamic Profile Manager</h3>
            </div>

            {/* Profile list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
              {savedProfiles.map((p) => {
                const isActive = activeProfileName === p.name;
                return (
                  <div 
                    key={p.id}
                    className={`p-2.5 rounded border transition group ${
                      isActive 
                        ? "bg-indigo-600/15 border-indigo-500 text-zinc-100 font-extrabold" 
                        : "bg-[#0c0c0e] border-[#1c1c1f] hover:border-zinc-750"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="cursor-pointer truncate pr-2 w-full" onClick={() => handleApplyToScratchpad(p)}>
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold text-xs ${isActive ? "text-indigo-300" : "text-zinc-200"}`}>{p.name}</span>
                          {p.isPreset && <span className="text-[7.5px] px-1 bg-zinc-800/85 border border-zinc-700/50 text-zinc-400 rounded font-bold shrink-0">PRESET</span>}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate leading-tight">{p.description}</p>
                      </div>

                      {/* Options buttons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Apply immediate */}
                        <button
                          id={`apply-profile-right-now-${p.id}`}
                          onClick={() => loadAndApplyProfile(p)}
                          className="p-1 bg-[#111114] hover:bg-zinc-800 border border-[#1c1c1f] text-[9px] rounded text-emerald-400 hover:text-white transition cursor-pointer font-bold select-none"
                          title="Inject Profile straight into Simulator"
                        >
                          APPLY
                        </button>
                        
                        {/* Delete custom ones */}
                        {!p.isPreset && (
                          <button
                            id={`delete-profile-${p.id}`}
                            onClick={() => deleteProfile(p.id)}
                            className="p-1 hover:bg-rose-500/10 text-rose-400 rounded transition cursor-pointer shrink-0"
                            title="Delete custom profile"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Profile Details Scratpad form fields */}
            <div className="bg-[#0c0c0e] p-2.5 rounded border border-[#1c1c1f] space-y-2 text-xs">
              <div className="font-bold text-[10px] text-zinc-400 border-b border-zinc-900 pb-1.5">Save Current Workbench</div>
              
              <div>
                <label className="text-[9px] text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold">Profile Name</label>
                <input 
                  id="profile-name-input"
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Freezing Rain Failures"
                  className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2.5 py-1 text-zinc-100 outline-none focus:border-zinc-750 font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-500 block mb-0.5 uppercase tracking-wider font-bold">Description</label>
                <input 
                  id="profile-desc-input"
                  type="text" 
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="Dense road mud splash triggering ADAS dropout"
                  className="w-full bg-[#111114] border border-[#1c1c1f] rounded px-2.5 py-1 text-zinc-100 outline-none focus:border-zinc-750"
                />
              </div>

              <button
                id="save-scratchpad-profile-btn"
                onClick={handleCompileAndSave}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer select-none"
              >
                <Save size={12} />
                <span>Save to Profile Registry</span>
              </button>
            </div>
          </div>

          <button
            id="sync-workbench-to-truck-btn"
            onClick={handleApplyCurrentWorkbenchToVehicle}
            className="w-full py-2.5 px-3 rounded-lg font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition text-center select-none shadow cursor-pointer uppercase tracking-wider leading-none"
          >
            Synchronize SIM to VHAL
          </button>
        </div>

        {/* Detailed parameters tuning bento board (3/4 Columns) */}
        <div className="lg:col-span-3 flex flex-col space-y-6">
          
          {/* Top Panel: General Vehicle Overrides inside Profile scratchpad */}
          <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-5 shadow-md">
            <div className="flex items-center space-x-2 border-b border-[#1c1c1f] pb-2 mb-3">
              <Sliders size={14} className="text-blue-400" />
              <h3 className="text-xs uppercase font-extrabold text-zinc-350 tracking-wider">General Kinematic Core Tuning (Workbench)</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              {/* Speed slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Speed (km/h)</span>
                  <span className="text-zinc-200 font-bold">{speed}</span>
                </div>
                <input 
                  id="profile-speed-slider"
                  type="range" min="0" max="180" value={speed} 
                  onChange={(e) => {
                    const sp = parseInt(e.target.value);
                    setSpeed(sp);
                    if (sp > 0) setThrottle(Math.round(sp / 1.8));
                  }} 
                  className="w-full accent-indigo-500 cursor-pointer" 
                />
              </div>

              {/* Steering slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Steering Angle (deg)</span>
                  <span className="text-zinc-200 font-bold">{steering}°</span>
                </div>
                <input 
                  id="profile-steering-slider"
                  type="range" min="-180" max="180" value={steering} 
                  onChange={(e) => setSteering(parseInt(e.target.value))} 
                  className="w-full accent-indigo-500 cursor-pointer" 
                />
              </div>

              {/* SoC Slider */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-zinc-500">Battery SoC (%)</span>
                  <span className="text-emerald-400 font-bold">{batterySoc}%</span>
                </div>
                <input 
                  id="profile-soc-slider"
                  type="range" min="0" max="100" value={batterySoc} 
                  onChange={(e) => setBatterySoc(parseInt(e.target.value))} 
                  className="w-full accent-emerald-500 cursor-pointer" 
                />
              </div>

              {/* Drivetrain Gear Selection */}
              <div className="space-y-1 flex flex-col justify-between h-full pb-0.5">
                <span className="text-zinc-500 text-[10.5px]">Active Driving Gear</span>
                <div className="flex items-center space-x-1.5 font-bold text-[10px]">
                  {(["P", "R", "N", "D"] as const).map((g) => (
                    <button
                      id={`profile-gear-select-${g}`}
                      key={g}
                      onClick={() => setGear(g)}
                      className={`flex-1 h-6 flex items-center justify-center rounded border transition duration-100 cursor-pointer ${
                        gear === g 
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-400 font-extrabold" 
                          : "bg-[#0c0c0e] border-[#1c1c1f] text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Sub Sensor Hardware configs (Camera, Radar, GPS, IMU quadrants) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            {/* Card 1: Camera Suite Override Config */}
            <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <Camera size={13} className="text-indigo-400" />
                  <span className="text-xs uppercase font-extrabold text-zinc-300">Camera Lens & Optic Sensor</span>
                </div>
                {camFail !== "None" ? (
                  <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded px-1 animate-pulse font-bold">FAULT ACTIVE</span>
                ) : (
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1 font-bold">ONLINE</span>
                )}
              </div>

              <div className="space-y-3.5 text-[11px]">
                
                {/* Resolution and framerate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">RESOLUTION</label>
                    <select 
                      id="profile-cam-res"
                      value={camRes} onChange={(e) => setCamRes(e.target.value as any)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                    >
                      <option value="720p">720p (Analog SVD)</option>
                      <option value="1080p">1080p (High-Definition)</option>
                      <option value="4K">4K (Ultra UHD Telematics)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">FRAME RATE</label>
                    <select 
                      id="profile-cam-fps"
                      value={camFps} onChange={(e) => setCamFps(Number(e.target.value) as any)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                    >
                      <option value="15">15 FPS (Braking Fallbacks)</option>
                      <option value="30">30 FPS (Standard Autopilot)</option>
                      <option value="60">60 FPS (Super Highway HD)</option>
                    </select>
                  </div>
                </div>

                {/* Glass Obstructions */}
                <div>
                  <label className="text-zinc-500 block mb-1 font-mono">OPTIC GLASS OBSTRUCTIONS</label>
                  <div className="flex gap-1">
                    {(["None", "Raindrops", "Mud Splatter", "Heavy Snow"] as const).map((obs) => (
                      <button
                        id={`profile-cam-obstruct-${obs.replace(" ", "")}`}
                        key={obs}
                        onClick={() => setCamObstruct(obs)}
                        className={`flex-1 py-1 px-0.5 text-[9px] rounded border transition font-medium cursor-pointer uppercase ${
                          camObstruct === obs 
                            ? "bg-indigo-600/15 border-indigo-500 text-indigo-400" 
                            : "bg-[#0c0c0e] border-[#1c1c1f] hover:text-zinc-300 text-zinc-550"
                        }`}
                      >
                        {obs.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Failure Options */}
                <div>
                  <label className="text-zinc-500 block mb-0.5 font-mono">SIMULATION FAILURE MODE</label>
                  <select 
                    id="profile-cam-fail"
                    value={camFail} onChange={(e) => setCamFail(e.target.value as any)}
                    className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                  >
                    <option value="None">None (Pristine Video stream)</option>
                    <option value="Sensor Dropout">Sensor Dropout (VHAL reports dead hardware - binder error 0x05)</option>
                    <option value="Signal Noise">Signal Noise (Packet jitter causing random object block dropouts)</option>
                    <option value="Image Freeze">Image Freeze (Frozen last valid frame. Dangerous latch error)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Card 2: Radar Radial Array Config */}
            <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <Radio size={13} className="text-blue-400" />
                  <span className="text-xs uppercase font-extrabold text-zinc-300">Radar Front Sensor System</span>
                </div>
                {radFail !== "None" ? (
                  <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded px-1 animate-pulse font-bold">FAULT ACTIVE</span>
                ) : (
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1 font-bold">ONLINE</span>
                )}
              </div>

              <div className="space-y-3.5 text-[11px]">
                
                {/* Ranging lock */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-zinc-500">RADAR LOCKING RANGE</span>
                    <span className="text-zinc-300 font-bold">{radRange}m</span>
                  </div>
                  <input 
                    id="profile-rad-range-slider"
                    type="range" min="30" max="250" value={radRange} 
                    onChange={(e) => setRadRange(parseInt(e.target.value))} 
                    className="w-full accent-blue-500 cursor-pointer" 
                  />
                </div>

                {/* Clutter, Jamming selector */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">LOCK CLUTTER LEVEL</label>
                    <select 
                      id="profile-rad-clutter"
                      value={radClutter} onChange={(e) => setRadClutter(e.target.value as any)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                    >
                      <option value="Low">Low Clutter (Open highway)</option>
                      <option value="Medium">Medium Clutter (Suburban street echoes)</option>
                      <option value="High">High Clutter (Tunnels, metal divider reflections)</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center space-x-1.5 h-7 cursor-pointer text-[10.5px]">
                      <input 
                        id="profile-rad-interfere-chk"
                        type="checkbox" checked={radInterfere} 
                        onChange={(e) => setRadInterfere(e.target.checked)} 
                        className="rounded border-[#1c1c1f] bg-[#0c0c0e] w-3.5 h-3.5 text-blue-500 accent-blue-550 cursor-pointer" 
                      />
                      <span className="text-zinc-450 select-none">RF Jam Interfered</span>
                    </label>
                  </div>
                </div>

                {/* Radar failure mode */}
                <div>
                  <label className="text-zinc-500 block mb-0.5 font-mono">RADAR SIMULATION FAILURE SYSTEM</label>
                  <select 
                    id="profile-rad-fail"
                    value={radFail} onChange={(e) => setRadFail(e.target.value as any)}
                    className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                  >
                    <option value="None">None (Pristine Front Echo tracking)</option>
                    <option value="Target Blindness">Target Blindness (Radar ignores obstacles closer than 10 meters)</option>
                    <option value="Frequency Jamming">Frequency Jamming (Extreme noise spikes, erratic targeting data)</option>
                    <option value="Full Outage">Full Outage (Sensor transmits empty tracking packet - BINDER_NO_REPLY)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Card 3: GPS Geopositioning Module */}
            <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <MapPin size={13} className="text-emerald-400" />
                  <span className="text-xs uppercase font-extrabold text-zinc-300">GPS Spatial Geopositioning</span>
                </div>
                {gpsFail !== "None" ? (
                  <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded px-1 animate-pulse font-bold">FAULT ACTIVE</span>
                ) : (
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1 font-bold">ONLINE</span>
                )}
              </div>

              <div className="space-y-3.5 text-[11px]">
                
                {/* Coordinates mock inputs */}
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div>
                    <label className="text-zinc-500 block font-mono">LATITUDE</label>
                    <input 
                      id="profile-gps-lat"
                      type="number" step="0.0001" value={gpsLat} 
                      onChange={(e) => setGpsLat(parseFloat(e.target.value) || 37.4220)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-100 font-mono text-center" 
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block font-mono">LONGITUDE</label>
                    <input 
                      id="profile-gps-lng"
                      type="number" step="0.0001" value={gpsLng} 
                      onChange={(e) => setGpsLng(parseFloat(e.target.value) || -122.0841)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-100 font-mono text-center" 
                    />
                  </div>
                </div>

                {/* Satellites lock and count */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">SATELLITE COUNTERS</label>
                    <input 
                      id="profile-gps-sats"
                      type="number" min="0" max="24" value={gpsSats} 
                      onChange={(e) => setGpsSats(parseInt(e.target.value) || 0)} 
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-100 font-mono text-center text-[10.5px]" 
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">COCKPIT LOCK TYPE</label>
                    <select 
                      id="profile-gps-lock"
                      value={gpsLock} onChange={(e) => setGpsLock(e.target.value as any)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                    >
                      <option value="None">None (Searching sky view...)</option>
                      <option value="2D">2D Lock (Horizontal only. Jittering)</option>
                      <option value="3D">3D Lock (High elevation mapping)</option>
                      <option value="DGPS">DGPS Differential (Pristine precise lock)</option>
                    </select>
                  </div>
                </div>

                {/* Failure Modes */}
                <div>
                  <label className="text-zinc-500 block mb-0.5 font-mono">GPS CONCENTRIC FAILURES</label>
                  <select 
                    id="profile-gps-fail"
                    value={gpsFail} onChange={(e) => setGpsFail(e.target.value as any)}
                    className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                  >
                    <option value="None">None (Unobstructed satellite lock)</option>
                    <option value="Multipath Echo">Multipath Echo (Urban reflections bounce signals, HDOP peaks at 9.2)</option>
                    <option value="Satellite Droop">Satellite Droop (Gradual lock decaying. Sat count dwindles rapidly)</option>
                    <option value="Coordinates Frozen">Coordinates Frozen (Lat/Lng locked to last valid coordinate despite speed)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Card 4: Kinematic IMU Vector Array */}
            <div className="bg-[#111114] border border-[#1c1c1f] rounded-lg p-4 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1c1c1f] pb-2 mb-3">
                <div className="flex items-center space-x-1.5">
                  <Compass size={13} className="text-violet-400" />
                  <span className="text-xs uppercase font-extrabold text-zinc-300">Inertial Measurement Unit (IMU)</span>
                </div>
                {imuCalib !== "Calibrated" ? (
                  <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded px-1 animate-pulse font-bold">FAULT ACTIVE</span>
                ) : (
                  <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded px-1 font-bold">ONLINE</span>
                )}
              </div>

              <div className="space-y-3.5 text-[11px]">
                
                {/* Micro Electro-Mech sensor sliders (biases, noise, drifts) */}
                <div className="grid grid-cols-2 gap-3.5">
                  
                  <div className="space-y-0.5">
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-zinc-500">ACCEL ZERO-BIAS</span>
                      <span className="text-zinc-300">{imuBias} m/s²</span>
                    </div>
                    <input 
                      id="profile-imu-bias"
                      type="range" min="0" max="1" step="0.01" value={imuBias} 
                      onChange={(e) => setImuBias(parseFloat(e.target.value))} 
                      className="w-full accent-violet-500 cursor-pointer" 
                    />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between font-mono text-[9px]">
                      <span className="text-zinc-500">GYRO NOISE VAR</span>
                      <span className="text-zinc-300">{imuNoise} rad/s</span>
                    </div>
                    <input 
                      id="profile-imu-noise"
                      type="range" min="0" max="0.2" step="0.01" value={imuNoise} 
                      onChange={(e) => setImuNoise(parseFloat(e.target.value))} 
                      className="w-full accent-violet-500 cursor-pointer" 
                    />
                  </div>

                </div>

                {/* IMU Drift calibration system */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">HEADING DRIFT OFFSET</label>
                    <input 
                      id="profile-imu-drift"
                      type="number" step="0.005" min="0" max="0.5" value={imuDrift} 
                      onChange={(e) => setImuDrift(parseFloat(e.target.value) || 0)} 
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-100 font-mono text-center text-[10.5px]" 
                    />
                  </div>

                  <div>
                    <label className="text-zinc-500 block mb-0.5 font-mono">CALIBRATION REGISTER</label>
                    <select 
                      id="profile-imu-calib"
                      value={imuCalib} onChange={(e) => setImuCalib(e.target.value as any)}
                      className="w-full bg-[#0c0c0e] border border-[#1c1c1f] rounded p-1 text-zinc-350 cursor-pointer text-[10.5px]"
                    >
                      <option value="Calibrated">Calibrated (Offset registers synchronized)</option>
                      <option value="Uncalibrated">Uncalibrated (Requires 50-meter straight flight path)</option>
                      <option value="Drift Fault">Drift Fault (Erratic temperature drift, VHAL warning)</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
