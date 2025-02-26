import openai from '../config/openai'

interface TextSegment {
    text: string
    startLine: number
    endLine: number
    id: number
}

/**
 * Extrai segmentos relevantes de um texto para ilustração
 * @param text - O texto completo a ser analisado
 * @param styleDescription - Descrição do estilo visual desejado (opcional)
 * @returns Array de objetos contendo segmentos de texto
 */
export const extractSegments = async (text: string, styleDescription: string = ''): Promise<TextSegment[]> => {
    try {
        // Dividir o texto em linhas e adicionar números de linha
        const lines = text.split('\n')

        // Instruções para a LLM sobre como segmentar o texto
        const systemMessage = `
            Você é um assistente especializado em analisar textos literários para dividir o texto em CENAS para ilustração.
            
            Você receberá um texto com cada linha numerada no formato "LINHA_XXX: texto da linha".
            
            Sua tarefa é dividir o texto em 10-20 CENAS COMPLETAS e SEQUENCIAIS que seriam ideais para gerar ilustrações.
            Cada cena deve representar um momento narrativo significativo que mereceria uma ilustração.
            
            DIRETRIZES:
            1. Cada cena deve ser grande o suficiente (vários parágrafos) para representar um momento completo da narrativa
            2. Cenas devem ser coesas e capturar momentos significativos da história
            3. Todo o texto deve ser incluído, sem pular nenhuma linha
            4. As cenas devem ser consecutivas, cobrindo todo o texto do início ao fim
            5. Pense nas cenas como ilustrações de livros, não como quadrinhos ou storyboards
            
            RESPONDA APENAS com um array JSON onde cada objeto tem:
            - startLine: número da primeira linha da cena (número inteiro)
            - endLine: número da última linha da cena (número inteiro)
            
            Exemplo de resposta:
            [
              { "startLine": 1, "endLine": 43 },
              { "startLine": 44, "endLine": 87 },
              ...e assim por diante
            ]
            
            IMPORTANTE: A última linha da cena anterior deve ser adjacente à primeira linha da próxima cena.
            IMPORTANTE: A primeira cena deve começar na linha 1 e a última cena deve terminar na última linha do texto.
        `

        const CHUNK_SIZE = 800 // Número máximo de linhas por chunk
        const segments: TextSegment[] = []

        // Se o texto for curto o suficiente, processe-o de uma vez
        if (lines.length <= CHUNK_SIZE) {
            // Criar texto numerado
            const numberedText = lines.map((line, index) => `LINHA_${index + 1}: ${line}`).join('\n')
            const boundaries = await processTextChunkByLines(numberedText, systemMessage, styleDescription, lines.length)

            // Criar segmentos a partir dos limites
            const textSegments = createSegmentsFromBoundaries(boundaries, lines)
            segments.push(...textSegments)
        } else {
            // Processar o texto em chunks de linhas com sobreposição
            let processedUpToLine = 0

            while (processedUpToLine < lines.length) {
                const endLine = Math.min(processedUpToLine + CHUNK_SIZE, lines.length)
                const overlapLine = Math.max(processedUpToLine - 50, 0) // 50 linhas de sobreposição

                // Extrair o chunk atual (com sobreposição)
                const chunkLines = lines.slice(overlapLine, endLine)

                // Numerar as linhas corretamente (em relação ao texto original)
                const numberedChunk = chunkLines.map((line, index) => `LINHA_${overlapLine + index + 1}: ${line}`).join('\n')

                // Informação de contexto
                const contextInfo = `
Este é um trecho de um texto maior.
Linhas anteriores: ${overlapLine > 0 ? 'sim (até a linha ' + overlapLine + ')' : 'não'}
Linhas posteriores: ${endLine < lines.length ? 'sim (a partir da linha ' + (endLine + 1) + ')' : 'não'}
Total de linhas no texto completo: ${lines.length}
`

                const textToProcess = contextInfo + '\n\n' + numberedChunk

                console.log(`Processando chunk de linhas: ${overlapLine + 1} até ${endLine} de ${lines.length}`)

                // Processar o chunk atual
                const boundaries = await processTextChunkByLines(textToProcess, systemMessage, styleDescription, lines.length)

                // Filtrar apenas as fronteiras que estão dentro deste chunk (excluindo sobreposição)
                const relevantBoundaries = boundaries.filter((boundary) => boundary.endLine >= processedUpToLine + 1 && boundary.startLine <= endLine)

                // Criar segmentos a partir das fronteiras relevantes
                const chunkSegments = createSegmentsFromBoundaries(relevantBoundaries, lines)
                segments.push(...chunkSegments)

                // Avançar para o próximo chunk
                processedUpToLine = endLine
            }
        }

        // Ordenar segmentos por linha de início e remover possíveis duplicações
        const uniqueSegments = removeDuplicateSegments(segments)

        // Validar que todos os segmentos cobrem todo o texto
        const coverage = validateCoverage(uniqueSegments, lines.length)
        console.log(`Cobertura do texto: ${coverage.percentCovered.toFixed(2)}%`)

        if (coverage.percentCovered < 100) {
            console.warn('Atenção: O texto não foi completamente coberto pelos segmentos!')

            if (coverage.missingRanges.length > 0) {
                console.warn('Seções faltantes detectadas. Criando segmentos adicionais...')
                // Adicionar segmentos para as linhas faltantes
                const completeSegments = fixMissingRanges(uniqueSegments, coverage.missingRanges, lines)
                return completeSegments
            }
        }

        return uniqueSegments
    } catch (error) {
        console.error('Erro ao extrair segmentos do texto:', error)
        throw error
    }
}

/**
 * Processa um chunk de texto numerado por linhas
 * @param numberedText - Texto com linhas numeradas
 * @param systemMessage - Instruções para a LLM
 * @param styleDescription - Descrição do estilo visual
 * @param totalLines - Número total de linhas no texto completo
 * @returns Array de fronteiras de segmentos (linha inicial e final)
 */
async function processTextChunkByLines(
    numberedText: string,
    systemMessage: string,
    styleDescription: string,
    totalLines: number
): Promise<Array<{ startLine: number; endLine: number }>> {
    // Contexto adicional sobre o estilo, se fornecido
    let userMessage = numberedText
    if (styleDescription) {
        userMessage += `\n\nObs: As ilustrações terão este estilo visual: ${styleDescription}`
    }

    // Adicionar informação sobre o número total de linhas
    userMessage += `\n\nO texto completo tem ${totalLines} linhas.`

    // Chamada para a API da OpenAI
    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
        ],
        temperature: 0.3, // Reduzido para maior consistência
        max_tokens: 1000,
        response_format: { type: 'json_object' } // Forçar resposta em formato JSON
    })

    // Extrair a resposta e parsear o JSON
    const content = response.choices[0].message.content?.trim() || ''

    try {
        // Tentar parsear o JSON diretamente
        const parsed = JSON.parse(content)

        // Verificar se temos um array ou se o array está em alguma propriedade
        if (Array.isArray(parsed)) {
            return parsed.map(normalizeLineNumbers)
        }

        // Procurar por um array em qualquer propriedade
        for (const key in parsed) {
            if (Array.isArray(parsed[key])) {
                return parsed[key].map(normalizeLineNumbers)
            }
        }

        throw new Error('Resposta não contém um array de segmentos')
    } catch (error) {
        console.error('Erro ao parsear resposta da LLM:', error)
        console.error('Resposta recebida:', content)

        // Tentar extrair um array JSON usando regex
        const jsonArrayMatch = content.match(/\[\s*\{.*?\}\s*(?:,\s*\{.*?\}\s*)*\]/s)
        if (jsonArrayMatch && jsonArrayMatch[0]) {
            try {
                const extractedArray = JSON.parse(jsonArrayMatch[0])
                return extractedArray.map(normalizeLineNumbers)
            } catch (innerError) {
                console.error('Erro ao parsear array extraído:', innerError)
            }
        }

        // Tentar extrair objetos individuais e construir um array
        const objectMatches = content.match(/\{\s*"startLine"\s*:\s*\d+\s*,\s*"endLine"\s*:\s*\d+\s*\}/g)
        if (objectMatches && objectMatches.length > 0) {
            try {
                return objectMatches.map((objStr) => {
                    const parsed = JSON.parse(objStr)
                    return normalizeLineNumbers(parsed)
                })
            } catch (innerError) {
                console.error('Erro ao parsear objetos individuais:', innerError)
            }
        }

        // Como último recurso, tentar extrair números diretos usando regex
        const lineNumbers = content.match(/\b(startLine|endLine)\s*:\s*(\d+)/g)
        if (lineNumbers && lineNumbers.length >= 2) {
            const segments = []
            for (let i = 0; i < lineNumbers.length; i += 2) {
                const startLineMatch = lineNumbers[i].match(/(\d+)/)
                const endLineMatch = lineNumbers[i + 1]?.match(/(\d+)/)

                if (startLineMatch && endLineMatch) {
                    segments.push({
                        startLine: parseInt(startLineMatch[0], 10),
                        endLine: parseInt(endLineMatch[0], 10)
                    })
                }
            }

            if (segments.length > 0) {
                return segments.map(normalizeLineNumbers)
            }
        }

        throw new Error('Não foi possível extrair os limites dos segmentos da resposta')
    }
}

/**
 * Normaliza os números de linha para garantir que são inteiros válidos
 */
function normalizeLineNumbers(boundary: { startLine: any; endLine: any }): { startLine: number; endLine: number } {
    let start = typeof boundary.startLine === 'string' ? parseInt(boundary.startLine, 10) : boundary.startLine
    let end = typeof boundary.endLine === 'string' ? parseInt(boundary.endLine, 10) : boundary.endLine

    // Garantir que são números inteiros válidos
    start = isNaN(start) ? 1 : Math.max(1, Math.floor(start))
    end = isNaN(end) ? start : Math.max(start, Math.floor(end))

    return {
        startLine: start,
        endLine: end
    }
}

/**
 * Cria segmentos de texto a partir dos limites de linha
 * @param boundaries - Array de objetos com startLine e endLine
 * @param lines - Array de linhas do texto original
 * @returns Array de segmentos de texto
 */
function createSegmentsFromBoundaries(boundaries: Array<{ startLine: number; endLine: number }>, lines: string[]): TextSegment[] {
    return boundaries.map((boundary, index) => {
        // Ajustar índices para base 0
        const startIndex = Math.max(0, boundary.startLine - 1)
        const endIndex = Math.min(lines.length - 1, boundary.endLine - 1)

        // Extrair o texto do segmento
        const segmentLines = lines.slice(startIndex, endIndex + 1)
        const segmentText = segmentLines.join('\n')

        return {
            id: index + 1,
            text: segmentText,
            startLine: boundary.startLine,
            endLine: boundary.endLine
        }
    })
}

/**
 * Remove segmentos duplicados e reorganiza fronteiras para evitar sobreposições
 * @param segments - Array de segmentos para verificar
 * @returns Array de segmentos únicos
 */
function removeDuplicateSegments(segments: TextSegment[]): TextSegment[] {
    if (segments.length === 0) return []

    // Ordenar segmentos por linha de início
    const sortedSegments = [...segments].sort((a, b) => a.startLine - b.startLine)

    const uniqueSegments: TextSegment[] = []
    let lastEndLine = 0

    for (const segment of sortedSegments) {
        // Pular segmentos que começam antes do fim do último segmento adicionado
        if (segment.startLine <= lastEndLine) {
            // Se este segmento termina depois do último, estender o último
            if (segment.endLine > lastEndLine && uniqueSegments.length > 0) {
                const lastSegment = uniqueSegments[uniqueSegments.length - 1]

                // Atualizar o texto e a linha final do último segmento
                const additionalLines = segment.endLine - lastEndLine
                const linesToAdd = segment.text.split('\n').slice(-additionalLines)

                lastSegment.text += '\n' + linesToAdd.join('\n')
                lastSegment.endLine = segment.endLine
                lastEndLine = segment.endLine
            }
            continue
        }

        // Verificar se há uma lacuna entre o último segmento e este
        if (lastEndLine > 0 && segment.startLine > lastEndLine + 1) {
            console.warn(`Lacuna detectada entre os segmentos: linhas ${lastEndLine + 1} a ${segment.startLine - 1}`)
        }

        uniqueSegments.push(segment)
        lastEndLine = segment.endLine
    }

    // Reatribuir IDs sequenciais
    return uniqueSegments.map((segment, index) => ({
        ...segment,
        id: index + 1
    }))
}

/**
 * Valida a cobertura do texto pelos segmentos
 * @param segments - Os segmentos a serem validados
 * @param totalLines - Número total de linhas no texto
 * @returns Informações sobre a cobertura
 */
function validateCoverage(
    segments: TextSegment[],
    totalLines: number
): {
    percentCovered: number
    missingRanges: Array<{ startLine: number; endLine: number }>
} {
    if (segments.length === 0) {
        return {
            percentCovered: 0,
            missingRanges: [{ startLine: 1, endLine: totalLines }]
        }
    }

    // Criar um array para rastrear quais linhas foram cobertas
    const coveredLines = new Array(totalLines).fill(false)

    // Marcar as linhas cobertas por cada segmento
    for (const segment of segments) {
        const startIndex = Math.max(0, segment.startLine - 1)
        const endIndex = Math.min(totalLines - 1, segment.endLine - 1)

        for (let i = startIndex; i <= endIndex; i++) {
            coveredLines[i] = true
        }
    }

    // Calcular o percentual coberto
    const coveredCount = coveredLines.filter(Boolean).length
    const percentCovered = (coveredCount / totalLines) * 100

    // Encontrar intervalos contínuos não cobertos
    const missingRanges: Array<{ startLine: number; endLine: number }> = []
    let rangeStart: number | null = null

    for (let i = 0; i < totalLines; i++) {
        if (!coveredLines[i]) {
            if (rangeStart === null) {
                rangeStart = i + 1 // Converter para número de linha (base 1)
            }
        } else if (rangeStart !== null) {
            missingRanges.push({
                startLine: rangeStart,
                endLine: i // A linha atual já está coberta, então usamos i em vez de i+1
            })
            rangeStart = null
        }
    }

    // Verificar se há um intervalo não coberto no final
    if (rangeStart !== null) {
        missingRanges.push({
            startLine: rangeStart,
            endLine: totalLines
        })
    }

    return { percentCovered, missingRanges }
}

/**
 * Adiciona segmentos para cobrir as linhas faltantes
 * @param segments - Segmentos existentes
 * @param missingRanges - Intervalos de linhas faltantes
 * @param lines - Linhas do texto original
 * @returns Lista completa de segmentos
 */
function fixMissingRanges(segments: TextSegment[], missingRanges: Array<{ startLine: number; endLine: number }>, lines: string[]): TextSegment[] {
    const completeSegments = [...segments]
    let nextId = Math.max(...segments.map((s) => s.id)) + 1

    for (const range of missingRanges) {
        // Converter para índices de array (base 0)
        const startIndex = range.startLine - 1
        const endIndex = range.endLine - 1

        // Extrair as linhas faltantes
        const missingLines = lines.slice(startIndex, endIndex + 1)
        const missingText = missingLines.join('\n')

        // Criar um novo segmento para o intervalo faltante
        const newSegment: TextSegment = {
            id: nextId++,
            text: missingText,
            startLine: range.startLine,
            endLine: range.endLine
        }

        completeSegments.push(newSegment)
    }

    // Ordenar por linha de início e reatribuir IDs
    return completeSegments
        .sort((a, b) => a.startLine - b.startLine)
        .map((segment, index) => ({
            ...segment,
            id: index + 1
        }))
}
