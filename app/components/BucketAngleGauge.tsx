interface BucketAngleGaugeProps {
  angle: number;
}

export default function BucketAngleGauge({ angle = 45 }: BucketAngleGaugeProps) {
  // Convert a value (0 to 100) to an angle in degrees (180 to 0)
  // 180 degrees is on the left (0 value), 0 degrees is on the right (100 value)
  const valueToAngle = (val: number) => {
    return 180 - (Math.max(0, Math.min(100, val)) / 100) * 180;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY - radius * Math.sin(angleInRadians), // subtract because SVG y-axis goes down
    };
  };

  const ticks = [];
  for (let i = 0; i <= 100; i += 2) {
    const isMajor = i % 10 === 0;
    const isMedium = i % 5 === 0 && !isMajor;
    
    const deg = valueToAngle(i);
    // Radii for the ticks
    const outerRadius = 85;
    const innerRadius = isMajor ? 70 : isMedium ? 75 : 80;
    
    const p1 = polarToCartesian(150, 150, innerRadius, deg);
    const p2 = polarToCartesian(150, 150, outerRadius, deg);
    
    // Color mapping based on the image
    let color = '#a3e635'; // green-yellow
    if (i <= 20) color = '#f97316'; // orange
    else if (i >= 80) color = '#ef4444'; // red

    ticks.push(
      <line 
        key={i} 
        x1={p1.x} y1={p1.y} 
        x2={p2.x} y2={p2.y} 
        stroke={color} 
        strokeWidth={isMajor ? 3 : 2} 
        strokeLinecap="round"
      />
    );
  }

  const labels = [];
  for (let i = 0; i <= 100; i += 10) {
    const deg = valueToAngle(i);
    // Labels sit outside the ticks
    const p = polarToCartesian(150, 150, 105, deg); 
    const rotation = 90 - deg;
    
    labels.push(
      <g key={`label-${i}`} transform={`translate(${p.x}, ${p.y}) rotate(${rotation})`}>
        <text 
          x="0" y="0" 
          textAnchor="middle" 
          alignmentBaseline="middle" 
          fill="white" 
          fontSize="12"
          fontWeight="bold"
        >
          {i}
        </text>
      </g>
    );
  }

  const currentAngle = valueToAngle(angle);

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Target Bucket Angle</h2>
      <div className="relative flex-1 flex items-center justify-center">
        <svg viewBox="0 0 300 200" className="w-full max-w-[320px] overflow-visible drop-shadow-xl">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Outer Segmented Arc */}
          <path 
            d="M 55,150 A 95 95 0 0 1 245,150" 
            fill="none" 
            stroke="url(#gaugeGradient)" 
            strokeWidth="6" 
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          {/* Ticks */}
          <g>{ticks}</g>

          {/* Labels */}
          <g>{labels}</g>

          {/* Value Display */}
          <text x="150" y="130" textAnchor="middle" fill="white" fontSize="42" fontWeight="900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {angle}
          </text>
          <text x="150" y="150" textAnchor="middle" fill="#9ca3af" fontSize="12" fontWeight="bold" letterSpacing="3">
            TARGET
          </text>

          {/* Green Triangle Pointer */}
          <g transform={`translate(150, 150) rotate(${90 - currentAngle})`} className="transition-transform duration-300">
             <polygon points="-8,-60 8,-60 0,-72" fill="#22c55e" />
          </g>
        </svg>
      </div>
    </div>
  );
}
