import { useEffect, useState } from "react";
import axios from "axios";
import AiLoader from "../component/AiLoader"; 
import { 
  CheckCircle, Captions, XCircle, Eye, Clock, 
  Save, Calendar, Heart, MessageCircle, 
  Share2, ThumbsUp, MoreHorizontal  
} from "lucide-react";

// --- DUMMY DATA (Fallback) ---
const DUMMY_POSTS = [
  {
    id: 101,
    media_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    media_type: "image",
    platforms: "instagram,facebook",
    scheduled_at: "2023-12-25T10:00:00",
    content_instagram: "Merry Christmas everyone! 🎄✨ #holiday",
    content_facebook: "Merry Christmas! Wishing you joy and happiness.",
    content_linkedin: ""
  }
];

export default function AdminDashboard() {
  // --- UI STATE ---
  const [posts, setPosts] = useState(DUMMY_POSTS); 
  const [keywords, setKeywords] = useState("");
  
  // Preview Panel State
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeTab, setActiveTab] = useState("instagram"); 
  const [adminFeedback, setAdminFeedback] = useState("");
  const [isLoading, setLoading] = useState(false);

  // Local Schedule Edit State
  const [scheduleEdits, setScheduleEdits] = useState({});
  const [changeCaptions, setChangeCaptions] = useState({
    facebook : "",
    instagram : "",
    linkedin : ""
  });
  const [isGenerateChanges, setIsGeneratedChanges] = useState(false);

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const handlePendingPosts = async() => {
      try {
        const response = await axios.get("http://localhost:8000/get_pending_posts");
        if(response.data && Array.isArray(response.data)) {
            setPosts(response.data);
        }
      } catch (error) {
        console.log("Using dummy data (API might be down)");
      }
    }
    handlePendingPosts();
  }, [])

  // --- 2. APPROVE POST LOGIC (UPDATED) ---
  const handleApprovedPost = async() => {
    if(!selectedPost) return;
    
    // Check if there is a pending unsaved edit for this post, otherwise use original
    const finalTime = scheduleEdits[selectedPost.id] || selectedPost.scheduled_at;

    try {
      // Changed to POST to send the confirmed time
      await axios.post("http://localhost:8000/admin/approved", {
        post_id: selectedPost.id,
        scheduled_at: finalTime
      });

      // Remove post from UI locally
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      alert("Post Approved & Scheduled! 🚀");
      closePreview();
    } catch (error) {
      console.error("Approval error", error);
      alert("Failed to approve post.");
    }
  }

  // --- 3. SAVE SCHEDULE LOGIC (NEW) ---
  const handleSaveSchedule = async (postId) => {
    const newDate = scheduleEdits[postId];
    if (!newDate) return;

    try {
      // Backend call to update just the date
      await axios.post("http://localhost:8000/update_schedule", {
        post_id: postId,
        scheduled_at: newDate
      });
      
      // Update local state permanently
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, scheduled_at: newDate } : p
      ));
      
      // Clear the edit state (hides the save button)
      const newEdits = { ...scheduleEdits };
      delete newEdits[postId];
      setScheduleEdits(newEdits);
      
      alert("Schedule updated successfully!");
    } catch (error) {
      console.error("Error updating schedule", error);
      alert("Failed to save schedule.");
    }
  };

  // --- 4. REGENERATE CAPTIONS LOGIC ---
  const handleChanges = async() => {
    setLoading(true);
    try {
        const response = await axios.post("http://localhost:8000/Regenerate/Caption",{
          "instagram_caption" : selectedPost.content_instagram || "",
          "facebook_caption" : selectedPost.content_facebook || "",
          "linkedin_caption" : selectedPost.content_linkedin || "",
          "keywords": keywords 
        });

        setIsGeneratedChanges(true);
        setChangeCaptions({
            instagram : response.data[0] || "",
            facebook : response.data[1] || "",
            linkedin : response.data[2] || ""
        });

        // Save new captions to DB
        await axios.post("http://localhost:8000/setCaption",{
            "post_id" : selectedPost.id,
            "instagram_caption" : response.data[0],
            "facebook_caption" : response.data[1],
            "linkedin_caption" : response.data[2]
        });

        setLoading(false);
    } catch(error) {
        console.log("Error in caption regeneration", error);
        setLoading(false);
    }
  }

  // --- HELPER FUNCTIONS ---
  const handlePreview = (post) => {
    setSelectedPost(post);
    setActiveTab(post.platforms.split(',')[0] || 'instagram');
    setIsGeneratedChanges(false); 
    setChangeCaptions({ facebook: "", instagram: "", linkedin: "" });
    setKeywords("");
    setAdminFeedback("");
    setLoading(false);

    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const closePreview = () => {
    setSelectedPost(null);
    setAdminFeedback("");
    setIsGeneratedChanges(false);
  };

  const handleLocalScheduleChange = (id, val) => {
    setScheduleEdits(prev => ({ ...prev, [id]: val }));
  };

  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    // Handle different date formats safely
    try {
        return new Date(isoString).toISOString().slice(0, 16); 
    } catch (e) {
        return "";
    }
  };

  return (
    <div className="pt-[80px] min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* QUEUE TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500"/> Approval Queue
                </h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {posts.length} Pending
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="p-4">Media</th>
                            <th className="p-4">Platforms</th>
                            <th className="p-4">Edit Schedule</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {posts.map((post) => (
                            <tr key={post.id} className={`transition-all ${selectedPost?.id === post.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                                
                                {/* Media Thumbnail */}
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden border dark:border-slate-700 relative">
                                            {post.media_type === 'video' ? (
                                                <video src={post.media_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={post.media_url} alt="post" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-slate-500">#{post.id}</span>
                                    </div>
                                </td>

                                {/* Platforms */}
                                <td className="p-4">
                                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                                        {post.platforms.split(',').map(p => (
                                            <span key={p} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border dark:border-slate-700 capitalize dark:text-slate-300 font-medium">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </td>

                                {/* Inline Schedule Edit */}
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative group">
                                            <Clock className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="datetime-local"
                                                defaultValue={formatDateTimeLocal(post.scheduled_at)}
                                                onChange={(e) => handleLocalScheduleChange(post.id, e.target.value)}
                                                className="pl-8 pr-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-48"
                                            />
                                        </div>
                                        {scheduleEdits[post.id] && (
                                            <button 
                                                onClick={() => handleSaveSchedule(post.id)}
                                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                                title="Save Date"
                                            >
                                                <Save className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handlePreview(post)}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedPost?.id === post.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Eye className="w-4 h-4" /> Preview
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* PREVIEW PANEL */}
        {selectedPost && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom duration-500">
                <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        Reviewing Post <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{selectedPost.id}</span>
                    </h3>
                    <button onClick={closePreview} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XCircle className="w-6 h-6 text-slate-400 hover:text-red-500" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* LEFT: Phone Mockup UI */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                         <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 w-full max-w-[350px] shadow-inner">
                            {['instagram', 'facebook', 'linkedin'].map(platform => (
                                <button
                                    key={platform}
                                    onClick={() => setActiveTab(platform)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                                        activeTab === platform 
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm scale-100' 
                                        : 'text-slate-400 hover:text-slate-600 scale-95'
                                    }`}
                                >
                                    {platform}
                                </button>
                            ))}
                         </div>

                         {/* Phone Screen */}
                         <div className="w-full max-w-[350px] bg-white dark:bg-black rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative min-h-[500px]">
                            {/* App Header */}
                            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full p-[2px] ${activeTab === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' : 'bg-blue-500'}`}>
                                        <div className="w-full h-full bg-white dark:bg-black rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold dark:text-white">YourBrand</p>
                                        <p className="text-[10px] text-slate-500">{activeTab === 'linkedin' ? 'Promoted' : 'Sponsored'}</p>
                                    </div>
                                </div>
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </div>

                            {/* Top Caption (FB/LinkedIn) */}
                            {(activeTab === 'facebook' || activeTab === 'linkedin') && (
                                <div className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line">
                                     {!isGenerateChanges
                                      ? (selectedPost?.[`content_${activeTab}`] 
                                          || <span className="italic text-slate-400">No content available for {activeTab}.</span>)
                                      : (changeCaptions?.[activeTab] || selectedPost?.[`content_${activeTab}`])}
                                </div>
                            )}

                            {/* Media */}
                            <div className="bg-slate-100 dark:bg-slate-900 aspect-square flex items-center justify-center">
                                {selectedPost.media_type === 'video' ? (
                                    <video src={selectedPost.media_url} controls className="w-full h-full object-cover" />
                                ) : (
                                    <img src={selectedPost.media_url} alt="Content" className="w-full h-full object-cover" />
                                )}
                            </div>

                            {/* Bottom Actions */}
                            <div className="px-4 py-3 flex justify-between text-slate-800 dark:text-white">
                                <div className="flex gap-4">
                                    {activeTab === 'facebook' ? <ThumbsUp className="w-5 h-5"/> : <Heart className="w-6 h-6"/>}
                                    <MessageCircle className="w-5 h-6"/>
                                    <Share2 className="w-5 h-6"/>
                                </div>
                            </div>

                            {/* Bottom Caption (Instagram) */}
                            {activeTab === 'instagram' && (
                                <div className="px-4 pb-4 text-sm">
                                    <p className="font-bold dark:text-white mb-1 text-xs">1,240 likes</p>
                                    <div className="text-slate-800 dark:text-slate-200 text-sm">
                                        <span className="font-bold mr-2">YourBrand</span>
                                         {!isGenerateChanges
                                          ? (selectedPost?.[`content_${activeTab}`] 
                                              || <span className="italic text-slate-400">No content available for {activeTab}.</span>)
                                          : (changeCaptions?.instagram || selectedPost?.[`content_${activeTab}`])}
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* RIGHT: Admin Controls */}
                    <div className="lg:col-span-7 flex flex-col justify-between h-full py-2 relative">
                        {isLoading && (
                             <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                <AiLoader text="Generating..." />
                             </div>
                        )}

                        <div className="space-y-6">
                            {/* Schedule Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-blue-900 dark:text-blue-300 font-bold mb-1">Scheduled Publication</h4>
                                    <p className="text-2xl font-mono text-slate-800 dark:text-slate-100">
                                        {scheduleEdits[selectedPost.id] 
                                          ? new Date(scheduleEdits[selectedPost.id]).toLocaleString() 
                                          : new Date(selectedPost.scheduled_at).toLocaleString()
                                        }
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {scheduleEdits[selectedPost.id] ? "(Unsaved Change)" : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Feedback Textarea */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Admin Feedback
                                </label>
                                <textarea
                                    className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none resize-none dark:text-white transition-all shadow-sm focus:shadow-md"
                                    placeholder="Write specifically what needs to be changed..."
                                    value={adminFeedback}
                                    onChange={(e) => setAdminFeedback(e.target.value)}
                                ></textarea>
                            </div>
                            
                            {/* Keywords Input */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    <Captions  className="w-4 h-4" />
                                    Keywords
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="Add keywords for caption regeneration..."
                                    className="w-full pl-4 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <button 
                            onClick={handleChanges}
                            className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/30 text-red-600 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2">
                                <XCircle className="w-5 h-5" /> Regenerate Captions
                            </button>
                            
                            <button 
                            onClick={handleApprovedPost}
                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                <CheckCircle className="w-5 h-5" /> Approve & Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}