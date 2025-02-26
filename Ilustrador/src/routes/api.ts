import express, { RequestHandler } from 'express'
import projectController from '../controllers/projectController'
import textController from '../controllers/textController'
import imageController from '../controllers/imageController'

const router = express.Router()

// Rotas de projetos
router.post('/projects', projectController.createProject as RequestHandler)
router.get('/projects', projectController.getAllProjects as RequestHandler)
router.get('/projects/:id', projectController.getProjectById as RequestHandler)
router.delete('/projects/:id', projectController.deleteProject as RequestHandler)

// Rotas de processamento de texto
router.post('/text/process', textController.processText as RequestHandler)
router.post('/text/segments', textController.createSegments as RequestHandler)
router.get('/projects/:id/segments', textController.getSegmentsByProject as RequestHandler)

// Rotas de geração de imagens
router.post('/images/generate', imageController.generateImage as RequestHandler)
router.get('/images/:id', imageController.getImageById as RequestHandler)
router.get('/segments/:id/images', imageController.getImagesBySegment as RequestHandler)
router.post('/images/:id/regenerate', imageController.regenerateImage as RequestHandler)

export default router
