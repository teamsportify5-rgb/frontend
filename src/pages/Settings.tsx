import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Settings as SettingsIcon, Save, Database, Bell, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { settingsService } from '@/services/settings.service'

function clampInt(value: string, fallback: number, min: number, max?: number) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  if (max != null) return Math.min(max, Math.max(min, n))
  return Math.max(min, n)
}

function clampFloat(value: string, fallback: number, min: number, max?: number) {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return fallback
  if (max != null) return Math.min(max, Math.max(min, n))
  return Math.max(min, n)
}

export default function Settings() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'Sportify Management System',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    currency: 'USD',
    
    // Payroll Settings
    defaultSalary: 50000,
    taxRate: 10,
    insuranceRate: 5,
    overtimeRate: 1.5,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    attendanceAlerts: true,
    
    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireTwoFactor: false,
  })

  useEffect(() => {
    settingsService
      .get()
      .then((data) => setSettings((prev) => ({ ...prev, taxRate: data.tax_rate })))
      .catch(() => {
        toast({
          title: 'Could not load tax rate',
          description: 'Using default 10%. Save again after the backend is deployed.',
          variant: 'destructive',
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (
      settings.defaultSalary < 0 ||
      settings.taxRate < 0 ||
      settings.taxRate > 100 ||
      settings.insuranceRate < 0 ||
      settings.insuranceRate > 100 ||
      settings.overtimeRate < 0 ||
      settings.sessionTimeout < 1 ||
      settings.passwordMinLength < 6
    ) {
      toast({
        title: 'Validation Error',
        description:
          'Check numeric settings: amounts cannot be negative; tax and insurance rates must be 0–100%; session timeout at least 1 minute; password length at least 6.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await settingsService.update({ tax_rate: settings.taxRate })
      toast({
        title: 'Settings Saved',
        description: `Tax rate (${settings.taxRate}%) saved and will apply to new payroll runs. Other preferences are stored locally for now.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save tax rate',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>System Configuration</CardTitle>
          </div>
          <CardDescription>Basic system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Input
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>Payroll Settings</CardTitle>
          </div>
          <CardDescription>Configure payroll calculations and defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultSalary">Default Salary</Label>
              <Input
                id="defaultSalary"
                type="number"
                min={0}
                value={settings.defaultSalary}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultSalary: clampInt(e.target.value, 0, 0),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min={0}
                max={100}
                value={settings.taxRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    taxRate: clampInt(e.target.value, 0, 0, 100),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Applied automatically to payroll deductions when generating pay (basic salary × tax rate).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceRate">Insurance Rate (%)</Label>
              <Input
                id="insuranceRate"
                type="number"
                min={0}
                max={100}
                value={settings.insuranceRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    insuranceRate: clampInt(e.target.value, 0, 0, 100),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overtimeRate">Overtime Multiplier</Label>
              <Input
                id="overtimeRate"
                type="number"
                min={0}
                step="0.1"
                value={settings.overtimeRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    overtimeRate: clampFloat(e.target.value, 1.5, 0),
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>Configure notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
            </div>
            <Switch
              checked={settings.lowStockAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, lowStockAlerts: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Attendance Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about attendance issues</p>
            </div>
            <Switch
              checked={settings.attendanceAlerts}
              onCheckedChange={(checked) => setSettings({ ...settings, attendanceAlerts: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Configure security and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min={1}
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionTimeout: clampInt(e.target.value, 30, 1),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                min={6}
                value={settings.passwordMinLength}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    passwordMinLength: clampInt(e.target.value, 8, 6),
                  })
                }
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Enforce 2FA for all users</p>
            </div>
            <Switch
              checked={settings.requireTwoFactor}
              onCheckedChange={(checked) => setSettings({ ...settings, requireTwoFactor: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  )
}

