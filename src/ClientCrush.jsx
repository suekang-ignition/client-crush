import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Star, RotateCcw, ArrowLeft, Zap, TrendingUp, TrendingDown, Clock, AlertTriangle, ChevronDown, FileCheck, Mail, Bell, FileText, Eye, Coins, Plus } from 'lucide-react';
import clientDataJson from './clientData.json';

// Transform JSON data to match component structure
const transformClientData = (jsonData) => {
  return jsonData.clients.map((client, index) => {
    // Safely access flags with fallback
    const flags = client.flags || [];

    // Determine priority based on flags
    let priority = 'low';
    if (flags.includes('overdue_payment') || flags.includes('has_outstanding_invoice')) {
      priority = 'urgent';
    } else if (client.computed.revenueDirection === 'declining') {
      priority = 'high';
    } else if (client.computed.revenueDirection === 'growing') {
      priority = 'high';
    }

    // Map tags from flags to display-friendly format
    const tags = [];
    if (client.computed.revenueDirection === 'growing') tags.push('Revenue growing');
    if (client.computed.revenueDirection === 'declining') tags.push('Revenue declining');
    if (flags.includes('overdue_payment')) tags.push('Late payment');
    if (flags.includes('has_outstanding_invoice')) tags.push('Payment failed');
    if (client.computed.proposalEndingSoon) tags.push('Proposal ending soon');
    if (tags.length === 0) tags.push('Upsell ready');

    // Calculate last engagement text from activity
    const getRelativeTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return '1 week ago';
      if (diffDays < 28) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    };

    return {
      id: index + 1,
      name: client.company,
      contactName: client.name,
      status: client.status.charAt(0).toUpperCase() + client.status.slice(1),
      assignedPartner: client.partner?.name || client.manager?.name,
      priority: priority,
      tags: tags,
      contractValue: client.computed.contractValue,
      activeServices: client.activeServiceCount,
      nextBillDate: client.billingSchedule?.nextBill?.date ? new Date(client.billingSchedule.nextBill.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : null,
      nextBillAmount: client.billingSchedule?.nextBill?.amount,
      monthlyRevenue: client.billingSchedule?.nextBill?.amount || 0,
      revenueChange: client.computed.revenueChange,
      paymentReliability: client.computed.paymentScore,
      lastEngagement: client.lastActivity ? getRelativeTime(client.lastActivity.date) : 'Unknown',
      activityLog: client.activity ? client.activity.slice(0, 2).map(a => a.event) : [],
      customerSince: client.computed.clientTenure,
      customerSinceYear: client.createdDate ? new Date(client.createdDate).getFullYear() : null,
      paidInvoices: client.invoices?.paid || 0,
      latePayments: (client.invoices?.failed || 0) + (client.invoices?.unpaid || 0),
      comingDueInvoices: client.billingSchedule?.upcomingBills?.length || 0,
      details: client.recommendedAction.reasoning,
      suggestedAction: client.recommendedAction.action,
      // Pricing intelligence
      fixedFeeReadiness: client.fixedFeeReadiness,
      confidenceEngine: client.confidenceEngine,
      actionRequired: client.actionRequired,
      revenueOpportunity: client.revenueOpportunity
    };
  });
};

// Client data: contractValue, billing trend %, payments health
const clientData = transformClientData(clientDataJson);

// Sort clients by total revenue potential (current contract + opportunity value)
clientData.sort((a, b) => {
  const totalA = a.contractValue + (a.revenueOpportunity?.totalOpportunityValue || 0);
  const totalB = b.contractValue + (b.revenueOpportunity?.totalOpportunityValue || 0);
  return totalB - totalA;
});

const tagConfig = {
  "Revenue growing": { icon: TrendingUp, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Upsell ready": { icon: Zap, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "At risk": { icon: AlertTriangle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Revenue declining": { icon: TrendingDown, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Late payment": { icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Proposal ending soon": { icon: Clock, bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  "Payment failed": { icon: AlertTriangle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Card expiring": { icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

const categories = {
  urgent: { label: "Needs Attention", icon: "🔴", color: "#dc2626", bgColor: "#fee2e2" },
  high: { label: "High Priority", icon: "🟠", color: "#ea580c", bgColor: "#ffedd5" },
  medium: { label: "Medium Priority", icon: "🟡", color: "#ca8a04", bgColor: "#fef9c3" },
  low: { label: "On Track", icon: "🟢", color: "#16a34a", bgColor: "#dcfce7" }
};

const SwipeCard = ({ client, isTop, onSwipe, style }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const category = categories[client.priority];

  // Determine action details - ALWAYS use PRIMARY recommendedAction from JSON
  const getActionDetails = () => {
    let action = client.suggestedAction; // This is the PRIMARY action from JSON
    let reasoning = client.details;
    let buttonLabel = 'Take Action';

    // Make action labels more UX friendly based on PRIMARY action
    const actionLower = action.toLowerCase();

    if (actionLower.includes('draft') && actionLower.includes('fixed')) buttonLabel = 'Draft Proposal';
    else if (actionLower.includes('schedule') && actionLower.includes('review')) buttonLabel = 'Schedule Review';
    else if (actionLower.includes('schedule') && actionLower.includes('meeting')) buttonLabel = 'Schedule Meeting';
    else if (actionLower.includes('propose') && actionLower.includes('service')) buttonLabel = 'Propose Services';
    else if (actionLower.includes('propose') && actionLower.includes('add-on')) buttonLabel = 'Propose Add-on';
    else if (actionLower.includes('propose') && actionLower.includes('tax')) buttonLabel = 'Propose Add-on';
    else if (actionLower.includes('propose') && actionLower.includes('expand')) buttonLabel = 'Propose Services';
    else if (actionLower.includes('review')) buttonLabel = 'Review Account';
    else if (actionLower.includes('cross-sell')) buttonLabel = 'Propose Services';
    else if (actionLower.includes('upsell')) buttonLabel = 'Propose Services';
    else if (actionLower.includes('complete') && actionLower.includes('verification')) buttonLabel = 'Complete Setup';
    else if (actionLower.includes('update') && actionLower.includes('card')) buttonLabel = 'Update Card';
    else if (actionLower.includes('update') && actionLower.includes('payment')) buttonLabel = 'Update Payment';
    else if (actionLower.includes('request') && actionLower.includes('payment')) buttonLabel = 'Update Payment';
    else if (actionLower.includes('resolve') && actionLower.includes('payment')) buttonLabel = 'Resolve Payment';
    else if (actionLower.includes('reminder')) buttonLabel = 'Send Reminder';
    else {
      // Default: take first 2 words
      const words = action.split(' ');
      buttonLabel = words.slice(0, 2).join(' ');
    }

    return { action, reasoning, buttonLabel };
  };

  const actionDetails = getActionDetails();

  const handleMouseDown = (e) => {
    if (!isTop) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isTop) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    const threshold = 150;

    if (position.x > threshold) {
      onSwipe('right', client);
    } else if (position.x < -threshold) {
      onSwipe('left', client);
    } else if (position.y < -threshold) {
      onSwipe('up', client);
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);

  const rotation = position.x / 25;

  return (
    <div
      ref={cardRef}
      className={`absolute w-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        ...style,
        height: '650px',
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) ${isTop ? 'scale(1)' : 'scale(0.96)'}`,
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: isTop ? 10 : style.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {isTop && (
        <>
          <div
            className="absolute top-8 left-8 text-5xl font-black pointer-events-none rotate-[-15deg] z-20"
            style={{
              opacity: position.x < -40 ? Math.min(1, Math.abs(position.x) / 150) : 0,
              color: '#64748b',
              textShadow: '2px 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            SKIP
          </div>
          <div
            className="absolute top-8 right-8 text-5xl font-black pointer-events-none rotate-[15deg] z-20"
            style={{
              opacity: position.x > 40 ? Math.min(1, position.x / 150) : 0,
              color: '#7c3aed',
              textShadow: '2px 2px 8px rgba(124, 58, 237, 0.2)'
            }}
          >
            PLAN
          </div>
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 text-5xl font-black pointer-events-none z-20"
            style={{
              opacity: position.y < -40 ? Math.min(1, Math.abs(position.y) / 150) : 0,
              color: '#3b82f6',
              textShadow: '2px 2px 8px rgba(59, 130, 246, 0.2)'
            }}
          >
            PRIORITY
          </div>
        </>
      )}

      <div className="bg-white rounded-3xl overflow-hidden h-full flex flex-col relative shadow-[0_8px_0_0_rgb(203,213,225),0_12px_20px_0_rgba(0,0,0,0.15)] border-4 border-slate-200">
        <div className="px-8 pt-6 pb-6 flex-1 overflow-y-auto flex flex-col">
          {/* TIER 1: Identity */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {client.contactName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{client.contactName}</h2>
                  {client.status && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      client.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      client.status === 'Lead' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {client.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <p className="text-slate-600">{client.name}</p>
                  {client.assignedPartner && (
                    <>
                      <span className="text-slate-400">•</span>
                      <p className="text-slate-500">Partner: {client.assignedPartner}</p>
                    </>
                  )}
                  {client.customerSinceYear && (
                    <>
                      <span className="text-slate-400">•</span>
                      <p className="text-slate-500">since {client.customerSinceYear}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TIER 3: Conditional Signals */}
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag, index) => {
                const config = tagConfig[tag] || { icon: Zap, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
                const Icon = config.icon;
                return (
                  <span key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm ${config.bg} ${config.text} ${config.border}`}>
                    <Icon className="w-3 h-3" />
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* TIER 2: Financial Snapshot */}
          <div className="mb-5">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-4">Key Insights</div>
            <div className="grid grid-cols-3 gap-4">
              {/* Annual Revenue with Trend */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium mb-2">Annual Revenue</div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-2xl font-bold text-slate-900">
                    ${(client.contractValue / 1000).toFixed(0)}k
                  </div>
                  {client.revenueChange !== undefined && client.revenueChange !== 0 && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${client.revenueChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {client.revenueChange > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          <span>{Math.abs(client.revenueChange)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4" />
                          <span>{Math.abs(client.revenueChange)}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {client.activeServices && (
                  <div className="text-xs text-slate-500">
                    {client.activeServices} active {client.activeServices === 1 ? 'service' : 'services'}
                  </div>
                )}
              </div>

              {/* Outstanding */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium mb-2">Outstanding</div>
                {client.latePayments > 0 ? (
                  <>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      ${((client.latePayments * client.monthlyRevenue) / 1000).toFixed(1)}k
                    </div>
                    <div className="text-xs text-slate-500">
                      {client.latePayments} overdue {client.latePayments === 1 ? 'invoice' : 'invoices'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      $0
                    </div>
                    <div className="text-xs text-slate-500">
                      All paid
                    </div>
                  </>
                )}
              </div>

              {/* Payment Health */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 font-medium mb-2">Payment Health</div>
                {(() => {
                  const paymentScore = client.paymentReliability || 0;

                  // Determine payment status
                  let statusText, statusColor;

                  if (paymentScore === 0) {
                    statusText = 'No payment method';
                    statusColor = 'text-slate-600';
                  }
                  else if (paymentScore < 70) {
                    statusText = 'At risk';
                    statusColor = 'text-red-600';
                  }
                  else if (paymentScore < 80) {
                    statusText = 'Good';
                    statusColor = 'text-blue-600';
                  }
                  else if (paymentScore < 90) {
                    statusText = 'Very Good';
                    statusColor = 'text-emerald-600';
                  }
                  else {
                    statusText = 'Excellent';
                    statusColor = 'text-emerald-600';
                  }

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-2xl font-bold text-slate-900">
                          {paymentScore}
                        </div>
                        <div className={`text-xs font-bold ${statusColor}`}>
                          {statusText}
                        </div>
                      </div>
                      <div className="relative">
                        <div className="flex h-1.5 rounded-full overflow-hidden">
                          <div className="w-[30%] bg-red-500"></div>
                          <div className="w-[25%] bg-orange-500"></div>
                          <div className="w-[20%] bg-yellow-400"></div>
                          <div className="w-[25%] bg-green-500"></div>
                        </div>
                        <div
                          className="absolute top-0 w-0.5 h-1.5 bg-slate-800"
                          style={{ left: `${paymentScore}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl p-6 border-4 border-violet-500 bg-white shadow-[0_6px_0_0_rgb(139,92,246),0_10px_15px_0_rgba(0,0,0,0.1)]">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-violet-600 mb-1 uppercase tracking-wide">Recommended Action</div>
                <p className="text-lg font-bold text-slate-900 leading-snug">{actionDetails.action}</p>
                {client.revenueOpportunity && client.revenueOpportunity.totalOpportunityValue > 0 && (
                  <div className="mt-3 pt-3 border-t border-violet-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Coins className="w-3.5 h-3.5 text-slate-500" />
                        Revenue Opportunity
                      </div>
                      <div className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                        <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>${client.revenueOpportunity.totalOpportunityValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-dashed border-slate-300">
            <div className="text-sm font-bold text-slate-700 mb-3">Why this action?</div>
            <div className="text-slate-600 text-sm leading-relaxed space-y-2">
              {/* Format reasoning to be more scannable - no colors, just clean structure */}
              {(() => {
                const text = actionDetails.reasoning;
                // Split by periods for better readability
                const sentences = text.split(/\.\s+/).filter(s => s.trim());

                return sentences.map((sentence, idx) => {
                  // Just make key numbers bold, no colors
                  const formatted = sentence
                    .replace(/\$([0-9,]+(?:\.[0-9]+)?[kKmM]?)/g, '<strong>$$$1</strong>')
                    .replace(/([+-]?\d+(?:\.\d+)?%)/g, '<strong>$1</strong>')
                    .replace(/(\d+)\s+(days?|months?)/g, '<strong>$1 $2</strong>');

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0"></div>
                      <p
                        className="text-sm flex-1"
                        dangerouslySetInnerHTML={{ __html: formatted + '.' }}
                      />
                    </div>
                  );
                });
              })()}
            </div>

            {/* Fixed Fee Pricing Calculator - Only show when PRIMARY action is drafting/proposing fixed-fee AND no urgent payment issues */}
            {client.confidenceEngine?.justinKurnMaths &&
             (() => {
               const action = client.suggestedAction.toLowerCase();
               // Hide if there are payment issues or late payments
               if (client.latePayments > 0 || client.actionRequired?.failedPayments > 0 || client.actionRequired?.expiringCards > 0) {
                 return false;
               }
               // ONLY show if action starts with "draft" and contains "fixed" AND contains "renewal"
               return action.startsWith('draft') && action.includes('fixed') && action.includes('renewal') && !action.includes('outstanding');
             })() && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs font-bold text-violet-600 mb-3 uppercase tracking-wide">💰 Fixed Fee Calculator</div>
                <div className="bg-white rounded-lg p-3 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">3-Year Average:</span>
                    <span className="font-semibold text-slate-900">${client.confidenceEngine.justinKurnMaths.averageAnnualBilledLast3Years.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">+ Hidden Value:</span>
                    <span className="font-semibold text-amber-600">${client.confidenceEngine.justinKurnMaths.estimatedWriteOffOrHiddenValue.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-bold">Suggested Fixed Fee:</span>
                    <span className="font-bold text-lg text-violet-600">${client.confidenceEngine.justinKurnMaths.suggestedFixedFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Uplift:</span>
                    <span className="font-semibold text-emerald-600">+${client.confidenceEngine.justinKurnMaths.upliftAmount.toLocaleString()} ({client.confidenceEngine.justinKurnMaths.upliftPercent}%)</span>
                  </div>
                </div>
                {client.confidenceEngine.justinKurnMaths.note && (
                  <p className="text-xs text-slate-500 mt-2 italic">{client.confidenceEngine.justinKurnMaths.note}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DecisionColumn = ({ title, icon, color, bgColor, clients, emptyMessage }) => (
  <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
        style={{ backgroundColor: bgColor, color: color }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-slate-900 font-bold text-base">{title}</h3>
        <p className="text-slate-500 text-sm">{clients.length} {clients.length === 1 ? 'client' : 'clients'}</p>
      </div>
    </div>

    <div className="space-y-2 max-h-80 overflow-y-auto">
      {clients.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">{emptyMessage}</p>
      ) : (
        clients.map(c => (
          <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-[10px]">
                {c.contactName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="font-semibold text-slate-900 text-sm">{c.contactName}</div>
            </div>
            <div className="text-slate-500 text-xs ml-8">{c.name}</div>
            {c.suggestedAction && <div className="text-violet-600 text-xs font-medium mt-2 ml-8">{c.suggestedAction}</div>}
          </div>
        ))
      )}
    </div>
  </div>
);

export default function ClientCrush() {
  const [clients, setClients] = useState(clientData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState({ engaged: [], skipped: [], actioned: [] });
  const [animatingCard, setAnimatingCard] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievements, setAchievements] = useState([]);

  // Get action button label for current client
  const getCurrentActionLabel = () => {
    if (currentIndex >= clients.length) return 'Take Action';
    const client = clients[currentIndex];

    // Prioritize the PRIMARY recommendedAction - only override for truly urgent payment issues
    const action = client.suggestedAction.toLowerCase();

    // Make action labels more UX friendly based on PRIMARY action
    if (action.includes('draft') && action.includes('fixed')) return 'Draft Proposal';
    if (action.includes('schedule') && action.includes('review')) return 'Schedule Review';
    if (action.includes('schedule') && action.includes('meeting')) return 'Schedule Meeting';
    if (action.includes('propose') && action.includes('service')) return 'Propose Services';
    if (action.includes('propose') && action.includes('add-on')) return 'Propose Add-on';
    if (action.includes('propose') && action.includes('tax')) return 'Propose Add-on';
    if (action.includes('propose') && action.includes('expand')) return 'Propose Services';
    if (action.includes('review')) return 'Review Account';
    if (action.includes('cross-sell')) return 'Propose Services';
    if (action.includes('upsell')) return 'Propose Services';
    if (action.includes('complete') && action.includes('verification')) return 'Complete Setup';
    if (action.includes('update') && action.includes('card')) return 'Update Card';
    if (action.includes('update') && action.includes('payment')) return 'Update Payment';
    if (action.includes('request') && action.includes('payment')) return 'Update Payment';

    // Only override with payment actions if recommendedAction itself is payment-related
    if (action.includes('reminder') || action.includes('payment') || action.includes('resolve')) {
      if (client.actionRequired?.failedPayments > 0) return 'Resolve Payment';
      if (client.actionRequired?.expiringCards > 0) return 'Update Card';
      if (client.latePayments > 0) return 'Send Reminder';
    }

    if (client.paymentReliability === 0) return 'Add Payment';

    // Default: take first 2 words and capitalize
    const words = client.suggestedAction.split(' ');
    return words.slice(0, 2).join(' ');
  };

  const handleSwipe = (direction, client) => {
    setAnimatingCard({ direction, client });

    const newAchievements = [];
    if (currentIndex + 1 === 5 && !achievements.includes('first-5')) {
      newAchievements.push('first-5');
      setShowCelebration('Great progress! 5 clients reviewed');
    }
    if (decisions.actioned.length + (direction === 'up' ? 1 : 0) === 3 && !achievements.includes('actioned-focus')) {
      newAchievements.push('actioned-focus');
      setShowCelebration('Nice! 3 clients actioned');
    }
    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    setTimeout(() => {
      if (direction === 'right') {
        setDecisions(prev => ({ ...prev, engaged: [...prev.engaged, client] }));
      } else if (direction === 'left') {
        setDecisions(prev => ({ ...prev, skipped: [...prev.skipped, client] }));
      } else if (direction === 'up' || direction === 'action') {
        setDecisions(prev => ({ ...prev, actioned: [...prev.actioned, client] }));
      }

      setCurrentIndex(prev => prev + 1);
      setAnimatingCard(null);
    }, 300);
  };

  const handleButtonClick = (direction) => {
    if (currentIndex < clients.length) {
      handleSwipe(direction, clients[currentIndex]);
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const lastClient = clients[prevIndex];

      setDecisions(prev => ({
        engaged: prev.engaged.filter(c => c.id !== lastClient.id),
        skipped: prev.skipped.filter(c => c.id !== lastClient.id),
        actioned: prev.actioned.filter(c => c.id !== lastClient.id)
      }));

      setCurrentIndex(prevIndex);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setDecisions({ engaged: [], skipped: [], actioned: [] });
    setAchievements([]);
    setShowCelebration(false);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentIndex >= clients.length) return;

      if (e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
        handleButtonClick('action'); // Action Now
      } else if (e.key === 'ArrowLeft' || e.key === 's' || e.key === 'S') {
        handleButtonClick('left'); // Skip
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        handleButtonClick('right'); // Plan for Later
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  const progress = ((currentIndex) / clients.length) * 100;
  const isComplete = currentIndex >= clients.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        .card-container {
          animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .confetti {
          position: fixed;
          animation: confetti 3s linear;
        }
      `}</style>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl px-12 py-8 border-4 border-blue-500 shadow-[0_8px_0_0_rgb(59,130,246),0_12px_20px_0_rgba(0,0,0,0.15)]">
            <div className="text-6xl mb-4 text-center">🎉</div>
            <div className="text-3xl font-black text-slate-900 text-center">
              {showCelebration}
            </div>
          </div>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                width: '8px',
                height: '8px',
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-20 px-12 pt-6 pb-5 bg-white border-b-2 border-slate-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 mb-1.5">
                <span className="mr-2">💘</span>Client Crush
              </h1>
              <p className="text-slate-600 text-base">Work through your clients and take the next best action.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUndo}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-all font-semibold shadow-sm hover:shadow"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 transition-all font-semibold shadow-sm hover:shadow"
              >
                <ArrowLeft className="w-4 h-4" />
                Start Over
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-600 mb-3 font-medium">
              <span>{currentIndex} reviewed</span>
              <span>{clients.length - currentIndex} remaining</span>
            </div>
            <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 py-8">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-4">
            <DecisionColumn
              title="Actioned"
              icon="⭐"
              color="#dc2626"
              bgColor="#fee2e2"
              clients={decisions.actioned}
              emptyMessage="No actioned clients yet"
            />

            <DecisionColumn
              title="Plan for Later"
              icon="📅"
              color="#7c3aed"
              bgColor="#ede9fe"
              clients={decisions.engaged}
              emptyMessage="Nothing planned yet"
            />

            <DecisionColumn
              title="Skipped"
              icon="⏭"
              color="#64748b"
              bgColor="#f1f5f9"
              clients={decisions.skipped}
              emptyMessage="Nothing skipped"
            />
          </div>

          <div className="col-span-6">
            <div className="relative mx-auto" style={{ height: '700px', maxWidth: '620px' }}>
              {!isComplete ? (
                <div className="relative w-full card-container" style={{ height: '650px' }}>
                  {clients.slice(currentIndex, currentIndex + 3).map((client, index) => {
                    const isTop = index === 0;

                    return (
                      <SwipeCard
                        key={client.id}
                        client={client}
                        isTop={isTop}
                        onSwipe={handleSwipe}
                        style={{
                          zIndex: 10 - index,
                          opacity: 1 - (index * 0.2),
                          top: `${index * 8}px`,
                          left: 0,
                          right: 0,
                          pointerEvents: isTop ? 'auto' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center bg-white rounded-3xl p-12 border-4 border-slate-200 shadow-2xl max-w-xl">
                    <div className="text-7xl mb-6">🎉</div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4">
                      All Done!
                    </h2>
                    <p className="text-slate-600 text-xl mb-8">You've reviewed all {clients.length} clients</p>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                        <div className="text-4xl font-black text-blue-600 mb-2">
                          {decisions.actioned.length}
                        </div>
                        <div className="text-sm text-blue-900 font-semibold">Priority Actions</div>
                      </div>
                      <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
                        <div className="text-4xl font-black text-purple-600 mb-2">
                          {decisions.engaged.length}
                        </div>
                        <div className="text-sm text-purple-900 font-semibold">Planned Actions</div>
                      </div>
                    </div>

                    {achievements.length > 0 && (
                      <div className="mb-8 bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
                        <h3 className="text-lg font-bold text-amber-900 mb-4">Achievements</h3>
                        <div className="flex gap-3 justify-center flex-wrap">
                          {achievements.includes('first-5') && (
                            <div className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-sm">
                              First 5 Complete
                            </div>
                          )}
                          {achievements.includes('actioned-focus') && (
                            <div className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold shadow-sm">
                              Action Master
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="px-10 py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-[0_6px_0_0_rgb(37,99,235),0_10px_15px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_0_0_rgb(37,99,235)] hover:translate-y-[2px] active:translate-y-[4px] transition-all border-4 border-blue-400"
                    >
                      Review Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3">
            {!isComplete && (
              <div className="sticky top-8 space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-slate-300">
                  <h3 className="text-slate-900 font-bold text-lg mb-5">Quick Actions</h3>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleButtonClick('action')}
                      className="w-full py-4 bg-violet-500 text-white rounded-2xl font-bold text-lg shadow-sm hover:bg-violet-600 active:bg-violet-700 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        <span>{getCurrentActionLabel()}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleButtonClick('right')}
                      className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-sm hover:bg-blue-600 active:bg-blue-700 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" />
                        <span>Plan for Later</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleButtonClick('left')}
                      className="w-full py-4 bg-slate-200 text-slate-700 rounded-2xl font-bold text-lg shadow-sm hover:bg-slate-300 active:bg-slate-400 transition-colors"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <X className="w-5 h-5" />
                        <span>Skip for Now</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                  <p className="text-sm text-blue-900 leading-relaxed">
                    <span className="font-bold">Keyboard shortcuts:</span><br/>
                    <span className="text-blue-700">Enter Action · ← Skip · → Plan</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
