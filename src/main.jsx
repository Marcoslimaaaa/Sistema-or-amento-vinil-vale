import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Quando um chunk com hash antigo some após um novo deploy, o Vite dispara
// "vite:preloadError". Recarregamos a página uma vez por sessão para pegar o
// index.html/chunks novos, evitando o "Failed to fetch dynamically imported
// module" que aparecia ao gerar orçamento/PDF logo após uma atualização.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  if (!sessionStorage.getItem('vv-chunk-reload')) {
    sessionStorage.setItem('vv-chunk-reload', '1')
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
