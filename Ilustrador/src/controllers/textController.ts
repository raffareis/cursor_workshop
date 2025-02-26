import {Response} from 'express';
import db from '../config/database';
import openai from '../config/openai';
import {extractSegments} from '../services/textService';
import {Segment} from '../types';
import {
  TextProcessRequest,
  SegmentRequest,
  ProjectRequest,
  DbRunResult,
} from '../types/requests';

interface TextSegment {
  text: string;
  position: number;
  id?: number;
}

// Processar texto usando a LLM
const processText = async (req: TextProcessRequest, res: Response) => {
  try {
    const {text, projectId, styleDescription} = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Texto é obrigatório',
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'ID do projeto é obrigatório',
      });
    }

    // Verificar se o projeto existe
    db.get(
      'SELECT * FROM projects WHERE id = ?',
      [projectId],
      async (err: Error | null, project: any) => {
        if (err || !project) {
          return res.status(404).json({
            success: false,
            message: 'Projeto não encontrado',
          });
        }

        try {
          // Extrair segmentos do texto usando a OpenAI
          const segments = await extractSegments(
            text,
            styleDescription as string
          );

          // Inserir os segmentos no banco de dados
          const segmentsWithPosition: TextSegment[] = segments.map(
            (seg: {text: string; id?: number}, index: number) => ({
              ...seg,
              position: index,
            })
          );

          await insertSegments(segmentsWithPosition, projectId);

          res.status(200).json({
            success: true,
            message: 'Texto processado com sucesso',
            data: {
              segmentCount: segments.length,
              segments,
            },
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: 'Erro ao processar o texto',
            error: (error as Error).message,
          });
        }
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao processar o texto',
      error: (error as Error).message,
    });
  }
};

// Criar segmentos manualmente
const createSegments = (req: SegmentRequest, res: Response) => {
  const {segments, projectId} = req.body;

  if (!segments || !Array.isArray(segments)) {
    return res.status(400).json({
      success: false,
      message: 'Segmentos inválidos',
    });
  }

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: 'ID do projeto é obrigatório',
    });
  }

  insertSegments(segments, projectId)
    .then(() => {
      res.status(201).json({
        success: true,
        message: 'Segmentos criados com sucesso',
      });
    })
    .catch((error) => {
      res.status(500).json({
        success: false,
        message: 'Erro ao criar segmentos',
        error: error.message,
      });
    });
};

// Obter segmentos de um projeto
const getSegmentsByProject = (req: ProjectRequest, res: Response) => {
  const sql =
    'SELECT * FROM segments WHERE project_id = ? ORDER BY position ASC';

  db.all(sql, [req.params.id], (err: Error | null, rows: Segment[]) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar segmentos',
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  });
};

// Função auxiliar para inserir segmentos no banco de dados
function insertSegments(
  segments: {text: string; position: number; id?: number}[],
  projectId: number
): Promise<{text: string; position: number; id?: number}[]> {
  return new Promise((resolve, reject) => {
    const insertSql =
      'INSERT INTO segments (project_id, text, position) VALUES (?, ?, ?)';

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      let completed = 0;
      let hasError = false;

      segments.forEach((segment, index) => {
        db.run(
          insertSql,
          [projectId, segment.text, index],
          function (this: DbRunResult, err: Error | null) {
            if (err && !hasError) {
              hasError = true;
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Se foi inserido com sucesso, atualiza o ID do segmento no objeto
            if (!hasError) {
              segment.id = this.lastID;
            }

            completed++;

            // Se todos os segmentos foram processados, finaliza a transação
            if (completed === segments.length && !hasError) {
              db.run('COMMIT', (err: Error | null) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(segments);
                }
              });
            }
          }
        );
      });
    });
  });
}

export default {
  processText,
  createSegments,
  getSegmentsByProject,
};
