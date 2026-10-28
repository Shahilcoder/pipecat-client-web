import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/fredoka"
import "@fontsource-variable/figtree"
import "./index.css"
import { App } from "./app"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
