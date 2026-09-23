"use client";
import { useEffect, useRef } from "react";

interface HydraulicPressureChartProps {
  pressure: number;
}

export default function HydraulicPressureChart({ pressure = 24.5 }: HydraulicPressureChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    // We'll draw a simulated wave
    const draw = () => {
      // Setup canvas dimensions properly for high DPI
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Setup vertical gradient based on Y-axis values
      // Y-axis is 0 to 40 MPa.
      // 0 is at `height`, 40 is at `0`.
      // 20 MPa (Normal) = height * 0.5
      // 35 MPa (Danger) = height * 0.125
      const lineGradient = ctx.createLinearGradient(0, height, 0, 0);
      lineGradient.addColorStop(0, "#22c55e");     // 0 MPa -> Green
      lineGradient.addColorStop(0.5, "#22c55e");   // 20 MPa -> Green
      lineGradient.addColorStop(0.875, "#ef4444"); // 35 MPa -> Red
      lineGradient.addColorStop(1, "#ef4444");     // 40 MPa -> Red

      const fillGradient = ctx.createLinearGradient(0, height, 0, 0);
      fillGradient.addColorStop(0, "rgba(34, 197, 94, 0.4)");
      fillGradient.addColorStop(0.5, "rgba(34, 197, 94, 0.4)");
      fillGradient.addColorStop(0.875, "rgba(239, 68, 68, 0.5)");
      fillGradient.addColorStop(1, "rgba(239, 68, 68, 0.5)");

      ctx.beginPath();
      ctx.moveTo(0, height);

      const points = [];
      
      // Calculate the base Y position mapped exactly to the pressure prop
      // Note: we clamp it visually between 5 and 35 just so it doesn't go completely off-screen,
      // but mathematically it maps 0-40 MPa to height-0.
      const mappedPressure = Math.max(0, Math.min(40, pressure));
      const targetY = height - (mappedPressure / 40) * height;

      for (let x = 0; x <= width; x += 5) {
        // Base sine wave based on time and x position
        const wave1 = Math.sin(x * 0.01 + offset) * (pressure > 30 ? 15 : 5);
        const wave2 = Math.sin(x * 0.03 + offset * 1.5) * (pressure > 30 ? 8 : 3);
        
        // Slope the wave slightly so the right side represents the current pressure 
        // and the left side is slightly smoothed (simulating historical data loosely)
        const y = targetY + wave1 + wave2;
        
        points.push({x, y});
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Draw the fill
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // Draw the line
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 4;
      ctx.stroke();

      offset -= 0.05; // move left
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [pressure]);

  return (
    <div className="rounded-xl border border-gray-700 bg-[#161a23] p-4 w-full h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h2 className="text-lg lg:text-xl font-bold text-white tracking-wide">LIVE HYDRAULIC PRESSURE WAVE</h2>
        <h3 className="text-lg lg:text-xl font-bold text-white">PRESSURE: {pressure.toFixed(1)} MPa</h3>
      </div>
      
      <div className="flex-1 relative w-full flex min-h-0 mt-2">
        {/* Y-axis labels */}
        <div className="w-12 flex flex-col justify-between text-xs font-bold text-white h-full pb-6 z-10 text-right pr-2">
          <div>40<br/>Mpa</div>
          <div>20<br/>MPa</div>
          <div>0<br/>MPa</div>
        </div>
        
        {/* Chart area */}
        <div className="flex-1 relative border-l border-b border-gray-800 h-full min-h-0 min-w-0 mb-6">
          {/* Vertical Grid lines */}
          <div className="absolute h-full border-l border-gray-800 left-1/4"></div>
          <div className="absolute h-full border-l border-gray-800 left-1/2"></div>
          <div className="absolute h-full border-l border-gray-800 left-3/4"></div>
          
          {/* Threshold Lines */}
          {/* 35 MPa (Danger Limit) -> 40 - 35 = 5 -> 5/40 = 12.5% from top */}
          <div className="absolute w-full border-t border-dashed border-red-500 top-[12.5%] z-10 opacity-70">
            <span className="absolute -top-4 right-1 text-[9px] font-bold text-red-500 bg-[#161a23] px-1">MAX LIMIT (35 MPa)</span>
          </div>
          
          {/* 20 MPa (Normal Limit) -> 40 - 20 = 20 -> 20/40 = 50% from top */}
          <div className="absolute w-full border-t border-dashed border-green-500 top-[50%] z-10 opacity-70">
            <span className="absolute -top-4 right-1 text-[9px] font-bold text-green-500 bg-[#161a23] px-1">NORMAL (20 MPa)</span>
          </div>

          {/* X-axis labels */}
          <div className="absolute -bottom-6 w-full flex justify-between text-xs font-bold text-gray-500">
            <span className="-ml-2">-10s</span>
            <span className="-ml-2">-5s</span>
            <span className="mr-0">0s</span>
          </div>

          {/* Line Chart Canvas */}
          <div className="absolute inset-0 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

