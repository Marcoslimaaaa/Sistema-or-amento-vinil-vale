import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { EVENTO_CHUNK, emPreloadSilencioso } from './App.jsx'

// Quando um chunk com hash antigo some após um novo deploy, o Vite dispara
// "vite:preloadError". Antes recarregávamos a página na hora — o que apagava o
// orçamento em edição, já que o único chunk carregado sob demanda no meio do
// trabalho é o do PDF. Agora só avisamos o App: ele salva o rascunho e deixa o
// recarregamento na mão de quem está usando.
// Sem preventDefault de propósito. O `__vitePreload` só relança o erro do
// import quando ninguém cancela este evento — com preventDefault ele RESOLVE
// COM UNDEFINED, e o `jsPDF: j.jsPDF` do loadPdfLibs vira
// "Cannot read properties of undefined (reading 'jsPDF')". Era o que sobrava
// quando o reload já tinha acontecido uma vez na mesma sessão. Aqui só
// avisamos; quem chamou o import trata a rejeição.
window.addEventListener('vite:preloadError', (event) => {
  if (emPreloadSilencioso()) return // busca antecipada: falha sem incomodar
  window.dispatchEvent(new CustomEvent(EVENTO_CHUNK, { detail: { origem: 'preload' } }))
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
