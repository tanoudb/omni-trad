
import React, { useState } from 'react';
import { Source } from '../types';

interface SourceManagerProps {
  sources: Source[];
  setSources: React.Dispatch<React.SetStateAction<Source[]>>;
}

const SourceManager: React.FC<SourceManagerProps> = ({ sources, setSources }) => {
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const addSource = () => {
    if (!newUrl.startsWith('http')) {
      setError('Invalid URL format');
      return;
    }
    
    const id = btoa(newUrl).substring(0, 8);
    if (sources.find(s => s.id === id)) {
      setError('Source already exists');
      return;
    }

    setSources([...sources, {
      id,
      name: newName || 'Unnamed Source',
      url: newUrl,
      lastUpdated: Date.now()
    }]);
    
    setNewUrl('');
    setNewName('');
    setError('');
  };

  const removeSource = (id: string) => {
    if (sources.length <= 1) return;
    setSources(sources.filter(s => s.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Manage Sources</h2>
      
      <div className="bg-slate-800 rounded-2xl p-6 mb-10 shadow-xl border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Add New Source</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Source Name</label>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Secret Catalog"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">JSON URL</label>
            <input 
              type="url" 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/catalog.json"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 ring-blue-500 outline-none transition-all"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button 
            onClick={addSource}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            Add Source
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold px-2">Active Sources</h3>
        {sources.map(s => (
          <div key={s.id} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50">
            <div className="min-w-0 pr-4">
              <h4 className="font-bold truncate">{s.name}</h4>
              <p className="text-xs text-slate-500 truncate">{s.url}</p>
            </div>
            <button 
              onClick={() => removeSource(s.id)}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Remove source"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourceManager;
