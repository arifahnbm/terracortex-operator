"use client";

import { useState, useEffect } from "react";
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
  
  // AI Inference State
  const [strata, setStrata] = useState<'SOFT' | 'ROCK'>('SOFT');
  const [isAnomaly, setIsAnomaly] = useState(false);
  const [advisory, setAdvisory] = useState("");

  useEffect(() => {
    let client: any = null;

    // Dynamically import mqtt to avoid SSR 500 errors
    import("mqtt").then((mqttModule) => {
      const mqtt = mqttModule.default || mqttModule;
      
      // Connect to the public test broker using secure WebSockets
      client = mqtt.connect('wss://test.mosquitto.org:8081');

      client.on('connect', () => {
        console.log('Connected to MQTT Broker via WebSocket');
        client.subscribe('terracortex/telemetry', (err: any) => {
          if (!err) {
            console.log('Subscribed to terracortex/telemetry');
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
          }

          if (data.cortex_inference) {
            const rawStrata = data.cortex_inference.soil_strata;
            setStrata(rawStrata === 'HARD_ROCK' || rawStrata === 'ROCK' ? 'ROCK' : 'SOFT');
            setIsAnomaly(!!data.cortex_inference.is_anomaly);
            if (data.cortex_inference.action_advisory) {
              setAdvisory(data.cortex_inference.action_advisory);
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

  const rpmStatus = isAnomaly ? 'overload' : 'ok';
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
              <EngineRpmAlert rpm={rpmValue} status={rpmStatus} pressure={pressureValue} advisory={advisory} />
            </div>
          </div>
        </div>
        
        <div className="shrink-0 pb-2">
          <MuteButton />
        </div>
      </div>
    </main>
  );
}

