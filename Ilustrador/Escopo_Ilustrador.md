# Escopo do Projeto: Ilustrador de Textos (Versão Simplificada)

## Visão Geral

O Ilustrador de Textos é uma ferramenta web que permite aos usuários colar trechos de livros, contos ou outros textos literários para gerar automaticamente ilustrações que representem visualmente o conteúdo. O sistema utiliza inteligência artificial para analisar o texto, segmentá-lo estrategicamente em partes relevantes, e gerar imagens que capturam a essência de cada segmento, respeitando um estilo visual definido pelo usuário.

## Objetivos

- Criar uma interface intuitiva onde usuários possam colar textos para ilustração
- Permitir a personalização do estilo visual das ilustrações
- Automatizar a segmentação inteligente do texto em partes que merecem ilustração
- Gerar e apresentar sequencialmente as imagens junto com seus trechos correspondentes
- Oferecer controle sobre parâmetros da IA generativa

## Funcionalidades Principais

### 1. Entrada de Texto

- Campo para colar textos (livros, contos, artigos)
- Suporte para formatação básica de texto (plain text)

### 2. Definição de Estilo Visual

- Interface para definir o estilo visual desejado para todas as ilustrações
- Opções para selecionar estilos pré-configurados (aquarela, pixel art, realista, cartoon, etc.)
- Campo para inserção de prompt personalizado descrevendo o estilo

### 3. Configuração de Parâmetros da IA

- Controles para ajustar parâmetros da IA generativa:
  - Temperatura/aleatoriedade
  - Fidelidade ao prompt
  - Resolução e dimensões das imagens
  - Modelo de IA a ser utilizado

### 4. Segmentação Inteligente do Texto

- Sistema de LLM para analisar o texto completo
- Algoritmo para identificar pontos estratégicos para ilustração:
  - Momentos-chave da narrativa
  - Descrições vívidas de cenários ou personagens
  - Eventos importantes ou pontos de virada
  - Passagens emocionalmente carregadas
- Determinação automática da quantidade ideal de ilustrações

### 5. Geração de Prompts Específicos

- LLM dedicada à criação de prompts detalhados para cada segmento
- Extração de elementos visuais relevantes do texto
- Incorporação do estilo definido pelo usuário
- Armazenamento do prompt como texto alternativo (alt) da imagem

### 6. Geração e Apresentação Sequencial de Imagens

- Integração com IA generativa de imagens (como DALL-E, Midjourney ou Stable Diffusion)
- Processamento das imagens em sequência
- Apresentação de cada imagem assim que disponível, junto com:
  - O trecho de texto correspondente
  - O prompt utilizado (como alt da imagem)
- Indicador visual de progresso para imagens em geração

### 7. Visualização e Interação

- Layout responsivo mostrando texto e imagens correspondentes lado a lado
- Possibilidade de regenerar imagens específicas
- Funcionalidade para salvar ou compartilhar resultados

## Arquitetura Técnica

### Componentes do Sistema

1. **Frontend**

   - HTML, CSS, JavaScript
   - Interface responsiva para entrada de texto e visualização de resultados
   - Comunicação assíncrona com o backend

2. **Backend (Node.js + Express.js)**

   - API RESTful para processar solicitações
   - Integração com serviços de IA

3. **Módulo de Segmentação (LLM)**

   - API de integração com LLM da OpenAI
   - Lógica para identificação de pontos-chave para ilustração

4. **Gerador de Prompts (LLM)**

   - Transformação de segmentos de texto em prompts descritivos
   - Incorporação de estilo definido pelo usuário

5. **Gerador de Imagens**

   - Integração com APIs de IA generativa
   - Processamento sequencial de geração

6. **Armazenamento (SQLite)**
   - Banco de dados local no navegador
   - Armazenamento de:
     - Textos submetidos
     - Segmentos identificados
     - Prompts gerados
     - Imagens resultantes (ou referências)
     - Configurações de estilo

### Fluxo de Processamento

1. Usuário cola texto e configura estilo/parâmetros
2. Sistema envia texto para processamento
3. LLM segmenta o texto e determina pontos-chave para ilustração
4. Para cada segmento, sistema gera um prompt específico
5. Prompts são enviados sequencialmente para a IA generativa
6. À medida que cada imagem é gerada, é exibida imediatamente junto com seu trecho e prompt
7. Usuário pode interagir com as imagens geradas e regenerá-las se necessário

## Limitações e Considerações

- Capacidade de processamento depende dos limites das APIs de IA
- Qualidade das ilustrações varia de acordo com a clareza do texto
- Textos muito abstratos ou conceituais podem resultar em ilustrações menos precisas
- Considerações de privacidade para textos submetidos às APIs externas
- Custos associados ao uso das APIs de LLM e geração de imagens

## Requisitos Técnicos

- Frontend: HTML, CSS, JavaScript (possivelmente com React)
- Backend: Node.js com Express.js
- Armazenamento: SQLite (local no navegador)
- APIs de IA: OpenAI (GPT-4 + DALL-E)
- Deploy: Docker para ambiente de desenvolvimento

---

Este documento de escopo simplificado serve como base para o desenvolvimento inicial do Ilustrador de Textos e está sujeito a expansões futuras conforme o projeto evolui.
