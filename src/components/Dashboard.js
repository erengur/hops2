import './Dashboard.css';
import React, { useState, useEffect, useCallback } from 'react';
import { User, Moon, Sun, ChevronDown, ChevronUp, Building2, LogOut } from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { database } from './firebaseConfig';
import { useNavigate } from 'react-router-dom';
import OperatorEkle from './OperatorEkle';
import Puantajlar from './Puantajlar';
import MusteriListesi from './MusteriListesi';
import MakineTanımlama from './MakineTanımlama';
import OnayBekleyenCari from './OnayBekleyenCari';
import FirmaBilgileriGuncelle from './FirmaBilgileriGuncelle';
import Raporlama from './Raporlama'; // Yeni eklenen import

const Dashboard = ({ userEmail, onSignOut }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('home');
  const [pendingCustomerCount, setPendingCustomerCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showFirmaBilgileri, setShowFirmaBilgileri] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  useEffect(() => {
    const db = database;
    const q = query(collection(db, 'müşteri listesi'), where('Onay', '==', 'Onay Bekliyor'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setPendingCustomerCount(querySnapshot.size);
    }, (error) => {
      console.error("Firestore dinleme hatası:", error);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = useCallback(async () => {
    const db = database;
    const userQuery = query(collection(db, 'users'), where('email', '==', userEmail));
    const querySnapshot = await getDocs(userQuery);
    if (!querySnapshot.empty) {
      setUserData(querySnapshot.docs[0].data());
    }
  }, [userEmail]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleFirmaBilgileriClick = () => {
    setShowFirmaBilgileri(true);
  };

  const handleFirmaBilgileriClose = () => {
    setShowFirmaBilgileri(false);
    fetchUserData();
  };

  const handleUserDataUpdate = (updatedData) => {
    setUserData(updatedData);
  };

  const handleSignOutClick = () => {
    const isConfirmed = window.confirm('Çıkış yapmak istediğinize emin misiniz?');
    if (isConfirmed) {
      onSignOut();
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'operatorEkle':
        return <OperatorEkle />;
      case 'puantajlar':
        return <Puantajlar />;
      case 'raporlama':
        return <Raporlama theme={theme} />; // Theme prop'unu ekledik
      case 'makineTanitma':
        return <MakineTanımlama />;
      case 'musteriListesi':
        return <MusteriListesi theme={theme} />;
      case 'bankaTanitma':
        return <div>Banka Tanıtım sayfası burada olacak.</div>;
      case 'onayBekleyenCari':
        return <OnayBekleyenCari theme={theme} />;
      default:
        return (
          <div className="welcome-message">
            <h1>Dashboard'a Hoşgeldiniz</h1>
            <p>Lütfen menüden bir seçenek seçin.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="topbar">
        <div className="user-info">
          {userData && userData.logoUrl ? (
            <img src={userData.logoUrl} alt="Company Logo" className="company-logo" />
          ) : (
            <User size={24} />
          )}
          <span>{userData ? userData.companyName : userEmail}</span>
        </div>
        <div className="topbar-actions">
          <button 
            onClick={handleFirmaBilgileriClick} 
            className="action-button firma-bilgileri-button"
            title="Firma Bilgileri"
          >
            <Building2 size={18} />
            <span>Firma Bilgileri</span>
          </button>
          <button 
            onClick={toggleTheme} 
            className="action-button theme-toggle"
            title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={handleSignOutClick} 
            className="action-button sign-out"
            title="Çıkış Yap"
          >
            <LogOut size={18} />
            <span>Çıkış</span>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="leftbar">
          <h2>Menu</h2>
          <ul>
            <li>
              <button onClick={() => setActiveSection('puantajlar')}>
                Puantajlar
              </button>
            </li>
            <li>
              <button onClick={() => setActiveSection('raporlama')}>
                Raporlama
              </button>
            </li>
            <li className="dropdown">
              <button onClick={toggleDropdown}>
                Tanıtım Kartları {isDropdownOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {isDropdownOpen && (
                <ul className="dropdown-menu">
                  <li>
                    <button onClick={() => setActiveSection('makineTanitma')}>
                      Makine Tanıtım
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveSection('operatorEkle')}>
                      Operatör Tanıtım
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveSection('bankaTanitma')}>
                      Banka Tanıtım
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveSection('musteriListesi')}>
                      Cari Tanıtım
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setActiveSection('onayBekleyenCari')}>
                      Onay Bekleyen Cari Tanıtım
                      {pendingCustomerCount > 0 && (
                        <span className="notification-badge">{pendingCustomerCount}</span>
                      )}
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>
          <div className="hops-text">HOPS</div>
        </div>

        <div className="content">{renderContent()}</div>
      </div>

      {showFirmaBilgileri && (
        <FirmaBilgileriGuncelle
          userData={userData}
          onClose={handleFirmaBilgileriClose}
          userEmail={userEmail}
          onUpdate={handleUserDataUpdate}
        />
      )}
    </div>
  );
};

export default Dashboard;