"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  AlertTitle,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"

// Update interface to match the new API response
interface SearchResult {
  isEligible: boolean
  requirements: {
    stateLicense: boolean
    deaCds: boolean
    boardCertification: boolean
    providerType: string
  }
  rawApiResponse: {
    'NPI Validation': {
      providerName: string
      npi: string
      licenses: Array<{
        code: string
        number: string
        state: string
        switch: string
      }>
      practiceAddress: string
      mailingAddress: string
      updateDate: string
    }
  }
}

interface NPISearchProps {
  onSearch: (npi: string) => Promise<SearchResult>
  loading: boolean
}

export function NPISearch({ onSearch, loading }: NPISearchProps) {
  const [npi, setNpi] = useState("")
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { getToken } = useAuth()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSearchResult(null)
    
    try {
      console.log('Starting search for NPI:', npi)
      const token = await getToken()
      
      const response = await fetch('/api/fetch-provider-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ npi }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch provider data')
      }

      const result = await response.json()
      console.log('Search result received:', result)
      setSearchResult(result)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during search')
    }
  }

  return (
    <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Check Provider Eligibility
      </Typography>
      
      <form onSubmit={handleSearch}>
        <TextField
          fullWidth
          label="Provider NPI*"
          value={npi}
          onChange={(e) => setNpi(e.target.value)}
          disabled={loading}
          sx={{ mb: 3 }}
          inputProps={{
            style: { fontSize: '1.2rem' }
          }}
        />
        
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !npi}
          fullWidth
          size="large"
          sx={{
            mb: 3,
            py: 1.5,
            bgcolor: 'primary.main',
            color: 'white',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          {loading ? <CircularProgress size={24} /> : "CHECK ELIGIBILITY"}
        </Button>
      </form>

      {searchResult && !error && (
        <Alert
          severity={searchResult.isEligible ? "success" : "error"}
          icon={searchResult.isEligible ? <CheckCircleIcon /> : <CancelIcon />}
          sx={{
            mt: 3,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <AlertTitle sx={{ fontSize: '1.2rem', fontWeight: 'medium' }}>
            {searchResult.isEligible ? "Provider is Eligible" : "Provider is Not Eligible"}
          </AlertTitle>
          
          <Typography variant="h6" sx={{ color: 'text.primary', mt: 2, fontWeight: 'medium' }}>
            Provider: {searchResult.rawApiResponse['NPI Validation'].providerName}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
            NPI: {searchResult.rawApiResponse['NPI Validation'].npi}
          </Typography>
          
          <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'medium' }}>
            Provider Type: {searchResult.requirements.providerType}
          </Typography>

          <List sx={{ width: '100%' }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                {searchResult.requirements.stateLicense ? (
                  <CheckIcon sx={{ color: 'success.main' }} />
                ) : (
                  <CloseIcon sx={{ color: 'error.main' }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="State License"
                secondary={searchResult.rawApiResponse['Licenses'].map(license => 
                  `${license.state}: ${license.number}`).join(', ')}
                primaryTypographyProps={{
                  sx: { fontSize: '1.1rem' }
                }}
              />
            </ListItem>
            
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                {searchResult.requirements.deaCds ? (
                  <CheckIcon sx={{ color: 'success.main' }} />
                ) : (
                  <CloseIcon sx={{ color: 'error.main' }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="DEA/CDS"
                primaryTypographyProps={{
                  sx: { fontSize: '1.1rem' }
                }}
              />
            </ListItem>
            
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                {searchResult.requirements.boardCertification ? (
                  <CheckIcon sx={{ color: 'success.main' }} />
                ) : (
                  <CloseIcon sx={{ color: 'error.main' }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Board Certification"
                primaryTypographyProps={{
                  sx: { fontSize: '1.1rem' }
                }}
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Last Updated:
            </Typography>
            <Typography variant="body2">
              {searchResult.rawApiResponse['NPI Validation'].updateDate}
            </Typography>
          </Box>
        </Alert>
      )}

      {searchResult?.rawApiResponse && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Raw API Response:
          </Typography>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {JSON.stringify(searchResult.rawApiResponse, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}

