import React from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Layout, Moon, Palette, Settings, Sun, Zap } from 'lucide-react';
import type { User } from '../types/auth';

interface UserDashboardSettingsProps {
  user: User;
  onBack: () => void;
  currentTheme: 'light' | 'dark' | 'blue' | 'green' | 'purple';
  onThemeChange: (theme: 'light' | 'dark' | 'blue' | 'green' | 'purple') => void;
}

function themeWrapperClass(theme: UserDashboardSettingsProps['currentTheme']) {
  return `min-h-screen bg-gray-50 theme-${theme}`;
}

export default function UserDashboardSettings({
  user,
  onBack,
  currentTheme,
  onThemeChange,
}: UserDashboardSettingsProps) {
  return (
    <div className={themeWrapperClass(currentTheme)}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-4">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Application preferences and account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Appearance & account
            </CardTitle>
            <CardDescription>Configure themes and view your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Color theme</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {(
                  [
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'blue', label: 'Blue', icon: Zap },
                    { value: 'green', label: 'Green', icon: Palette },
                    { value: 'purple', label: 'Purple', icon: Layout },
                  ] as const
                ).map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => onThemeChange(theme.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      currentTheme === theme.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      <theme.icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-medium capitalize">{theme.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Account information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Employee number</span>
                  <span className="font-medium text-right">{user.employeeNumber}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Full name</span>
                  <span className="font-medium text-right">{user.username}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium">{user.role === 'admin' ? 'Administrator' : 'User'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Last login</span>
                  <span className="font-medium text-right">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Application info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Data storage</span>
                  <span className="font-medium">Local</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
