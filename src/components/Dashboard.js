import './Dashboard.css'; 
import React, { useState, useEffect } from 'react';
import { User, Moon, Sun } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore'; 
import { database } from './firebaseConfig'; 
import OperatorEkle from './OperatorEkle';
import Puantajlar from './Puantajlar';
import MusteriListesi from './MusteriListesi'; 
import MakineTanımlama from './MakineTanımlama'; // Makine Tanımlama komponentini import edin
import { useNavigate } from 'react-router-dom';

const Dashboard = ({ userEmail, onSignOut }) => {
  const [theme, setTheme] = useState('light');
  const [activeSection, setActiveSection] = useState('home');
  const [operators, setOperators] = useState([]);

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
    const fetchOperators = async () => {
      const operatorsSnapshot = await getDocs(collection(database, 'operatorListesi'));
      const operatorList = operatorsSnapshot.docs.map((doc) => doc.data());
      setOperators(operatorList);
    };
    fetchOperators();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'operatorEkle':
        return <OperatorEkle />;
      case 'puantajlar':
        return <Puantajlar />;
      case 'raporlama':
        return <div>Raporlama sayfası burada olacak.</div>;
      case 'makineTanitma':
        return <MakineTanımlama />; // Makine Tanımlama sayfası burada açılacak
      case 'musteriListesi':
        return <MusteriListesi theme={theme} />;
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
          <User size={24} />
          <span>{userEmail}</span>
        </div>
        <div className="topbar-actions">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          <button onClick={onSignOut} className="sign-out">
            Sign Out
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
              <button onClick={() => setActiveSection('operatorEkle')}>
                Operatör Ekle
              </button>
            </li>
            <li>
              <button onClick={() => setActiveSection('raporlama')}>
                Raporlama
              </button>
            </li>
            <li>
              <button onClick={() => setActiveSection('makineTanitma')}>
                Makine Tanımlama
              </button> {/* Makine Tanımlama butonu */}
            </li>
            <li>
              <button onClick={() => setActiveSection('musteriListesi')}>
                Müşteri Listesi
              </button>
            </li>
          </ul>
        </div>

        <div className="content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
