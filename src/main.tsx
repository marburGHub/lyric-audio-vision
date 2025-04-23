
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Determina il percorso base per GitHub Pages
// In produzione sarà il nome del repository, in sviluppo sarà '/'
const basename = import.meta.env.PROD ? '/' + window.location.pathname.split('/')[1] : '/';

createRoot(document.getElementById("root")!).render(<App basename={basename} />);
