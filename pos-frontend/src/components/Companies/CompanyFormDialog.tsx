import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Save, Hash, FileText, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import { Props } from '@/store/type';
import { companySchema } from '@/lib/schema';

type CompanyFormData = z.infer<typeof companySchema>;

export default function CompanyFormDialog({
  isOpen,
  onClose,
  company,
  onSave,
}: Props) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      code: '',
      tax_number: '',
      vat_rate: '0',
      bin_number: '',
      default_payment_terms: '',
      address: '',
      accounting_codes: '',
    },
  });

  useEffect(() => {
    if (company && isOpen) {
      setValue('name', company.name || '');
      setValue('code', company.code || '');
      setValue('tax_number', company.tax_number || '');
      setValue('vat_rate', company.vat_rate || '0');
      setValue('bin_number', company.bin_number || '');
      setValue('default_payment_terms', company.default_payment_terms || '');
      setValue('address', company.address || '');
      setValue('accounting_codes', company.accounting_codes ?? '')
    } else if (isOpen) {
      // Reset form for create
      reset({
        name: '',
        code: '',
        tax_number: '',
        vat_rate: '0',
        bin_number: '',
        default_payment_terms: '',
        address: '',
        accounting_codes: '',
      });
    }
  }, [company, isOpen, setValue, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    setSaving(true);
    try {
      const result = await onSave({
      ...data,
      id: company?.id || '', 
      created_at: company?.created_at || '', 
    });
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
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
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {company ? 'Edit Company' : 'Add New Company'}
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    {company ? 'Update company information' : 'Create a new company'}
                  </p>
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

          {/* Form Content */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Enter company name"
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors ${
                      errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
              </div>

              {/* Company Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Company Code *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('code')}
                    type="text"
                    placeholder="COMP001"
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors ${
                      errors.code ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                    }`}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>
                  )}
                </div>
              </div>

              {/* Tax Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Tax Number
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    {...register('tax_number')}
                    type="text"
                    placeholder="TAX123456"
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* BIN Number */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  BIN Number
                </label>
                <input
                  {...register('bin_number')}
                  type="text"
                  placeholder="BIN123456"
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
                />
              </div>

              {/* VAT Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  VAT Rate (%)
                </label>
                <input
                  {...register('vat_rate')}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors ${
                    errors.vat_rate ? 'border-red-500' : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400'
                  }`}
                />
                {errors.vat_rate && (
                  <p className="mt-1 text-sm text-red-500">{errors.vat_rate.message}</p>
                )}
              </div>

              {/* Payment Terms */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Default Payment Terms
                </label>
                <input
                  {...register('default_payment_terms')}
                  type="text"
                  placeholder="Net 30 days"
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <textarea
                    {...register('address')}
                    placeholder="Enter company address"
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </form>

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
                onClick={handleSubmit(onSubmit)}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}