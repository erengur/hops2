import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  maxHeight: 400,
  overflowY: 'auto',
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: '0.875rem',
}));

const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const CustomerSelectionTable = ({ customers = [], onSelectCustomer, includeSpecialCases = false }) => {
  const [sortedCustomers, setSortedCustomers] = useState([]);
  const [orderBy, setOrderBy] = useState('Müşteri Adı');
  const [order, setOrder] = useState('asc');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const filteredCustomers = includeSpecialCases
      ? customers
      : customers.filter(customer => !customer.Şantiye);
    setSortedCustomers(filteredCustomers);
  }, [customers, includeSpecialCases]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);

    const sorted = [...sortedCustomers].sort((a, b) => {
      if (a[property] === undefined || b[property] === undefined) return 0;

      if (typeof a[property] === 'string') {
        return a[property].localeCompare(b[property]) * (newOrder === 'asc' ? 1 : -1);
      }

      return (a[property] < b[property] ? -1 : 1) * (newOrder === 'asc' ? 1 : -1);
    });

    setSortedCustomers(sorted);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredCustomers = sortedCustomers.filter(
    (customer) =>
      customer['Müşteri Adı']?.toLowerCase().includes(filter.toLowerCase()) ||
      customer.cariCode?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <StyledTableContainer component={Paper}>
      <FilterContainer>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Müşteri adı veya cari kod ile filtrele"
          value={filter}
          onChange={handleFilterChange}
        />
      </FilterContainer>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <StyledTableCell>
              <TableSortLabel
                active={orderBy === 'Müşteri Adı'}
                direction={orderBy === 'Müşteri Adı' ? order : 'asc'}
                onClick={() => handleSort('Müşteri Adı')}
              >
                Müşteri Adı
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell>
              <TableSortLabel
                active={orderBy === 'cariCode'}
                direction={orderBy === 'cariCode' ? order : 'asc'}
                onClick={() => handleSort('cariCode')}
              >
                Cari Kodu
              </TableSortLabel>
            </StyledTableCell>
            <StyledTableCell align="right">Telefon</StyledTableCell>
            <StyledTableCell align="right">E-posta</StyledTableCell>
            {includeSpecialCases && (
              <StyledTableCell align="right">Şantiye</StyledTableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow
              key={customer.id}
              hover
              onClick={() => onSelectCustomer(customer)}
              style={{ cursor: 'pointer' }}
            >
              <StyledTableCell>{customer['Müşteri Adı']}</StyledTableCell>
              <StyledTableCell>{customer.cariCode}</StyledTableCell>
              <StyledTableCell align="right">{customer['Telefon']}</StyledTableCell>
              <StyledTableCell align="right">{customer['E-posta']}</StyledTableCell>
              {includeSpecialCases && (
                <StyledTableCell align="right">{customer['Şantiye'] ? 'Evet' : 'Hayır'}</StyledTableCell>
              )}
            </TableRow>
          ))}
          {filteredCustomers.length === 0 && (
            <TableRow>
              <TableCell colSpan={includeSpecialCases ? 5 : 4} align="center">
                Kayıt Bulunamadı
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};

CustomerSelectionTable.propTypes = {
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      'Müşteri Adı': PropTypes.string.isRequired,
      cariCode: PropTypes.string.isRequired,
      Telefon: PropTypes.string,
      'E-posta': PropTypes.string,
      Şantiye: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    })
  ),
  onSelectCustomer: PropTypes.func.isRequired,
  includeSpecialCases: PropTypes.bool,
};

export default CustomerSelectionTable;