import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import projectService from '@/services/projectService';
import documentService from '@/services/documentService';

export default function DocumentsScreen() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadDocuments();
    }
  }, [selectedProject, currentPath]);

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

  const loadDocuments = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const result = await documentService.listDocuments(selectedProject.projectName, currentPath);
      
      if (result.success) {
        setFolders(result.folders);
        setFiles(result.files);
        setBreadcrumb(result.breadcrumb);
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      Alert.alert('Erro', 'Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedProject) {
      await loadDocuments();
    } else {
      await loadProjects();
    }
    setRefreshing(false);
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    setCurrentPath('');
  };

  const goBack = () => {
    if (currentPath === '') {
      setSelectedProject(null);
      setFolders([]);
      setFiles([]);
      setBreadcrumb([]);
    } else {
      const pathParts = currentPath.split('/').filter(part => part !== '');
      pathParts.pop();
      const parentPath = pathParts.length > 0 ? pathParts.join('/') + '/' : '';
      setCurrentPath(parentPath);
    }
  };

  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
  };

  const navigateToBreadcrumb = (path) => {
    setCurrentPath(path);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const result = await documentService.createFolder(
        selectedProject.projectName,
        currentPath,
        newFolderName.trim()
      );

      if (result.success) {
        setShowNewFolderModal(false);
        setNewFolderName('');
        await loadDocuments();
        Alert.alert('Sucesso', 'Pasta criada com sucesso!');
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      Alert.alert('Erro', 'Erro ao criar pasta');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        await uploadDocument(file);
      }
    } catch (error) {
      console.error('Erro ao selecionar documento:', error);
      Alert.alert('Erro', 'Erro ao selecionar documento');
    }
  };

  const uploadDocument = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await documentService.uploadDocument(
        selectedProject.projectName,
        currentPath,
        file.uri,
        file.name,
        file.mimeType,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        Alert.alert('Sucesso', 'Documento enviado com sucesso!');
        await loadDocuments();
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Erro ao enviar documento');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFilePress = async (file) => {
    Alert.alert(
      file.name,
      `Tamanho: ${documentService.formatFileSize(file.size)}\nData: ${new Date(file.lastModified).toLocaleDateString('pt-BR')}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir',
          onPress: () => {
            // Abrir arquivo (implementar se necessário)
            Alert.alert('Info', 'Funcionalidade de visualização será implementada em breve');
          }
        }
      ]
    );
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => selectProject(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectIcon}>
        <ThemedText style={styles.projectIconText}>📁</ThemedText>
      </View>
      <View style={styles.projectInfo}>
        <ThemedText type="subtitle" style={styles.projectName}>
          {item.projectName}
        </ThemedText>
        <ThemedText style={styles.projectStatus}>
          {item.status || 'N/A'}
        </ThemedText>
      </View>
      <ThemedText style={styles.arrowIcon}>→</ThemedText>
    </TouchableOpacity>
  );

  const renderFolder = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigateToFolder(item.path)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <ThemedText style={styles.iconText}>📁</ThemedText>
      </View>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemType}>Pasta</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const renderFile = ({ item }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleFilePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemIcon}>
        <ThemedText style={styles.iconText}>
          {documentService.getFileIcon(item.extension)}
        </ThemedText>
      </View>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.itemDetails}>
          {documentService.formatFileSize(item.size)} • {item.extension.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.itemDate}>
          {new Date(item.lastModified).toLocaleDateString('pt-BR')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  if (loading && !selectedProject) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <ThemedText style={styles.loadingText}>Carregando projetos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectedProject && (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <ThemedText style={styles.backButtonText}>← Voltar</ThemedText>
          </TouchableOpacity>
        )}
        
        <ThemedText type="title" style={styles.title}>
          {selectedProject ? `Documentos - ${selectedProject.projectName}` : 'Documentos'}
        </ThemedText>

        {selectedProject && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowNewFolderModal(true)}
            >
              <ThemedText style={styles.actionButtonText}>📁 Pasta</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDocumentUpload}
              disabled={uploading}
            >
              <ThemedText style={styles.actionButtonText}>
                {uploading ? 'Enviando...' : '📤 Upload'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Breadcrumb */}
      {selectedProject && breadcrumb.length > 1 && (
        <View style={styles.breadcrumbContainer}>
          <FlatList
            data={breadcrumb}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.breadcrumbItem}>
                <TouchableOpacity onPress={() => navigateToBreadcrumb(item.path)}>
                  <ThemedText style={styles.breadcrumbText}>{item.name}</ThemedText>
                </TouchableOpacity>
                {index < breadcrumb.length - 1 && (
                  <ThemedText style={styles.breadcrumbSeparator}> › </ThemedText>
                )}
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      )}

      {/* Progress Bar durante upload */}
      {uploading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <ThemedText style={styles.progressText}>{uploadProgress}%</ThemedText>
        </View>
      )}

      {/* Content */}
      {!selectedProject ? (
        // Lista de Projetos
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                Nenhum projeto encontrado
              </ThemedText>
            </View>
          }
        />
      ) : (
        // Lista de Documentos
        <FlatList
          data={[...folders, ...files]}
          renderItem={({ item }) => 
            item.type === 'folder' ? renderFolder({ item }) : renderFile({ item })
          }
          keyExtractor={(item) => item.type === 'folder' ? item.path : item.key}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0066CC']}
              tintColor="#0066CC"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                📂 Pasta vazia
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Use os botões acima para adicionar documentos ou criar pastas
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Modal para Nova Pasta */}
      <Modal
        visible={showNewFolderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Nova Pasta
            </ThemedText>
            
            <TextInput
              style={styles.textInput}
              placeholder="Nome da pasta"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                <ThemedText style={styles.createButtonText}>Criar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#0066CC',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  breadcrumbContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    color: '#666',
    fontSize: 14,
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  projectIconText: {
    fontSize: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 14,
    color: '#666',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#0066CC',
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  itemDetails: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#0066CC',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
