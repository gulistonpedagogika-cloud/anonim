import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, BarChart3, Trash2, Globe, Lock, MoreVertical, ExternalLink, Loader2 } from "lucide-react";

interface Survey {
  id: number;
  title: string;
  description: string;
  code: string;
  status: "draft" | "published";
  created_at: string;
}

export function AdminPanel() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ type: string; host: string; error?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveys();
    fetchDbStatus();
  }, []);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/db-status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error("DB Status fetch error:", err);
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/admin/surveys");
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Server xatoligi: ${res.status}`);
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text);
          throw new Error(`Server xatoligi: ${res.status}. Ma'lumotlar bazasiga ulanishni tekshiring.`);
        }
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setSurveys(data);
      } else {
        console.error("Expected array from /api/admin/surveys, got:", data);
        setSurveys([]);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setSurveys([]);
      alert(err.message || "So'rovnomalarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "draft" ? "published" : "draft";
    try {
      await fetch(`/api/admin/surveys/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSurveys();
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm("Haqiqatdan ham ushbu so'rovnomani o'chirmoqchimisiz?")) return;
    try {
      await fetch(`/api/admin/surveys/${id}`, { method: "DELETE" });
      fetchSurveys();
    } catch (err) {
      alert("Xatolik yuz berdi");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Admin Panel</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500">Barcha so'rovnomalarni boshqarish va tahlil qilish.</p>
            {dbStatus && (
              <div className="flex flex-col items-start gap-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  dbStatus.type === "mysql" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
                }`}>
                  DB: {dbStatus.type} ({dbStatus.host})
                </span>
                {dbStatus.error && (
                  <span className="text-[9px] text-red-500 font-medium">
                    Xato: {dbStatus.error}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <Link to="/admin/new" className="btn-primary flex items-center gap-2 self-start">
          <Plus size={20} /> Yangi so'rovnoma
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-brand" size={48} />
        </div>
      ) : surveys.length === 0 ? (
        <div className="card text-center py-24">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Hali so'rovnomalar yo'q</h3>
          <p className="text-slate-500 mb-8">Birinchi so'rovnomangizni yarating va ishni boshlang.</p>
          <Link to="/admin/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} /> Yangi so'rovnoma
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <motion.div
              key={survey.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card group hover:border-brand/50 transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  survey.status === "published" 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {survey.status === "published" ? "Chop etilgan" : "Qoralama"}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => deleteSurvey(survey.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{survey.title}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-grow">{survey.description}</p>

              <div className="bg-slate-50 p-3 rounded-xl mb-6 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kod:</span>
                <code className="text-brand font-mono font-bold">{survey.code}</code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/admin/results/${survey.id}`)}
                  className="btn-secondary py-2 px-3 text-sm flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} /> Natijalar
                </button>
                <button
                  onClick={() => toggleStatus(survey.id, survey.status)}
                  className={`py-2 px-3 text-sm rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    survey.status === "published"
                      ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {survey.status === "published" ? (
                    <><Lock size={16} /> To'xtatish</>
                  ) : (
                    <><Globe size={16} /> Chop etish</>
                  )}
                </button>
              </div>
              
              {survey.status === "published" && (
                <Link
                  to={`/survey/${survey.code}`}
                  target="_blank"
                  className="mt-4 text-xs text-brand hover:underline flex items-center justify-center gap-1"
                >
                  So'rovnomani ko'rish <ExternalLink size={12} />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
