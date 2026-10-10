interface EngineRpmAlertProps {
  rpm: number;
  status: "ok" | "warn" | "overload";
  pressure: number;
  advisory?: string;
  agentDirective?: string;
  cmsiScore?: number;
  oilTemp?: number;
  rigDispatched?: boolean;
}

export default function EngineRpmAlert({ 
  rpm, 
  status, 
  pressure, 
  advisory,
  agentDirective,
  cmsiScore = 45,
  oilTemp = 55,
  rigDispatched = false
}: EngineRpmAlertProps) {
  const isOverload = status === "overload" || cmsiScore >= 85 || oilTemp >= 70;
  const isCriticalThermal = oilTemp >= 90;
  
  // Calculate percentage for the indicator line (0 to 2000 RPM mapped to 0% to 100%)
  const indicatorPos = Math.min(100, Math.max(0, (rpm / 2000) * 100));

  const directiveText = agentDirective || advisory || (
    isCriticalThermal 
      ? "CRITICAL THERMAL SHUTDOWN: Suhu oli > 90°C! Segera matikan pompa hidrolik demi keselamatan!"
      : isOverload
        ? "DERATE DIGGING ENVELOPE 30%: Batasi hentakan pada formasi keras. Standby untuk Mobile Rig Alpha."
        : status === "warn"
          ? "Check engine metrics and avoid prolonged relief valve stall."
          : "Maintain current penetration angle. Ground conditions nominal."
  );

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-baseline mb-2">
        <h2 className="text-xl font-bold text-gray-900">Target Engine RPM: {rpm} RPM</h2>
        <span className="text-xs font-semibold text-gray-500 uppercase">Limit: 2000 RPM</span>
      </div>
      
      {/* RPM Bar */}
      <div className="relative mb-5">
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-200">
          <div className="w-[30%] bg-gray-400"></div>
          <div className="w-[30%] bg-green-500"></div>
          <div className="w-[40%] bg-red-600"></div>
        </div>
        {/* Indicator */}
        <div 
          className="absolute top-[-8px] bottom-[-8px] w-[3px] bg-gray-950 shadow-xs z-10 transition-all duration-200" 
          style={{ left: `${indicatorPos}%` }}
        ></div>
        
        {/* Labels */}
        <div className="flex justify-between mt-1.5 text-xs font-bold text-gray-600">
          <div>0<br/>RPM</div>
          <div>1400<br/>RPM</div>
          <div>1800<br/>RPM</div>
          <div>2000<br/>RPM</div>
        </div>
      </div>
      
      {/* Autonomous In-Cab Agent Directive Box */}
      <div className={`rounded-xl p-4 flex gap-3.5 shadow-md transition-all duration-300 border ${
        isCriticalThermal
          ? "bg-rose-100 border-rose-400 ring-2 ring-rose-500/50"
          : isOverload 
            ? "bg-red-50 border-red-300 ring-1 ring-red-400/40" 
            : status === "warn" 
              ? "bg-orange-50 border-orange-200" 
              : "bg-white border-gray-300"
      }`}>
        <div className="shrink-0 mt-0.5">
          {isOverload ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isCriticalThermal ? "text-red-700 animate-bounce" : "text-red-600"}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ) : status === "warn" ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-black text-xs uppercase tracking-wide flex items-center gap-1.5 ${
              isCriticalThermal
                ? "text-red-900"
                : isOverload 
                  ? "text-red-800" 
                  : status === "warn" 
                    ? "text-orange-800" 
                    : "text-slate-800"
            }`}>
              <span>🤖 TERRACORTEX AGENT DIRECTIVE</span>
              {isOverload && <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>}
            </h3>

            {rigDispatched && (
              <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                RIG DISPATCHED
              </span>
            )}
          </div>

          <p className={`text-sm font-semibold leading-snug ${
            isCriticalThermal 
              ? "text-red-950 font-bold" 
              : isOverload 
                ? "text-red-900" 
                : status === "warn" 
                  ? "text-orange-900" 
                  : "text-slate-700"
          }`}>
            {directiveText}
          </p>
        </div>
      </div>
    </div>
  );
}
