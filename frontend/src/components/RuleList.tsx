"use client"

import { useState, useEffect } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box, Alert, Button, CircularProgress, Snackbar } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import { EditRuleDialog } from "./EditRuleDialog"
import { fetchProviderRules, fetchBaseRequirements, deleteProviderRule, API_ROUTES } from '@/config/api'
import type { BaseRequirement, Requirement } from '@/types/eligibility'

// Define the order of requirements
const REQUIREMENT_ORDER = [
  "Background Check",
  "Board Certification",
  "Continuing Education",
  "DEA Registration",
  "Immunization Records",
  "Malpractice Insurance",
  "Medical Degree",
  "National Provider Identifier",
  "Professional Degree",
  "Professional References",
  "Residency",
  "State License",
  "Work History"
];

// Types matching EditRuleDialog's internal types
interface DialogProviderType {
  id: string;
  name: string;
  code: string;
  requirements: {
    id: number;
    requirement_type: string;
    name: string;
    description: string;
    validation_rules: Record<string, any>;
    is_required: boolean;
    provider_type_id: number;
  }[];
}

interface RuleListState {
  providerTypes: DialogProviderType[];
  baseRequirements: BaseRequirement[];
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

export function RuleList() {
  const [state, setState] = useState<RuleListState>({
    providerTypes: [],
    baseRequirements: [],
    isLoading: true,
    error: null,
    successMessage: null
  });
  const [editingProviderType, setEditingProviderType] = useState<DialogProviderType | null>(null);

  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const [providerTypesData, baseRequirements] = await Promise.all([
        fetchProviderRules(),
        fetchBaseRequirements()
      ]);

      // Convert backend provider types to match EditRuleDialog's expected format
      const providerTypes = providerTypesData.map((pt: any) => ({
        ...pt,
        id: pt.id.toString(), // Convert number id to string
        requirements: pt.requirements.map((req: any) => ({
          ...req,
          provider_type_id: parseInt(pt.id)
        }))
      }));

      setState(prev => ({
        ...prev,
        providerTypes,
        baseRequirements,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'An error occurred',
        isLoading: false
      }));
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProviderType = async (id: string) => {
    try {
      await deleteProviderRule(id);
      setState(prev => ({
        ...prev,
        successMessage: 'Provider type deleted successfully'
      }));
      loadData(); // Refresh the list
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to delete provider type'
      }));
    }
  };

  const handleEditProviderType = (providerType: DialogProviderType) => {
    setEditingProviderType(providerType);
  };

  const handleCloseEditDialog = () => {
    setEditingProviderType(null);
  };

  const handleSaveProviderType = async (updatedProviderType: DialogProviderType) => {
    try {
      const response = await fetch(`${API_ROUTES.ELIGIBILITY_RULES}/${updatedProviderType.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedProviderType,
          id: parseInt(updatedProviderType.id) // Convert back to number for API
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update provider type');
      }

      setState(prev => ({
        ...prev,
        successMessage: `Successfully updated ${updatedProviderType.name}`
      }));
      loadData(); // Refresh the list
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to update provider type'
      }));
    }
  };

  const clearSuccessMessage = () => {
    setState(prev => ({ ...prev, successMessage: null }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Helper function to get requirement status
  const getRequirementStatus = (type: DialogProviderType, requirementName: string) => {
    const requirement = type.requirements.find(r => r.name === requirementName);
    return {
      isRequired: requirement?.is_required || false,
      requirement: requirement || state.baseRequirements.find(r => r.name === requirementName)
    };
  };

  return (
    <>
      <Paper elevation={3} sx={{ mt: 3 }}>
        {state.error && (
          <Alert 
            severity="error" 
            sx={{ m: 2 }}
            onClose={clearError}
            action={
              <Button color="inherit" size="small" onClick={loadData}>
                Retry
              </Button>
            }
          >
            {state.error}
          </Alert>
        )}
        
        {state.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {state.providerTypes.map((type) => (
              <ListItem key={type.id} divider>
                <Box sx={{ flex: 1 }}>
                  <Typography color="primary" variant="subtitle1">
                    {type.name}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {REQUIREMENT_ORDER.map((reqName) => {
                      const { isRequired, requirement } = getRequirementStatus(type, reqName);
                      if (!requirement) return null;
                      
                      return (
                        <Grid item key={requirement.requirement_type}>
                          <Chip
                            label={`${requirement.name}: ${isRequired ? "Required" : "Not Required"}`}
                            color={isRequired ? "success" : "default"}
                            variant="outlined"
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
                <Box>
                  <IconButton 
                    edge="end" 
                    aria-label="edit" 
                    onClick={() => handleEditProviderType(type)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete" 
                    onClick={() => handleDeleteProviderType(type.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Snackbar
        open={!!state.successMessage}
        autoHideDuration={6000}
        onClose={clearSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={clearSuccessMessage} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {state.successMessage}
        </Alert>
      </Snackbar>

      {editingProviderType && (
        <EditRuleDialog
          providerType={editingProviderType}
          isOpen={true}
          onClose={handleCloseEditDialog}
          onSave={handleSaveProviderType}
        />
      )}
    </>
  );
}

