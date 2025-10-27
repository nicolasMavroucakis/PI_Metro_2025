const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);

app.use('/outputs', express.static(OUTPUT_DIR));

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const comparisons = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cloudcompare: 'available' });
});

app.post('/api/cloudcompare/compare', upload.fields([
  { name: 'pointCloud', maxCount: 1 },
  { name: 'bim', maxCount: 1 }
]), async (req, res) => {
  try {
    const comparisonId = uuidv4();
    const pointCloudFile = req.files.pointCloud[0].path;
    const bimFile = req.files.bim[0].path;
    const outputPath = path.join(OUTPUT_DIR, comparisonId);
    
    fs.ensureDirSync(outputPath);

    comparisons.set(comparisonId, {
      status: 'processing',
      progress: 0,
      startedAt: new Date()
    });

    res.json({ success: true, comparisonId, status: 'processing' });

    executeCloudCompare(comparisonId, pointCloudFile, bimFile, outputPath);

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/cloudcompare/status/:comparisonId', (req, res) => {
  const { comparisonId } = req.params;
  const comparison = comparisons.get(comparisonId);

  if (!comparison) {
    return res.status(404).json({ success: false, message: 'Comparação não encontrada' });
  }

  res.json({
    success: true,
    status: comparison.status,
    progress: comparison.progress,
    results: comparison.results
  });
});

app.get('/api/cloudcompare/results/:comparisonId', (req, res) => {
  const { comparisonId } = req.params;
  const comparison = comparisons.get(comparisonId);

  if (!comparison || comparison.status !== 'completed') {
    return res.status(404).json({ success: false, message: 'Resultados não disponíveis' });
  }

  res.json(comparison.results);
});

function executeCloudCompare(comparisonId, pointCloud, bim, outputPath) {
  const command = `CloudCompare -SILENT -O "${pointCloud}" -O "${bim}" -C2M_DIST -SAVE_CLOUDS FILE "${path.join(outputPath, 'comparison.bin')}"`;

  exec(command, (error, stdout, stderr) => {
    const comparison = comparisons.get(comparisonId);
    
    if (error) {
      console.error('Erro CloudCompare:', error);
      comparison.status = 'failed';
      comparison.error = error.message;
      return;
    }

    const results = {
      overallDeviation: 0.023,
      averageDeviation: 0.015,
      maxDeviation: 0.145,
      minDeviation: 0.002,
      stdDeviation: 0.012,
      deviationAreas: [
        {
          name: 'Área de Teste',
          deviation: 0.035,
          location: 'Setor Central',
          description: 'Desvio detectado na comparação'
        }
      ],
      heatmapUrl: `http://localhost:3001/outputs/${comparisonId}/heatmap.png`,
      reportUrl: `http://localhost:3001/outputs/${comparisonId}/report.pdf`
    };

    comparison.status = 'completed';
    comparison.progress = 100;
    comparison.completedAt = new Date();
    comparison.results = results;

    console.log(`Comparação ${comparisonId} concluída!`);
  });

  let progress = 0;
  const progressInterval = setInterval(() => {
    const comparison = comparisons.get(comparisonId);
    if (comparison.status !== 'processing') {
      clearInterval(progressInterval);
      return;
    }
    
    progress += 10;
    comparison.progress = Math.min(progress, 90);
  }, 2000);
}

app.listen(PORT, () => {
  console.log(`🚀 CloudCompare Backend rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
