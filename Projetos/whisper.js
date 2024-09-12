const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function generateAudio(text) {
  console.log('Iniciando geração de áudio');
  try {
    console.log('Enviando requisição para a API de Text-to-Speech do OpenAI');
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    console.log('Resposta recebida da API de Text-to-Speech');
    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = path.join(__dirname, 'output.mp3');
    console.log('Salvando arquivo de áudio em:', outputPath);
    await fs.promises.writeFile(outputPath, buffer);

    console.log('Arquivo de áudio salvo com sucesso');
    return 'output.mp3';
  } catch (error) {
    console.error('Erro ao gerar áudio:', error);
    throw error;
  }
}

module.exports = {generateAudio};
