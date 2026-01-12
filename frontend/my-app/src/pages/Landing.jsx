import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CalendarClock,
  Send,
  Tags,
  LineChart,
  Loader2,
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
      
      <div className="relative w-28 h-28">
        {/* Center AI Core */}
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.8)] animate-corePulse"></div>

        {/* Orbit ring */}
        <div className="absolute inset-0 rounded-full border border-blue-500/30"></div>

        {/* Orbiting dots */}
        <span className="orbit-dot dot1"></span>
        <span className="orbit-dot dot2"></span>
        <span className="orbit-dot dot3"></span>
      </div>

      <p className="mt-8 text-sm tracking-[0.3em] text-gray-400 animate-fadeText">
        AI IS THINKING
      </p>
    </div>
  );
}


  return (
    <div className="bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden">
      {/* Hero */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 animate-fadeIn">
        <h2 className="text-5xl font-extrabold leading-tight max-w-4xl">
          GROW with SINGLE CLICK<br />
          Your Social Media with <span className="text-blue-500">AI</span>
        </h2>

        <p className="mt-6 text-gray-400 max-w-2xl">
          One platform to generate captions, auto-post content,
          schedule campaigns and predict future growth —
          powered by Artificial Intelligence.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="mt-10 px-10 py-4 bg-blue-600 rounded-2xl text-lg hover:bg-blue-700 transition"
        >
          Get Started Free
        </button>
      </section>

      {/* Features */}
      <section className="px-10 py-24 grid grid-cols-1 md:grid-cols-3 gap-10">
        <Feature
          icon={<Send />}
          title="Auto Posting"
          desc="Post automatically to Facebook, Instagram and LinkedIn without manual effort."
        />
        <Feature
          icon={<CalendarClock />}
          title="Scheduled Posting"
          desc="Plan content in advance and let AI publish at the perfect time."
        />
        <Feature
          icon={<Sparkles />}
          title="AI Caption Generator"
          desc="Generate high-engagement captions using Gemini AI."
        />
        <Feature
          icon={<Tags />}
          title="AI Tags Generator"
          desc="Smart hashtags & keywords for maximum reach."
        />
        <Feature
          icon={<LineChart />}
          title="Future Predict Dashboard"
          desc="AI predicts engagement, reach & growth trends."
        />
      </section>

      {/* Feedbacks */}
      <section className="py-24 bg-gray-900">
        <h3 className="text-4xl font-bold text-center mb-16">
          Loved by Creators & Businesses
        </h3>

        <div className="flex gap-8 overflow-x-auto px-10 animate-slide">
          <Feedback
            name="Rohit Sharma"
            text="This tool saved me hours every week. AI captions are insane!"
          />
          <Feedback
            name="Anjali Verma"
            text="Scheduling + auto posting is a game changer for my brand."
          />
          <Feedback
            name="Startup Founder"
            text="Future prediction dashboard feels like magic."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h3 className="text-4xl font-bold mb-6">
          Ready to Grow with AI?
        </h3>
        <p className="text-gray-400 mb-10">
          Join creators who automate smarter, not harder.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-12 py-4 bg-blue-600 rounded-2xl text-lg hover:bg-blue-700 transition"
        >
          Start Now
        </button>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        © 2025 AI Social Suite. Built with ❤️ & AI.
      </footer>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Feature({ icon, title, desc }) {
  return (
    <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-blue-600 transition hover:scale-105">
      <div className="text-blue-500 mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-400">{desc}</p>
    </div>
  );
}

function Feedback({ name, text }) {
  return (
    <div className="min-w-[300px] bg-black border border-gray-800 rounded-2xl p-6 hover:scale-105 transition">
      <p className="text-gray-300 mb-4">“{text}”</p>
      <span className="text-blue-500 font-semibold">{name}</span>
    </div>
  );
}
