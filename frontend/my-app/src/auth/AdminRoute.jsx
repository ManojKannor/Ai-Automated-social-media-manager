import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import CreatePost from "../pages/CreatePost";
import AiLoader from "../component/AiLoader";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const NAMESPACE = 'https://my-app-name/roles'; // Must match your Auth0 Action

  if (isLoading) {
    return <AiLoader text="Verifying Permissions..." />;
  }

  // 1. Check if logged in
  if (!isAuthenticated) {
    return <Navigate to="/" />;
    <CreatePost userId = {user?.sub} />
  }

  // 2. Check for Admin Role
  const userRoles = user?.[NAMESPACE] || [];
  if (!userRoles.includes('admin')) {
    // If user is logged in but NOT admin, kick them out
    return <Navigate to="/unauthorized" />; 
  }

  // 3. If Admin, show the dashboard
  return children;
};

export default AdminRoute;