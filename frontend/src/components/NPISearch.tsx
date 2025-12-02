"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import {
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { SearchForm } from './SearchForm'
import RequirementList from './RequirementList'
import { ProcessedEligibility } from '../types/eligibility'
import { processEligibilityData } from '../utils/eligibilityProcessor'

// Provider service functions
const fetchProviderData = async (npi: string, token: string | null) => {
  // Use Next.js API route instead of calling backend directly
  const response = await fetch('/api/fetch-provider-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ npi }),
    credentials: 'include', // Include cookies for Clerk auth
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch provider data');
  }
  
  return response.json();
};

const fetchEligibilityRules = async (token: string | null) => {
  // Use Next.js API route instead of calling backend directly
  const response = await fetch('/api/eligibility/rules', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for Clerk auth
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch eligibility rules');
  }
  
  return response.json();
};

const REQUIREMENT_ORDER = [
  "National Provider Identifier",
  "Medical Degree",
  "Residency Program",
  "State License",
  "DEA Registration",
  "Board Certification",
  "Malpractice Insurance",
  "Background Check",
  "Work History",
  "Professional References"
];

interface NPISearchProps {
  loading?: boolean;
}

export function NPISearch({ loading = false }: NPISearchProps) {
  const [npi, setNpi] = useState("")
  const [searchResult, setSearchResult] = useState<ProcessedEligibility | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const { getToken } = useAuth()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSearching(true);
    
    try {
      const token = await getToken();
      
      // First fetch provider data
      const rawProviderData = await fetchProviderData(npi, token);
      
      // Then fetch eligibility rules
      const eligibilityRules = await fetchEligibilityRules(token);

      console.log('Raw provider data:', rawProviderData);
      console.log('Eligibility rules:', eligibilityRules);

      // Use processEligibilityData to properly structure the data
      const processedResult = processEligibilityData(rawProviderData);

      setSearchResult(processedResult);

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    if (searchResult?.rawValidation?.npiDetails) {
      console.group('Provider Data Structure');
      console.log('NPI Validation:', searchResult.rawValidation.npiDetails);
      console.log('NPI Validation Licenses:', searchResult.rawValidation.npiDetails.licenses);
      console.groupEnd();
    }
  }, [searchResult]);
  }

  return (
    <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
      <SearchForm
        onSubmit={handleSearch}
        npi={npi}
        setNpi={setNpi}
        loading={loading || isSearching}
      />

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
          
          {/* Provider Basic Info */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'medium' }}>
              Provider: {searchResult.rawValidation.npiDetails?.providerName || 
                         searchResult.rawValidation.providerName || 
                         searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.providerName || 
                         'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              NPI: {searchResult.rawValidation.npiDetails?.npi || 
                    searchResult.rawValidation.npi || 
                    searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.npi || 
                    'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Provider Type: {searchResult.rawValidation.npiDetails?.providerType || 
                              searchResult.rawValidation.providerType || 
                              searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.licenses?.[0]?.code?.split(' - ')?.[1] || 
                              'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Entity Type: {searchResult.rawValidation.npiDetails?.entityType || 
                            searchResult.rawValidation.entityType || 
                            searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.entityType || 
                            'N/A'}
            </Typography>
          </Box>

          {/* License Requirements */}
          <RequirementList
            requirements={searchResult.requirements}
            requirementOrder={REQUIREMENT_ORDER}
          />

          {/* Contact Information */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Contact Information</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Mailing Address:</Typography>
              <Typography variant="body2">
                {searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.mailingAddress || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Phone: {searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.mailingPhone || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Practice Address:</Typography>
              <Typography variant="body2">
                {searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.practiceAddress || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Phone: {searchResult.rawValidation.rawApiResponse?.['NPI Validation']?.practicePhone || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Verification Status */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Verification Status</Typography>
            <Typography variant="body2" color={searchResult.rawValidation.rawApiResponse?.Exclusions?.length ? 'error.main' : 'success.main'}>
              Exclusions: {searchResult.rawValidation.rawApiResponse?.Exclusions?.length ? 'Found' : 'None'}
            </Typography>
            <Typography variant="body2" color={searchResult.rawValidation.rawApiResponse?.['CMS Preclusion List']?.length ? 'error.main' : 'success.main'}>
              Preclusions: {searchResult.rawValidation.rawApiResponse?.['CMS Preclusion List']?.length ? 'Found' : 'None'}
            </Typography>
            <Typography variant="body2" color={Object.keys(searchResult.rawValidation.rawApiResponse?.['Opt Out'] || {}).length ? 'error.main' : 'success.main'}>
              Opt Out: {Object.keys(searchResult.rawValidation.rawApiResponse?.['Opt Out'] || {}).length ? 'Yes' : 'No'}
            </Typography>
          </Box>

          {/* Last Updated */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Last Updated:
            </Typography>
            <Typography variant="body2">
              {searchResult.rawValidation.npiDetails?.updateDate || 'N/A'}
            </Typography>
          </Box>
        </Alert>
      )}

      {searchResult?.rawValidation && (
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
                overflow: 'auto',
                '& pre': {
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  overflowY: 'auto'
                }
              }}
            >
              <pre>
                {JSON.stringify(searchResult.rawValidation, null, 2)}
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

