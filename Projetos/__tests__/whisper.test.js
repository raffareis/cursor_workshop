const {generateAudio} = require('../whisper');
const OpenAI = require('openai');
const fs = require('fs');

jest.mock('openai');
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
  },
}));

describe('generateAudio', () => {
  let mockCreate;

  beforeEach(() => {
    mockCreate = jest.fn();
    OpenAI.mockImplementation(() => ({
      audio: {
        speech: {
          create: mockCreate,
        },
      },
    }));
  });

  it('deve gerar um arquivo de áudio com sucesso', async () => {
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await generateAudio('Texto de teste');

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'tts-1',
      voice: 'alloy',
      input: 'Texto de teste',
    });
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('output.mp3'),
      expect.any(Buffer)
    );
    expect(result).toBe('output.mp3');
  });

  it('deve lançar um erro quando a API falha', async () => {
    const mockError = new Error('Erro da API');
    mockCreate.mockRejectedValue(mockError);

    await expect(generateAudio('Texto de teste')).rejects.toThrow(
      'Erro da API'
    );
  });
});
