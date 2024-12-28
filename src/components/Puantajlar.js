import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { database, storage } from './firebaseConfig';
import { getFirestore } from 'firebase/firestore';
import { auth } from './firebaseConfig';
import { getCustomerListRef, getMachinesRef, getOperatorsRef, getPuantajlarRef } from '../utils/databaseOperations';

import DatePicker, { registerLocale } from 'react-datepicker';
import tr from 'date-fns/locale/tr';
import 'react-datepicker/dist/react-datepicker.css';
import './Puantajlar.css';

import Select from 'react-select';
import { debounce } from 'lodash';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

registerLocale('tr', tr);

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

const Puantajlar = () => {
  // Mevcut durumlar...
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // eslint-disable-next-line no-unused-vars
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const [machineOptions, setMachineOptions] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const [operatorOptions, setOperatorOptions] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);

  const [isHakedisPopupOpen, setIsHakedisPopupOpen] = useState(false);
  const [unitRate, setUnitRate] = useState('');
  const [totalHakedis, /*setTotalHakedis*/] = useState(''); // Commented out

  const [calculatedTotalHours, /*setCalculatedTotalHours*/] = useState('');
  // const [calculatedTotalMinutes, setCalculatedTotalMinutes] = useState(0); // Comment this out

  // const [isCalculating, setIsCalculating] = useState(false); // Commented out

  // eslint-disable-next-line no-unused-vars
  const [shantiyeler, setShantiyeler] = useState([]);

  const [shantiyeChanges, setShantiyeChanges] = useState({});

  const [successMessage, setSuccessMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const [customerMap, setCustomerMap] = useState({});

  const debouncedSetStartDate = useMemo(
    () => debounce((date) => setStartDate(date), 300),
    [setStartDate]
  );

  const debouncedSetEndDate = useMemo(
    () => debounce((date) => setEndDate(date), 300),
    [setEndDate]
  );

  const getSantiyeNameByCariCode = useCallback((cariCode) => {
    const santiye = shantiyeler.find((s) => s['cariCode'] === cariCode);
    return santiye ? santiye['Müşteri Adı'] : 'Silinmiş Müşteri';
  }, [shantiyeler]);

  useEffect(() => {
    const fetchData = async () => {
      const userEmail = auth.currentUser?.email;
      
      if (!userEmail) {
        setError('Kullanıcı oturumu bulunamadı');
        return;
      }

      try {
        // Referansları al
        const customerListRef = getCustomerListRef(userEmail);
        const machinesRef = getMachinesRef(userEmail);
        const operatorsRef = getOperatorsRef(userEmail);

        // Verileri çek
        const [customerSnapshot, machineSnapshot, operatorSnapshot] = await Promise.all([
          getDocs(customerListRef),
          getDocs(machinesRef),
          getDocs(operatorsRef)
        ]);

        // Seçenekleri ayarla
        const customerOptionsArray = customerSnapshot.docs
          .map(doc => ({
            value: doc.data()['Müşteri Adı']?.trim() || '',
            label: `${doc.data()['Müşteri Adı']?.trim()} / ${doc.data()['cariCode']?.trim() || ''}`,
            searchValue: doc.data()['Müşteri Adı']?.toLowerCase()
          }))
          .filter(option => option.value);
        setCustomerOptions(customerOptionsArray);

        const machineOptionsArray = machineSnapshot.docs
          .map(doc => ({
            value: doc.data()['MakineAdı']?.trim() || '',
            label: doc.data()['MakineAdı']?.trim(),
            searchValue: doc.data()['MakineAdı']?.toLowerCase()
          }))
          .filter(option => option.value);
        setMachineOptions(machineOptionsArray);

        const operatorOptionsArray = operatorSnapshot.docs
          .map(doc => ({
            value: doc.data()['name']?.trim() || '',
            label: doc.data()['name']?.trim(),
            searchValue: doc.data()['name']?.toLowerCase()
          }))
          .filter(option => option.value);
        setOperatorOptions(operatorOptionsArray);

      } catch (error) {
        console.error('Veriler yüklenirken hata:', error);
        setError('Veriler yüklenirken bir hata oluştu');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const db = database;
    const puantajlarRef = collection(db, `users/${auth.currentUser?.email}/timeSheets`);

    const unsubscribe = onSnapshot(puantajlarRef, async (snapshot) => {
      try {
        const puantajlarData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Müşteri verilerini al
        const customerListRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
        const customerSnapshot = await getDocs(customerListRef);
        const customerData = customerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log("Çekilen puantaj verileri:", puantajlarData);

        const pdfListRef = ref(storage, 'pdfs/');
        const pdfResult = await listAll(pdfListRef);

        const merged = await Promise.all(
          pdfResult.items.map(async (itemRef) => {
            // Puantaj eşleştirmesini geliştir
            const matchingPuantaj = puantajlarData.find(
              (puantaj) => puantaj['Sözleşme Numarası'] === itemRef.name ||
                          puantaj['SozlesmeNumarasi'] === itemRef.name ||
                          puantaj['sozlesmeNumarasi'] === itemRef.name
            );

            let customerName = '-';
            let cariCode = '-';
            let workDetail = '-';
            let authorizedPerson = '-';

            if (matchingPuantaj) {
              // Müşteri adı kontrolü
              customerName = matchingPuantaj['Müşteri Adı']?.trim() || 
                           matchingPuantaj['MusteriAdi']?.trim() || 
                           matchingPuantaj['musteriAdi']?.trim() || '-';

              // Cari kod kontrolü
              cariCode = matchingPuantaj['Cari Kodu']?.trim() || 
                        matchingPuantaj['CariKodu']?.trim() || 
                        matchingPuantaj['cariKodu']?.trim() || 
                        matchingPuantaj['cariCode']?.trim() || '-';

              // Çalışma detayı kontrolü
              workDetail = matchingPuantaj['Çalışma Detayı']?.trim() || 
                          matchingPuantaj['CalismaDetayi']?.trim() || 
                          matchingPuantaj['calismaDetayi']?.trim() || '-';

              // Yetkili kişi kontrolü
              authorizedPerson = matchingPuantaj['Yetkili Adı']?.trim() || 
                               matchingPuantaj['YetkiliAdi']?.trim() || 
                               matchingPuantaj['yetkiliAdi']?.trim() || '-';

              // Cari kod bulunamadıysa müşteri listesinden bul
              if (!cariCode || cariCode === '-') {
                  const matchingCustomer = customerData.find(
                  customer => customer['Müşteri Adı']?.trim().toLowerCase() === customerName.toLowerCase()
                  );
                  if (matchingCustomer) {
                    cariCode = matchingCustomer.cariCode || matchingCustomer['Cari Kodu'] || '-';
                }
              }

              console.log('Puantaj eşleştirme detayları:', {
                customerName,
                cariCode,
                workDetail,
                authorizedPerson,
                originalData: matchingPuantaj
              });
            }

            return {
              pdfName: itemRef.name,
              pdfRef: itemRef,
              customerName,
              cariCode,
              'Çalışma Detayı': workDetail,
              'Yetkili Adı': authorizedPerson,
              ...(matchingPuantaj || {}),
            };
          })
        );

        console.log("Birleştirilmiş veriler:", merged);
        setAllData(merged);
        setLoading(false);
      } catch (error) {
        console.error('Verileri yüklerken hata:', error);
        setError('Verileri yüklerken bir hata oluştu.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [customerMap]);

  // Şantiye değişikliklerini izleyen yeni useEffect
  useEffect(() => {
    const db = database;
    const shantiyeRef = collection(db, `users/${auth.currentUser?.email}/customerList`);
    const shantiyeQuery = query(shantiyeRef, where('Şantiye', '==', true));

    const unsubscribe = onSnapshot(shantiyeQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const newData = change.doc.data();
          setShantiyeChanges(prev => ({
            ...prev,
            [change.doc.id]: {
              oldName: change.doc.data().OldName || newData['Şantiye Adı'],
              newName: newData['Şantiye Adı'],
              newCariCode: newData['Şantiye Cari Kodu'],
            }
          }));
        }
      });
    });

    return () => unsubscribe();
  }, []);

  // Sıralama Durumları
  const [order, setOrder] = useState('asc'); // 'asc' veya 'desc'
  const [orderBy, setOrderBy] = useState('Müşteri Adı'); // Varsayılan sıralama sütunu

  // Sıralama Fonksiyonu
  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  // Veriyi Sıralama
  const sortedData = useMemo(() => {
    const comparator = (a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Tarih sütunu özel işleniyor
      if (orderBy === 'Tarih') {
        aValue = parseDate(aValue);
        bValue = parseDate(bValue);
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      }

      // Diğer sütunlar string karşılaştırması
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    };

    return [...filteredData].sort(comparator);
  }, [filteredData, order, orderBy]);

  // Filtreleme Fonksiyonu
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

  // PDF'leri birleştirme fonksiyonu
  const mergePDFs = async (pdfBlobs) => {
    const mergedPdf = await PDFDocument.create();
    
    for (const blob of pdfBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const mergedPdfFile = await mergedPdf.save();
    return new Blob([mergedPdfFile], { type: 'application/pdf' });
  };

  // İndirme seçenekleri modalı
  const DownloadOptionsModal = () => (
    <div className="modal download-options-modal" onClick={() => setIsDownloadModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>PDF İndirme Seçenekleri</h3>
        <div className="download-options">
          <button onClick={handleDownloadAsZip} disabled={loading}>
            <span>ZIP olarak indir</span>
            {loading && <span className="loading-spinner"></span>}
          </button>
          <button onClick={handleDownloadAsMergedPDF} disabled={loading}>
            <span>Tek PDF olarak indir</span>
            {loading && <span className="loading-spinner"></span>}
          </button>
        </div>
        <button onClick={() => setIsDownloadModalOpen(false)} className="close-button">
          Kapat
        </button>
      </div>
    </div>
  );

  const handleDownloadAsZip = async () => {
    if (selectedPdfs.length === 0) return;

    try {
      setLoading(true);
      const zip = new JSZip();
      
      const downloadPromises = selectedPdfs.map(async (pdfName) => {
        const pdfRef = ref(storage, `pdfs/${pdfName}`);
        const url = await getDownloadURL(pdfRef);
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(pdfName, blob);
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: "blob" });
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(content, `puantajlar_${timestamp}.zip`);

      setSuccessMessage('PDF\'ler başarıyla indirildi.');
      setAlertOpen(true);
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      setError('PDF\'ler indirilirken bir hata oluştu');
      setAlertOpen(true);
    } finally {
      setLoading(false);
      setIsDownloadModalOpen(false);
    }
  };

  const handleDownloadAsMergedPDF = async () => {
    if (selectedPdfs.length === 0) return;

    try {
      setLoading(true);
      const pdfBlobs = await Promise.all(
        selectedPdfs.map(async (pdfName) => {
          const pdfRef = ref(storage, `pdfs/${pdfName}`);
          const url = await getDownloadURL(pdfRef);
          const response = await fetch(url);
          return response.blob();
        })
      );

      const mergedPdfBlob = await mergePDFs(pdfBlobs);
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(mergedPdfBlob, `birlesik_puantajlar_${timestamp}.pdf`);

      setSuccessMessage('PDF\'ler başarıyla birleştirildi ve indirildi.');
      setAlertOpen(true);
    } catch (error) {
      console.error('PDF birleştirme hatası:', error);
      setError('PDF\'ler birleştirilirken bir hata oluştu');
      setAlertOpen(true);
    } finally {
      setLoading(false);
      setIsDownloadModalOpen(false);
    }
  };

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

  /*
  // Diğer yorumlanmış kodlar...
  */

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

  // Sıralama İkonları için Yardımcı Fonksiyon
  const renderSortIcon = (column) => {
    if (orderBy !== column) return null;
    return order === 'asc' ? ' 🔼' : ' 🔽';
  };

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
        </div>

        <div className="button-group">
          <button onClick={handleSelectAll}>Hepsini Seç</button>
          <button onClick={handleDeselectAll}>Seçimleri Kaldır</button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            disabled={selectedPdfs.length === 0 || loading}
            className="download-button-inline"
          >
            {loading ? 'İndiriliyor...' : `Seçili PDF'leri İndir (${selectedPdfs.length})`}
          </button>
        </div>

        <div className="right-buttons">
          <div className="calculation-row">
            <p className="result">{calculatedTotalHours}</p>
          </div>
          <div className="calculation-row">
            <p className="result">{totalHakedis}</p>
          </div>
        </div>
      </div>

      {sortedData.length > 0 && (
        <div className="table-container">
          <table className="puantajlar-table">
            <thead>
              <tr>
                <th>Seç</th>
                <th onClick={() => handleSort('pdfName')} style={{ cursor: 'pointer' }}>
                  PDF / Sözleşme No {renderSortIcon('pdfName')}
                </th>
                <th onClick={() => handleSort('customerName')} style={{ cursor: 'pointer' }}>
                  Müşteri {renderSortIcon('customerName')}
                </th>
                <th onClick={() => handleSort('cariCode')} style={{ cursor: 'pointer' }}>
                  Cari Kod {renderSortIcon('cariCode')}
                </th>
                <th onClick={() => handleSort('Makine İsmi')} style={{ cursor: 'pointer' }}>
                  Makine {renderSortIcon('Makine İsmi')}
                </th>
                <th onClick={() => handleSort('Operatör Adı')} style={{ cursor: 'pointer' }}>
                  Operatör {renderSortIcon('Operatör Adı')}
                </th>
                <th onClick={() => handleSort('Tarih')} style={{ cursor: 'pointer' }}>
                  Tarih {renderSortIcon('Tarih')}
                </th>
                <th>Detaylar</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index}>
                  <td data-label="Seç" className="priority">
                    <input
                      type="checkbox"
                      onChange={() => handleCheckboxChange(item.pdfName)}
                      checked={selectedPdfs.includes(item.pdfName)}
                    />
                  </td>
                  <td data-label="PDF / Sözleşme No" className="priority">
                    <button
                      className="link-button"
                      onClick={() => handlePdfClick(item.pdfRef, item.pdfName)}
                    >
                      {item.pdfName}
                    </button>
                  </td>
                  <td data-label="Müşteri" className="priority">
                    {item.customerName || '-'}
                  </td>
                  <td data-label="Cari Kod" className="priority cari-code">
                    {item.cariCode || '-'}
                  </td>
                  <td data-label="Makine" className="priority">
                    {item['Makine İsmi'] || '-'}
                  </td>
                  <td data-label="Operatör" className="priority">
                    {item['Operatör Adı'] || '-'}
                  </td>
                  <td data-label="Tarih" className="priority">
                    {item['Tarih'] || '-'}
                  </td>
                  <td data-label="Detaylar">
                    <div className="work-details">
                      <strong>Çalışma Saatleri:</strong> {renderWorkHours(item)}
                      <br />
                      <strong>Toplam Süre:</strong> {calculateTotalWorkDuration(item)}
                      <br />
                      <strong>Yetkili:</strong> {item['Yetkili Adı'] || '-'}
                      <br />
                      <strong>Detay:</strong> {item['Çalışma Detayı'] || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            <button onClick={closeHakedisPopup} className="close-button">
              Kapat
            </button>
          </div>
        </div>
      )}

      {alertOpen && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
          <span>{error || successMessage}</span>
          <button onClick={() => setAlertOpen(false)}>×</button>
        </div>
      )}

      {isDownloadModalOpen && <DownloadOptionsModal />}
    </div>
  );
};

export default React.memo(Puantajlar);
