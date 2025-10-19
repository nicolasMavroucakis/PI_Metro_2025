import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  StatusBar,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import projectService from '@/services/projectService';

const { width: screenWidth } = Dimensions.get('window');
const photoSize = (screenWidth - 48) / 2; // 2 colunas com padding

export default function ProjectDetailsScreen() {
  const { projectId, projectName } = useLocalSearchParams();
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadProjectData();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    // Solicitar permissões para câmera e galeria
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissões necessárias',
        'Este app precisa de acesso à câmera e galeria para funcionar corretamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadProjectData = async () => {
    try {
      // Carregar dados do projeto e fotos em paralelo
      const [projectResult, photosResult] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getProjectPhotos(projectName)
      ]);

      if (projectResult.success) {
        setProject(projectResult.project);
      }

      if (photosResult.success) {
        setPhotos(photosResult.photos);
      } else {
        console.warn('Erro ao carregar fotos:', photosResult.message);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do projeto');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjectData();
    setRefreshing(false);
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Adicionar Foto',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: () => openCamera(),
        },
        {
          text: 'Galeria',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Erro ao abrir câmera');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao abrir galeria:', error);
      Alert.alert('Erro', 'Erro ao abrir galeria');
    }
  };

  const uploadPhoto = async (imageUri) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await projectService.uploadPhoto(
        projectName,
        imageUri,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        Alert.alert('Sucesso', 'Foto enviada com sucesso!');
        // Recarregar fotos
        const photosResult = await projectService.getProjectPhotos(projectName);
        if (photosResult.success) {
          setPhotos(photosResult.photos);
        }
      } else {
        Alert.alert('Erro', result.message);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Erro ao enviar foto');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const openPhotoModal = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const closePhotoModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const deletePhoto = (photo) => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta foto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await projectService.deletePhoto(photo.key);
              if (result.success) {
                Alert.alert('Sucesso', 'Foto removida com sucesso!');
                // Recarregar fotos
                const photosResult = await projectService.getProjectPhotos(projectName);
                if (photosResult.success) {
                  setPhotos(photosResult.photos);
                }
                closePhotoModal();
              } else {
                Alert.alert('Erro', result.message);
              }
            } catch (error) {
              console.error('Erro ao deletar foto:', error);
              Alert.alert('Erro', 'Erro ao remover foto');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <ThemedText style={styles.loadingText}>Carregando projeto...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066CC']}
            tintColor="#0066CC"
          />
        }
      >
        {/* Header do Projeto */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← Voltar</ThemedText>
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.title}>
            {project?.projectName || projectName}
          </ThemedText>
          
          {project && (
            <View style={styles.projectInfo}>
              <ThemedText style={styles.infoText}>
                Status: {project.status || 'N/A'}
              </ThemedText>
              <ThemedText style={styles.infoText}>
                Início: {formatDate(project.startDate)}
              </ThemedText>
              <ThemedText style={styles.infoText}>
                Término: {formatDate(project.endDate)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Seção de Fotos */}
        <View style={styles.photosSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Fotos de Obra ({photos.length})
            </ThemedText>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={showImagePickerOptions}
              disabled={uploading}
            >
              <ThemedText style={styles.addButtonText}>
                {uploading ? 'Enviando...' : '+ Adicionar'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Progress Bar durante upload */}
          {uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
                />
              </View>
              <ThemedText style={styles.progressText}>
                {uploadProgress}%
              </ThemedText>
            </View>
          )}

          {/* Grid de Fotos */}
          {photos.length === 0 ? (
            <View style={styles.emptyPhotos}>
              <ThemedText style={styles.emptyText}>
                📷 Nenhuma foto adicionada ainda
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Toque em "Adicionar" para enviar a primeira foto
              </ThemedText>
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.key}
                  style={styles.photoItem}
                  onPress={() => openPhotoModal(photo)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.photoThumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <ThemedText style={styles.photoDate}>
                      {formatDate(photo.lastModified)}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para visualizar foto em tela cheia */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar hidden />
          
          <TouchableOpacity
            style={styles.modalCloseArea}
            onPress={closePhotoModal}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {selectedPhoto && (
                <>
                  <Image
                    source={{ uri: selectedPhoto.url }}
                    style={styles.modalImage}
                    contentFit="contain"
                  />
                  
                  <View style={styles.modalInfo}>
                    <ThemedText style={styles.modalTitle}>
                      {selectedPhoto.name}
                    </ThemedText>
                    <ThemedText style={styles.modalDetails}>
                      Data: {formatDate(selectedPhoto.lastModified)}
                    </ThemedText>
                    <ThemedText style={styles.modalDetails}>
                      Tamanho: {formatFileSize(selectedPhoto.size)}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deletePhoto(selectedPhoto)}
                    >
                      <ThemedText style={styles.deleteButtonText}>
                        🗑️ Excluir
                      </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closePhotoModal}
                    >
                      <ThemedText style={styles.closeButtonText}>
                        Fechar
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0066CC',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  projectInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    color: '#E3F2FD',
    fontSize: 14,
    marginBottom: 4,
  },
  photosSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
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
  emptyPhotos: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoItem: {
    width: photoSize,
    height: photoSize,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  photoDate: {
    color: '#fff',
    fontSize: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
  modalInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
