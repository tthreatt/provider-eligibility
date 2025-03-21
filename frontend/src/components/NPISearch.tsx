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
  Chip,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import WarningIcon from "@mui/icons-material/Warning"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import SearchIcon from "@mui/icons-material/Search"
import { API_ROUTES } from '../config/api';

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

// Define interfaces for type safety
interface License {
  category: string;
  number?: string;
  state?: string;
  status?: string;
  type?: string;
  issuer?: string;
  expirationDate?: string;
  hasBoardAction?: boolean;
  boardActionDetails?: string;
  boardActionData?: {
    boardActionTexts?: string[];
  };
}

interface NPIValidation {
  providerName: string;
  npi: string;
  updateDate: string;
  providerType?: string;
  licenses?: License[];
  entityType?: string;
  enumerationDate?: string;
}

interface Requirement {
  id: number;
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  is_valid: boolean;
  validation_message?: string;
  validation_rules: Record<string, any>;
  details?: {
    issuer?: string;
    number?: string;
    expirationDate?: string;
    status?: string;
    boardActions?: string[];
  };
}

interface ProcessedResult {
  isEligible: boolean;
  requirements: Requirement[];
  rawValidation: {
    npiDetails: NPIValidation;
  };
  providerType?: string;
}

interface NPISearchProps {
  loading?: boolean;
}

export function NPISearch({ loading = false }: NPISearchProps) {
  const [npi, setNpi] = useState("")
  const [searchResult, setSearchResult] = useState<ProcessedResult | null>(null)
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
      
      // First get provider data
      const providerResponse = await fetch('http://localhost:8000/api/fetch-provider-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ npi }),
      });

      if (!providerResponse.ok) {
        throw new Error('Failed to fetch provider data');
      }

      const providerData = await providerResponse.json();
      
      // Then get eligibility rules
      const rulesResponse = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!rulesResponse.ok) {
        throw new Error('Failed to fetch eligibility rules');
      }

      const allRules = await rulesResponse.json();
      
      // Find matching provider type rules using the provider type from requirements
      const providerTypeRules = allRules.find((rule: any) => 
        rule.name === providerData.requirements.providerType
      );

      if (!providerTypeRules) {
        throw new Error(`No matching provider type found for: ${providerData.requirements.providerType}`);
      }

      // Transform the backend response to match our frontend structure
      const processedResult: ProcessedResult = {
        isEligible: true, // Will be updated based on requirements
        requirements: providerTypeRules.requirements.map((rule: any) => {
          let isValid = false;
          let validationMessage = '';
          let details = undefined;

          // Find matching license based on requirement type
          const matchingLicense = providerData.rawApiResponse['Licenses']?.find((license: License) => {
            switch (rule.requirement_type) {
              case 'registration':
                return license.category === 'controlled_substance_registration';
              case 'license':
                return license.category === 'state_license';
              default:
                return false;
            }
          });

          switch (rule.requirement_type) {
            case 'identifier':
              isValid = Boolean(providerData.rawApiResponse['NPI Validation']?.npi);
              validationMessage = isValid ? 'Valid NPI found' : 'No valid NPI found';
              if (isValid) {
                details = {
                  number: providerData.rawApiResponse['NPI Validation'].npi,
                };
              }
              break;
            case 'license':
            case 'registration':
              isValid = Boolean(matchingLicense?.status?.toLowerCase() === 'active');
              validationMessage = isValid 
                ? `Valid ${rule.name} found`
                : `No valid ${rule.name} found`;
              if (matchingLicense) {
                details = {
                  issuer: matchingLicense.issuer || matchingLicense.state,
                  number: matchingLicense.number,
                  status: matchingLicense.status,
                  expirationDate: matchingLicense.expirationDate,
                  boardActions: matchingLicense.hasBoardAction 
                    ? matchingLicense.boardActionData?.boardActionTexts 
                    : undefined
                };
              }
              break;
            case 'background_check':
              isValid = false; // No background check data available
              validationMessage = 'No background check verification found';
              break;
            case 'insurance':
              isValid = false; // No malpractice insurance data available
              validationMessage = 'No malpractice insurance verification found';
              break;
            case 'certification':
              isValid = false; // No board certification data available
              validationMessage = 'No board certification verification found';
              break;
            case 'degree':
              isValid = false; // No medical degree data available
              validationMessage = 'No medical degree verification found';
              break;
            default:
              isValid = false;
              validationMessage = `No ${rule.name.toLowerCase()} verification found`;
          }

          return {
            ...rule,
            is_valid: isValid,
            validation_message: validationMessage,
            details
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

  // Debug logging effect
  useEffect(() => {
    if (searchResult?.rawValidation?.npiDetails) {
      console.group('Provider Data Structure');
      console.log('NPI Validation:', searchResult.rawValidation.npiDetails);
      console.log('NPI Validation Licenses:', searchResult.rawValidation.npiDetails.licenses);
      console.groupEnd();

      console.group('Requirements');
      searchResult.requirements.forEach(requirement => {
        console.log(`${requirement.name}:`, {
          type: requirement.requirement_type,
          isValid: requirement.is_valid,
          message: requirement.validation_message
        });
      });
      console.groupEnd();
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
              minWidth: { xs: '48px', sm: '150px' },
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              height: '56px',
              px: { xs: 2, sm: 4 },
              borderRadius: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <SearchIcon sx={{ mr: { xs: 0, sm: 1 }, fontSize: { xs: '1.2rem', sm: '1.4rem' } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Check Eligibility
                </Box>
              </>
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
          
          <Typography variant="h6" sx={{ color: 'text.primary', mt: 2, mb: 1, fontWeight: 'medium' }}>
            Provider: {searchResult.rawValidation.npiDetails.providerName || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
            NPI: {searchResult.rawValidation.npiDetails.npi || 'N/A'}
          </Typography>
          
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 1 }}>
            Provider Type: {searchResult.rawValidation.npiDetails.providerType || 'N/A'}
          </Typography>

          <List sx={{ width: '100%' }}>
            {searchResult.requirements
              .sort((a, b) => {
                const aIndex = REQUIREMENT_ORDER.indexOf(a.name);
                const bIndex = REQUIREMENT_ORDER.indexOf(b.name);
                // If both requirements are in the order list, sort by their position
                if (aIndex !== -1 && bIndex !== -1) {
                  return aIndex - bIndex;
                }
                // If only one requirement is in the list, put it first
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                // If neither requirement is in the list, maintain their original order
                return 0;
              })
              .map((requirement) => (
              <ListItem key={requirement.id} sx={{ px: 0 }}>
                <ListItemIcon>
                  {requirement.is_valid ? (
                    <CheckIcon sx={{ color: 'success.main' }} />
                  ) : (
                    <CloseIcon sx={{ color: requirement.is_required ? 'error.main' : 'warning.main' }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {requirement.name}
                      {requirement.details?.boardActions && (
                        <Chip
                          icon={<WarningIcon />}
                          label="Board Actions"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="div">
                      <Typography component="div" variant="body2">
                        {requirement.description}
                      </Typography>
                      {requirement.validation_message && (
                        <Typography 
                          component="div"
                          variant="body2"
                          sx={{ 
                            color: requirement.is_valid ? 'success.main' : 'error.main',
                            mt: 0.5 
                          }}
                        >
                          {requirement.validation_message}
                        </Typography>
                      )}
                      {requirement.is_valid && requirement.details && (
                        <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                          {requirement.details.issuer && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Issuer:</strong> {requirement.details.issuer}
                            </Typography>
                          )}
                          {requirement.details.number && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Number:</strong> {requirement.details.number}
                            </Typography>
                          )}
                          {requirement.details.expirationDate && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Expiration Date:</strong> {formatExpirationDate(requirement.details.expirationDate)}
                            </Typography>
                          )}
                          {requirement.details.status && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Status:</strong> {requirement.details.status}
                            </Typography>
                          )}
                          {requirement.details.boardActions && (
                            <Accordion sx={{ mt: 1 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography color="warning.main">
                                  Board Actions Found
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <List dense>
                                  {requirement.details.boardActions.map((action, index) => (
                                    <ListItem key={index}>
                                      <ListItemIcon>
                                        <WarningIcon color="warning" />
                                      </ListItemIcon>
                                      <ListItemText primary={action} />
                                    </ListItem>
                                  ))}
                                </List>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </Box>
                      )}
                    </Box>
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

