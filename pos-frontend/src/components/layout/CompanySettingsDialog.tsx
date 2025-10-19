import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Sparkles, Palette, Save, Upload, Eye } from 'lucide-react';

const predefinedThemes = [
  { name: 'Indigo Blue', color: '#6366f1', gradient: 'from-indigo-500 to-blue-500' },
  { name: 'Purple Dream', color: '#a855f7', gradient: 'from-purple-500 to-pink-500' },
  { name: 'Emerald Green', color: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'Rose Pink', color: '#f43f5e', gradient: 'from-rose-500 to-pink-500' },
  { name: 'Amber Gold', color: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
  { name: 'Cyan Blue', color: '#06b6d4', gradient: 'from-cyan-500 to-blue-500' },
  { name: 'Violet Magic', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
  { name: 'Slate Dark', color: '#475569', gradient: 'from-slate-600 to-gray-700' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  companyData?: {
    name: string;
    logo?: string;
  };
  settingsData?: {
    primary_color?: string;
    font?: string;
    border_radius?: string;
  };
  onSave?: (data: any) => void;
}

export default function CompanySettingsDialog({ 
  isOpen, 
  onClose, 
  companyData,
  settingsData,
  onSave 
}: Props) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo: null as File | null,
    logoUrl: '',
    themeColor: '#6366f1',
    font: 'inter',
    borderRadius: 'medium',
  });

  useEffect(() => {
    if (companyData || settingsData) {
      setFormData({
        name: companyData?.name || '',
        logo: null,
        logoUrl: companyData?.logo || settingsData?.logo || '',
        themeColor: settingsData?.primary_color || '#6366f1',
        font: settingsData?.font || 'inter',
        borderRadius: settingsData?.border_radius || 'medium',
      });
    }
  }, [companyData, settingsData]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Apply theme immediately
      document.documentElement.style.setProperty("--primary", formData.themeColor);
      
      // Call parent save handler if provided
      if (onSave) {
        await onSave(formData);
      }
      
      setTimeout(() => {
        setSaving(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to save settings', err);
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Company Settings</h2>
                  <p className="text-indigo-100 text-sm">Customize your workspace appearance</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Company Logo
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-indigo-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50"
                    >
                      <Upload className="h-5 w-5 text-slate-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formData.logo ? formData.logo.name : 'Click to upload logo'}
                      </span>
                    </label>
                  </div>
                  {formData.logoUrl && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Preview:</p>
                      <img src={formData.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover shadow-md" />
                    </div>
                  )}
                </div>

                {/* Theme Colors */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {predefinedThemes.map((theme) => (
                      <button
                        key={theme.color}
                        type="button"
                        onClick={() => setFormData({...formData, themeColor: theme.color})}
                        className={`relative h-14 rounded-lg transition-all duration-200 ${
                          formData.themeColor === theme.color
                            ? 'ring-2 ring-offset-2 ring-indigo-500 scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={{ background: `linear-gradient(135deg, ${theme.color}, ${theme.color}dd)` }}
                        title={theme.name}
                      >
                        {formData.themeColor === theme.color && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
                          >
                            <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Color */}
                  <div className="flex gap-3 mt-3">
                    <input
                      type="text"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                      placeholder="#6366f1"
                      className="flex-1 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none"
                    />
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({...formData, themeColor: e.target.value})}
                      className="h-10 w-16 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Typography */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Typography
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'inter', label: 'Inter' },
                      { value: 'roboto', label: 'Roboto' },
                      { value: 'poppins', label: 'Poppins' },
                    ].map((font) => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => setFormData({...formData, font: font.value})}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.font === font.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <span className="font-semibold text-sm">{font.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Corner Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'none', label: 'Sharp', radius: 'rounded-none' },
                      { value: 'medium', label: 'Medium', radius: 'rounded-lg' },
                      { value: 'large', label: 'Rounded', radius: 'rounded-xl' },
                    ].map((radius) => (
                      <button
                        key={radius.value}
                        type="button"
                        onClick={() => setFormData({...formData, borderRadius: radius.value})}
                        className={`p-3 border-2 transition-all ${radius.radius} ${
                          formData.borderRadius === radius.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <div className={`h-8 w-8 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 ${radius.radius}`}></div>
                        <span className="text-xs font-medium mt-1 block">{radius.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Live Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Preview</h3>
                </div>

                {/* Preview Card */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 space-y-4">
                  {/* Header Preview */}
                  <div 
                    className={`p-4 bg-white dark:bg-slate-800 shadow-lg ${
                      formData.borderRadius === 'none' ? 'rounded-none' : 
                      formData.borderRadius === 'large' ? 'rounded-xl' : 'rounded-lg'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div 
                          className={`h-10 w-10 flex items-center justify-center text-white ${
                            formData.borderRadius === 'none' ? 'rounded-none' : 
                            formData.borderRadius === 'large' ? 'rounded-xl' : 'rounded-lg'
                          }`}
                          style={{ backgroundColor: formData.themeColor }}
                        >
                          <Building2 className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formData.name || 'Company Name'}
                        </p>
                        <p className="text-xs text-slate-500">Dashboard</p>
                      </div>
                    </div>
                  </div>

                  {/* Button Preview */}
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-white font-semibold shadow-lg transition-all ${
                      formData.borderRadius === 'none' ? 'rounded-none' : 
                      formData.borderRadius === 'large' ? 'rounded-xl' : 'rounded-lg'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${formData.themeColor}, ${formData.themeColor}dd)` }}
                  >
                    Primary Button
                  </button>

                  {/* Card Preview */}
                  <div 
                    className={`p-4 bg-white dark:bg-slate-800 border-2 ${
                      formData.borderRadius === 'none' ? 'rounded-none' : 
                      formData.borderRadius === 'large' ? 'rounded-xl' : 'rounded-lg'
                    }`}
                    style={{ borderColor: formData.themeColor + '40' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className={`h-2 w-2 ${
                          formData.borderRadius === 'none' ? 'rounded-none' : 'rounded-full'
                        }`}
                        style={{ backgroundColor: formData.themeColor }}
                      />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Card Component</span>
                    </div>
                    <div className="space-y-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ backgroundColor: formData.themeColor, opacity: 0.3 }}
                      />
                      <div 
                        className="h-2 rounded-full w-3/4"
                        style={{ backgroundColor: formData.themeColor, opacity: 0.2 }}
                      />
                    </div>
                  </div>

                  {/* Badges Preview */}
                  <div className="flex gap-2 flex-wrap">
                    <span 
                      className={`px-3 py-1 text-xs font-semibold text-white ${
                        formData.borderRadius === 'none' ? 'rounded-none' : 
                        formData.borderRadius === 'large' ? 'rounded-full' : 'rounded-md'
                      }`}
                      style={{ backgroundColor: formData.themeColor }}
                    >
                      Active
                    </span>
                    <span 
                      className={`px-3 py-1 text-xs font-semibold ${
                        formData.borderRadius === 'none' ? 'rounded-none' : 
                        formData.borderRadius === 'large' ? 'rounded-full' : 'rounded-md'
                      }`}
                      style={{ 
                        backgroundColor: formData.themeColor + '20',
                        color: formData.themeColor 
                      }}
                    >
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}