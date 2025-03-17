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
// import { License, NPIValidationResponse } from '../types/providerTypes'

// First, add the License interface since we removed the import
interface License {
  [key: string]: string | undefined;
  category?: string;
  status?: string;
  number?: string;
  type?: string;
  issuer?: string;
  expirationDate?: string;
}

interface Requirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  is_valid: boolean;
  validation_message?: string;
  validation_rules: Record<string, any>;
  license_match?: License;
}

interface EligibilityResponse {
  isEligible: boolean;
  requirements: Requirement[];
  rawApiResponse: {
    'NPI Validation': {
      providerName: string;
      npi: string;
      updateDate: string;
      providerType?: string;
    };
    Licenses: License[];
  };
}

// Update NPISearchProps to match what we're actually using
interface NPISearchProps {
  loading: boolean;
}

export function NPISearch({ loading }: NPISearchProps) {
  const [npi, setNpi] = useState("")
  const [searchResult, setSearchResult] = useState<EligibilityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { getToken } = useAuth()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSearchResult(null);
    
    try {
      const token = await getToken();

      // Fetch both provider data and rules concurrently
      const [providerResponse, rulesResponse] = await Promise.all([
        fetch('/api/fetch-provider-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ npi }),
        }),
        fetch('/api/eligibility/rules', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (!providerResponse.ok || !rulesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const providerData = await providerResponse.json();
      const rules = await rulesResponse.json();

      // Debug logging
      console.log('Raw Provider Data:', providerData);
      console.log('Raw Rules:', rules);

      // Get provider details from NPI Validation - fix nested structure
      const npiValidation = providerData.rawApiResponse.rawApiResponse['NPI Validation'];
      const licenses = providerData.rawApiResponse.rawApiResponse.Licenses;

      console.log('NPI Validation:', npiValidation);
      console.log('Provider Type:', npiValidation?.providerType);
      console.log('Licenses:', licenses);

      // Find matching rules for this provider type
      const providerTypeRules = rules.find((rule: any) => 
        rule.provider_type === npiValidation?.providerType
      );

      console.log('Matching Provider Rules:', providerTypeRules);

      if (!providerTypeRules) {
        throw new Error(`No rules found for provider type: ${npiValidation?.providerType}`);
      }

      // Process requirements for the specific provider type
      const processedRequirements = providerTypeRules.requirements.map((rule: Requirement) => {
        const requirement = { ...rule };
        
        // Match licenses based on requirement type
        let matchingLicenses;
        if (rule.name === "National Provider Identifier") {
          const npiNumber = npiValidation?.npi;
          requirement.is_valid = Boolean(npiNumber);
          requirement.validation_message = npiNumber 
            ? `Valid NPI found: ${npiNumber}`
            : 'No valid NPI found';
          return requirement;
        }
        
        switch (rule.requirement_type) {
          case 'license':
            matchingLicenses = licenses?.filter((license: License) => 
              license.category === 'state_license' && 
              license.status?.toLowerCase() === 'active'
            );
            break;
          case 'registration':
            matchingLicenses = licenses?.filter((license: License) => 
              license.category === 'controlled_substance_registration' && 
              license.status?.toLowerCase() === 'active'
            );
            break;
          case 'certification':
            if (rule.name === 'Board Certification') {
              matchingLicenses = licenses?.filter((license: License) => 
                license.category === 'board_certification' && 
                license.status?.toLowerCase() === 'active'
              );
            }
            break;
          default:
            // Handle other requirement types (background_check, immunization, etc.)
            matchingLicenses = [];
        }

        console.log(`Matching licenses for ${rule.name}:`, matchingLicenses);

        // Update requirement with validation results
        requirement.is_valid = matchingLicenses && matchingLicenses.length > 0;
        requirement.license_match = matchingLicenses?.[0];
        requirement.validation_message = requirement.is_valid
          ? `Valid ${rule.name} found: ${matchingLicenses[0].number}`
          : `No valid ${rule.name} found`;

        return requirement;
      });

      // Calculate overall eligibility
      const isEligible = processedRequirements.every((req: Requirement) => 
        !req.is_required || req.is_valid
      );

      setSearchResult({
        isEligible,
        requirements: processedRequirements,
        rawApiResponse: providerData.rawApiResponse.rawApiResponse // Fix: Access the deeply nested rawApiResponse
      });

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    if (searchResult) {
      console.log('Rendering searchResult:', {
        isEligible: searchResult.isEligible,
        providerName: searchResult.rawApiResponse['NPI Validation']?.providerName,
        npi: searchResult.rawApiResponse['NPI Validation']?.npi,
        requirements: searchResult.requirements,
        licenses: searchResult.rawApiResponse.Licenses
      });

      // Debug each requirement
      searchResult.requirements.forEach(requirement => {
        console.log(`${requirement.name} Status:`, {
          type: requirement.requirement_type,
          isValid: requirement.is_valid,
          isRequired: requirement.is_required,
          validationMessage: requirement.validation_message,
          rules: requirement.validation_rules
        });
      });

      // Still keep license debugging for reference
      console.log('All Active Licenses:', searchResult.rawApiResponse.Licenses?.filter(l => 
        l.status?.toLowerCase() === 'active'
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
            Provider: {searchResult.rawApiResponse['NPI Validation']?.providerName || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 3 }}>
            NPI: {searchResult.rawApiResponse['NPI Validation']?.npi || 'N/A'}
          </Typography>

          <List sx={{ width: '100%' }}>
            {searchResult.requirements
              .sort((a, b) => {
                const order = [
                  "National Provider Identifier",
                  "Medical Degree",
                  "State License",
                  "DEA Registration",
                  "Board Certification",
                  "Continuing Education",
                  "Background Check",
                  "Malpractice Insurance",
                  "Immunization Records",
                  "CPR Certification",
                  "Professional References"
                ];
                return order.indexOf(a.name) - order.indexOf(b.name);
              })
              .map((requirement) => (
                <ListItem key={requirement.name} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {requirement.is_valid ? (
                      <CheckIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <CloseIcon sx={{ color: requirement.is_required ? 'error.main' : 'warning.main' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={requirement.name}
                    secondary={
                      <>
                        <Typography component="span" display="block" variant="body2">
                          {requirement.description}
                        </Typography>
                        {requirement.validation_message && (
                          <Typography 
                            component="span" 
                            display="block"
                            sx={{ 
                              color: requirement.is_valid ? 'success.main' : 'error.main',
                              mt: 0.5 
                            }}
                          >
                            {requirement.validation_message}
                          </Typography>
                        )}
                        {requirement.is_valid && requirement.license_match && 
                         (requirement.name === "State License" || 
                          requirement.name === "DEA Registration" || 
                          requirement.name === "Board Certification") && (
                          <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Issuer:</strong> {requirement.license_match.issuer || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Type:</strong> {requirement.license_match.type || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Number:</strong> {requirement.license_match.number || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Expiration Date:</strong> {formatExpirationDate(requirement.license_match.expirationDate)}
                            </Typography>
                          </Box>
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
              {searchResult.rawApiResponse['NPI Validation']?.updateDate || 'N/A'}
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

