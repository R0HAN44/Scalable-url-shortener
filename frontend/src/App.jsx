import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LinkDetail from './pages/LinkDetail';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-10">
        <span className="font-black text-2xl tracking-tighter text-blue-600">LYNK.</span>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/link/:id" element={<LinkDetail />} />
        </Routes>
      </main>
    </div>
  );
}