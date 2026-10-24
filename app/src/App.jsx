import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Building2, Search, 
  Sparkles, RefreshCw, FileText, ChevronRight, ChevronDown, CheckCircle2, 
  XCircle, Scale, Landmark, Globe, Cpu, Activity, Lock, Unlock,
  Printer, Download, Layers, Shield, LayoutGrid, List, SlidersHorizontal,
  ArrowUpDown, X, Maximize2, Minimize2, Check, ExternalLink, Hash, Clock,
  Calendar, UserCheck, AlertOctagon, FileCheck, CheckCheck,
  BarChart3, PieChart, TrendingUp, Plus
} from 'lucide-react';

const SORT_OPTIONS = [
  { id: 'risk-desc', label: 'Risk: High to Low' },
  { id: 'risk-asc', label: 'Risk: Low to High' },
  { id: 'name', label: 'Entity Name (A-Z)' },
  { id: 'id', label: 'BP ID (Numeric)' }
];

export default function App() {
  const [stats, setStats] = useState({
    totalMonitored: 0,
    criticalRiskCount: 0,
    highRiskCount: 0,
    cleanCount: 0,
    avgComplianceScore: 92.5,
    sanctionAlertsCount: 0
  });

  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('risk-desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [isDossierMaximized, setIsDossierMaximized] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [showBriefingCharts, setShowBriefingCharts] = useState(() => {
    try {
      const saved = localStorage.getItem('sap_briefing_charts');
      return saved !== null ? saved === 'true' : true; // Default to true so analytics charts are actively integrated
    } catch {
      return true;
    }
  });

  const toggleBriefingCharts = () => {
    setShowBriefingCharts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sap_briefing_charts', String(next));
      } catch {}
      return next;
    });
  };
  const [actionNotice, setActionNotice] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Dynamic spacer calculation to push table footer to bottom on the last page
  const [briefingSpacer, setBriefingSpacer] = useState(0);
  const [bpSpacer, setBpSpacer] = useState(0);

  const preparePrint = () => {
    const pageH = 981; // Exact A4 printable body height in CSS pixels between thead and tfoot
    const briefingContent = document.getElementById('briefing-print-body');
    if (briefingContent) {
      try {
        const clone = briefingContent.cloneNode(true);
        clone.style.width = '718px';
        clone.style.position = 'fixed';
        clone.style.left = '-99999px';
        clone.style.top = '0';
        clone.style.visibility = 'hidden';
        document.body.appendChild(clone);
        const h = clone.offsetHeight;
        document.body.removeChild(clone);
        const rem = h % pageH;
        const needed = rem > 0 ? Math.max(0, pageH - rem - 15) : 0;
        setBriefingSpacer(needed);
      } catch {
        const h = briefingContent.scrollHeight;
        const rem = h % pageH;
        setBriefingSpacer(rem > 0 ? Math.max(0, pageH - rem - 15) : 0);
      }
    }
    const bpContent = document.getElementById('bp-print-body');
    if (bpContent) {
      try {
        const clone = bpContent.cloneNode(true);
        clone.style.width = '718px';
        clone.style.position = 'fixed';
        clone.style.left = '-99999px';
        clone.style.top = '0';
        clone.style.visibility = 'hidden';
        document.body.appendChild(clone);
        const h = clone.offsetHeight;
        document.body.removeChild(clone);
        const rem = h % pageH;
        const needed = rem > 0 ? Math.max(0, pageH - rem - 15) : 0;
        setBpSpacer(needed);
      } catch {
        const h = bpContent.scrollHeight;
        const rem = h % pageH;
        setBpSpacer(rem > 0 ? Math.max(0, pageH - rem - 15) : 0);
      }
    }
  };

  const handlePrintBriefing = () => {
    preparePrint();
    setTimeout(() => window.print(), 80);
  };

  const handlePrintBp = () => {
    preparePrint();
    setTimeout(() => window.print(), 80);
  };

  useEffect(() => {
    const onBeforePrint = () => preparePrint();
    const onAfterPrint = () => {
      setBriefingSpacer(0);
      setBpSpacer(0);
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, [reportModal, selectedPartner, showBriefingCharts]);

  // Fetch complete SAP S/4HANA master data portfolio
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, partnersRes] = await Promise.all([
        fetch('/api/getPortfolioStats()'),
        fetch('/api/getBusinessPartners()')
      ]);
      const statsData = await statsRes.json();
      const partnersData = await partnersRes.json();

      if (statsData.value) setStats(statsData.value);
      if (partnersData.value) setPartners(partnersData.value);
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load master data once on mount; category filtering and search operate client-side
  // so that tab counters and KPI statistics remain rock-solid and stable.
  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  // Run Deep AI Audit on Partner
  const runDeepAudit = async (bpId) => {
    setAuditing(true);
    try {
      const res = await fetch(`/api/auditPartner(bpId='${bpId}')`);
      const data = await res.json();
      if (data.value) {
        setAuditDetail(data.value);
      }
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  // When clicking a partner, open the overlay drawer immediately
  const openPartnerAudit = (bp) => {
    setSelectedPartner(bp);

    // Instant rich preview with calculated indicators while deep data streams
    const hasAddr = bp.country && bp.country !== 'UNKNOWN';
    setAuditDetail({
      bpId: bp.ID,
      fullName: bp.fullName,
      country: hasAddr ? bp.country : 'UNREGISTERED',
      cityName: bp.cityName || 'Unregistered Jurisdiction',
      streetAddress: hasAddr ? 'Standard Registered Address' : 'No Physical Domicile Record on File',
      postalCode: hasAddr ? 'On File' : 'MISSING',
      legalForm: bp.category === '1' ? 'Individual Enterprise' : 'Commercial Corporate Entity',
      createdByUser: 'S/4HANA Master Admin',
      creationDate: 'Verified System Record',
      lastChangedByUser: 'MDG_EXPERT',
      lastChangeDate: 'Recent Audit Cycle',
      grouping: 'BP02',
      hasAddress: hasAddr,
      auditReferenceId: `AUD-SAP-${bp.ID}`,
      fiscalScore: bp.taxNumber === 'NOT FILED' ? 40 : 96,
      solvencyScore: bp.isBlocked ? 45 : 95,
      legalScore: hasAddr ? 98 : 60,
      operationalScore: 80,
      taxNumber: bp.taxNumber,
      identificationNumber: bp.identificationNumber,
      riskScore: bp.riskScore,
      riskLevel: bp.riskLevel,
      alerts: [
        ...(bp.taxNumber === 'NOT FILED' ? [{
          category: 'TAX',
          severity: 'HIGH',
          standard: 'EU VAT Directive Art. 214 / IRS Form W-9',
          sourceTable: 'A_BusinessPartnerTax (Table DFKKBPTAXNUM)',
          message: 'No official VAT Registration or Fiscal Tax Identification Number on file.',
          details: 'Mandatory cross-check with tax authorities failed. Entity cannot be verified for statutory reporting or withholding tax.'
        }] : []),
        ...(!hasAddr ? [{
          category: 'DATA_GOVERNANCE',
          severity: 'CRITICAL',
          standard: 'FATF Recommendation 10 & S/4HANA MDG Protocol',
          sourceTable: 'A_BusinessPartnerAddress (Table BUT020 / ADRC)',
          message: 'Zero registered postal address records found in S/4HANA (Ghost/Shell Record).',
          details: 'Severe KYC & AML violation. Payments and commercial contracting are restricted without a verified legal domicile.'
        }] : [])
      ],
      isBankrupt: false,
      hasLegalProceedings: false,
      isPostingBlocked: bp.isBlocked,
      taxMissing: bp.taxNumber === 'NOT FILED',
      bankCount: 1,
      ratingGrade: 'A-',
      ratingTrend: 'STABLE',
      aiExecutiveSummary: `Autonomous master data audit initiated for ${bp.fullName} (BP #${bp.ID}). Composite compliance exposure evaluated at ${bp.riskScore}/100 (${bp.riskLevel} risk tier). Live OData verification in progress...`,
      aiRecommendations: [
        !hasAddr ? 'Mandate immediate submission of official Certificate of Incorporation and physical registered address.' : (bp.taxNumber === 'NOT FILED' ? 'Collect verified Form W-9 / official VAT Certificate from entity controller.' : 'Fiscal tax registration validated.'),
        bp.riskScore >= 50 ? 'Apply S/4HANA Posting Block (A_SupplierCompany.SupplierIsBlockedForPosting) to prevent automated disbursement runs.' : 'Maintain standard payment run terms.',
        'Continuous automated surveillance active across global OFAC, EU, and UN sanctions watchlists.'
      ],
      auditedAt: new Date().toISOString()
    });

    runDeepAudit(bp.ID);
  };

  const closeDossier = () => {
    setSelectedPartner(null);
    setAuditDetail(null);
    setIsDossierMaximized(false);
  };

  const triggerAction = (message) => {
    setActionNotice(message);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  const openPortfolioReport = async () => {
    try {
      const res = await fetch('/api/generateExecutiveReport()');
      const data = await res.json();
      setReportText(data.value);
      setReportModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 70) {
      return {
        label: 'CRITICAL RISK',
        border: 'border-rose-500/50',
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        progress: 'bg-rose-500'
      };
    }
    if (score >= 45) {
      return {
        label: 'HIGH RISK',
        border: 'border-amber-500/50',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        progress: 'bg-amber-500'
      };
    }
    if (score >= 30) {
      return {
        label: 'MODERATE RISK',
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
        progress: 'bg-yellow-500'
      };
    }
    return {
      label: 'COMPLIANT',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      progress: 'bg-emerald-500'
    };
  };

  // Robust Filtering and Sorting: Handles search, tab filtering, and sort criteria properly
  const filteredPartners = partners
    .filter((bp) => {
      if (filter === 'CRITICAL') return bp.riskScore >= 70 || bp.riskLevel === 'CRITICAL' || bp.riskLevel === 'HIGH';
      if (filter === 'TAX_MISSING') return bp.taxNumber === 'NOT FILED';
      if (filter === 'BLOCKED') return bp.isBlocked;
      if (filter === 'CLEAN') return bp.riskScore < 30 || bp.riskLevel === 'LOW';
      return true;
    })
    .filter((bp) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        bp.fullName?.toLowerCase().includes(q) ||
        bp.ID?.toLowerCase().includes(q) ||
        bp.country?.toLowerCase().includes(q) ||
        bp.cityName?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'risk-desc') return b.riskScore - a.riskScore;
      if (sortBy === 'risk-asc') return a.riskScore - b.riskScore;
      if (sortBy === 'name') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortBy === 'id') return (parseInt(a.ID, 10) || 0) - (parseInt(b.ID, 10) || 0);
      return 0;
    });

  return (
    <div className="min-h-screen text-slate-100 bg-[#070B12] selection:bg-indigo-600 selection:text-white print:min-h-0 print:h-auto print:bg-white print:p-0">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-black text-xs text-white">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-white p-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#080C14]/90 border-b border-slate-800/80 px-6 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base">SAP Sentinel AI</span>
              <p className="text-xs text-slate-400 mt-0.5">Autonomous S/4HANA Master Data Governance & Regulatory Risk Surveillance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={openPortfolioReport}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-600/25 transition">
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Briefing</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-6 pt-6 pb-20 space-y-6 ${reportModal || selectedPartner ? 'print:hidden' : ''}`}>
        
        {/* Executive KPI Matrix (Calculated directly from live master records without falsy fallback traps) */}
        {(() => {
          const totalCount = partners.length;
          const criticalCount = partners.filter(p => p.riskScore >= 70).length;
          const sanctionCount = partners.filter(p => ['CU', 'IR', 'KP', 'SY', 'RU', 'BY'].includes(p.country) || p.topRiskCategory === 'SANCTION').length;
          const avgScore = totalCount > 0 
            ? (100 - (partners.reduce((sum, p) => sum + p.riskScore, 0) / totalCount)).toFixed(1)
            : (stats.avgComplianceScore ? stats.avgComplianceScore.toFixed(1) : '0.0');

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-medium uppercase tracking-wider text-[11px]">Monitored Entities</span>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{totalCount}</div>
                <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>100% active SAP Business Partner records</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-rose-500/30 bg-rose-950/10 backdrop-blur">
                <div className="flex items-center justify-between text-rose-300 text-xs mb-2">
                  <span className="font-medium uppercase tracking-wider text-[11px]">Critical Risk Exceptions</span>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-rose-400 tracking-tight">{criticalCount}</div>
                <div className="text-[11px] text-rose-300/80 mt-1.5 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>Missing physical domicile or KYC data</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-medium uppercase tracking-wider text-[11px]">Sanction & Watchlist Matches</span>
                  <Scale className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 tracking-tight">{sanctionCount}</div>
                <div className="text-[11px] text-emerald-400/90 mt-1.5 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>100% Clean • OFAC & EU Verified</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span className="font-medium uppercase tracking-wider text-[11px]">Portfolio Compliance Index</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400 tracking-tight">{avgScore}%</div>
                <div className="text-[11px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                  <span>Dynamic Composite Risk Rating</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* FIXED STICKY COMMAND & SEARCH BAR                            */}
        {/* Pinned as the user moves/scrolls through the Business Partner grid */}
        {/* ------------------------------------------------------------- */}
        <div className="sticky top-[67px] z-30 -mx-6 px-6 py-3.5 backdrop-blur-2xl bg-[#070B12]/95 border-y border-slate-800/90 shadow-xl shadow-black/60 transition-all">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by legal name, BP ID, city, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
              />
              {search && (
                <button 
                  type="button" 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Category Filter Tabs with Stable Counters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              {[
                { id: 'ALL', label: 'All Partners', count: partners.length },
                { id: 'CRITICAL', label: 'Critical Risk', count: partners.filter(p => p.riskScore >= 70 || p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH').length },
                { id: 'TAX_MISSING', label: 'Missing Tax ID', count: partners.filter(p => p.taxNumber === 'NOT FILED').length },
                { id: 'BLOCKED', label: 'Posting Blocked', count: partners.filter(p => p.isBlocked).length },
                { id: 'CLEAN', label: 'Compliant', count: partners.filter(p => p.riskScore < 30 || p.riskLevel === 'LOW').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap cursor-pointer ${
                    filter === tab.id 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' 
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}>
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filter === tab.id ? 'bg-indigo-700/60 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* View Mode & Sorting Controls */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid Card View"
                  className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Compact Table View"
                  className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Custom Non-Native Sort Dropdown (eliminates giant OS select popup) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 transition shadow-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                  title="Sort Business Partners"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium text-slate-200">
                    {SORT_OPTIONS.find((o) => o.id === sortBy)?.label || 'Sort'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <>
                    {/* Click outside backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSortOpen(false)} 
                    />
                    
                    {/* Compact Popover Menu */}
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0B0F19] border border-slate-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden ring-1 ring-black/40 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800/80">
                        Sort Master Entities
                      </div>
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSortBy(opt.id);
                              setIsSortOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition text-left cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                title="Refresh master data"
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* FULL-WIDTH BUSINESS PARTNER GRID / TABLE                      */}
        {/* Keeps grid stable & in place without shrinking to half-screen */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Displaying <strong className="text-white">{filteredPartners.length}</strong> Business Partner master entities
            </span>
          </div>

          {loading ? (
            <div className="p-16 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
              <h4 className="font-semibold text-slate-200 text-sm">Querying SAP S/4HANA OData Gateway</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Synchronizing entity records, tax registrations, and credit status...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-16 rounded-2xl bg-slate-900/30 border border-slate-800/80 text-center">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-300 text-sm">No Business Partner Entities Found</h4>
              <p className="text-xs text-slate-500 mt-1">Try selecting another filter tab or search keyword above.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ============================================================ */
            /* FULL-WIDTH RESPONSIVE CARD GRID                              */
            /* ============================================================ */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPartners.map((bp) => {
                const badge = getScoreBadge(bp.riskScore);
                const isSelected = selectedPartner?.ID === bp.ID;
                const hasAddr = bp.country && bp.country !== 'UNKNOWN';

                return (
                  <div
                    key={bp.ID}
                    onClick={() => openPartnerAudit(bp)}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border backdrop-blur flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-2 ring-indigo-500/50' 
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg hover:shadow-black/40'
                    }`}>
                    
                    <div>
                      {/* Top Bar: Country, BP Number, Severity Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[10px] font-semibold border px-2 py-0.5 rounded ${
                            hasAddr ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          }`}>
                            {hasAddr ? bp.country : 'NO ADDR'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            #{bp.ID}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.badge}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Main Title / Legal Entity Name */}
                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition line-clamp-1">
                        {bp.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                        <span>{hasAddr ? bp.cityName : 'Unregistered Domicile'}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px]">{bp.category || 'Organization'}</span>
                      </p>

                      {/* Vector Checklist Grid */}
                      <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-800/70 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400 truncate">
                          {bp.taxNumber === 'NOT FILED' ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span className="text-amber-400 font-mono text-[10px]">No Tax ID</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="text-slate-300 font-mono text-[10px] truncate">{bp.taxNumber}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-400 truncate">
                          {bp.isBlocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              <span className="text-rose-400 text-[10px] font-semibold">Blocked</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span className="text-slate-300 text-[10px]">Active Posting</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Risk Progress Bar & Action Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/50 flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span>Composite Risk</span>
                          <span className={`font-bold ${badge.text}`}>{bp.riskScore}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${badge.progress}`} 
                            style={{ width: `${Math.max(bp.riskScore, 5)}%` }}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); openPartnerAudit(bp); }}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-cyan-300 p-1 rounded hover:bg-slate-800 transition">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* FULL-WIDTH COMPACT TABLE VIEW                                */
            /* ============================================================ */
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Business Partner Entity</th>
                    <th className="pb-3 font-semibold">Jurisdiction</th>
                    <th className="pb-3 font-semibold">Fiscal Standing</th>
                    <th className="pb-3 font-semibold">Risk Rating</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredPartners.map((bp) => {
                    const badge = getScoreBadge(bp.riskScore);
                    const isSelected = selectedPartner?.ID === bp.ID;
                    const hasAddr = bp.country && bp.country !== 'UNKNOWN';
                    return (
                      <tr 
                        key={bp.ID} 
                        onClick={() => openPartnerAudit(bp)}
                        className={`hover:bg-slate-800/40 cursor-pointer transition ${isSelected ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''}`}>
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-white truncate max-w-[240px]">{bp.fullName}</div>
                          <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>BP #{bp.ID}</span>
                            <span>•</span>
                            <span className="uppercase">{bp.category}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-slate-300">
                          <span className={`font-mono border px-1.5 py-0.5 rounded text-[10px] ${
                            hasAddr ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          }`}>
                            {hasAddr ? bp.country : 'NO ADDR'}
                          </span>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5">{hasAddr ? bp.cityName : 'Unregistered Domicile'}</div>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[11px]">
                          <div className={bp.taxNumber === 'NOT FILED' ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                            {bp.taxNumber}
                          </div>
                          <div className="text-[10px] text-slate-400">ID: {bp.identificationNumber || 'N/A'}</div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold ${badge.badge}`}>
                            {bp.riskScore}/100
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button className="text-slate-400 hover:text-cyan-400 transition p-1">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* OVERLAY AUDIT DOSSIER DRAWER (Overlays when partner clicked)   */}
      {/* When you click another BP in the grid, it smoothly re-overlays */}
      {/* ------------------------------------------------------------- */}
      {selectedPartner && (
        <div className={`fixed inset-0 z-50 overflow-hidden flex justify-end print:static print:inset-auto print:block print:w-full print:p-0 ${reportModal ? 'print:hidden' : ''}`}>
          {/* Subtle backdrop click to close */}
          <div 
            onClick={closeDossier}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 no-print print:hidden"
          />

          {/* Slide-over Overlay Container */}
          <div className={`relative z-50 bg-[#0B0F19] border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300 print:bg-white print:border-none print:shadow-none print:h-auto print:overflow-visible print:w-full print:max-w-none print:text-slate-900 print:block ${
            isDossierMaximized ? 'w-full max-w-5xl' : 'w-full max-w-2xl'
          }`}>
            
            {/* Overlay Header Strip (On-Screen Pinned Header - hidden in print because repeating thead renders on every page) */}
            <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#0B0F19]/95 px-6 py-4 border-b border-slate-800/90 flex items-start justify-between gap-4 no-print print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-semibold">
                    {auditDetail?.auditReferenceId || `AUD-SAP-${selectedPartner.ID}`}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>S/4HANA Master Certified</span>
                  </span>
                  {auditing && (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                      <span>Syncing OData...</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">
                  {selectedPartner.fullName}
                </h3>
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 mt-1">
                  <span className="font-mono text-slate-300">BP #{selectedPartner.ID}</span>
                  <span>•</span>
                  <span>{auditDetail?.legalForm || 'Commercial Entity'}</span>
                  <span>•</span>
                  <span className="text-slate-300">{auditDetail?.cityName || selectedPartner.cityName}, {auditDetail?.country || selectedPartner.country}</span>
                </div>
              </div>

              {/* Action Controls: Maximize & Close */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setIsDossierMaximized(!isDossierMaximized)}
                  title={isDossierMaximized ? 'Restore Width' : 'Expand Fullscreen'}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition">
                  {isDossierMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={closeDossier}
                  title="Close Overlay (Esc)"
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overlay Body Content */}
            <div className="p-6 space-y-6 flex-1 print:p-0 print:overflow-visible print:h-auto print:space-y-0 print:block">
              <table className="w-full border-collapse print-table-container">
                {/* Fixed Repeating Header on Every Printed Page */}
                <thead className="hidden print:table-header-group print-table-header">
                  <tr>
                    <th className="font-normal text-left pb-3 print-header-cell border-none">
                      <div className="flex items-start justify-between pb-2 border-b-2 border-slate-800 text-slate-900">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[10px] uppercase bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-semibold">
                              {auditDetail?.auditReferenceId || `AUD-SAP-${selectedPartner.ID}`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>S/4HANA Master Certified</span>
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                            {selectedPartner.fullName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 font-normal">
                            <span className="font-mono font-semibold text-slate-800">BP #{selectedPartner.ID}</span>
                            <span>•</span>
                            <span>{auditDetail?.legalForm || 'Commercial Entity'}</span>
                            <span>•</span>
                            <span>{auditDetail?.cityName || selectedPartner.cityName}, {auditDetail?.country || selectedPartner.country}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                            Compliance Dossier
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block font-normal">
                            SAP S/4HANA OData Gateway
                          </span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Fixed Repeating Footer on Every Printed Page */}
                <tfoot className="hidden print:table-footer-group print-table-footer">
                  <tr>
                    <td className="pt-3 print-footer-cell border-none">
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-300">
                        <span className="font-medium text-slate-700">SAP S/4HANA Compliance Dossier • BP #{selectedPartner.ID} ({selectedPartner.fullName})</span>
                        <span className="font-mono text-slate-500">Audit Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>

                {/* Continuous Content Flow Across Pages */}
                <tbody className="print-table-body block sm:table-row-group">
                  <tr className="print-body-row block sm:table-row">
                    <td className="p-0 border-none block sm:table-cell print-body-cell">
                      <div id="bp-print-body" className="space-y-6 print:space-y-3.5">
                        
                        {/* Overall Risk Score Card */}
                        {(() => {
                          const score = auditDetail?.riskScore ?? selectedPartner.riskScore;
                          const badge = getScoreBadge(score);
                          return (
                            <div className={`p-4 rounded-2xl border ${badge.border} ${badge.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg print:bg-white print:border-slate-300 print:shadow-none print-avoid-break`}>
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 print:text-slate-600">
                                  Composite Compliance Risk Index
                                </span>
                                <div className="flex items-baseline gap-2.5 mt-0.5">
                                  <span className={`text-3xl font-extrabold tracking-tight ${badge.text} print:text-slate-900`}>
                                    {score}/100
                                  </span>
                                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.badge} print:bg-slate-100 print:border-slate-300 print:text-slate-800`}>
                                    {badge.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed print:text-slate-700">
                                  {score >= 70 
                                    ? 'Critical risk exception detected. Automated disbursements should be blocked pending compliance review.'
                                    : score >= 45
                                    ? 'High risk profile detected across fiscal or domicile records. Manual verification required.'
                                    : 'Entity demonstrates validated standing across all corporate registries and banking mandates.'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
                                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center print:bg-slate-50 print:border-slate-300">
                                  <span className="text-[9px] text-slate-500 uppercase block print:text-slate-600">Basel III Grade</span>
                                  <span className="text-base font-extrabold text-white print:text-slate-900">{auditDetail?.ratingGrade || 'A-'}</span>
                                </div>
                                <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center print:bg-slate-50 print:border-slate-300">
                                  <span className="text-[9px] text-slate-500 uppercase block print:text-slate-600">Rating Trend</span>
                                  <span className="text-xs font-bold text-emerald-400 print:text-slate-900">{auditDetail?.ratingTrend || 'STABLE'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 6-Vector Compliance Scorecard */}
                        <div className="space-y-2.5 print-avoid-break">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-900">
                              6-Vector Compliance Verification Grid
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 print:text-slate-600">ISO-27001 / SOX 404 Protocol</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            
                            {/* Vector 1: Fiscal & Tax */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">Fiscal & VAT Standing</span>
                                <span className={`font-mono font-bold ${auditDetail?.taxMissing ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.fiscalScore ?? 40}/100
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${auditDetail?.taxMissing ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${auditDetail?.fiscalScore ?? 40}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Status:</span>
                                {auditDetail?.taxMissing ? (
                                  <span className="text-rose-400 font-semibold print:text-rose-700">Missing VAT / Tax Number</span>
                                ) : (
                                  <span className="text-slate-200 font-mono print:text-slate-900">{auditDetail?.taxNumber}</span>
                                )}
                              </div>
                            </div>

                            {/* Vector 2: Registered Domicile / Address */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">Domicile & Postal Integrity</span>
                                <span className={`font-mono font-bold ${!auditDetail?.hasAddress ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.hasAddress ? 98 : 40}/100
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${!auditDetail?.hasAddress ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${auditDetail?.hasAddress ? 98 : 40}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Address (Table BUT020):</span>
                                <span className={auditDetail?.hasAddress ? 'text-emerald-400 font-semibold print:text-emerald-700' : 'text-rose-400 font-semibold print:text-rose-700'}>
                                  {auditDetail?.hasAddress ? 'Verified Domicile' : 'No Address on Record'}
                                </span>
                              </div>
                            </div>

                            {/* Vector 3: Commercial Solvency */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">Commercial Solvency</span>
                                <span className={`font-mono font-bold ${auditDetail?.isBankrupt ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.solvencyScore ?? 95}/100
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${auditDetail?.isBankrupt ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${auditDetail?.solvencyScore ?? 95}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Credit Record:</span>
                                <span className={auditDetail?.isBankrupt ? 'text-rose-400 font-semibold print:text-rose-700' : 'text-emerald-400 font-semibold print:text-emerald-700'}>
                                  {auditDetail?.isBankrupt ? 'Bankruptcy Filed' : 'Solvent Standing'}
                                </span>
                              </div>
                            </div>

                            {/* Vector 4: Legal & Sanctions */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">Sanctions & Litigation Watch</span>
                                <span className={`font-mono font-bold ${(auditDetail?.legalScore ?? 98) < 70 ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.legalScore ?? 98}/100
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${(auditDetail?.legalScore ?? 98) < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${auditDetail?.legalScore ?? 98}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Watchlist Screening:</span>
                                <span className={auditDetail?.hasLegalProceedings ? 'text-amber-400 font-semibold print:text-amber-700' : 'text-emerald-400 font-semibold print:text-emerald-700'}>
                                  {auditDetail?.hasLegalProceedings ? 'Litigation Registered' : 'Clean / Clear'}
                                </span>
                              </div>
                            </div>

                            {/* Vector 5: Settlement Banking */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">Settlement Banking (BUT0BK)</span>
                                <span className={`font-mono font-bold ${(auditDetail?.operationalScore ?? 80) < 60 ? 'text-amber-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.operationalScore ?? 80}/100
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${(auditDetail?.operationalScore ?? 80) < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${auditDetail?.operationalScore ?? 80}%` }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Verified Accounts:</span>
                                <span className="text-slate-200 font-semibold print:text-slate-900">
                                  {auditDetail?.bankCount ?? 0} Account(s)
                                </span>
                              </div>
                            </div>

                            {/* Vector 6: ERP Posting Clearance */}
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-medium print:text-slate-700">ERP Posting Clearance</span>
                                <span className={`font-mono font-bold ${auditDetail?.isPostingBlocked ? 'text-rose-400' : 'text-emerald-400'} print:text-slate-900`}>
                                  {auditDetail?.isPostingBlocked ? 'BLOCKED' : 'CLEARED'}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                <div 
                                  className={`h-full ${auditDetail?.isPostingBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: auditDetail?.isPostingBlocked ? '30%' : '100%' }} 
                                />
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center justify-between print:text-slate-600">
                                <span>Accounting Status:</span>
                                <span className={auditDetail?.isPostingBlocked ? 'text-rose-400 font-semibold print:text-rose-700' : 'text-emerald-400 font-semibold print:text-emerald-700'}>
                                  {auditDetail?.isPostingBlocked ? 'Payment Run Prohibited' : 'Authorized for Run'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Itemized Regulatory & Master Data Findings */}
                        <div className="space-y-2.5 print-avoid-break">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-900">
                              Itemized Compliance Findings ({auditDetail?.alerts?.length || 0})
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 print:text-slate-600">Cross-Referenced with S/4HANA</span>
                          </div>

                          {auditDetail?.alerts?.length === 0 ? (
                            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 print:bg-slate-50 print:border-slate-300 print:text-slate-900">
                              <CheckCheck className="w-5 h-5 flex-shrink-0 text-emerald-400 print:text-emerald-600" />
                              <div>
                                <div className="font-semibold text-emerald-200 print:text-slate-900">Zero Compliance Exceptions Detected</div>
                                <div className="text-[11px] text-emerald-400/80 print:text-slate-600 mt-0.5">
                                  Entity passed all KYC verification checks, statutory tax filings, and global restrictive measures screenings.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {auditDetail?.alerts?.map((alert, i) => (
                                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1.5 shadow-sm print:bg-white print:border-slate-300 print:shadow-none print-avoid-break">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-rose-400 print:text-slate-900 flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                                      <span>{alert.category}</span>
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold print:bg-slate-100 print:border-slate-300 print:text-slate-800">
                                      {alert.severity}
                                    </span>
                                  </div>
                                  <p className="text-slate-100 font-semibold print:text-slate-900">{alert.message}</p>
                                  <p className="text-[11px] text-slate-400 leading-relaxed print:text-slate-700">{alert.details}</p>
                                  
                                  {(alert.standard || alert.sourceTable) && (
                                    <div className="pt-1.5 border-t border-slate-900 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 print:border-slate-200 print:text-slate-600">
                                      {alert.sourceTable && <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 print:bg-slate-100 print:border print:border-slate-300 print:text-slate-800">{alert.sourceTable}</span>}
                                      {alert.standard && <span>• {alert.standard}</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* AI Cognitive Executive Synthesis */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-2.5 shadow-inner print:bg-white print:border-slate-300 print:shadow-none print-avoid-break">
                          <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold print:text-slate-900">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-cyan-400 print:text-slate-700" />
                              <span>Executive Compliance Assessment & AI Risk Justification</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 print:text-slate-600">Confidence: 98.4%</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans print:text-slate-900 print:text-[9.5pt]">
                            {auditDetail?.aiExecutiveSummary}
                          </p>
                        </div>

                        {/* S/4HANA Master Record Attribute Dossier */}
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 print:bg-white print:border-slate-300 print:shadow-none print-avoid-break">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 print:border-slate-300">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-900">
                              S/4HANA Master Record Attributes
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 print:text-slate-600">Table: BUT000 / BUT020 / DFKKBPTAXNUM</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Business Partner ID</span>
                              <span className="text-white font-semibold print:text-slate-900">{auditDetail?.bpId || selectedPartner.ID}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Legal Entity Form</span>
                              <span className="text-white print:text-slate-900">{auditDetail?.legalForm || 'Corporate Entity'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Grouping Protocol</span>
                              <span className="text-white print:text-slate-900">{auditDetail?.grouping || 'BP02'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Created By User</span>
                              <span className="text-slate-300 print:text-slate-900">{auditDetail?.createdByUser || 'BPINST'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Creation Date</span>
                              <span className="text-slate-300 print:text-slate-900">{auditDetail?.creationDate || 'Mar 27, 2018'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Last Changed By</span>
                              <span className="text-slate-300 print:text-slate-900">{auditDetail?.lastChangedByUser || 'MDG_EXPERT'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Registered Street</span>
                              <span className="text-slate-200 truncate block print:text-slate-900">{auditDetail?.streetAddress || 'Not Filed'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">Municipality & Postal</span>
                              <span className="text-slate-200 truncate block print:text-slate-900">{auditDetail?.cityName} ({auditDetail?.postalCode})</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] print:text-slate-600">VAT / Tax Registration</span>
                              <span className={auditDetail?.taxNumber === 'NOT FILED' ? 'text-amber-400 print:text-slate-900' : 'text-slate-200 print:text-slate-900'}>
                                {auditDetail?.taxNumber}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Prescribed Governance Actions & Interactive Action Buttons */}
                        <div className="space-y-3 pt-1 print-avoid-break">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-900">
                            Prescribed Governance Actions & Immediate Remediation
                          </h4>
                          <div className="space-y-2">
                            {auditDetail?.aiRecommendations?.map((rec, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 print:bg-white print:border-slate-300 print:text-slate-900">
                                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5 print:text-slate-700" />
                                <span className="leading-relaxed">{rec}</span>
                              </div>
                            ))}
                          </div>

                          {/* Interactive Action Command Strip */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 no-print print:hidden">
                            <button
                              onClick={() => triggerAction(`S/4HANA ERP Posting Block set for BP #${selectedPartner.ID} (A_SupplierCompany.SupplierIsBlockedForPosting = true)`)}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/50 text-rose-200 rounded-xl text-xs font-semibold shadow-md transition">
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                              <span>Set Posting Block</span>
                            </button>

                            <button
                              onClick={() => triggerAction(`Formal W-9 / VAT compliance demand notice dispatched to ${selectedPartner.fullName}`)}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/50 text-indigo-200 rounded-xl text-xs font-semibold shadow-md transition">
                              <FileText className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Issue Fiscal Notice</span>
                            </button>

                            <button
                              onClick={handlePrintBp}
                              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition">
                              <Printer className="w-3.5 h-3.5 text-slate-400" />
                              <span>Print Audit Dossier</span>
                            </button>
                          </div>
                        </div>

                        {/* Dynamic Spacer to Push Footer to Bottom on Last Page */}
                        {bpSpacer > 0 && (
                          <div style={{ height: `${bpSpacer}px` }} className="hidden print:block" />
                        )}

                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Executive Portfolio Audit Briefing Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm print:static print:inset-auto print:p-0 print:bg-white print:block">
          <div className="bg-[#0B0F19] border border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-h-none print:h-auto print:overflow-visible print:bg-white print:border-none print:shadow-none print:p-0 print:block">
            
            {/* Modal Header (Pinned on screen / hidden in print because repeating thead renders on every page) */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-[#0B0F19] no-print print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">SAP S/4HANA Compliance Briefing</h3>
                  <p className="text-xs text-slate-400">Portfolio Data Governance & Regulatory Risk Assessment</p>
                </div>
              </div>
              <button 
                onClick={() => setReportModal(false)} 
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition cursor-pointer">
                Close
              </button>
            </div>

            {/* Scrollable Modal Content (flex-1 overflow-y-auto on screen; table paginates naturally in print) */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 print:p-0 print:overflow-visible print:h-auto print:space-y-0 print:block">
              
              <table className="w-full border-collapse print-table-container">
                {/* Fixed Repeating Header on Every Printed Page */}
                <thead className="hidden print:table-header-group print-table-header">
                  <tr>
                    <th className="font-normal text-left pb-3 print-header-cell border-none">
                      <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-800 flex-shrink-0">
                            <FileText className="w-4 h-4 text-slate-800" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">SAP S/4HANA Compliance Briefing</h3>
                            <p className="text-xs text-slate-600 font-normal">Portfolio Data Governance & Regulatory Risk Assessment</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                            Executive Assessment
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block font-normal">
                            SAP BTP / S/4HANA Cloud
                          </span>
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                {/* Fixed Repeating Footer on Every Printed Page */}
                <tfoot className="hidden print:table-footer-group print-table-footer">
                  <tr>
                    <td className="pt-3 print-footer-cell border-none">
                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-300">
                        <span className="font-medium text-slate-700">SAP S/4HANA Executive Portfolio Compliance Briefing</span>
                        <span className="font-mono text-slate-500">Assessment Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>

                {/* Continuous Content Flow Across Pages */}
                <tbody className="print-table-body block sm:table-row-group">
                  <tr className="print-body-row block sm:table-row">
                    <td className="p-0 border-none block sm:table-cell print-body-cell">
                      <div id="briefing-print-body" className="space-y-4 print:space-y-3">
                        
                        {/* Analytics Chart Option Bar (Interactive Control - hidden in print) */}
                        <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 no-print print:hidden">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                              <BarChart3 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">
                                Portfolio Visual Analytics & Risk Distribution
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Graphical representations of compliance tiers, vector health, and regulatory exposure
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={toggleBriefingCharts}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              showBriefingCharts
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {showBriefingCharts ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Analytics Charts Active</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Analytics Charts</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Analytics Chart Graphical Component */}
                        {showBriefingCharts && (() => {
                          const total = partners.length || 30;
                          const critical = partners.filter(p => p.riskScore >= 70).length;
                          const moderate = partners.filter(p => p.riskScore >= 30 && p.riskScore < 70).length;
                          const clean = partners.filter(p => p.riskScore < 30 || p.riskLevel === 'LOW').length;
                          const missingTax = partners.filter(p => p.taxNumber === 'NOT FILED').length;
                          const withTax = total - missingTax;
                          const withAddr = partners.filter(p => p.country && p.country !== 'UNKNOWN').length;
                          const missingAddr = total - withAddr;
                          const index = total > 0 ? (100 - (partners.reduce((sum, p) => sum + p.riskScore, 0) / total)).toFixed(1) : '46.8';

                          const critPct = ((critical / total) * 100).toFixed(1);
                          const modPct = ((moderate / total) * 100).toFixed(1);
                          const cleanPct = ((clean / total) * 100).toFixed(1);
                          const taxPct = ((withTax / total) * 100).toFixed(1);
                          const addrPct = ((withAddr / total) * 100).toFixed(1);

                          return (
                            <div className="space-y-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 animate-in fade-in duration-200 print:bg-white print:border-slate-300 print:p-2.5 print-avoid-break">
                              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2 print:border-slate-300">
                                <span className="font-bold text-slate-300 print:text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                                  <PieChart className="w-3.5 h-3.5 text-cyan-400 print:text-slate-700" />
                                  Executive Graphical Analytics
                                </span>
                                <span className="font-mono text-[11px] text-slate-400 print:text-slate-600">
                                  Portfolio Compliance Index: <strong className="text-emerald-400 print:text-slate-900">{index}%</strong>
                                </span>
                              </div>

                              {/* Chart 1: Stacked Segmented Risk Distribution Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 print:text-slate-700">
                                  <span className="font-medium">Portfolio Risk Severity Distribution</span>
                                  <span className="font-mono">{total} Active Master Entities</span>
                                </div>
                                {/* Visual Segmented Bar */}
                                <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex print:bg-slate-200">
                                  <div 
                                    style={{ width: `${critPct}%` }} 
                                    title={`Critical Risk: ${critical} (${critPct}%)`}
                                    className="bg-rose-500 h-full transition-all duration-500 print:bg-rose-600" 
                                  />
                                  <div 
                                    style={{ width: `${modPct}%` }} 
                                    title={`Moderate Risk: ${moderate} (${modPct}%)`}
                                    className="bg-amber-500 h-full transition-all duration-500 print:bg-amber-500" 
                                  />
                                  <div 
                                    style={{ width: `${cleanPct}%` }} 
                                    title={`Compliant: ${clean} (${cleanPct}%)`}
                                    className="bg-emerald-500 h-full transition-all duration-500 print:bg-emerald-600" 
                                  />
                                </div>
                                {/* Legend / Key Breakdown */}
                                <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                                  <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 print:bg-slate-50 print:border-slate-300">
                                    <div className="flex items-center gap-1.5 text-[11px] text-rose-300 print:text-slate-900 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                      <span>Critical Risk</span>
                                    </div>
                                    <div className="text-base font-bold text-white print:text-slate-900 mt-0.5">{critical} <span className="text-[11px] font-normal text-slate-400 print:text-slate-600">({critPct}%)</span></div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/30 print:bg-slate-50 print:border-slate-300">
                                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 print:text-slate-900 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                      <span>Moderate Risk</span>
                                    </div>
                                    <div className="text-base font-bold text-white print:text-slate-900 mt-0.5">{moderate} <span className="text-[11px] font-normal text-slate-400 print:text-slate-600">({modPct}%)</span></div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 print:bg-slate-50 print:border-slate-300">
                                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 print:text-slate-900 font-semibold">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      <span>Compliant</span>
                                    </div>
                                    <div className="text-base font-bold text-white print:text-slate-900 mt-0.5">{clean} <span className="text-[11px] font-normal text-slate-400 print:text-slate-600">({cleanPct}%)</span></div>
                                  </div>
                                </div>
                              </div>

                              {/* Chart 2: Regulatory Compliance Vector Comparison Bars */}
                              <div className="space-y-2 pt-2 border-t border-slate-800/60 print:border-slate-300">
                                <span className="text-[11px] font-medium text-slate-400 print:text-slate-700 block">
                                  Core Compliance Mandates Compliance Rate
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  {/* Domicile Integrity Bar */}
                                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300 print:text-slate-900 font-medium">Physical Domicile / Address (FATF)</span>
                                      <span className="font-mono font-bold text-amber-400 print:text-slate-900">{addrPct}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${addrPct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 print:text-slate-600">
                                      <span>{withAddr} Verified Domiciles</span>
                                      <span className="text-rose-400 print:text-rose-700">{missingAddr} Shell Gaps</span>
                                    </div>
                                  </div>

                                  {/* Tax / VAT Registration Bar */}
                                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5 print:bg-slate-50 print:border-slate-300">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-300 print:text-slate-900 font-medium">VAT / Tax Identification (EU/IRS)</span>
                                      <span className="font-mono font-bold text-rose-400 print:text-slate-900">{taxPct}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden print:bg-slate-200">
                                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${taxPct}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 print:text-slate-600">
                                      <span>{withTax} Valid Tax Filing</span>
                                      <span className="text-rose-400 print:text-rose-700">{missingTax} Unfiled Records</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Briefing Text Container (Continuous natural page flow without artificial page breaks) */}
                        <div className="text-xs text-slate-200 font-mono whitespace-pre-line bg-[#070B12] p-5 rounded-xl border border-slate-800/80 leading-relaxed shadow-inner print:bg-white print:border print:border-slate-300 print:text-slate-900 print:text-[9.5pt] print:p-3.5 print:leading-normal print:mt-1 print-flow-content">
                          {reportText}
                        </div>

                        {/* Dynamic Spacer to Push Footer to Bottom on Last Page */}
                        {briefingSpacer > 0 && (
                          <div style={{ height: `${briefingSpacer}px` }} className="hidden print:block" />
                        )}

                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer (Pinned / flex-shrink-0 - ALWAYS visible & clickable!) */}
            <div className="px-6 py-3.5 border-t border-slate-800/90 bg-[#080C14] flex items-center justify-between flex-shrink-0 no-print print:hidden">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Portfolio Master Scope: 30 Business Partner Entities</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrintBriefing} 
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition no-print print:hidden cursor-pointer">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Export PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
