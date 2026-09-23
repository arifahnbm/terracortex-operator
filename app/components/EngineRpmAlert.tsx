interface EngineRpmAlertProps {
  rpm: number;
  status: 'ok' | 'warn' | 'overload';
  pressure: number;
  advisory?: string;
}

export default function EngineRpmAlert({ rpm, status, pressure, advisory }: EngineRpmAlertProps) {
  const isOverload = status === 'overload';
  
  // Calculate percentage for the indicator line (0 to 2000 RPM mapped to 0% to 100%)
  const indicatorPos = Math.min(100, Math.max(0, (rpm / 2000) * 100));

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-3">Target Engine RPM: {rpm} RPM</h2>
      
      {/* RPM Bar */}
      <div className="relative mb-6">
        <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-800">
          <div className="w-[30%] bg-gray-300"></div>
          <div className="w-[30%] bg-green-500"></div>
          <div className="w-[40%] bg-red-600"></div>
        </div>
        {/* Indicator */}
        <div className="absolute top-[-8px] bottom-[-8px] w-[2px] bg-white z-10 transition-all duration-300" style={{ left: `${indicatorPos}%` }}></div>
        
        {/* Labels */}
        <div className="flex justify-between mt-2 text-xs font-bold text-white">
          <div>0<br/>RPM</div>
          <div>1400<br/>RPM</div>
          <div>1800<br/>RPM</div>
          <div>2000<br/>RPM</div>
        </div>
      </div>
      
      {/* Alert Box */}
      <div className={`rounded-xl p-4 flex gap-4 text-white shadow-lg transition-colors duration-300 ${isOverload ? 'bg-[#b91c1c]' : 'bg-[#374151]'}`}>
        <div className="flex-shrink-0 mt-1">
          {isOverload ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          {isOverload ? (
            <>
              <h3 className="font-bold text-sm mb-1 uppercase text-white">OVERLOAD ALERT!</h3>
              <p className="text-sm text-red-100 leading-snug">{advisory || "Reduce the excavation depth or raise the boom!"}</p>
            </>
          ) : (
            <>
              <h3 className="font-bold text-sm mb-1 text-gray-200">ADAPTIVE GUIDANCE</h3>
              <p className="text-sm text-gray-400 leading-snug">{advisory || "Maintain current pressure. Ground is soft."} and RPM for smooth penetration.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
