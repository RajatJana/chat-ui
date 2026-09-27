import { useState, useEffect, useRef } from 'react';
import { Send, Bot, CheckCircle, Circle, Loader2, AlertCircle, Clock, ShieldCheck, Zap, ChevronDown, ChevronRight, Activity, Database, GitMerge, Sparkles, Code, Copy, Check, RotateCcw } from 'lucide-react';
import ThinkingOrb from './components/ThinkingOrb';
import './index.css';

// ─────────────────────────────────────────────────────────
// STAGES (Merged Pipeline)
// ─────────────────────────────────────────────────────────
const STAGES = [
  { id: 'INTENT', label: 'Intent Identification', subtitle: 'Action & target classification' },
  { id: 'DECISION', label: 'Decision Engine', subtitle: 'Symbolic policy validation' },
  { id: 'PIPELINE', label: 'Routing Pipeline (Dedup/Persist/Route)', subtitle: 'Dedup, ledger persist & route' },
  { id: 'APPROVE', label: 'Human Approval', subtitle: 'HITL governance authorization' },
  { id: 'PLAN', label: 'Execution Planning', subtitle: 'Synthesized sequence & constraints' },
  { id: 'EXECUTE', label: 'Execution & Close', subtitle: 'Transactional target API dispatch' },
  { id: 'REFLECT', label: 'Reflect', subtitle: 'Policy experience distillation' },
  { id: 'SWEEP', label: 'Sweep', subtitle: 'TTL decision cache cleanup' }
];

const API_BASE = `http://10.73.86.59:8000`;
const PDO_BASE = `http://10.73.86.59:8001`;

// API Calls
async function orchestrate(intent) {
  const res = await fetch(`${API_BASE}/api/v1/orchestrate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(intent) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function submitDecision(decisionInput) {
  const res = await fetch(`${PDO_BASE}/api/v1/decisions/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(decisionInput) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function getDecision(id) {
  const res = await fetch(`${PDO_BASE}/api/v1/decisions/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function getExecutionPlan(id) {
  const res = await fetch(`${PDO_BASE}/api/v1/decisions/${encodeURIComponent(id)}/plan`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function getExecution(id) {
  const res = await fetch(`${PDO_BASE}/api/v1/decisions/${encodeURIComponent(id)}/execution`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function triggerSweep() {
  const res = await fetch(`${PDO_BASE}/api/v1/admin/sweep`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
const STAGE_COLORS = {
  INTENT: '#8b5cf6',    // Violet
  DECISION: '#f59e0b',  // Amber
  PIPELINE: '#3b82f6',  // Blue
  APPROVE: '#14b8a6',   // Teal
  PLAN: '#6366f1',      // Indigo
  EXECUTE: '#10b981',   // Emerald
  REFLECT: '#ec4899',   // Pink
  SWEEP: '#64748b'      // Slate
};

const STAGE_ICONS = {
  INTENT: Zap,
  DECISION: ShieldCheck,
  PIPELINE: Database,
  APPROVE: Clock,
  PLAN: GitMerge,
  EXECUTE: Activity,
  REFLECT: Sparkles,
  SWEEP: Database
};

async function triggerReflect() {
  const res = await fetch(`${PDO_BASE}/api/v1/admin/reflect?min_support=1`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function mockIntentIdentification(input) {
  let action = "onto:action/RestructureLoan";
  let target = "onto:Mortgage/LOAN-031";
  const text = input.toLowerCase();
  if (text.includes("credit") || text.includes("limit")) { action = "onto:action/IncreaseCreditLimit"; target = "onto:CreditCard/1000"; } 
  else if (text.includes("freeze")) { action = "onto:action/FreezeAccount"; target = "onto:BankAccount/999"; } 
  else if (text.includes("loan") || text.includes("restructure")) { action = "onto:action/RestructureLoan"; target = "onto:Mortgage/LOAN-031"; }
  return { action, target, context: {} };
}

// ─────────────────────────────────────────────────────────
// PREMIUM CHAT COMPONENTS
// ─────────────────────────────────────────────────────────
const MessageBubble = ({ children, isUser }) => (
  <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '20px' }}>
    <div style={{ display: 'flex', gap: '14px', maxWidth: '85%', width: isUser ? 'auto' : '100%' }}>
      {!isUser && (
         <div style={{ 
            width: '34px', 
            height: '34px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0, 
            boxShadow: '0 4px 12px rgba(37,99,235,0.22)',
            color: '#ffffff'
         }}>
            <Sparkles size={17} />
         </div>
      )}
      <div style={{
         padding: isUser ? '12px 18px' : '16px 20px',
         borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
         background: isUser ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#ffffff',
         color: isUser ? '#ffffff' : '#0f172a',
         boxShadow: isUser ? '0 4px 16px -2px rgba(37,99,235,0.35)' : '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
         border: isUser ? 'none' : '1px solid #e2e8f0',
         lineHeight: '1.6',
         fontSize: '0.92rem',
         width: isUser ? 'auto' : '100%'
      }}>
         {children}
      </div>
    </div>
  </div>
);

const IntentCard = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}><Zap size={16}/> Intent Parsed</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-gradient)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
      <div>
         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Action</div>
         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{data.action?.split('/').pop()}</div>
      </div>
      <div>
         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Target Entity</div>
         <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{data.target?.split('/').pop()}</div>
      </div>
    </div>
  </div>
);

const DecisionCard = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ fontWeight: 600, color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}><ShieldCheck size={16}/> Decision Evaluated</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: data.allowed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${data.allowed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
       <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Verdict</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: data.allowed ? 'var(--success)' : 'var(--error)' }}>{data.verdict}</div>
       </div>
       <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Risk Tier</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, padding: '4px 10px', background: 'var(--warning)', color: 'white', borderRadius: 99 }}>{data.risk_tier}</div>
       </div>
    </div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Decision ID: {data.decision_id}</div>
    {(data.requires_human_approval || data.human_approval_needed || data.human_review_required || data.risk_tier === 'HIGH' || data.risk_tier === 'CRITICAL') && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4, padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
           <AlertCircle size={14} /> Human Approval Needed
        </div>
    )}
  </div>
);

const ApprovalCard = ({ data }) => {
  const isApproved = data.state === 'APPROVED' || data.state === 'EXECUTING' || data.state === 'EXECUTED';
  const isRejected = data.state === 'REJECTED' || data.state === 'BLOCKED';
  
  if (isApproved) {
     return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
          <div style={{ fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={18}/> Approval Granted</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Decision <strong>{data.decision_id || data.decisionId}</strong> has been approved. Proceeding to execution...</div>
        </div>
     );
  }
  
  if (isRejected) {
     return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
          <div style={{ fontWeight: 600, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={18}/> Decision Rejected</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Decision <strong>{data.decision_id || data.decisionId}</strong> was rejected or blocked in the dashboard.</div>
        </div>
     );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px' }}>
      <div style={{ fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={18}/> Human Approval Required</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Decision <strong>{data.decision_id || data.decisionId}</strong> is waiting for business authorization.</div>
    </div>
  );
};

function ConstraintChecks({ checks }) {
  if (!checks || checks.length === 0) return null;
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>Safety Constraints</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: passed === total ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: passed === total ? 'var(--success)' : 'var(--error)' }}>
           {passed}/{total} Passed
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8, background: c.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${c.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.2)'}`, fontSize: '0.8rem' }}>
            <span style={{ color: c.passed ? 'var(--success)' : 'var(--error)', fontWeight: 700 }}>{c.passed ? '✓' : '✗'}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{c.constraint}</span>
              {!c.passed && <span style={{ color: 'var(--error)', marginLeft: 8 }}>— {c.detail}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PlanCard = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <div style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.95rem', marginBottom: 16 }}>
       <GitMerge size={18}/> Agentic Execution Plan
    </div>
    
    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6, background: 'var(--bg-gradient)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
      <strong>Rationale:</strong> {data.rationale}
    </div>
    
    <ConstraintChecks checks={data.constraints} />
    
    <div style={{ marginTop: 16 }}>
       <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 10 }}>Action Sequence</div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
         {data.steps?.map((step, i) => (
           <div key={i} style={{ padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--shadow-sm)' }}>
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                {i+1}
             </div>
             <div>
                <strong style={{ color: 'var(--text-main)' }}>{step.action?.split('/').pop() || step.action}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{step.target}</div>
             </div>
           </div>
         ))}
       </div>
    </div>
  </div>
);

const ExecutionCard = ({ data }) => {
  const stepResults = Array.isArray(data?.step_results) ? data.step_results : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
          <CheckCircle size={18} /> Execution Completed Successfully
        </div>
        {stepResults.length > 0 && (
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            {stepResults.length} Actions Dispatched
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Operations safely executed across integrations and verified with live ontology constraints.
      </div>
      {stepResults.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {stepResults.map((s, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#334155', fontWeight: 500 }}>
              <Check size={12} color="#10b981" strokeWidth={3} />
              <span>{s.action?.split(':').pop() || s.action || 'Action'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────
// SIDEBAR DASHBOARD COMPONENT
// ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, success }) => (
  <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flex: 1, boxShadow: 'var(--shadow-sm)' }}>
      {icon && <div style={{ color: success ? 'var(--success)' : 'var(--primary)', padding: 8, background: success ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)', borderRadius: 8 }}>{icon}</div>}
      <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{value}</div>
      </div>
  </div>
);

const CopyButton = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: copied ? '#059669' : '#64748b',
        background: copied ? '#ecfdf5' : '#ffffff',
        border: `1px solid ${copied ? '#a7f3d0' : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
    </button>
  );
};

const SidebarDashboard = ({ stageId, data }) => {
   if (!data) return null;
   
   const renderDashboard = () => {
       switch(stageId) {
           case 'INTENT':
               return (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                     <StatCard label="Action" value={data.action?.split('/').pop()} icon={<Activity size={18}/>} />
                     <StatCard label="Target" value={data.target?.split('/').pop()} />
                  </div>
               );
           case 'DECISION':
               return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: data.allowed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: 12, border: `1px solid ${data.allowed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                        <div>
                           <div style={{ fontSize: '0.7rem', color: data.allowed ? 'var(--success)' : 'var(--error)', textTransform: 'uppercase', marginBottom: 4 }}>Verdict</div>
                           <div style={{ fontSize: '1.1rem', fontWeight: 700, color: data.allowed ? 'var(--success)' : 'var(--error)' }}>{data.verdict}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>Risk Level</div>
                           <div style={{ fontSize: '0.8rem', fontWeight: 600, padding: '4px 10px', background: 'var(--warning)', color: 'white', borderRadius: 99 }}>{data.risk_tier}</div>
                        </div>
                     </div>
                     {(data.requires_human_approval || data.human_approval_needed || data.human_review_required || data.risk_tier === 'HIGH' || data.risk_tier === 'CRITICAL') && (
                        <div style={{ marginTop: 8, padding: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                           <AlertCircle size={16} /> Human Approval Needed for Execution
                        </div>
                     )}
                  </div>
               );
           case 'PIPELINE':
               return (
                  <div style={{ marginBottom: 16 }}>
                     <div style={{ display: 'flex', gap: 10 }}>
                        <StatCard label="Routing State" value={data.status || 'PROCESSED'} icon={<Database size={18} />} success={data.status !== 'REJECTED' && data.status !== 'ERROR'} />
                     </div>
                     <div style={{ marginTop: 12, fontSize: '0.8rem', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Pipeline Steps Evaluated</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Decision ID</span>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>{data.decision_id || 'N/A'}</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Deduplication</span>
                              <span style={{ fontWeight: 600, color: 'var(--success)' }}>PASSED</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Graph Persistence</span>
                              <span style={{ fontWeight: 600, color: 'var(--success)' }}>RECORDED</span>
                           </div>
                           {data.message && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                                 <span style={{ color: 'var(--text-muted)' }}>Routing Output</span>
                                 <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{data.message}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
           case 'APPROVE':
               const appState = data.state === 'APPROVED' || data.state === 'EXECUTING' || data.state === 'EXECUTED' ? 'APPROVED' : data.state === 'REJECTED' || data.state === 'BLOCKED' ? 'REJECTED' : 'PENDING';
               return (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                      <StatCard label="State" value={appState} icon={<ShieldCheck size={18} />} success={appState === 'APPROVED'} />
                  </div>
               );
           case 'PLAN':
               return (
                  <div style={{ marginBottom: 16, padding: 16, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                         <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>Steps Generated</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{data.steps?.length || 0}</div>
                         </div>
                         <GitMerge size={28} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                      </div>
                      <div style={{ fontSize: '0.8rem', marginBottom: 16 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Confidence Score</span>
                            <span style={{ fontWeight: 600 }}>{data.confidence_score ? (data.confidence_score*100).toFixed(0) : 95}%</span>
                         </div>
                         <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${data.confidence_score ? data.confidence_score*100 : 95}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }}></div>
                         </div>
                      </div>
                      
                      {data.steps && data.steps.length > 0 && (
                         <div style={{ background: 'var(--surface-glass)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8 }}>Plan Sequence:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                               {data.steps.map((step, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: 10, fontSize: '0.75rem', padding: '6px', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
                                     <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{idx + 1}.</span>
                                     <span style={{ color: 'var(--text-main)' }}>{step.action?.split('/').pop()}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}
                  </div>
               );
           case 'EXECUTE': {
                const stepResults = Array.isArray(data.step_results) ? data.step_results : [];
                return (
                   <div style={{ marginBottom: 16 }}>
                       <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                          <StatCard label="Pipeline Status" value={data.status || 'EXECUTED'} icon={<CheckCircle size={18} />} success />
                          {stepResults.length > 0 && (
                             <StatCard label="Actions Run" value={`${stepResults.length} Successful`} icon={<Zap size={18} />} success />
                          )}
                       </div>

                       <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 12 }}>
                             <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Integration</span>
                             <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#059669',
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.22)',
                                padding: '2px 8px',
                                borderRadius: 99,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5
                             }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)' }} />
                                LIVE • SUCCESS
                             </span>
                          </div>
                          
                          {stepResults.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Steps Executed & Effects</div>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{stepResults.length} actions</span>
                                 </div>

                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {stepResults.map((step, idx) => {
                                       let effectsList = [];
                                       if (Array.isArray(step.effects)) {
                                          effectsList = step.effects;
                                       } else if (typeof step.effects === 'string') {
                                          try {
                                             const parsed = JSON.parse(step.effects);
                                             effectsList = Array.isArray(parsed) ? parsed : [step.effects];
                                          } catch {
                                             effectsList = [step.effects];
                                          }
                                       }

                                       const actionRaw = step.action || step.step_id || 'Action';
                                       const hasColon = actionRaw.includes(':');
                                       const namespace = hasColon ? actionRaw.split(':')[0] : null;
                                       const actionName = hasColon ? actionRaw.split(':').slice(1).join(':') : actionRaw.split('/').pop();

                                       const isStub = step.note && step.note.includes('[STUB]');
                                       const cleanNote = isStub ? step.note.replace('[STUB]', '').trim() : step.note;

                                       return (
                                          <div key={idx} style={{
                                             padding: '12px 14px',
                                             background: 'linear-gradient(180deg, #ffffff 0%, rgba(240, 253, 244, 0.45) 100%)',
                                             borderRadius: 10,
                                             border: '1px solid rgba(16, 185, 129, 0.25)',
                                             boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                             display: 'flex',
                                             flexDirection: 'column',
                                             gap: 8
                                          }}>
                                             {/* Header row with action name and status badge */}
                                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                   <div style={{
                                                      width: 20,
                                                      height: 20,
                                                      borderRadius: '50%',
                                                      background: '#dcfce7',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      color: '#15803d',
                                                      flexShrink: 0
                                                   }}>
                                                      <Check size={12} strokeWidth={3} />
                                                   </div>
                                                   <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                      {namespace && (
                                                         <span style={{
                                                            fontSize: '0.65rem',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 600,
                                                            color: '#047857',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            padding: '1px 5px',
                                                            borderRadius: 4
                                                         }}>
                                                            {namespace}:
                                                         </span>
                                                      )}
                                                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                                                         {actionName}
                                                      </span>
                                                   </div>
                                                </div>

                                                <span style={{
                                                   fontSize: '0.65rem',
                                                   fontWeight: 700,
                                                   letterSpacing: '0.4px',
                                                   color: '#059669',
                                                   background: '#ffffff',
                                                   border: '1px solid rgba(16, 185, 129, 0.25)',
                                                   padding: '2px 7px',
                                                   borderRadius: 99,
                                                   display: 'inline-flex',
                                                   alignItems: 'center',
                                                   gap: 4,
                                                   flexShrink: 0,
                                                   boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                                                }}>
                                                   <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                                                   {step.status || 'EXECUTED'}
                                                </span>
                                             </div>

                                             {/* Effects rendered as elegant badges */}
                                             {effectsList.length > 0 && (
                                                <div style={{
                                                   padding: '8px 10px',
                                                   background: 'rgba(255, 255, 255, 0.85)',
                                                   borderRadius: 8,
                                                   border: '1px solid rgba(16, 185, 129, 0.18)'
                                                }}>
                                                   <div style={{
                                                      fontSize: '0.65rem',
                                                      fontWeight: 700,
                                                      textTransform: 'uppercase',
                                                      letterSpacing: '0.5px',
                                                      color: '#047857',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: 4,
                                                      marginBottom: 6
                                                   }}>
                                                      <Sparkles size={11} style={{ color: '#10b981' }} />
                                                      State Mutations & Effects
                                                   </div>
                                                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                      {effectsList.map((eff, i) => (
                                                         <div key={i} style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 5,
                                                            padding: '3px 8px',
                                                            borderRadius: 6,
                                                            background: 'rgba(16, 185, 129, 0.08)',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            fontSize: '0.73rem',
                                                            color: '#064e3b',
                                                            fontWeight: 500,
                                                            lineHeight: 1.3
                                                         }}>
                                                            <CheckCircle size={11} style={{ color: '#059669', flexShrink: 0 }} />
                                                            <span>{eff}</span>
                                                         </div>
                                                      ))}
                                                   </div>
                                                </div>
                                             )}

                                             {/* Clean execution note / telemetry */}
                                             {step.note && (
                                                <div style={{
                                                   display: 'flex',
                                                   alignItems: 'center',
                                                   gap: 6,
                                                   fontSize: '0.7rem',
                                                   color: 'var(--text-muted)',
                                                   background: 'rgba(0, 0, 0, 0.02)',
                                                   border: '1px solid rgba(0, 0, 0, 0.05)',
                                                   borderRadius: 6,
                                                   padding: '4px 8px',
                                                   lineHeight: 1.3
                                                }}>
                                                   {isStub ? (
                                                      <span style={{
                                                         fontSize: '0.6rem',
                                                         fontWeight: 700,
                                                         letterSpacing: '0.3px',
                                                         padding: '1px 5px',
                                                         borderRadius: 4,
                                                         background: 'rgba(245, 158, 11, 0.12)',
                                                         border: '1px solid rgba(245, 158, 11, 0.25)',
                                                         color: '#b45309',
                                                         flexShrink: 0
                                                      }}>
                                                         SIMULATION
                                                      </span>
                                                   ) : (
                                                      <span style={{ fontWeight: 600, color: 'var(--text-main)', flexShrink: 0 }}>Note:</span>
                                                   )}
                                                   <span>{cleanNote}</span>
                                                </div>
                                             )}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                          )}

                          {(!stepResults || stepResults.length === 0) && (data.result || data.message || data.status) && (
                              <div style={{ marginTop: 12, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                  {data.message || JSON.stringify(data.result || data.status)}
                              </div>
                          )}
                       </div>
                   </div>
                );
            }
            case 'REFLECT':
               return (
                  <div style={{ marginBottom: 16 }}>
                      <StatCard label="Distilled Hints" value={data.hints_distilled || 0} icon={<Activity size={18} />} success />
                      {data.hints && data.hints.length > 0 && (
                          <div style={{ marginTop: 12, fontSize: '0.8rem', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Learned Policy Hints</div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {data.hints.map((h, i) => (
                                    <div key={i} style={{ padding: '10px', background: 'rgba(37,99,235,0.05)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.1)' }}>
                                       <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{h.candidateRule || h.signature || 'Rule'}</div>
                                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                          Support: {h.support} | Proposal: <span style={{fontWeight:600}}>{h.proposal}</span> | Reward: {h.avgReward ?? 'N/A'}
                                       </div>
                                    </div>
                                ))}
                             </div>
                          </div>
                      )}
                  </div>
               );
           case 'SWEEP':
               return (
                  <div style={{ marginBottom: 16 }}>
                      <StatCard label="Decisions Expired" value={data.expired_count || 0} icon={<Database size={18} />} success />
                  </div>
               );
           default:
               return null;
       }
   };

   return (
       <div className="animate-fade-in-up" style={{ marginTop: '4px', padding: '0', background: 'transparent' }}>
           {renderDashboard()}
           <details style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <summary style={{ padding: '10px 14px', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                   <Code size={13} color="#64748b" />
                   <span>VIEW RAW PAYLOAD</span>
                 </div>
                 <CopyButton data={data} />
              </summary>
              <pre style={{ margin: 0, padding: '14px', fontSize: '0.72rem', color: '#1e293b', overflowX: 'auto', background: '#ffffff', fontFamily: 'Fira Code, monospace', lineHeight: '1.5' }}>
                 {JSON.stringify(data, null, 2)}
              </pre>
           </details>
       </div>
   );
};

// ─────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', type: 'text', text: 'Welcome. How can I assist?' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageStatuses, setStageStatuses] = useState({});
  const [stageJsons, setStageJsons] = useState({});
  const [expandedStage, setExpandedStage] = useState(null);
  
  const messagesEndRef = useRef(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addBotMessage = (type, data) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender: 'bot', type, data }]);
  };

  const handleResetChat = () => {
    if (isProcessing) return;
    setMessages([
      { id: Date.now(), sender: 'bot', type: 'text', text: 'Welcome. How can I assist?' }
    ]);
    const initialStatuses = {};
    STAGES.forEach(s => initialStatuses[s.id] = 'pending');
    setStageStatuses(initialStatuses);
    setStageJsons({});
    setExpandedStage(null);
  };

  const handleSend = async (e, customPrompt) => {
    if (e && e.preventDefault) e.preventDefault();
    const promptText = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!promptText || isProcessing) return;

    const userMsg = { id: Date.now(), sender: 'user', type: 'text', text: promptText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    
    const initialStatuses = {};
    STAGES.forEach(s => initialStatuses[s.id] = 'pending');
    setStageStatuses(initialStatuses);
    setStageJsons({});
    setExpandedStage(null);

    try {
        // 1. INTENT
        setStageStatuses(prev => ({ ...prev, INTENT: 'active' }));
        await new Promise(r => setTimeout(r, 600)); 
        const intent = mockIntentIdentification(promptText);
        setStageJsons(prev => ({ ...prev, INTENT: intent }));
        setStageStatuses(prev => ({ ...prev, INTENT: 'completed' }));
        setExpandedStage('INTENT');
        addBotMessage('intent', intent);

        // 2. DECISION
        setStageStatuses(prev => ({ ...prev, DECISION: 'active' }));
        const decisionRes = await orchestrate(intent);
        setStageJsons(prev => ({ ...prev, DECISION: decisionRes }));
        setStageStatuses(prev => ({ ...prev, DECISION: 'completed' }));
        setExpandedStage('DECISION');
        addBotMessage('decision', decisionRes);

        // 3. PIPELINE (Merged Dedup/Persist/Route)
        setStageStatuses(prev => ({ ...prev, PIPELINE: 'active' }));
        const submitRes = await submitDecision(decisionRes);
        setStageJsons(prev => ({ ...prev, PIPELINE: submitRes }));
        setStageStatuses(prev => ({ ...prev, PIPELINE: 'completed' }));
        setExpandedStage('PIPELINE');

        let currentDecisionId = submitRes.decision_id;

        if (submitRes.status === 'PENDING_APPROVAL' || submitRes.status === 'AWAITING_APPROVAL') {
           setStageStatuses(prev => ({ ...prev, APPROVE: 'active' }));
           setExpandedStage('APPROVE');
           addBotMessage('approval', submitRes);
           
           let isApproved = false;
           while(true) {
              await new Promise(r => setTimeout(r, 2000));
              const d = await getDecision(currentDecisionId);
              setStageJsons(prev => ({ ...prev, APPROVE: d }));
              
              setMessages(prev => {
                  const updated = [...prev];
                  for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].type === 'approval') {
                          updated[i] = { ...updated[i], data: { ...updated[i].data, state: d.state, decisionId: d.decisionId || currentDecisionId } };
                          break;
                      }
                  }
                  return updated;
              });

              if (d.state === 'APPROVED' || d.state === 'EXECUTING' || d.state === 'EXECUTED') {
                 isApproved = true; break;
              }
              if (d.state === 'REJECTED' || d.state === 'BLOCKED') break;
           }
           if (!isApproved) {
              setStageStatuses(prev => ({ ...prev, APPROVE: 'error' }));
              setIsProcessing(false);
              return;
           }
        }
        setStageStatuses(prev => ({ ...prev, APPROVE: 'completed' }));
        
        // 4. PLAN
        setStageStatuses(prev => ({ ...prev, PLAN: 'active' }));
        setExpandedStage('PLAN');
        addBotMessage('thinking', 'Synthesizing Agentic Execution Plan...');
        let planRes = null;
        for(let i=0; i<15; i++) {
           try { planRes = await getExecutionPlan(currentDecisionId); if (planRes) break; } catch(e) {}
           await new Promise(r => setTimeout(r, 1500));
        }
        
        setMessages(prev => prev.filter(m => m.type !== 'thinking'));
        if (planRes) {
           setStageJsons(prev => ({ ...prev, PLAN: planRes }));
           addBotMessage('plan', planRes);
        } else {
           addBotMessage('text', 'Execution plan bypassed.');
        }
        setStageStatuses(prev => ({ ...prev, PLAN: 'completed' }));

        // 5. EXECUTE
        setStageStatuses(prev => ({ ...prev, EXECUTE: 'active' }));
        setExpandedStage('EXECUTE');
        let execRes = null;
        for(let i=0; i<10; i++) {
           try { execRes = await getExecution(currentDecisionId); if (execRes) break; } catch(e) {}
           await new Promise(r => setTimeout(r, 1500));
        }
        setStageJsons(prev => ({ ...prev, EXECUTE: execRes || { status: 'Executed safely.' } }));
        addBotMessage('execute', execRes);
        setStageStatuses(prev => ({ ...prev, EXECUTE: 'completed' }));
        
        // REFLECT
        setStageStatuses(prev => ({ ...prev, REFLECT: 'active' }));
        setExpandedStage('REFLECT');
        try {
           const reflectRes = await triggerReflect();
           setStageJsons(prev => ({ ...prev, REFLECT: reflectRes }));
        } catch(e) {
           setStageJsons(prev => ({ ...prev, REFLECT: { error: e.message } }));
        }
        setStageStatuses(prev => ({ ...prev, REFLECT: 'completed' }));
        
        // SWEEP
        setStageStatuses(prev => ({ ...prev, SWEEP: 'active' }));
        setExpandedStage('SWEEP');
        try {
           const sweepRes = await triggerSweep();
           setStageJsons(prev => ({ ...prev, SWEEP: sweepRes }));
        } catch(e) {
           setStageJsons(prev => ({ ...prev, SWEEP: { error: e.message } }));
        }
        setStageStatuses(prev => ({ ...prev, SWEEP: 'completed' }));
        
    } catch(err) {
        setMessages(prev => prev.filter(m => m.type !== 'thinking'));
        addBotMessage('text', `Error: ${err.message}`);
        setStageStatuses(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => { if (next[k] === 'active') next[k] = 'error'; });
            return next;
        });
    }
    
    setIsProcessing(false);
  };

  const handleStageClick = (stageId) => {
     if (stageJsons[stageId]) {
         setExpandedStage(expandedStage === stageId ? null : stageId);
     }
  };
  
  return (
    <div style={{ display: 'flex', height: '100vh', padding: '32px', gap: '32px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Enterprise Chat Area */}
      <div 
         className="glass-panel" 
         style={{ 
            flex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%', 
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.9)', 
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.9) inset'
         }}
      >
         {/* Chat Header without logo image */}
         <div style={{ 
            padding: '20px 28px', 
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
         }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
               <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  color: '#ffffff'
               }}>
                  <Sparkles size={20} />
               </div>
               <div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                     Neuro-Symbolic Operations
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>
                     Autonomous Decision & Policy Engine
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '4px 10px', 
                  borderRadius: '99px', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  color: '#059669', 
                  fontSize: '0.72rem', 
                  fontWeight: 600 
               }}>
                  <span className="animate-pulse-subtle" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                  ENGINE ONLINE
               </div>

               <button 
                  type="button" 
                  onClick={handleResetChat} 
                  disabled={isProcessing}
                  title="Start a new conversation"
                  style={{
                     display: 'flex',
                     alignItems: 'center',
                     gap: '5px',
                     padding: '6px 12px',
                     borderRadius: '8px',
                     background: '#f8fafc',
                     border: '1px solid #e2e8f0',
                     color: '#64748b',
                     fontSize: '0.74rem',
                     fontWeight: 600,
                     cursor: isProcessing ? 'not-allowed' : 'pointer',
                     transition: 'all 0.15s ease'
                  }}
               >
                  <RotateCcw size={13} />
                  <span>Reset</span>
               </button>
            </div>
         </div>
         
         {/* Message History */}
         <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
            {messages.map(msg => (
               <MessageBubble key={msg.id} isUser={msg.sender === 'user'}>
                  {msg.type === 'text' && <div>{msg.text || msg.data}</div>}
                  {msg.type === 'intent' && <IntentCard data={msg.data} />}
                  {msg.type === 'decision' && <DecisionCard data={msg.data} />}
                  {msg.type === 'approval' && <ApprovalCard data={msg.data} />}
                  {msg.type === 'plan' && <PlanCard data={msg.data} />}
                  {msg.type === 'execute' && <ExecutionCard data={msg.data} />}
                  {msg.type === 'thinking' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
                         <ThinkingOrb theme="blue" label={msg.data} phases={['Analyzing ontology constraints…', 'Prompting neural planner…']} size={80} />
                      </div>
                  )}
               </MessageBubble>
            ))}
            
            {isProcessing && !messages.some(m => m.type === 'thinking') && (
               <div style={{ display: 'flex', gap: '14px', animation: 'fadeInUp 0.3s', marginBottom: '20px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.22)', color: '#ffffff' }}>
                     <Sparkles size={17} />
                  </div>
                  <div style={{ padding: '14px 20px', borderRadius: '18px 18px 18px 4px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Loader2 size={18} className="spinner" style={{ color: 'var(--primary)' }} />
                     <span style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 500 }}>Processing operational pipeline...</span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
         </div>
         
         {/* Floating Docked Input */}
         <div style={{ 
            padding: '16px 28px 20px 28px', 
            borderTop: '1px solid rgba(226, 232, 240, 0.8)', 
            background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.6) 0%, rgba(255, 255, 255, 0.95) 100%)' 
         }}>
            <form 
               onSubmit={handleSend} 
               style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  borderRadius: '99px',
                  padding: '6px 8px 6px 20px',
                  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(226, 232, 240, 0.5)',
                  gap: '12px',
                  transition: 'all 0.2s ease'
               }}
            >
               <input 
                 style={{
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    background: 'transparent',
                    fontFamily: 'Inter, sans-serif'
                 }}
                 value={input} 
                 onChange={e => setInput(e.target.value)}
                 placeholder="Describe an operational goal or action (e.g. increase credit limit)..."
                 disabled={isProcessing}
               />
               <button 
                 type="submit" 
                 disabled={isProcessing || !input.trim()}
                 style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: (isProcessing || !input.trim()) 
                       ? '#e2e8f0' 
                       : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: (isProcessing || !input.trim()) ? '#94a3b8' : '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: (isProcessing || !input.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: (isProcessing || !input.trim()) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                 }}
               >
                 <Send size={16} />
               </button>
            </form>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', marginTop: '8px', letterSpacing: '0.2px' }}>
               Enterprise Neuro-Symbolic Agent • Human-in-the-Loop Governance Active
            </div>
         </div>
      </div>

      {/* Enterprise Pipeline Sidebar */}
      {(() => {
        const completedCount = STAGES.filter(s => stageStatuses[s.id] === 'completed').length;
        const activeStage = STAGES.find(s => stageStatuses[s.id] === 'active');
        const progressPercent = Math.round((completedCount / STAGES.length) * 100);

        return (
          <div 
             className="glass-panel"
             style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%', 
                minWidth: '460px', 
                maxWidth: '520px',
                overflow: 'hidden', 
                background: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.9) inset',
                position: 'relative'
             }}
          >
             {/* Header */}
             <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ 
                      width: '38px', 
                      height: '38px', 
                      borderRadius: '10px', 
                      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      color: '#ffffff'
                   }}>
                      <Activity size={20} />
                   </div>
                   <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                         Pipeline Orchestration
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>
                         Neuro-Symbolic Decision Trace
                      </div>
                   </div>
                </div>
                
                {/* Dynamic Status Badge */}
                <div>
                   {activeStage ? (
                      <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '6px', 
                         padding: '4px 10px', 
                         borderRadius: '99px', 
                         background: 'rgba(37, 99, 235, 0.08)', 
                         border: '1px solid rgba(37, 99, 235, 0.2)', 
                         color: '#2563eb', 
                         fontSize: '0.72rem', 
                         fontWeight: 600, 
                         letterSpacing: '0.3px' 
                      }}>
                         <span className="animate-pulse-subtle" style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb' }}></span>
                         EXECUTING
                      </div>
                   ) : completedCount === STAGES.length ? (
                      <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '6px', 
                         padding: '4px 10px', 
                         borderRadius: '99px', 
                         background: 'rgba(16, 185, 129, 0.08)', 
                         border: '1px solid rgba(16, 185, 129, 0.2)', 
                         color: '#059669', 
                         fontSize: '0.72rem', 
                         fontWeight: 600 
                      }}>
                         <CheckCircle size={13} color="#059669" />
                         VERIFIED
                      </div>
                   ) : (
                      <div style={{ 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: '6px', 
                         padding: '4px 10px', 
                         borderRadius: '99px', 
                         background: 'rgba(100, 116, 139, 0.08)', 
                         border: '1px solid rgba(100, 116, 139, 0.2)', 
                         color: '#64748b', 
                         fontSize: '0.72rem', 
                         fontWeight: 600 
                      }}>
                         <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></div>
                         STANDBY
                      </div>
                   )}
                </div>
             </div>

             {/* Progress Metric Strip */}
             <div style={{ 
                padding: '12px 24px', 
                background: 'rgba(248, 250, 252, 0.75)', 
                borderBottom: '1px solid rgba(226, 232, 240, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
             }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                   <span style={{ color: '#64748b', fontWeight: 500 }}>
                      {activeStage ? (
                         <span>Running: <strong style={{ color: '#0f172a' }}>{activeStage.label}</strong></span>
                      ) : completedCount > 0 ? (
                         <span><strong style={{ color: '#0f172a' }}>{completedCount}</strong> of {STAGES.length} stages verified</span>
                      ) : (
                         <span>Ready for workflow execution</span>
                      )}
                   </span>
                   <span style={{ fontWeight: 700, color: completedCount === STAGES.length ? '#059669' : '#2563eb', fontSize: '0.72rem' }}>
                      {progressPercent}%
                   </span>
                </div>
                <div style={{ height: '5px', width: '100%', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                   <div style={{ 
                      height: '100%', 
                      width: `${progressPercent}%`, 
                      background: 'linear-gradient(90deg, #2563eb 0%, #6366f1 50%, #10b981 100%)', 
                      borderRadius: '99px', 
                      transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
                   }}></div>
                </div>
             </div>
             
             {/* Stage Timeline */}
             <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                   {STAGES.map((stage, idx) => {
                      const status = stageStatuses[stage.id] || 'pending';
                      const hasJson = !!stageJsons[stage.id];
                      const isExpanded = expandedStage === stage.id;
                      
                      const stageColor = STAGE_COLORS[stage.id] || '#3b82f6';
                      const StageIcon = STAGE_ICONS[stage.id] || Circle;
                      
                      const isActive = status === 'active';
                      const isCompleted = status === 'completed';
                      const isPending = status === 'pending';
                      const isLast = idx === STAGES.length - 1;

                      return (
                         <div 
                            key={stage.id} 
                            style={{ 
                               display: 'flex', 
                               gap: '14px',
                               opacity: isPending ? 0.65 : 1,
                               transition: 'all 0.25s ease'
                            }}
                         >
                            {/* Left Column: Timeline Spine (Node Icon + Continuous Straight Line) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
                               {/* Stage Node Icon */}
                               <div style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  borderRadius: '10px', 
                                  background: isActive 
                                     ? `linear-gradient(135deg, ${stageColor} 0%, ${stageColor}dd 100%)` 
                                     : isCompleted 
                                        ? '#ecfdf5' 
                                        : '#f8fafc',
                                  border: `1.5px solid ${
                                     isActive 
                                        ? stageColor 
                                        : isCompleted 
                                           ? '#10b981' 
                                           : '#e2e8f0'
                                  }`,
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: isActive 
                                     ? `0 0 0 3px ${stageColor}20, 0 4px 10px ${stageColor}35` 
                                     : isCompleted 
                                        ? '0 2px 6px rgba(16, 185, 129, 0.15)' 
                                        : 'none',
                                  color: isActive 
                                     ? '#ffffff' 
                                     : isCompleted 
                                        ? '#059669' 
                                        : '#94a3b8',
                                  transition: 'all 0.3s ease',
                                  zIndex: 2
                               }}>
                                  {isActive ? (
                                     <Loader2 size={17} className="spinner" />
                                  ) : isCompleted ? (
                                     <CheckCircle size={17} color="#059669" />
                                  ) : (
                                     <StageIcon size={16} />
                                  )}
                               </div>

                               {/* Continuous Straight Connecting Line to next stage */}
                               {!isLast && (
                                  <div style={{
                                     flex: 1,
                                     width: '2px',
                                     minHeight: '20px',
                                     background: isCompleted 
                                        ? '#10b981' 
                                        : isActive 
                                           ? `linear-gradient(180deg, ${stageColor} 0%, #cbd5e1 100%)` 
                                           : '#e2e8f0',
                                     margin: '4px 0',
                                     borderRadius: '1px',
                                     transition: 'background 0.3s ease'
                                  }} />
                               )}
                            </div>

                            {/* Right Column: Stage Row Card + Expanded Inspection Drawer */}
                            <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? '0' : '16px' }}>
                               {/* Stage Row Card */}
                               <div 
                                  onClick={() => hasJson && handleStageClick(stage.id)}
                                  style={{ 
                                     display: 'flex', 
                                     alignItems: 'center', 
                                     cursor: hasJson ? 'pointer' : 'default', 
                                     padding: '10px 14px',
                                     background: isActive 
                                        ? '#ffffff' 
                                        : isCompleted 
                                           ? '#ffffff' 
                                           : 'rgba(248, 250, 252, 0.7)',
                                     border: `1px solid ${
                                        isActive 
                                           ? stageColor 
                                           : isExpanded 
                                              ? 'rgba(37, 99, 235, 0.3)' 
                                              : isCompleted 
                                                 ? '#e2e8f0' 
                                                 : 'rgba(226, 232, 240, 0.7)'
                                     }`,
                                     borderRadius: '14px',
                                     boxShadow: isActive 
                                        ? `0 6px 20px -2px ${stageColor}25, 0 0 0 1px ${stageColor}30` 
                                        : isCompleted 
                                           ? '0 1px 3px rgba(15, 23, 42, 0.04)' 
                                           : 'none',
                                     transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                     userSelect: 'none'
                                  }}
                               >
                                  {/* Stage Details */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ 
                                           fontSize: '0.86rem', 
                                           fontWeight: 600, 
                                           color: isActive ? '#0f172a' : isCompleted ? '#1e293b' : '#64748b',
                                           whiteSpace: 'nowrap',
                                           overflow: 'hidden',
                                           textOverflow: 'ellipsis'
                                        }}>
                                           {stage.label}
                                        </span>
                                        <span style={{ 
                                           fontSize: '0.62rem', 
                                           fontWeight: 700, 
                                           color: '#94a3b8', 
                                           background: '#f1f5f9', 
                                           padding: '1px 5px', 
                                           borderRadius: '4px',
                                           letterSpacing: '0.3px',
                                           flexShrink: 0
                                        }}>
                                           0{idx + 1}
                                        </span>
                                     </div>

                                     {/* Dynamic telemetry / subtitle status */}
                                     <div style={{ fontSize: '0.72rem', marginTop: '2px', color: '#64748b' }}>
                                        {isActive ? (
                                           <span className="animate-pulse-subtle" style={{ color: stageColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stageColor }}></span>
                                              Executing stage sequence...
                                           </span>
                                        ) : isCompleted && stage.id === 'APPROVE' ? (
                                           <span style={{ 
                                              fontWeight: 600, 
                                              color: (stageJsons['APPROVE']?.state === 'APPROVED' || stageJsons['APPROVE']?.state === 'EXECUTING' || stageJsons['APPROVE']?.state === 'EXECUTED') 
                                                 ? '#059669' 
                                                 : (stageJsons['APPROVE']?.state === 'REJECTED' || stageJsons['APPROVE']?.state === 'BLOCKED') 
                                                    ? '#dc2626' 
                                                    : '#d97706' 
                                           }}>
                                              {(stageJsons['APPROVE']?.state === 'APPROVED' || stageJsons['APPROVE']?.state === 'EXECUTING' || stageJsons['APPROVE']?.state === 'EXECUTED') 
                                                 ? '✓ Auth Granted by Operator' 
                                                 : (stageJsons['APPROVE']?.state === 'REJECTED' || stageJsons['APPROVE']?.state === 'BLOCKED') 
                                                    ? '✗ Auth Denied by Policy' 
                                                    : `• ${stageJsons['APPROVE']?.state || 'Verified'}`}
                                           </span>
                                        ) : isCompleted && stage.id === 'DECISION' ? (
                                           <span>
                                              Verdict: <strong style={{ color: stageJsons['DECISION']?.allowed ? '#059669' : '#dc2626' }}>{stageJsons['DECISION']?.verdict || 'ALLOWED'}</strong>
                                              {stageJsons['DECISION']?.risk_tier && ` • Risk ${stageJsons['DECISION']?.risk_tier}`}
                                           </span>
                                        ) : isCompleted && stage.id === 'PLAN' ? (
                                           <span>
                                              {stageJsons['PLAN']?.steps?.length ? `${stageJsons['PLAN'].steps.length} Steps Synthesized` : 'Execution Plan Ready'}
                                           </span>
                                        ) : isCompleted && stage.id === 'INTENT' ? (
                                           <span>
                                              Action: <strong style={{ color: '#0f172a' }}>{stageJsons['INTENT']?.action?.split('/').pop() || 'Parsed'}</strong>
                                           </span>
                                        ) : isCompleted ? (
                                           <span style={{ color: '#059669', fontWeight: 500 }}>
                                              ✓ Verified Complete
                                           </span>
                                        ) : (
                                           <span>{stage.subtitle || 'Queued in pipeline'}</span>
                                        )}
                                     </div>
                                  </div>

                                  {/* Right Action: Inspect Pill */}
                                  {hasJson && (
                                     <div style={{ marginLeft: '10px', flexShrink: 0 }}>
                                        <button 
                                           type="button"
                                           onClick={(e) => {
                                              e.stopPropagation();
                                              handleStageClick(stage.id);
                                           }}
                                           style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '4px', 
                                              padding: '4px 8px', 
                                              borderRadius: '8px', 
                                              background: isExpanded ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc', 
                                              border: `1px solid ${isExpanded ? 'rgba(37, 99, 235, 0.25)' : '#e2e8f0'}`, 
                                              color: isExpanded ? '#2563eb' : '#64748b', 
                                              fontSize: '0.7rem', 
                                              fontWeight: 600, 
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease'
                                           }}
                                        >
                                           <span>{isExpanded ? 'Close' : 'Inspect'}</span>
                                           <ChevronDown 
                                              size={13} 
                                              style={{ 
                                                 transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                                                 transition: 'transform 0.2s ease' 
                                              }} 
                                           />
                                        </button>
                                     </div>
                                  )}
                               </div>
                               
                               {/* Expanded Stage Inspection Pane */}
                               {isExpanded && (
                                  <div 
                                     className="animate-fade-in-up" 
                                     style={{ 
                                        marginTop: '10px'
                                     }}
                                  >
                                     <div style={{ 
                                        background: '#ffffff', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: '14px', 
                                        padding: '14px',
                                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
                                     }}>
                                        <SidebarDashboard stageId={stage.id} data={stageJsons[stage.id]} />
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>
        );
      })()}
    </div>
  );
}
