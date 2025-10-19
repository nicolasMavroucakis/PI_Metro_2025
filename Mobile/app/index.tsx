import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function InitialScreen() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Se já estiver autenticado, vai para as tabs
        router.replace('/(tabs)');
      } else {
        // Se não estiver autenticado, vai para o login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading]);

  // Mostra loading enquanto verifica o estado de autenticação
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976D2" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
