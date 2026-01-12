import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useTheme } from "../context/ThemeContext";
import CreatePost from "../pages/CreatePost";

export default function Navbar() {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const { theme, toggleTheme } = useTheme();

  // 1. Get Admin Status
  const NAMESPACE = 'https://my-app-name/roles';
  const isAdmin = user?.[NAMESPACE]?.includes('admin');
  console.log("user : ",user)
  console.log("namespace : " , NAMESPACE)
  console.log("user role found : ",user?.[NAMESPACE])
  // 2. Define Links Array
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/createpost", label: "Create Post" },
    // Only add this if isAdmin is true
    ...(isAdmin ? [{ path: "/admindashboard", label: "Admin Dashboard" }] : []), 
    { path: "/accounts", label: "Accounts" },
    { path: "/aboutus", label:"About Us"}
    
  ];

  return (
    
    <nav className="sticky top-0 w-full z-50 backdrop-blur-xl bg-white/70 dark:bg-black/40 border-b border-black/10 dark:border-white/10 transition">
      
      <div className="max-w-7xl mx-auto px-10 h-[72px] flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            AutoPOSTX
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
            AI
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex gap-10 text-sm font-medium text-gray-700 dark:text-gray-300">
          
          {/* 3. Map over the filtered links */}
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `transition ${
                  isActive
                    ? "text-black dark:text-white"
                    : "hover:text-black dark:hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-lg transition"
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* Auth Buttons */}
          {!isAuthenticated ? (
            <>
              <button
                onClick={() =>
                  loginWithRedirect({
                    authorizationParams: { screen_hint: "login" },
                  })
                }
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition"
              >
                Login
              </button>

              <button
                onClick={() =>
                  loginWithRedirect({
                    authorizationParams: { screen_hint: "signup" },
                  })
                }
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 dark:bg-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.[0]}
                </div>
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {user?.name}
                </span>
              </div>

              <button
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
                className="px-4 py-2 rounded-xl text-sm font-semibold text-red-500 border border-red-500/30 hover:bg-red-500/10 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}