import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { database } from './firebaseConfig';
import * as XLSX from 'xlsx';
import { Download, Calendar, Filter } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import tr from 'date-fns/locale/tr';
import Select from 'react-select';
import { debounce } from 'lodash';
import 'react-datepicker/dist/react-datepicker.css';
import './Raporlama.css';

registerLocale('tr', tr);

const parseDate = (dateString) => {
  if (!dateString) return new Date();
  const [day, month, year] = dateString.split('.');
  if (!day || !month || !year) return new Date();
  return new Date(`${year}-${month}-${day}T00:00:00`);
};

const Raporlama = () => {
  // React Hooks must be called at the top level
  const [workData, setWorkData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtre durumları
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [machineOptions, setMachineOptions] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [operatorOptions, setOperatorOptions] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);

  const debouncedSetStartDate = useMemo(
    () => debounce((date) => setStartDate(date), 300),
    []
  );

  const debouncedSetEndDate = useMemo(
    () => debounce((date) => setEndDate(date), 300),
    []
  );

  const formatTime = useCallback((timeString) => {
    if (!timeString || timeString === '""') return null;
    const cleanTime = timeString.replace(/['"]/g, '').trim();
    if (!cleanTime) return null;
    const [hours, minutes] = cleanTime.split(':').map(num => num.trim());
    if (!hours || !minutes) return null;
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }, []);

  const calculateDuration = useCallback((start, end) => {
    if (!start || !end) return 0;
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    let duration = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    if (duration < 0) {
      duration += 24 * 60;
    }
    return duration;
  }, []);

  const calculateTotalWorkHours = useCallback((item) => {
    const start1 = formatTime(item['1. Başlangıç Saati']);
    const end1 = formatTime(item['1. Bitiş Saati']);
    const start2 = formatTime(item['2. Başlangıç Saati']);
    const end2 = formatTime(item['2. Bitiş Saati']);

    const duration1 = start1 && end1 ? calculateDuration(start1, end1) : 0;
    const duration2 = start2 && end2 ? calculateDuration(start2, end2) : 0;

    const totalMinutes = duration1 + duration2;
    const totalHours = totalMinutes / 60;

    return totalHours;
  }, [formatTime, calculateDuration]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = database;

        // Müşteri listesini yükle
        const customerSnapshot = await getDocs(collection(db, 'müşteri listesi'));
        const customerOptionsArray = customerSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const customerName = data['Müşteri Adı']?.trim() || '';
            const cariCode = data['cariCode']?.trim() || '';
            return {
              value: customerName,
              label: `${customerName} / ${cariCode}`,
              searchValue: customerName.toLowerCase()
            };
          })
          .filter(option => option.value)
          .sort((a, b) => a.label.localeCompare(b.label));
        setCustomerOptions(customerOptionsArray);

        // Makine listesini yükle
        const machineSnapshot = await getDocs(collection(db, 'makineListesi'));
        const machineOptionsArray = machineSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const machineName = data['MakineAdı']?.trim() || '';
            return {
              value: machineName,
              label: machineName,
              hourlyRate: Number(data['BirimFiyat']) || 0,
              searchValue: machineName.toLowerCase()
            };
          })
          .filter(option => option.value)
          .sort((a, b) => a.label.localeCompare(b.label));
        setMachineOptions(machineOptionsArray);

        // Operatör listesini yükle
        const operatorSnapshot = await getDocs(collection(db, 'operatorListesi'));
        const operatorOptionsArray = operatorSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const operatorName = data['name']?.trim() || '';
            return {
              value: operatorName,
              label: operatorName,
              searchValue: operatorName.toLowerCase()
            };
          })
          .filter(option => option.value)
          .sort((a, b) => a.label.localeCompare(b.label));
        setOperatorOptions(operatorOptionsArray);

        // Puantaj verilerini yükle
        const puantajSnapshot = await getDocs(collection(db, 'puantajlar'));
        const puantajData = puantajSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWorkData(puantajData);
        setLoading(false);

      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        setError('Veriler yüklenirken bir hata oluştu');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let filtered = workData;

    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        const itemDate = parseDate(item['Tarih']);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    if (selectedCustomers.length > 0) {
      filtered = filtered.filter(item => {
        const customerName = (item['Müşteri Adı'] || '').toLowerCase();
        return selectedCustomers.some(selected =>
          selected.value.toLowerCase() === customerName
        );
      });
    }

    if (selectedMachines.length > 0) {
      filtered = filtered.filter(item => {
        const machineName = (item['Makine İsmi'] || '').toLowerCase();
        return selectedMachines.some(selected =>
          selected.value.toLowerCase() === machineName
        );
      });
    }

    if (selectedOperators.length > 0) {
      filtered = filtered.filter(item => {
        const operatorName = (item['Operatör Adı'] || '').toLowerCase();
        return selectedOperators.some(selected =>
          selected.value.toLowerCase() === operatorName
        );
      });
    }

    return filtered;
  }, [workData, startDate, endDate, selectedCustomers, selectedMachines, selectedOperators]);

  const summaryData = useMemo(() => {
    const summary = filteredData.reduce((acc, item) => {
      const key = `${item['Müşteri Adı']}-${item['Makine İsmi']}`;
      if (!acc[key]) {
        acc[key] = {
          customer: item['Müşteri Adı'],
          machine: item['Makine İsmi'],
          hours: 0,
          amount: 0
        };
      }
      const hours = calculateTotalWorkHours(item);
      const machine = machineOptions.find(m => m.value === item['Makine İsmi']);
      const rate = machine ? Number(machine.hourlyRate) || 0 : 0;
      acc[key].hours += hours;
      acc[key].amount += hours * rate;
      return acc;
    }, {});
    return Object.values(summary);
  }, [filteredData, calculateTotalWorkHours, machineOptions]);

  const totalHours = useMemo(() => {
    return summaryData.reduce((total, item) => total + item.hours, 0);
  }, [summaryData]);

  const totalAmount = useMemo(() => {
    return summaryData.reduce((total, item) => total + item.amount, 0);
  }, [summaryData]);

  const generateExcelReport = useCallback(() => {
    const customerSummary = {};
    filteredData.forEach(item => {
      const customerName = item['Müşteri Adı'];
      const machineType = item['Makine İsmi'];
      const machine = machineOptions.find(m => m.value === machineType);
      const hourlyRate = machine ? Number(machine.hourlyRate) || 0 : 0;
      const workHours = calculateTotalWorkHours(item);

      if (!customerSummary[customerName]) {
        customerSummary[customerName] = {
          totalHours: 0,
          totalAmount: 0,
          machines: {}
        };
      }

      customerSummary[customerName].totalHours += workHours;
      customerSummary[customerName].totalAmount += workHours * hourlyRate;

      if (!customerSummary[customerName].machines[machineType]) {
        customerSummary[customerName].machines[machineType] = {
          hours: 0,
          amount: 0
        };
      }
      customerSummary[customerName].machines[machineType].hours += workHours;
      customerSummary[customerName].machines[machineType].amount += workHours * hourlyRate;
    });

    const summarySheet = Object.entries(customerSummary).map(([customer, data]) => ({
      'Müşteri': customer,
      'Toplam Çalışma Saati': Number(data.totalHours).toFixed(2),
      'Toplam Tutar (TL)': Number(data.totalAmount).toFixed(2)
    }));

    const detailSheet = Object.entries(customerSummary).flatMap(([customer, data]) =>
      Object.entries(data.machines).map(([machine, stats]) => ({
        'Müşteri': customer,
        'Makine': machine,
        'Çalışma Saati': Number(stats.hours).toFixed(2),
        'Saatlik Ücret': machineOptions.find(m => m.value === machine)?.hourlyRate || 0,
        'Tutar (TL)': Number(stats.amount).toFixed(2)
      }))
    );

    const rawDataSheet = filteredData.map(item => ({
      'Tarih': item['Tarih'],
      'Müşteri': item['Müşteri Adı'],
      'Makine': item['Makine İsmi'],
      'Operatör': item['Operatör Adı'],
      'Çalışma Saati': calculateTotalWorkHours(item).toFixed(2),
      'Çalışma Detayı': item['Çalışma Detayı'] || '-',
      '1. Vardiya': `${item['1. Başlangıç Saati'] || '-'} - ${item['1. Bitiş Saati'] || '-'}`,
      '2. Vardiya': `${item['2. Başlangıç Saati'] || '-'} - ${item['2. Bitiş Saati'] || '-'}`,
    }));

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), "Müşteri Özet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailSheet), "Makine Detay");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rawDataSheet), "Tüm Kayıtlar");

    const dateStr = startDate && endDate ?
      `_${startDate.toLocaleDateString('tr-TR')}_${endDate.toLocaleDateString('tr-TR')}`.replace(/\./g, '_') :
      '';
    XLSX.writeFile(wb, `Puantaj_Raporu${dateStr}.xlsx`);
  }, [filteredData, machineOptions, calculateTotalWorkHours, startDate, endDate]);

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="raporlama-container">
      <h2>Raporlama</h2>

      <div className="filter-container">
        <div className="filters-row">
          <div className="date-filter">
            <label>
              <Calendar size={16} />
              Tarih Aralığı:
            </label>
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

          <div className="select-filter">
            <label>
              <Filter size={16} />
              Müşteri:
            </label>
            <Select
              isMulti
              options={customerOptions}
              value={selectedCustomers}
              onChange={setSelectedCustomers}
              placeholder="Müşteri Seçin"
              className="react-select"
              classNamePrefix="select"
            />
          </div>

          <div className="select-filter">
            <label>
              <Filter size={16} />
              Makine:
            </label>
            <Select
              isMulti
              options={machineOptions}
              value={selectedMachines}
              onChange={setSelectedMachines}
              placeholder="Makine Seçin"
              className="react-select"
              classNamePrefix="select"
            />
          </div>

          <div className="select-filter">
            <label>
              <Filter size={16} />
              Operatör:
            </label>
            <Select
              isMulti
              options={operatorOptions}
              value={selectedOperators}
              onChange={setSelectedOperators}
              placeholder="Operatör Seçin"
              className="react-select"
              classNamePrefix="select"
            />
          </div>
        </div>

        <button
          className="generate-report-btn"
          onClick={generateExcelReport}
          disabled={loading || filteredData.length === 0}
        >
          <Download size={16} />
          Excel Raporu Oluştur
        </button>
      </div>

      <div className="preview-section">
        <h3>Rapor Önizleme</h3>
        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>Müşteri</th>
                <th>Makine</th>
                <th>Toplam Saat</th>
                <th>Tutar (TL)</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((data, index) => (
                <tr key={index}>
                  <td>{data.customer}</td>
                  <td>{data.machine}</td>
                  <td>{Number(data.hours).toFixed(2)}</td>
                  <td>{Number(data.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Toplam</strong></td>
                <td>
                  <strong>{Number(totalHours).toFixed(2)}</strong>
                </td>
                <td>
                  <strong>{Number(totalAmount).toFixed(2)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Raporlama);
