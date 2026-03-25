import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Search, Coins, ArrowRight, ShieldCheck, Clock, User, LogIn } from 'lucide-react';
import * as Contract from './Contract';

const App = () => {
  const [address, setAddress] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [search, setSearch] = useState("");

  const connectWallet = async () => {
    try {
      const pubKey = await Contract.getPublicKey();
      setAddress(pubKey);
      setStatus({ message: pubKey ? "Wallet connected!" : "Failed to connect", type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    } catch (e) {
      console.error(e);
      setStatus({ message: "Is Freighter installed?", type: 'error' });
    }
  };

  const loadCampaigns = async () => {
    // Check cache first
    const cached = localStorage.getItem('microfund_campaigns');
    if (cached) {
      setCampaigns(JSON.parse(cached));
      setLoading(false);
    }
    
    // Fetch from contract (mocked for now)
    const result = await Contract.fetchCampaigns();
    setCampaigns(result);
    localStorage.setItem('microfund_campaigns', JSON.stringify(result));
    setLoading(false);
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleCreate = async (data) => {
    if (!address) return connectWallet();
    setLoading(true);
    try {
      await Contract.createCampaign(address, data.title, data.description, data.goal, data.deadline);
      setStatus({ message: "Campaign created successfully!", type: 'success' });
      setShowCreate(false);
      loadCampaigns();
    } catch (err) {
      setStatus({ message: "Creation failed. Try again.", type: 'error' });
    }
    setLoading(false);
  };

  const currentCampaigns = campaigns.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Status Toasts */}
      <AnimatePresence>
        {status.message && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border ${status.type === 'success' ? 'bg-indigo-900/80 border-indigo-400' : 'bg-red-900/80 border-red-400'} backdrop-blur-md`}
          >
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar address={address} onConnect={connectWallet} />

      <main className="max-w-6xl mx-auto mt-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold neon-text mb-4">Empower Innovation</h1>
            <p className="text-dim text-lg">Support grassroots projects with MicroTokens.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dim w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search campaigns..." 
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 w-full md:w-64 backdrop-blur-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> Start project
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentCampaigns.map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} userAddress={address} />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreateModal 
            onClose={() => setShowCreate(false)} 
            onSubmit={handleCreate} 
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

const Navbar = ({ address, onConnect }) => (
  <nav className="flex items-center justify-between max-w-7xl mx-auto glass-card p-4 px-6 md:px-10 rounded-3xl">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <ShieldCheck className="text-white w-6 h-6" />
      </div>
      <span className="text-xl font-bold tracking-tight">MicroFund <span className="text-indigo-400">v1.0</span></span>
    </div>
    <div className="flex items-center gap-6">
      <div className="hidden md:flex gap-6 text-dim font-medium">
        <a href="#" className="hover:text-white transition-colors">Explore</a>
        <a href="#" className="hover:text-white transition-colors">How it works</a>
        <a href="#" className="hover:text-white transition-colors">Community</a>
      </div>
      <button onClick={onConnect} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all border border-slate-700/50">
        <Wallet className="w-4 h-4 text-indigo-400" />
        {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "Connect Wallet"}
      </button>
    </div>
  </nav>
);

const CampaignCard = ({ campaign, userAddress }) => {
  const progress = Math.min((campaign.amount_raised / campaign.goal) * 100, 100);
  const isCreator = userAddress === campaign.creator;
  const isFinished = campaign.deadline < Date.now() / 1000 || campaign.amount_raised >= campaign.goal;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card flex flex-col p-6 h-full relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
           ID: #{campaign.id}
        </div>
        <div className="flex items-center gap-1 text-dim text-sm">
          <Clock className="w-3.5 h-3.5" />
          {new Date(campaign.deadline * 1000).toLocaleDateString()}
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">{campaign.title}</h3>
      <p className="text-dim text-sm mb-6 flex-grow line-clamp-3 leading-relaxed">{campaign.description}</p>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold text-white">{campaign.amount_raised} MT <span className="text-dim font-normal">raised</span></span>
          <span className="text-dim">Goal: {campaign.goal} MT</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 btn-primary text-sm py-3 flex items-center justify-center gap-2">
           Donate
        </button>
        {isCreator && isFinished && !campaign.withdrawn && (
          <button className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 rounded-xl transition-all">
            Withdraw
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-2 text-xs text-dim">
        <User className="w-3 h-3" />
        {campaign.creator.substring(0, 15)}...
      </div>
    </motion.div>
  );
};

const CreateModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ title: '', description: '', goal: '', deadline: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-card w-full max-w-lg p-8 relative z-10">
        <h2 className="text-2xl font-bold mb-6">Launch New Campaign</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Campaign Title</label>
            <input 
              placeholder="e.g. Revolutionary Solar Cooker" 
              className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none"
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Description</label>
            <textarea 
              rows="4" 
              placeholder="Explain why people should fund you..." 
              className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none resize-none"
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Funding Goal (MT)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none"
                onChange={e => setFormData({...formData, goal: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Deadline</label>
              <input 
                type="date" 
                className="w-full bg-slate-800/80 border border-slate-700 p-3 rounded-xl focus:border-indigo-500 outline-none"
                onChange={e => setFormData({...formData, deadline: new Date(e.target.value).getTime() / 1000})}
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors">Cancel</button>
          <button onClick={() => onSubmit(formData)} className="btn-primary flex-1 py-3">Deploy Campaign</button>
        </div>
      </motion.div>
    </div>
  );
};

const Footer = () => (
  <footer className="mt-24 py-12 border-t border-slate-800 max-w-6xl mx-auto text-center">
    <div className="flex justify-center gap-6 mb-8 text-dim">
      <a href="#" className="hover:text-white">Twitter</a>
      <a href="#" className="hover:text-white">Discord</a>
      <a href="#" className="hover:text-white">Docs</a>
    </div>
    <p className="text-dim text-sm">© 2026 MicroFund dApp. Powered by Stellar Soroban.</p>
  </footer>
);

export default App;
