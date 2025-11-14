import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader/PageHeader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import projectService from '../services/projectService';
import vertexAIService from '../services/vertexAIService';
import reportService from '../services/reportService';
import '../Style/BimComparison.css';
import {
  ArrowLeft,
  Download,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Ruler,
  AlertTriangle,
  CheckCircle,
  FileText,
  ScrollText,
  Lightbulb,
  Building2,
  HardHat,
  ArrowLeftRight,
  Image,
  AlertCircle,
  XCircle,
  HelpCircle,
  X as CloseIcon
} from 'lucide-react';

function BimComparison() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Estados principais
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para fotos
  const [bimPhotos, setBimPhotos] = useState([]);
  const [obraPhotos, setObraPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  // Estados para seleção (múltiplas para ambos)
  const [selectedBimPhotos, setSelectedBimPhotos] = useState([]); // Array para múltiplas fotos BIM
  const [selectedObraPhotos, setSelectedObraPhotos] = useState([]); // Array para múltiplas fotos Obra

  // Estados para comparação
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [userContext, setUserContext] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '', phase: '' });
  const progressTimerRef = useRef(null);

  const sanitizeFile = (name) => {
    return (name || 'projeto')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  };

  const formatDateForFile = (d = new Date()) => {
    const pad = (n) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yy = String(d.getFullYear()).slice(-2);
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return { date: `${dd}-${mm}-${yy}`, time: `${hh}-${mi}-${ss}` };
  };

  const handleDownloadPdf = async () => {
    try {
      if (!comparisonResult) return;
      const consolidated = comparisonResult.consolidatedAnalysis?.data || comparisonResult.data || {};
      const pairs = comparisonResult.pairComparisons || [];

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      const { date, time } = formatDateForFile(new Date());
      const projectName = project?.projectName || 'Projeto';

      // Cabeçalho
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Relatório de Análise BIM × Obra', 14, 16);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Projeto: ${projectName}`, 14, 25);
      pdf.text(`Data: ${date.replace(/-/g, '/')}`, 14, 31);
      pdf.text(`Horário: ${time.replace(/-/g, ':')}`, 14, 37);

      // Overview
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.text('Resumo Geral', 14, 47);

      pdf.setFont('helvetica', 'normal');
      const resumoY = 53;
      const percentual = consolidated.percentual_conclusao_geral ?? consolidated.percentual_conclusao ?? 0;
      pdf.text(`Percentual Concluído: ${percentual}%`, 14, resumoY);
      if (consolidated.analise_consolidada || consolidated.analise_progresso) {
        const text = consolidated.analise_consolidada || consolidated.analise_progresso;
        const wrapped = pdf.splitTextToSize(text, pageWidth - 28);
        pdf.text(wrapped, 14, resumoY + 7);
      }

      let cursorY = resumoY + 7 + 6 *  (consolidated.analise_consolidada || consolidated.analise_progresso ?  (pdf.splitTextToSize(consolidated.analise_consolidada || consolidated.analise_progresso, pageWidth - 28).length) : 0);
      if (cursorY < 70) cursorY = 70;

      // Distribuição de Percentuais
      if (consolidated.distribuicao_percentuais) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
        pdf.text('Distribuição dos Percentuais', 14, cursorY);
        cursorY += 4;
        autoTable(pdf, {
          startY: cursorY,
          head: [['Mínimo', 'Máximo', 'Média', 'Desvio']],
          body: [[
            `${consolidated.distribuicao_percentuais.minimo ?? '-'}`,
            `${consolidated.distribuicao_percentuais.maximo ?? '-'}`,
            `${consolidated.distribuicao_percentuais.media ?? '-'}`,
            `${consolidated.distribuicao_percentuais.desvio_padrao ?? '-'}`
          ]],
          styles: { fontSize: 10 },
          headStyles: { fillColor: [25, 118, 210] }
        });
        cursorY = pdf.lastAutoTable.finalY + 8;
      }

      // Conformidade Geral
      const conf = consolidated.conformidade_geral || consolidated.conformidade;
      if (conf) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
        pdf.text('Conformidade', 14, cursorY);
        cursorY += 4;
        autoTable(pdf, {
          startY: cursorY,
          head: [['Estrutura', 'Dimensões', 'Acabamento', 'Posicionamento']],
          body: [[
            conf.estrutura ?? 'não_identificado',
            conf.dimensoes ?? 'não_identificado',
            conf.acabamento ?? 'não_identificado',
            conf.posicionamento ?? 'não_identificado'
          ]],
          styles: { fontSize: 10 },
          headStyles: { fillColor: [25, 118, 210] }
        });
        cursorY = pdf.lastAutoTable.finalY + 8;
      }

      // Problemas consolidados / detectados
      const problemas = consolidated.problemas_consolidados || consolidated.problemas_detectados || [];
      if (problemas.length > 0) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
        pdf.text('Problemas Detectados', 14, cursorY);
        cursorY += 4;
        autoTable(pdf, {
          startY: cursorY,
          head: [['Tipo', 'Descrição', 'Severidade', 'Frequência / Pares']],
          body: problemas.map(p => [
            p.tipo || '-', 
            p.descricao || '-', 
            p.severidade || '-', 
            p.frequencia ? `${p.frequencia} ${p.fotos_afetadas ? `(${p.fotos_afetadas.join(',')})` : ''}` : '-'
          ]),
          styles: { fontSize: 10, cellWidth: 'wrap' },
          headStyles: { fillColor: [25, 118, 210] },
          columnStyles: { 1: { cellWidth: 120 } }
        });
        cursorY = pdf.lastAutoTable.finalY + 8;
      }

      // Recomendações
      const recs = consolidated.recomendacoes_prioritarias || consolidated.recomendacoes || [];
      if (recs.length > 0) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
        pdf.text('Recomendações', 14, cursorY);
        cursorY += 4;
        autoTable(pdf, {
          startY: cursorY,
          head: [['Prioridade', 'Ação', 'Justificativa']],
          body: recs.map(r => [r.prioridade || '-', r.acao || '-', r.justificativa || '-']),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [25, 118, 210] },
          columnStyles: { 1: { cellWidth: 100 } }
        });
        cursorY = pdf.lastAutoTable.finalY + 8;
      }

      // Resumo por Par (se houver múltiplos)
      if (pairs.length > 0) {
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
        pdf.text('Resumo por Par', 14, cursorY);
        cursorY += 4;
        autoTable(pdf, {
          startY: cursorY,
          head: [['Par', '%', 'Resumo']],
          body: pairs.map(p => {
            const d = p.analysis?.data || {};
            return [
              String(p.pairIndex),
              String(d.percentual_conclusao ?? '-'),
              (d.analise_progresso || '').slice(0, 140)
            ];
          }),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [25, 118, 210] },
          columnStyles: { 2: { cellWidth: 130 } }
        });
        cursorY = pdf.lastAutoTable.finalY + 8;
      }

      // Rodapé simples com paginação
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(`Projeto: ${projectName}  •  ${date.replace(/-/g,'/')} ${time.replace(/-/g,':')}  •  Página ${i}/${pageCount}`, 14, 290);
      }

      const fileProject = sanitizeFile(projectName);
      const filename = `relatorio-${fileProject}-${date}-${time}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Erro ao gerar PDF estruturado:', err);
      alert('Não foi possível gerar o PDF. Tente novamente.');
    }
  };

  const menuItems = [
    { icon: '🏠', label: 'Home', path: '/home' },
    { icon: '👥', label: 'Gerenciamento de Usuários', path: '/users' },
    { icon: '📊', label: 'Relatórios', path: '/reports' },
    { icon: '➕', label: 'Adicionar Projeto', path: '/add-project' }
  ];

  // Carregar fotos do projeto (definir antes do useEffect para evitar no-use-before-define)
  const loadPhotos = useCallback(async () => {
    try {
      setLoadingPhotos(true);

      // Carregar fotos do BIM (categoria2)
      const bimPhotosData = await projectService.getProjectPhotosById(projectId, 'categoria2', 50);
      setBimPhotos(bimPhotosData);

      // Carregar fotos da obra (categoria1)
      const obraPhotosData = await projectService.getProjectPhotosById(projectId, 'categoria1', 50);
      setObraPhotos(obraPhotosData);

    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      setError('Erro ao carregar fotos do projeto');
    } finally {
      setLoadingPhotos(false);
    }
  }, [projectId]);

  // Carregar dados do projeto
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setError('ID do projeto não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const projectData = await projectService.getProjectById(projectId);
        
        if (!projectData) {
          setError('Projeto não encontrado');
          setLoading(false);
          return;
        }

        setProject(projectData);
        await loadPhotos();
      } catch (err) {
        console.error('Erro ao carregar projeto:', err);
        setError('Erro ao carregar dados do projeto');
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId, loadPhotos]);

  // Carregar fotos do projeto (mantido para referência do local anterior)

  // Toggle seleção de foto BIM (permite múltiplas)
  const toggleBimPhotoSelection = (photo) => {
    setSelectedBimPhotos(prev => {
      const isSelected = prev.some(p => p.url === photo.url);
      if (isSelected) {
        return prev.filter(p => p.url !== photo.url);
      } else {
        return [...prev, photo];
      }
    });
  };

  // Verificar se foto BIM está selecionada
  const isBimPhotoSelected = (photo) => {
    return selectedBimPhotos.some(p => p.url === photo.url);
  };

  // Toggle seleção de foto da obra (permite múltiplas)
  const toggleObraPhotoSelection = (photo) => {
    setSelectedObraPhotos(prev => {
      const isSelected = prev.some(p => p.url === photo.url);
      if (isSelected) {
        return prev.filter(p => p.url !== photo.url);
      } else {
        return [...prev, photo];
      }
    });
  };

  // Verificar se foto Obra está selecionada
  const isObraPhotoSelected = (photo) => {
    return selectedObraPhotos.some(p => p.url === photo.url);
  };

  // Realizar comparação em pares
  const handleCompare = async () => {
    if (selectedBimPhotos.length === 0 || selectedObraPhotos.length === 0) {
      alert('Por favor, selecione pelo menos uma foto do BIM e uma foto da obra para comparar.');
      return;
    }

    // Verificar se a quantidade é diferente e avisar
    if (selectedBimPhotos.length !== selectedObraPhotos.length) {
      const minCount = Math.min(selectedBimPhotos.length, selectedObraPhotos.length);
      const confirmed = window.confirm(
        `Você selecionou ${selectedBimPhotos.length} foto(s) BIM e ${selectedObraPhotos.length} foto(s) da obra.\n\n` +
        `Serão comparados ${minCount} pares.\n` +
        `As fotos extras serão ignoradas.\n\n` +
        `Deseja continuar?`
      );
      if (!confirmed) return;
    }

    if (!vertexAIService.isConfigured()) {
      alert('A API do Google não está configurada. Por favor, configure a chave de API no arquivo .env');
      return;
    }

    try {
      setComparing(true);
      setComparisonResult(null);
      setShowResults(false);
      setProgress({ current: 0, total: 0, message: 'Iniciando comparações em pares...', phase: '' });

      // Determinar quantos pares serão comparados
      const totalPairs = Math.min(selectedBimPhotos.length, selectedObraPhotos.length);
      setProgress({ current: 0, total: totalPairs, message: 'Iniciando comparações em pares...', phase: 'pairs', percent: 0 });

      // Iniciar avanço automático até 56% durante as comparações
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      progressTimerRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev.phase !== 'pairs') return prev;
          const currentPercent = typeof prev.percent === 'number' ? prev.percent : 0;
          if (currentPercent >= 56) return prev;
          const next = Math.min(56, currentPercent + 0.5);
          return { ...prev, percent: next };
        });
      }, 100);

      // Executar comparações em pares em paralelo
      let completed = 0;
      const tasks = Array.from({ length: totalPairs }).map((_, i) => (async () => {
        const bimPhoto = selectedBimPhotos[i];
        const obraPhoto = selectedObraPhotos[i];

        console.log(`Comparando par ${i + 1}/${totalPairs}...`);
        try {
          const result = await vertexAIService.compareImages(
            bimPhoto.url,
            obraPhoto.url,
            `${userContext}\n\nPar ${i + 1}: Comparando "${bimPhoto.fileName}" com "${obraPhoto.fileName}"`
          );

          console.log(`📊 RESULTADO DO PAR ${i + 1}:`, JSON.stringify(result, null, 2));

          if (result.success) {
            if (result.isPartial) {
              console.warn(`⚠️ Par ${i + 1} retornou análise parcial (MAX_TOKENS)`);
            }
            return {
              pairIndex: i + 1,
              bimPhoto: { url: bimPhoto.url, fileName: bimPhoto.fileName },
              obraPhoto: { url: obraPhoto.url, fileName: obraPhoto.fileName },
              analysis: result
            };
          } else {
            throw new Error(result.error || 'Erro desconhecido');
          }
        } catch (pairError) {
          console.error(`❌ Erro no par ${i + 1}:`, pairError);
          const isMaxTokensError = pairError.message?.includes('MAX_TOKENS') || pairError.message?.includes('limite de tokens');
          let errorMessage = pairError.message || 'Erro ao comparar este par';
          if (isMaxTokensError) {
            errorMessage = 'Análise muito detalhada. Tentando análise parcial...';
            console.warn(`⚠️ Par ${i + 1} excedeu limite - análise parcial será usada`);
          }
          return {
            pairIndex: i + 1,
            bimPhoto: { url: bimPhoto.url, fileName: bimPhoto.fileName },
            obraPhoto: { url: obraPhoto.url, fileName: obraPhoto.fileName },
            analysis: {
              success: false,
              error: errorMessage,
              isMaxTokensError: isMaxTokensError
            }
          };
        } finally {
          completed += 1;
          setProgress(prev => ({
            ...prev,
            current: completed,
            total: totalPairs,
            phase: 'pairs',
            message: `Concluído par ${completed} de ${totalPairs}`
          }));
        }
      })());

      const pairComparisons = await Promise.all(tasks);

      // Garantir ordem por índice do par
      pairComparisons.sort((a, b) => a.pairIndex - b.pairIndex);

      // Consolidar todas as comparações
      // Parar avanço automático e levar para 78% ao finalizar os pares
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProgress(prev => ({
        ...prev,
        current: totalPairs,
        total: totalPairs,
        phase: 'consolidation',
        message: 'Consolidando todas as comparações...',
        percent: 78
      }));

      // Montar estrutura esperada pelo serviço de consolidação (com TOON)
      const individualAnalyses = pairComparisons.map((pair) => ({
        imageIndex: pair.pairIndex,
        imageUrl: pair.obraPhoto?.url || '',
        analysis: pair.analysis
      }));

      const consolidatedResult = await vertexAIService.consolidateAnalyses(individualAnalyses, userContext);

      // Consolidador retornou: avançar para 98%
      setProgress(prev => ({ ...prev, phase: 'post_consolidation', message: 'Consolidação concluída. Preparando exibição...', percent: 98 }));

      console.log('🎯 RESULTADO DA CONSOLIDAÇÃO:', JSON.stringify(consolidatedResult, null, 2));

      const result = {
        success: true,
        totalPairs: totalPairs,
        pairComparisons: pairComparisons,
        consolidatedAnalysis: consolidatedResult,
        timestamp: new Date().toISOString()
      };

      console.log('📦 RESULTADO FINAL COMPLETO:', JSON.stringify(result, null, 2));
      console.log('Resultado consolidado:', result);
      setComparisonResult(result);
      setShowResults(true);
      // Só bater 100% quando a interface exibir os resultados
      setTimeout(() => {
        setProgress(prev => ({ ...prev, phase: 'done', message: 'Resultados exibidos', percent: 100 }));
      }, 0);

      // Salvar relatório no DynamoDB
      try {
        const analysisData = consolidatedResult.data;
        
        const bimImagesArray = selectedBimPhotos.slice(0, totalPairs).map(photo => ({
          url: photo.url,
          fileName: photo.fileName,
          category: 'categoria2'
        }));
        
        const obraImagesArray = selectedObraPhotos.slice(0, totalPairs).map(photo => ({
          url: photo.url,
          fileName: photo.fileName,
          category: 'categoria1'
        }));
        
        console.log('💾 Salvando relatório...');
        console.log('🖼️ BIM Images a salvar:', bimImagesArray);
        console.log('🏗️ Obra Images a salvar:', obraImagesArray);
        console.log('📊 Analysis Data:', analysisData);
        console.log('🔄 Pair Comparisons:', pairComparisons);
        
        const reportData = {
          projectId: projectId,
          projectName: project.projectName,
          status: 'success',
          bimImages: bimImagesArray,
          obraImages: obraImagesArray,
          userContext: userContext,
          analysisResult: analysisData,
          pairComparisons: pairComparisons,
          isPairAnalysis: true,
          totalPairs: totalPairs,
          userId: localStorage.getItem('userId') || 'guest',
          userName: localStorage.getItem('userName') || 'Usuário'
        };
        
        console.log('📦 Dados completos do relatório a salvar:', reportData);
        
        const saveResult = await reportService.saveReport(reportData);
        
        if (saveResult.success) {
          console.log('✅ Relatório salvo com sucesso:', saveResult.reportId);
        } else {
          console.warn('⚠️ Erro ao salvar relatório:', saveResult.error);
        }
      } catch (saveError) {
        console.error('❌ Erro ao salvar relatório:', saveError);
      }

    } catch (err) {
      console.error('Erro ao comparar imagens:', err);
      alert('Erro ao realizar comparações. Tente novamente.');
    } finally {
      setComparing(false);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  };

  // Resetar seleções
  const handleReset = () => {
    setSelectedBimPhotos([]);
    setSelectedObraPhotos([]);
    setComparisonResult(null);
    setShowResults(false);
    setUserContext('');
    setProgress({ current: 0, total: 0, message: '', phase: '' });
  };

  // Obter cor da severidade
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'baixa':
        return '#4CAF50';
      case 'média':
      case 'media':
        return '#FF9800';
      case 'alta':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Obter ícone de conformidade
  const getConformityIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'conforme':
        return <CheckCircle size={24} className="conformity-icon-success" />;
      case 'não_conforme':
      case 'nao_conforme':
        return <XCircle size={24} className="conformity-icon-danger" />;
      case 'parcialmente_conforme':
        return <AlertCircle size={24} className="conformity-icon-warning" />;
      default:
        return <HelpCircle size={24} className="conformity-icon-default" />;
    }
  };

  // Traduzir status de conformidade
  const translateConformityStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'conforme':
        return 'Conforme';
      case 'não_conforme':
      case 'nao_conforme':
        return 'Não Conforme';
      default:
        return 'Não Identificado';
    }
  };

  if (loading) {
    return (
      <Layout menuItems={menuItems}>
        <div className="bim-comparison-loading">
          <p>Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout menuItems={menuItems}>
        <div className="bim-comparison-error">
          <p>{error}</p>
          <button onClick={() => navigate(`/project/${projectId}`)}>
            Voltar ao Projeto
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout menuItems={menuItems}>
      <div className="bim-comparison-container">
        <PageHeader
          title="Comparação BIM com IA"
          subtitle={project?.projectName}
          headerStyle="bim-header-style"
        >
          <button 
            className="back-button"
            onClick={() => navigate(`/project/${projectId}`)}
          >
            <ArrowLeft size={18} /> Voltar
          </button>
        </PageHeader>

        <main className="bim-comparison-main">
          {/* Seção de Seleção de Fotos */}
          <section className="selection-section">
            <h2>Selecione as Imagens para Comparar</h2>
            
            <div className="selection-grid">
              {/* Seleção de Fotos do BIM (Múltiplas) */}
              <div className="selection-column">
                <h3><Building2 size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos do Modelo BIM (Múltiplas)</h3>
                <p className="multi-select-hint">
                  <Lightbulb size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Clique para selecionar/desselecionar múltiplas fotos
                </p>
                {loadingPhotos ? (
                  <p>Carregando fotos...</p>
                ) : bimPhotos.length === 0 ? (
                  <div className="no-photos">
                    <p>Nenhuma foto do BIM disponível</p>
                    <p className="hint">Adicione fotos do BIM no projeto primeiro</p>
                  </div>
                ) : (
                  <>
                    <div className="photo-grid">
                      {bimPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className={`photo-item ${isBimPhotoSelected(photo) ? 'selected' : ''}`}
                          onClick={() => toggleBimPhotoSelection(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {isBimPhotoSelected(photo) && <span className="check-icon">✓</span>}
                          </div>
                          {isBimPhotoSelected(photo) && (
                            <div className="photo-number">
                              {selectedBimPhotos.findIndex(p => p.url === photo.url) + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedBimPhotos.length > 0 && (
                      <div className="selected-photo-info">
                        ✓ {selectedBimPhotos.length} foto(s) BIM selecionada(s)
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Seleção de Fotos da Obra (Múltiplas) */}
              <div className="selection-column">
                <h3><HardHat size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra Real (Múltiplas)</h3>
                <p className="multi-select-hint">
                  <Lightbulb size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Clique para selecionar/desselecionar múltiplas fotos
                </p>
                {loadingPhotos ? (
                  <p>Carregando fotos...</p>
                ) : obraPhotos.length === 0 ? (
                  <div className="no-photos">
                    <p>Nenhuma foto da obra disponível</p>
                    <p className="hint">Adicione fotos da obra no projeto primeiro</p>
                  </div>
                ) : (
                  <>
                    <div className="photo-grid">
                      {obraPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className={`photo-item ${isObraPhotoSelected(photo) ? 'selected' : ''}`}
                          onClick={() => toggleObraPhotoSelection(photo)}
                        >
                          <img src={photo.url} alt={photo.fileName} />
                          <div className="photo-overlay">
                            {isObraPhotoSelected(photo) && <span className="check-icon">✓</span>}
                          </div>
                          {isObraPhotoSelected(photo) && (
                            <div className="photo-number">
                              {selectedObraPhotos.findIndex(p => p.url === photo.url) + 1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedObraPhotos.length > 0 && (
                      <div className="selected-photo-info">
                        ✓ {selectedObraPhotos.length} foto(s) selecionada(s)
                        {selectedObraPhotos.length > 1 && (
                          <span style={{ marginLeft: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                            (Análise Múltipla)
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Campo de Contexto Adicional */}
            <div className="context-section">
              <h3><FileText size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Informações Adicionais (Opcional)</h3>
              <p className="context-hint">
                Forneça detalhes adicionais sobre a obra que podem ajudar na análise (ex: problemas conhecidos, materiais específicos, etapa da construção, etc.)
              </p>
              <textarea
                className="context-input"
                placeholder="Exemplo: Esta é a área de entrada principal. O teto ainda não foi instalado conforme cronograma. Estamos usando vigas de aço A36..."
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="character-count">
                {userContext.length}/500 caracteres
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="action-buttons">
              <button
                className="btn-compare"
                onClick={handleCompare}
                disabled={selectedBimPhotos.length === 0 || selectedObraPhotos.length === 0 || comparing}
              >
                {comparing ? (<><RefreshCw size={18} className="animate-spin" style={{ verticalAlign: 'middle', marginRight: 6 }} /> Analisando...</>) : 
                 selectedBimPhotos.length > 0 && selectedObraPhotos.length > 0 
                   ? (<><ArrowLeftRight size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {`Comparar ${Math.min(selectedBimPhotos.length, selectedObraPhotos.length)} Par(es)`}</>) 
                   : (<><ArrowLeftRight size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Comparar com IA</>)}
              </button>
              <button
                className="btn-reset"
                onClick={handleReset}
                disabled={comparing}
              >
                <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Resetar
              </button>
            </div>

            {/* Info de Pares */}
            {selectedBimPhotos.length > 0 && selectedObraPhotos.length > 0 && !comparing && (
              <div className="pairs-info">
                {selectedBimPhotos.length === selectedObraPhotos.length ? (
                  <p className="info-message success">
                    <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> {selectedBimPhotos.length} par(es) será(ão) comparado(s)
                  </p>
                ) : (
                  <p className="info-message warning">
                    <AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Você selecionou {selectedBimPhotos.length} BIM e {selectedObraPhotos.length} Obra. 
                    Serão comparados {Math.min(selectedBimPhotos.length, selectedObraPhotos.length)} pares.
                  </p>
                )}
              </div>
            )}

            {/* Barra de Progresso */}
            {comparing && progress.total > 0 && (
              <div className="progress-section">
                <h3>
                  {progress.phase === 'pairs' ? (<><Image size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Comparando Pares</>) : (<><RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Consolidando Comparações</>)}
                </h3>
                <p className="progress-message">{progress.message}</p>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(() => {
                      if (typeof progress.percent === 'number') return progress.percent;
                      if (progress.phase === 'pairs' && progress.total > 0) {
                        const fraction = Math.min(progress.current / progress.total, 1);
                        return Math.floor(fraction * 78);
                      }
                      if (progress.phase === 'consolidation') return 78;
                      if (progress.phase === 'post_consolidation') return 98;
                      if (progress.phase === 'done') return 100;
                      return 0;
                    })()}%` }}
                  />
                </div>
                <p className="progress-stats">
                  {progress.current} de {progress.total} ({(() => {
                    if (typeof progress.percent === 'number') return progress.percent;
                    if (progress.phase === 'pairs' && progress.total > 0) {
                      const fraction = Math.min(progress.current / progress.total, 1);
                      return Math.floor(fraction * 78);
                    }
                    if (progress.phase === 'consolidation') return 78;
                    if (progress.phase === 'post_consolidation') return 98;
                    if (progress.phase === 'done') return 100;
                    return 0;
                  })()}%)
                </p>
              </div>
            )}
          </section>

          {/* Seção de Resultados */}
          {showResults && comparisonResult && (() => {
            // Determinar se é análise em pares
            const isPairAnalysis = comparisonResult.totalPairs >= 1;
            const consolidatedData = comparisonResult.consolidatedAnalysis?.data || comparisonResult.data || comparisonResult;
            
            return (
              <section className="results-section">
                <div className="results-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0 }}><BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Resultados da Análise</h2>
                  <button
                    onClick={handleDownloadPdf}
                    className="btn-download-pdf"
                    title="Baixar relatório em PDF"
                    style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#1976D2', color: '#fff', cursor: 'pointer' }}
                  >
                    <Download size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Baixar PDF
                  </button>
                </div>
                {isPairAnalysis && comparisonResult.totalPairs > 1 && (
                  <p className="analysis-type-badge">
                    <RefreshCw size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Análise em Pares - {comparisonResult.totalPairs} comparações realizadas
                  </p>
                )}

                {/* Progresso Geral */}
                <div className="result-card progress-card">
                  <div className="card-header">
                    <h3><TrendingUp size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Progresso da Obra {isPairAnalysis && comparisonResult.totalPairs > 1 && '(Consolidado)'}</h3>
                  </div>
                  <div className="progress-content">
                    <div className="progress-circle-large">
                      <svg viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth="12"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#1976D2"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${((consolidatedData.percentual_conclusao_geral || consolidatedData.percentual_conclusao || 0)) * 5.03} 503`}
                          transform="rotate(-90 100 100)"
                        />
                      </svg>
                      <div className="progress-text-large">
                        <span className="percentage">
                          {consolidatedData.percentual_conclusao_geral || consolidatedData.percentual_conclusao || 0}%
                        </span>
                        <span className="label">Concluído</span>
                      </div>
                    </div>
                    <div className="progress-description">
                      <p>{consolidatedData.analise_consolidada || consolidatedData.analise_progresso}</p>
                    </div>
                  </div>
                </div>

                {/* Distribuição de Percentuais (só para múltiplos pares) */}
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.distribuicao_percentuais && (
                  <div className="result-card distribution-card">
                    <div className="card-header">
                      <h3><BarChart3 size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Distribuição dos Percentuais</h3>
                    </div>
                    <div className="distribution-grid">
                      <div className="distribution-item">
                        <strong>Mínimo</strong>
                        <p className="value">{consolidatedData.distribuicao_percentuais.minimo}%</p>
                      </div>
                      <div className="distribution-item">
                        <strong>Máximo</strong>
                        <p className="value">{consolidatedData.distribuicao_percentuais.maximo}%</p>
                      </div>
                      <div className="distribution-item">
                        <strong>Média</strong>
                        <p className="value">{consolidatedData.distribuicao_percentuais.media}%</p>
                      </div>
                      <div className="distribution-item">
                        <strong>Desvio</strong>
                        <p className="value">±{consolidatedData.distribuicao_percentuais.desvio_padrao?.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conformidade */}
                <div className="result-card conformity-card">
                  <div className="card-header">
                    <h3><Ruler size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Análise de Conformidade {isPairAnalysis && comparisonResult.totalPairs > 1 && '(Geral)'}</h3>
                  </div>
                  <div className="conformity-grid">
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.estrutura)}</span>
                      <div>
                        <strong>Estrutura</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.estrutura)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.dimensoes)}</span>
                      <div>
                        <strong>Dimensões</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.dimensoes)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.acabamento)}</span>
                      <div>
                        <strong>Acabamento</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.acabamento)}</p>
                      </div>
                    </div>
                    <div className="conformity-item">
                      <span className="conformity-icon">{getConformityIcon((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.posicionamento)}</span>
                      <div>
                        <strong>Posicionamento</strong>
                        <p>{translateConformityStatus((consolidatedData.conformidade_geral || consolidatedData.conformidade)?.posicionamento)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Áreas Críticas (só para múltiplos pares) */}
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.areas_criticas && consolidatedData.areas_criticas.length > 0 && (
                  <div className="result-card critical-areas-card">
                    <div className="card-header">
                      <h3><AlertTriangle size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Áreas Críticas</h3>
                    </div>
                    <ul className="critical-areas-list">
                      {consolidatedData.areas_criticas.map((area, index) => (
                        <li key={index} className="critical-item">{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pontos Positivos (só para múltiplos pares) */}
                {isPairAnalysis && comparisonResult.totalPairs > 1 && consolidatedData.pontos_positivos && consolidatedData.pontos_positivos.length > 0 && (
                  <div className="result-card positive-points-card">
                    <div className="card-header">
                      <h3><CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Pontos Positivos</h3>
                    </div>
                    <ul className="positive-points-list">
                      {consolidatedData.pontos_positivos.map((ponto, index) => (
                        <li key={index} className="positive-item">{ponto}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Problemas Detectados */}
                {(consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados) && 
                 (consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados).length > 0 && (
                  <div className="result-card problems-card">
                    <div className="card-header">
                      <h3><AlertCircle size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Problemas e Anomalias Detectados</h3>
                    </div>
                    <div className="problems-list">
                      {(consolidatedData.problemas_consolidados || consolidatedData.problemas_detectados).map((problema, index) => (
                        <div key={index} className="problem-item">
                          <div 
                            className="severity-indicator"
                            style={{ backgroundColor: getSeverityColor(problema.severidade) }}
                          />
                          <div className="problem-content">
                            <div className="problem-header">
                              <strong>{problema.tipo}</strong>
                              <span 
                                className="severity-badge"
                                style={{ backgroundColor: getSeverityColor(problema.severidade) }}
                              >
                                {problema.severidade}
                              </span>
                            </div>
                            <p>{problema.descricao}</p>
                            {problema.frequencia && (
                              <p className="problem-frequency">
                                <small><BarChart3 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {problema.frequencia}</small>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observações Gerais */}
                {consolidatedData.observacoes_gerais && (
                  <div className="result-card observations-card">
                    <div className="card-header">
                      <h3><FileText size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Observações Gerais</h3>
                    </div>
                    <div className="observations-content">
                      <p>{consolidatedData.observacoes_gerais}</p>
                    </div>
                  </div>
                )}

                {/* Justificativa do Percentual (novo campo) */}
                {consolidatedData.justificativa_percentual && (
                  <div className="result-card justification-card">
                    <div className="card-header">
                      <h3><ScrollText size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Justificativa do Percentual</h3>
                    </div>
                    <div className="justification-content">
                      <p style={{ fontStyle: 'italic' }}>{consolidatedData.justificativa_percentual}</p>
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {((consolidatedData.recomendacoes_prioritarias && consolidatedData.recomendacoes_prioritarias.length > 0) ||
                  (consolidatedData.recomendacoes && consolidatedData.recomendacoes.length > 0)) && (
                  <div className="result-card recommendations-card">
                    <div className="card-header">
                      <h3><Lightbulb size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Recomendações {isPairAnalysis && comparisonResult.totalPairs > 1 && 'Prioritárias'}</h3>
                    </div>
                    {consolidatedData.recomendacoes_prioritarias ? (
                      <div className="priority-recommendations">
                        {consolidatedData.recomendacoes_prioritarias.map((rec, index) => (
                          <div key={index} className={`priority-rec priority-${rec.prioridade}`}>
                            <div className="rec-header">
                              <strong>[{rec.prioridade?.toUpperCase()}]</strong> {rec.acao}
                            </div>
                            <p className="rec-justification">{rec.justificativa}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="recommendations-list">
                        {consolidatedData.recomendacoes.map((recomendacao, index) => (
                          <li key={index}>{recomendacao}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Pares Analisados */}
                {isPairAnalysis && comparisonResult.pairComparisons && (
                  <div className="result-card individual-analyses-card">
                    <div className="card-header">
                      <h3><RefreshCw size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Comparações por Par</h3>
                    </div>
                    <div className="individual-analyses-grid">
                      {comparisonResult.pairComparisons.map((pair) => (
                        <div key={pair.pairIndex} className="individual-analysis-item pair-item">
                          <h4>
                            Par {pair.pairIndex}
                            {pair.analysis.isPartial && (
                              <span className="partial-badge" title="Análise resumida devido a limitação de resposta">
                                <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Parcial
                              </span>
                            )}
                          </h4>
                          <div className="pair-files">
                            <div className="pair-file">
                              <span className="file-icon"><Building2 size={18} /></span>
                              <span className="file-name" title={pair.bimPhoto.fileName}>
                                {pair.bimPhoto.fileName.substring(0, 20)}...
                              </span>
                            </div>
                            <div className="pair-arrow"><ArrowLeftRight size={18} /></div>
                            <div className="pair-file">
                              <span className="file-icon"><HardHat size={18} /></span>
                              <span className="file-name" title={pair.obraPhoto.fileName}>
                                {pair.obraPhoto.fileName.substring(0, 20)}...
                              </span>
                            </div>
                          </div>
                          {pair.analysis.success && pair.analysis.data ? (
                            <>
                              <div className="individual-score">
                                {pair.analysis.data.percentual_conclusao}%
                              </div>
                              <p className="individual-summary">
                                {pair.analysis.data.analise_progresso?.substring(0, 120)}...
                              </p>
                              <div className="individual-stats">
                                <span><AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {pair.analysis.data.problemas_detectados?.length || 0} problemas</span>
                              </div>
                            </>
                          ) : (
                            <p className="error-message"><CloseIcon size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {pair.analysis.error || 'Erro na análise'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Imagens Comparadas */}
                <div className="result-card images-card">
                  <div className="card-header">
                    <h3><Image size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Imagens Analisadas ({comparisonResult.totalPairs || 1} Par{comparisonResult.totalPairs > 1 ? 'es' : ''})</h3>
                  </div>
                  <div className="compared-images">
                    <div className="compared-image-item">
                      <h4><Building2 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Modelos BIM ({selectedBimPhotos.length})</h4>
                      <div className="multiple-images-preview">
                        {selectedBimPhotos.slice(0, 4).map((photo, index) => (
                          <img key={index} src={photo.url} alt={`BIM ${index + 1}`} className="thumb" />
                        ))}
                        {selectedBimPhotos.length > 4 && (
                          <div className="more-images">+{selectedBimPhotos.length - 4}</div>
                        )}
                      </div>
                    </div>
                    <div className="compared-image-item">
                      <h4><HardHat size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Fotos da Obra ({selectedObraPhotos.length})</h4>
                      <div className="multiple-images-preview">
                        {selectedObraPhotos.slice(0, 4).map((photo, index) => (
                          <img key={index} src={photo.url} alt={`Obra ${index + 1}`} className="thumb" />
                        ))}
                        {selectedObraPhotos.length > 4 && (
                          <div className="more-images">+{selectedObraPhotos.length - 4}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
        </main>
      </div>
    </Layout>
  );
}

export default BimComparison;

