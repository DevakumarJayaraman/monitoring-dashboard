import { useState, FormEvent, ChangeEvent } from 'react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceData) => void;
}

export interface ServiceData {
  serviceName: string;
  module: string;
  hostingInfra: string;
  serviceType: string;
}

export function AddServiceModal({ isOpen, onClose, onSave }: AddServiceModalProps) {
  const [formData, setFormData] = useState<ServiceData>({
    serviceName: '',
    module: '',
    hostingInfra: '',
    serviceType: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      serviceName: '',
      module: '',
      hostingInfra: '',
      serviceType: '',
    });
    onClose();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-100">Add Service</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Service Name */}
          <div>
            <label htmlFor="serviceName" className="block text-sm font-medium text-slate-300 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              id="serviceName"
              name="serviceName"
              required
              value={formData.serviceName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g., Payment Service"
            />
          </div>

          {/* Module */}
          <div>
            <label htmlFor="module" className="block text-sm font-medium text-slate-300 mb-2">
              Module *
            </label>
            <select
              id="module"
              name="module"
              required
              value={formData.module}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select Module</option>
              <option value="Lifecycle">Lifecycle</option>
              <option value="CA">CA</option>
              <option value="TradeCapture">TradeCapture</option>
              <option value="RiskManagement">Risk Management</option>
              <option value="Settlement">Settlement</option>
              <option value="Reporting">Reporting</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          {/* Hosting Infrastructure */}
          <div>
            <label htmlFor="hostingInfra" className="block text-sm font-medium text-slate-300 mb-2">
              Hosting Infrastructure *
            </label>
            <select
              id="hostingInfra"
              name="hostingInfra"
              required
              value={formData.hostingInfra}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select Infrastructure</option>
              <option value="ECS">ECS</option>
              <option value="Linux VM">Linux VM</option>
              <option value="Windows VM">Windows VM</option>
            </select>
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-slate-300 mb-2">
              Service Type *
            </label>
            <select
              id="serviceType"
              name="serviceType"
              required
              value={formData.serviceType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select Service Type</option>
              <option value="FrontEnd">FrontEnd</option>
              <option value="BackEnd">BackEnd</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
