import { Response } from 'express'
import db from '../config/database'
import openai from '../config/openai'
import { generatePrompt } from '../services/promptService'
import fs from 'fs'
import path from 'path'
import { Image, Segment } from '../types'
import { ImageGenerationRequest } from '../types/requests'

interface SegmentWithPrompt extends Segment {
    prompt?: string
}

// Gerar uma imagem para um segmento
const generateImage = async (req: ImageGenerationRequest, res: Response) => {
    try {
        const { segmentId, customPrompt, styleDescription, aiParams } = req.body as any

        if (!segmentId) {
            return res.status(400).json({
                success: false,
                message: 'ID do segmento é obrigatório'
            })
        }

        // Verificar se o segmento existe
        db.get('SELECT * FROM segments WHERE id = ? ORDER BY position ASC', [segmentId], async (err: Error | null, segment: Segment) => {
            if (err || !segment) {
                return res.status(404).json({
                    success: false,
                    message: 'Segmento não encontrado'
                })
            }

            try {
                // Buscar segmentos anteriores e seus prompts para contexto
                const previousSegments = await getPreviousSegmentsWithPrompts(segment.project_id, segment.position)

                // Gerar prompt para a imagem ou usar o prompt personalizado
                const prompt = customPrompt || (await generatePrompt(segment.text, styleDescription as string, previousSegments))

                // Criar registro da imagem com status "pending"
                db.run('INSERT INTO images (segment_id, prompt, status) VALUES (?, ?, ?)', [segmentId, prompt, 'pending'], function (this: any, err: Error | null) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Erro ao criar registro de imagem',
                            error: err.message
                        })
                    }

                    const imageId = this.lastID

                    // Responder com sucesso
                    res.status(200).json({
                        success: true,
                        message: 'Solicitação de geração de imagem recebida',
                        data: {
                            id: imageId,
                            prompt,
                            status: 'pending'
                        }
                    })

                    // Iniciar geração da imagem em background
                    generateImageWithDallE(imageId, prompt, aiParams).catch((error) => {
                        console.error('Erro na geração de imagem:', error)
                        updateImageStatus(imageId, 'failed')
                    })
                })
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao gerar imagem',
                    error: (error as Error).message
                })
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação de imagem',
            error: (error as Error).message
        })
    }
}

// Obter uma imagem específica
const getImageById = (req: ImageGenerationRequest, res: Response) => {
    const sql = 'SELECT * FROM images WHERE id = ?'

    db.get(sql, [req.params.id], (err: Error | null, image: Image) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar imagem',
                error: err.message
            })
        }

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Imagem não encontrada'
            })
        }

        res.status(200).json({
            success: true,
            data: image
        })
    })
}

// Obter imagens de um segmento
const getImagesBySegment = (req: ImageGenerationRequest, res: Response) => {
    const sql = 'SELECT * FROM images WHERE segment_id = ? ORDER BY created_at DESC'

    db.all(sql, [req.params.id], (err: Error | null, images: Image[]) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao buscar imagens',
                error: err.message
            })
        }

        res.status(200).json({
            success: true,
            count: images.length,
            data: images
        })
    })
}

// Regenerar uma imagem existente
const regenerateImage = async (req: ImageGenerationRequest, res: Response) => {
    try {
        const imageId = req.params.id
        const { aiParams } = req.body

        // Verificar se a imagem existe
        db.get('SELECT * FROM images WHERE id = ?', [imageId], async (err: Error | null, image: Image) => {
            if (err || !image) {
                return res.status(404).json({
                    success: false,
                    message: 'Imagem não encontrada'
                })
            }

            try {
                // Atualizar o status da imagem para pending
                await updateImageStatus(parseInt(imageId as string), 'pending')

                // Responder com sucesso
                res.status(200).json({
                    success: true,
                    message: 'Solicitação de regeneração de imagem recebida',
                    data: {
                        id: image.id,
                        prompt: image.prompt,
                        status: 'pending'
                    }
                })

                // Iniciar geração da imagem em background
                generateImageWithDallE(parseInt(imageId as string), image.prompt, aiParams).catch((error) => {
                    console.error('Erro na regeneração de imagem:', error)
                    updateImageStatus(parseInt(imageId as string), 'failed')
                })
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao regenerar imagem',
                    error: (error as Error).message
                })
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação de regeneração',
            error: (error as Error).message
        })
    }
}

// Função auxiliar para gerar imagens com DALL-E
async function generateImageWithDallE(imageId: number, prompt: string, aiParams: any) {
    try {
        // Configuração padrão para DALL-E
        const defaultParams = {
            model: 'dall-e-3',
            quality: 'standard',
            size: '1024x1024',
            style: 'natural'
        }

        // Mesclar com parâmetros personalizados, se fornecidos
        const finalParams = { ...defaultParams, ...(aiParams || {}) }

        // Gerar a imagem com a OpenAI
        const response = await openai.images.generate({
            model: finalParams.model,
            prompt: prompt,
            n: 1,
            quality: finalParams.quality,
            size: finalParams.size,
            style: finalParams.style
        })

        // Obter a URL da imagem gerada
        const imageUrl = response.data[0].url

        if (!imageUrl) {
            throw new Error('URL da imagem não retornada pela API')
        }

        // Salvar a imagem localmente
        const savedImagePath = await saveImageLocally(imageUrl, imageId)

        // Atualizar o registro da imagem no banco de dados
        await updateImageRecord(imageId, savedImagePath)
    } catch (error) {
        console.error('Erro ao gerar imagem com DALL-E:', error)
        throw error
    }
}

// Função auxiliar para salvar a imagem localmente
async function saveImageLocally(imageUrl: string, imageId: number): Promise<string> {
    // Esta função seria implementada para baixar a imagem da URL e salvá-la localmente
    // Por simplicidade, estamos retornando apenas o URL original
    return imageUrl
}

// Função auxiliar para atualizar o registro da imagem no banco de dados
function updateImageRecord(imageId: number, imagePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE images SET image_url = ?, status = ? WHERE id = ?'

        db.run(sql, [imagePath, 'completed', imageId], (err: Error | null) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

// Função auxiliar para atualizar o status de uma imagem
function updateImageStatus(imageId: number, status: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE images SET status = ? WHERE id = ?'

        db.run(sql, [status, imageId], (err: Error | null) => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

// Função auxiliar para buscar segmentos anteriores com seus prompts
function getPreviousSegmentsWithPrompts(projectId: number, currentPosition: number): Promise<SegmentWithPrompt[]> {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT s.*, i.prompt 
            FROM segments s
            LEFT JOIN images i ON s.id = i.segment_id
            WHERE s.project_id = ? AND s.position < ?
            ORDER BY s.position ASC
        `

        db.all(sql, [projectId, currentPosition], (err: Error | null, rows: SegmentWithPrompt[]) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

export default {
    generateImage,
    getImageById,
    getImagesBySegment,
    regenerateImage
}
