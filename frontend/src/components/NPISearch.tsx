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
import { API_ROUTES } from '../config/api'
import { SearchForm } from './SearchForm'
import { RequirementList } from './RequirementList'
import { ProcessedEligibility } from '../types/eligibility'
import { processRequirementDetails, cleanRawApiResponse, validateRequirement } from '../utils/eligibilityProcessor'

// Provider service functions
const fetchProviderData = async (npi: string, token: string | null) => {
  if (!token) throw new Error('Authentication token is required');
  
  const response = await fetch('http://localhost:8000/api/fetch-provider-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ npi }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch provider data');
  }
  
  return response.json();
};

const fetchEligibilityRules = async (token: string | null) => {
  if (!token) throw new Error('Authentication token is required');
  
  const response = await fetch(API_ROUTES.ELIGIBILITY_RULES, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch eligibility rules');
  }
  
  return response.json();
};

const REQUIREMENT_ORDER = [
  "National Provider Identifier",
  "Medical Degree",
  "State License",
  "DEA Registration",
  "Board Certification",
  "Continuing Education",
  "Malpractice Insurance",
  "Background Check",
  "Work History",
  "Immunization Records",
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
    setSearchResult(null);
    setIsSearching(true);
    
    try {
      const token = await getToken();
      const [rawProviderData, eligibilityRules] = await Promise.all([
        fetchProviderData(npi, token),
        fetchEligibilityRules(token)
      ]);

      // Clean the raw API response first
      const providerData = {
        ...rawProviderData,
        rawApiResponse: cleanRawApiResponse(rawProviderData.rawApiResponse)
      };
      
      const providerTypeRules = eligibilityRules.find((rule: any) => 
        rule.name === providerData.requirements.providerType
      );

      if (!providerTypeRules) {
        throw new Error(`No matching provider type found for: ${providerData.requirements.providerType}`);
      }

      // Transform the backend response to match our frontend structure
      const processedResult: ProcessedEligibility = {
        isEligible: true,
        requirements: providerTypeRules.requirements.map((rule: any) => {
          const validation = validateRequirement(rule, providerData);
          return {
            ...rule,
            ...validation
          };
        }),
        rawValidation: {
          npiDetails: {
            providerName: providerData.rawApiResponse['NPI Validation'].providerName,
            npi: providerData.rawApiResponse['NPI Validation'].npi,
            updateDate: providerData.rawApiResponse['NPI Validation'].updateDate,
            providerType: providerData.requirements.providerType,
            licenses: providerData.rawApiResponse['Licenses'],
            entityType: providerData.rawApiResponse['NPI Validation'].entityType,
            enumerationDate: providerData.rawApiResponse['NPI Validation'].enumerationDate
          }
        },
        providerType: providerData.requirements.providerType
      };

      // Update overall eligibility based on required requirements
      processedResult.isEligible = processedResult.requirements.every(
        req => !req.is_required || req.is_valid
      );

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
          
          <Typography variant="h6" sx={{ color: 'text.primary', mt: 2, mb: 1, fontWeight: 'medium' }}>
            Provider: {searchResult.rawValidation.npiDetails.providerName || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
            NPI: {searchResult.rawValidation.npiDetails.npi || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
            Provider Type: {searchResult.providerType || 'N/A'}
          </Typography>

          <RequirementList
            requirements={searchResult.requirements}
            requirementOrder={REQUIREMENT_ORDER}
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
              Last Updated:
            </Typography>
            <Typography variant="body2">
              {searchResult.rawValidation.npiDetails.updateDate || 'N/A'}
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
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
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

