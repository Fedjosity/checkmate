"use client";

import { Card } from "@/components/ui/Card";
import { BankAccountForm } from "@/components/settings/BankAccountForm";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-wide uppercase">
          Settings
        </h1>
        <p className="text-muted mt-2">
          Manage your account preferences and connected services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar (Mock for now, just highlights current section) */}
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest bg-gold/5 text-gold border border-gold/20">
            Financial
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-muted hover:text-white hover:bg-surface transition-colors">
            Profile
          </button>
          <button className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-muted hover:text-white hover:bg-surface transition-colors">
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center text-muted">
                <AccountBalanceIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Bank Account
                </h2>
                <p className="text-xs text-muted uppercase tracking-widest mt-1">
                  For Earnings Withdrawals
                </p>
              </div>
            </div>

            <BankAccountForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
