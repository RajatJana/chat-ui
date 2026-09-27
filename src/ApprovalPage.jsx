import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  Check 
} from 'lucide-react';

const PDO_BASE = `http://10.73.86.59:8001`;

export default function ApprovalPage() {
   const [decisions, setDecisions] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   const [selectedDecision, setSelectedDecision] = useState(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitResult, setSubmitResult] = useState(null);

   const fetchDecisions = async () => {
      setLoading(true);
      setError(null);
      setSubmitResult(null);
      try {
         const res = await fetch(`${PDO_BASE}/api/v1/approvals/pending`);
         if (!res.ok) {
            let errorDetail = `HTTP ${res.status}`;
            try { const errorData = await res.json(); if (errorData.detail) errorDetail = errorData.detail; } catch (e) {}
            throw new Error(errorDetail);
         }
         const data = await res.json();
         const list = data.approvals || [];
         setDecisions(list);
         if (list.length > 0 && !selectedDecision) {
            setSelectedDecision(list[0]);
         } else if (list.length === 0) {
            setSelectedDecision(null);
         }
      } catch(err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchDecisions();
   }, []);

   const handleSelectDecision = (d) => {
      setSubmitResult(null);
      setSelectedDecision(d);
   };

   const handleAction = async (approved) => {
      if (!selectedDecision) return;
      setIsSubmitting(true);
      const decId = selectedDecision.decisionId || selectedDecision.decision_id;

      try {
         const encodedId = encodeURIComponent(decodeURIComponent(decId));
         const res = await fetch(`${PDO_BASE}/api/v1/decisions/${encodedId}/resume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
               approved, 
               reviewer: 'Business Approver' 
            })
         });
         if (!res.ok) throw new Error(`HTTP ${res.status}`);
         const data = await res.json();
         
         // Remove from list
         setDecisions(prev => prev.filter(d => (d.decisionId || d.decision_id) !== decId));
         setSubmitResult({ approved, data });

         setTimeout(() => {
            setSelectedDecision(null);
            setSubmitResult(null);
         }, 3000);
      } catch(err) {
         setError(err.message);
      } finally {
         setIsSubmitting(false);
      }
   };

   // Helper to extract evidence checks from real decision
   const getEvidenceChecks = (d) => {
      if (!d) return [];
      if (Array.isArray(d.checks) && d.checks.length > 0) return d.checks;
      if (d.reviewPacket) {
         try {
            const packet = typeof d.reviewPacket === 'string' ? JSON.parse(d.reviewPacket) : d.reviewPacket;
            if (Array.isArray(packet.evidence)) return packet.evidence;
         } catch(e) {}
      }
      return [];
   };

   // Helper to strip technical infrastructure provenance (SKELETON, Neo4j, bitemporal, ONTOP, PostgreSQL, live)
   const cleanEvidenceCheck = (chk) => {
      let rawText = typeof chk === 'string' ? chk : chk.precondition || chk.expression || JSON.stringify(chk);
      
      // Remove trailing bracketed provenance annotations e.g. [SKELETON(Neo4j, bitemporal)], [ONTOP(PostgreSQL, live)]
      const cleaned = rawText.replace(/\s*\[.*?\]\s*$/g, '').trim();

      let condition = cleaned;
      let observedValue = null;

      if (cleaned.includes(' = ')) {
         const parts = cleaned.split(' = ');
         condition = parts[0].trim();
         observedValue = parts.slice(1).join(' = ').trim();
      }

      return { condition, observedValue };
   };

   return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-gradient)', fontFamily: 'Inter, -apple-system, sans-serif', color: 'var(--text-main)' }}>
         
         {/* Top Minimalist Header */}
         <header style={{ 
            background: 'var(--surface-glass)', 
            backdropFilter: 'blur(12px)', 
            WebkitBackdropFilter: 'blur(12px)', 
            borderBottom: '1px solid var(--border)', 
            padding: '16px 32px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
         }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{ 
                  width: 34, 
                  height: 34, 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#ffffff' 
               }}>
                  <ShieldCheck size={20} />
               </div>
               <div>
                  <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                     Governance & Operations Authorization
                  </h1>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                     Policy Decision Oracle (PDO)
                  </div>
               </div>
            </div>

            <button 
               onClick={fetchDecisions} 
               disabled={loading}
               style={{ 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border)', 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  color: 'var(--text-main)', 
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
               }}
            >
               <RefreshCw size={14} className={loading ? 'spinner' : ''} />
               <span>Refresh Queue {decisions.length > 0 ? `(${decisions.length})` : ''}</span>
            </button>
         </header>

         {/* Main Content Area */}
         <div style={{ maxWidth: '1140px', margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
            
            {/* Left Column: Action Queue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                     <Layers size={17} color="var(--primary)" />
                     <span>Action Queue</span>
                     <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                        {decisions.length}
                     </span>
                  </div>
               </div>

               {error && (
                  <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                     <AlertTriangle size={16} />
                     <span>{error}</span>
                  </div>
               )}

               {decisions.length === 0 && !loading && !error && (
                  <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--surface-glass)', border: '1px dashed var(--border)', borderRadius: 16 }}>
                     <CheckCircle size={40} color="#10b981" style={{ marginBottom: 12, opacity: 0.9 }} />
                     <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 4 }}>All Caught Up</div>
                     <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        There are no pending requests requiring authorization.
                     </div>
                  </div>
               )}

               {decisions.map(d => {
                  const decId = d.decisionId || d.decision_id;
                  const isSelected = selectedDecision && (selectedDecision.decisionId || selectedDecision.decision_id) === decId;
                  const isCritical = d.riskTier === 'CRITICAL' || d.riskTier === 'HIGH';
                  const actionName = (d.action || 'Unknown Action').split('/').pop();
                  const targetName = (d.targetEntity || d.target || '').split('/').pop();

                  return (
                     <div 
                        key={decId}
                        onClick={() => handleSelectDecision(d)}
                        style={{
                           padding: '16px',
                           background: isSelected ? 'var(--surface)' : 'rgba(255, 255, 255, 0.75)',
                           border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                           borderRadius: 12,
                           cursor: 'pointer',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'space-between',
                           gap: 12,
                           boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                           transition: 'all 0.15s ease'
                        }}
                     >
                        <div style={{ minWidth: 0, flex: 1 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                                 {actionName}
                              </span>
                              {isCritical && (
                                 <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                                    CRITICAL
                                 </span>
                              )}
                           </div>
                           <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              Target: {targetName || 'N/A'}
                           </div>
                        </div>

                        <ChevronRight size={18} color={isSelected ? 'var(--primary)' : '#94a3b8'} />
                     </div>
                  );
               })}
            </div>

            {/* Right Column: Decision Inspection & Actions */}
            <div>
               {submitResult ? (
                  <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-glass)' }}>
                     <div style={{ color: submitResult.approved ? '#10b981' : '#ef4444', marginBottom: 16 }}>
                        {submitResult.approved ? <CheckCircle size={56} /> : <XCircle size={56} />}
                     </div>
                     <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                        Request {submitResult.approved ? 'Approved' : 'Rejected'}
                     </h2>
                     <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                        The decision oracle has been updated and the queue refreshed.
                     </p>
                  </div>
               ) : selectedDecision ? (
                  (() => {
                     const d = selectedDecision;
                     const isCritical = d.riskTier === 'CRITICAL' || d.riskTier === 'HIGH';
                     const checks = getEvidenceChecks(d);
                     const actionName = (d.action || 'Unknown Action').split('/').pop();
                     const targetName = (d.targetEntity || d.target || '').split('/').pop();
                     const decId = d.decisionId || d.decision_id || '';

                     return (
                        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow-glass)', overflow: 'hidden' }}>
                           
                           {/* Card Top Title Strip */}
                           <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'rgba(37, 99, 235, 0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                 <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                                    Operation Details
                                 </span>
                                 {d.riskTier && (
                                    <span style={{
                                       fontSize: '0.7rem',
                                       fontWeight: 700,
                                       padding: '2px 8px',
                                       borderRadius: 99,
                                       background: isCritical ? '#fee2e2' : '#e0e7ff',
                                       color: isCritical ? '#b91c1c' : '#3730a3',
                                       border: `1px solid ${isCritical ? '#fecaca' : '#c7d2fe'}`,
                                       display: 'inline-flex',
                                       alignItems: 'center',
                                       gap: 4
                                    }}>
                                       {isCritical ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                       {d.riskTier} RISK
                                    </span>
                                 )}
                              </div>

                              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                                 {actionName}
                              </h2>
                           </div>

                           {/* Body Content */}
                           <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                              
                              {/* Metadata Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                 <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Target Entity</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                                       {targetName || 'N/A'}
                                    </div>
                                 </div>
                                 <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Decision Reference</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                                       {decId.includes('#') ? `#${decId.split('#')[1]}` : decId.split('/').pop() || decId}
                                    </div>
                                 </div>
                              </div>

                              {/* Preconditions & Evidence (Only rendered if present in real decision) */}
                              {checks && checks.length > 0 && (
                                 <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                       <FileText size={15} /> Precondition Verification
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                       {checks.map((chk, idx) => {
                                          const { condition, observedValue } = cleanEvidenceCheck(chk);
                                          return (
                                             <div key={idx} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'space-between',
                                                gap: 12, 
                                                padding: '10px 14px', 
                                                background: 'var(--surface)', 
                                                border: '1px solid var(--border)', 
                                                borderRadius: 8, 
                                                fontSize: '0.82rem' 
                                             }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                   <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                      <Check size={11} strokeWidth={3} />
                                                   </div>
                                                   <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                                      {condition}
                                                   </span>
                                                </div>

                                                {observedValue && (
                                                   <span style={{ 
                                                      fontSize: '0.75rem', 
                                                      fontWeight: 600, 
                                                      color: '#047857', 
                                                      background: 'rgba(16, 185, 129, 0.1)', 
                                                      border: '1px solid rgba(16, 185, 129, 0.25)', 
                                                      padding: '2px 8px', 
                                                      borderRadius: 6,
                                                      flexShrink: 0,
                                                      fontFamily: 'monospace'
                                                   }}>
                                                      {observedValue}
                                                   </span>
                                                )}
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                              )}

                              {/* Actions Bar */}
                              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                 <button
                                    onClick={() => handleAction(false)}
                                    disabled={isSubmitting}
                                    style={{
                                       flex: 1,
                                       padding: '12px 18px',
                                       borderRadius: 10,
                                       background: '#ffffff',
                                       border: '1.5px solid #fecaca',
                                       color: '#dc2626',
                                       fontSize: '0.88rem',
                                       fontWeight: 600,
                                       cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       gap: 6,
                                       transition: 'all 0.15s ease'
                                    }}
                                 >
                                    <XCircle size={17} /> Reject
                                 </button>

                                 <button
                                    onClick={() => handleAction(true)}
                                    disabled={isSubmitting}
                                    style={{
                                       flex: 1,
                                       padding: '12px 18px',
                                       borderRadius: 10,
                                       background: '#10b981',
                                       border: 'none',
                                       color: '#ffffff',
                                       fontSize: '0.88rem',
                                       fontWeight: 600,
                                       cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       gap: 6,
                                       boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                       transition: 'all 0.15s ease'
                                    }}
                                 >
                                    {isSubmitting ? (
                                       <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#ffffff', borderRadius: '50%' }} />
                                    ) : (
                                       <CheckCircle size={17} />
                                    )}
                                    <span>Approve</span>
                                 </button>
                              </div>

                           </div>

                        </div>
                     );
                  })()
               ) : (
                  <div style={{ padding: '60px 32px', textAlign: 'center', background: 'var(--surface-glass)', border: '1px dashed var(--border)', borderRadius: 16, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                     Select a request from the queue to review details.
                  </div>
               )}
            </div>

         </div>

      </div>
   );
}
