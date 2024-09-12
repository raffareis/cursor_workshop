# Cursor Workshop

## Instalação

1. Baixe o Cursor em [https://www.cursor.com/](https://www.cursor.com/)
2. Instale o aplicativo
3. Importe suas extensões e configurações do VS Code
4. (Opcional) Recomendo selecionar "Install cursor" para adicionar o comando `cursor` no terminal, similar ao `code` do VS Code
5. Crie uma conta (use a conta da empresa para facilitar o pagamento) e faça login

## Configuração do Git

### Windows

1. Baixe e instale o Git para Windows em [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Durante a instalação, mantenha as opções padrão, mas certifique-se de escolher "Use Git from the Windows Command Prompt"
3. Abra o Cursor e vá para Terminal > New Terminal
4. Configure seu nome de usuário e email do Git:
   ```
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

### Linux

1. Abra o terminal e instale o Git usando o gerenciador de pacotes da sua distribuição:
   - Para Ubuntu/Debian: `sudo apt-get update && sudo apt-get install git`
   - Para Fedora: `sudo dnf install git`
2. Configure seu nome de usuário e email do Git:
   ```
   git config --global user.name "Seu Nome"
   git config --global user.email "seu.email@exemplo.com"
   ```

## Instalação do Node.js

### Windows

1. Baixe o instalador do Node.js em [https://nodejs.org/](https://nodejs.org/)
2. Execute o instalador e siga as instruções, mantendo as opções padrão
3. Abra o Cursor e vá para Terminal > New Terminal
4. Verifique a instalação digitando:
   ```
   node --version
   npm --version
   ```

### Linux

1. Abra o terminal e instale o Node.js usando o gerenciador de pacotes da sua distribuição:
   - Para Ubuntu/Debian:
     ```
     curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```
   - Para Fedora:
     ```
     sudo dnf install nodejs
     ```
2. Verifique a instalação digitando:
   ```
   node --version
   npm --version
   ```

## Configurações Recomendadas

### General

![General Settings](./Imagens/Settings_General.png)

- Se não importou ainda as configurações do VS, aqui tem um botão pra isso.

- Em `Rules for AI`, cole seus arquivos de configuração da linguagem (prettier.json, eslint, etc.) e peça para o AI respeitar ao gerar código
  - Adicione outras instruções que julgar necessárias, como forçar a utilização de um idioma específico

### Models

![Models Settings](./Imagens/Settings_Model.png)

- Mantenha ativados apenas:
  - GPT-4
  - Claude-3.5-sonnet

### Cursor Tab

![Cursor Tab Settings](./Imagens/Settings_CursorTab.png)

- [x] Enabled
- [x] Cursor Prediction
- [x] Trigger in Comments
- [x] Auto Import

### Composer

![Composer Settings](./Imagens/Settings_Composer.png)

- [x] Enabled
- [x] Composer projects (ALPHA)
- [x] Ctrl+P for file picker
- [x] Show suggested files

### Beta Features

![Beta Features](./Imagens/Settings_Beta.png)

- [x] Long Context Chat (BETA)
- [x] AI Review (ALPHA)

> As demais configurações podem ser mantidas no padrão
