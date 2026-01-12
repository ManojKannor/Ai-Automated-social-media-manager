import { useState, useEffect } from "react";
import axios from "axios"; 
import AiLoader from "../component/AiLoader"; 
import { useAuth0 } from "@auth0/auth0-react";

import { 
  Upload, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Sparkles, 
  Image as ImageIcon, 
  X,
  CheckCircle2,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  MoreHorizontal,
  Send,
  Globe,
  Video // Added Video Icon
} from "lucide-react";


export default function CreatePost() {
  const {user} = useAuth0();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [isGenerated, setIsGenerated] = useState(false); 
  const [isConfirm, setIsConfirm] = useState(false);
  // Store unique captions for each platform
  const [generatedCaptions, setGeneratedCaptions] = useState({
    instagram: "",
    facebook: "",
    linkedin: ""
  });

  const [activePreview, setActivePreview] = useState("instagram");
  
  // --- MEDIA STATE ---
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image"); // Default to 'image'
  // const [user_id , setUser_id] = useState("authUnknown")
  const [platforms, setPlatforms] = useState({
    instagram: true,
    facebook: true,
    linkedin: true,
  });


  // Auto-switch preview logic
  useEffect(() => {
    if (!platforms[activePreview]) {
      const firstActive = Object.keys(platforms).find(p => platforms[p]);
      if (firstActive) setActivePreview(firstActive);
    }
  }, [platforms, activePreview]);

  // --- HANDLE FILE UPLOAD & DETECT TYPE ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      
      // Check if file is video or image
      if (file.type.startsWith("video")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const removeFile = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("image"); // Reset to default
  };

  const togglePlatform = (name) => {
    setPlatforms((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  // --- API INTEGRATION ---
  const handleGenerate = async () => {
    if (!keywords || !mediaFile) {
        alert("Please add keywords and upload a file.");
        return;
    }

    setLoading(true);


    try {
        // REPLACE WITH YOUR BACKEND URL
        const response = await axios.post("http://localhost:8000/generateCaption/", {
            keyword : keywords
        });

        console.log("Success:", response.data);
        
      
        // Simulate Caption Generation
      setGeneratedCaptions({
        instagram: response.data[0],
        facebook: response.data[1],
        linkedin: response.data[2]
      });
      setIsGenerated(true);
      setLoading(false);

    } catch (error) {
        console.error("Error posting data:", error);
        alert("Failed to connect to server.");
        setLoading(false);
    }
  };

// Add 'async' here 👇
const handleCreatePosting = async () => {
  setIsConfirm(true)
  setLoading(true)
  console.log(platforms)
  console.log(mediaFile, mediaType)
  console.log(generatedCaptions)
  try {
    const formData = new FormData();
    // REQUIRED by backend
    formData.append("user_id", user.sub); // 🔴 replace with real auth user id

    formData.append(
      "platforms",
      Object.keys(platforms)
        .filter(p => platforms[p])
        .join(",") // backend expects string
    );

    formData.append("media_type",mediaType)
    formData.append("media", mediaFile);
    formData.append("content_instagram",generatedCaptions.instagram)
    formData.append("content_facebook",generatedCaptions.facebook)
    formData.append("content_linkedin",generatedCaptions.linkedin)

    const response = await axios.post(
      "http://localhost:8000/create-post",
      formData
    );

    console.log(response.data);
    alert("Post sent for admin approval ✅");
    setIsConfirm(false)
    setLoading(false)

  } catch (error) {
    console.error(error);
  }
  
};



  const platformConfig = [
    { id: "facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    { id: "instagram", icon: Instagram, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-900/20", border: "border-pink-200 dark:border-pink-800" },
    { id: "linkedin", icon: Linkedin, color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
  ];


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Content Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Upload media (Images or Videos), set keywords, and let AI handle the rest.
          </p>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT COLUMN: Input Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 relative overflow-hidden h-fit">
             
             {loading && (
                <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                   <AiLoader text="Uploading & Generating..." />
                </div>
              )}

            {/* 1. Keywords */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Topic & Keywords</span>
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. New Product Launch, Tech Conference..."
                className="w-full pl-4 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all dark:text-white"
              />
            </div>

            {/* 2. Media Upload (Handles Image & Video) */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span>Visual Assets (Image or Video)</span>
              </label>
              
              {!mediaPreview ? (
                <div className="relative group h-40">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*"  // Accepts both!
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex flex-col items-center justify-center gap-2 transition-all group-hover:border-blue-500 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <p className="text-sm text-slate-500">Click to upload Image or Video</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group h-64 bg-black flex items-center justify-center">
                  
                  {/* --- PREVIEW LOGIC: CHECK MEDIA TYPE --- */}
                  {mediaType === 'video' ? (
                    <video 
                        src={mediaPreview} 
                        className="w-full h-full object-contain" 
                        controls 
                    />
                  ) : (
                    <img 
                        src={mediaPreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain" 
                    />
                  )}

                  <button 
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Badge showing current type */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white uppercase font-bold tracking-wide">
                    {mediaType}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Platforms */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Select Platforms</span>
              </label>
              <div className="flex gap-3">
                {platformConfig.map((p) => {
                  const isSelected = platforms[p.id];
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all
                        ${isSelected ? `${p.border} ${p.bg}` : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 opacity-60"}
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? p.color : "text-slate-400"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Schedule & Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
               

               <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !keywords || !mediaFile}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerated ? "Regenerate Content" : "Generate & Post"}
              </button>


              <button 
              type="button"
              onClick={handleCreatePosting}
              disabled={loading || isConfirm}
              className={`w-full py-4 rounded-xl  text-white font-bold shadow-lg 
                ${!isGenerated || loading ? "bg-gradient-to-r from-red-900 to-red-600 cursor-not-allowed opacity-50" : "bg-gradient-to-r from-green-900 to-green-600 hover:bg-green-800 shadow-green-500/30 hover:shadow-green-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"}
                `}>
                Confirm
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Preview */}
          <div className="sticky top-8 space-y-4">
            
            {/* Preview Tabs */}
            <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-xl">
               {platformConfig.map((p) => {
                  const Icon = p.icon;
                  if (!platforms[p.id]) return null;

                  return (
                     <button
                        key={p.id}
                        onClick={() => setActivePreview(p.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                           activePreview === p.id 
                           ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                           : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                     >
                        <Icon className={`w-4 h-4 ${activePreview === p.id ? p.color : "text-current"}`} />
                        <span className="capitalize hidden sm:inline">{p.id}</span>
                     </button>
                  )
               })}
            </div>

            {/* PREVIEW CARD */}
            <div className="bg-white dark:bg-black rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-w-sm mx-auto relative min-h-[500px]">
              
               {/* Header */}
               <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full p-[2px] ${
                        activePreview === 'instagram' ? 'bg-gradient-to-tr from-yellow-400 to-purple-600' :
                        activePreview === 'linkedin' ? 'bg-blue-600' :
                        'bg-blue-500'
                     }`}>
                        <div className="w-full h-full bg-white dark:bg-black rounded-full p-[2px]">
                           <div className="w-full h-full bg-slate-200 rounded-full" />
                        </div>
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">YourBrand</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                           {activePreview === 'linkedin' ? 'Promoted' : 'Sponsored'} 
                           <Globe className="w-3 h-3" />
                        </p>
                     </div>
                  </div>
                  <MoreHorizontal className="w-5 h-5 text-slate-400" />
               </div>

               {/* Text (Linkedin/FB) */}
               {(activePreview === 'linkedin' || activePreview === 'facebook') && (
                  <div className="px-4 py-3">
                     <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line">
                        {generatedCaptions[activePreview] || <span className="text-slate-400 italic">Preview text will appear here...</span>}
                     </p>
                  </div>
               )}

               {/* --- RIGHT COLUMN MEDIA DISPLAY --- */}
               <div className="w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                  {mediaPreview ? (
                     mediaType === 'video' ? (
                        <video src={mediaPreview} className="w-full h-full object-cover" controls />
                     ) : (
                        <img src={mediaPreview} alt="Post media" className="w-full h-full object-cover" />
                     )
                  ) : (
                     <div className="text-center p-6">
                        {mediaType === 'video' ? <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" /> : <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />}
                        <p className="text-xs text-slate-400">Media Preview</p>
                     </div>
                  )}
               </div>

               {/* Instagram Actions */}
               {activePreview === 'instagram' && (
                  <div className="px-4 py-3 flex items-center justify-between">
                     <div className="flex gap-4">
                        <Heart className="w-6 h-6 text-slate-900 dark:text-white" />
                        <MessageCircle className="w-6 h-6 text-slate-900 dark:text-white" />
                        <Send className="w-6 h-6 text-slate-900 dark:text-white" />
                     </div>
                     <div className="w-5 h-6 bg-slate-800 dark:bg-white rounded-sm opacity-20"></div>
                  </div>
               )}

               {/* Facebook Actions */}
               {activePreview === 'facebook' && (
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-white/10 flex justify-between text-slate-500">
                     <div className="flex gap-2 items-center"><ThumbsUp className="w-5 h-5" /> <span className="text-xs">Like</span></div>
                     <div className="flex gap-2 items-center"><MessageCircle className="w-5 h-5" /> <span className="text-xs">Comment</span></div>
                     <div className="flex gap-2 items-center"><Share2 className="w-5 h-5" /> <span className="text-xs">Share</span></div>
                  </div>
               )}

               {/* Linkedin Actions */}
               {activePreview === 'linkedin' && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 flex justify-between text-slate-500">
                     <div className="flex flex-col items-center"><ThumbsUp className="w-5 h-5" /> <span className="text-[10px]">Like</span></div>
                     <div className="flex flex-col items-center"><MessageCircle className="w-5 h-5" /> <span className="text-[10px]">Comment</span></div>
                     <div className="flex flex-col items-center"><Share2 className="w-5 h-5" /> <span className="text-[10px]">Repost</span></div>
                     <div className="flex flex-col items-center"><Send className="w-5 h-5" /> <span className="text-[10px]">Send</span></div>
                  </div>
               )}

               {/* Instagram Text */}
               {activePreview === 'instagram' && (
                  <div className="px-4 pb-6">
                     <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                        1,240 likes
                     </p>
                     <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        <span className="font-bold text-slate-900 dark:text-white mr-2">YourBrand</span>
                        {generatedCaptions[activePreview] || <span className="text-slate-400 italic">Preview text will appear here...</span>}
                     </div>
                  </div>
               )}

            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}