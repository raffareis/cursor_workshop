require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const {generateAudiobookDescription} = require('./vision');
const {generateAudio} = require('./whisper');

const app = express();
const port = 3000;

console.warn('Iniciando o servidor...');

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.warn('Criando diretório de uploads:' + JSON.stringify(uploadsDir));
  fs.mkdirSync(uploadsDir);
}

// Configurar o multer para upload de arquivos
const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Tipo de arquivo inválido. Apenas JPEG e PNG são permitidos.')
      );
    }
  },
});

app.use(express.static(path.join(__dirname, 'web')));
app.use(express.json());

// Rota para a página inicial
app.get('/', (req, res) => {
  console.warn('Requisição recebida para a página inicial');
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Rota para processar a imagem
app.post('/process', upload.single('image'), async (req, res) => {
  console.warn('Requisição recebida para processar imagem');
  try {
    console.warn('Arquivo recebido:', req.file);
    const imagePath = req.file.path;
    console.warn('Lendo arquivo de imagem:' + JSON.stringify(imagePath));
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.warn(
      'Imagem convertida para base64:' + JSON.stringify(base64Image)
    );

    console.warn('Gerando descrição do audiobook...');
    const description = await generateAudiobookDescription(base64Image);
    console.warn('Descrição gerada:' + JSON.stringify(description));

    console.warn('Gerando áudio...');
    const audioPath = await generateAudio(description);
    console.warn('Áudio gerado:' + JSON.stringify(audioPath));

    // Limpar o arquivo de upload
    console.warn('Removendo arquivo de upload:' + JSON.stringify(imagePath));
    fs.unlinkSync(imagePath);

    console.warn('Enviando resposta com o caminho do áudio');
    res.json({audioPath: audioPath});
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    res.status(500).json({error: 'Erro ao processar imagem'});
  }
});

// Rota para servir o arquivo de áudio
app.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, filename);
  console.warn('Requisição para servir áudio:' + JSON.stringify(filePath));
  res.sendFile(filePath);
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
