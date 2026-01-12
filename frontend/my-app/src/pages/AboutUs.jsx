import React from "react";
import { 
  Code2, 
  Database, 
  Server, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe, 
  Cpu, 
  Zap 
} from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white p-8">
      
      {/* --- HERO SECTION --- */}
      <div className="max-w-4xl mx-auto text-center mb-16 pt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          About AutoPostX
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          AutoPostX is a next-generation social media management platform designed to automate your digital presence. 
          Leveraging advanced AI, we help creators and businesses generate, schedule, and analyze content across Facebook, Instagram, and LinkedIn seamlessly.
        </p>
      </div>

      {/* --- TECH STACK GRID --- */}
      <div className="max-w-5xl mx-auto mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <TechItem icon={<Code2 className="text-blue-500"/>} title="React Frontend" desc="Modern UI/UX" />
            <TechItem icon={<Server className="text-green-500"/>} title="FastAPI Backend" desc="High Performance" />
            <TechItem icon={<Database className="text-orange-500"/>} title="SQLModel" desc="Reliable Data" />
            <TechItem icon={<Cpu className="text-purple-500"/>} title="AI Integration" desc="Smart Content" />
        </div>
      </div>

      {/* --- DEVELOPER TEAM SECTION --- */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Meet the Developers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* CARD 1: Manoj Kannor */}
          <DeveloperCard 
            name="Manoj Kannor"
            role="Lead Developer & AI Architect"
            description="Specializes in Backend Architecture, AI Model integration, and scalable system design. The brain behind the AutoPostX core engine."
            initials="MK"
            color="from-blue-500 to-cyan-500"
          />

          {/* CARD 2: Ganesh Sonawane */}
          <DeveloperCard 
            name="Ganesh Sonawane"
            role="UI/UX Designer"
            description="Expert in Frontend interactivity and seamless user experiences. Crafted the intuitive dashboard and responsive design of AutoPostX."
            initials="GS"
            color="from-purple-500 to-pink-500"
          />

        </div>
      </div>

      {/* --- FOOTER CREDIT --- */}
      <div className="text-center mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} AutoPostX Team. All rights reserved.
      </div>

    </div>
  );
}

// --- HELPER COMPONENTS ---

function DeveloperCard({ name, role, description, initials, color }) {
  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      
      {/* Abstract Background Decoration */}
      <div className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${color} opacity-10 rounded-t-2xl`} />

      {/* Profile Avatar */}
      <div className={`relative w-20 h-20 mx-auto -mt-2 mb-6 rounded-full bg-gradient-to-r ${color} p-1 shadow-lg`}>
        <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                {initials}
            </span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-xl font-bold mb-1">{name}</h3>
        <p className={`text-sm font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent mb-4`}>
            {role}
        </p>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {description}
        </p>
      </div>

      {/* Social Links */}
      <div className="flex justify-center gap-4">
        <SocialButton icon={<Github className="w-5 h-5" />} />
        <SocialButton icon={<Linkedin className="w-5 h-5" />} />
        <SocialButton icon={<Globe className="w-5 h-5" />} />
      </div>
    </div>
  );
}

function TechItem({ icon, title, desc }) {
    return (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="mb-3 flex justify-center">{icon}</div>
            <h4 className="font-bold text-sm">{title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
    )
}

function SocialButton({ icon }) {
    return (
        <button className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-colors">
            {icon}
        </button>
    )
}