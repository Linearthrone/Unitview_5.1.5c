import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Plus, 
  Settings, 
  Hospital, 
  Palette, 
  Monitor, 
  LogOut,
  ChevronRight,
  Layout,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { User, UnitSettings } from '../types/auth';
import { authService } from '../services/authService';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onBackToLogin: () => void;
  onEnterUnit: (unitName: string) => void;
}

export default function UserDashboard({ user, onLogout, onBackToLogin, onEnterUnit }: UserDashboardProps) {
  const [units, setUnits] = useState<UnitSettings[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isCreateUnitOpen, setIsCreateUnitOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form states
  const [newUnitName, setNewUnitName] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'blue' | 'green' | 'purple'>('light');

  useEffect(() => {
    loadUnits();
    loadCurrentSettings();
  }, []);

  const loadUnits = () => {
    try {
      const allUnits = authService.getUnitSettings();
      setUnits(allUnits);
    } catch (error) {
      showMessage('error', 'Failed to load units');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSettings = () => {
    try {
      const defaultUnit = authService.getUnitSetting('default');
      if (defaultUnit) {
        setCurrentTheme(defaultUnit.theme);
      }
    } catch (error) {
      console.error('Failed to load current settings');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateUnit = () => {
    if (!newUnitName.trim()) {
      showMessage('error', 'Please enter a unit name');
      return;
    }

    const newUnit: UnitSettings = {
      id: `unit-${Date.now()}`,
      name: newUnitName.trim(),
      theme: currentTheme,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    const success = authService.saveUnitSettings(newUnit);

    if (success) {
      showMessage('success', 'Unit created successfully');
      setNewUnitName('');
      setIsCreateUnitOpen(false);
      loadUnits();
    } else {
      showMessage('error', 'Failed to create unit');
    }
  };

  const handleEnterUnit = () => {
    if (!selectedUnit) {
      showMessage('error', 'Please select a unit');
      return;
    }
    
    // Save the selected unit as preference
    onEnterUnit(selectedUnit);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'blue' | 'green' | 'purple') => {
    setCurrentTheme(theme);
    // Apply theme immediately for preview
    applyTheme(theme);
  };

  const applyTheme = (theme: 'light' | 'dark' | 'blue' | 'green' | 'purple') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple');
    
    // Apply new theme
    root.classList.add(`theme-${theme}`);
    
    // Store theme preference
    localStorage.setItem('unitview_theme', theme);
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'blue':
        return <Zap className="w-4 h-4" />;
      case 'green':
        return <Palette className="w-4 h-4" />;
      case 'purple':
        return <Layout className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'dark':
        return 'bg-gray-800 text-white';
      case 'blue':
        return 'bg-blue-600 text-white';
      case 'green':
        return 'bg-green-600 text-white';
      case 'purple':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-100 text-gray-900 border border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 theme-light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Hospital className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">UnitView</h1>
                <p className="text-sm text-gray-500">Welcome, {user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Role: <span className="font-medium">{user.role === 'admin' ? 'Administrator' : 'User'}</span>
              </span>
              <Button variant="outline" onClick={onBackToLogin}>
                Back to Login
              </Button>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unit Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                Select Unit
              </CardTitle>
              <CardDescription>
                Choose a unit to manage or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="unit-select">Available Units</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.name}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${getThemeColor(unit.theme).split(' ')[0]}`} />
                          {unit.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleEnterUnit} 
                  disabled={!selectedUnit}
                  className="flex-1"
                >
                  Enter Unit
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Dialog open={isCreateUnitOpen} onOpenChange={setIsCreateUnitOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      New Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Unit</DialogTitle>
                      <DialogDescription>
                        Set up a new unit for patient management
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="unit-name">Unit Name</Label>
                        <Input
                          id="unit-name"
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          placeholder="e.g., ICU, Emergency, Pediatrics"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreateUnitOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUnit}>
                          Create Unit
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {units.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Units</h4>
                  <div className="space-y-2">
                    {units.slice(0, 3).map((unit) => (
                      <div 
                        key={unit.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedUnit === unit.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedUnit(unit.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${getThemeColor(unit.theme).split(' ')[0]}`} />
                            <span className="font-medium">{unit.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {getThemeIcon(unit.theme)}
                            <span className="ml-1 capitalize">{unit.theme}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(unit.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure application preferences and themes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Color Theme</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'blue', label: 'Blue', icon: Zap },
                    { value: 'green', label: 'Green', icon: Palette },
                    { value: 'purple', label: 'Purple', icon: Layout },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() => handleThemeChange(theme.value as any)}
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee Number:</span>
                    <span className="font-medium">{user.employeeNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-medium">{user.role === 'admin' ? 'Administrator' : 'User'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Login:</span>
                    <span className="font-medium">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Application Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Storage:</span>
                    <span className="font-medium">Local</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}