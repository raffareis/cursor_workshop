const OpenAI = require('openai');

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

async function generateAudiobookDescription(base64Image) {
  console.log('Iniciando geração de descrição do audiobook');
  try {
    console.log('Enviando requisição para a API do OpenAI');
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Descreva esta imagem de quadrinho como se fosse um audiolivro. Inclua detalhes visuais importantes e narre os diálogos de forma fluida.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    console.log('Resposta recebida da API do OpenAI');
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar descrição:', error);
    throw error;
  }
}

module.exports = {generateAudiobookDescription};
