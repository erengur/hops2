import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Giriş durumu kontrolü
  const [userEmail, setUserEmail] = useState(''); // Kullanıcının e-posta bilgisi

  const handleLogin = (email) => {
    setIsLoggedIn(true);  // Giriş durumu true yapıldı
    setUserEmail(email);   // Kullanıcının e-posta bilgisi kaydedildi
  };

  const handleLogout = () => {
    setIsLoggedIn(false); // Kullanıcı çıkış yapınca giriş durumu false yapılır
    setUserEmail('');
  };

  return (
    <Router>
      <Routes>
        {/* Giriş ekranı */}
        <Route path="/" element={<Login setEmail={setUserEmail} onLogin={handleLogin} />} />

        {/* Kayıt ekranı */}
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard ekranı - Giriş yapılmışsa göster */}
        <Route path="/dashboard" element={<Dashboard onSignOut={handleLogout} userEmail={userEmail} />} />
      </Routes>
    </Router>
  );
}

export default App;
