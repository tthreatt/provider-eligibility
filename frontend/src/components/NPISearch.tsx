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
import { API_ROUTES, API_BASE_URL } from '../config/api'
import { SearchForm } from './SearchForm'
import RequirementList from './RequirementList'
import { ProcessedEligibility } from '../types/eligibility'
import { InterpretedLicense } from '../utils/eligibilityProcessor'
import { processRequirementDetails, cleanRawApiResponse, validateRequirement, processEligibilityData, createProviderProfile } from '../utils/eligibilityProcessor'

// Provider service functions
const fetchProviderData = async (npi: string, token: string | null) => {
  if (!token) throw new Error('Authentication token is required');
  
  const response = await fetch(`${API_BASE_URL}/api/fetch-provider-data`, {
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
  const response = await fetch(API_ROUTES.ELIGIBILITY_RULES);
  
  if (!response.ok) {
    throw new Error('Failed to fetch eligibility rules');
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

      // Extract provider type from raw data
      const rawProviderType = rawProviderData.npiDetails?.providerType || 'Allopathic & Osteopathic Physicians';
      
      console.log('Provider type:', {
        raw: rawProviderType,
        normalized: rawProviderType?.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      });

      // Create provider profile from raw data
      const providerProfile = createProviderProfile(rawProviderData);
      
      console.log('Provider Profile:', providerProfile);

      // Transform the backend response to match our frontend structure
      const processedResult: ProcessedEligibility = {
        isEligible: rawProviderData.isEligible,
        requirements: [
          {
            id: 1,
            name: 'National Provider Identifier',
            requirement_type: 'npi',
            type: 'npi',
            description: 'Valid NPI number',
            validation_rules: { required: true },
            base_requirement_id: 1,
            provider_type_id: 1,
            severity: 1,
            is_valid: true,
            status: 'valid',
            is_required: true,
            details: [{
              type: 'NPI',
              number: rawProviderData.rawApiResponse['NPI Validation']?.npi,
              status: 'Active',
              issuer: 'CMS',
              expirationDate: null
            }]
          },
          {
            id: 2,
            name: 'Medical Degree',
            requirement_type: 'degree',
            type: 'degree',
            description: 'MD or DO from accredited institution',
            validation_rules: { required: true },
            base_requirement_id: 2,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.medicalDegree,
            status: rawProviderData.requirements.medicalDegree ? 'valid' : 'required',
            is_required: true,
            details: []
          },
          {
            id: 3,
            name: 'Residency Program',
            requirement_type: 'residency',
            type: 'residency',
            description: 'Completed residency program',
            validation_rules: { required: true },
            base_requirement_id: 3,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.residencyProgram,
            status: rawProviderData.requirements.residencyProgram ? 'valid' : 'required',
            is_required: true,
            details: []
          },
          {
            id: 4,
            name: 'State License',
            requirement_type: 'license',
            type: 'license',
            description: 'Valid state medical license',
            validation_rules: { required: true },
            base_requirement_id: 4,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.stateLicense,
            status: rawProviderData.requirements.stateLicense ? 'valid' : 'required',
            is_required: true,
            details: rawProviderData.rawApiResponse.Licenses
              .filter((l: { category: string }) => l.category === 'STATE_LICENSE')
              .map((l: { type: string; number: string; issuer: string; status: string; expirationDate: string | null }) => ({
                type: l.type,
                number: l.number,
                issuer: l.issuer,
                status: l.status,
                expirationDate: l.expirationDate
              }))
          },
          {
            id: 5,
            name: 'DEA Registration',
            requirement_type: 'registration',
            type: 'registration',
            description: 'Valid DEA registration',
            validation_rules: { required: true },
            base_requirement_id: 5,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.rawApiResponse.Licenses.some((l: License) => 
              l.category === 'CONTROLLED_SUBSTANCE_REGISTRATION' && 
              l.issuer === 'DEA' && 
              l.status === 'Active' &&
              new Date(l.expirationDate) > new Date()
            ),
            status: rawProviderData.rawApiResponse.Licenses.some((l: License) => 
              l.category === 'CONTROLLED_SUBSTANCE_REGISTRATION' && 
              l.issuer === 'DEA' && 
              l.status === 'Active' &&
              new Date(l.expirationDate) > new Date()
            ) ? 'valid' : 'invalid',
            is_required: true,
            details: rawProviderData.rawApiResponse.Licenses
              .filter((l: { category: string; issuer: string }) => l.category === 'CONTROLLED_SUBSTANCE_REGISTRATION' && l.issuer === 'DEA')
              .map((l: { type: string; number: string; issuer: string; status: string; expirationDate: string | null; additionalInfo?: any }) => ({
                type: l.type,
                number: l.number,
                issuer: l.issuer,
                status: l.status,
                expirationDate: l.expirationDate,
                additionalInfo: l.additionalInfo
              }))
          },
          {
            id: 6,
            name: 'Board Certification',
            requirement_type: 'certification',
            type: 'certification',
            description: 'Valid medical board certification',
            validation_rules: { required: true },
            base_requirement_id: 6,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.rawApiResponse.Licenses.some((l: License) => 
              l.category === 'BOARD_CERTIFICATION' && 
              l.issuer?.includes('ABMS') && 
              l.status === 'Active' &&
              new Date(l.expirationDate) > new Date()
            ),
            status: rawProviderData.rawApiResponse.Licenses.some((l: License) => 
              l.category === 'BOARD_CERTIFICATION' && 
              l.issuer?.includes('ABMS') && 
              l.status === 'Active' &&
              new Date(l.expirationDate) > new Date()
            ) ? 'valid' : 'invalid',
            is_required: true,
            details: rawProviderData.rawApiResponse.Licenses
              .filter((l: { category: string }) => l.category === 'BOARD_CERTIFICATION')
              .map((l: { type: string; number: string; issuer: string; status: string; expirationDate: string | null }) => ({
                type: l.type,
                number: l.number,
                issuer: l.issuer,
                status: l.status,
                expirationDate: l.expirationDate
              }))
          },
          {
            id: 7,
            name: 'Malpractice Insurance',
            requirement_type: 'insurance',
            type: 'insurance',
            description: 'Active malpractice insurance',
            validation_rules: { required: true },
            base_requirement_id: 7,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.malpracticeInsurance,
            status: rawProviderData.requirements.malpracticeInsurance ? 'valid' : 'required',
            is_required: true,
            details: []
          },
          {
            id: 8,
            name: 'Background Check',
            requirement_type: 'background_check',
            type: 'background_check',
            description: 'Completed background check',
            validation_rules: { required: true },
            base_requirement_id: 8,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.backgroundCheck,
            status: rawProviderData.requirements.backgroundCheck ? 'valid' : 'required',
            is_required: true,
            details: []
          },
          {
            id: 9,
            name: 'Work History',
            requirement_type: 'work_history',
            type: 'work_history',
            description: 'Verified work history',
            validation_rules: { required: true },
            base_requirement_id: 9,
            provider_type_id: 1,
            severity: 1,
            is_valid: rawProviderData.requirements.workHistory,
            status: rawProviderData.requirements.workHistory ? 'valid' : 'required',
            is_required: true,
            details: []
          }
        ],
        rawValidation: {
          rawApiResponse: rawProviderData.rawApiResponse
        },
        providerType: rawProviderData.requirements.providerType
      };

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
              Provider: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.providerName || 'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              NPI: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.npi || 'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Provider Type: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.licenses?.[0]?.code?.split(' - ')?.[1] || 'N/A'}
            </Typography>
            
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Entity Type: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.entityType || 'N/A'}
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
                {searchResult.rawValidation.rawApiResponse['NPI Validation']?.mailingAddress || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Phone: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.mailingPhone || 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Practice Address:</Typography>
              <Typography variant="body2">
                {searchResult.rawValidation.rawApiResponse['NPI Validation']?.practiceAddress || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Phone: {searchResult.rawValidation.rawApiResponse['NPI Validation']?.practicePhone || 'N/A'}
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

