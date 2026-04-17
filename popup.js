// ==================== POPUP.JS - Controla o popup da extensão ====================

const sliderVolume = document.getElementById('slider-volume');
const sliderVelocidade = document.getElementById('slider-velocidade');
const labelVolume = document.getElementById('label-volume');
const labelVelocidade = document.getElementById('label-velocidade');
const checkboxAtivar = document.getElementById('checkbox-ativar');
const inputPrefixo = document.getElementById('input-prefixo');
const btnMapear = document.getElementById('btn-mapear');
const btnLimparMapa = document.getElementById('btn-limpar-mapa');

// ===== CARREGAR ESTADO SALVO =====
chrome.storage.local.get(['leitor_volume', 'leitor_velocidade', 'leitor_ativo', 'leitor_prefixo'], (result) => {
  const volume = result.leitor_volume !== undefined ? result.leitor_volume : 100;
  const velocidade = result.leitor_velocidade !== undefined ? result.leitor_velocidade : 85;
  const ativo = result.leitor_ativo !== undefined ? result.leitor_ativo : true;
  const prefixo = result.leitor_prefixo || 'FICHA';

  sliderVolume.value = volume;
  sliderVelocidade.value = velocidade;
  labelVolume.textContent = `${volume}%`;
  labelVelocidade.textContent = `${velocidade}%`;
  checkboxAtivar.checked = ativo;
  inputPrefixo.value = prefixo;
});

// ===== SLIDER DE VOLUME =====
sliderVolume.addEventListener('input', (e) => {
  const valor = e.target.value;
  labelVolume.textContent = `${valor}%`;
  
  chrome.storage.local.set({ leitor_volume: valor });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'atualizar_volume',
      valor: valor / 100
    });
  });
});

// ===== SLIDER DE VELOCIDADE =====
sliderVelocidade.addEventListener('input', (e) => {
  const valor = e.target.value;
  labelVelocidade.textContent = `${valor}%`;
  
  chrome.storage.local.set({ leitor_velocidade: valor });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'atualizar_velocidade',
      valor: valor / 100
    });
  });
});

// ===== CHECKBOX: ATIVAR/DESATIVAR EXTENSÃO =====
checkboxAtivar.addEventListener('change', (e) => {
  const ativo = e.target.checked;
  
  chrome.storage.local.set({ leitor_ativo: ativo });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'extensao_ativa',
      valor: ativo
    });
  });
});

// ===== TEXT INPUT: PREFIXO =====
inputPrefixo.addEventListener('change', (e) => {
  const prefixo = e.target.value.toUpperCase().trim() || 'FICHA';
  
  inputPrefixo.value = prefixo;
  
  chrome.storage.local.set({ leitor_prefixo: prefixo });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'alterar_prefixo',
      valor: prefixo
    });
  });
});

// Valida ao digitar
inputPrefixo.addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
});

// ===== BOTÃO MAPEAR TELA =====
btnMapear.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'ativar_mapeamento'
    });
  });
  btnMapear.textContent = '📍 Selecione...';
  btnMapear.disabled = true;
});

// ===== BOTÃO LIMPAR MAPEAMENTO =====
btnLimparMapa.addEventListener('click', () => {
  chrome.storage.local.set({ leitor_area_mapeada: null });
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      tipo: 'desativar_mapeamento'
    });
  });
  btnMapear.textContent = '📍 Mapear Área';
  btnMapear.disabled = false;
});
