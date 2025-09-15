import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Home from './Pages/Home';
import AddProject from './Pages/AddProject';
import ProjectDetails from './Pages/ProjectDetails';
import './App.css';

function App() {
  return (
    <Router>
      <SidebarProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/add-project" element={<AddProject />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />
          </Routes>
        </div>
      </SidebarProvider>
    </Router>
  );
}

export default App;
