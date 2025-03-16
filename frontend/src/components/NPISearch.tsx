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
  Chip
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SearchIcon from "@mui/icons-material/Search"

interface ValidationRule {
  must_be_active?: boolean;
  must_be_accredited?: boolean;
  must_be_unrestricted?: boolean;
  must_be_completed?: boolean;
  must_be_valid?: boolean;
  must_be_current?: boolean;
  must_be_verified?: boolean;
  verification_period_years?: number;
  minimum_references?: number;
  degree_types?: string[];
  license_type?: string;
  certification_type?: string;
  registration_type?: string;
  insurance_type?: string;
  identifier_type?: string;
}

interface Requirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  is_valid: boolean;
  validation_rules: ValidationRule;
  validation_message?: string;
}

interface License {
  category?: string;
  status?: string;
  number?: string;
  type?: string;
  issuer?: string;
  expirationDate?: string;
}

interface ProviderType {
  id: number;
  code: string;
  name: string;
  requirements: Requirement[];
}

interface SearchResult {
  isEligible: boolean;
  provider_type: ProviderType;
  requirements: Requirement[];
  rawApiResponse: {
    rawApiResponse: {
      'NPI Validation': {
        providerName: string;
        npi: string;
        updateDate: string;
      };
      Licenses: License[];
    };
  };
}

interface NPISearchProps {
  onSearch: (npi: string) => Promise<any>;
  loading: boolean;
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
      console.log('Raw API Response:', result);
      setSearchResult(result)
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during search')
    }
  }

  useEffect(() => {
    if (searchResult) {
      // Debug the full data structure
      console.log('Rendering searchResult:', {
        isEligible: searchResult.isEligible,
        providerName: searchResult.rawApiResponse?.rawApiResponse?.['NPI Validation']?.providerName,
        npi: searchResult.rawApiResponse?.rawApiResponse?.['NPI Validation']?.npi,
        licenses: searchResult.rawApiResponse?.rawApiResponse?.Licenses,
        requirements: searchResult.requirements
      });

      // Debug the filtered licenses
      console.log('Active State Licenses:', searchResult.rawApiResponse?.rawApiResponse?.Licenses?.filter(l => 
        l.category?.toLowerCase() === 'state_license' && l.status?.toLowerCase() === 'active'
      ));
      
      console.log('Active DEA/CDS:', searchResult.rawApiResponse?.rawApiResponse?.Licenses?.filter(l => 
        l.category?.toLowerCase() === 'controlled_substance_registration' && l.status?.toLowerCase() === 'active'
      ));
      
      console.log('Active Board Certs:', searchResult.rawApiResponse?.rawApiResponse?.Licenses?.filter(l => 
        l.category?.toLowerCase() === 'board_certification' && l.status?.toLowerCase() === 'active'
      ));
    }
  }, [searchResult]);

  const formatExpirationDate = (date: string | undefined) => {
    if (!date) return 'No expiration date';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const isValidDate = (date: string | undefined) => {
    if (!date) return false;
    try {
      new Date(date);
      return true;
    } catch {
      return false;
    }
  };

  const renderLicenses = (license: License) => {
    // ... existing code ...
  }

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
            Provider Type: {searchResult.provider_type?.name || 'N/A'}
          </Typography>

          <List>
            {searchResult.requirements.map((req) => (
              <ListItem key={req.name}>
                <ListItemIcon>
                  {req.is_valid ? (
                    <CheckIcon sx={{ color: 'success.main' }} />
                  ) : (
                    <CloseIcon sx={{ color: req.is_required ? 'error.main' : 'warning.main' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={req.name}
                  secondary={
                    <>
                      {req.description}
                      {req.validation_message && (
                        <Typography color={req.is_valid ? 'success.main' : 'error.main'}>
                          {req.validation_message}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
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

