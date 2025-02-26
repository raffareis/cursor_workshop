document.addEventListener('DOMContentLoaded', () => {
  // Estado da aplicação
  const state = {
    currentProject: null,
    segments: [],
    currentStyle: '',
    aiParams: {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
    },
    generatedImages: {}, // Armazenar IDs de imagens geradas por segmento
  };

  // Elementos da interface
  const elements = {
    // Seções
    projectSection: document.getElementById('project-section'),
    inputSection: document.getElementById('input-section'),
    segmentsSection: document.getElementById('segments-section'),
    resultsSection: document.getElementById('results-section'),

    // Projeto
    projectTitle: document.getElementById('project-title'),
    createProjectBtn: document.getElementById('create-project-btn'),
    projectList: document.getElementById('project-list'),
    projectListContainer: document.getElementById('project-list-container'),
    currentProjectTitle: document.getElementById('current-project-title'),
    projectId: document.getElementById('project-id'),

    // Entrada de texto
    textInput: document.getElementById('text-input'),
    processBtn: document.getElementById('process-btn'),
    resetBtn: document.getElementById('reset-btn'),

    // Estilo
    stylePreset: document.getElementById('style-preset'),
    customStyleContainer: document.getElementById('custom-style-container'),
    customStyle: document.getElementById('custom-style'),

    // Configurações da IA
    aiModel: document.getElementById('ai-model'),
    imageSize: document.getElementById('image-size'),
    imageQuality: document.getElementById('image-quality'),

    // Segmentos
    segmentsContainer: document.getElementById('segments-container'),
    generateAllBtn: document.getElementById('generate-all-btn'),
    backToInputBtn: document.getElementById('back-to-input-btn'),

    // Resultados
    resultsContainer: document.getElementById('results-container'),
    exportBtn: document.getElementById('export-btn'),
    newProjectBtn: document.getElementById('new-project-btn'),

    // Modal
    promptModal: document.getElementById('prompt-modal'),
    promptText: document.getElementById('prompt-text'),
    savePromptBtn: document.getElementById('save-prompt-btn'),
    cancelPromptBtn: document.getElementById('cancel-prompt-btn'),
    closeModal: document.querySelector('.close-modal'),

    // Templates
    segmentTemplate: document.getElementById('segment-template'),
    resultTemplate: document.getElementById('result-template'),
  };

  // Manipulação de eventos da interface

  // Evento de criar projeto
  elements.createProjectBtn.addEventListener('click', async () => {
    const title = elements.projectTitle.value.trim();

    try {
      const response = await api.createProject(title);
      state.currentProject = response.data;

      // Atualizar a interface
      elements.currentProjectTitle.textContent = state.currentProject.title;
      elements.projectId.textContent = state.currentProject.id;

      // Mostrar seção de entrada de texto
      showSection('input');

      // Limpar o campo de título
      elements.projectTitle.value = '';

      // Carregar a lista de projetos em segundo plano
      loadProjects();
    } catch (error) {
      showError('Erro ao criar projeto: ' + error.message);
    }
  });

  // Evento de processar texto
  elements.processBtn.addEventListener('click', async () => {
    const text = elements.textInput.value.trim();

    if (!text) {
      showError('Por favor, insira um texto para processar.');
      return;
    }

    if (!state.currentProject) {
      showError('Nenhum projeto selecionado.');
      return;
    }

    // Obter o estilo selecionado
    const styleDescription = getSelectedStyle();

    // Mostrar indicador de carregamento
    elements.processBtn.disabled = true;
    elements.processBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Processando...';

    try {
      // Processar o texto
      const response = await api.processText(
        text,
        state.currentProject.id,
        styleDescription
      );

      // Atualizar o estado
      state.segments = response.data.segments;

      // Preencher a seção de segmentos
      renderSegments();

      // Mostrar seção de segmentos
      showSection('segments');
    } catch (error) {
      showError('Erro ao processar texto: ' + error.message);
    } finally {
      // Restaurar o botão
      elements.processBtn.disabled = false;
      elements.processBtn.textContent = 'Processar Texto';
    }
  });

  // Eventos para os botões Reset/Recomeçar
  elements.resetBtn.addEventListener('click', () => {
    // Limpar o texto de entrada
    elements.textInput.value = '';

    // Reset style selection
    elements.stylePreset.value = '';
    elements.customStyleContainer.classList.add('hidden');
    elements.customStyle.value = '';

    // Reset AI parameters
    elements.aiModel.value = 'dall-e-3';
    elements.imageSize.value = '1024x1024';
    elements.imageQuality.value = 'standard';

    // Update state
    state.aiParams = {
      model: 'dall-e-3',
      size: '1024x1024',
      quality: 'standard',
    };
  });

  // Evento para alternar entre estilos predefinidos e personalizados
  elements.stylePreset.addEventListener('change', () => {
    if (elements.stylePreset.value === 'custom') {
      elements.customStyleContainer.classList.remove('hidden');
    } else {
      elements.customStyleContainer.classList.add('hidden');
    }
  });

  // Eventos de configuração da IA
  elements.aiModel.addEventListener('change', () => {
    state.aiParams.model = elements.aiModel.value;
  });

  elements.imageSize.addEventListener('change', () => {
    state.aiParams.size = elements.imageSize.value;
  });

  elements.imageQuality.addEventListener('change', () => {
    state.aiParams.quality = elements.imageQuality.value;
  });

  // Evento para gerar todas as imagens
  elements.generateAllBtn.addEventListener('click', async () => {
    // Mostrar seção de resultados
    showSection('results');

    // Renderizar os resultados (inicialmente sem imagens)
    renderResults();

    // Gerar imagens uma por uma
    const styleDescription = getSelectedStyle();

    // Disable the button during generation
    elements.generateAllBtn.disabled = true;
    elements.generateAllBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Gerando imagens...';

    try {
      // Gerar imagens para todos os segmentos em sequência
      for (const segment of state.segments) {
        await generateImageForSegment(segment.id, styleDescription);
      }
    } catch (error) {
      console.error('Erro ao gerar imagens:', error);
      showError('Erro ao gerar imagens: ' + error.message);
    } finally {
      // Re-enable the button after completion
      elements.generateAllBtn.disabled = false;
      elements.generateAllBtn.textContent = 'Gerar Todas as Imagens';
    }
  });

  // Eventos de navegação
  elements.backToInputBtn.addEventListener('click', () => {
    showSection('input');
  });

  elements.newProjectBtn.addEventListener('click', () => {
    showSection('project');
    state.currentProject = null;
    state.segments = [];
  });

  // Eventos do modal
  elements.closeModal.addEventListener('click', closeModal);
  elements.cancelPromptBtn.addEventListener('click', closeModal);

  // Evento para o botão Salvar Resultados
  elements.exportBtn.addEventListener('click', () => {
    saveResults();
  });

  // Funções Auxiliares

  /**
   * Mostra uma seção da interface e esconde as outras
   * @param {string} sectionName - Nome da seção a ser mostrada
   */
  function showSection(sectionName) {
    elements.projectSection.classList.add('hidden');
    elements.inputSection.classList.add('hidden');
    elements.segmentsSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');

    switch (sectionName) {
      case 'project':
        elements.projectSection.classList.remove('hidden');
        break;
      case 'input':
        elements.inputSection.classList.remove('hidden');
        break;
      case 'segments':
        elements.segmentsSection.classList.remove('hidden');
        break;
      case 'results':
        elements.resultsSection.classList.remove('hidden');
        break;
    }
  }

  /**
   * Renderiza os segmentos na interface
   */
  function renderSegments() {
    // Limpar o container
    elements.segmentsContainer.innerHTML = '';

    // Adicionar cada segmento
    state.segments.forEach((segment, index) => {
      const segmentElement = elements.segmentTemplate.content.cloneNode(true);

      // Preencher os dados
      segmentElement.querySelector('.segment-number').textContent = index + 1;
      segmentElement.querySelector('.segment-text').textContent = segment.text;

      // Adicionar o ID do segmento como atributo de dados
      const segmentCard = segmentElement.querySelector('.segment-card');
      segmentCard.dataset.segmentId = segment.id;

      // Adicionar eventos aos botões
      const generateBtn = segmentElement.querySelector('.generate-btn');
      generateBtn.addEventListener('click', async () => {
        showSection('results');
        renderResults();

        // Gerar imagem para este segmento
        const styleDescription = getSelectedStyle();
        await generateImageForSegment(segment.id, styleDescription);
      });

      const editPromptBtn = segmentElement.querySelector('.edit-prompt-btn');
      editPromptBtn.addEventListener('click', () => {
        // Abrir modal para editar o prompt
        openPromptModal(segment);
      });

      // Adicionar o segmento ao container
      elements.segmentsContainer.appendChild(segmentElement);
    });
  }

  /**
   * Renderiza os resultados na interface
   */
  function renderResults() {
    // Limpar o container
    elements.resultsContainer.innerHTML = '';

    // Adicionar cada segmento com espaço para imagem
    state.segments.forEach((segment) => {
      const resultElement = elements.resultTemplate.content.cloneNode(true);

      // Preencher os dados
      resultElement.querySelector('.result-text').textContent = segment.text;

      // Adicionar IDs como atributos de dados
      const resultCard = resultElement.querySelector('.result-card');
      resultCard.dataset.segmentId = segment.id;

      // Adicionar eventos aos botões
      const regenerateBtn = resultElement.querySelector('.regenerate-btn');
      regenerateBtn.addEventListener('click', async () => {
        // Buscar a imagem atual
        try {
          // Mostrar loading imediatamente
          const imageContainer = resultCard.querySelector(
            '.result-image-container'
          );
          const loadingIndicator =
            imageContainer.querySelector('.loading-indicator');
          const imageElement = imageContainer.querySelector('.result-image');

          // Remover mensagens de erro ou info anteriores
          imageContainer
            .querySelectorAll('.error-message, .info-message')
            .forEach((msg) => msg.remove());

          imageElement.classList.add('hidden');
          loadingIndicator.classList.remove('hidden');

          // Verificar se existe uma imagem para regenerar
          let imageId = state.generatedImages[segment.id];
          let regenerateResponse;

          if (imageId) {
            // Regenerar a imagem existente
            regenerateResponse = await api.regenerateImage(
              imageId,
              state.aiParams
            );
          } else {
            // Não há imagem para este segmento, gerar uma nova
            const styleDescription = getSelectedStyle();
            regenerateResponse = await api.generateImage(
              segment.id,
              styleDescription,
              state.aiParams
            );
          }

          // Atualizar a imagem
          if (regenerateResponse.data && regenerateResponse.data.imageUrl) {
            imageElement.src = regenerateResponse.data.imageUrl;
            imageElement.alt =
              regenerateResponse.data.prompt || 'Imagem gerada';
            imageElement.classList.remove('hidden');

            // Armazenar o ID da imagem para referência futura
            if (regenerateResponse.data.id) {
              state.generatedImages[segment.id] = regenerateResponse.data.id;
            }
          } else if (
            (regenerateResponse.data &&
              regenerateResponse.data.status === 'pending') ||
            (regenerateResponse.data &&
              regenerateResponse.data.status === 'regenerating')
          ) {
            // A geração da imagem está em andamento, mostrar mensagem de aguardando
            const waitingMsg = document.createElement('div');
            waitingMsg.className = 'info-message';
            waitingMsg.textContent =
              'Imagem está sendo gerada. Aguarde alguns instantes...';
            imageContainer.appendChild(waitingMsg);

            // Configurar um intervalo para verificar se a imagem está pronta
            const checkInterval = setInterval(async () => {
              try {
                const checkResponse = await api.getImageById(
                  regenerateResponse.data.id
                );
                if (checkResponse.data && checkResponse.data.image_url) {
                  // Imagem está pronta
                  clearInterval(checkInterval);
                  imageElement.src = checkResponse.data.image_url;
                  imageElement.alt =
                    checkResponse.data.prompt || 'Imagem gerada';
                  imageElement.classList.remove('hidden');
                  const infoMsg = imageContainer.querySelector('.info-message');
                  if (infoMsg) infoMsg.remove();
                }
              } catch (error) {
                console.error('Erro ao verificar status da imagem:', error);
                clearInterval(checkInterval);
              }
            }, 5000); // Verificar a cada 5 segundos
          } else {
            // Falha ao gerar imagem, mostrar mensagem de erro
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Falha ao gerar imagem. Tente novamente.';
            imageContainer.appendChild(errorMsg);
          }

          loadingIndicator.classList.add('hidden');
        } catch (error) {
          console.error('Erro ao regenerar imagem:', error);
          showError('Erro ao regenerar imagem: ' + error.message);

          // Esconder o indicador de carregamento em caso de erro
          const imageContainer = resultCard.querySelector(
            '.result-image-container'
          );
          const loadingIndicator =
            imageContainer.querySelector('.loading-indicator');
          loadingIndicator.classList.add('hidden');

          // Mostrar mensagem de erro no card
          const errorMsg = document.createElement('div');
          errorMsg.className = 'error-message';
          errorMsg.textContent = 'Falha ao regenerar imagem. Tente novamente.';
          imageContainer.appendChild(errorMsg);
        }
      });

      const viewPromptBtn = resultElement.querySelector('.view-prompt-btn');
      viewPromptBtn.addEventListener('click', async () => {
        try {
          const response = await api.getImagesBySegment(segment.id);
          if (response.data && response.data.length > 0) {
            const image = response.data[0];

            // Abrir modal para visualizar o prompt
            elements.promptText.value = image.prompt;
            elements.promptText.disabled = true;
            elements.savePromptBtn.classList.add('hidden');
            elements.promptModal.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Erro ao buscar prompt:', error);
          showError('Erro ao buscar prompt: ' + error.message);
        }
      });

      // Adicionar o resultado ao container
      elements.resultsContainer.appendChild(resultElement);
    });
  }

  /**
   * Gera uma imagem para um segmento específico
   * @param {number} segmentId - ID do segmento
   * @param {string} styleDescription - Descrição do estilo
   */
  async function generateImageForSegment(segmentId, styleDescription) {
    // Encontrar o card do resultado correspondente
    const resultCard = elements.resultsContainer.querySelector(
      `[data-segment-id="${segmentId}"]`
    );
    if (!resultCard) return;

    // Elementos da UI
    const imageContainer = resultCard.querySelector('.result-image-container');
    const loadingIndicator = imageContainer.querySelector('.loading-indicator');
    const imageElement = imageContainer.querySelector('.result-image');

    // Remover mensagens de erro anteriores
    const errorMsg = imageContainer.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();

    // Mostrar indicador de carregamento
    loadingIndicator.classList.remove('hidden');
    imageElement.classList.add('hidden');

    try {
      // Gerar a imagem
      const response = await api.generateImage(
        segmentId,
        styleDescription,
        state.aiParams
      );

      // Mostrar a imagem
      if (response.data && response.data.imageUrl) {
        imageElement.src = response.data.imageUrl;
        imageElement.alt = response.data.prompt || 'Imagem gerada';
        imageElement.classList.remove('hidden');

        // Armazenar o ID da imagem para referência futura (para regeneração)
        if (response.data.id) {
          state.generatedImages[segmentId] = response.data.id;
        }
      } else if (response.data && response.data.status === 'pending') {
        // A geração da imagem está em andamento, mostrar mensagem de aguardando
        const waitingMsg = document.createElement('div');
        waitingMsg.className = 'info-message';
        waitingMsg.textContent =
          'Imagem está sendo gerada. Aguarde alguns instantes...';
        imageContainer.appendChild(waitingMsg);

        // Configurar um intervalo para verificar se a imagem está pronta
        const checkInterval = setInterval(async () => {
          try {
            const checkResponse = await api.getImageById(response.data.id);
            if (checkResponse.data && checkResponse.data.image_url) {
              // Imagem está pronta
              clearInterval(checkInterval);
              imageElement.src = checkResponse.data.image_url;
              imageElement.alt = checkResponse.data.prompt || 'Imagem gerada';
              imageElement.classList.remove('hidden');
              const infoMsg = imageContainer.querySelector('.info-message');
              if (infoMsg) infoMsg.remove();
            }
          } catch (error) {
            console.error('Erro ao verificar status da imagem:', error);
            clearInterval(checkInterval);
          }
        }, 5000); // Verificar a cada 5 segundos
      } else {
        // Falha ao gerar imagem, mostrar mensagem de erro
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'Falha ao gerar imagem. Tente novamente.';
        imageContainer.appendChild(errorMsg);
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      showError('Erro ao gerar imagem: ' + error.message);

      // Mostrar mensagem de erro no card
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Falha ao gerar imagem. Tente novamente.';
      imageContainer.appendChild(errorMsg);
    } finally {
      // Esconder o indicador de carregamento
      loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * Retorna o estilo selecionado pelo usuário
   * @returns {string} - Descrição do estilo
   */
  function getSelectedStyle() {
    const preset = elements.stylePreset.value;

    if (preset === 'custom') {
      return elements.customStyle.value.trim();
    } else if (preset) {
      const styleMap = {
        aquarela: 'Estilo de aquarela com cores suaves e pinceladas fluidas',
        pixelart: 'Estilo pixel art com baixa resolução e cores limitadas',
        realista:
          'Estilo foto-realista com detalhes precisos e iluminação natural',
        cartoon:
          'Estilo cartoon colorido com linhas definidas e cores vibrantes',
        anime:
          'Estilo anime/mangá japonês com olhos grandes e expressões exageradas',
        '3d': 'Renderização 3D com texturas detalhadas e iluminação volumétrica',
      };

      return styleMap[preset] || '';
    }

    return '';
  }

  /**
   * Abre o modal de edição de prompt
   * @param {object} segment - Segmento a ser editado
   */
  function openPromptModal(segment) {
    // Gerar um prompt inicial com base no texto do segmento
    elements.promptText.value = `Crie uma ilustração para o seguinte trecho: "${segment.text}"`;
    elements.promptText.disabled = false;

    // Mostrar o botão de salvar
    elements.savePromptBtn.classList.remove('hidden');

    // Ação para o botão de salvar
    elements.savePromptBtn.onclick = async () => {
      const customPrompt = elements.promptText.value.trim();

      // Fechar o modal
      closeModal();

      // Gerar imagem com o prompt personalizado
      showSection('results');
      renderResults();

      // Encontrar o card do resultado
      const resultCard = elements.resultsContainer.querySelector(
        `[data-segment-id="${segment.id}"]`
      );
      if (!resultCard) return;

      // Elementos da UI
      const imageContainer = resultCard.querySelector(
        '.result-image-container'
      );
      const loadingIndicator =
        imageContainer.querySelector('.loading-indicator');
      const imageElement = imageContainer.querySelector('.result-image');

      // Mostrar indicador de carregamento
      loadingIndicator.classList.remove('hidden');
      imageElement.classList.add('hidden');

      try {
        // Gerar a imagem com o prompt personalizado
        const response = await api.generateImage(
          segment.id,
          '',
          state.aiParams,
          customPrompt
        );

        // Mostrar a imagem
        if (response.data && response.data.imageUrl) {
          imageElement.src = response.data.imageUrl;
          imageElement.alt = response.data.prompt;
          imageElement.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        showError('Erro ao gerar imagem: ' + error.message);
      } finally {
        // Esconder o indicador de carregamento
        loadingIndicator.classList.add('hidden');
      }
    };

    // Mostrar o modal
    elements.promptModal.classList.remove('hidden');
  }

  /**
   * Fecha o modal
   */
  function closeModal() {
    elements.promptModal.classList.add('hidden');
  }

  /**
   * Carrega a lista de projetos
   */
  async function loadProjects() {
    try {
      const response = await api.getAllProjects();

      if (response.data && response.data.length > 0) {
        // Limpar a lista
        elements.projectList.innerHTML = '';

        // Adicionar cada projeto
        response.data.forEach((project) => {
          const li = document.createElement('li');

          // Formatar a data
          const date = new Date(project.created_at);
          const formattedDate = date.toLocaleDateString();

          // Estrutura interna
          li.innerHTML = `
            <span class="project-title">${project.title}</span>
            <span class="project-date">${formattedDate}</span>
            <div class="project-actions">
              <button class="btn btn-small continue-project-btn">Continuar</button>
              <button class="btn btn-small btn-secondary view-results-btn">Ver Resultados</button>
            </div>
          `;

          // Adicionando classe para estilização
          li.className = 'project-item';

          // Eventos para os botões
          const continueBtn = li.querySelector('.continue-project-btn');
          const viewResultsBtn = li.querySelector('.view-results-btn');

          // Evento para continuar o projeto (edição)
          continueBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevenir que o clique propague para o li
            continueProject(project);
          });

          // Evento para visualizar resultados
          viewResultsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevenir que o clique propague para o li
            viewProjectResults(project);
          });

          // Evento de clique para selecionar o projeto (mesmo que continuar)
          li.addEventListener('click', () => {
            continueProject(project);
          });

          // Adicionar à lista
          elements.projectList.appendChild(li);
        });

        // Mostrar a lista
        elements.projectListContainer.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  }

  /**
   * Continua um projeto existente
   * @param {object} project - O projeto a ser continuado
   */
  async function continueProject(project) {
    state.currentProject = project;
    elements.currentProjectTitle.textContent = project.title;
    elements.projectId.textContent = project.id;

    // Carregar os segmentos do projeto
    await loadSegments(project.id);

    // Mostrar seção de entrada de texto
    showSection('input');
  }

  /**
   * Visualiza diretamente os resultados de um projeto
   * @param {object} project - O projeto para visualizar
   */
  async function viewProjectResults(project) {
    state.currentProject = project;
    elements.currentProjectTitle.textContent = project.title;
    elements.projectId.textContent = project.id;

    // Carregar os segmentos do projeto
    await loadSegments(project.id);

    // Se tem segmentos, mostrar diretamente os resultados
    if (state.segments.length > 0) {
      await prepareResultsView();
    } else {
      showError('Este projeto não possui segmentos para visualização.');
      showSection('input');
    }
  }

  /**
   * Carrega os segmentos de um projeto
   * @param {number} projectId - ID do projeto
   */
  async function loadSegments(projectId) {
    try {
      const response = await api.getSegmentsByProject(projectId);

      if (response.data && response.data.length > 0) {
        state.segments = response.data;

        // Display a button to view results if segments exist
        const viewResultsBtn = document.createElement('button');
        viewResultsBtn.className = 'btn btn-primary';
        viewResultsBtn.textContent = 'Ver Resultados';
        viewResultsBtn.style.marginLeft = '10px';
        viewResultsBtn.addEventListener('click', () => {
          prepareResultsView();
        });

        // Add the button next to the process button
        const actionButtons =
          elements.inputSection.querySelector('.action-buttons');
        if (
          actionButtons &&
          !actionButtons.querySelector('#view-results-btn')
        ) {
          viewResultsBtn.id = 'view-results-btn';
          actionButtons.insertBefore(viewResultsBtn, elements.resetBtn);
        }

        // If there's already text in the input, show the button
        // Otherwise, wait for user to input new text
        if (elements.textInput.value.trim()) {
          renderSegments();
        }
      } else {
        state.segments = [];
        // Remove the view results button if it exists
        const viewResultsBtn = document.getElementById('view-results-btn');
        if (viewResultsBtn) {
          viewResultsBtn.remove();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
      state.segments = [];
    }
  }

  /**
   * Prepares and shows the results view for existing segments
   */
  async function prepareResultsView() {
    if (state.segments.length === 0) {
      showError('Não há segmentos para mostrar resultados.');
      return;
    }

    // Render segments first if we haven't yet
    renderSegments();

    // Show results section and render the results
    showSection('results');
    renderResults();

    // Initialize loading indicators for all segments
    for (const segment of state.segments) {
      const resultCard = elements.resultsContainer.querySelector(
        `[data-segment-id="${segment.id}"]`
      );
      if (resultCard) {
        const imageContainer = resultCard.querySelector(
          '.result-image-container'
        );
        const loadingIndicator =
          imageContainer.querySelector('.loading-indicator');
        loadingIndicator.classList.remove('hidden');
      }
    }

    // Preload existing images for each segment
    try {
      for (const segment of state.segments) {
        // Get all images for this segment
        const response = await api.getImagesBySegment(segment.id);

        if (response.data && response.data.length > 0) {
          // Store the first (most recent) image ID for each segment
          state.generatedImages[segment.id] = response.data[0].id;

          // Get the full image details
          const imageResponse = await api.getImageById(response.data[0].id);

          if (imageResponse.data) {
            // Find the result card and update the image
            const resultCard = elements.resultsContainer.querySelector(
              `[data-segment-id="${segment.id}"]`
            );

            if (resultCard) {
              const imageContainer = resultCard.querySelector(
                '.result-image-container'
              );
              const loadingIndicator =
                imageContainer.querySelector('.loading-indicator');
              const imageElement =
                imageContainer.querySelector('.result-image');

              // Only update if we have an image URL
              if (imageResponse.data.image_url) {
                // Update the image
                imageElement.src = imageResponse.data.image_url;
                imageElement.alt = imageResponse.data.prompt || 'Imagem gerada';
                imageElement.classList.remove('hidden');
              } else if (
                imageResponse.data.status === 'pending' ||
                imageResponse.data.status === 'regenerating'
              ) {
                // If image is still processing, keep the loading indicator visible
                console.log(
                  `Image for segment ${segment.id} is still processing`
                );
              } else {
                // If image failed or has unknown status, show an error message
                console.error(
                  `Image for segment ${segment.id} has invalid status: ${imageResponse.data.status}`
                );
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.textContent =
                  'Falha ao carregar imagem. Tente regenerar.';
                imageContainer.appendChild(errorMsg);
              }

              // Always hide the loading indicator after we've checked the image
              loadingIndicator.classList.add('hidden');
            }
          }
        } else {
          // No images for this segment
          const resultCard = elements.resultsContainer.querySelector(
            `[data-segment-id="${segment.id}"]`
          );
          if (resultCard) {
            const imageContainer = resultCard.querySelector(
              '.result-image-container'
            );
            const loadingIndicator =
              imageContainer.querySelector('.loading-indicator');
            loadingIndicator.classList.add('hidden');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao preparar visualização de resultados:', error);
      showError('Erro ao carregar resultados: ' + error.message);

      // Hide all loading indicators in case of error
      document.querySelectorAll('.loading-indicator').forEach((indicator) => {
        indicator.classList.add('hidden');
      });
    }
  }

  /**
   * Salva os resultados (exporta como HTML ou PDF)
   */
  function saveResults() {
    if (state.segments.length === 0) {
      showError('Não há resultados para salvar.');
      return;
    }

    // Create a document to export
    let content = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resultados - ${
          state.currentProject ? state.currentProject.title : 'Projeto'
        }</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          h1 { color: #4a6fa5; }
          .result-container { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
          .result-text { padding: 15px; background-color: #f9f9f9; }
          .result-image { display: block; max-width: 100%; margin: 0 auto; }
          .page-break { page-break-after: always; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${
          state.currentProject
            ? state.currentProject.title
            : 'Resultados do Projeto'
        }</h1>
    `;

    // Add each segment and its image
    const resultCards =
      elements.resultsContainer.querySelectorAll('.result-card');
    resultCards.forEach((card, index) => {
      const text = card.querySelector('.result-text').textContent;
      const img = card.querySelector('.result-image');
      const imgSrc = img && !img.classList.contains('hidden') ? img.src : '';

      content += `
        <div class="result-container">
          <div class="result-text">${text}</div>
          ${
            imgSrc
              ? `<img class="result-image" src="${imgSrc}" alt="Ilustração ${
                  index + 1
                }">`
              : ''
          }
        </div>
        ${
          index < resultCards.length - 1 ? '<div class="page-break"></div>' : ''
        }
      `;
    });

    content += `
      </body>
      </html>
    `;

    // Create a blob and download link
    const blob = new Blob([content], {type: 'text/html'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${
      state.currentProject
        ? state.currentProject.title.replace(/\s+/g, '-').toLowerCase()
        : 'projeto'
    }.html`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Mostra uma mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  function showError(message) {
    alert(message);
  }

  // Inicialização da aplicação
  function init() {
    showSection('project');
    loadProjects();
  }

  // Iniciar a aplicação
  init();
});
