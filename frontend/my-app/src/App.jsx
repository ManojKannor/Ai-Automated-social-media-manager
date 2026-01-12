import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "./auth/AdminRoute";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import Accounts from "./pages/Accounts";
import AboutUs from "./pages/AboutUs";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
            } />
          <Route path="createpost" element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
            } />
          <Route path="admindashboard" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
            }/>
          <Route path="accounts" element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
            } />
          <Route path="aboutus" element={<AboutUs />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

