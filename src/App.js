import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // BrowserRouter kullanıyoruz
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  const [userEmail, setUserEmail] = useState(''); // Kullanıcının e-posta bilgisi

  const handleLogin = (email) => {
    setUserEmail(email);   // Kullanıcının e-posta bilgisi kaydedildi
  };

  const handleLogout = () => {
    setUserEmail('');
  };

  return (
    <Router>
  <Routes>
    <Route path="/" element={<Login setEmail={setUserEmail} onLogin={handleLogin} />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/dashboard" element={<Dashboard onSignOut={handleLogout} userEmail={userEmail} />} />
  </Routes>
</Router>

  );
}

export default App;
