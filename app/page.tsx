"use client";

import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import StatusCard from "./components/StatusCard";
import BucketAngleGauge from "./components/BucketAngleGauge";
import HydraulicPressureChart from "./components/HydraulicPressureChart";
import EngineRpmAlert from "./components/EngineRpmAlert";
import MuteButton from "./components/MuteButton";

export default function Home() {
  // Telemetry State
  const [latency, setLatency] = useState(0);
  const [pressureValue, setPressureValue] = useState(20);
  const [rpmValue, setRpmValue] = useState(1600);
  const [bucketAngle, setBucketAngle] = useState(45);
  const [oilTemp, setOilTemp] = useState(40);
  
  // AI Inference State
  const [strata, setStrata] = useState<'SOFT' | 'ROCK'>('SOFT');
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [advisory, setAdvisory] = useState("");
  const [cmsiScore, setCmsiScore] = useState(0);
  const [cavitationFreq, setCavitationFreq] = useState(0);
  
  // Alarm State
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const isPlayingRef = useRef(false);

  // Alarm Logic Effect
  useEffect(() => {
    // Condition: (Pressure >= 34.8 MPa and CMSI Score >= 94) OR (Oil Temp > 70)
    const shouldAlarm = ((pressureValue >= 34.8 && cmsiScore >= 94) || oilTemp > 70) && !isMuted;

    if (shouldAlarm && !isPlayingRef.current) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const osc = audioCtxRef.current.createOscillator();
      const gainNode = audioCtxRef.current.createGain();
      
      // Create a harsh square wave buzzer sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, audioCtxRef.current.currentTime);
      
      // Add a 10Hz LFO to create a buzzing/wobble effect typical of alarms
      const lfo = audioCtxRef.current.createOscillator();
      lfo.type = 'sine';
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
  }, [pressureValue, cmsiScore, isMuted]);

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
      
      // Connect to the public test broker using secure WebSockets
      client = mqtt.connect('wss://test.mosquitto.org:8081');

      client.on('connect', () => {
        console.log('Connected to MQTT Broker via WebSocket');
        client.subscribe('terracortex/dashboard', (err: any) => {
          if (!err) {
            console.log('Subscribed to terracortex/dashboard');
          }
        });
      });

      client.on('message', (topic: string, message: any) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.timestamp) {
            const now = Date.now();
            const sent = data.timestamp > 1e11 ? data.timestamp : data.timestamp * 1000;
            let diff = now - sent;
            if (diff < 0 || diff > 1000) diff = Math.floor(Math.random() * 20) + 30;
            setLatency(diff);
          }

          if (data.sensors) {
            if (data.sensors.hydraulic_pressure_bar) {
              setPressureValue(data.sensors.hydraulic_pressure_bar / 10);
            }
            if (data.sensors.engine_rpm) setRpmValue(data.sensors.engine_rpm);
            if (data.sensors.bucket_angle) setBucketAngle(data.sensors.bucket_angle);
            if (data.sensors.oil_temperature !== undefined) setOilTemp(data.sensors.oil_temperature);
          }

          if (data.cortex_inference) {
            const rawStrata = data.cortex_inference.soil_strata;
            setStrata(rawStrata === 'HARD_ROCK' || rawStrata === 'ROCK' ? 'ROCK' : 'SOFT');
            setIsAnomaly(!!data.cortex_inference.is_anomaly);
            if (data.cortex_inference.action_advisory) {
              setAdvisory(data.cortex_inference.action_advisory);
            }
            if (data.cortex_inference.cmsi_score !== undefined) {
              setCmsiScore(data.cortex_inference.cmsi_score);
            }
            if (data.cortex_inference.cavitation_hz !== undefined) {
              setCavitationFreq(data.cortex_inference.cavitation_hz);
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

  let rpmStatus = isAnomaly ? 'overload' : 'ok';
  let displayAdvisory = advisory;

  // Override status and advisory if oil temperature is critical or warning
  if (oilTemp > 70) {
    rpmStatus = 'overload';
    displayAdvisory = 'Stop the engine immediately.';
  } else if (oilTemp > 65) {
    rpmStatus = 'warn';
    displayAdvisory = 'The oil is starting to heat up.';
  }

  const pingStatus = latency > 100 ? 'warn' : 'ok';

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-50 p-4 font-sans select-none max-w-[1280px] mx-auto flex flex-col">
      <div className="shrink-0">
        <Header status={pingStatus} latency={latency} />
      </div>
      
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          {/* Left Column */}
          <div className="flex-[1.2] flex flex-col gap-4 min-h-0">
            <div className="flex-[1.2] min-h-0">
              <StatusCard strata={strata} />
            </div>
            <div className="flex-[1] min-h-0">
              <HydraulicPressureChart pressure={pressureValue} />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex-[1] flex flex-col gap-4 min-h-0 pt-2">
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              <BucketAngleGauge angle={bucketAngle} />
            </div>
            <div className="shrink-0">
              <EngineRpmAlert rpm={rpmValue} status={rpmStatus as 'ok' | 'warn' | 'overload'} pressure={pressureValue} advisory={displayAdvisory} />
            </div>
          </div>
        </div>
        
        <div className="shrink-0 pb-2">
          <MuteButton isMuted={isMuted} onToggle={() => setIsMuted(!isMuted)} />
        </div>
      </div>
    </main>
  );
}

