export default function AiLoader({ text = "AI is working..." }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center 
      bg-black/70 backdrop-blur-md rounded-2xl">

      {/* AI ORBIT LOADER */}
      <div className="relative w-28 h-28">
        {/* Core */}
        <div className="absolute inset-8 rounded-full 
          bg-gradient-to-br from-blue-500 to-purple-600
          shadow-[0_0_30px_rgba(99,102,241,0.8)]
          animate-pulse" />

        {/* Ring */}
        <div className="absolute inset-0 rounded-full border border-blue-500/30" />

        {/* Orbit dots */}
        <span className="orbit-dot dot1"></span>
        <span className="orbit-dot dot2"></span>
        <span className="orbit-dot dot3"></span>
      </div>

      <p className="mt-6 text-sm tracking-[0.3em] text-gray-300 animate-fadeText">
        {text}
      </p>
    </div>
  );
}
