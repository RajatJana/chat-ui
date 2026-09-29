import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Clock, 
  Activity, 
  Sparkles, 
  CheckCircle, 
  FileText,
  AlertCircle,
  RefreshCw,
  Star,
  ShieldAlert,
  Zap,
  Cpu,
  Layers,
  Code
} from 'lucide-react';
import './index.css';

const PDO_BASE = `http://10.73.86.59:8001`;

// --- UI Components ---
const InfoCard = ({ label, value, icon, color = 'var(--primary)' }) => (
   <div style={{
      background: 'var(--bg-main)',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: 'var(--shadow-sm)'
   }}>
      <div style={{
         width: 42, height: 42, borderRadius: 10,
         background: `color-mix(in srgb, ${color} 12%, transparent)`,
         color: color,
         display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
         {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            {label}
         </div>
         <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value || '—'}
         </div>
      </div>
   </div>
);

export default function EpisodesPage() {
   const [episodes, setEpisodes] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [selectedEpisode, setSelectedEpisode] = useState(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   
   const [rewardVal, setRewardVal] = useState('0.8');
   const [rewardReflection, setRewardReflection] = useState('');

   const fetchEpisodes = async () => {
      setLoading(true);
      setError(null);
      try {
         const res = await fetch(`${PDO_BASE}/api/v1/episodes?limit=50`);
         if (!res.ok) {
            let errorDetail = `HTTP ${res.status}`;
            try { const errorData = await res.json(); if (errorData.detail) errorDetail = errorData.detail; } catch (e) {}
            throw new Error(errorDetail);
         }
         const data = await res.json();
         const list = data.episodes || [];
         setEpisodes(list);
         if (list.length > 0 && !selectedEpisode) {
            setSelectedEpisode(list[0]);
            setRewardReflection(list[0].reflection || '');
            setRewardVal(list[0].reward != null ? list[0].reward.toString() : '0.8');
         }
      } catch(err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchEpisodes();
   }, []);

   const handleSelect = (ep) => {
      setSelectedEpisode(ep);
      setRewardReflection(ep.reflection || '');
      setRewardVal(ep.reward != null ? ep.reward.toString() : '0.8');
   };

   const handleRewardSubmit = async (e) => {
      e.preventDefault();
      if (!selectedEpisode) return;
      setIsSubmitting(true);
      setError(null);
      
      try {
         const encodedId = encodeURIComponent(selectedEpisode.episodeId);
         const res = await fetch(`${PDO_BASE}/api/v1/episodes/${encodedId}/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
               reward: parseFloat(rewardVal),
               reflection: rewardReflection
            })
         });
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         
         // Refresh list
         await fetchEpisodes();
         
         // Manually update selected state to reflect changes instantly
         setSelectedEpisode(prev => ({
             ...prev, 
             reward: parseFloat(rewardVal), 
             reflection: rewardReflection,
             status: 'REWARDED'
         }));
      } catch(err) {
         setError(err.message);
      } finally {
         setIsSubmitting(false);
      }
   };

   const formatDate = (isoString) => {
      if (!isoString) return '—';
      return new Date(isoString).toLocaleString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
   };

   return (
      <div style={{
         minHeight: '100vh',
         background: 'var(--bg-gradient)',
         color: 'var(--text-main)',
         fontFamily: 'Inter, system-ui, sans-serif',
         padding: '24px'
      }}>
         {/* HEADER */}
         <div style={{ maxWidth: 1400, margin: '0 auto', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                  <HistoryIcon size={22} />
               </div>
               <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Episode History</h1>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Browse ledger records, review execution traces, and assign human-guided rewards.</p>
               </div>
            </div>
            <button 
               onClick={fetchEpisodes}
               disabled={loading}
               style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                  opacity: loading ? 0.7 : 1
               }}
            >
               <RefreshCw size={16} className={loading ? 'spin' : ''} />
               Sync Ledger
            </button>
         </div>

         {error && (
            <div style={{ maxWidth: 1400, margin: '0 auto 24px', padding: 16, background: '#fef2f2', border: '1px solid #f87171', borderRadius: 10, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 10 }}>
               <AlertCircle size={18} />
               {error}
            </div>
         )}

         {/* MAIN LAYOUT */}
         <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, height: 'calc(100vh - 130px)' }}>
            
            {/* LEFT: EPISODE LIST */}
            <div style={{
               background: 'var(--surface)',
               border: '1px solid var(--border)',
               borderRadius: 16,
               boxShadow: 'var(--shadow-md)',
               display: 'flex',
               flexDirection: 'column',
               overflow: 'hidden'
            }}>
               <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                     <FileText size={18} color="var(--primary)" /> 
                     Recent Episodes
                     <span style={{ fontSize: '0.75rem', background: 'var(--border)', padding: '2px 8px', borderRadius: 99, marginLeft: 'auto' }}>
                        {episodes.length}
                     </span>
                  </h2>
               </div>
               
               <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                  {loading && episodes.length === 0 ? (
                     <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Syncing from ledger...</div>
                  ) : episodes.length === 0 ? (
                     <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No episodes recorded yet.</div>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {episodes.map(ep => {
                           const isSelected = selectedEpisode?.episodeId === ep.episodeId;
                           return (
                              <div 
                                 key={ep.episodeId}
                                 onClick={() => handleSelect(ep)}
                                 style={{
                                    padding: '16px',
                                    borderRadius: 12,
                                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                    background: isSelected ? 'var(--bg-gradient)' : 'var(--bg-main)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isSelected ? '0 8px 16px -4px rgba(99,102,241,0.15)' : 'none',
                                    transform: isSelected ? 'translateY(-1px)' : 'none'
                                 }}
                              >
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                                       {ep.episodeId?.split('#')[1] ? `#${ep.episodeId.split('#')[1]}` : ep.episodeId}
                                    </div>
                                    <div style={{ 
                                       fontSize: '0.65rem', 
                                       fontWeight: 700, 
                                       letterSpacing: '0.05em',
                                       padding: '3px 10px', 
                                       borderRadius: 99, 
                                       background: ep.status === 'REWARDED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                       color: ep.status === 'REWARDED' ? '#059669' : '#4f46e5',
                                       textTransform: 'uppercase'
                                    }}>
                                       {ep.status}
                                    </div>
                                 </div>
                                 <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                                    {ep.action?.split('/').pop()}
                                 </div>
                                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                       <Database size={12}/> {ep.entityType?.split(':').pop() || ep.entityType}
                                    </span>
                                    {ep.reward != null && (
                                       <span style={{ 
                                          color: ep.reward >= 0.8 ? '#059669' : ep.reward > 0 ? '#d97706' : '#dc2626', 
                                          fontWeight: 700,
                                          display: 'flex', alignItems: 'center', gap: 4 
                                       }}>
                                          <Star size={12} fill="currentColor" /> {ep.reward}
                                       </span>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            </div>

            {/* RIGHT: DETAILS VIEW */}
            {selectedEpisode ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
                  
                  {/* HIGH-LEVEL METRICS */}
                  <div style={{
                     background: 'var(--surface)',
                     border: '1px solid var(--border)',
                     borderRadius: 16,
                     boxShadow: 'var(--shadow-md)',
                     padding: 24
                  }}>
                     <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                        <Activity size={20} color="var(--primary)" /> 
                        Trace Details
                     </h3>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        <InfoCard label="Episode ID" value={selectedEpisode.episodeId} icon={<Database size={20} />} color="#6366f1" />
                        <InfoCard label="Decision ID" value={selectedEpisode.decisionId} icon={<ShieldAlert size={20} />} color="#f59e0b" />
                        <InfoCard label="Action Undertaken" value={selectedEpisode.action?.split('/').pop()} icon={<Zap size={20} />} color="#10b981" />
                        <InfoCard label="Target Entity Type" value={selectedEpisode.entityType} icon={<Layers size={20} />} color="#8b5cf6" />
                        <InfoCard label="Execution Outcome" value={selectedEpisode.outcomeStatus || 'PENDING'} icon={selectedEpisode.outcomeStatus === 'EXECUTED' ? <CheckCircle size={20} /> : <Activity size={20} />} color={selectedEpisode.outcomeStatus === 'EXECUTED' ? '#059669' : '#3b82f6'} />
                        <InfoCard label="Signature (Policy Context)" value={selectedEpisode.signature} icon={<Cpu size={20} />} color="#ec4899" />
                        <InfoCard label="Opened Timestamp" value={formatDate(selectedEpisode.openedAt)} icon={<Clock size={20} />} color="#64748b" />
                        <InfoCard label="Closed Timestamp" value={formatDate(selectedEpisode.closedAt)} icon={<CheckCircle size={20} />} color="#64748b" />
                     </div>
                  </div>

                  {/* REWARD EDITOR */}
                  <div style={{
                     background: 'var(--surface)',
                     border: '1px solid var(--border)',
                     borderRadius: 16,
                     boxShadow: 'var(--shadow-md)',
                     padding: 24
                  }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
                           <Star size={20} color="#f59e0b" fill="rgba(245, 158, 11, 0.2)" /> 
                           Reward & Policy Distillation
                        </h3>
                        <div style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'var(--bg-main)', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 600 }}>
                           Current Reward: <span style={{ color: selectedEpisode.reward != null ? '#059669' : '#64748b' }}>{selectedEpisode.reward != null ? selectedEpisode.reward : 'None'}</span>
                        </div>
                     </div>
                     
                     <form onSubmit={handleRewardSubmit}>
                        <div style={{ marginBottom: 16 }}>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                              Assigned Reward Score (0.0 to 1.0)
                           </label>
                           <input 
                              type="number" 
                              step="0.1"
                              min="-1"
                              max="1"
                              required
                              value={rewardVal}
                              onChange={e => setRewardVal(e.target.value)}
                              style={{
                                 width: '100%',
                                 padding: '12px 16px',
                                 borderRadius: 10,
                                 border: '1px solid var(--border)',
                                 background: 'var(--bg-main)',
                                 color: 'var(--text-main)',
                                 fontSize: '1rem',
                                 fontFamily: 'monospace',
                                 transition: 'border 0.2s',
                                 outline: 'none'
                              }}
                              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                              onBlur={e => e.target.style.borderColor = 'var(--border)'}
                           />
                           <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Scale: 1.0 (Optimal) to -1.0 (Harmful). Used to fine-tune the neural planner.
                           </p>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                           <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>
                              Reflection Note (Policy Hint)
                           </label>
                           <textarea 
                              rows={4}
                              value={rewardReflection}
                              onChange={e => setRewardReflection(e.target.value)}
                              placeholder="Describe why this decision was optimal or what went wrong. Example: 'Approved due to excellent history despite missing some checks.'"
                              style={{
                                 width: '100%',
                                 padding: '12px 16px',
                                 borderRadius: 10,
                                 border: '1px solid var(--border)',
                                 background: 'var(--bg-main)',
                                 color: 'var(--text-main)',
                                 fontSize: '0.9rem',
                                 resize: 'vertical',
                                 transition: 'border 0.2s',
                                 outline: 'none',
                                 lineHeight: 1.5
                              }}
                              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                              onBlur={e => e.target.style.borderColor = 'var(--border)'}
                           />
                        </div>
                        <button 
                           type="submit"
                           disabled={isSubmitting}
                           style={{
                              width: '100%',
                              padding: '14px',
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: '#fff',
                              border: 'none',
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              cursor: isSubmitting ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: 10,
                              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                              transition: 'transform 0.1s, box-shadow 0.1s',
                              transform: isSubmitting ? 'scale(0.99)' : 'scale(1)'
                           }}
                        >
                           {isSubmitting ? 'Committing to Ledger...' : 'Commit Reward & Reflection'}
                        </button>
                     </form>
                  </div>

                  {/* RAW JSON VIEW */}
                  <div style={{
                     background: '#1e293b',
                     border: '1px solid #334155',
                     borderRadius: 16,
                     boxShadow: 'var(--shadow-md)',
                     padding: 24,
                     marginBottom: 24
                  }}>
                     <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
                        <Code size={18} color="#94a3b8" /> 
                        Raw Episode JSON
                     </h3>
                     <pre style={{
                        margin: 0,
                        padding: 16,
                        background: '#0f172a',
                        borderRadius: 10,
                        overflowX: 'auto',
                        fontSize: '0.8rem',
                        color: '#38bdf8',
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                     }}>
                        {JSON.stringify(selectedEpisode, null, 2)}
                     </pre>
                  </div>

               </div>
            ) : (
               <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  gap: 16
               }}>
                  <div style={{ padding: 24, background: 'var(--bg-main)', borderRadius: '50%' }}>
                     <HistoryIcon size={48} color="var(--border)" />
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>Select an episode to view history</div>
               </div>
            )}
         </div>
      </div>
   );
}

// Icon placeholder if history not imported from lucide-react (using Clock as alias)
const HistoryIcon = Clock;
