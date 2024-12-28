import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  TextField,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from './firebaseConfig';
import { collection } from 'firebase/firestore';

const StyledTableContainer = styled(TableContainer)({
  maxHeight: '400px',
  '& .MuiTableCell-root': {
    padding: '8px 16px',
  }
});

const StyledTableCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '200px',
});

const FilterBox = styled(Box)({
  padding: '16px',
  backgroundColor: '#fff',
});

const CustomerSelectionTable = ({ customers = [], onSelectCustomer, selectedId }) => {
  const [orderBy, setOrderBy] = useState('Müşteri Adı');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('');

  const userEmail = auth.currentUser?.email;
  if (!userEmail) {
    return null;
  }

  // Müşterileri ve şantiyeleri grupla
  const groupedCustomers = customers.reduce((acc, customer) => {
    if (!customer.parentId) {
      if (!acc[customer.id]) {
        acc[customer.id] = {
          parent: customer,
          children: []
        };
      } else {
        acc[customer.id].parent = customer;
      }
    } else {
      if (!acc[customer.parentId]) {
        acc[customer.parentId] = {
          parent: null,
          children: [customer]
        };
      } else {
        acc[customer.parentId].children.push(customer);
      }
    }
    return acc;
  }, {});

  // Sıralama fonksiyonu
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Düzenlenmiş ve filtrelenmiş listeyi oluştur
  const sortedCustomers = [];
  
  // Önce ana müşterileri sırala
  const parentCustomers = Object.values(groupedCustomers)
    .map(({ parent }) => parent)
    .filter(Boolean) // null değerleri filtrele
    .sort((a, b) => {
      const comparison = (a[orderBy] || '').localeCompare(b[orderBy] || '');
      return order === 'asc' ? comparison : -comparison;
    });

  // Sıralanmış ana müşterilere göre listeyi oluştur
  parentCustomers.forEach(parent => {
    const children = groupedCustomers[parent.id]?.children || [];
    
    const parentMatchesFilter = 
      parent['Müşteri Adı']?.toLowerCase().includes(filter.toLowerCase()) ||
      parent.cariCode?.toLowerCase().includes(filter.toLowerCase());

    const filteredChildren = children.filter(child => 
      filter === '' || 
      child['Müşteri Adı']?.toLowerCase().includes(filter.toLowerCase()) ||
      child.cariCode?.toLowerCase().includes(filter.toLowerCase())
    );

    if (parentMatchesFilter || filteredChildren.length > 0) {
      // Ana müşteriyi ekle
      sortedCustomers.push({
        ...parent,
        isParent: true
      });

      // Şantiyeleri alfabetik sırala ve ekle
      filteredChildren
        .sort((a, b) => (a['Müşteri Adı'] || '').localeCompare(b['Müşteri Adı'] || ''))
        .forEach(child => {
          sortedCustomers.push({
            ...child,
            isChild: true
          });
        });
    }
  });

  return (
    <>
      <FilterBox>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Müşteri adı veya cari kod ile filtrele..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </FilterBox>
      <StyledTableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'Müşteri Adı'}
                  direction={orderBy === 'Müşteri Adı' ? order : 'asc'}
                  onClick={() => handleSort('Müşteri Adı')}
                >
                  Müşteri/Şantiye Adı
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'cariCode'}
                  direction={orderBy === 'cariCode' ? order : 'asc'}
                  onClick={() => handleSort('cariCode')}
                >
                  Cari Kod
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Telefon</TableCell>
              <TableCell align="right">E-posta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                onClick={() => onSelectCustomer(customer)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  // Seçili satır için özel stil
                  ...(selectedId === customer.id && {
                    backgroundColor: '#e3f2fd',
                    borderLeft: '4px solid #1976d2',
                    '&:hover': {
                      backgroundColor: '#e3f2fd',
                    }
                  })
                }}
              >
                <StyledTableCell>
                  {customer['Müşteri Adı']}
                  {customer.isChild && ' (Şantiye)'}
                </StyledTableCell>
                <StyledTableCell>{customer.cariCode}</StyledTableCell>
                <StyledTableCell align="right">{customer.Telefon}</StyledTableCell>
                <StyledTableCell align="right">{customer['E-posta']}</StyledTableCell>
              </TableRow>
            ))}
            {sortedCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Kayıt Bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </>
  );
};

export default CustomerSelectionTable;