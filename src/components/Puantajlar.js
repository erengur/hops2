import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, listAll } from 'firebase/storage';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Puantajlar.css';

const Puantajlar = () => {
  const [mergedData, setMergedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [totalHours, setTotalHours] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [customerNames, setCustomerNames] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const [machineNames, setMachineNames] = useState([]); 
  const [selectedMachine, setSelectedMachine] = useState('');

  const [operatorNames, setOperatorNames] = useState([]); // Operatör isimleri için yeni state
  const [selectedOperator, setSelectedOperator] = useState(''); // Seçilen operatör ismi

  const [isHakedisPopupOpen, setIsHakedisPopupOpen] = useState(false); 
  const [unitRate, setUnitRate] = useState('');
  const [totalHakedis, setTotalHakedis] = useState('');
  const [popupTotalHours, setPopupTotalHours] = useState('');

  useEffect(() => {
    fetchCustomerNames();
    fetchMachineNames(); 
    fetchOperatorNames(); // Operatör isimlerini al
    fetchPuantajlarAndPdfs();
  }, []);

  const parseDate = (dateString) => {
    if (!dateString) {
      return new Date();
    }
    
    const [day, month, year] = dateString.split('.');
    
    if (!day || !month || !year) {
      return new Date();
    }
    
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  useEffect(() => {
    setTotalHakedis('');
    setPopupTotalHours('');

    let filtered = mergedData;

    if (startDate && endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = parseDate(item['Tarih']);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    if (selectedCustomer) {
      filtered = filtered.filter((item) => item['Müşteri Adı'] === selectedCustomer);
    }

    if (selectedMachine) {
      filtered = filtered.filter((item) => item['Makine İsmi'] === selectedMachine);
    }

    if (selectedOperator) {
      filtered = filtered.filter((item) => item['Operatör Adı'] === selectedOperator); // "Operatör Adı" ile filtrele
    }

    setFilteredData(filtered);
  }, [startDate, endDate, selectedCustomer, selectedMachine, selectedOperator, mergedData]);

  const fetchCustomerNames = async () => {
    const db = getFirestore();
    try {
      const customerSnapshot = await getDocs(collection(db, 'müşteri listesi'));
      const customerData = customerSnapshot.docs.map(doc => doc.data()['Müşteri Adı']);
      const sortedCustomerNames = customerData.sort((a, b) => a.localeCompare(b));
      setCustomerNames(sortedCustomerNames);
    } catch (error) {
      console.error('Müşteri listesi alınırken hata oluştu:', error);
    }
  };

  const fetchMachineNames = async () => {
    const db = getFirestore();
    try {
      const machineSnapshot = await getDocs(collection(db, 'makineListesi'));
      const machineData = machineSnapshot.docs.map(doc => doc.data()['MakineAdı']);
      const sortedMachineNames = machineData.sort((a, b) => a.localeCompare(b));
      setMachineNames(sortedMachineNames);
    } catch (error) {
      console.error('Makine listesi alınırken hata oluştu:', error);
    }
  };

  const fetchOperatorNames = async () => {
    const db = getFirestore();
    try {
      const operatorSnapshot = await getDocs(collection(db, 'operatorListesi'));
      const operatorData = operatorSnapshot.docs.map(doc => doc.data()['name']);
      const sortedOperatorNames = operatorData.sort((a, b) => a.localeCompare(b));
      setOperatorNames(sortedOperatorNames);
    } catch (error) {
      console.error('Operatör listesi alınırken hata oluştu:', error);
    }
  };

  const fetchPuantajlarAndPdfs = async () => {
    setLoading(true);
    setError(null);
    const db = getFirestore();
    const storage = getStorage();
    const pdfListRef = ref(storage, 'pdfs/');

    try {
      const puantajlarSnapshot = await getDocs(collection(db, 'puantajlar'));
      const puantajlarData = puantajlarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const pdfResult = await listAll(pdfListRef);

      const merged = pdfResult.items.map(itemRef => {
        const matchingPuantaj = puantajlarData.find(puantaj => puantaj['Sözleşme Numarası'] === itemRef.name);
        return {
          pdfName: itemRef.name,
          pdfRef: itemRef,
          ...matchingPuantaj
        };
      });

      setMergedData(merged);
      setFilteredData(merged);
    } catch (error) {
      setError('Verileri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfClick = async (pdfRef, pdfName) => {
    try {
      const url = await getDownloadURL(pdfRef);
      setSelectedPdf({ url, name: pdfName });
    } catch (error) {
      console.error('PDF URL alınırken hata oluştu:', error);
    }
  };

  const handleCheckboxChange = (pdfName) => {
    setSelectedPdfs((prevSelected) =>
      prevSelected.includes(pdfName)
        ? prevSelected.filter((name) => name !== pdfName)
        : [...prevSelected, pdfName]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedPdfs.length === 0) return;

    const storage = getStorage();
  
    for (const pdfName of selectedPdfs) {
      try {
        const pdfRef = ref(storage, `pdfs/${pdfName}`);
        const url = await getDownloadURL(pdfRef);

        const response = await fetch(url);
        const blob = await response.blob();

        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = pdfName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error(`${pdfName} indirilirken hata oluştu:`, error);
      }
    }
  };

  const handleSelectAll = () => {
    const allPdfNames = filteredData.map(item => item.pdfName);
    setSelectedPdfs(allPdfNames);
  };

  const handleDeselectAll = () => {
    setSelectedPdfs([]);
  };

  const closePopup = () => {
    setSelectedPdf(null);
  };

  const calculateTotalHours = () => {
    let totalMinutes = 0;

    filteredData.forEach(item => {
      const çalışmaSüresi = item['Çalışma Süresi'];
      
      if (çalışmaSüresi) {
        const { hours, minutes } = parseTime(çalışmaSüresi); 
        totalMinutes += hours * 60 + minutes;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    setTotalHours(`${totalHours} saat ${remainingMinutes} dakika`);
  };

  const calculatePopupTotalHours = () => {
    let totalMinutes = 0;

    filteredData.forEach(item => {
      const çalışmaSüresi = item['Çalışma Süresi'];
      
      if (çalışmaSüresi) {
        const { hours, minutes } = parseTime(çalışmaSüresi); 
        totalMinutes += hours * 60 + minutes;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    setPopupTotalHours(`${totalHours} saat ${remainingMinutes} dakika`);
  };

  const parseTime = (timeString) => {
    const hourMatch = timeString.match(/(\d+)\s*saat/);
    const minuteMatch = timeString.match(/(\d+)\s*dakika/);

    const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

    return { hours, minutes };
  };

  const handleHakedisHesapla = () => {
    if (popupTotalHours && unitRate) {
      const [hours] = popupTotalHours.split(' ');
      const totalAmount = parseFloat(hours) * parseFloat(unitRate);
      setTotalHakedis(`${totalAmount.toFixed(2)} TL`);

      setTimeout(() => {
        setIsHakedisPopupOpen(false);
      }, 1000);
    }
  };

  const openHakedisPopup = () => {
    setIsHakedisPopupOpen(true);
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="puantajlar-container">
      <h2>Puantajlar ------- Mücahit abi selamun aleyküm</h2>

      <div className="filter-container">
        {/* Tarih Filtresi */}
        <div className="date-filter">
          <label>Tarih Aralığı Seçin: </label>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd.MM.yyyy"
            placeholderText="Başlangıç Tarihi"
          />
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            dateFormat="dd.MM.yyyy"
            placeholderText="Bitiş Tarihi"
          />
        </div>

        {/* Müşteri Adı Filtresi */}
        <div className="customer-filter">
          <label>Müşteri Adı Seçin: </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Hepsi</option>
            {customerNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Makine Adı Filtresi */}
        <div className="machine-filter">
          <label>Makine Adı Seçin: </label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
          >
            <option value="">Hepsi</option>
            {machineNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Operatör Adı Filtresi */}
        <div className="operator-filter">
          <label>Operatör Adı Seçin: </label>
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
          >
            <option value="">Hepsi</option>
            {operatorNames.map((name, index) => (
              <option key={index} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Toplam Saat Hesapla Butonu */}
        <div className="total-hours">
          <button onClick={calculateTotalHours}>Toplam Saat Hesapla</button>
          <p>: {totalHours}</p>
        </div>

        {/* Hakediş Hesapla Butonu */}
        <div className="hakedis-calculate">
          <button onClick={openHakedisPopup}>Hakediş Hesapla</button>
          <p>: {totalHakedis}</p>
        </div>

        {/* Seçme Butonları */}
        <div className="button-group">
          <button onClick={handleSelectAll}>Hepsini Seç</button>
          <button onClick={handleDeselectAll}>Seçimleri Kaldır</button>
          <button
            onClick={handleDownloadSelected}
            disabled={selectedPdfs.length === 0}
            className="download-button-inline"
          >
            Seçili PDF'leri İndir
          </button>
        </div>
      </div>

      {filteredData.length > 0 && (
        <>
          <table className="puantajlar-table">
            <thead>
              <tr>
                <th>Seç</th>
                <th>PDF / Sözleşme Numarası</th>
                <th>Müşteri Adı</th>
                <th>Makine İsmi</th> 
                <th>Operatör Adı</th> {/* Yeni "Operatör Adı" alanı */}
                <th>Çalışma Süresi</th>
                <th>Başlangıç Saati</th>
                <th>Bitiş Saati</th>
                <th>Tarih</th>
                <th>Yetkili Adı</th>
                <th>Çalışma Detayı</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      onChange={() => handleCheckboxChange(item.pdfName)}
                      checked={selectedPdfs.includes(item.pdfName)}
                    />
                  </td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => handlePdfClick(item.pdfRef, item.pdfName)}
                    >
                      {item.pdfName}
                    </button>
                  </td>
                  <td>{item['Müşteri Adı'] || '-'}</td>
                  <td>{item['Makine İsmi'] || '-'}</td> 
                  <td>{item['Operatör Adı'] || '-'}</td> {/* "Operatör Adı" burada gösteriliyor */}
                  <td>{item['Çalışma Süresi'] || '-'}</td>
                  <td>{item['Başlangıç Saati'] || '-'}</td>
                  <td>{item['Bitiş Saati'] || '-'}</td>
                  <td>{item['Tarih'] || '-'}</td>
                  <td>{item['Yetkili Adı'] || '-'}</td>
                  <td>{item['Çalışma Detayı'] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {selectedPdf && (
        <div className="pdf-popup">
          <iframe
            src={`${selectedPdf.url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={selectedPdf.name}
            width="100%"
            height="600px"
          />
          <button onClick={closePopup}>Kapat</button>
        </div>
      )}

      {isHakedisPopupOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Birim Saat Giriniz</h3>
            <input
              type="number"
              value={unitRate}
              onChange={(e) => setUnitRate(e.target.value)}
              placeholder="Birim Saat"
            />
            <div className="popup-total-hours">
              <button onClick={calculatePopupTotalHours}>Toplam Saat Hesapla</button>
              <p>: {popupTotalHours}</p>
            </div>
            <button onClick={handleHakedisHesapla}>Hesapla</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Puantajlar;
