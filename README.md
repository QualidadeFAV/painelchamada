# 🔊 Leitor de Fichas Hospitalar

Extensão Chrome para leitura automática de fichas e senhas hospitalares com voz natural em português brasileiro.

## 🎯 Funcionalidades

- 🔊 **Leitura automática** do centro da tela
- 🗣️ **Voz natural** em português (Francisca - Microsoft)
- ⚡ **Controle de velocidade** (50-150%)
- 🔊 **Controle de volume** (0-100%)
- ☑️ **Ativar/desativar** a extensão
- 📝 **Prefixo customizável** (ex: FICHA, CHAMADA)
- 📍 **Mapear áreas** da tela para leitura seletiva

## 📋 Arquivos

- **manifest.json** - Configuração da extensão
- **content.js** - Lógica principal (leitura de texto, controle de voz)
- **popup.html** - Interface do popup
- **popup.js** - Controle do popup
- **ficha_chamada.html** - Arquivo de teste/demonstração

## 🚀 Como Usar Localmente

1. Clone ou baixe esta pasta
2. Abra Chrome e acesse: `chrome://extensions/`
3. Ative **"Modo de desenvolvedor"** (canto superior direito)
4. Clique em **"Carregar extensão não empacotada"**
5. Selecione a pasta `leitor_tela`
6. Pronto! A extensão está ativa

## 🔧 Tecnologias

- **Chrome Extension Manifest V3**
- **Web Speech Synthesis API** (nativa do navegador)
- **Chrome Storage API**
- Sem dependências externas

## 📝 Notas

- Funciona apenas em **Chrome/Edge** (Manifest V3)
- Não coleta dados pessoais
- Funciona 100% localmente
- Suporta qualquer website

## 📄 Licença

Livre para usar e modificar.

## 👨‍💻 Desenvolvido por

Raphael Barros
