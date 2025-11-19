import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, Settings, LogOut, Building, Palette } from 'lucide-react';
import type { User, UnitSettings } from '../types/auth';
import * as authService from '../services/authService';

interface UnitDashboardProps {
  user: User;
  onSelectUnit: (unit: UnitSettings) => void;
  onCreateUnit: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export default function UnitDashboard({ 
  user, 
  onSelectUnit, 
  onCreateUnit, 
  onLogout, 
  onSettings 
}: UnitDashboardProps) {
  const [units, setUnits] = useState<UnitSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const unitList = authService.getUnitSettings();
      setUnits(unitList);
    } catch (error) {
      console.error('Failed to load units:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = (theme: UnitSettings['theme']) => {
    const colors = {
      light: 'bg-gray-100 border-gray-300',
      dark: 'bg-gray-800 text-white border-gray-600',
      blue: 'bg-blue-100 border-blue-300 text-blue-900',
      green: 'bg-green-100 border-green-300 text-green-900',
      purple: 'bg-purple-100 border-purple-300 text-purple-900',
    };
    return colors[theme];
  };

  const getThemeBadgeColor = (theme: UnitSettings['theme']) => {
    const colors = {
      light: 'bg-gray-200 text-gray-700',
      dark: 'bg-gray-700 text-gray-200',
      blue: 'bg-blue-200 text-blue-800',
      green: 'bg-green-200 text-green-800',
      purple: 'bg-purple-200 text-purple-800',
    };
    return colors[theme];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading units...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">UnitView</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.employeeNumber}</p>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                {user.role === 'admin' ? 'Administrator' : 'Staff'}
              </Badge>
              <Button variant="outline" size="sm" onClick={onSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Unit</h2>
          <p className="text-gray-600">Choose a unit to manage or create a new unit layout</p>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {units.map((unit) => (
            <Card 
              key={unit.id} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${getThemeColor(unit.theme)}`}
              onClick={() => onSelectUnit(unit)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{unit.name}</CardTitle>
                  <Badge className={getThemeBadgeColor(unit.theme)}>
                    <Palette className="w-3 h-3 mr-1" />
                    {unit.theme}
                  </Badge>
                </div>
                <CardDescription>
                  Created: {new Date(unit.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>Last modified: {new Date(unit.lastModified).toLocaleDateString()}</p>
                  <p>Click to open unit management</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Unit Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300"
            onClick={onCreateUnit}
          >
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Create New Unit</CardTitle>
              <CardDescription>
                Set up a new unit layout and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Unit
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome back, {user.username}!</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{units.length}</p>
              <p className="text-sm text-gray-600">Available Units</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-sm text-gray-600">System Status</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{user.role}</p>
              <p className="text-sm text-gray-600">Your Role</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}