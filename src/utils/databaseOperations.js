import { getFirestore, collection } from 'firebase/firestore';

// Koleksiyon referanslarını getiren yardımcı fonksiyonlar
export const getCustomerListRef = (userEmail) => {
  const db = getFirestore();
  return collection(db, `users/${userEmail}/customerList`);
};

export const getMachinesRef = (userEmail) => {
  const db = getFirestore();
  return collection(db, `users/${userEmail}/machines`);
};

export const getOperatorsRef = (userEmail) => {
  const db = getFirestore();
  return collection(db, `users/${userEmail}/operators`);
};

export const getPuantajlarRef = (userEmail) => {
  const db = getFirestore();
  return collection(db, `users/${userEmail}/timeSheets`);
};

// Yeni timeSheets fonksiyonu ekle
export const getTimeSheetsRef = (userEmail) => {
  const db = getFirestore();
  return collection(db, `users/${userEmail}/timeSheets`);
};

// Veri dönüştürme yardımcı fonksiyonu ekle
export const transformFirestoreData = (doc) => ({
  id: doc.id,
  ...doc.data()
});

// Diğer veritabanı yardımcı fonksiyonları buraya eklenebilir 