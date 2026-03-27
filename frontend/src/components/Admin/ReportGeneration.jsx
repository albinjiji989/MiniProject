import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Pets as AdoptionIcon,
  Store as PetshopIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

const ReportGeneration = () => {
  const [selectedModule, setSelectedModule] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  })
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState('')

  const modules = [
    {
      id: 'adoption',
      name: 'Adoption Module',
      icon: <AdoptionIcon />,
      color: '#4CAF50',
      description: 'Generate comprehensive adoption reports including adopted pets and revenue analysis'
    },
    {
      id: 'petshop',
      name: 'Pet Shop Module', 
      icon: <PetshopIcon />,
      color: '#FF9800',
      description: 'Generate detailed petshop reports including pets purchased by breed with revenue breakdown'
    },
    {
      id: 'ecommerce',
      name: 'Ecommerce Module',
      icon: <PetshopIcon />,
      color: '#2196F3',
      description: 'Generate complete ecommerce reports with all products purchased, quantities, and totals like a real bill'
    }
  ]

  const handleModuleSelect = (moduleId) => {
    setSelectedModule(moduleId)
    setReportData(null)
    setError('')
  }

  const generateReportData = async () => {
    if (!selectedModule) {
      setError('Please select a module first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString()
      })

      const response = await fetch(`/api/admin/reports/${selectedModule}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setReportData(result.data)
      } else {
        throw new Error(result.message || 'Failed to generate report')
      }

    } catch (err) {
      setError('Failed to generate report data. Please try again.')
      console.error('Report generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20

    // Header with logo placeholder and title
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('PetConnect', 20, 25)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(`${reportData.module} Report`, 20, 35)

    yPosition = 60

    // Report period and generation date
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Report Period: ${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}`, 20, yPosition)
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth - 80, yPosition)
    
    yPosition += 20

    // Summary section with colored background
    doc.setFillColor(248, 250, 252)
    doc.rect(15, yPosition - 5, pageWidth - 30, 40, 'F')
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Executive Summary', 20, yPosition + 5)
    
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    if (reportData.module === 'Adoption') {
      const summaryData = [
        [`Total Adoptions`, (reportData.summary.totalAdoptions || 0).toString()],
        [`Total Revenue`, `$${(reportData.summary.totalRevenue || 0).toLocaleString()}`],
        [`Average Adoption Fee`, `$${reportData.summary.avgAdoptionFee || 0}`],
        [`Date Range`, `${reportData.summary.dateRange?.from || 'N/A'} - ${reportData.summary.dateRange?.to || 'N/A'}`]
      ]
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
      })
      
      yPosition = doc.lastAutoTable.finalY + 20
      
      // Adopted Pets Details Table
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Adopted Pets Details', 20, yPosition)
      yPosition += 10
      
      const petData = (reportData.adoptedPets || []).slice(0, 20).map(pet => [
        pet.petCode || 'N/A',
        pet.name || 'Unknown',
        pet.species || 'Unknown',
        pet.breed || 'Mixed',
        `$${pet.adoptionFee || 0}`,
        pet.adoptedDate ? new Date(pet.adoptedDate).toLocaleDateString() : 'N/A',
        pet.adopter || 'Unknown'
      ])
      
      if (petData.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Pet Code', 'Name', 'Species', 'Breed', 'Fee', 'Adopted Date', 'Adopter']],
          body: petData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 4: { halign: 'right' } }
        })

        // Add new page if needed
        if (doc.lastAutoTable.finalY > pageHeight - 100) {
          doc.addPage()
          yPosition = 20
        } else {
          yPosition = doc.lastAutoTable.finalY + 20
        }
      }

      // Breed Analysis Table
      if (reportData.breedBreakdown && reportData.breedBreakdown.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Adoption by Breed Analysis', 20, yPosition)
        yPosition += 10
        
        const breedData = reportData.breedBreakdown.slice(0, 15).map(breed => [
          breed.breed || 'Unknown',
          (breed.adoptions || 0).toString(),
          `$${(breed.totalRevenue || 0).toLocaleString()}`,
          `$${breed.avgFee || 0}`
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Breed', 'Adoptions', 'Total Revenue', 'Avg Fee']],
          body: breedData,
          theme: 'striped',
          headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
        })
      }
      
    } else if (reportData.module === 'Pet Shop') {
      const summaryData = [
        [`Total Orders`, (reportData.summary.totalOrders || 0).toString()],
        [`Total Revenue`, `$${(reportData.summary.totalRevenue || 0).toLocaleString()}`],
        [`Items Sold`, (reportData.summary.totalItemsSold || 0).toString()],
        [`Average Order Value`, `$${reportData.summary.avgOrderValue || 0}`],
        [`Date Range`, `${reportData.summary.dateRange?.from || 'N/A'} - ${reportData.summary.dateRange?.to || 'N/A'}`]
      ]
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
      })
      
      yPosition = doc.lastAutoTable.finalY + 20
      
      // Breed Analysis Table
      if (reportData.breedAnalysis && reportData.breedAnalysis.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Sales by Pet Breed Analysis', 20, yPosition)
        yPosition += 10
        
        const breedData = reportData.breedAnalysis.slice(0, 15).map(breed => [
          breed.breed || 'Unknown',
          (breed.itemsPurchased || 0).toString(),
          `$${(breed.totalRevenue || 0).toLocaleString()}`,
          (breed.topProducts || []).slice(0, 2).map(p => p?.name || 'Unknown').join(', ') || 'N/A'
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Breed', 'Items Purchased', 'Revenue', 'Top Products']],
          body: breedData,
          theme: 'striped',
          headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } }
        })

        // Add new page if needed
        if (doc.lastAutoTable.finalY > pageHeight - 100) {
          doc.addPage()
          yPosition = 20
        } else {
          yPosition = doc.lastAutoTable.finalY + 20
        }
      }

      // Product Sales Table
      if (reportData.productSales && reportData.productSales.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Top Selling Products', 20, yPosition)
        yPosition += 10
        
        const productData = reportData.productSales.slice(0, 15).map(product => [
          product.name || 'Unknown Product',
          product.category || 'Uncategorized',
          (product.quantitySold || 0).toString(),
          `$${(product.unitPrice || 0).toFixed(2)}`,
          `$${(product.totalRevenue || 0).toLocaleString()}`
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Product', 'Category', 'Qty Sold', 'Unit Price', 'Revenue']],
          body: productData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } }
        })
      }
      
    } else if (reportData.module === 'Ecommerce') {
      const summaryData = [
        [`Total Orders`, (reportData.summary.totalOrders || 0).toString()],
        [`Total Revenue`, `$${(reportData.summary.totalRevenue || 0).toLocaleString()}`],
        [`Products Sold`, (reportData.summary.totalProducts || 0).toString()],
        [`Items Sold`, (reportData.summary.totalItemsSold || 0).toString()],
        [`Total Customers`, (reportData.summary.totalCustomers || 0).toString()],
        [`Avg Order Value`, `$${reportData.summary.avgOrderValue || 0}`],
        [`Date Range`, `${reportData.summary.dateRange?.from || 'N/A'} - ${reportData.summary.dateRange?.to || 'N/A'}`]
      ]
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
      })
      
      yPosition = doc.lastAutoTable.finalY + 20
      
      // Product Sales Table - Like a real bill
      if (reportData.productSales && reportData.productSales.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Product Sales Breakdown (Bill Format)', 20, yPosition)
        yPosition += 10
        
        const productData = reportData.productSales.slice(0, 20).map(product => [
          product.name || 'Unknown Product',
          product.category || 'Uncategorized',
          (product.quantitySold || 0).toString(),
          `$${(product.unitPrice || 0).toFixed(2)}`,
          `$${(product.totalRevenue || 0).toLocaleString()}`,
          (product.orderCount || 0).toString()
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Product Name', 'Category', 'Qty Sold', 'Unit Price', 'Total Revenue', 'Orders']],
          body: productData,
          theme: 'striped',
          headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' } }
        })

        // Add new page if needed
        if (doc.lastAutoTable.finalY > pageHeight - 100) {
          doc.addPage()
          yPosition = 20
        } else {
          yPosition = doc.lastAutoTable.finalY + 20
        }
      }

      // Category Breakdown
      if (reportData.categoryBreakdown && reportData.categoryBreakdown.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Sales by Category', 20, yPosition)
        yPosition += 10
        
        const categoryData = reportData.categoryBreakdown.map(cat => [
          cat.category || 'Uncategorized',
          (cat.products || 0).toString(),
          (cat.quantitySold || 0).toString(),
          `$${(cat.totalRevenue || 0).toLocaleString()}`,
          (cat.orderCount || 0).toString()
        ])
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Category', 'Products', 'Qty Sold', 'Revenue', 'Orders']],
          body: categoryData,
          theme: 'striped',
          headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'center' } }
        })
      }
    }

    // Add new page if needed
    if (doc.lastAutoTable.finalY > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    } else {
      yPosition = doc.lastAutoTable.finalY + 20
    }

    // Footer
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Generated by PetConnect Admin System', 20, pageHeight - 15)
    doc.text(`Page 1 of 1`, pageWidth - 40, pageHeight - 15)

    // Save the PDF
    const fileName = `PetConnect_${reportData.module.replace(' ', '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`
    doc.save(fileName)
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
          <ReportIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Report Generation
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Generate comprehensive reports for adoption and petshop modules with detailed analytics and insights.
        </Typography>
      </Box>

      {/* Module Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon />
            Select Module
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {modules.map((module) => (
              <Grid item xs={12} md={6} key={module.id}>
                <Paper
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    border: selectedModule === module.id ? 2 : 1,
                    borderColor: selectedModule === module.id ? 'primary.main' : 'divider',
                    backgroundColor: selectedModule === module.id ? 'primary.50' : 'background.paper',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50',
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ color: module.color, fontSize: 32 }}>
                      {module.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {module.name}
                    </Typography>
                    {selectedModule === module.id && (
                      <Chip label="Selected" color="primary" size="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {module.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Date Range Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateRangeIcon />
            Report Period
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, startDate: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(newValue) => setDateRange(prev => ({ ...prev, endDate: newValue }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
        </CardContent>
      </Card>

      {/* Generate Report Button */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={generateReportData}
          disabled={!selectedModule || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
          sx={{ px: 4, py: 1.5 }}
        >
          {loading ? 'Generating Report...' : 'Generate Report'}
        </Button>
        
        {reportData && (
          <Button
            variant="outlined"
            size="large"
            onClick={generatePDF}
            startIcon={<DownloadIcon />}
            sx={{ px: 4, py: 1.5 }}
          >
            Download PDF
          </Button>
        )}
        
        <Tooltip title="Refresh Data">
          <IconButton onClick={generateReportData} disabled={!selectedModule || loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Report Preview */}
      {reportData && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon />
              Report Preview - {reportData.module} Module
            </Typography>
            
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
              {reportData.module === 'Adoption' ? (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.50' }}>
                      <AdoptionIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {reportData.summary.totalAdoptions}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Adoptions</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.50' }}>
                      <MoneyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        ${reportData.summary.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.50' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ${reportData.summary.avgAdoptionFee}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Avg Fee</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.50' }}>
                      <PeopleIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        {reportData.breedBreakdown?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Breeds Adopted</Typography>
                    </Paper>
                  </Grid>
                </>
              ) : reportData.module === 'Pet Shop' ? (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.50' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {reportData.summary.totalOrders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.50' }}>
                      <MoneyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        ${reportData.summary.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.50' }}>
                      <PetshopIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        {reportData.summary.totalItemsSold}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Items Sold</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.50' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {reportData.breedAnalysis?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Breeds Served</Typography>
                    </Paper>
                  </Grid>
                </>
              ) : (
                // Ecommerce Module
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.50' }}>
                      <PetshopIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {reportData.summary.totalOrders}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.50' }}>
                      <MoneyIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ${reportData.summary.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.50' }}>
                      <TrendingUpIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {reportData.summary.totalProducts}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Products Sold</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.50' }}>
                      <PeopleIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        {reportData.summary.totalCustomers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Customers</Typography>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Additional Preview Information */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {reportData.module === 'Adoption' ? 'Top Performing Breeds' : 
                 reportData.module === 'Pet Shop' ? 'Top Selling Breeds' : 'Top Selling Products'}
              </Typography>
              <Grid container spacing={2}>
                {(reportData.module === 'Adoption' ? reportData.breedBreakdown : 
                  reportData.module === 'Pet Shop' ? reportData.breedAnalysis : 
                  reportData.productSales)?.slice(0, 3).map((item, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {reportData.module === 'Adoption' ? item.breed : 
                         reportData.module === 'Pet Shop' ? item.breed : item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reportData.module === 'Adoption' 
                          ? `${item.adoptions} adoptions • $${item.totalRevenue}`
                          : reportData.module === 'Pet Shop'
                          ? `${item.itemsPurchased} items • $${item.totalRevenue}`
                          : `${item.quantitySold} sold • $${item.totalRevenue}`
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
              This is a preview of your report. Click "Download PDF" to get the complete professional report with detailed tables and analytics.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  )
}

export default ReportGeneration