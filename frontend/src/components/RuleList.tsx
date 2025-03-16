"use client"

import { useState, useEffect } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box, Alert } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import type { ProviderType } from "@/types/providerTypes"
import { EditRuleDialog } from "./EditRuleDialog"

export function RuleList() {
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([])
  const [editingProviderType, setEditingProviderType] = useState<ProviderType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchProviderTypes = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/eligibility/rules');
      if (!response.ok) {
        throw new Error('Failed to fetch provider types');
      }
      const data = await response.json();
      
      // Updated conversion logic to handle the new API response format
      const convertedData = data.map((providerType: any) => {
        // First, find all requirements with their validation rules
        const requirementsMap = providerType.requirements.reduce((acc: any, req: any) => {
          acc[req.requirement_type] = {
            is_required: req.is_required,
            validation_rules: req.validation_rules || {}
          };
          return acc;
        }, {});

        return {
          id: providerType.id.toString(),
          name: providerType.name,
          requirements: {
            stateLicense: requirementsMap.license?.is_required || false,
            deaCds: requirementsMap.registration?.is_required || false,
            boardCertification: requirementsMap.certification?.is_required || false,
            degree: requirementsMap.degree?.is_required || false,
            residency: requirementsMap.residency?.is_required || false,
            malpracticeInsurance: requirementsMap.insurance?.is_required || false,
            backgroundCheck: requirementsMap.background_check?.is_required || false,
            workHistory: requirementsMap.work_history?.is_required || false,
          }
        };
      });

      setProviderTypes(convertedData);
      console.log('API Response:', data); // Debug log
      console.log('Converted provider types:', convertedData); // Debug log
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchProviderTypes();
  }, []);

  const deleteProviderType = async (id: string) => {
    try {
      const response = await fetch(`/api/eligibility/rules/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete provider type');
      }

      fetchProviderTypes(); // Refresh the list
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
      // Updated request body to match the API's expected format
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
              must_be_unrestricted: true,
              license_type: "state_license"
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

      fetchProviderTypes(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      
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

