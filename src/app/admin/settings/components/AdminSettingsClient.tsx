'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Sliders, RefreshCw, Loader2, Save, CheckCircle2,
  AlertTriangle, Shield, CreditCard, ToggleLeft, ToggleRight, Server
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    fonepayActive: true,
    esewaActive: true,
    manualBankTransferActive: true,
    allowFreeDiagnosticTests: true,
    allowAiVisionEvaluations: true,
    platformVersion: 'v2.4.0',
    updatedAt: '',
    updatedBy: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load settings');
      setSettings(data.settings);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      toast.success('Platform settings successfully updated and audit logged!');
      setSettings(data.settings);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Sliders size={22} className="text-primary" /> Platform Engine &amp; Global Settings
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure payment gateways, maintenance switches, and diagnostic test readiness.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-primary py-2 px-4 text-xs font-bold gap-1.5 flex items-center"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
            <button onClick={fetchSettings} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* System Status Banner */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">Samyak LMS Engine {settings.platformVersion}</p>
                  <p className="text-xs text-muted-foreground">
                    Last configuration change by: <span className="font-mono">{settings.updatedBy || 'root'}</span> on {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'system default'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success-light text-success">
                Operational
              </span>
            </div>

            {/* General & Availability Settings */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Shield size={16} className="text-primary" /> Availability &amp; Maintenance Controls
              </h2>

              <div className="divide-y divide-border">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Platform Maintenance Mode</p>
                    <p className="text-[11px] text-muted-foreground">
                      Temporarily redirects all non-admin users to a maintenance advisory screen.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('maintenanceMode')}
                    className={`text-2xl transition-colors ${settings.maintenanceMode ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">New Student Registration</p>
                    <p className="text-[11px] text-muted-foreground">
                      Allows new candidates to create accounts for SEE and CEE programs.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('registrationOpen')}
                    className={`text-2xl transition-colors ${settings.registrationOpen ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.registrationOpen ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Free Diagnostic Tests</p>
                    <p className="text-[11px] text-muted-foreground">
                      Enables open, un-gated access to initial diagnostic mock tests for all registered visitors.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('allowFreeDiagnosticTests')}
                    className={`text-2xl transition-colors ${settings.allowFreeDiagnosticTests ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.allowFreeDiagnosticTests ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">AI-Assisted Subjective Draft Evaluation</p>
                    <p className="text-[11px] text-muted-foreground">
                      Generates initial AI draft marking for SEE subjective answers prior to teacher verification.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('allowAiVisionEvaluations')}
                    className={`text-2xl transition-colors ${settings.allowAiVisionEvaluations ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.allowAiVisionEvaluations ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Gateways Configuration */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <CreditCard size={16} className="text-primary" /> Payment Gateways &amp; Merchant Integrations
              </h2>

              <div className="divide-y divide-border">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Fonepay QR Merchant Gateway</p>
                    <p className="text-[11px] text-muted-foreground">
                      Dynamic QR generation and callback verification for automated course activation.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('fonepayActive')}
                    className={`text-2xl transition-colors ${settings.fonepayActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.fonepayActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">eSewa Digital Wallet</p>
                    <p className="text-[11px] text-muted-foreground">
                      Direct eSewa redirect and payment token verification.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('esewaActive')}
                    className={`text-2xl transition-colors ${settings.esewaActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.esewaActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">Manual Bank Transfer / Voucher Upload</p>
                    <p className="text-[11px] text-muted-foreground">
                      Allows students to submit bank deposit slips for staff queue verification.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('manualBankTransferActive')}
                    className={`text-2xl transition-colors ${settings.manualBankTransferActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {settings.manualBankTransferActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
