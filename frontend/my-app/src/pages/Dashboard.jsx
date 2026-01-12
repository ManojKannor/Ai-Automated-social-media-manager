import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  ArrowUpRight,
  Users,
  Sparkles,
  TrendingUp,
  Send,
  MoreHorizontal
} from "lucide-react";
import AiLoader from "../component/AiLoader";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [socialStats, setSocialStats] = useState([]);
  const [stats, setStats] = useState({
    total_posts: 0,
    pending: 0,
    completed: 0,
    failed: 0,
  });
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setLoading] = useState(true);
  
  // New State for the Quick AI Widget
  const [quickPrompt, setQuickPrompt] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- 1. FETCH DASHBOARD DATA (KEPT EXACTLY THE SAME) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get_all_posts");
        const allPosts = Array.isArray(response.data) ? response.data : [];
        
        const completed = allPosts.filter((p) => p.status === "published").length;
        const failed = allPosts.filter((p) => p.status === "failed").length;
        const pending = allPosts.filter((p) => p.status === "pending").length;

        setRecentPosts(allPosts.reverse()); 
        
        setStats({
          total_posts: allPosts.length,
          pending,
          completed,
          failed,
        });

        try {
          const statsReq = await axios.get("http://localhost:8000/dashboard/stats");
          if (Array.isArray(statsReq.data)) {
            setSocialStats(statsReq.data);
          } else {
            setSocialStats([]);
          }
        } catch (e) {
          console.log("Stats error:", e);
          setSocialStats([]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Dashboard Error", error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- NEW: Handle Quick AI Draft (Simulation) ---
  const handleQuickDraft = () => {
    if(!quickPrompt) return;
    setIsGenerating(true);
    // Simulate AI delay - You can connect this to your Python backend later!
    setTimeout(() => {
        setGeneratedIdea(`🚀 **Viral Hook for ${quickPrompt}:**\n"Stop doing [Common Mistake] with ${quickPrompt}. Here is the top 1% strategy..."\n\n👉 Ask audience: "Do you agree?"`);
        setIsGenerating(false);
    }, 1500);
  };

  const totalFollowers = Array.isArray(socialStats) 
    ? socialStats.reduce((sum, item) => sum + (item.followers || 0), 0) 
    : 0;

  const COLORS = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    linkedin: "#0A66C2",
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><AiLoader text="Loading Command Center..." /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 md:p-8 font-sans selection:bg-purple-500/30">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/20">BETA 2.0</span>
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Overview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-md">
            Your centralized hub for social growth. AI insights and performance metrics are live.
          </p>
        </div>
        
        <button
          onClick={() => navigate("/CreatePost")}
          className="group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-lg shadow-blue-900/20"
        >
          <Zap className="w-5 h-5 mr-2 animate-pulse" />
          <span>Create Magic Post</span>
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 group-hover:ring-white/40"></div>
        </button>
      </div>

      {/* --- STATS GRID (HERO LAYOUT) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* HERO CARD: Total Audience */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-700 to-purple-900 p-6 rounded-2xl shadow-2xl shadow-indigo-900/20 group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-24 h-24 transform rotate-12" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Total Audience</span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight">
                    {totalFollowers.toLocaleString()}
                </h2>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-medium">
                    <TrendingUp className="w-3 h-3 text-green-300" />
                    <span className="text-green-300">+12%</span>
                    <span className="text-indigo-200">vs last week</span>
                </div>
            </div>
        </div>

        {/* Standard Stats Cards */}
        <StatCard 
            title="Pending Approval" 
            value={stats.pending} 
            icon={<Clock className="text-yellow-400" />} 
            bg="bg-slate-800/50"
            border="border-slate-700"
        />
        <StatCard 
            title="Published" 
            value={stats.completed} 
            icon={<CheckCircle className="text-green-400" />} 
            bg="bg-slate-800/50"
            border="border-slate-700"
        />
        <StatCard 
            title="Failed Posts" 
            value={stats.failed} 
            icon={<XCircle className="text-red-400" />} 
            bg="bg-slate-800/50"
            border="border-red-900/30"
            textColor="text-red-400"
        />
      </div>

      {/* --- MAIN CONTENT SPLIT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CHART SECTION */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-white">Platform Growth</h3>
                <p className="text-xs text-slate-500">Follower distribution across channels</p>
            </div>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg border border-slate-700 transition-colors">
                Last 30 Days
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={socialStats}>
                <XAxis 
                  dataKey="platform" 
                  tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} 
                  stroke="#475569" 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    background: "#0f172a",
                    color: "#fff",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                  }}
                />
                <Bar dataKey="followers" radius={[6, 6, 0, 0]} barSize={50}>
                  {Array.isArray(socialStats) && socialStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.platform] || "#8884d8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: AI & RECENT ACTIVITY */}
        <div className="space-y-6">
            
          {/* NEW: QUICK AI MAGIC DRAFTER (Interactive Widget) */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 p-1 rounded-2xl shadow-lg">
            <div className="bg-slate-900/90 rounded-xl p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-sm text-white">Quick Magic Draft</h3>
                </div>
                
                {!generatedIdea ? (
                    <>
                        <p className="text-xs text-slate-400 mb-3">Stuck? Type a topic to generate an instant post hook.</p>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={quickPrompt}
                                onChange={(e) => setQuickPrompt(e.target.value)}
                                placeholder="E.g., AI trends, Coffee, Motivation..." 
                                className="w-full bg-slate-950 border border-slate-800 text-sm text-white rounded-xl pl-3 pr-10 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickDraft()}
                            />
                            <button 
                                onClick={handleQuickDraft}
                                disabled={isGenerating}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white rounded-lg transition-colors"
                            >
                                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-3">
                            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{generatedIdea}</p>
                        </div>
                        <button 
                            onClick={() => setGeneratedIdea("")}
                            className="w-full text-xs font-bold text-slate-500 hover:text-white transition-colors"
                        >
                            Generate Another
                        </button>
                    </div>
                )}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white text-sm">Recent Activity</h3>
                <MoreHorizontal className="w-4 h-4 text-slate-600 cursor-pointer hover:text-white" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {recentPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <p className="text-xs">No posts yet.</p>
                </div>
              )}
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="group flex items-center justify-between p-3 bg-slate-950 border border-slate-800/50 hover:border-slate-700 rounded-xl transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-3">
                    {/* Status Dot */}
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-800`}>
                         <div className={`w-2 h-2 rounded-full ${
                            post.status === "completed" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                            post.status === "failed" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-yellow-500"
                         }`} />
                    </div>
                    
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-200 truncate w-32 group-hover:text-white transition-colors">
                        {post.content_instagram?.substring(0, 25) || "No Caption"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">{post.platforms}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                      post.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
                      post.status === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-2">
              View Full History <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE STAT CARD ---
function StatCard({ title, value, icon, bg, border, textColor = "text-white" }) {
  return (
    <div className={`${bg} backdrop-blur-sm border ${border} p-6 rounded-2xl hover:shadow-lg transition-all duration-300`}>
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">
          {icon}
        </div>
      </div>
      <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}