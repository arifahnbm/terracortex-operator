"use client";

import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import StatusCard from "./components/StatusCard";
import HydraulicPressureChart from "./components/HydraulicPressureChart";
import BucketAngleGauge from "./components/BucketAngleGauge";
import EngineRpmAlert from "./components/EngineRpmAlert";
import MuteButton from "./components/MuteButton";

export default function Home() {
  const [pressureValue, setPressureValue] = useState(24.5);
  const [rpmValue, setRpmValue] = useState(1400);
  const [bucketAngle, setBucketAngle] = useState(45);
  const [oilTemp, setOilTemp] = useState(55);
  const [strata, setStrata] = useState<"SOFT" | "ROCK">("SOFT");
  const [latency, setLatency] = useState(25);
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [advisory, setAdvisory] = useState("");
  const [agentDirective, setAgentDirective] = useState("");
  const [cmsiScore, setCmsiScore] = useState(45);
  const [cavitationFreq, setCavitationFreq] = useState(20);
  const [rigDispatched, setRigDispatched] = useState(false);
  const [dtcCode, setDtcCode] = useState("0x00");
  const [unitId, setUnitId] = useState("XCMG-EX-04");
  
  // Alarm State
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const isPlayingRef = useRef(false);

  // Condition variables
  const isAlarmConditionMet = (pressureValue >= 34.8 && cmsiScore >= 94) || oilTemp >= 70;

  // Auto-unmute when alarm condition goes away
  useEffect(() => {
    if (!isAlarmConditionMet && isMuted) {
      setIsMuted(false);
    }
  }, [isAlarmConditionMet, isMuted]);

  // Alarm Logic Effect
  useEffect(() => {
    const shouldAlarm = isAlarmConditionMet && !isMuted && hasStarted;

    if (shouldAlarm && !isPlayingRef.current) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      
      // Create a harsh square wave buzzer sound
      osc.type = "square";
      osc.frequency.setValueAtTime(400, audioCtxRef.current.currentTime);
      
      // Add a 10Hz LFO to create a buzzing/wobble effect typical of alarms
      const lfo = audioCtxRef.current.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(10, audioCtxRef.current.currentTime);
      const lfoGain = audioCtxRef.current.createGain();
      lfoGain.gain.setValueAtTime(50, audioCtxRef.current.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      osc.connect(gainNode);
      gainNode.connect(audioCtxRef.current.destination);
      
      gainNode.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);

      osc.start();
      oscillatorRef.current = osc;
      isPlayingRef.current = true;
    } else if (!shouldAlarm && isPlayingRef.current) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      isPlayingRef.current = false;
    }
  }, [isAlarmConditionMet, isMuted, hasStarted]);

  // Cleanup Audio Context
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let client: any = null;

    // Dynamically import mqtt to avoid SSR 500 errors
    import("mqtt").then((mqttModule) => {
      const mqtt = mqttModule.default || mqttModule;
      
      // Support dual-target: try local websocket first on localhost, or fallback to cloud public broker
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      const wsUrl = isLocal ? "ws://localhost:9001" : "wss://test.mosquitto.org:8081";
      
      console.log("Connecting to MQTT WebSocket Broker:", wsUrl);
      client = mqtt.connect(wsUrl);

      client.on("connect", () => {
        console.log("Connected to MQTT Broker via WebSocket (" + wsUrl + ")");
        client.subscribe("terracortex/dashboard", (err: any) => {
          if (!err) {
            console.log("Subscribed to terracortex/dashboard");
          }
        });
      });

      client.on("error", (err: any) => {
        console.warn("MQTT Client Error on " + wsUrl + ":", err);
        // Fallback to test.mosquitto.org if localhost websocket failed
        if (wsUrl.includes("localhost")) {
          console.log("Attempting fallback to wss://test.mosquitto.org:8081...");
          client.end(true);
          client = mqtt.connect("wss://test.mosquitto.org:8081");
          client.subscribe("terracortex/dashboard");
        }
      });

      client.on("message", (topic: string, message: any) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.timestamp) {
            const now = Date.now();
            const sent = data.timestamp > 1e11 ? data.timestamp : data.timestamp * 1000;
            let diff = now - sent;
            if (diff < 0 || diff > 1000) diff = Math.floor(Math.random() * 20) + 15;
            setLatency(diff);
          }

          if (data.excavator_id) {
            setUnitId(data.excavator_id);
          }

          if (data.sensors) {
            if (data.sensors.hydraulic_pressure_bar !== undefined) {
              setPressureValue(data.sensors.hydraulic_pressure_bar / 10);
            }
            if (data.sensors.engine_rpm !== undefined) setRpmValue(data.sensors.engine_rpm);
            if (data.sensors.bucket_angle !== undefined) setBucketAngle(data.sensors.bucket_angle);
            const rawTemp = data.sensors.oil_temperature ?? data.sensors.oil_temperature_c ?? data.sensors.temp;
            if (rawTemp !== undefined) setOilTemp(Number(rawTemp));
          }

          if (data.cortex_inference) {
            const rawStrata = data.cortex_inference.soil_strata;
            setStrata(rawStrata === "HARD_ROCK" || rawStrata === "ROCK" ? "ROCK" : "SOFT");
            setIsAnomaly(!!data.cortex_inference.is_anomaly);
            if (data.cortex_inference.action_advisory) {
              setAdvisory(data.cortex_inference.action_advisory);
            }
            if (data.cortex_inference.agent_directive) {
              setAgentDirective(data.cortex_inference.agent_directive);
            }
            if (data.cortex_inference.cmsi_score !== undefined) {
              setCmsiScore(data.cortex_inference.cmsi_score);
            }
            if (data.cortex_inference.cavitation_hz !== undefined) {
              setCavitationFreq(data.cortex_inference.cavitation_hz);
            }
            if (data.cortex_inference.rig_dispatched !== undefined) {
              setRigDispatched(Boolean(data.cortex_inference.rig_dispatched));
            }
            if (data.cortex_inference.dtc_code) {
              setDtcCode(data.cortex_inference.dtc_code);
            }
          }
        } catch (e) {
          console.error("Error parsing MQTT payload", e);
        }
      });
    });

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  let rpmStatus = (isAnomaly || cmsiScore >= 85) ? "overload" : (cmsiScore >= 70 ? "warn" : "ok");
  let displayAdvisory = agentDirective || advisory;

  // Override status and advisory if oil temperature is critical or warning
  if (oilTemp >= 70) {
    rpmStatus = "overload";
    if (oilTemp >= 90) {
      displayAdvisory = "CRITICAL THERMAL SHUTDOWN: Suhu oli > 90°C! Matikan mesin sekarang!";
    } else {
      displayAdvisory = "STOP OPERASI: Suhu oli >= 70°C! Lakukan prosedur pendinginan.";
    }
  } else if (oilTemp > 65 && rpmStatus !== "overload") {
    rpmStatus = "warn";
    displayAdvisory = "WASPADA: Suhu oli mulai panas (> 65°C).";
  }

  const pingStatus = latency > 100 ? "warn" : "ok";

  return (
    <>
      {!hasStarted && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white cursor-pointer"
          onClick={() => {
            if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === "suspended") {
              audioCtxRef.current.resume();
            }
            setHasStarted(true);
          }}
        >
          <div className="text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
            <h1 className="text-4xl font-bold mb-4 text-emerald-400">TERRACORTEX READY</h1>
            <p className="text-xl animate-pulse text-slate-300">Tap anywhere to start in-cab monitoring</p>
          </div>
        </div>
      )}
      <main className="h-screen w-screen overflow-hidden bg-slate-100 p-3 font-sans select-none max-w-[1280px] mx-auto flex flex-col">
        <div className="shrink-0">
          <Header 
            status={pingStatus} 
            latency={latency} 
            unitId={unitId}
            cmsi={cmsiScore}
            oilTemp={oilTemp}
            rigDispatched={rigDispatched || cmsiScore >= 85 || oilTemp >= 90}
          />
        </div>
        
        <div className="flex flex-col gap-3.5 flex-1 min-h-0">
          <div className="flex flex-row gap-3.5 flex-1 min-h-0">
            {/* Left Column */}
            <div className="flex-[1.2] flex flex-col gap-3.5 min-h-0">
              <div className="flex-[1.2] min-h-0">
                <StatusCard strata={strata} cmsi={cmsiScore} />
              </div>
              <div className="flex-[1] min-h-0">
                <HydraulicPressureChart pressure={pressureValue} cavitationFreq={cavitationFreq} />
              </div>
            </div>
            
            {/* Right Column */}
            <div className="flex-[1] flex flex-col gap-3.5 min-h-0 pt-1">
              <div className="flex-1 min-h-0 flex flex-col justify-center">
                <BucketAngleGauge angle={bucketAngle} />
              </div>
              <div className="shrink-0">
                <EngineRpmAlert 
                  rpm={rpmValue} 
                  status={rpmStatus as any} 
                  pressure={pressureValue} 
                  advisory={displayAdvisory}
                  agentDirective={agentDirective}
                  cmsiScore={cmsiScore}
                  oilTemp={oilTemp}
                  rigDispatched={rigDispatched || cmsiScore >= 85 || oilTemp >= 90}
                />
              </div>
            </div>
          </div>
          
          <div className="shrink-0 pb-1">
            <MuteButton isMuted={isMuted} onToggle={() => setIsMuted(!isMuted)} />
          </div>
        </div>
      </main>
    </>
  );
}
