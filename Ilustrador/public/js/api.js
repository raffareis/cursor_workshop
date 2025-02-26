/**
 * Classe para comunicação com a API do backend
 */
class API {
  constructor() {
    this.baseUrl = '/api';
  }

  /**
   * Realiza uma requisição para a API
   * @param {string} endpoint - Endpoint da API
   * @param {string} method - Método HTTP (GET, POST, etc.)
   * @param {object} data - Dados a serem enviados (opcional)
   * @returns {Promise} - Promise com o resultado da requisição
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro na requisição');
      }

      return result;
    } catch (error) {
      console.error(`Erro na requisição para ${url}:`, error);
      throw error;
    }
  }

  // Métodos para projetos

  /**
   * Cria um novo projeto
   * @param {string} title - Título do projeto
   * @returns {Promise} - Promise com o resultado da requisição
   */
  createProject(title) {
    return this.request('/projects', 'POST', {title});
  }

  /**
   * Retorna todos os projetos
   * @returns {Promise} - Promise com o resultado da requisição
   */
  getAllProjects() {
    return this.request('/projects');
  }

  /**
   * Retorna um projeto específico
   * @param {number} id - ID do projeto
   * @returns {Promise} - Promise com o resultado da requisição
   */
  getProjectById(id) {
    return this.request(`/projects/${id}`);
  }

  /**
   * Exclui um projeto
   * @param {number} id - ID do projeto
   * @returns {Promise} - Promise com o resultado da requisição
   */
  deleteProject(id) {
    return this.request(`/projects/${id}`, 'DELETE');
  }

  // Métodos para processamento de texto

  /**
   * Processa um texto para extrair segmentos
   * @param {string} text - Texto a ser processado
   * @param {number} projectId - ID do projeto
   * @param {string} styleDescription - Descrição do estilo (opcional)
   * @returns {Promise} - Promise com o resultado da requisição
   */
  processText(text, projectId, styleDescription = '') {
    return this.request('/text/process', 'POST', {
      text,
      projectId,
      styleDescription,
    });
  }

  /**
   * Retorna os segmentos de um projeto
   * @param {number} projectId - ID do projeto
   * @returns {Promise} - Promise com o resultado da requisição
   */
  getSegmentsByProject(projectId) {
    return this.request(`/projects/${projectId}/segments`);
  }

  // Métodos para geração de imagens

  /**
   * Gera uma imagem para um segmento
   * @param {number} segmentId - ID do segmento
   * @param {string} styleDescription - Descrição do estilo (opcional)
   * @param {object} aiParams - Parâmetros da IA (opcional)
   * @param {string} customPrompt - Prompt personalizado (opcional)
   * @returns {Promise} - Promise com o resultado da requisição
   */
  generateImage(
    segmentId,
    styleDescription = '',
    aiParams = {},
    customPrompt = null
  ) {
    return this.request('/images/generate', 'POST', {
      segmentId,
      styleDescription,
      aiParams,
      customPrompt,
    });
  }

  /**
   * Retorna uma imagem específica
   * @param {number} imageId - ID da imagem
   * @returns {Promise} - Promise com o resultado da requisição
   */
  getImageById(imageId) {
    return this.request(`/images/${imageId}`);
  }

  /**
   * Retorna todas as imagens de um segmento
   * @param {number} segmentId - ID do segmento
   * @returns {Promise} - Promise com o resultado da requisição
   */
  getImagesBySegment(segmentId) {
    return this.request(`/segments/${segmentId}/images`);
  }

  /**
   * Regenera uma imagem
   * @param {number} imageId - ID da imagem
   * @param {object} aiParams - Parâmetros da IA (opcional)
   * @param {string} customPrompt - Prompt personalizado (opcional)
   * @returns {Promise} - Promise com o resultado da requisição
   */
  regenerateImage(imageId, aiParams = {}, customPrompt = null) {
    return this.request(`/images/${imageId}/regenerate`, 'POST', {
      aiParams,
      customPrompt,
    });
  }
}

// Exporta uma instância da classe API
const api = new API();
