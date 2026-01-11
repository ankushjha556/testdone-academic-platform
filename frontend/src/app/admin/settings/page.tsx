'use client';

import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Platform Settings</h1>

            <div className="card bg-white dark:bg-gray-900 shadow rounded-lg p-6 max-w-3xl">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-primary-600" />
                    General Configuration
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
                        <input type="text" defaultValue="TestDone" className="input w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                        <input type="email" defaultValue="support@testdone.in" className="input w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>

                    <div className="pt-4">
                        <button className="btn btn-primary flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
