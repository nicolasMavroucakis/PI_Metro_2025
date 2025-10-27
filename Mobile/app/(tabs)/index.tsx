import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import projectService from '@/services/projectService';

export default function ProjectsScreen() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const result = await projectService.getAllProjects();
      if (result.success) {
        setProjects(result.projects);
      } else {
        Alert.alert('Erro', result.message || 'Erro ao carregar projetos');
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      Alert.alert('Erro', 'Erro ao carregar projetos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project) => {
    router.push({
      pathname: '/project-details',
      params: { 
        projectId: project.projectId,
        projectName: project.projectName 
      }
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'em andamento':
        return '#4CAF50';
      case 'concluído':
        return '#2196F3';
      case 'pausado':
        return '#FF9800';
      case 'cancelado':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity 
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectHeader}>
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.projectImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <ThemedText style={styles.placeholderText}>📋</ThemedText>
          </View>
        )}
        
        <View style={styles.projectInfo}>
          <ThemedText type="subtitle" style={styles.projectName}>
            {item.projectName}
          </ThemedText>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>
              {item.status || 'N/A'}
            </ThemedText>
          </View>
        </View>
      </View>
      
      <View style={styles.projectDetails}>
        <View style={styles.dateRow}>
          <ThemedText style={styles.dateLabel}>Início:</ThemedText>
          <ThemedText style={styles.dateValue}>
            {formatDate(item.startDate)}
          </ThemedText>
        </View>
        
        <View style={styles.dateRow}>
          <ThemedText style={styles.dateLabel}>Término:</ThemedText>
          <ThemedText style={styles.dateValue}>
            {formatDate(item.endDate)}
          </ThemedText>
        </View>
        
        {item.description && (
          <ThemedText style={styles.description} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}
      </View>
      
      <View style={styles.projectFooter}>
        <ThemedText style={styles.tapHint}>
          Toque para ver fotos de obra →
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <ThemedText style={styles.loadingText}>Carregando projetos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ThemedText type="title" style={styles.title}>
              Projetos Metro SP
            </ThemedText>
            {user && (
              <ThemedText style={styles.userText}>
                👤 {user.username}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText}>🚪 Sair</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.subtitle}>
          Selecione um projeto para ver as fotos de obra
        </ThemedText>
      </View>

      {projects.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Nenhum projeto encontrado
          </ThemedText>
          <TouchableOpacity style={styles.refreshButton} onPress={loadProjects}>
            <ThemedText style={styles.refreshButtonText}>
              Tentar novamente
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.projectId}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066CC']}
              tintColor="#0066CC"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#0066CC',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userText: {
    color: '#E3F2FD',
    fontSize: 14,
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#E3F2FD',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  projectImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeholderText: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  projectFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  tapHint: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
