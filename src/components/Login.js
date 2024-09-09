import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseConfig';
import './Login.css';

const Login = ({ setEmail }) => {
  const [email, setEmailState] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail(email); // Kullanıcı e-postasını Dashboard'a gönderiyoruz
      navigate('/dashboard'); // Giriş başarılı, dashboard ekranına yönlendir
    } catch (error) {
      setMessage('Giriş başarısız: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmailState(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Giriş Yap</button>
        {message && <p className="login-message">{message}</p>}
      </form>
      <button onClick={() => navigate('/signup')} className="signup-button">Kayıt Ol</button>
    </div>
  );
};

export default Login;
