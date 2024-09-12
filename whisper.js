const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function generateAudio(text) {
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const outputPath = 'output.mp3';
    await fs.promises.writeFile(outputPath, buffer);

    return outputPath;
  } catch (error) {
    console.error('Erro ao gerar áudio:', error);
    throw error;
  }
}

module.exports = {generateAudio};
