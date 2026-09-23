interface HeaderProps {
  status: 'ok' | 'warn';
  latency: number;
}

export default function Header({ status = 'ok', latency = 50 }: HeaderProps) {
  const isWarn = status === 'warn';
  const colorClass = isWarn ? 'bg-red-600 shadow-[0_0_8px_#dc2626]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]';
  const textClass = isWarn ? 'WARN' : 'OK';

  return (
    <div className="flex justify-between items-center w-full py-4 text-sm font-bold text-gray-800">
      <div>XCMG-XE215 #01</div>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
        <span>EDGE {latency}ms {textClass}</span>
      </div>
    </div>
  );
}
