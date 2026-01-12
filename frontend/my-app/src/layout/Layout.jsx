import React from "react";
import Navbar from "../component/navbar";
import Footer from "../component/Footer";
import { Outlet } from "react-router-dom";

function Layout(){
    return(
        <div className="min-h-screen transition-colors duration-300
        bg-white text-black
        dark:bg-[#0b0f1a] dark:text-white">
            <Navbar />
                <Outlet />
            <Footer />
        </div>
    )
}

export default Layout;
