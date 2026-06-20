import React, { useState, useEffect } from 'react';
import LoginScreen from './login-screen';
import AdminDashboard from './admin-dashboard';
import UserDashboard from './user-dashboard';
import UnitViewClient from './unit-view-client';
import type { AuthState } from '../types/auth';
import { authService } from '../services/authService';
import * as patientService from '../services/patientService';
import * as nurseService from '../services/nurseService';
import * as spectraService from '../services/spectraService';
import * as layoutService from '../services/layoutService';
import type { LayoutName } from '../types/patient';
import { setLastOpenedUnitName } from '../lib/last-unit-storage';
import { getRoleCapabilities } from '@/lib/roles';
import { defaultFacilityProfile, getFacilityProfile } from '@/services/facilityService';
import type { FacilityProfile } from '@/types/facility';

type AuthView = 'login' | 'admin' | 'user-dashboard' | 'unit-view';

export default function AuthContainer() {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
  });
  const [initialProps, setInitialProps] = useState<any>(null);
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfile>(defaultFacilityProfile);

  useEffect(() => {
    // Initialize authentication system
    const initialize = async () => {
      try {
        await authService.initializeAuth();
        try {
          const profile = await getFacilityProfile();
          setFacilityProfile(profile);
        } catch {
          // Keep default facility profile
        }
        
        // Check if there's a saved session
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setAuthState({
            isAuthenticated: true,
            user: savedUser,
            isLoading: false,
            error: null,
          });
          setCurrentView('user-dashboard');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };

    initialize();
  }, []);

  const handleLogin = async (credentials: { employeeNumber: string; password: string }) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.login(credentials);
      
      if (result.isAuthenticated && result.user) {
        setAuthState(result);
        authService.setCurrentUser(result.user);
        setCurrentView('user-dashboard');
      } else {
        setAuthState(result);
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Login failed. Please try again.',
      });
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    authService.clearCurrentUser();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    setCurrentView('login');
  };

  const handleBackToLogin = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
    setCurrentView('login');
  };

  const handleEnterUnit = async (unitName: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Load all data for the selected unit
      const [initialSpectra, allLayouts] = await Promise.all([
        spectraService.getSpectraPool(),
        layoutService.getAvailableLayouts(),
      ]);

      const layoutToLoad: LayoutName = allLayouts.includes(unitName as LayoutName) 
        ? (unitName as LayoutName) 
        : 'North-South View';
          
      const [initialPatients, initialNurses, initialTechs] = await Promise.all([
        patientService.getPatients(layoutToLoad),
        nurseService.getNurses(layoutToLoad),
        nurseService.getTechs(layoutToLoad),
      ]);

      const sessionUser = authService.getCurrentUser();
      if (sessionUser) {
        setLastOpenedUnitName(sessionUser.id, layoutToLoad);
      }

      setInitialProps({
        initialLayoutName: layoutToLoad,
        initialAvailableLayouts: allLayouts,
        initialIsLayoutLocked: false,
        initialPatients,
        initialNurses,
        initialTechs,
        initialSpectraPool: initialSpectra,
      });

      setAuthState(prev => ({ ...prev, isLoading: false, error: null }));
      setCurrentView('unit-view');
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to load unit data' 
      }));
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('user-dashboard');
    setInitialProps(null);
  };

  // Render current view
  switch (currentView) {
    case 'login':
      return (
        <LoginScreen
          onLogin={handleLogin}
          isLoading={authState.isLoading}
          error={authState.error}
          facilityName={facilityProfile.name}
          logoDataUrl={facilityProfile.logoDataUrl}
        />
      );

    case 'admin':
      return (
        <AdminDashboard
          onLogout={handleLogout}
          onBackToLogin={handleBackToLogin}
          onBackToFacility={() => setCurrentView('user-dashboard')}
        />
      );

    case 'user-dashboard':
      return authState.user ? (
        <UserDashboard
          user={authState.user}
          onLogout={handleLogout}
          onEnterUnit={handleEnterUnit}
          onOpenUserManagement={
            getRoleCapabilities(authState.user.role, authState.user.appRole).isAdmin
              ? () => setCurrentView('admin')
              : undefined
          }
        />
      ) : null;

    case 'unit-view':
      return initialProps ? (
        <UnitViewClient 
          {...initialProps} 
          onBackToDashboard={handleBackToDashboard}
          currentUser={authState.user}
        />
      ) : null;

    default:
      return <LoginScreen onLogin={handleLogin} />;
  }
}