import { collection, query, where } from 'firebase/firestore';

const getUserBasePath = (userEmail) => `users/${userEmail}`;

export const getCustomerListRef = (db, userEmail) => {
  console.log('CustomerList yolu:', `${getUserBasePath(userEmail)}/customerList`);
  return collection(db, getUserBasePath(userEmail), 'customerList');
};

export const getTimeSheetsRef = (db, userEmail) => {
  console.log('TimeSheets yolu:', `${getUserBasePath(userEmail)}/timeSheets`);
  return collection(db, getUserBasePath(userEmail), 'timeSheets');
};

export const getMachinesRef = (db, userEmail) => {
  return collection(db, getUserBasePath(userEmail), 'machines');
};

export const getOperatorsRef = (db, userEmail) => {
  return collection(db, getUserBasePath(userEmail), 'operators');
};

export const getSettingsRef = (db, userEmail) => {
  return collection(db, getUserBasePath(userEmail), 'settings');
};

// Sorgu oluşturan yardımcı fonksiyonlar
export const getApprovedCustomersQuery = (db, userEmail) => {
  const customerListRef = getCustomerListRef(db, userEmail);
  return query(customerListRef, where('Onay', '==', 'Onaylandı'));
};

export const getPendingCustomersQuery = (db, userEmail) => {
  const customerListRef = getCustomerListRef(db, userEmail);
  return query(customerListRef, where('Onay', '==', 'Onay Bekliyor'));
};

// Veri dönüştürme yardımcı fonksiyonu
export const transformFirestoreData = (doc) => ({
  id: doc.id,
  ...doc.data()
}); 