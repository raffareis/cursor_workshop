# Ilustrador de Textos

Uma aplicação web que transforma textos literários em ilustrações usando Inteligência Artificial.

## Funcionalidades

- Segmentação inteligente de textos para identificar pontos-chave para ilustração
- Geração automática de prompts para cada segmento
- Geração sequencial de imagens com exibição em tempo real
- Interface amigável para visualização de texto e imagens lado a lado
- Personalização de estilo visual para todas as ilustrações
- Controle sobre parâmetros da IA generativa

## Requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn
- Chave de API da OpenAI

## Instalação

1. Clone o repositório:

   ```bash
   git clone <url-do-repositorio>
   cd ilustrador-textos
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie um arquivo `.env` na raiz do projeto baseado no arquivo `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Edite o arquivo `.env` e adicione sua chave de API da OpenAI:

   ```bash
   OPENAI_API_KEY=sua_chave_api_aqui
   ```

5. Crie o diretório para o banco de dados:
   ```bash
   mkdir -p data
   ```

## Execução

1. Inicie o servidor:

   ```bash
   npm start
   ```

2. Para desenvolvimento com recarga automática:

   ```bash
   npm run dev
   ```

3. Acesse a aplicação em seu navegador:
   ```
   http://localhost:3000
   ```

## Uso

1. **Criar um Projeto**: Dê um título ao seu projeto e clique em "Criar Projeto".

2. **Inserir Texto**: Cole o texto que deseja ilustrar na área de texto.

3. **Configurar Estilo**: Escolha um estilo visual predefinido ou personalize seu próprio estilo.

4. **Processar Texto**: Clique em "Processar Texto" para que a IA identifique os melhores pontos para ilustração.

5. **Gerar Imagens**: Você pode gerar todas as imagens de uma vez ou uma por uma.

6. **Visualizar Resultados**: As imagens serão exibidas junto com seus respectivos trechos de texto.

7. **Regenerar ou Editar**: Você pode regenerar imagens ou editar o prompt para obter resultados diferentes.

## Tecnologias Utilizadas

- Backend: Node.js com Express.js
- Frontend: HTML, CSS, JavaScript
- Banco de Dados: SQLite
- IA: OpenAI (GPT-4 para análise de texto e DALL-E para geração de imagens)

## Limitações

- A API da OpenAI pode ter custos associados
- Textos muito longos podem ser truncados
- Alguns conceitos abstratos podem ser difíceis de ilustrar

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
