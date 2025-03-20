"use client"

import { useState, useEffect } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box, Alert, Button, CircularProgress, Snackbar } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { EditRuleDialog } from "./EditRuleDialog"
import { fetchProviderRules, API_ROUTES } from '@/config/api'
import { BackendProviderType, Requirements } from '@/types/providerTypes'

// Add a consistent order for requirements
const REQUIREMENT_ORDER = [
  "National Provider Identifier",
  "State License",
  "Board Certification",
  "Background Check",
  "Immunization Records",
  "Professional References",
  "Continuing Education",
  "Malpractice Insurance",
  "DEA Registration",
  "Medical Degree",
  "Residency",
  "Work History"
];

// Add mapping for requirement types to UI keys
const REQUIREMENT_TYPE_TO_UI_KEY: { [key: string]: keyof Requirements } = {
  'identifier': 'nationalProviderId',
  'license': 'stateLicense',
  'certification': 'boardCertification',
  'background_check': 'backgroundCheck',
  'immunization': 'immunizationRecords',
  'professional_references': 'professionalReferences',
  'continuing_education': 'continuingEducation',
  'insurance': 'malpracticeInsurance',
  'registration': 'deaRegistration',
  'degree': 'medicalDegree',
  'residency': 'residency',
  'work_history': 'workHistory'
};

export function RuleList() {
  const [providerTypes, setProviderTypes] = useState<BackendProviderType[]>([])
  const [editingProviderType, setEditingProviderType] = useState<BackendProviderType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadProviderTypes = async () => {
    setIsLoading(true)
    try {
      const data = await fetchProviderRules()
      // Convert API data to match frontend structure with all possible requirements
      const convertedData = data.map((pt: any) => ({
        id: pt.id.toString(),
        name: pt.name,
        requirements: {
          nationalProviderId: pt.requirements.some((r: any) => r.requirement_type === 'identifier' && r.is_required),
          stateLicense: pt.requirements.some((r: any) => r.requirement_type === 'license' && r.is_required),
          boardCertification: pt.requirements.some((r: any) => r.requirement_type === 'certification' && r.is_required),
          backgroundCheck: pt.requirements.some((r: any) => r.requirement_type === 'background_check' && r.is_required),
          immunizationRecords: pt.requirements.some((r: any) => r.requirement_type === 'immunization' && r.is_required),
          professionalReferences: pt.requirements.some((r: any) => r.requirement_type === 'professional_references' && r.is_required),
          continuingEducation: pt.requirements.some((r: any) => r.requirement_type === 'continuing_education' && r.is_required),
          malpracticeInsurance: pt.requirements.some((r: any) => r.requirement_type === 'insurance' && r.is_required),
          deaRegistration: pt.requirements.some((r: any) => r.requirement_type === 'registration' && r.is_required),
          medicalDegree: pt.requirements.some((r: any) => r.requirement_type === 'degree' && r.is_required),
          residency: pt.requirements.some((r: any) => r.requirement_type === 'residency' && r.is_required),
          workHistory: pt.requirements.some((r: any) => r.requirement_type === 'work_history' && r.is_required)
        }
      }))
      setProviderTypes(convertedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProviderTypes()
  }, [])

  const deleteProviderType = async (id: string) => {
    try {
      const response = await fetch(`/api/eligibility/rules/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete provider type');
      }

      loadProviderTypes(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  const openEditDialog = (providerType: BackendProviderType) => {
    setEditingProviderType(providerType)
  }

  const closeEditDialog = () => {
    setEditingProviderType(null)
  }

  const saveEditedProviderType = async (updatedProviderType: BackendProviderType) => {
    try {
      // Convert frontend structure back to API structure
      const requestBody = {
        code: updatedProviderType.name.toLowerCase().replace(/\s+/g, '_'),
        name: updatedProviderType.name,
        requirements: [
          {
            requirement_type: "identifier",
            name: "National Provider Identifier",
            description: "Valid NPI number",
            is_required: updatedProviderType.requirements.nationalProviderId,
            validation_rules: {
              must_be_valid: true,
              identifier_type: "npi"
            },
            base_requirement_id: 8
          },
          {
            requirement_type: "license",
            name: "State License",
            description: "Current, unrestricted state license",
            is_required: updatedProviderType.requirements.stateLicense,
            validation_rules: {
              must_be_active: true,
              must_be_unrestricted: true
            },
            base_requirement_id: 1
          },
          {
            requirement_type: "certification",
            name: "Board Certification",
            description: "Board certification",
            is_required: updatedProviderType.requirements.boardCertification,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 2
          },
          {
            requirement_type: "background_check",
            name: "Background Check",
            description: "Completed background check",
            is_required: updatedProviderType.requirements.backgroundCheck,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 3
          },
          {
            requirement_type: "immunization",
            name: "Immunization Records",
            description: "Current immunization records",
            is_required: updatedProviderType.requirements.immunizationRecords,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 4
          },
          {
            requirement_type: "professional_references",
            name: "Professional References",
            description: "Professional references",
            is_required: updatedProviderType.requirements.professionalReferences,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 5
          },
          {
            requirement_type: "continuing_education",
            name: "Continuing Education",
            description: "Required continuing education credits",
            is_required: updatedProviderType.requirements.continuingEducation,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 6
          },
          {
            requirement_type: "insurance",
            name: "Malpractice Insurance",
            description: "Current malpractice insurance",
            is_required: updatedProviderType.requirements.malpracticeInsurance,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 7
          },
          {
            requirement_type: "registration",
            name: "DEA Registration",
            description: "DEA/CDS registration",
            is_required: updatedProviderType.requirements.deaRegistration,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 9
          },
          {
            requirement_type: "degree",
            name: "Medical Degree",
            description: "Educational degree",
            is_required: updatedProviderType.requirements.medicalDegree,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 11
          },
          {
            requirement_type: "residency",
            name: "Residency",
            description: "Completed residency",
            is_required: updatedProviderType.requirements.residency,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 13
          },
          {
            requirement_type: "work_history",
            name: "Work History",
            description: "Verified work history",
            is_required: updatedProviderType.requirements.workHistory,
            validation_rules: {
              must_be_active: true
            },
            base_requirement_id: 14
          }
        ]
      };

      const response = await fetch(`http://localhost:8000/api/eligibility/rules/${updatedProviderType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to update provider type');
      }

      loadProviderTypes(); // Refresh the list
      setSuccessMessage(`Successfully updated ${updatedProviderType.name} provider type`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
    <>
      <Paper elevation={3} sx={{ mt: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadProviderTypes}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {providerTypes.map((type) => (
              <ListItem key={type.id} divider>
                <Box sx={{ flex: 1 }}>
                  <Typography color="primary" variant="subtitle1">
                    {type.name}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(type.requirements)
                      .sort(([keyA], [keyB]) => {
                        // Get the display names for sorting
                        const displayA = keyA.replace(/([A-Z])/g, ' $1').trim();
                        const displayB = keyB.replace(/([A-Z])/g, ' $1').trim();
                        // Use the order array for sorting
                        const indexA = REQUIREMENT_ORDER.indexOf(displayA);
                        const indexB = REQUIREMENT_ORDER.indexOf(displayB);
                        // If both items are in the order array, use their order
                        if (indexA !== -1 && indexB !== -1) {
                          return indexA - indexB;
                        }
                        // If only one item is in the order array, put it first
                        if (indexA !== -1) {
                          return -1;
                        }
                        if (indexB !== -1) {
                          return 1;
                        }
                        // For items not in the order array, sort alphabetically
                        return displayA.localeCompare(displayB);
                      })
                      .map(([key, value]) => (
                        <Grid item key={key}>
                          <Chip
                            label={`${key.replace(/([A-Z])/g, ' $1').trim()}: ${value ? "Required" : "Not Required"}`}
                            color={value ? "success" : "default"}
                            variant="outlined"
                          />
                        </Grid>
                      ))}
                  </Grid>
                </Box>
                <Box>
                  <IconButton edge="end" aria-label="edit" onClick={() => openEditDialog(type)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete" onClick={() => deleteProviderType(type.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {editingProviderType && (
        <EditRuleDialog
          providerType={editingProviderType}
          isOpen={true}
          onClose={closeEditDialog}
          onSave={saveEditedProviderType}
        />
      )}
    </>
  )
}

