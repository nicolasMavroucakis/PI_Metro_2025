import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userService from '../services/userService'; // Serviço AWS DynamoDB APENAS

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar se existe usuário logado ao inicializar
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ Usuário já autenticado:', parsedUser.username);
      } else {
        console.log('ℹ️ Nenhum usuário autenticado encontrado');
      }
    } catch (error) {
      console.error('Erro ao verificar estado de autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log('🔐 Tentando fazer login...');
      
      const result = await userService.authenticateUser(username, password);
      
      if (result.success) {
        // Salvar dados do usuário e token no AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        await AsyncStorage.setItem('authToken', 'authenticated_' + Date.now());
        
        setUser(result.user);
        setIsAuthenticated(true);
        
        console.log('✅ Login realizado com sucesso:', result.user.username);
        return { success: true, message: result.message };
      } else {
        console.log('❌ Falha no login:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Erro durante o login:', error);
      return { 
        success: false, 
        message: 'Erro de conexão. Verifique sua internet.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Remover dados do AsyncStorage
      await AsyncStorage.multiRemove(['user', 'authToken']);
      
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro durante o logout:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    checkAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
