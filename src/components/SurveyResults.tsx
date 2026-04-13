import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { ArrowLeft, Loader2, Users, Calendar, Hash, Star, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Result {
  id: number;
  type: string;
  text: string;
  results: any;
}

interface SurveyData {
  survey: {
    title: string;
    description: string;
    code: string;
    created_at: string;
  };
  results: Result[];
  responseCount: number;
}

const COLORS = ["#004A99", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function SurveyResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!resultsRef.current || !data) return;
    
    setExporting(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f8fafc" // match slate-50
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${data.survey.title}_natijalar.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("PDF yuklashda xatolik yuz berdi.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetch(`/api/admin/surveys/${id}/results`)
      .then(async (res) => {
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Natijalarni yuklashda xatolik.");
          } else {
            throw new Error("Serverda xatolik yuz berdi.");
          }
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="animate-spin text-brand mb-4" size={48} />
        <p className="text-slate-500">Natijalar tahlil qilinmoqda...</p>
      </div>
    );
  }

  if (!data) return <div>Ma'lumot topilmadi.</div>;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <button onClick={() => navigate("/admin")} className="text-slate-500 hover:text-brand flex items-center gap-2 mb-6 transition-colors">
            <ArrowLeft size={18} /> Orqaga
          </button>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{data.survey.title}</h2>
          <p className="text-slate-500">{data.survey.description}</p>
        </div>
        <button 
          onClick={exportToPDF}
          disabled={exporting}
          className="btn-primary flex items-center gap-2 self-start"
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          PDF Yuklab olish
        </button>
      </div>

      <div ref={resultsRef} className="p-4 -m-4 rounded-3xl">
        {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="card flex items-center gap-4">
          <div className="bg-brand-light text-brand p-3 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data.responseCount}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jami ishtirokchilar</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
            <Hash size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data.survey.code}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">So'rovnoma kodi</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {new Date(data.survey.created_at).toLocaleDateString()}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Yaratilgan sana</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-8">
        {data.results.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="card"
          >
            <div className="flex gap-4 mb-8">
              <span className="bg-brand-light text-brand w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                {idx + 1}
              </span>
              <h4 className="text-xl font-bold text-slate-800">{q.text}</h4>
            </div>

            {q.type === "star" && (
              <div className="flex flex-col md:flex-row items-center justify-around py-8 gap-8">
                <div className="text-center">
                  <div className="text-6xl font-black text-brand mb-2">{q.results.average}</div>
                  <div className="flex gap-1 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={24}
                        className={s <= Math.round(q.results.average) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                  <p className="text-slate-500 font-medium">O'rtacha baho</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 mb-2">{q.results.count}</div>
                  <p className="text-slate-500 font-medium">Jami baholar</p>
                </div>
              </div>
            )}

            {(q.type === "single" || q.type === "multiple") && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(q.results.counts).map(([name, value]) => ({ name, value }))}
                      layout="vertical"
                      margin={{ left: 40, right: 40 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "transparent" }}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {Object.entries(q.results.counts).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {Object.entries(q.results.counts).map(([name, value]: any, i) => {
                    const percentage = data.responseCount ? ((value / data.responseCount) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-medium text-slate-700">{name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400 text-sm font-bold">{value} ta</span>
                          <span className="bg-white px-2 py-1 rounded-lg text-xs font-bold text-brand border border-slate-200">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
}
