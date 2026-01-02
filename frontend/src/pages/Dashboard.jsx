import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import api from '../api/client';
import { Plus, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: links, loading, error, refetch } = useFetch('/links');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsCreating(true);
    try {
      await api.post('/links', { original_url: url });
      setUrl('');
      refetch(); 
    } catch (err) {
      alert("Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">My Links</h1>
        <p className="text-slate-500">Scale your reach with shortened URLs.</p>
      </header>

      {/* Input Section */}
      <form onSubmit={handleCreate} className="flex gap-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <input 
          type="url"
          required
          placeholder="Paste a long link..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-lg outline-none"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button 
          type="submit"
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:bg-blue-300"
        >
          {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Shorten
        </button>
      </form>

      {/* Links List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading && <div className="p-10 text-center text-slate-400">Loading links...</div>}
        {error && <div className="p-10 text-center text-red-500">{error}</div>}
        
        {!loading && !error && (
          <div className="divide-y divide-slate-100">
            {links?.map((link) => (
              <div key={link.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-bold text-blue-600">/{link.short_code}</h3>
                  <p className="text-sm text-slate-400 truncate max-w-xs">{link.original_url}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right px-4 border-r border-slate-100">
                    <span className="block font-bold text-slate-700">{link.total_clicks}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Clicks</span>
                  </div>
                  <Link to={`/link/${link.id}`} className="p-2 text-slate-400 hover:text-blue-600 transition">
                    <ExternalLink size={20} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}