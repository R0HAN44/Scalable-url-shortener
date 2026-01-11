import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2, Globe, Smartphone, Monitor, Tablet, Chrome, TrendingUp, Calendar, MousePointer } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { generateMockDataForLinkDetail } from '../hooks/mockData';

export default function LinkDetail() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setData(generateMockDataForLinkDetail());
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600">Loading analytics...</p>
      </div>
    );
  }

  const { link, dailyStats, analytics } = data;

  // Process analytics data
  const topLocation = analytics.byCountry[0];
  const topDevice = analytics.byDevice[0];
  const topBrowser = analytics.byBrowser[0];

  // Format daily stats for chart
  const chartData = dailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clicks: parseInt(stat.total_clicks),
    unique: parseInt(stat.unique_ips)
  }));

  // Device distribution for pie chart
  const deviceData = analytics.byDevice.map(d => ({
    name: capitalizeDevice(d.device),
    value: parseInt(d.clicks)
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-10 px-4 space-y-8">
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Link Info Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{link.title || 'Untitled Link'}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="font-mono bg-slate-100 px-3 py-1 rounded">/{link.short_code}</span>
                <span className="text-slate-400">→</span>
                <a href={link.original_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-md">
                  {link.original_url}
                </a>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                <span>Created {new Date(link.created_at).toLocaleDateString()}</span>
                {link.expires_at && (
                  <span className="text-orange-600">Expires {new Date(link.expires_at).toLocaleDateString()}</span>
                )}
                <span className={`px-2 py-1 rounded ${link.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {link.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard 
            title="Total Clicks" 
            value={link.total_clicks.toLocaleString()} 
            icon={<MousePointer className="text-blue-500" />} 
          />
          <StatCard 
            title="Top Location" 
            value={topLocation.country_code} 
            subtitle={`${topLocation.clicks.toLocaleString()} clicks`}
            icon={<Globe className="text-indigo-500" />} 
          />
          <StatCard 
            title="Top Device" 
            value={capitalizeDevice(topDevice.device)} 
            subtitle={`${topDevice.clicks.toLocaleString()} clicks`}
            icon={getDeviceIcon(topDevice.device)} 
          />
          <StatCard 
            title="Top Browser" 
            value={topBrowser.browser} 
            subtitle={`${topBrowser.clicks.toLocaleString()} clicks`}
            icon={<Chrome className="text-emerald-500" />} 
          />
        </div>

        {/* Click Activity Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-slate-800">Click Activity Over Time</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                labelStyle={{ color: '#334155', fontWeight: 'bold' }}
              />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="Total Clicks" />
              <Line type="monotone" dataKey="unique" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} name="Unique IPs" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Device & Location Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Distribution */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Device Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analytics.byDevice.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                    <span className="text-slate-700">{capitalizeDevice(device.device)}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{device.clicks.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Top Countries</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.byCountry.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis dataKey="country_code" type="category" stroke="#64748b" style={{ fontSize: '12px' }} width={40} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="clicks" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Browser Breakdown */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Browser Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.byBrowser.map((browser, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                <div className="text-3xl font-bold text-slate-800 mb-1">{browser.clicks.toLocaleString()}</div>
                <div className="text-sm text-slate-600">{browser.browser}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {((browser.clicks / link.total_clicks) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Daily Performance (Last 14 Days)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Total Clicks</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Unique IPs</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Avg per IP</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {new Date(stat.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 text-right font-semibold">
                      {stat.total_clicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 text-right">
                      {stat.unique_ips.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 text-right">
                      {(stat.total_clicks / stat.unique_ips).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-black text-slate-800">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function capitalizeDevice(device) {
  if (!device || device === 'N/A') return 'N/A';
  return device.charAt(0).toUpperCase() + device.slice(1);
}

function getDeviceIcon(device) {
  switch(device?.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="text-emerald-500" />;
    case 'tablet':
      return <Tablet className="text-purple-500" />;
    case 'desktop':
      return <Monitor className="text-blue-500" />;
    default:
      return <Smartphone className="text-slate-500" />;
  }
}