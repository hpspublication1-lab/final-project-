'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Download,
  Flame,
  ArrowRight,
  TrendingUp,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { LeadRecord, LeadEvent, EmailLogItem, EmailQueueItem } from '@/lib/crm/types';
import { getLeadScoreBadge, getLeadScoreTier } from '@/lib/crm/scoring';
import { getSegmentMetadata } from '@/lib/crm/segments';

export default function AdminLeadsClient() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [emailQueue, setEmailQueue] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setEvents(data.events || []);
        setEmailLogs(data.emailLogs || []);
        setEmailQueue(data.emailQueue || []);
      }
    } catch (err) {
      console.error('Error fetching admin CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        lead.first_name.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        (lead.phone && lead.phone.includes(query)) ||
        (lead.utm_campaign && lead.utm_campaign.toLowerCase().includes(query)) ||
        (lead.utm_source && lead.utm_source.toLowerCase().includes(query));

      const matchesSegment = selectedSegment === 'ALL' || lead.segment === selectedSegment;
      const leadTier = getLeadScoreTier(lead.score);
      const matchesTier = selectedTier === 'ALL' || leadTier === selectedTier;

      return matchesSearch && matchesSegment && matchesTier;
    });
  }, [leads, searchQuery, selectedSegment, selectedTier]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = leads.length;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 3600 * 1000);

    const newToday = leads.filter((l) => new Date(l.created_at) >= twentyFourHoursAgo).length;
    const buyers = leads.filter((l) => l.status === 'customer' || l.segment === 'PURCHASED').length;
    const hotLeads = leads.filter((l) => l.score >= 40 && l.score < 70).length;
    const highIntent = leads.filter((l) => l.score >= 70).length;
    const checkoutDropoffs = leads.filter((l) => l.segment === 'PAYMENT_ABANDONED').length;
    const totalRevenue = leads.reduce((acc, l) => acc + (l.total_revenue || 0), 0);
    const revenuePerLead = total > 0 ? (totalRevenue / total).toFixed(0) : '0';
    const conversionRate = total > 0 ? ((buyers / total) * 100).toFixed(1) : '0';

    return {
      total,
      newToday,
      buyers,
      hotLeads,
      highIntent,
      checkoutDropoffs,
      totalRevenue,
      revenuePerLead,
      conversionRate,
    };
  }, [leads]);

  // Lead Timeline for Drawer
  const leadEvents = useMemo(() => {
    if (!selectedLead) return [];
    return events.filter((e) => e.lead_id === selectedLead.id);
  }, [selectedLead, events]);

  // CSV Export
  const exportCsv = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['First Name', 'Email', 'Phone', 'Academic Level', 'Score', 'Segment', 'Status', 'Source', 'Campaign', 'Created At'];
    const rows = filteredLeads.map((l) => [
      `"${l.first_name}"`,
      `"${l.email}"`,
      `"${l.phone || ''}"`,
      `"${l.academic_level || ''}"`,
      l.score,
      l.segment,
      l.status,
      `"${l.utm_source || ''}"`,
      `"${l.utm_campaign || ''}"`,
      l.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `samyak_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-primary transition-colors">
              Admin
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">Leads &amp; Behavioral CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Users className="text-primary" /> Lead Intelligence &amp; Nurture Engine
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={exportCsv}
            className="btn-primary px-4 py-2 text-xs font-black flex items-center gap-2"
          >
            <FileSpreadsheet size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Total Leads</div>
          <div className="text-2xl font-black text-foreground">{stats.total}</div>
          <div className="text-[11px] text-emerald-500 font-semibold">+{stats.newToday} in last 24h</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">🔥 High Intent (70+)</div>
          <div className="text-2xl font-black text-amber-500">{stats.highIntent}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Ready for checkout</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">⚡ Hot Leads (40-69)</div>
          <div className="text-2xl font-black text-rose-500">{stats.hotLeads}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Engaged prospects</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">⚠️ Abandoned Checkout</div>
          <div className="text-2xl font-black text-rose-400">{stats.checkoutDropoffs}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Recovery flow active</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">🎓 Enrolled Buyers</div>
          <div className="text-2xl font-black text-emerald-500">{stats.buyers}</div>
          <div className="text-[11px] text-emerald-500 font-semibold">{stats.conversionRate}% Conversion</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase">Revenue / Lead</div>
          <div className="text-2xl font-black text-primary">Rs. {stats.revenuePerLead}</div>
          <div className="text-[11px] text-muted-foreground font-medium">Total: Rs. {stats.totalRevenue}</div>
        </div>
      </div>

      {/* Visual Interactive Funnel Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
          <TrendingUp size={15} className="text-primary" /> Full-Funnel Conversion Path
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">1. VISITORS</span>
            <strong className="text-base text-foreground font-black">100%</strong>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">2. LEAD MAGNET</span>
            <strong className="text-base text-indigo-400 font-black">500 MCQs</strong>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">3. EMAIL CAPTURED</span>
            <strong className="text-base text-teal-400 font-black">{stats.total} Leads</strong>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">4. COURSE VISITED</span>
            <strong className="text-base text-blue-400 font-black">
              {leads.filter((l) => l.segment === 'CEE_COURSE_INTEREST' || l.score >= 20).length}
            </strong>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">5. HIGH INTENT</span>
            <strong className="text-base text-amber-400 font-black">{stats.highIntent}</strong>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
            <span className="text-[10px] text-muted-foreground block font-bold">6. CHECKOUT</span>
            <strong className="text-base text-rose-400 font-black">
              {leads.filter((l) => l.score >= 25).length}
            </strong>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block font-bold">7. BUYER</span>
            <strong className="text-base text-emerald-400 font-black">{stats.buyers}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, UTM..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="ALL">All Segments ({leads.length})</option>
            <option value="HIGH_INTENT">🔥 High Intent</option>
            <option value="PAYMENT_ABANDONED">⚠️ Abandoned Checkout</option>
            <option value="CEE_COURSE_INTEREST">🩺 CEE Course Interest</option>
            <option value="BIOLOGY_INTEREST">🧬 Biology Interest</option>
            <option value="PURCHASED">🎓 Enrolled Buyers</option>
            <option value="ACTIVE_LEAD">⚡ Active Leads</option>
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="ALL">All Score Tiers</option>
            <option value="High Intent">🔥 High Intent (70+)</option>
            <option value="Hot">⚡ Hot (40-69)</option>
            <option value="Warm">🌱 Warm (20-39)</option>
            <option value="Cold">❄️ Cold (0-19)</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Lead Profile</th>
                <th className="px-4 py-3">Score &amp; Tier</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Attribution &amp; Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No leads found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const scoreBadge = getLeadScoreBadge(lead.score);
                  const segmentMeta = getSegmentMetadata(lead.segment);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-foreground">{lead.first_name}</div>
                        <div className="text-muted-foreground text-[11px]">{lead.email}</div>
                        {lead.phone && <div className="text-muted-foreground text-[10px]">{lead.phone}</div>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black border ${scoreBadge.bg} ${scoreBadge.color} ${scoreBadge.border}`}
                        >
                          {scoreBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${segmentMeta.bg} ${segmentMeta.color} ${segmentMeta.border}`}
                        >
                          {segmentMeta.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 space-y-0.5">
                        <div className="text-foreground font-semibold">
                          {lead.utm_source ? `${lead.utm_source} / ${lead.utm_medium || 'direct'}` : 'Direct Website'}
                        </div>
                        {lead.utm_campaign && (
                          <div className="text-muted-foreground text-[10px]">Campaign: {lead.utm_campaign}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            lead.status === 'customer'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : lead.status === 'unsubscribed'
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-primary/15 text-primary'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-muted-foreground text-[11px]">
                        {new Date(lead.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <div className="text-[10px]">
                          {new Date(lead.last_active_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] font-bold text-foreground hover:text-primary transition-colors"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Lead Inspector Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl h-full bg-card border-l border-border p-6 overflow-y-auto space-y-6 animate-slide-in-right">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                  Lead Profile &amp; Timeline
                </span>
                <h2 className="text-xl font-black text-foreground">{selectedLead.first_name}</h2>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lead Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Email</span>
                <strong className="text-foreground">{selectedLead.email}</strong>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Phone</span>
                <strong className="text-foreground">{selectedLead.phone || 'Not provided'}</strong>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Academic Level</span>
                <strong className="text-foreground">{selectedLead.academic_level || 'General'}</strong>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <span className="text-[10px] text-muted-foreground block">Lead Score</span>
                <strong className="text-amber-500 font-black">🔥 {selectedLead.score} Points</strong>
              </div>
            </div>

            {/* Marketing Attribution */}
            <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 space-y-2 text-xs">
              <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Marketing Attribution
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground text-[10px]">Source:</span>
                  <div className="font-bold text-foreground">{selectedLead.utm_source || 'Direct'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Medium:</span>
                  <div className="font-bold text-foreground">{selectedLead.utm_medium || 'None'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Campaign:</span>
                  <div className="font-bold text-foreground">{selectedLead.utm_campaign || 'None'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px]">Landing Page:</span>
                  <div className="font-bold text-foreground truncate">{selectedLead.landing_page || '/'}</div>
                </div>
              </div>
            </div>

            {/* Chronological Activity Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-primary" /> Activity Timeline
              </div>

              <div className="space-y-2 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
                {leadEvents.length === 0 ? (
                  <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground ml-7">
                    Captured lead via 500 CEE Biology MCQs Power Pack form.
                  </div>
                ) : (
                  leadEvents.map((ev) => (
                    <div key={ev.id} className="relative flex items-start gap-3 pl-7">
                      <div className="absolute left-2.5 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                      <div className="flex-1 bg-muted/40 border border-border/50 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <strong className="text-foreground uppercase text-[10px] font-black tracking-wider">
                            {ev.event_type.replace(/_/g, ' ')}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {ev.url && <div className="text-muted-foreground text-[10px] mt-0.5">URL: {ev.url}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-border flex items-center gap-3">
              <a
                href={`mailto:${selectedLead.email}`}
                className="btn-primary flex-1 justify-center py-2.5 text-xs font-bold"
              >
                <Mail size={14} /> Send Email
              </a>
              {selectedLead.phone && (
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Smartphone size={14} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
