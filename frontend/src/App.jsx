
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/register" replace />} />

         <Route path="/login" element={<Login />} />

        {/* Create this page next, or temporarily redirect after login. */}
        <Route path="/dashboard" element={<Dashboard />} />

       <Route path="/rooms/:roomCode" element={<RoomPage />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
