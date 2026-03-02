import React from "react";
import Header from "./Header"; // your existing header component

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-white to-blue-200">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6">
        {children}
      </main>

      {/* Optional Footer */}
      <footer className="bg-blue-700 text-white p-4 text-center mt-auto">
        &copy; {new Date().getFullYear()} MedApp. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
