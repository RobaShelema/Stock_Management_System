import React, { useEffect, useState } from "react";
import { Settings, Save, RefreshCw, ShieldCheck, Building2, Sliders, Database, Lock } from "lucide-react";
import { useApp } from "../../context/AppContext.jsx";
import { PageHeader, Button, Field, inputCls } from "../../components/ui/PageHeader.jsx";

export default function SystemSettings() {
  const { getSystemSettings, updateSystemSettings, showToast, currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    institutionName: "",
    directorate: "",
    currency: "ETB",
    fiscalYear: "2025/2026",
    reorderAlertThresholdDays: 7,
    backupSchedule: "Daily at 00:00 UTC",
    auditRetentionDays: 365,
    sessionTimeoutMinutes: 60,
    maintenanceMode: false,
    allowDelegatedSuppliers: true,
  });

  const isAdmin = currentUser?.role === "Administrator";

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      if (data) setSettings(data);
    } catch (err) {
      showToast(err.message || "Failed to load system settings", "warn");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { ok } = await updateSystemSettings(settings);
    setSaving(false);
  }

  return (
    <div>
      <PageHeader
        title="System-Wide Configuration & Policies"
        description="Configure university institutional metadata, stock alert rules, security retention, and technical parameters."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchSettings} disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
            {isAdmin && (
              <Button onClick={handleSave} disabled={saving}>
                <Save size={15} /> {saving ? "Saving…" : "Save Configurations"}
              </Button>
            )}
          </div>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Identity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 size={18} className="text-clay-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Institutional Identity & Directorate Profile
              </h2>
              <p className="text-xs text-slate-400">
                Used in official stock reports, issue vouchers, GRNs, and system headers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="University / Institution Name">
              <input
                required
                className={inputCls}
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                placeholder="e.g. University of Technology and Science"
              />
            </Field>

            <Field label="Managing Directorate">
              <input
                required
                className={inputCls}
                value={settings.directorate}
                onChange={(e) => setSettings({ ...settings, directorate: e.target.value })}
                placeholder="e.g. ICT Directorate & Property Administration"
              />
            </Field>

            <Field label="System Base Currency">
              <input
                required
                className={inputCls}
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="ETB"
              />
            </Field>

            <Field label="Active Fiscal Year">
              <input
                required
                className={inputCls}
                value={settings.fiscalYear}
                onChange={(e) => setSettings({ ...settings, fiscalYear: e.target.value })}
                placeholder="2025/2026"
              />
            </Field>
          </div>
        </div>

        {/* Stock & Operational Controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={18} className="text-clay-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Stock Governance & Delegation Policies
              </h2>
              <p className="text-xs text-slate-400">
                Rules governing stock thresholds and procurement delegation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Reorder Alert Calculation Window (Days)">
              <input
                type="number"
                min={1}
                max={90}
                required
                className={inputCls}
                value={settings.reorderAlertThresholdDays}
                onChange={(e) =>
                  setSettings({ ...settings, reorderAlertThresholdDays: Number(e.target.value) })
                }
              />
            </Field>

            <Field label="Delegated Supplier Registration by ICT">
              <select
                className={inputCls}
                value={settings.allowDelegatedSuppliers ? "enabled" : "disabled"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    allowDelegatedSuppliers: e.target.value === "enabled",
                  })
                }
              >
                <option value="enabled">Enabled (ICT Admin can register/deactivate on behalf of Procurement)</option>
                <option value="disabled">Disabled (Strict Procurement Directorate only)</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Technical, Security & Backup Policies */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock size={18} className="text-clay-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Security, Audit Retention & Data Backups
              </h2>
              <p className="text-xs text-slate-400">
                Technical parameters for compliance, retention, and maintenance.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Automated Backup Schedule">
              <input
                required
                className={inputCls}
                value={settings.backupSchedule}
                onChange={(e) => setSettings({ ...settings, backupSchedule: e.target.value })}
                placeholder="e.g. Daily at 00:00 UTC"
              />
            </Field>

            <Field label="Audit Trail Retention (Days)">
              <input
                type="number"
                min={30}
                max={3650}
                required
                className={inputCls}
                value={settings.auditRetentionDays}
                onChange={(e) =>
                  setSettings({ ...settings, auditRetentionDays: Number(e.target.value) })
                }
              />
            </Field>

            <Field label="User Session Idle Timeout (Minutes)">
              <input
                type="number"
                min={5}
                max={480}
                required
                className={inputCls}
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })
                }
              />
            </Field>
          </div>
        </div>
      </form>
    </div>
  );
}
