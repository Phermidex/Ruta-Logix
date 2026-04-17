/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AuthScreen } from './components/AuthScreen';
import { UserRole } from './lib/types';
import { cn } from './lib/utils';
import { User, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from './lib/AuthContext';
import { logout } from './lib/firebase';

export default function App() {
  const { currentUser, firebaseUser, loading, isAuthReady } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  // Check if user is authenticated AND has a profile AND (if email/pass) is verified
  const isVerified = firebaseUser?.providerData[0]?.providerId === 'google.com' || firebaseUser?.emailVerified;
  
  if (!currentUser || !isVerified) {
    return <AuthScreen />;
  }

  const role = currentUser.role;
// ...

  return (
    <div className="min-h-screen bg-bg-app flex">
      {(role === 'admin' || role === 'employee') && (
        <Sidebar role={role} activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
      <main className={cn(
        "flex-1 relative",
        (role === 'admin' || role === 'employee') ? "bg-bg-app" : "bg-white"
      )}>
        {/* Logout helper */}
        <button 
          onClick={logout}
          className="fixed top-4 right-4 z-50 bg-white/50 backdrop-blur p-2 rounded-full border border-border-subtle hover:bg-white transition-colors shadow-sm"
          title="Cerrar Sesión"
        >
          <User size={16} className="text-text-muted" />
        </button>

        {role === 'admin' && <AdminDashboard />}
        {role === 'employee' && <AdminDashboard />}
        {role === 'client' && <ClientDashboard />}
        {role === 'driver' && <DriverDashboard />}
      </main>
    </div>
  );
}

