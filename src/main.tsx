import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root が見つかりません')

createRoot(container).render(
  <StrictMode>
    {/* GitHub Pages で 404.html の小細工なしにディープリンクを成立させるため HashRouter */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
