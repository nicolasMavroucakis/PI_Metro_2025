import React from 'react';
import { Home, Users, FileText, PlusCircle } from 'lucide-react';

export const menuItemsConfig = [
  { 
    icon: <Home size={22} strokeWidth={2} />, 
    label: 'Home', 
    path: '/home' 
  },
  { 
    icon: <Users size={22} strokeWidth={2} />, 
    label: 'Gerenciamento de Usuários', 
    path: '/users' 
  },
  { 
    icon: <FileText size={22} strokeWidth={2} />, 
    label: 'Relatórios', 
    path: '/reports' 
  },
  { 
    icon: <PlusCircle size={22} strokeWidth={2} />, 
    label: 'Adicionar Projeto', 
    path: '/add-project' 
  }
];
