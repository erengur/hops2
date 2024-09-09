import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Firebase Authentication kayıt fonksiyonu
import { auth, database } from './firebaseConfig'; // Firebase yapılandırma dosyası
import { collection, addDoc } from 'firebase/firestore'; // Firestore işlemleri
import './signup.css'; // Signup için CSS dosyası
import { useNavigate } from 'react-router-dom'; // Yönlendirme için

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState(''); // Yeni Adres alanı
  const [phoneNumber, setPhoneNumber] = useState(''); // Yeni Telefon Numarası alanı
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false); // Popup kontrolü için state
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // Firebase Authentication ile yeni kullanıcı kaydet
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore'da "users" koleksiyonuna kullanıcıyı ekle
      await addDoc(collection(database, 'users'), {
        email: user.email,
        uid: user.uid,
        address: address, // Adres bilgisi
        phoneNumber: phoneNumber, // Telefon numarası
        createdAt: new Date().toISOString()
      });

      setMessage('Kayıt başarılı!'); // Başarılı mesajı
      setShowPopup(true); // Popup'ı göster

      // 2 saniye sonra popup'ı kapat ve login sayfasına yönlendir
      setTimeout(() => {
        setShowPopup(false);
        navigate('/'); // Login sayfasına yönlendir
      }, 2000);
    } catch (error) {
      setMessage('Kayıt başarısız: ' + error.message); // Hata mesajı
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
          placeholder="Adres" // Adres alanı
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="text"
          placeholder="Telefon Numarası" // Telefon numarası alanı
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          className="signup-input"
        />
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
