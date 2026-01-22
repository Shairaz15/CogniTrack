import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landing, Dashboard, Tests, MemoryAssessment } from "./pages";
import { ReactionTimeTest } from "./components/tests/reaction/ReactionTimeTest";
import { PatternAssessment } from "./components/tests/pattern/PatternAssessment";
import { LanguageAssessment } from "./components/tests/language/LanguageAssessment";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/test/memory" element={<MemoryAssessment />} />
        <Route path="/test/reaction" element={<ReactionTimeTest />} />
        <Route path="/tests/pattern" element={<PatternAssessment />} />
        <Route path="/tests/language" element={<LanguageAssessment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
