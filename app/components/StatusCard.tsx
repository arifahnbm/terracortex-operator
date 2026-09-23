interface StatusCardProps {
  strata: 'SOFT' | 'ROCK';
}

export default function StatusCard({ strata = 'ROCK' }: StatusCardProps) {
  const isSoft = strata === 'SOFT';
  
  const glowColor = isSoft ? 'from-green-600' : 'from-red-600';
  const centerColor = isSoft ? '#16a34a' : '#ff0000'; // green-600 vs red-500
  const ringColor = isSoft ? 'ring-green-500/20' : 'ring-red-500/20';
  const shadowColor = isSoft ? 'shadow-[0_0_40px_rgba(34,197,94,0.15)]' : 'shadow-[0_0_40px_rgba(255,0,0,0.15)]';
  
  const titleText = isSoft ? "SOFT GROUND" : "ROCK/\nOVERLOAD";

  return (
    <div className={`relative rounded-xl border border-gray-700 bg-[#161a23] p-6 overflow-hidden ${shadowColor} ring-1 ${ringColor} w-full h-full flex flex-col justify-center`}>
      {/* Glow effect */}
      <div className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-b ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l ${glowColor} to-transparent opacity-80`}></div>
      <div className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t ${glowColor} to-transparent opacity-80`}></div>
      
      <div className="flex flex-row items-center justify-between w-full relative z-10 px-4">
        <div className="relative w-40 h-40 xl:w-56 xl:h-56 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
            {/* Outer gray blob */}
            <path d="M 30,120 C 10,80 50,20 100,10 C 160,0 190,60 180,120 C 170,180 120,200 60,180 C 20,160 40,140 30,120 Z" fill="#9ca3af" />
            {/* Inner lighter gray blob */}
            <path d="M 40,120 C 25,85 55,30 100,20 C 150,10 175,65 165,120 C 155,170 115,185 65,170 C 35,155 50,140 40,120 Z" fill="#e5e7eb" />
            {/* Center blob */}
            <path d="M 55,120 C 45,95 65,50 100,45 C 130,40 150,85 140,120 C 130,155 100,165 70,155 C 50,145 60,135 55,120 Z" fill={centerColor} className="transition-colors duration-500" />
          </svg>
        </div>
        
        <div className="flex flex-col ml-8">
          <h2 className="text-3xl font-bold text-white mb-1">Status:</h2>
          <h1 className="text-4xl font-black text-white leading-tight whitespace-pre-line">
            {titleText}
          </h1>
        </div>
      </div>
    </div>
  );
}

