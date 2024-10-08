import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { database, storage } from './firebaseConfig';

import DatePicker, { registerLocale } from 'react-datepicker';
import tr from 'date-fns/locale/tr';
import 'react-datepicker/dist/react-datepicker.css';
import './Puantajlar.css';

import Select from 'react-select';
import { debounce } from 'lodash';

registerLocale('tr', tr);

const Puantajlar = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  const [machineOptions, setMachineOptions] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);

  const [operatorOptions, setOperatorOptions] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);

  const [isHakedisPopupOpen, setIsHakedisPopupOpen] = useState(false);
  const [unitRate, setUnitRate] = useState('');
  const [totalHakedis, setTotalHakedis] = useState('');

  const [calculatedTotalHours, setCalculatedTotalHours] = useState('');
  const [calculatedTotalMinutes, setCalculatedTotalMinutes] = useState(0);

  const [isCalculating, setIsCalculating] = useState(false);

  const [customerMap, setCustomerMap] = useState({});

  const debouncedSetStartDate = useCallback(
    debounce((date) => setStartDate(date), 300),
    []
  );

  const debouncedSetEndDate = useCallback(
    debounce((date) => setEndDate(date), 300),
    []
  );

  useEffect(() => {
    const db = database;

    const fetchCustomers = async () => {
      try {
        const customerSnapshot = await getDocs(collection(db, 'müşteri listesi'));
        const customerDataMap = {};
        const customerOptionsSet = new Set();
    
        customerSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const customerName = data['Müşteri Adı'] || '';
          const cariCode = data['cariCode'] || '';
    
          if (customerName) { // Ensure customerName is not empty
            customerDataMap[cariCode] = customerName;
            const displayText = `${customerName}/${cariCode}`;
            customerOptionsSet.add(displayText);
          }
        });
    
        setCustomerMap(customerDataMap);
    
        // **Updated:** Set `value` as `customerName`
        const customerOptionsArray = Array.from(customerOptionsSet).map((option) => {
          const [customerName, cariCode] = option.split('/');
          return {
            value: customerName, // Use customerName as the value
            label: option,       // Display text remains as "Müşteri Adı/cariCode"
          };
        });
    
        setCustomerOptions(
          customerOptionsArray.sort((a, b) => a.label.localeCompare(b.label))
        );
      } catch (error) {
        console.error('Müşteri verileri alınırken hata oluştu:', error);
        setError('Müşteri verileri alınırken bir hata oluştu.');
      }
    };

    const fetchMachineData = async () => {
      try {
        const machineSnapshot = await getDocs(collection(db, 'makineListesi'));
        const machineDataSet = new Set();

        machineSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const machineName = data['MakineAdı'] || '';
          if (machineName) {
            machineDataSet.add(machineName);
          }
        });

        const machineOptionsArray = Array.from(machineDataSet).map((machine) => ({
          value: machine,
          label: machine,
        }));

        setMachineOptions(machineOptionsArray.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (error) {
        console.error('Makine verileri alınırken hata oluştu:', error);
      }
    };

    const fetchOperatorData = async () => {
      try {
        const operatorSnapshot = await getDocs(collection(db, 'operatorListesi'));
        const operatorDataSet = new Set();

        operatorSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const operatorName = data['name'] || '';
          if (operatorName) {
            operatorDataSet.add(operatorName);
          }
        });

        const operatorOptionsArray = Array.from(operatorDataSet).map((operator) => ({
          value: operator,
          label: operator,
        }));

        setOperatorOptions(operatorOptionsArray.sort((a, b) => a.label.localeCompare(b.label)));
      } catch (error) {
        console.error('Operatör verileri alınırken hata oluştu:', error);
      }
    };

    fetchCustomers();
    fetchMachineData();
    fetchOperatorData();
  }, []);

  useEffect(() => {
    const db = database;
    const puantajlarRef = collection(db, 'puantajlar');

    const unsubscribe = onSnapshot(puantajlarRef, async (snapshot) => {
      try {
        const puantajlarData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Çekilen puantaj verileri:", puantajlarData);

        const pdfListRef = ref(storage, 'pdfs/');
        const pdfResult = await listAll(pdfListRef);

        const merged = await Promise.all(
          pdfResult.items.map(async (itemRef) => {
            const matchingPuantaj = puantajlarData.find(
              (puantaj) => puantaj['Sözleşme Numarası'] === itemRef.name
            );

            let customerName = '-';
            let cariCode = '-';

            if (matchingPuantaj) {
              const puantajCariCode = (matchingPuantaj['Cari Kodu'] || '').trim();
              if (puantajCariCode && customerMap[puantajCariCode]) {
                customerName = customerMap[puantajCariCode];
                cariCode = puantajCariCode;
              } else {
                customerName = matchingPuantaj['Müşteri Adı'] || '-';
                cariCode = matchingPuantaj['Cari Kodu'] || '-';
              }
            }

            return {
              pdfName: itemRef.name,
              pdfRef: itemRef,
              customerName: customerName,
              cariCode: cariCode,
              ...(matchingPuantaj || {}),
            };
          })
        );

        console.log("Birleştirilmiş veriler:", merged);

        setAllData(merged);
        setLoading(false);
      } catch (error) {
        console.error('Verileri yüklerken bir hata oluştu:', error);
        setError('Verileri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [customerMap]);

  const applyFilters = useCallback(() => {
    let filtered = allData;

    if (startDate && endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = parseDate(item['Tarih']);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    if (selectedCustomers.length > 0) {
      filtered = filtered.filter((item) => {
        const customerName = item.customerName;
        return selectedCustomers.some((selected) => selected.value === customerName);
      });
    }

    if (selectedMachines.length > 0) {
      filtered = filtered.filter((item) => {
        return selectedMachines.some((selected) => selected.value === item['Makine İsmi']);
      });
    }

    if (selectedOperators.length > 0) {
      filtered = filtered.filter((item) => {
        return selectedOperators.some((selected) => selected.value === item['Operatör Adı']);
      });
    }

    setFilteredData(filtered);
  }, [allData, startDate, endDate, selectedCustomers, selectedMachines, selectedOperators]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const parseDate = useCallback((dateString) => {
    if (!dateString) {
      return new Date();
    }

    const [day, month, year] = dateString.split('.');

    if (!day || !month || !year) {
      return new Date();
    }

    return new Date(`${year}-${month}-${day}T00:00:00`);
  }, []);

  const handlePdfClick = useCallback(async (pdfRef, pdfName) => {
    try {
      const url = await getDownloadURL(pdfRef);
      setSelectedPdf({ url, name: pdfName });
    } catch (error) {
      console.error('PDF URL alınırken hata oluştu:', error);
    }
  }, []);

  const closePopup = useCallback(() => {
    setSelectedPdf(null);
  }, []);

  const handleCheckboxChange = useCallback((pdfName) => {
    setSelectedPdfs((prevSelected) =>
      prevSelected.includes(pdfName)
        ? prevSelected.filter((name) => name !== pdfName)
        : [...prevSelected, pdfName]
    );
  }, []);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedPdfs.length === 0) return;

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
  }, [selectedPdfs]);

  const handleSelectAll = useCallback(() => {
    const allPdfNames = filteredData.map((item) => item.pdfName);
    setSelectedPdfs(allPdfNames);
  }, [filteredData]);

  const handleDeselectAll = useCallback(() => {
    setSelectedPdfs([]);
  }, []);

  const formatTime = useCallback((timeString) => {
    if (!timeString || timeString === '""') return null;
    const [hours, minutes] = timeString.replace(/"/g, '').split(':');
    if (!hours || !minutes) return null;
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }, []);

  const calculateDuration = useCallback((start, end) => {
    if (!start || !end) return 0;
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    let duration = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
    if (duration < 0) {
      duration += 24 * 60;
    }
    return duration;
  }, []);

  const formatDuration = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} saat ${remainingMinutes} dakika`;
  }, []);

  const calculateTotalWorkDuration = useCallback((item) => {
    const start1 = formatTime(item['1. Başlangıç Saati']);
    const end1 = formatTime(item['1. Bitiş Saati']);
    const start2 = formatTime(item['2. Başlangıç Saati']);
    const end2 = formatTime(item['2. Bitiş Saati']);

    const duration1 = calculateDuration(start1, end1);
    const duration2 = calculateDuration(start2, end2);

    const totalDuration = duration1 + duration2;

    if (totalDuration === 0) {
      return '-';
    }

    return formatDuration(totalDuration);
  }, [formatTime, calculateDuration, formatDuration]);

  const renderWorkHours = useCallback((item) => {
    const start1 = formatTime(item['1. Başlangıç Saati']);
    const end1 = formatTime(item['1. Bitiş Saati']);
    const start2 = formatTime(item['2. Başlangıç Saati']);
    const end2 = formatTime(item['2. Bitiş Saati']);

    if (start1 && end1) {
      if (start2 && end2) {
        return (
          <>
            {start1} || {end1}
            <br />
            {start2} || {end2}
          </>
        );
      } else {
        return (
          <>
            {start1} || {end1}
          </>
        );
      }
    } else {
      return '-';
    }
  }, [formatTime]);

  const calculateTotalHours = useCallback(() => {
    let totalMinutes = 0;

    filteredData.forEach((item) => {
      const start1 = formatTime(item['1. Başlangıç Saati']);
      const end1 = formatTime(item['1. Bitiş Saati']);
      const start2 = formatTime(item['2. Başlangıç Saati']);
      const end2 = formatTime(item['2. Bitiş Saati']);

      totalMinutes += calculateDuration(start1, end1);
      totalMinutes += calculateDuration(start2, end2);
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setCalculatedTotalHours(`${hours} saat ${minutes} dakika`);
    setCalculatedTotalMinutes(totalMinutes);

    return totalMinutes;
  }, [filteredData, formatTime, calculateDuration]);

  const handleHakedisHesapla = useCallback(() => {
    let minutes = calculatedTotalMinutes;

    if (minutes === 0) {
      minutes = calculateTotalHours();
    }

    if (unitRate) {
      setIsCalculating(true);
      const totalHours = minutes / 60;
      const totalAmount = totalHours * parseFloat(unitRate);

      const formattedAmount = new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalAmount);

      setTotalHakedis(formattedAmount);

      setTimeout(() => {
        setIsHakedisPopupOpen(false);
        setIsCalculating(false);
      }, 1000);
    } else {
      alert('Lütfen birim saat ücretini giriniz.');
    }
  }, [calculatedTotalMinutes, calculateTotalHours, unitRate]);

  const openHakedisPopup = useCallback(() => {
    if (calculatedTotalMinutes === 0) {
      calculateTotalHours();
    }
    setIsHakedisPopupOpen(true);
  }, [calculatedTotalMinutes, calculateTotalHours]);

  const closeHakedisPopup = useCallback(() => {
    setIsHakedisPopupOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeHakedisPopup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeHakedisPopup]);

  const handleCustomerChange = useCallback((selectedOptions) => {
    setSelectedCustomers(selectedOptions || []);
  }, []);

  const handleMachineChange = useCallback((selectedOptions) => {
    setSelectedMachines(selectedOptions || []);
  }, []);

  const handleOperatorChange = useCallback((selectedOptions) => {
    setSelectedOperators(selectedOptions || []);
  }, []);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="puantajlar-container">
      <h2>Puantajlar</h2>

      <div className="filter-container">
        <div className="filters-row">
          <div className="date-filter">
            <label>Tarih Aralığı Seçin: </label>
            <div className="date-pickers">
              <DatePicker
                selected={startDate}
                onChange={debouncedSetStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd.MM.yyyy"
                placeholderText="Başlangıç Tarihi"
                locale="tr"
              />
              <DatePicker
                selected={endDate}
                onChange={debouncedSetEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="dd.MM.yyyy"
                placeholderText="Bitiş Tarihi"
                locale="tr"
              />
            </div>
          </div>

          <div className="customer-filter">
            <label>Müşteri Seçin: </label>
            <Select
              isMulti
              options={customerOptions}
              value={selectedCustomers}
              onChange={handleCustomerChange}
              placeholder="Müşteri Seçin"
              className="customer-select"
              classNamePrefix="react-select"
            />
          </div>

          <div className="machine-filter">
            <label>Makine Adı Seçin: </label>
            <Select
              isMulti
              options={machineOptions}
              value={selectedMachines}
              onChange={handleMachineChange}
              placeholder="Makine Adı Seçin"
              className="machine-select"
              classNamePrefix="react-select"
            />
          </div>

          <div className="operator-filter">
            <label>Operatör Adı Seçin: </label>
            <Select
              isMulti
              options={operatorOptions}
              value={selectedOperators}
              onChange={handleOperatorChange}
              placeholder="Operatör Adı Seçin"
              className="operator-select"
              classNamePrefix="react-select"
            />
          </div>

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

        <div className="right-buttons">
          <div className="calculation-row">
            <p className="result">{calculatedTotalHours}</p>
            <button onClick={calculateTotalHours}>Toplam Saat Hesapla</button>
          </div>
          <div className="calculation-row">
            <p className="result">{totalHakedis}</p>
            <button onClick={openHakedisPopup}>Hakediş Hesapla</button>
          </div>
        </div>
      </div>

      {filteredData.length > 0 && (
        <table className="puantajlar-table">
          <thead>
            <tr>
              <th>Seç</th>
              <th>PDF / Sözleşme Numarası</th>
              <th>Müşteri Adı</th>
              <th>Cari Kodu</th>
              <th>Makine İsmi</th>
              <th>Operatör Adı</th>
              <th>Çalışma Saatleri</th>
              <th>Toplam Çalışma Süresi</th>
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
                <td>{item.customerName || '-'}</td>
                <td>{item.cariCode || '-'}</td>
                <td>{item['Makine İsmi'] || '-'}</td>
                <td>{item['Operatör Adı'] || '-'}</td>
                <td>{renderWorkHours(item)}</td>
                <td>{calculateTotalWorkDuration(item)}</td>
                <td>{item['Tarih'] || '-'}</td>
                <td>{item['Yetkili Adı'] || '-'}</td>                <td>{item['Çalışma Detayı'] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="modal" onClick={closeHakedisPopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Birim Saat Giriniz</h3>
            <input
              type="number"
              value={unitRate}
              onChange={(e) => setUnitRate(e.target.value)}
              placeholder="Birim Saat"
            />
            <div className="popup-total-hours">
              <p>Toplam Saat: {calculatedTotalHours}</p>
            </div>
            <button onClick={handleHakedisHesapla} disabled={isCalculating}>
              {isCalculating ? 'Hesaplanıyor...' : 'Hesapla'}
            </button>
            <button
              onClick={closeHakedisPopup}
              className="close-button"
              disabled={isCalculating}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Puantajlar);