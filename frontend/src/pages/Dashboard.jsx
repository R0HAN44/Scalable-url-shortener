import { useEffect, useState } from 'react';
import { Plus, ExternalLink, Loader2, Link2, BarChart3 } from 'lucide-react';
import axiosApi from '../api/client';

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [links, setLinks] = useState([]);

  const handleCreate = async () => {
    if (!url) return;
    const isValidUrl = /^(https?:\/\/)/.test(url);
    if (!isValidUrl) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setIsCreating(true);
    try {
      const response = await axiosApi.post('/links/', { originalUrl: url });
      setLinks([response.data, ...links]);
      setUrl('');
    } catch (error) {
      console.error('Error creating shortened link:', error);
      alert('Failed to create shortened link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(()=>{
    fetchLinks();
  },[])

  const fetchLinks = async () => {
    try {
      const response = await axiosApi.get('/links/');
      console.log(response.data)
      setLinks(response.data);
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const copyToClipboard = (shortCode) => {
    navigator.clipboard.writeText(`${window.location.origin}/${shortCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Link2 className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Link Shortener</h1>
          </div>
          <p className="text-lg text-slate-600">Create, manage, and track your shortened URLs</p>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Links</p>
                <p className="text-3xl font-bold text-slate-900">{links.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Link2 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Clicks</p>
                <p className="text-3xl font-bold text-slate-900">
                  {links.reduce((sum, link) => sum + link.total_clicks, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <BarChart3 className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Clicks</p>
                <p className="text-3xl font-bold text-slate-900">
                  {links.length > 0 ? Math.round(links.reduce((sum, link) => sum + link.total_clicks, 0) / links.length) : 0}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Create Link Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Shorten a new link
            </label>
            <div className="flex gap-3">
              <input 
                type="url"
                required
                placeholder="https://example.com/your-long-url"
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Shorten
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Links List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Your Links</h2>
          </div>
          
          {links.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Link2 className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 text-lg">No links yet</p>
              <p className="text-slate-400 text-sm mt-1">Create your first shortened link above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {links.map((link) => (
                <div key={link.id} className="p-6 hover:bg-slate-50 transition-colors duration-150">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => copyToClipboard(link.short_code)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-mono font-semibold text-sm transition-colors group"
                        >
                          <Link2 size={14} />
                          /{link.short_code}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                            Copy
                          </span>
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 truncate pr-4">
                        {link.original_url}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right px-4 border-r border-slate-200">
                        <span className="block text-2xl font-bold text-slate-900">
                          {link.total_clicks.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                          Clicks
                        </span>
                      </div>
                      <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}