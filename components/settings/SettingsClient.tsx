"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateGlobalSettingAction } from "@/lib/actions/settings.actions";
import { Palette, Landmark, Calendar, RotateCcw, Building2, Upload, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type SettingsClientProps = {
  initialSettings: Record<string, string>;
};

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Branding (Persisted)
  const [primaryColor, setPrimaryColor] = useState(initialSettings["branding.primaryColor"] || initialSettings.primary_color || "#FF6C06");
  const [navColor, setNavColor] = useState(initialSettings["branding.sidebarAccentColor"] || initialSettings.sidebar_active_color || "#C05E0E");
  const [autoAdjust, setAutoAdjust] = useState(true);

  // Formats (Persisted)
  const [currency, setCurrency] = useState(initialSettings["localization.currency"] || initialSettings.default_currency || "$");
  const [dateFormat, setDateFormat] = useState(initialSettings["localization.dateFormat"] || "DD/MM/YYYY");

  // Simulated Identity (Non-persisted for now)
  const [orgName, setOrgName] = useState("TalentTrack");
  const [footerInitials, setFooterInitials] = useState("BE");

  // Logic to auto-calculate nav color from primary using HSL
  function hexToHsl(hex: string) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToHex(h: number, s: number, l: number) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const f = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      r = f(h + 1/3); g = f(h); b = f(h - 1/3);
    }
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function handlePrimaryChange(color: string) {
    setPrimaryColor(color);
    if (autoAdjust) {
      const [h, s, l] = hexToHsl(color);
      // Darken significantly for navigation
      const suggestion = hslToHex(h, s, Math.max(0.15, l - 0.25));
      setNavColor(suggestion);
    }
  }

  async function handleSaveBranding() {
    setLoading(true);
    try {
      await updateGlobalSettingAction("branding.primaryColor", primaryColor);
      await updateGlobalSettingAction("branding.sidebarAccentColor", navColor);
      toast.success("Branding updated successfully");
      router.refresh();
    } catch {
      toast.error("Failed to update branding");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveFormats() {
    setLoading(true);
    try {
      await updateGlobalSettingAction("localization.currency", currency);
      await updateGlobalSettingAction("localization.dateFormat", dateFormat);
      toast.success("Regional settings updated successfully");
      router.refresh();
    } catch {
      toast.error("Failed to update regional settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl pb-12">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Branding Section */}
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="size-5 text-primary" />
              <CardTitle>Global Branding</CardTitle>
            </div>
            <CardDescription>
              Customize the system-wide visual identity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Action Color</Label>
                <div className="flex gap-3">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    className="size-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => handlePrimaryChange(e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nav-color">Navigation Accent</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Auto</span>
                    <Switch 
                      checked={autoAdjust} 
                      onCheckedChange={setAutoAdjust}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Input
                    id="nav-color"
                    type="color"
                    value={navColor}
                    disabled={autoAdjust}
                    onChange={(e) => setNavColor(e.target.value)}
                    className="size-10 p-1 cursor-pointer disabled:opacity-50"
                  />
                  <Input
                    type="text"
                    value={navColor}
                    disabled={autoAdjust}
                    onChange={(e) => setNavColor(e.target.value)}
                    className="font-mono text-xs uppercase disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                className="bg-primary hover:bg-primary/90" 
                onClick={handleSaveBranding}
                disabled={loading}
              >
                Apply Branding
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings Section */}
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              <CardTitle>Regional & Formats</CardTitle>
            </div>
            <CardDescription>
              Configure currency and date standards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Organization Currency</Label>
                <Select value={currency} onValueChange={(v: string | null) => setCurrency(v || "")}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">Dollar (USD - $)</SelectItem>
                    <SelectItem value="€">Euro (€)</SelectItem>
                    <SelectItem value="£">Pound (£)</SelectItem>
                    <SelectItem value="MXN$">Peso (MXN$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Select value={dateFormat} onValueChange={(v: string | null) => setDateFormat(v || "")}>
                  <SelectTrigger id="date-format">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Standard)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                className="bg-primary hover:bg-primary/90" 
                onClick={handleSaveFormats}
                disabled={loading}
              >
                Apply Regional Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mock Identity Section (Simulation) */}
      <Card className="border-indigo-100 bg-indigo-50/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-indigo-600" />
              <CardTitle>Organizational Identity</CardTitle>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Simulation Mode
            </div>
          </div>
          <CardDescription>
            Experiment with organizational names and logos. <span className="font-semibold text-indigo-600 italic">Not persisted in DB.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mock-org-name">Organization Name</Label>
                <Input
                  id="mock-org-name"
                  placeholder="e.g. Brindley Engineering"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mock-footer">Powered By Footer</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">Powered By</span>
                  <Input
                    id="mock-footer"
                    placeholder="BE"
                    value={footerInitials}
                    onChange={(e) => setFooterInitials(e.target.value)}
                    className="w-20 bg-white font-bold uppercase text-center"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="p-4 rounded-lg border border-dashed border-indigo-200 bg-white flex flex-col items-center justify-center gap-2 group cursor-not-allowed">
                <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <Upload className="size-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-indigo-900">Sidebar Logo</p>
                  <p className="text-[10px] text-neutral-500 leading-tight">Click to simulate upload<br/>(PNG/SVG optimal)</p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-dashed border-indigo-200 bg-white flex flex-col items-center justify-center gap-2 group cursor-not-allowed">
                <div className="size-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <Upload className="size-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-indigo-900">Resume Header Logo</p>
                  <p className="text-[10px] text-neutral-500 leading-tight">Click to simulate upload<br/>(Horizontal logo recommended)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border border-indigo-100 rounded-lg flex items-start gap-3">
            <Info className="size-4 text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-indigo-900 leading-normal">
              <strong>Interactive Demo:</strong> Notice how the "Powered By" text in the bottom left of your sidebar would change to <strong>{footerInitials}</strong>. 
              The organization name <strong>{orgName}</strong> would also replace "TalentTrack" in the main navigation header.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
