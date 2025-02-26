import openai from '../config/openai';

interface TextSegment {
  text: string;
  position?: number;
  id?: number;
}

/**
 * Extrai segmentos relevantes de um texto para ilustração
 * @param text - O texto completo a ser analisado
 * @param styleDescription - Descrição do estilo visual desejado (opcional)
 * @returns Array de objetos contendo segmentos de texto
 */
export const extractSegments = async (
  text: string,
  styleDescription: string = ''
): Promise<TextSegment[]> => {
  try {
    // Instruções para a LLM sobre como segmentar o texto
    const systemMessage = `
            Você é um assistente especializado em analisar textos literários para extrair os momentos mais 
            importantes para ilustração. Sua tarefa é identificar trechos do texto que seriam ideais para 
            gerar ilustrações visuais. Siga estas diretrizes:

            1. Identifique apenas as partes MAIS IMPORTANTES e VISUALMENTE RICAS do texto
            2. Priorize momentos-chave da narrativa, descrições vívidas de cenários/personagens, eventos importantes, momentos emocionais
            3. Cada segmento deve ser auto-contido e ter significado próprio
            4. Não selecione trechos muito abstratos ou conceituais que seriam difíceis de ilustrar
            5. Inclua contexto suficiente em cada trecho para que a cena possa ser compreendida visualmente
            
            Retorne o resultado como um array JSON de objetos, onde cada objeto tem:
            - text: o texto exato do segmento a ser ilustrado
            
            IMPORTANTE: Retorne APENAS o array JSON, sem explicações adicionais.
        `;

    // Estratégia para processar textos longos em chunks
    const CHUNK_SIZE = 6000; // Tamanho de cada chunk em caracteres
    const OVERLAP = 1000; // Sobreposição entre chunks para manter contexto

    let allSegments: TextSegment[] = [];

    // Se o texto for curto o suficiente, processe-o de uma vez
    if (text.length <= CHUNK_SIZE) {
      allSegments = await processTextChunk(
        text,
        systemMessage,
        styleDescription
      );
    } else {
      // Dividir o texto em chunks com sobreposição
      let position = 0;
      while (position < text.length) {
        // Calcular o fim do chunk atual
        const endPos = Math.min(position + CHUNK_SIZE, text.length);

        // Extrair o chunk atual
        const chunk = text.substring(position, endPos);

        // Adicionar contexto ao chunk para a API entender que é parte de um texto maior
        const contextPrefix =
          position > 0 ? '... (continuação do texto anterior) ' : '';
        const contextSuffix =
          endPos < text.length ? ' (texto continua) ...' : '';
        const chunkWithContext = contextPrefix + chunk + contextSuffix;

        // Processar o chunk atual
        console.log(
          `Processando chunk de texto: caracteres ${position} até ${endPos} de ${text.length}`
        );
        const segments = await processTextChunk(
          chunkWithContext,
          systemMessage,
          styleDescription
        );

        // Adicionar os segmentos ao resultado final
        allSegments = allSegments.concat(segments);

        // Mover para o próximo chunk com sobreposição
        position = endPos - OVERLAP;

        // Se estamos quase no final, processar até o fim sem sobreposição
        if (position + CHUNK_SIZE >= text.length) {
          position = Math.max(endPos, text.length - CHUNK_SIZE);
        }
      }
    }

    // Remover possíveis duplicações devido à sobreposição
    const uniqueSegments = removeDuplicateSegments(allSegments);

    return uniqueSegments;
  } catch (error) {
    console.error('Erro ao extrair segmentos do texto:', error);
    throw error;
  }
};

/**
 * Processa um chunk de texto e extrai segmentos para ilustração
 * @param textChunk - O chunk de texto a ser processado
 * @param systemMessage - Instruções para a LLM
 * @param styleDescription - Descrição do estilo visual
 * @returns Array de segmentos extraídos
 */
async function processTextChunk(
  textChunk: string,
  systemMessage: string,
  styleDescription: string
): Promise<TextSegment[]> {
  // Contexto adicional sobre o estilo, se fornecido
  let userMessage = textChunk;
  if (styleDescription) {
    userMessage += `\n\nObs: As ilustrações terão este estilo visual: ${styleDescription}`;
  }

  // Chamada para a API da OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {role: 'system', content: systemMessage},
      {role: 'user', content: userMessage},
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  // Extrair a resposta e parsear o JSON
  const content = response.choices[0].message.content?.trim() || '';

  // Tenta encontrar um array JSON na resposta (caso a LLM tenha adicionado texto adicional)
  const jsonMatch = content.match(/\[[\s\S]*\]/);

  if (jsonMatch && jsonMatch[0]) {
    return JSON.parse(jsonMatch[0]);
  } else {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Erro ao parsear resposta da OpenAI:', error);
      console.error('Resposta recebida:', content);
      throw new Error('Formato de resposta inválido da LLM');
    }
  }
}

/**
 * Remove segmentos duplicados ou muito similares
 * @param segments - Array de segmentos para verificar
 * @returns Array de segmentos únicos
 */
function removeDuplicateSegments(segments: TextSegment[]): TextSegment[] {
  const uniqueSegments: TextSegment[] = [];
  const textSet = new Set<string>();

  for (const segment of segments) {
    // Criar uma versão simplificada do texto para comparação
    const simplifiedText = segment.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();

    // Se este texto (ou muito similar) já foi adicionado, pular
    if (!textSet.has(simplifiedText)) {
      textSet.add(simplifiedText);
      uniqueSegments.push(segment);
    }
  }

  return uniqueSegments;
}
