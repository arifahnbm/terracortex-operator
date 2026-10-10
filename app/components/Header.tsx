interface HeaderProps {
  status?: "ok" | "warn";
  latency?: number;
  unitId?: string;
  cmsi?: number;
  oilTemp?: number;
  rigDispatched?: boolean;
}

export default function Header({ 
  status = "ok", 
  latency = 50, 
  unitId = "XCMG-EX-04", 
  cmsi = 45, 
  oilTemp = 55, 
  rigDispatched = false 
}: HeaderProps) {
  const isWarn = status === "warn";
  const colorClass = isWarn ? "bg-red-600 shadow-[0_0_8px_#dc2626]" : "bg-green-500 shadow-[0_0_8px_#22c55e]";
  const textClass = isWarn ? "WARN" : "OK";

  const isCmsiCritical = cmsi >= 85;
  const isCmsiWarning = cmsi >= 70 && !isCmsiCritical;
  const cmsiBadgeColor = isCmsiCritical 
    ? "bg-red-100 text-red-800 border-red-300 ring-1 ring-red-400 animate-pulse"
    : isCmsiWarning
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : "bg-emerald-100 text-emerald-800 border-emerald-300";

  const isOilOverheat = oilTemp >= 90;
  const isOilWarm = oilTemp >= 70 && !isOilOverheat;
  const oilBadgeColor = isOilOverheat
    ? "bg-red-600 text-white border-red-700 animate-bounce font-black"
    : isOilWarm
      ? "bg-orange-100 text-orange-900 border-orange-300"
      : "bg-slate-100 text-slate-800 border-slate-300";

  return (
    <div className="flex flex-wrap justify-between items-center w-full py-2.5 px-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xs text-sm font-bold text-gray-800 gap-2 mb-1">
      {/* Unit ID */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">UNIT:</span>
        <span className="font-mono text-base font-black text-slate-900">{unitId}</span>
      </div>

      {/* Center Operational Intelligence Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* CMSI Score Pill */}
        <div className={"flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all " + cmsiBadgeColor}>
          <span className="text-[10px] uppercase tracking-wider opacity-75 font-medium">CMSI:</span>
          <span className="font-mono text-sm font-black">{cmsi}</span>
          <span className="text-[10px] uppercase font-bold">
            {isCmsiCritical ? "CRITICAL" : isCmsiWarning ? "WARN" : "NOMINAL"}
          </span>
        </div>

        {/* Oil Temp Pill */}
        <div className={"flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all " + oilBadgeColor}>
          <span className="text-[10px] uppercase tracking-wider opacity-75 font-medium">OIL:</span>
          <span className="font-mono text-sm font-black">{oilTemp}°C</span>
          {isOilOverheat && <span className="text-[10px] uppercase font-black tracking-wide">OVERHEAT!</span>}
        </div>

        {/* Mobile Rig Dispatch Badge */}
        {rigDispatched && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-blue-100 text-blue-900 border-blue-300 text-xs font-bold animate-pulse shadow-xs">
            <span>🚛 RIG DISPATCHED</span>
          </div>
        )}
      </div>

      {/* Edge Latency */}
      <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
        <div className={"w-2.5 h-2.5 rounded-full " + colorClass}></div>
        <span>EDGE {latency}ms {textClass}</span>
      </div>
    </div>
  );
}
