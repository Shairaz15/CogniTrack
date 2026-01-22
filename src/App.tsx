import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing, Dashboard, Tests } from "./pages";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tests" element={<Tests />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
