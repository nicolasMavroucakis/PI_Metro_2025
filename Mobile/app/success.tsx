import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SuccessScreen() {
  const { user, logout } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const navigateToTabs = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo/Ícone de sucesso */}
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Mensagem de boas-vindas */}
        <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
        <Text style={styles.userName}>{user?.name || user?.username}</Text>
        <Text style={styles.successMessage}>
          Login realizado com sucesso
        </Text>

        {/* Informações do sistema */}
        <View style={styles.systemInfo}>
          <Text style={styles.systemTitle}>METRÔ SP</Text>
          <Text style={styles.systemSubtitle}>Sistema de Gestão</Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={navigateToTabs}
          >
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>SAIR</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1976D2', // Azul principal
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  checkmark: {
    fontSize: 50,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  userName: {
    fontSize: 24,
    color: '#E3F2FD',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  successMessage: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  systemInfo: {
    alignItems: 'center',
    marginBottom: 50,
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    width: '100%',
  },
  systemTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 5,
  },
  systemSubtitle: {
    fontSize: 16,
    color: '#E3F2FD',
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  continueButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#1976D2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
