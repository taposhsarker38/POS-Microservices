"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { skipToken } from '@reduxjs/toolkit/query/react';
import { 
  useWhoamiQuery, 
  useLogoutMutation, 
  apiSlice, 
  useGetCompanyQuery, 
  useUpdateCompanyMutation, 
  useGetCompanySettingsQuery, 
  useUpdateCompanySettingsMutation 
} from "@/store/api";
import { clearAuth } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Settings, LogOut, Menu as MenuIcon, X, Building2, Sparkles, Palette, User, ChevronDown } from "lucide-react";
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_KEYS = {
  DARK: "stockmate_dark_mode",
};

export default function HeaderWithSettings() {
  const dispatch = useDispatch();
  const { data: me, isLoading: meLoading } = useWhoamiQuery();
  const { data: company, isLoading: companyLoading } = useGetCompanyQuery(me?.company_id ?? skipToken);
  const { data: settings, isLoading: settingsLoading } = useGetCompanySettingsQuery(me?.company_id ?? skipToken);
  const [updateCompany] = useUpdateCompanyMutation();
  const [updateCompanySettings, { isLoading }] = useUpdateCompanySettingsMutation();
  const [logout] = useLogoutMutation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: null as File | null,
    logoUrl: '',
    themeColor: '',
  });
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const v = Cookies.get(COOKIE_KEYS.DARK);
    if (typeof v === "undefined") return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return v === "true";
  });

  useEffect(() => {
    if (company && settings) {
      setFormData({
        name: company.name || '',
        logo: null,
        logoUrl: settings.logo ? settings.logo : '',
        themeColor: settings.primary_color || '#6366f1',
      });
    }
  }, [company, settings]);

  useEffect(() => {
    if (formData.themeColor) document.documentElement.style.setProperty("--primary", formData.themeColor);
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    try {
      Cookies.set(COOKIE_KEYS.DARK, String(dark), { expires: 365, sameSite: 'Lax' });
    } catch (e) {
      console.warn('Could not persist cookies', e);
    }
  }, [formData.themeColor, dark]);

  const onLogout = async () => {
    try {
      await logout().unwrap();
    } catch (err) {
      console.warn(err);
    } finally {
      dispatch(clearAuth());
      dispatch(apiSlice.util.resetApiState());
      window.location.href = "/";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file,
        logoUrl: URL.createObjectURL(file),
      }));
    }
  };

  const saveSettings = async () => {
    if (!me?.company_id) return;

    try {
      // Update company if name changed
      if (formData.name !== company?.name) {
        await updateCompany({ id: me.company_id, data: { name: formData.name } }).unwrap();
      }

      // Update settings
      const settingsData: any = {};
      if (formData.themeColor !== settings?.primary_color) {
        settingsData.primary_color = formData.themeColor;
      }
      let updated = false;
      if (formData.logo) {
        const form = new FormData();
        form.append('logo', formData.logo);
        Object.entries(settingsData).forEach(([k, v]) => form.append(k, v as string));
        await updateCompanySettings({ company_id: me.company_id, data: form }).unwrap();
        updated = true;
      } else if (Object.keys(settingsData).length > 0) {
        await updateCompanySettings({ company_id: me.company_id, data: settingsData }).unwrap();
        updated = true;
      }

      if (updated) {
        // Optionally invalidate tags or refetch
      }
      setSettingsOpen(false);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  };

  const getInitials = () => {
    if (me?.first_name && me?.last_name) {
      return (me.first_name[0] + me.last_name[0]).toUpperCase();
    }
    if (me?.username) {
      return me.username.substring(0, 2).toUpperCase();
    }
    return me?.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (me?.first_name && me?.last_name) {
      return `${me.first_name} ${me.last_name}`;
    }
    if (me?.username) {
      return me.username;
    }
    return me?.email?.split('@')[0] || "Guest";
  };

  if (meLoading || companyLoading || settingsLoading) {
    return <header className="w-full border-b h-16" />; // Placeholder
  }

  return (
    <>
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-3 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover shadow-md" />
              ) : (
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600"
                  style={{ background: `linear-gradient(135deg, ${formData.themeColor}, ${formData.themeColor}dd)` }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {formData.name || "StockMate"}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Inventory Management
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDark((d) => !d)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
                title="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {dark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Sun className="h-5 w-5 text-amber-500" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Moon className="h-5 w-5 text-indigo-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {dark ? 'Light mode' : 'Dark mode'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSettingsOpen(true)}
                className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
                title="Company settings"
              >
                <Settings className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Settings
                </span>
              </motion.button>

              <Separator orientation="vertical" className="h-8 mx-1" />

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {getInitials()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {me?.is_superuser ? "Superuser" : "Administrator"}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-30" 
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-40"
                      >
                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {getInitials()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {getDisplayName()}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{me?.email || "guest@example.com"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              // Add profile navigation
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">View Profile</span>
                          </button>
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              setSettingsOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                          >
                            <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Settings</span>
                          </button>
                          <Separator className="my-2" />
                          <button
                            onClick={() => {
                              setProfileMenuOpen(false);
                              onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {settingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl overflow-auto"
            >
              <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 border-b border-indigo-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Palette className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Company Settings</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSettingsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </motion.button>
                </div>
                <p className="text-indigo-100 text-sm mt-2">Customize your workspace appearance</p>
              </div>

              <div className="p-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter company name"
                    className="border-2 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Logo
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="border-2 focus:border-indigo-500 dark:focus:border-indigo-400"
                  />
                  {formData.logoUrl && (
                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Preview:</p>
                      <img src={formData.logoUrl} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover shadow-md" />
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Theme Color
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      value={formData.themeColor}
                      onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                      placeholder="#6366f1"
                      className="flex-1 border-2 focus:border-indigo-500 dark:focus:border-indigo-400"
                    />
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                      className="h-10 w-16 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium">Color Preview:</p>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-14 w-14 rounded-xl shadow-lg border-2 border-white dark:border-slate-900"
                        style={{ backgroundColor: formData.themeColor }}
                      />
                      <div className="flex-1">
                        <div
                          className="h-3 rounded-full mb-2"
                          style={{ backgroundColor: formData.themeColor, opacity: 0.7 }}
                        />
                        <div
                          className="h-3 rounded-full w-2/3"
                          style={{ backgroundColor: formData.themeColor, opacity: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-xl border-2 border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {dark ? <Moon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-0">Dark Mode</Label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle dark theme</p>
                      </div>
                    </div>
                    <Switch checked={dark} onCheckedChange={setDark} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3 pt-4"
                >
                  <Button
                    variant="outline"
                    onClick={() => setSettingsOpen(false)}
                    className="flex-1 h-11 border-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveSettings}
                    disabled={isLoading}
                    className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}