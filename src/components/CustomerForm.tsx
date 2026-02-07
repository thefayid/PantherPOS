import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import type { Customer } from '../services/customerService';
import { Button } from './Button';
import { gstService } from '../services/gstService';

interface CustomerFormProps {
    initialData?: Customer;
    onSubmit: (customer: Omit<Customer, 'id' | 'total_purchases' | 'created_at'>) => Promise<void>;
    onCancel: () => void;
}

export function CustomerForm({ initialData, onSubmit, onCancel }: CustomerFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        address: initialData?.address || '',
        gstin: initialData?.gstin || '',
        state: initialData?.state || ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            points: initialData?.points || 0,
            balance: initialData?.balance || 0
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                        type="tel"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                        value={formData.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder="customer@example.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                        rows={3}
                        value={formData.address}
                        onChange={e => handleChange('address', e.target.value)}
                        placeholder="Street, City, State, PIN"
                    />
                </div>

                {/* GSTIN Input - Phase 2 GST */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        GSTIN (Optional)
                        <span className="text-xs text-gray-500 ml-2">For B2B customers</span>
                    </label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2 font-mono"
                        value={formData.gstin}
                        onChange={e => {
                            const gstin = e.target.value.toUpperCase().replace(/\s/g, '');
                            handleChange('gstin', gstin);
                        }}
                        onBlur={() => {
                            if (formData.gstin) {
                                const validation = gstService.validateGSTIN(formData.gstin);
                                if (!validation.valid) {
                                    toast.error(`Invalid GSTIN: ${validation.error}`);
                                } else {
                                    // Auto-extract state from GSTIN
                                    const state = gstService.extractStateFromGSTIN(formData.gstin);
                                    if (state) {
                                        handleChange('state', state);
                                        toast.success(`State auto-detected: ${state}`);
                                    }
                                }
                            }
                        }}
                        maxLength={15}
                        placeholder="22AAAAA0000A1Z5"
                    />
                    {formData.gstin && gstService.isB2B(formData.gstin) && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Valid B2B GSTIN
                        </p>
                    )}
                </div>

                {/* State Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm border p-2"
                        value={formData.state}
                        onChange={e => handleChange('state', e.target.value)}
                    >
                        <option value="">Select State</option>
                        {gstService.getAllStates().map(state => (
                            <option key={state.code} value={state.name}>
                                {state.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant="primary">
                    {initialData ? 'Update Customer' : 'Add Customer'}
                </Button>
            </div>
        </form>
    );
}
