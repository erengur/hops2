import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, database, storage } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './signup.css';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState(null);
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let logoUrl = '';
      if (logo) {
        const logoRef = ref(storage, `logos/${user.uid}`);
        await uploadBytes(logoRef, logo);
        logoUrl = await getDownloadURL(logoRef);
      }

      await addDoc(collection(database, 'users'), {
        email: user.email,
        uid: user.uid,
        address: address,
        phoneNumber: phoneNumber,
        companyName: companyName,
        logoUrl: logoUrl,
        createdAt: new Date().toISOString()
      });

      setMessage('Kayıt başarılı!');
      setShowPopup(true);

      setTimeout(() => {
        setShowPopup(false);
        navigate('/');
      }, 2000);
    } catch (error) {
      setMessage('Kayıt başarısız: ' + error.message);
    }
  };

  return (
    <div className="signup-container">
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSignup} className="signup-form">
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="text"
          placeholder="Firma Adı"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="text"
          placeholder="Adres"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="text"
          placeholder="Telefon Numarası"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="signup-input"
        />
        <div className="file-input-container">
          <label htmlFor="logo-upload" className="file-input-label">
            Logo Seç
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="file-input"
          />
          {logo && <span className="file-name">{logo.name}</span>}
        </div>
        <button type="submit" className="signup-button">Kayıt Ol</button>
        {message && <p className="signup-message">{message}</p>}
      </form>
  
      {showPopup && (
        <div className="popup-message">
          Kullanıcı başarıyla oluşturuldu!
        </div>
      )}
    </div>
  );
};

export default Signup;