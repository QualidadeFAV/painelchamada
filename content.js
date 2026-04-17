// ==================== LEITOR HOSPITALAR HUMANO ====================
// Lê automaticamente o texto do centro da tela em PORTUGUÊS BRASILEIRO
// SEM necessidade de clique - inicia automaticamente

let ultimoTextoLido = "";
let estaFalando = false;
let vozPortuguesa = null; // SEMPRE será uma voz pt-BR ou pt-PT (NUNCA outra língua)

// ===== CONTROLES DE QUALIDADE =====
let volumeAtual = 1.0;
let velocidadeAtual = 0.85;
let extensaoAtiva = true;
let prefixoAtual = 'FICHA';

// Carrega valores salvos do chrome.storage
chrome.storage.local.get(['leitor_volume', 'leitor_velocidade', 'leitor_ativo', 'leitor_prefixo'], (result) => {
  volumeAtual = (result.leitor_volume || 100) / 100;
  velocidadeAtual = (result.leitor_velocidade || 85) / 100;
  extensaoAtiva = result.leitor_ativo !== undefined ? result.leitor_ativo : true;
  prefixoAtual = result.leitor_prefixo || 'FICHA';
  console.log(`%c[Leitor] 🎚️ Volume: ${(volumeAtual * 100).toFixed(0)}% | Velocidade: ${(velocidadeAtual * 100).toFixed(0)}% | Prefixo: "${prefixoAtual}" | ${extensaoAtiva ? 'ATIVA' : 'INATIVA'}`, "color: white; background: #3498db; font-size: 12px; padding: 5px;");
});

console.log("%c[Leitor] 🔊 Extensão iniciada - áudio automático", "color: white; background: #27ae60; font-size: 14px; padding: 5px; font-weight: bold;");

// ===== MAPEAMENTO DE TELA =====
let modoMapeamento = false;
let areaCustomizada = null; // {x1, y1, x2, y2}
let overlayMapeamento = null;
let canvas = null;
let ctx = null;
let pontoInicial = null;

// ===== LISTENER PARA MENSAGENS DO POPUP =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.tipo === 'atualizar_volume') {
    volumeAtual = request.valor;
    console.log(`%c[Popup] 🔊 Volume atualizado: ${(volumeAtual * 100).toFixed(0)}%`, "background: #f39c12; color: white;");
  } else if (request.tipo === 'atualizar_velocidade') {
    velocidadeAtual = request.valor;
    console.log(`%c[Popup] ⚡ Velocidade atualizada: ${(velocidadeAtual * 100).toFixed(0)}%`, "background: #f39c12; color: white;");
  } else if (request.tipo === 'extensao_ativa') {
    extensaoAtiva = request.valor;
    ultimoTextoLido = ''; // Limpa cache para ler novamente ao reativar
    console.log(`%c[Popup] 🔊 Extensão ${extensaoAtiva ? 'ATIVADA' : 'DESATIVADA'}`, "background: " + (extensaoAtiva ? '#27ae60' : '#c0392b') + "; color: white;");
  } else if (request.tipo === 'alterar_prefixo') {
    prefixoAtual = request.valor;
    console.log(`%c[Popup] 📝 Prefixo alterado para: "${prefixoAtual}"`, "background: #3498db; color: white;");
  } else if (request.tipo === 'ativar_mapeamento') {
    ativarModoMapeamento();
  } else if (request.tipo === 'desativar_mapeamento') {
    desativarModoMapeamento();
  }
});

// ===== FUNÇÕES DE MAPEAMENTO =====

function ativarModoMapeamento() {
  modoMapeamento = true;
  console.log("%c[Mapeamento] 📍 Modo de seleção ATIVADO - arraste para desenhar retângulo", "background: #8e44ad; color: #fff; font-size: 12px; font-weight: bold;");
  
  // Criar overlay
  overlayMapeamento = document.createElement('div');
  overlayMapeamento.id = 'leitor-overlay-mapeamento';
  overlayMapeamento.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 999999;
  `;
  
  // Criar canvas para desenhar
  canvas = document.createElement('canvas');
  canvas.id = 'leitor-canvas-mapeamento';
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000000;
    cursor: crosshair;
  `;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx = canvas.getContext('2d');
  
  document.body.appendChild(overlayMapeamento);
  document.body.appendChild(canvas);
  
  // Event listeners para desenho
  canvas.addEventListener('mousedown', iniciarSelecao);
  canvas.addEventListener('mousemove', desenharSelecao);
  canvas.addEventListener('mouseup', finalizarSelecao);
  canvas.addEventListener('mouseleave', cancelarSelecao);
}

function iniciarSelecao(e) {
  pontoInicial = { x: e.clientX, y: e.clientY };
}

function desenharSelecao(e) {
  if (!pontoInicial) return;
  
  // Limpar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Desenhar retângulo
  const x1 = pontoInicial.x;
  const y1 = pontoInicial.y;
  const x2 = e.clientX;
  const y2 = e.clientY;
  
  // Calcular dimensões
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  
  // Desenhar retângulo verde com borda
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.fillRect(x, y, width, height);
  
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
  
  // Desenhar cantos
  const tamanhoCorner = 8;
  ctx.fillStyle = '#00ff00';
  // Canto superior esquerdo
  ctx.fillRect(x - tamanhoCorner/2, y - tamanhoCorner/2, tamanhoCorner, tamanhoCorner);
  // Canto superior direito
  ctx.fillRect(x + width - tamanhoCorner/2, y - tamanhoCorner/2, tamanhoCorner, tamanhoCorner);
  // Canto inferior esquerdo
  ctx.fillRect(x - tamanhoCorner/2, y + height - tamanhoCorner/2, tamanhoCorner, tamanhoCorner);
  // Canto inferior direito
  ctx.fillRect(x + width - tamanhoCorner/2, y + height - tamanhoCorner/2, tamanhoCorner, tamanhoCorner);
}

function finalizarSelecao(e) {
  if (!pontoInicial) return;
  
  const x1 = pontoInicial.x;
  const y1 = pontoInicial.y;
  const x2 = e.clientX;
  const y2 = e.clientY;
  
  // Normalizar coordenadas
  areaCustomizada = {
    x1: Math.min(x1, x2),
    y1: Math.min(y1, y2),
    x2: Math.max(x1, x2),
    y2: Math.max(y1, y2)
  };
  
  console.log(`%c[Mapeamento] ✅ Área selecionada: (${areaCustomizada.x1}, ${areaCustomizada.y1}) → (${areaCustomizada.x2}, ${areaCustomizada.y2})`, "background: #27ae60; color: white; font-size: 11px;");
  
  // Salvar no storage
  chrome.storage.local.set({ leitor_area_mapeada: areaCustomizada });
  
  // Limpar mapeamento
  desativarModoMapeamento();
  
  pontoInicial = null;
}

function cancelarSelecao() {
  pontoInicial = null;
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function desativarModoMapeamento() {
  modoMapeamento = false;
  pontoInicial = null;
  
  if (canvas) {
    canvas.removeEventListener('mousedown', iniciarSelecao);
    canvas.removeEventListener('mousemove', desenharSelecao);
    canvas.removeEventListener('mouseup', finalizarSelecao);
    canvas.removeEventListener('mouseleave', cancelarSelecao);
    canvas.remove();
    canvas = null;
    ctx = null;
  }
  
  if (overlayMapeamento) {
    overlayMapeamento.remove();
    overlayMapeamento = null;
  }
  
  console.log("%c[Mapeamento] 🔄 Modo de seleção DESATIVADO - retornando ao centro da tela", "background: #8e44ad; color: #fff; font-size: 12px;");
}

// Carregar área customizada do storage ao iniciar
chrome.storage.local.get('leitor_area_mapeada', (result) => {
  if (result.leitor_area_mapeada) {
    areaCustomizada = result.leitor_area_mapeada;
    console.log(`%c[Mapeamento] 📍 Área customizada carregada: (${areaCustomizada.x1}, ${areaCustomizada.y1}) → (${areaCustomizada.x2}, ${areaCustomizada.y2})`, "background: #8e44ad; color: white; font-size: 11px;");
  }
});

// ==================== SELEÇÃO DE VOZ ====================

function buscarVozPortuguesa() {
  const synth = window.speechSynthesis;
  const vozes = synth.getVoices();

  if (vozes.length === 0) return null;

  // ===== REGRA DE OURO: SOMENTE pt-BR (Brasil) =====
  const ptBR = [];

  for (const v of vozes) {
    if (!v.lang) continue;
    const lang = v.lang.toLowerCase().replace('_', '-');
    if (lang === 'pt-br') {
      ptBR.push(v);
    }
  }

  console.log(`%c[Vozes] Total no sistema: ${vozes.length} | pt-BR (BRASIL): ${ptBR.length}`, "background: #3498db; color: white; font-size: 10px;");

  if (ptBR.length === 0) {
    console.error("%c[Vozes] ❌ NENHUMA voz pt-BR encontrada!", "background: #c0392b; color: white; font-size: 11px;");
    return null;
  }

  console.log(`%c[Vozes] Analisando TODAS as ${ptBR.length} vozes pt-BR disponíveis:`, "background: #2c3e50; color: #ecf0f1; font-size: 12px; font-weight: bold; padding: 5px;");
  ptBR.forEach((v, i) => {
    const tipoServico = v.localService ? '📍 LOCAL (estável)' : '☁️ ONLINE (pode ter bugs)';
    const isList = v.name.includes('Multilingual') ? '❌ MULTILÍNGUE - RUIM' : '✅ PURA - BOM';
    console.log(`%c  [${i + 1}] ${v.name}`, "background: #34495e; color: #ecf0f1; font-size: 11px; padding: 3px;");
    console.log(`       ${isList} | ${tipoServico}`, "background: #34495e; color: #ecf0f1; font-size: 10px;");
  });

  // ===== PRIORIDADE DE SELEÇÃO =====
  // Vozes com "(Natural)" no nome são muito mais naturais!
  // Ordem: Francisca Natural (feminina online) > Antonio Natural (online) > Local como fallback

  const ptBRPuras = ptBR.filter(v => !v.name.includes('Multilingual'));

  if (ptBRPuras.length === 0) {
    console.error("%c[Vozes] 🚫 PROBLEMA: Todas as vozes pt-BR são MULTILÍNGUES", "background: #c0392b; color: white; font-size: 11px;");
    return null;
  }

  // PRIORIDADE 1: Francisca (Natural) - feminina + online + natural
  let escolhida = ptBRPuras.find(v => v.name.includes('Francisca') && v.name.includes('Natural'));
  
  // PRIORIDADE 2: Antonio (Natural) - online + natural
  if (!escolhida) {
    escolhida = ptBRPuras.find(v => v.name.includes('Antonio') && v.name.includes('Natural'));
  }

  // PRIORIDADE 3: Qualquer voz com (Natural) no nome
  if (!escolhida) {
    escolhida = ptBRPuras.find(v => v.name.includes('Natural'));
  }

  // PRIORIDADE 4: Maria Local como fallback
  if (!escolhida) {
    escolhida = ptBRPuras.find(v => v.name.includes('Maria'));
  }

  // PRIORIDADE 5: Qualquer voz pura disponível
  if (!escolhida) {
    escolhida = ptBRPuras[0];
  }

  const tipo = escolhida.localService ? '📍 LOCAL' : '☁️ ONLINE';
  const isNatural = escolhida.name.includes('Natural') ? '✨ NATURAL' : 'sintetizada';
  console.log(`%c[Vozes] ✅ SELECIONADA: ${escolhida.name} [${tipo} | ${isNatural}]`, "background: #27ae60; color: white; font-size: 11px; font-weight: bold;");
  return escolhida;
}

// Carrega vozes (pode demorar no Chrome)
function carregarVozes() {
  vozPortuguesa = buscarVozPortuguesa();
  if (vozPortuguesa) {
    console.log(`%c[Vozes] 🎤 Pronta: ${vozPortuguesa.name}`, "background: #27ae60; color: white;");
  }
}

// Vozes podem carregar assíncronamente
window.speechSynthesis.onvoiceschanged = carregarVozes;
carregarVozes(); // Tenta imediato também

// ==================== CONVERSÃO DE NÚMEROS ====================

function converterNumerosEmDezenas(texto) {
  const dezenas = {
    '00': 'zero zero', '01': 'zero um', '02': 'zero dois', '03': 'zero três',
    '04': 'zero quatro', '05': 'zero cinco', '06': 'zero seis', '07': 'zero sete',
    '08': 'zero oito', '09': 'zero nove', '10': 'dez', '11': 'onze',
    '12': 'doze', '13': 'treze', '14': 'quatorze', '15': 'quinze',
    '16': 'dezesseis', '17': 'dezessete', '18': 'dezoito', '19': 'dezenove',
    '20': 'vinte', '21': 'vinte e um', '22': 'vinte e dois', '23': 'vinte e três',
    '24': 'vinte e quatro', '25': 'vinte e cinco', '26': 'vinte e seis',
    '27': 'vinte e sete', '28': 'vinte e oito', '29': 'vinte e nove',
    '30': 'trinta', '31': 'trinta e um', '32': 'trinta e dois', '33': 'trinta e três',
    '34': 'trinta e quatro', '35': 'trinta e cinco', '36': 'trinta e seis',
    '37': 'trinta e sete', '38': 'trinta e oito', '39': 'trinta e nove',
    '40': 'quarenta', '41': 'quarenta e um', '42': 'quarenta e dois', '43': 'quarenta e três',
    '44': 'quarenta e quatro', '45': 'quarenta e cinco', '46': 'quarenta e seis',
    '47': 'quarenta e sete', '48': 'quarenta e oito', '49': 'quarenta e nove',
    '50': 'cinquenta', '51': 'cinquenta e um', '52': 'cinquenta e dois', '53': 'cinquenta e três',
    '54': 'cinquenta e quatro', '55': 'cinquenta e cinco', '56': 'cinquenta e seis',
    '57': 'cinquenta e sete', '58': 'cinquenta e oito', '59': 'cinquenta e nove',
    '60': 'sessenta', '61': 'sessenta e um', '62': 'sessenta e dois', '63': 'sessenta e três',
    '64': 'sessenta e quatro', '65': 'sessenta e cinco', '66': 'sessenta e seis',
    '67': 'sessenta e sete', '68': 'sessenta e oito', '69': 'sessenta e nove',
    '70': 'setenta', '71': 'setenta e um', '72': 'setenta e dois', '73': 'setenta e três',
    '74': 'setenta e quatro', '75': 'setenta e cinco', '76': 'setenta e seis',
    '77': 'setenta e sete', '78': 'setenta e oito', '79': 'setenta e nove',
    '80': 'oitenta', '81': 'oitenta e um', '82': 'oitenta e dois', '83': 'oitenta e três',
    '84': 'oitenta e quatro', '85': 'oitenta e cinco', '86': 'oitenta e seis',
    '87': 'oitenta e sete', '88': 'oitenta e oito', '89': 'oitenta e nove',
    '90': 'noventa', '91': 'noventa e um', '92': 'noventa e dois', '93': 'noventa e três',
    '94': 'noventa e quatro', '95': 'noventa e cinco', '96': 'noventa e seis',
    '97': 'noventa e sete', '98': 'noventa e oito', '99': 'noventa e nove'
  };

  const digitos = { '0': 'zero', '1': 'um', '2': 'dois', '3': 'três', '4': 'quatro', '5': 'cinco', '6': 'seis', '7': 'sete', '8': 'oito', '9': 'nove' };

  let resultado = '';
  let i = 0;

  while (i < texto.length) {
    if (/[a-z]/i.test(texto[i])) {
      // Agrupa letras consecutivas (MV -> "MV")
      let palavra = '';
      while (i < texto.length && /[a-z]/i.test(texto[i])) {
        palavra += texto[i];
        i++;
      }
      resultado += palavra + ', ';
    } else if (/\d/.test(texto[i])) {
      // Agrupa números em pares (dezenas)
      if (i + 1 < texto.length && /\d/.test(texto[i + 1])) {
        const par = texto[i] + texto[i + 1];
        resultado += (dezenas[par] || par) + ', ';
        i += 2;
      } else {
        resultado += (digitos[texto[i]] || texto[i]) + ', ';
        i++;
      }
    } else {
      i++;
    }
  }

  return resultado.replace(/,\s*$/, '');
}

// ==================== FALA ====================

function falar(texto) {
  const synth = window.speechSynthesis;

  // *** SE EXTENSÃO ESTÁ DESATIVADA, NÃO FALA ***
  if (!extensaoAtiva) {
    return;
  }

  // Re-busca voz se perdeu (Chrome pode resetar vozes)
  if (!vozPortuguesa || !vozPortuguesa.lang || !vozPortuguesa.lang.toLowerCase().startsWith('pt')) {
    vozPortuguesa = buscarVozPortuguesa();
  }

  // *** REGRA DE OURO: SEM VOZ PORTUGUESA = NÃO FALA ***
  // Isso ELIMINA 100% o problema de falar em outro idioma
  if (!vozPortuguesa) {
    console.error("%c[Fala] 🚫 SEM voz portuguesa - NÃO vai falar (melhor silêncio que idioma errado)", "background: #c0392b; color: white; font-size: 11px;");
    estaFalando = false;
    return;
  }

  texto = converterNumerosEmDezenas(texto);
  texto = prefixoAtual + ", " + texto;

  estaFalando = true;

  // Cancela qualquer fala anterior (imediato - sem delay)
  synth.cancel();

  const fala = new SpeechSynthesisUtterance(texto);

  // FORÇA voz portuguesa explícita (NUNCA depende do lang sozinho)
  fala.voice = vozPortuguesa;
  fala.lang = 'pt-BR'; // ⭐ FORÇA SEMPRE pt-BR (não usa lang da voz)
  fala.rate = velocidadeAtual;
  fala.pitch = 1.0;
  fala.volume = volumeAtual;

  console.log(`%c[Fala] 🗣️ "${texto}" → ${vozPortuguesa.name} [PT-BR FORÇADO]`, "background: #3498db; color: white; font-size: 10px;");

  fala.onend = () => {
    estaFalando = false;
  };

  fala.onerror = (e) => {
    estaFalando = false;
    console.error(`%c[Fala] ❌ ${e.error}`, "background: #c0392b; color: white;");
  };

  synth.speak(fala);
}

// ==================== LEITURA DO CENTRO DA TELA ====================

function lerCentroDaTela() {
  if (estaFalando) return;

  let x, y;

  // Se há área customizada, usar ponto dentro dela
  if (areaCustomizada) {
    x = (areaCustomizada.x1 + areaCustomizada.x2) / 2;
    y = (areaCustomizada.y1 + areaCustomizada.y2) / 2;
  } else {
    // Caso contrário, usar centro da tela
    x = window.innerWidth / 2;
    y = window.innerHeight / 2;
  }

  const elemento = document.elementFromPoint(x, y);

  if (!elemento || elemento === document.body || elemento === document.documentElement) return;

  let textoAtual = (elemento.innerText || elemento.textContent || "").trim();
  textoAtual = textoAtual.replace(/\s+/g, ' ');

  if (textoAtual.includes('\n')) {
    textoAtual = textoAtual.split('\n')[0].trim();
  }

  if (textoAtual.length > 150) {
    textoAtual = textoAtual.substring(0, 150).trim();
  }

  if (textoAtual.length < 2) return;

  if (textoAtual !== ultimoTextoLido) {
    const local = areaCustomizada ? '📍 [área customizada]' : '📍 [centro da tela]';
    console.log(`%c[Leitura] ${local} Nova senha: ${textoAtual}`, "background: #27ae60; color: white; font-size: 12px; font-weight: bold;");
    ultimoTextoLido = textoAtual;
    falar(textoAtual);
  }
}

// ==================== MONITORAMENTO ====================

const observador = new MutationObserver(() => {
  if (!estaFalando) lerCentroDaTela();
});

function iniciar() {
  carregarVozes();

  observador.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setInterval(() => {
    if (!estaFalando) lerCentroDaTela();
  }, 1000); // ⚡ Reduzido para 1 segundo (mais responsivo)

  window.addEventListener('scroll', () => {
    if (!estaFalando) lerCentroDaTela();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!estaFalando) lerCentroDaTela();
  }, { passive: true });

  setTimeout(lerCentroDaTela, 500);
  console.log("%c[Leitor] ✅ Monitoramento ativo", "background: #27ae60; color: white; font-size: 12px; font-weight: bold;");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}
