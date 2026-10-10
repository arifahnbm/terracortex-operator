interface StatusCardProps {
  strata: "SOFT" | "ROCK";
  cmsi?: number;
}

export default function StatusCard({ strata = "ROCK", cmsi = 45 }: StatusCardProps) {
  const isSoft = strata === "SOFT";
  
  const glowColor = isSoft ? "from-green-500" : "from-red-500";
  const centerColor = isSoft ? "#16a34a" : "#ef4444"; 
  const ringColor = isSoft ? "ring-green-600/30" : "ring-red-600/30";
  const shadowColor = isSoft ? "shadow-[0_8px_30px_rgba(34,197,94,0.25)]" : "shadow-[0_8px_30px_rgba(239,68,68,0.25)]";
  
  const titleText = isSoft ? "SOFT GROUND" : "ROCK / OVERLOAD";
  const isCritical = cmsi >= 85;
  const isWarning = cmsi >= 70 && !isCritical;

  return (
    <div className={`relative rounded-xl border border-gray-300 bg-white p-5 overflow-hidden ${shadowColor} ring-1 ${ringColor} w-full h-full flex flex-col justify-between`}>
      {/* Glow effect */}
      <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-b ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t ${glowColor} to-transparent opacity-80`}></div>
      
      <div className="flex flex-row items-center justify-between w-full relative z-10 px-2 my-auto">
        <div className="relative w-36 h-36 xl:w-48 xl:h-48 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            <path d="M 30,120 C 10,80 50,20 100,10 C 160,0 190,60 180,120 C 170,180 120,200 60,180 C 20,160 40,140 30,120 Z" fill="#9ca3af" />
            <path d="M 40,120 C 25,85 55,30 100,20 C 150,10 175,65 165,120 C 155,170 115,185 65,170 C 35,155 50,140 40,120 Z" fill="#e5e7eb" />
            <path d="M 55,120 C 45,95 65,50 100,45 C 130,40 150,85 140,120 C 130,155 100,165 70,155 C 50,145 60,135 55,120 Z" fill={centerColor} className="transition-colors duration-500" />
          </svg>
        </div>
        
        <div className="flex flex-col ml-4 flex-1">
          <span className="text-xs uppercase font-bold tracking-wider text-gray-500">GROUND STRATA:</span>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">
            {titleText}
          </h1>

          {/* Mini Fatigue Bar */}
          <div className="mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-600">Machine Fatigue (CMSI):</span>
              <span className={isCritical ? "text-red-700 font-black" : isWarning ? "text-amber-700" : "text-emerald-700"}>
                {cmsi} / 100
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isCritical ? "bg-red-600" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, cmsi))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
