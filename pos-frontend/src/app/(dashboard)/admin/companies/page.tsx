"use client";

import { useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
  useGetCompaniesQuery, 
  useCreateCompanyMutation, 
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from '@/store/api';
import { Toaster } from 'react-hot-toast';
import CompanyFormDialog from '@/components/Companies/CompanyFormDialog';
import CompanySettingsDialog from '@/components/Companies/CompanySettingsDialog';
import CompanyTable from '@/components/Companies/CompanyTable';
import { Company, ApiResponse,ApiError } from '@/store/type';
import { confirmDelete, showDeleteError, showDeleteSuccess } from '@/lib/sweetAlertHelper';

export default function CompaniesPage() {
  const { data: companies = [], isLoading } = useGetCompaniesQuery();
  const [createCompany] = useCreateCompanyMutation();
  const [updateCompany] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const handleCreate = () => {
    setSelectedCompany(null);
    setCompanyFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setCompanyFormOpen(true);
  };

  const handleSettings = (company: Company) => {
    setSelectedCompany(company);
    setCompanySettingsOpen(true);
  };


const handleDeleteCompany = async (id: string) => {
  const confirmed = await confirmDelete({
    entityName: 'Company'
  });

  if (confirmed) {
    try {
      await deleteCompany(id).unwrap();
      await showDeleteSuccess({ entityName: 'Company' });
    } catch (error) {
      await showDeleteError(error);
    }
  }
};

  const handleSaveCompany = async (data: any) => {
    try {
      if (selectedCompany) {
        const response = await updateCompany({ id: selectedCompany.id, data }).unwrap() as unknown as ApiResponse;
        return { success: true, message: response?.message || 'Company updated successfully' };
      } else {
        const response = await createCompany(data).unwrap() as unknown as ApiResponse;
        return { success: true, message: response?.message || 'Company created successfully' };
      }
    } catch (error: any) {
      console.error('Failed to save company:', error);
      const errorMessage = (error as ApiError)?.data?.code?.[0] || 
                         (error as ApiError)?.data?.message || 
                         'Failed to save company';
      return { success: false, message: errorMessage };
    }
  };

  const handleSaveSettings = async (data: any) => {
    try {
      console.log('Saving settings:', data);
      // Placeholder for settings save API call
      return { success: true, message: 'Settings saved successfully' };
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      const errorMessage = (error as ApiError)?.data?.code?.[0] || 
                         (error as ApiError)?.data?.message || 
                         'Failed to save settings';
      return { success: false, message: errorMessage };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="fullscreen flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              Company Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage companies and their settings
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Company
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-colors"
          />
        </div>

        {/* Table Component */}
        <CompanyTable
          companies={companies}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onEdit={handleEdit}
          onSettings={handleSettings}
          onDelete={handleDeleteCompany}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold">Total Companies</p>
            <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
              {companies.length}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Active</p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
              {companies.length}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">This Month</p>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              {companies.filter((c: Company) => {
                const created = new Date(c.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CompanyFormDialog
        isOpen={companyFormOpen}
        onClose={() => {
          setCompanyFormOpen(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        onSave={handleSaveCompany}
      />

      <CompanySettingsDialog
        isOpen={companySettingsOpen}
        onClose={() => {
          setCompanySettingsOpen(false);
          setSelectedCompany(null);
        }}
        companyData={{
          name: selectedCompany?.name || '',
          logo: '',
        }}
        settingsData={{
          primary_color: '#6366f1',
          font: 'inter',
          border_radius: 'medium',
        }}
        onSave={handleSaveSettings}
      />
    </div>
  );
}