"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SearchIcon from "@mui/icons-material/Search"

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
      updateDate: string
      licenses: Array<{
        code: string
        number: string
        state: string
      }>
    }
    Licenses: Array<{
      category: string
      status: string
      type?: string
      issuer?: string
      number: string
      state: string
      expirationDate?: string
      firstName?: string
      lastName?: string
      middleName?: string
      source?: string
    }>
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

  useEffect(() => {
    if (searchResult) {
      console.log('Full search result:', searchResult);
      console.log('Raw API Response:', searchResult.rawApiResponse?.rawApiResponse);
      console.log('NPI Validation:', searchResult.rawApiResponse?.rawApiResponse?.['NPI Validation']);
      console.log('Requirements:', searchResult.requirements);
    }
  }, [searchResult]);

  return (
    <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
      <form onSubmit={handleSearch}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Provider NPI*"
            value={npi}
            onChange={(e) => setNpi(e.target.value)}
            disabled={loading}
            inputProps={{
              style: { fontSize: '1.2rem' }
            }}
          />
          
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !npi}
            sx={{
              minWidth: '150px',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              fontSize: '0.9rem',
              py: 1.5,
              px: 3
            }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              <><SearchIcon sx={{ mr: 1 }} /> Check Eligibility</>
            )}
          </Button>
        </Box>
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
            Provider: {searchResult?.rawApiResponse?.rawApiResponse?.['NPI Validation']?.providerName || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
            NPI: {searchResult?.rawApiResponse?.rawApiResponse?.['NPI Validation']?.npi || 'N/A'}
          </Typography>
          
          <Typography variant="h6" sx={{ color: 'text.primary', mb: 2, fontWeight: 'medium' }}>
            Provider Type: {searchResult?.requirements?.providerType || 'N/A'}
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
                secondary={searchResult.rawApiResponse?.rawApiResponse?.Licenses
                  ?.filter(license => 
                    license.category?.toLowerCase() === 'state_license' && 
                    license.status?.toLowerCase() === 'active'
                  )
                  .map(license => 
                    `${license.issuer}: ${license.number} (Expires: ${new Date(license.expirationDate).toLocaleDateString()})`
                  )
                  .join(', ') || 'No active licenses found'}
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
                secondary={searchResult.rawApiResponse?.rawApiResponse?.Licenses
                  ?.filter(license => 
                    license.category?.toLowerCase() === 'controlled_substance_registration' && 
                    license.status?.toLowerCase() === 'active'
                  )
                  .map(license => 
                    `${license.number} (Expires: ${new Date(license.expirationDate).toLocaleDateString()})`
                  )
                  .join(', ') || 'No active licenses found'}
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
                secondary={searchResult.rawApiResponse?.rawApiResponse?.Licenses
                  ?.filter(license => 
                    license.category?.toLowerCase() === 'board_certification' && 
                    license.status?.toLowerCase() === 'active'
                  )
                  .map(license => 
                    `${license.type} (Expires: ${new Date(license.expirationDate).toLocaleDateString()})`
                  )
                  .join(', ') || 'No active certifications found'}
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
              {searchResult?.rawApiResponse?.rawApiResponse?.['NPI Validation']?.updateDate || 'N/A'}
            </Typography>
          </Box>
        </Alert>
      )}

      {searchResult?.rawApiResponse && (
        <Accordion sx={{ mt: 4 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="raw-response-content"
            id="raw-response-header"
          >
            <Typography variant="h6">Raw API Response</Typography>
          </AccordionSummary>
          <AccordionDetails>
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
          </AccordionDetails>
        </Accordion>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  )
}

