interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export default function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <button 
      onClick={onToggle}
      className={`w-full mt-4 py-4 rounded-xl transition-colors font-bold text-2xl tracking-wide shadow-lg border ${
        isMuted 
          ? 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300'
      }`}
    >
      {isMuted ? 'UNMUTE ALARM' : 'MUTE ALARM'}
    </button>
  );
}
