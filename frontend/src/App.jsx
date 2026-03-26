import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Search, TrendingUp, Heart, X, RefreshCw } from 'lucide-react';
import * as Contract from './Contract';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>Something went wrong</h2>
        <pre style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
        <button className="btn-connect" style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
    return this.props.children;
  }
}

const App = () => {
  const [address, setAddress]           = useState(null);
  const [xlmBalance, setXlmBalance]     = useState(null);
  const [campaigns, setCampaigns]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [txLoading, setTxLoading]       = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [donateTarget, setDonateTarget] = useState(null);
  const [donateAmount, setDonateAmount] = useState('');
  const [search, setSearch]             = useState('');
  const [toast, setToast]               = useState({ msg: '', error: false });

  const notify = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast({ msg: '', error: false }), 6000);
  };

  const refreshBalance = useCallback(async (addr) => {
    if (!addr) return;
    const bal = await Contract.getXLMBalance(addr);
    setXlmBalance(bal);
  }, []);

  const connect = async () => {
    try {
      const addr = await Contract.getPublicKey();
      if (addr) {
        setAddress(addr);
        notify('Wallet connected: ' + addr.slice(0, 6) + '…' + addr.slice(-4));
        refreshBalance(addr);
      }
    } catch (e) {
      notify('Wallet error: ' + (e?.message || String(e)), true);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const result = await Contract.fetchCampaigns();
      if (Array.isArray(result)) setCampaigns(result);
    } catch (e) { console.error('fetch error', e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Create Campaign ──────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!address) { await connect(); return; }

    const data        = new FormData(e.target);
    const title       = data.get('title')?.trim() || '';
    const description = data.get('description')?.trim() || '';
    const goal        = Number(data.get('goal'));
    const deadlineStr = data.get('deadline');

    if (!title || !description || !goal || !deadlineStr) {
      notify('Please fill all fields', true); return;
    }
    const deadline = Math.floor(new Date(deadlineStr).getTime() / 1000);

    setTxLoading(true);
    try {
      await Contract.createCampaign(address, title, description, goal, deadline);
      notify('🎉 Campaign created on Testnet!');
      setShowCreate(false);
      e.target.reset();
      await fetchAll();
    } catch (err) {
      console.error('create error', err);
      notify('Failed: ' + (err?.message || 'Unknown error'), true);
    }
    setTxLoading(false);
  };

  // ── Donate ───────────────────────────────────────────────────────────────────
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!address) { await connect(); return; }

    const amount = Number(donateAmount);
    if (!amount || amount <= 0) { notify('Enter a valid XLM amount', true); return; }
    if (xlmBalance !== null && amount > xlmBalance) {
      notify(`Insufficient balance. You have ${xlmBalance.toFixed(4)} XLM.`, true);
      return;
    }

    setTxLoading(true);
    try {
      await Contract.donate(address, donateTarget.id, amount);
      notify(`💙 Donated ${amount} XLM to "${donateTarget.title}"!`);
      setDonateTarget(null);
      setDonateAmount('');
      await Promise.all([fetchAll(), refreshBalance(address)]);
    } catch (err) {
      console.error('donate error', err);
      notify('Donation failed: ' + (err?.message || 'Unknown error'), true);
    }
    setTxLoading(false);
  };

  // ── Withdraw ─────────────────────────────────────────────────────────────────
  const handleWithdraw = async (campaign) => {
    if (!address) { await connect(); return; }
    
    setTxLoading(true);
    try {
      await Contract.withdraw(address, campaign.id);
      notify(`🎉 Successfully withdrew ${campaign.amount_raised.toFixed(2)} XLM from "${campaign.title}"!`);
      await Promise.all([fetchAll(), refreshBalance(address)]);
    } catch (err) {
      console.error('withdraw error', err);
      notify('Withdraw failed: ' + (err?.message || 'Unknown error'), true);
    }
    setTxLoading(false);
  };

  const shortAddr = (addr) => {
    if (!addr || typeof addr !== 'string') return '';
    return addr.slice(0, 4) + '…' + addr.slice(-4);
  };

  const filtered = campaigns.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ErrorBoundary>
      <div className="container">
        {/* Nav */}
        <nav>
          <div className="logo">MICRO<span>FUND</span></div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {address && xlmBalance !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <span style={{ color: xlmBalance > 0 ? '#7dd3fc' : '#f87171', fontWeight: 600 }}>
                  {xlmBalance.toFixed(2)} XLM
                </span>
                <button
                  onClick={() => refreshBalance(address)}
                  title="Refresh balance"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#555' }}
                >
                  <RefreshCw style={{ width: 12 }} />
                </button>
              </div>
            )}
            <button onClick={connect} className="btn-connect">
              <Wallet style={{ width: 16, marginRight: 8, verticalAlign: 'middle' }} />
              {address ? shortAddr(address) : 'Connect Wallet'}
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <h1>Decentralized micro-donations.</h1>
          <p>Built on Stellar. Fast, transparent, and direct funding for projects that matter.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-connect"
            style={{ marginTop: '2.5rem', padding: '1rem 2rem' }}
          >
            Start a campaign
          </button>
        </section>

        {/* Campaign List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Active Projects
            {!loading && campaigns.length > 0 && (
              <span style={{ fontSize: '1rem', color: '#555', fontWeight: 400, marginLeft: 8 }}>({campaigns.length})</span>
            )}
          </h2>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 14, top: 13, width: 16, color: '#555' }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '3rem', margin: 0, width: 260 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '8rem 0', color: '#555' }}>
            Loading from Stellar network…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem', border: '1px dashed #222', borderRadius: 24 }}>
            <TrendingUp style={{ marginBottom: 16, color: '#333', width: 36, height: 36 }} />
            <h3 style={{ marginBottom: 8, fontSize: '1.2rem' }}>
              {search ? 'No matching campaigns' : 'No campaigns yet'}
            </h3>
            <p style={{ color: '#555', marginBottom: '1.5rem' }}>
              {search ? 'Try a different search term.' : 'Be the first to create one on-chain.'}
            </p>
            {!search && (
              <button onClick={() => setShowCreate(true)} className="btn-connect">Start a campaign</button>
            )}
          </div>
        ) : (
          <div className="campaign-grid">
            {filtered.map((c) => {
              const pct     = c.goal > 0 ? Math.min(Math.round((c.amount_raised / c.goal) * 100), 100) : 0;
              const expired = c.deadline < Math.floor(Date.now() / 1000);
              const canSupport = !expired && !c.withdrawn;
              return (
                <div key={c.id} className="card">
                  <div className="card-title">{c.title}</div>
                  <div className="card-desc">{c.description}</div>
                  <div className="progress-container">
                    <div className="progress-labels">
                      <span>{c.amount_raised.toFixed(2)} XLM raised</span>
                      <span style={{ color: '#666' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: 8, color: '#555' }}>
                      <span>Goal: {c.goal.toFixed(2)} XLM</span>
                      <span style={{ color: expired ? '#f87171' : '#555' }}>
                        {expired ? 'Ended' : 'Ends'}: {new Date(c.deadline * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span style={{ fontSize: '0.75rem', color: '#555' }}>#{shortAddr(c.creator)}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {address === c.creator && !c.withdrawn && (pct >= 100 || expired) && (
                        <button
                          className="btn-action"
                          onClick={() => handleWithdraw(c)}
                          disabled={txLoading}
                          style={{ background: '#4ade80', color: '#000', border: 'none' }}
                        >
                          Withdraw
                        </button>
                      )}
                      {address !== c.creator && (
                        <button
                          className="btn-action"
                          disabled={!canSupport}
                          onClick={() => {
                            if (!address) { connect(); return; }
                            setDonateTarget(c);
                            setDonateAmount('');
                          }}
                          style={{ opacity: canSupport ? 1 : 0.4, cursor: canSupport ? 'pointer' : 'not-allowed' }}
                        >
                          <Heart style={{ width: 13, marginRight: 5, verticalAlign: 'middle' }} />
                          {c.withdrawn ? 'Withdrawn' : expired ? 'Ended' : 'Support'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Launch Campaign</h2>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                  <X style={{ width: 20 }} />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <input name="title" placeholder="Project name" required />
                <textarea name="description" placeholder="Short description…" required style={{ height: 100, resize: 'none' }} />
                <input name="goal" type="number" step="0.0000001" min="0.0000001" placeholder="Funding goal (XLM)" required />
                <input name="deadline" type="date" required min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-connect" style={{ background: '#111', color: 'white', flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-connect" style={{ flex: 1, background: '#22d3ee', color: 'black' }} disabled={txLoading}>
                    {txLoading ? 'Deploying…' : 'Deploy Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Donate Modal */}
        {donateTarget && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDonateTarget(null)}>
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Support with XLM</h2>
                <button onClick={() => setDonateTarget(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                  <X style={{ width: 20 }} />
                </button>
              </div>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#0a0a0a', borderRadius: 12, border: '1px solid #1a1a1a' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{donateTarget.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  {donateTarget.amount_raised.toFixed(4)} / {donateTarget.goal.toFixed(4)} XLM raised
                </div>
              </div>
              {xlmBalance !== null && (
                <div style={{ fontSize: '0.8rem', marginBottom: '1rem', color: xlmBalance > 0 ? '#7dd3fc' : '#f87171' }}>
                  Your balance: <strong>{xlmBalance.toFixed(4)} XLM</strong>
                </div>
              )}
              <form onSubmit={handleDonate}>
                <input
                  type="number"
                  step="0.0000001"
                  min="0.0000001"
                  max={xlmBalance ?? undefined}
                  placeholder="Amount to donate (XLM)"
                  value={donateAmount}
                  onChange={e => setDonateAmount(e.target.value)}
                  required
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" onClick={() => setDonateTarget(null)} className="btn-connect" style={{ background: '#111', color: 'white', flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-connect" style={{ flex: 1, background: '#7dd3fc', color: 'black' }} disabled={txLoading}>
                    {txLoading ? 'Sending…' : `Donate ${donateAmount || '?'} XLM`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.msg && (
          <div className="status-toast" style={{
            background:  toast.error ? '#1a0000' : undefined,
            borderColor: toast.error ? '#f87171' : undefined,
            color:       toast.error ? '#f87171' : undefined,
          }}>
            {toast.msg}
          </div>
        )}

        <footer style={{ marginTop: '8rem', padding: '3rem 0', borderTop: '1px solid #111', color: '#333', textAlign: 'center', fontSize: '0.8rem' }}>
          MicroFund Protocol v1.0 · Stellar Testnet
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
