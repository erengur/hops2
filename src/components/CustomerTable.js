import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TableSortLabel,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const CustomerTable = ({ customers, onEdit, onDelete, type }) => {
  const [orderBy, setOrderBy] = useState('Müşteri Adı');
  const [order, setOrder] = useState('asc');
  const [openRows, setOpenRows] = useState({});

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    if (orderBy === 'cariCode') {
      return order === 'asc' 
        ? a.cariCode.localeCompare(b.cariCode, undefined, {numeric: true, sensitivity: 'base'})
        : b.cariCode.localeCompare(a.cariCode, undefined, {numeric: true, sensitivity: 'base'});
    } else {
      return order === 'asc'
        ? a['Müşteri Adı'].localeCompare(b['Müşteri Adı'])
        : b['Müşteri Adı'].localeCompare(a['Müşteri Adı']);
    }
  });

  const toggleRow = (id) => {
    setOpenRows(prevState => ({ ...prevState, [id]: !prevState[id] }));
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>
              <TableSortLabel
                active={orderBy === 'Müşteri Adı'}
                direction={orderBy === 'Müşteri Adı' ? order : 'asc'}
                onClick={() => handleRequestSort('Müşteri Adı')}
              >
                Müşteri Adı
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'cariCode'}
                direction={orderBy === 'cariCode' ? order : 'asc'}
                onClick={() => handleRequestSort('cariCode')}
              >
                Cari Kodu
              </TableSortLabel>
            </TableCell>
            <TableCell>Telefon</TableCell>
            <TableCell>E-posta</TableCell>
            <TableCell>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedCustomers.map((customer) => (
            <React.Fragment key={customer.id}>
              <TableRow>
                <TableCell padding="checkbox">
                  {customer.şantiyeler && customer.şantiyeler.length > 0 && (
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => toggleRow(customer.id)}
                    >
                      {openRows[customer.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  )}
                </TableCell>
                <TableCell>{customer['Müşteri Adı']}</TableCell>
                <TableCell>{customer.cariCode}</TableCell>
                <TableCell>{customer.Telefon}</TableCell>
                <TableCell>{customer['E-posta']}</TableCell>
                <TableCell>
                  <IconButton onClick={() => onEdit(customer)}>
                    <EditIcon />
                  </IconButton>
                  {type === 'approved' && (
                    <IconButton onClick={() => onDelete(customer)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
              {customer.şantiyeler && customer.şantiyeler.length > 0 && (
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={openRows[customer.id]} timeout="auto" unmountOnExit>
                      <Box margin={1}>
                        <Typography variant="h6" gutterBottom component="div">
                          Şantiyeler
                        </Typography>
                        <Table size="small" aria-label="şantiyeler">
                          <TableHead>
                            <TableRow>
                              <TableCell>Şantiye Adı</TableCell>
                              <TableCell>Cari Kodu</TableCell>
                              <TableCell>Telefon</TableCell>
                              <TableCell>E-posta</TableCell>
                              <TableCell>İşlemler</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customer.şantiyeler.map((şantiye) => (
                              <TableRow key={şantiye.id}>
                                <TableCell component="th" scope="row">
                                  {şantiye['Müşteri Adı']}
                                </TableCell>
                                <TableCell>{şantiye.cariCode}</TableCell>
                                <TableCell>{şantiye.Telefon}</TableCell>
                                <TableCell>{şantiye['E-posta']}</TableCell>
                                <TableCell>
                                  <IconButton onClick={() => onEdit(şantiye)}>
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton onClick={() => onDelete(şantiye)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CustomerTable;