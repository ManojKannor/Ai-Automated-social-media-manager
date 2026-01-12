import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";
import { 
  Facebook, 
  Linkedin, 
  Instagram, 
  CheckCircle2, 
  AlertCircle, 
  Link2, 
  Trash2, 
  ExternalLink 
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const {user} = useAuth0();
  // 1. Fetch current connection status from DB
  useEffect(() => {
    if (searchParams.get("status") === "success") {
      alert("Account Connected Successfully! 🎉");
      fetchConnectedAccounts(); // List refresh karein
      window.history.replaceState({}, document.title, window.location.pathname);
    }

  }, [searchParams]);

  useEffect(()=> {
    fetchConnectedAccounts()
  },[])

  const fetchConnectedAccounts = async () => {
    try {
      // Create this endpoint in your backend to return list of connected platforms
      // Expected response: [{ platform: "facebook", username: "MyPage" }, ...]
      const res = await axios.get(`http://127.0.0.1:8000/connected/accounts/auth0%7C1`); 
      // utilizing your existing stats endpoint which returns connected accounts
      console.log("connected accounts",res.data)
      setAccounts(res.data || []);
      
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Connect (Redirect to Backend OAuth)
  const handleConnect = (platform) => {
    let authUrl = "";
    
    if (platform === "facebook" || platform === "instagram") {
      // Redirects to your FastAPI endpoint that starts Facebook Login
      // Ensure you have this endpoint in main.py
      authUrl = "http://localhost:8000/connect/meta"; 
    } else if (platform === "linkedin") {
      authUrl = "http://localhost:8000/connect/linkedin";
    }

    if (authUrl) {
      window.location.href = authUrl; 
      // Full page redirect for OAuth
    }
  };

  // 3. Handle Disconnect (Delete from DB)
  const handleDisconnect = async (platform) => {
    if(!window.confirm(`Are you sure you want to disconnect ${platform}?`)) return;

    try {
      let response = await axios.delete(`http://localhost:8000/disconnect/${encodeURIComponent("auth0|1")}/${platform}`);

      console.log(response.data)
      // Refresh list after deletion
      fetchConnectedAccounts();
    } catch (error) {
      alert("Error disconnecting account");
      console.error(error);
    }
  };

  // Helper to check if a specific platform is in the 'accounts' array
  const getAccountStatus = (platformName) => {
    if(!Array.isArray(accounts)) return null
    return accounts.find(acc => acc.platform.toLowerCase() === platformName.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] p-8 text-slate-900 dark:text-white">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Connected Accounts
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage the social profiles you want AutoPostX to publish to.
        </p>
      </div>

      {/* Grid of Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* --- FACEBOOK CARD --- */}
        <AccountCard 
          platform="facebook"
          name="Facebook Page"
          description="Connect to publish posts and view follower insights."
          icon={<Facebook className="w-8 h-8 text-blue-600" />}
          connectedData={getAccountStatus("facebook")}
          onConnect={() => handleConnect("facebook")}
          onDisconnect={() => handleDisconnect("facebook")}
          color="border-blue-500"
        />

        {/* --- INSTAGRAM CARD --- */}
        <AccountCard 
          platform="instagram"
          name="Instagram Business"
          description="Required: Your Instagram must be linked to a Facebook Page."
          icon={<Instagram className="w-8 h-8 text-pink-600" />}
          connectedData={getAccountStatus("instagram")}
          onConnect={() => handleConnect("facebook")} // Instagram connects via Facebook Login
          onDisconnect={() => handleDisconnect("instagram")}
          color="border-pink-500"
        />

        {/* --- LINKEDIN CARD --- */}
        <AccountCard 
          platform="linkedin"
          name="LinkedIn Organization"
          description="Connect your personal profile or company page."
          icon={<Linkedin className="w-8 h-8 text-blue-700" />}
          connectedData={getAccountStatus("linkedin")}
          onConnect={() => handleConnect("linkedin")}
          onDisconnect={() => handleDisconnect("linkedin")}
          color="border-blue-700"
        />

      </div>

      {/* Info Section */}
      <div className="max-w-5xl mx-auto mt-12 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
        <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300">Connection Trouble?</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                If your Instagram is not appearing, ensure it is a "Business Account" and is connected to your Facebook Page in the Meta Business Suite settings.
            </p>
        </div>
      </div>

    </div>
  );
}

// --- REUSABLE CARD COMPONENT ---
function AccountCard({ platform, name, description, icon, connectedData, onConnect, onDisconnect, color }) {
    const isConnected = !!connectedData;

    return (
        <div className={`relative bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${isConnected ? color : 'border-slate-200 dark:border-slate-800'}`}>
            
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                {isConnected ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
                        <div className="w-2 h-2 rounded-full bg-slate-400" /> Disconnected
                    </span>
                )}
            </div>

            {/* Icon & Title */}
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 w-fit rounded-xl">
                {icon}
            </div>
            
            <h3 className="text-lg font-bold">{name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 h-10 mb-6">
                {isConnected && connectedData.account_name 
                    ? `Linked as: @${connectedData.account_name}`
                    : description}
            </p>

            {/* Action Button */}
            {isConnected ? (
                <button 
                    onClick={onDisconnect}
                    className="w-full py-2.5 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors text-sm"
                >
                    <Trash2 className="w-4 h-4" /> Disconnect
                </button>
            ) : (
                <button 
                    onClick={onConnect}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 rounded-xl font-bold transition-all text-sm shadow-md"
                >
                    <Link2 className="w-4 h-4" /> Connect Account
                </button>
            )}
        </div>
    );
}