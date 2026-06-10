import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import RaceLive from "./RaceLive";
import Standings from "./Standings";
import Drivers from "./Drivers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/race" element={<RaceLive />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/drivers" element={<Drivers />} />
      </Routes>
    </BrowserRouter>
  );
}
