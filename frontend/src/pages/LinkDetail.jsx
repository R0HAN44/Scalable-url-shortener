import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { ArrowLeft, BarChart2, Globe, Smartphone } from 'lucide-react';

export default function LinkDetail() {
  const { id } = useParams();
  const { data: link, loading } = useFetch(`/links/${id}`);

  if (loading) return <div className="p-20 text-center">Loading analytics...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-8">
      <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition">
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Performance" value={link?.total_clicks || 0} icon={<BarChart2 className="text-blue-500" />} />
        <StatCard title="Top Location" value="US" icon={<Globe className="text-indigo-500" />} />
        <StatCard title="Primary Device" value="Desktop" icon={<Smartphone className="text-emerald-500" />} />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 h-64 flex flex-col items-center justify-center text-slate-400">
        <p className="italic">Click activity graph for <b>{link?.short_code}</b> will be rendered here.</p>
        <p className="text-xs mt-2 uppercase tracking-widest">Connect Recharts in the next step</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-black text-slate-800">{value}</div>
    </div>
  );
}