const {generateAudiobookDescription} = require('../vision');
const OpenAI = require('openai');

jest.mock('openai');

describe('generateAudiobookDescription', () => {
  let mockCreate;

  beforeEach(() => {
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));
  });

  it('deve gerar uma descrição de audiobook com sucesso', async () => {
    const mockResponse = {
      choices: [{message: {content: 'Descrição do audiobook'}}],
    };
    mockCreate.mockResolvedValue(mockResponse);

    const base64Image = 'mockBase64Image';
    const result = await generateAudiobookDescription(base64Image);

    expect(mockCreate).toHaveBeenCalledWith({
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
    expect(result).toBe('Descrição do audiobook');
  });

  it('deve lançar um erro quando a API falha', async () => {
    const mockError = new Error('Erro da API');
    mockCreate.mockRejectedValue(mockError);

    await expect(
      generateAudiobookDescription('mockBase64Image')
    ).rejects.toThrow('Erro da API');
  });
});
