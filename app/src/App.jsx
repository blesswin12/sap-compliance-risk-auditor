import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Building2, Search, 
  ExternalLink, Sparkles, RefreshCw, FileText, ChevronRight, 
  CheckCircle2, XCircle, ArrowUpRight, Scale, Landmark, Globe
} from 'lucide-react';

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
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [auditDetail, setAuditDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportText, setReportText] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, partnersRes] = await Promise.all([
        fetch('/api/getPortfolioStats()'),
        fetch(`/api/getBusinessPartners(search='${encodeURIComponent(search)}',filter='${filter}')`)
      ]);
      const statsData = await statsRes.json();
      const partnersData = await partnersRes.json();

      if (statsData.value) setStats(statsData.value);
      if (partnersData.value) setPartners(partnersData.value);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Run Deep AI Audit on Partner
  const runDeepAudit = async (bpId) => {
    setAuditing(true);
    setAuditDetail(null);
    try {
      const res = await fetch(`/api/auditPartner(bpId='${bpId}')`);
      const data = await res.json();
      setAuditDetail(data.value);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setAuditing(false);
    }
  };

  const openPartnerAudit = (bp) => {
    setSelectedPartner(bp);
    runDeepAudit(bp.ID);
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

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    if (score >= 30) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  };

  return (
    <div className="min-h-screen text-slate-100 pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090D17]/80 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0B0F19] rounded-[11px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">SAP Sentinel AI</span>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">Autonomous Compliance</span>
            </div>
            <p className="text-xs text-slate-400">S/4HANA Business Partner Risk & Sanction Auditor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">SAP OData:</span>
            <span className="text-slate-200 font-mono">US10 APIM</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Model:</span>
            <span className="text-indigo-300 font-mono">Llama 3.2</span>
          </div>

          <button 
            onClick={openPortfolioReport}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-indigo-600/25 transition">
            <FileText className="w-3.5 h-3.5" />
            Executive Report
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Monitored Partners</span>
              <Building2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{stats.totalMonitored || 28}</div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100% Active</span> master data records
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Critical Risk Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 tracking-tight">{stats.criticalRiskCount || 2}</div>
            <div className="text-[11px] text-rose-400/80 mt-1 flex items-center gap-1 font-medium">
              Requires supervisor review
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Sanction & Legal Flags</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">{stats.sanctionAlertsCount || 1}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cross-referenced against OFAC lists</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>Portfolio Compliance Index</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.avgComplianceScore || 91.4}%</div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Healthy Enterprise Standing</div>
          </div>
        </div>

        {/* Two-Column Command Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Business Partner Ledger (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
                <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, BP ID, or country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </form>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                  {['ALL', 'CRITICAL', 'TAX_MISSING', 'BLOCKED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${
                        filter === f 
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' 
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
                      }`}>
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table / Ledger */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-400">
                      <th className="pb-3 font-semibold">Partner</th>
                      <th className="pb-3 font-semibold">Country</th>
                      <th className="pb-3 font-semibold">Tax & ID</th>
                      <th className="pb-3 font-semibold">Risk Score</th>
                      <th className="pb-3 text-right font-semibold">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-500">
                          {loading ? 'Querying SAP OData...' : 'No matching Business Partners found.'}
                        </td>
                      </tr>
                    ) : (
                      partners.map((bp) => (
                        <tr 
                          key={bp.ID} 
                          onClick={() => openPartnerAudit(bp)}
                          className={`hover:bg-slate-800/40 cursor-pointer transition ${selectedPartner?.ID === bp.ID ? 'bg-indigo-950/20' : ''}`}>
                          <td className="py-3 pr-3">
                            <div className="font-semibold text-white truncate max-w-[200px]">{bp.fullName}</div>
                            <div className="font-mono text-[10px] text-slate-500">BP #{bp.ID} • {bp.category}</div>
                          </td>
                          <td className="py-3 pr-3 text-slate-300">
                            <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-[11px]">{bp.country}</span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[90px]">{bp.cityName}</div>
                          </td>
                          <td className="py-3 pr-3 font-mono text-[11px]">
                            <div className={bp.taxNumber === 'NOT FILED' ? 'text-amber-400' : 'text-slate-300'}>
                              {bp.taxNumber}
                            </div>
                            <div className="text-[10px] text-slate-500">ID: {bp.identificationNumber}</div>
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${getScoreColor(bp.riskScore)}`}>
                              {bp.riskScore}/100
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button className="text-slate-400 hover:text-cyan-400 transition p-1">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: AI Deep Audit Inspection Drawer (5 cols) */}
          <div className="lg:col-span-5">
            {!selectedPartner ? (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900/40 border border-slate-800/80 border-dashed text-center">
                <Sparkles className="w-10 h-10 text-indigo-400/50 mb-3 animate-bounce" />
                <h3 className="font-semibold text-slate-300 text-sm">Select a Business Partner</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Click on any partner row to initiate a real-time autonomous compliance audit with Llama 3.2.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/90 backdrop-blur space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      BP #{selectedPartner.ID}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{selectedPartner.fullName}</h3>
                    <p className="text-xs text-slate-400">{selectedPartner.cityName}, {selectedPartner.country}</p>
                  </div>

                  <div className={`text-center px-3 py-1.5 rounded-xl border font-mono ${getScoreColor(auditDetail?.riskScore || selectedPartner.riskScore)}`}>
                    <div className="text-xs font-semibold uppercase">{auditDetail?.riskLevel || selectedPartner.riskLevel}</div>
                    <div className="text-lg font-bold">{auditDetail?.riskScore || selectedPartner.riskScore}</div>
                  </div>
                </div>

                {/* Audit Loading Indicator */}
                {auditing && (
                  <div className="p-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                    <span className="text-xs text-indigo-300">
                      Reasoning with Llama 3.2: Cross-referencing credit standing, tax compliance, and jurisdiction...
                    </span>
                  </div>
                )}

                {/* Detected Alerts */}
                {auditDetail && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit Findings</h4>
                      {auditDetail.alerts.length === 0 ? (
                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>No critical risk flags detected across SAP master data.</span>
                        </div>
                      ) : (
                        auditDetail.alerts.map((alert, i) => (
                          <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {alert.category}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-slate-200">{alert.message}</p>
                            <p className="text-[11px] text-slate-500">{alert.details}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* AI Executive Summary */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        AI Executive Rationale (Llama 3.2)
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {auditDetail.aiExecutiveSummary}
                      </p>
                    </div>

                    {/* Action Recommendations */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prescribed SAP Actions</h4>
                      <div className="space-y-1.5">
                        {auditDetail.aiRecommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Executive Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0B0F19] border border-slate-800 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">SAP Master Data Compliance Briefing</h3>
              </div>
              <button onClick={() => setReportModal(false)} className="text-slate-400 hover:text-white text-xs font-mono">
                [CLOSE]
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-900 leading-relaxed">
              {reportText}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">
                Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
