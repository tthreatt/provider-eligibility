"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress,
  Alert,
  Box
} from "@mui/material"

// Define the order of requirements
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

// Types for our requirements handling
interface BaseRequirement {
  id: number;
  requirement_type: string;
  name: string;
  description: string;
  validation_rules: Record<string, any>;
}

interface ProviderTypeRequirement extends BaseRequirement {
  is_required: boolean;
  provider_type_id: number;
}

interface ProviderType {
  id: string;
  name: string;
  code: string;
  requirements: ProviderTypeRequirement[];
}

interface EditRuleDialogProps {
  providerType: ProviderType;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProviderType: ProviderType) => void;
}

interface DialogState {
  allRequirements: BaseRequirement[];
  currentProviderType: ProviderType;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

/**
 * EditRuleDialog Component
 * Displays and manages provider type requirements by comparing all possible requirements
 * against the provider type's current requirements.
 */
export function EditRuleDialog({ providerType, isOpen, onClose, onSave }: EditRuleDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>({
    allRequirements: [],
    currentProviderType: providerType,
    isLoading: true,
    isSaving: false,
    error: null
  });

  /**
   * Load all requirements and current provider type data when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      loadRequirements();
    }
  }, [isOpen, providerType.id]);

  /**
   * Fetch all requirements and current provider type requirements
   */
  const loadRequirements = async () => {
    try {
      setDialogState(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch all base requirements
      const baseReqResponse = await fetch('http://localhost:8000/api/eligibility/base-requirements');
      if (!baseReqResponse.ok) {
        throw new Error('Failed to fetch base requirements');
      }
      const baseRequirements: BaseRequirement[] = await baseReqResponse.json();

      // Fetch current provider type requirements
      const providerReqResponse = await fetch(`http://localhost:8000/api/eligibility/rules/${providerType.id}`);
      if (!providerReqResponse.ok) {
        throw new Error('Failed to fetch provider type requirements');
      }
      const currentProviderType: ProviderType = await providerReqResponse.json();

      console.log('Loaded requirements:', {
        baseRequirements,
        currentProviderType
      });

      setDialogState(prev => ({
        ...prev,
        allRequirements: baseRequirements,
        currentProviderType,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading requirements:', error);
      setDialogState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load requirements'
      }));
    }
  };

  /**
   * Check if a requirement is currently required for this provider type
   */
  const isRequirementRequired = (requirementType: string): boolean => {
    return dialogState.currentProviderType.requirements.some(
      req => req.requirement_type === requirementType && req.is_required
    );
  };

  /**
   * Get requirement by name
   */
  const getRequirementByName = (name: string): BaseRequirement | undefined => {
    return dialogState.allRequirements.find(req => req.name === name);
  };

  /**
   * Handle requirement checkbox changes
   * Updates or adds the requirement to the provider type's requirements
   */
  const handleRequirementChange = (baseRequirement: BaseRequirement) => {
    const currentValue = isRequirementRequired(baseRequirement.requirement_type);
    
    console.log('Changing requirement:', {
      type: baseRequirement.requirement_type,
      currentValue,
      newValue: !currentValue
    });

    setDialogState(prev => {
      // Find existing requirement or create new one
      const updatedRequirements = [...prev.currentProviderType.requirements];
      const existingIndex = updatedRequirements.findIndex(
        req => req.requirement_type === baseRequirement.requirement_type
      );

      if (existingIndex >= 0) {
        // Update existing requirement
        updatedRequirements[existingIndex] = {
          ...updatedRequirements[existingIndex],
          is_required: !currentValue
        };
      } else {
        // Add new requirement
        updatedRequirements.push({
          ...baseRequirement,
          is_required: true,
          provider_type_id: parseInt(prev.currentProviderType.id)
        });
      }

      return {
        ...prev,
        currentProviderType: {
          ...prev.currentProviderType,
          requirements: updatedRequirements
        }
      };
    });
  };

  /**
   * Handle save operation
   * Sends the complete updated provider type with all requirements to the API
   */
  const handleSave = async () => {
    try {
      setDialogState(prev => ({ ...prev, isSaving: true, error: null }));
      
      // Ensure all base requirements are included in the save
      const completeRequirements = dialogState.allRequirements.map(baseReq => {
        const existingReq = dialogState.currentProviderType.requirements.find(
          req => req.requirement_type === baseReq.requirement_type
        );

        return existingReq || {
          ...baseReq,
          is_required: false,
          provider_type_id: parseInt(dialogState.currentProviderType.id)
        };
      });

      const updatedProviderType = {
        ...dialogState.currentProviderType,
        requirements: completeRequirements
      };

      console.log('Saving provider type:', updatedProviderType);
      onSave(updatedProviderType);
      handleClose();
    } catch (error) {
      console.error('Error saving provider type:', error);
      setDialogState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save changes'
      }));
    }
  };

  const handleClose = () => {
    setDialogState({
      allRequirements: [],
      currentProviderType: providerType,
      isLoading: false,
      isSaving: false,
      error: null
    });
    onClose();
  };

  // Render loading state
  if (dialogState.isLoading) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Provider Type</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {dialogState.currentProviderType.name}
        </Typography>
        <FormGroup>
          {REQUIREMENT_ORDER.map(reqName => {
            const requirement = getRequirementByName(reqName);
            if (!requirement) return null;

            return (
              <FormControlLabel
                key={requirement.requirement_type}
                control={
                  <Checkbox
                    checked={isRequirementRequired(requirement.requirement_type)}
                    onChange={() => handleRequirementChange(requirement)}
                    disabled={dialogState.isSaving}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">{requirement.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {requirement.description}
                    </Typography>
                  </Box>
                }
              />
            );
          })}
        </FormGroup>
      </DialogContent>
      {dialogState.error && (
        <Alert 
          severity="error" 
          sx={{ mx: 3, mb: 2 }}
          onClose={() => setDialogState(prev => ({ ...prev, error: null }))}
        >
          {dialogState.error}
        </Alert>
      )}
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" disabled={dialogState.isSaving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={dialogState.isSaving}
          sx={{ fontWeight: 700 }}
        >
          {dialogState.isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

