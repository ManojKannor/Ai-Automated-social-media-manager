import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import AiLoader from "../component/AiLoader"; // Or any loading spinner you have

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  useEffect(() => {
    // If finished loading AND user is NOT logged in, redirect to login automatically
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  // 1. While Auth0 is checking status, show a spinner
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <AiLoader text="Checking authentication..." />
      </div>
    );
  }

  // 2. If logged in, show the page
  if (isAuthenticated) {
    return children;
  }

  // 3. If not logged in, return null (the useEffect above will redirect them)
  return null;
};

export default ProtectedRoute;