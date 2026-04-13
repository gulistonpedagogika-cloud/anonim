import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { SurveyView } from "./components/SurveyView";
import { AdminPanel } from "./components/AdminPanel";
import { SurveyEditor } from "./components/SurveyEditor";
import { SurveyResults } from "./components/SurveyResults";
import { AdminLogin } from "./components/AdminLogin";
import { GraduationCap, LogOut } from "lucide-react";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("admin_auth") === "true";
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    window.location.href = "/";
  };

  const isAuthenticated = localStorage.getItem("admin_auth") === "true";

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-brand p-2 rounded-xl text-white group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight text-slate-900">GulDPI</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Anonim So'rovnoma</p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="text-sm font-semibold text-red-500 hover:text-red-600 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={18} /> Chiqish
                </button>
              ) : (
                <Link to="/admin" className="text-sm font-semibold text-slate-600 hover:text-brand transition-colors">
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/survey/:code" element={<SurveyView />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/new" element={
              <ProtectedRoute>
                <SurveyEditor />
              </ProtectedRoute>
            } />
            <Route path="/admin/results/:id" element={
              <ProtectedRoute>
                <SurveyResults />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} Guliston davlat pedagogika instituti. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
