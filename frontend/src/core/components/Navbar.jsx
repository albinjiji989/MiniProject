import React from 'react'
import { AppBar, Toolbar, Typography } from '@mui/material'

const Navbar = () => (
  <AppBar position="static" color="default" elevation={0}>
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Pet Welfare
      </Typography>
    </Toolbar>
  </AppBar>
)

export default Navbar


