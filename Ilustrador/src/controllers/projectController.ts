import {Response} from 'express';
import db from '../config/database';
import {Project, ApiResponse} from '../types';
import {ProjectRequest, DbRunResult} from '../types/requests';

// Criar um novo projeto
const createProject = (req: ProjectRequest, res: Response) => {
  const {title} = req.body;

  const sql = 'INSERT INTO projects (title) VALUES (?)';

  db.run(
    sql,
    [title || 'Projeto sem título'],
    function (this: DbRunResult, err: Error | null) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar projeto',
          error: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Projeto criado com sucesso',
        data: {
          id: this.lastID,
          title: title || 'Projeto sem título',
        },
      });
    }
  );
};

// Obter todos os projetos
const getAllProjects = (_req: ProjectRequest, res: Response) => {
  const sql = 'SELECT * FROM projects ORDER BY created_at DESC';

  db.all(sql, [], (err: Error | null, rows: Project[]) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar projetos',
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

// Obter um projeto específico
const getProjectById = (req: ProjectRequest, res: Response) => {
  const sql = 'SELECT * FROM projects WHERE id = ?';

  db.get(sql, [req.params.id], (err: Error | null, row: Project) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar projeto',
        error: err.message,
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: row,
    });
  });
};

// Excluir um projeto
const deleteProject = (req: ProjectRequest, res: Response) => {
  const sql = 'DELETE FROM projects WHERE id = ?';

  db.run(sql, [req.params.id], function (this: DbRunResult, err: Error | null) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir projeto',
        error: err.message,
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Projeto não encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Projeto excluído com sucesso',
    });
  });
};

export default {
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
};
