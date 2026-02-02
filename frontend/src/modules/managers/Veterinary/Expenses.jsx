import React, { useEffect, useState } from 'react'
import {
  Container, Typography, Button, Card, Table, TableHead, TableRow, TableCell, TableBody,
  Box, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid
} from '@mui/material'
import { Add, Edit, Delete, Payment } from '@mui/icons-material'
import { veterinaryAPI } from '../../../services/api'
import { format } from 'date-fns'

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [form, setForm] = useState({
    category: 'supplies', description: '', amount: 0, expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', paymentStatus: 'pending'
  })
  const [payForm, setPayForm] = useState({ paidAmount: 0, paymentMethod: 'cash', paidDate: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await veterinaryAPI.managerGetExpenses()
      setExpenses(response.data?.data?.expenses || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedExpense) {
        await veterinaryAPI.managerUpdateExpense(selectedExpense._id, form)
      } else {
        await veterinaryAPI.managerCreateExpense(form)
      }
      setDialogOpen(false)
      setSelectedExpense(null)
      setForm({ category: 'supplies', description: '', amount: 0, expenseDate: new Date().toISOString().split('T')[0], paymentMethod: 'cash', paymentStatus: 'pending' })
      loadExpenses()
    } catch (error) {
      console.error(error)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      await veterinaryAPI.managerMarkExpenseAsPaid(selectedExpense._id, payForm)
      setPayDialogOpen(false)
      setSelectedExpense(null)
      setPayForm({ paidAmount: 0, paymentMethod: 'cash', paidDate: new Date().toISOString().split('T')[0] })
      loadExpenses()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setForm({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate.split('T')[0],
      paymentMethod: expense.paymentMethod,
      paymentStatus: expense.paymentStatus
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await veterinaryAPI.managerDeleteExpense(id)
        loadExpenses()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = { pending: 'warning', paid: 'success', partially_paid: 'info', overdue: 'error' }
    return colors[status] || 'default'
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">Expense Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedExpense(null); setDialogOpen(true) }}>
          Add Expense
        </Button>
      </Box>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No expenses found</TableCell></TableRow>
            ) : (
              expenses.map(expense => (
                <TableRow key={expense._id}>
                  <TableCell>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>₹{expense.amount}</TableCell>
                  <TableCell>₹{expense.paidAmount || 0}</TableCell>
                  <TableCell>₹{expense.balanceDue || 0}</TableCell>
                  <TableCell><Chip label={expense.paymentStatus} color={getStatusColor(expense.paymentStatus)} size="small" /></TableCell>
                  <TableCell>
                    {expense.paymentStatus !== 'paid' && (
                      <IconButton size="small" onClick={() => { setSelectedExpense(expense); setPayForm({ ...payForm, paidAmount: expense.balanceDue }); setPayDialogOpen(true) }}>
                        <Payment />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleEdit(expense)}><Edit /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(expense._id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{selectedExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required sx={{ mt: 2 }}>
              <MenuItem value="salary">Salary</MenuItem>
              <MenuItem value="rent">Rent</MenuItem>
              <MenuItem value="utilities">Utilities</MenuItem>
              <MenuItem value="supplies">Supplies</MenuItem>
              <MenuItem value="equipment">Equipment</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="marketing">Marketing</MenuItem>
              <MenuItem value="insurance">Insurance</MenuItem>
              <MenuItem value="taxes">Taxes</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required sx={{ mt: 2 }} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="date" label="Expense Date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth select label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth select label="Payment Status" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="partially_paid">Partially Paid</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handlePayment}>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Total Amount: ₹{selectedExpense?.amount}<br />
              Already Paid: ₹{selectedExpense?.paidAmount || 0}<br />
              Balance Due: ₹{selectedExpense?.balanceDue || 0}
            </Typography>
            <TextField fullWidth type="number" label="Payment Amount" value={payForm.paidAmount} onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })} required sx={{ mt: 2 }} />
            <TextField fullWidth select label="Payment Method" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })} sx={{ mt: 2 }}>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </TextField>
            <TextField fullWidth type="date" label="Payment Date" value={payForm.paidDate} onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })} required sx={{ mt: 2 }} InputLabelProps={{ shrink: true }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Record Payment</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default Expenses
