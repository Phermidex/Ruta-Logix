import React from 'react';
import { LayoutDashboard, Map, Package, Bike, Users, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserRole } from '../lib/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
}

export function Sidebar({ activeTab, setActiveTab, role }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard, roles: ['admin', 'employee'] },
    { id: 'tracking', label: 'Seguimiento', icon: Map, roles: ['admin', 'employee'] },
    { id: 'packages', label: 'Paquetes', icon: Package, roles: ['admin', 'employee', 'client'] },
    { id: 'drivers', label: 'Mensajeros', icon: Bike, roles: ['admin', 'employee'] },
    { id: 'clients', label: 'Clientes', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: ['admin', 'employee', 'driver', 'client'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <nav className="w-64 bg-sidebar text-white flex flex-col h-screen py-6">
      <div className="text-2xl font-extrabold px-6 pb-8 text-[#818cf8] tracking-tight">
        RutaLogix
      </div>
      
      <div className="flex-1 space-y-1">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 opacity-70 hover:opacity-100",
              activeTab === item.id && "bg-white/10 opacity-100 border-l-4 border-primary"
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="px-6 mt-auto">
        <button className="flex items-center gap-3 px-0 py-3 text-sm opacity-70 hover:opacity-100 transition-opacity">
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
}
