"use client"

import { useState, useEffect } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box, Alert, Button, CircularProgress } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import type { ProviderType } from "@/types/defaultProviderTypes"
import { EditRuleDialog } from "./EditRuleDialog"
import { fetchProviderRules, API_ROUTES } from '@/config/api'

// Add these interfaces to match the backend structure
interface ValidationRule {
  must_be_active?: boolean;
  must_be_unrestricted?: boolean;
  license_type?: string;
}

interface ApiRequirement {
  requirement_type: string;
  name: string;
  description: string;
  is_required: boolean;
  validation_rules: ValidationRule;
}

interface ApiProviderType {
  id: number;
  code: string;
  name: string;
  requirements: ApiRequirement[];
}

export function RuleList() {
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([])
  const [editingProviderType, setEditingProviderType] = useState<ProviderType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProviderTypes = async () => {
    setIsLoading(true)
    try {
      const data = await fetchProviderRules()
      // Convert API data to match frontend structure
      const convertedData = data.map((pt: any) => ({
        id: pt.id.toString(),
        name: pt.name,
        requirements: {
          stateLicense: pt.requirements.some((r: any) => r.requirement_type === 'license' && r.is_required),
          deaCds: pt.requirements.some((r: any) => r.requirement_type === 'registration' && r.is_required),
          boardCertification: pt.requirements.some((r: any) => r.requirement_type === 'certification' && r.is_required),
          degree: pt.requirements.some((r: any) => r.requirement_type === 'degree' && r.is_required),
          residency: pt.requirements.some((r: any) => r.requirement_type === 'residency' && r.is_required),
          malpracticeInsurance: pt.requirements.some((r: any) => r.requirement_type === 'insurance' && r.is_required),
          backgroundCheck: pt.requirements.some((r: any) => r.requirement_type === 'background_check' && r.is_required),
          workHistory: pt.requirements.some((r: any) => r.requirement_type === 'work_history' && r.is_required),
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

  const openEditDialog = (providerType: ProviderType) => {
    setEditingProviderType(providerType)
  }

  const closeEditDialog = () => {
    setEditingProviderType(null)
  }

  const saveEditedProviderType = async (updatedProviderType: ProviderType) => {
    try {
      // Convert frontend structure back to API structure
      const requestBody = {
        code: updatedProviderType.name.toLowerCase().replace(/\s+/g, '_'),
        name: updatedProviderType.name,
        requirements: [
          {
            requirement_type: "license",
            name: "State License",
            description: "Current, unrestricted state license",
            is_required: updatedProviderType.requirements.stateLicense,
            validation_rules: {
              must_be_active: true,
              must_be_unrestricted: true
            }
          },
          {
            requirement_type: "registration",
            name: "DEA Registration",
            description: "DEA/CDS registration",
            is_required: updatedProviderType.requirements.deaCds,
            validation_rules: {
              must_be_active: true,
              registration_type: "controlled_substance_registration"
            }
          },
          {
            requirement_type: "certification",
            name: "Board Certification",
            description: "Board certification",
            is_required: updatedProviderType.requirements.boardCertification,
            validation_rules: {
              must_be_active: true,
              certification_type: "board_certification"
            }
          },
          {
            requirement_type: "degree",
            name: "Degree",
            description: "Educational degree",
            is_required: updatedProviderType.requirements.degree,
            validation_rules: {
              must_be_active: true
            }
          },
          {
            requirement_type: "residency",
            name: "Residency",
            description: "Completed residency",
            is_required: updatedProviderType.requirements.residency,
            validation_rules: {
              must_be_active: true
            }
          },
          {
            requirement_type: "insurance",
            name: "Malpractice Insurance",
            description: "Current malpractice insurance",
            is_required: updatedProviderType.requirements.malpracticeInsurance,
            validation_rules: {
              must_be_active: true
            }
          },
          {
            requirement_type: "background_check",
            name: "Background Check",
            description: "Completed background check",
            is_required: updatedProviderType.requirements.backgroundCheck,
            validation_rules: {
              must_be_active: true
            }
          },
          {
            requirement_type: "work_history",
            name: "Work History",
            description: "Verified work history",
            is_required: updatedProviderType.requirements.workHistory,
            validation_rules: {
              must_be_active: true
            }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
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
                  {Object.entries(type.requirements).map(([key, value]) => (
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

      {editingProviderType && (
        <EditRuleDialog
          providerType={editingProviderType}
          isOpen={true}
          onClose={closeEditDialog}
          onSave={saveEditedProviderType}
        />
      )}
    </Paper>
  )
}

