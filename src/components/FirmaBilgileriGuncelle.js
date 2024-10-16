import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from './firebaseConfig';
import './FirmaBilgileriGuncelle.css';

const FirmaBilgileriGuncelle = ({ userData, onClose, userEmail, onUpdate }) => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [logo, setLogo] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userData) {
      setCompanyName(userData.companyName || '');
      setAddress(userData.address || '');
      setPhoneNumber(userData.phoneNumber || '');
      setCurrentLogoUrl(userData.logoUrl || '');
    }
  }, [userData]);

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    console.log("handleSubmit fonksiyonu çağrıldı");
    
    try {
      console.log("Güncelleme işlemi başladı");
      const userDocRef = doc(database, 'users', userEmail);
      
      const docSnap = await getDoc(userDocRef);

      let updatedData = {
        companyName,
        address,
        phoneNumber,
        email: userEmail,
        lastUpdated: new Date().toISOString() // Son güncelleme zamanını ekliyoruz
      };

      if (logo) {
        console.log("Logo yükleniyor");
        const logoRef = ref(storage, `logos/${userEmail}`);
        await uploadBytes(logoRef, logo);
        const logoUrl = await getDownloadURL(logoRef);
        updatedData.logoUrl = logoUrl;
      } else if (currentLogoUrl) {
        updatedData.logoUrl = currentLogoUrl;
      }

      console.log("Firestore güncelleniyor", updatedData);
      
      if (docSnap.exists()) {
        await updateDoc(userDocRef, updatedData);
      } else {
        await setDoc(userDocRef, updatedData);
      }
      
      console.log("Güncelleme başarılı");
      setUpdateSuccess(true);

      // Güncellenmiş verileri al ve ana bileşene gönder
      const updatedDocSnap = await getDoc(userDocRef);
      const updatedUserData = updatedDocSnap.data();
      onUpdate(updatedUserData);

      setTimeout(() => {
        setUpdateSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Firma bilgileri güncellenirken hata oluştu:", error);
      setError("Firma bilgileri güncellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  };

  return (
    <div className="firma-bilgileri-modal">
      <div className="firma-bilgileri-content">
        <h2>Firma Bilgilerini Güncelle</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Firma Adı"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Adres"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <input
            type="text"
            placeholder="Telefon Numarası"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
          />
          {currentLogoUrl && (
            <img src={currentLogoUrl} alt="Current Logo" className="current-logo" />
          )}
          <button type="submit">Güncelle</button>
        </form>
        <button onClick={onClose}>Kapat</button>
        {updateSuccess && (
          <div className="update-success">
            <span className="checkmark">&#10004;</span> Başarıyla güncellendi
          </div>
        )}
      </div>
    </div>
  );
};

export default FirmaBilgileriGuncelle;