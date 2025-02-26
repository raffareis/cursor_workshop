import openai from '../config/openai'

interface PreviousSegment {
    text: string
    prompt?: string
    position?: number
}

/**
 * Gera um prompt detalhado para criar uma imagem baseada em um segmento de texto
 * @param segmentText - O texto do segmento a ser ilustrado
 * @param styleDescription - Descrição do estilo visual desejado
 * @param previousSegments - Segmentos anteriores e seus prompts (opcional)
 * @returns O prompt gerado para a criação da imagem
 */
export const generatePrompt = async (segmentText: string, styleDescription: string = '', previousSegments: PreviousSegment[] = []): Promise<string> => {
    try {
        // Instruções para a LLM sobre como criar prompts para imagens
        const systemMessage = `
            Você é um especialista em criar prompts detalhados para geração de imagens. 
            Sua tarefa é transformar um segmento de texto literário em um prompt descritivo 
            que uma IA de geração de imagens possa usar para criar uma ilustração representativa.
            
            Siga estas diretrizes:
            
            1. Extraia elementos visuais importantes: cenários, personagens, ações, cores, atmosfera
            2. Seja específico e detalhado nas descrições visuais
            3. Utilize linguagem que enfatize aspectos visuais e estéticos
            4. Adapte o prompt ao estilo visual especificado (se fornecido)
            5. Inclua apenas o que é explicitamente mencionado no texto ou claramente implicado
            6. Evite conceitos abstratos difíceis de representar visualmente
            7. Mantenha o prompt conciso (máximo 200 palavras)
            8. Mantenha CONSISTÊNCIA com os segmentos anteriores (se fornecidos)
               - Para personagens que aparecem em múltiplos segmentos, mantenha a mesma aparência
               - Para cenários recorrentes, mantenha elementos visuais consistentes
               - Para elementos de estilo (cores, iluminação, etc), mantenha uma paleta coerente
            
            Retorne APENAS o prompt, sem explicações adicionais ou formatação markdown.
        `

        // Preparar o contexto incluindo segmentos anteriores, se disponíveis
        let userMessage = ''

        // Adicionar segmentos anteriores como contexto, se existirem
        if (previousSegments && previousSegments.length > 0) {
            userMessage += 'Contexto de segmentos anteriores:\n\n'

            // Incluir até 3 segmentos anteriores para não sobrecarregar o contexto
            const recentSegments = previousSegments.slice(-3)

            recentSegments.forEach((item, index) => {
                userMessage += `Segmento ${index + 1}: ""${item.text}""\n`
                if (item.prompt) {
                    userMessage += `Prompt usado: ""${item.prompt}""\n\n`
                } else {
                    userMessage += '\n'
                }
            })

            userMessage += 'Use esta informação para manter consistência visual entre as ilustrações.\n\n'
        }

        // Adicionar o segmento atual para ilustração
        userMessage += `Segmento a ser ilustrado: ""${segmentText}""\n\n`

        // Adicionar o estilo desejado, se fornecido
        if (styleDescription && styleDescription.trim() !== '') {
            userMessage += `Estilo visual desejado: ""${styleDescription}""`
        }

        // Chamada para a API da OpenAI
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.7
        })

        // Extrair e limpar a resposta
        const promptText = response.choices[0].message.content?.trim() || ''

        return promptText
    } catch (error) {
        console.error('Erro ao gerar prompt para imagem:', error)
        throw error
    }
}
