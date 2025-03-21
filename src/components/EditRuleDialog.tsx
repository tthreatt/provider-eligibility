"use client"

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BackendProviderType,
  FrontendRequirements,
  requirementTypeToUIKey
} from "@/types/providerTypes"
import { updateProviderType } from "@/services/eligibilityRules"

interface EditRuleDialogProps {
  open: boolean;
  onClose: () => void;
  providerType?: BackendProviderType;
  onSave: (providerType: BackendProviderType) => void;
}

/**
 * Generate a code from a provider type name
 */
const generateProviderTypeCode = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

const defaultRequirements: FrontendRequirements = {
  nationalProviderId: false,
  stateLicense: true, // Set state license as default requirement
  boardCertification: false,
  backgroundCheck: false,
  immunizationRecords: false,
  professionalReferences: false,
  continuingEducation: false,
  malpracticeInsurance: false,
  deaRegistration: false,
  medicalDegree: false,
  residency: false,
  workHistory: false,
};

/**
 * EditRuleDialog Component
 * Manages provider type requirements using backend data structure
 */
export const EditRuleDialog: React.FC<EditRuleDialogProps> = ({
  open,
  onClose,
  providerType,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [requirements, setRequirements] = useState<FrontendRequirements>(defaultRequirements);

  useEffect(() => {
    if (open && providerType) {
      console.log('Initializing dialog with provider type:', providerType);
      setName(providerType.name);
      setCode(providerType.code || generateProviderTypeCode(providerType.name));
      setRequirements(providerType.requirements || defaultRequirements);
    } else if (open) {
      console.log('Opening dialog for new provider type');
      setName('');
      setCode('');
      setRequirements(defaultRequirements);
    }
  }, [open, providerType]);

  useEffect(() => {
    // Update code when name changes, but only if it's a new provider type
    if (!providerType && name) {
      const newCode = generateProviderTypeCode(name);
      console.log('Generated code from name:', newCode);
      setCode(newCode);
    }
  }, [name, providerType]);

  /**
   * Check if a requirement is active in current provider type
   */
  const isRequirementActive = (requirementType: string): boolean => {
    const uiKey = Object.entries(requirementTypeToUIKey).find(([type]) => type === requirementType)?.[1];
    if (!uiKey) {
      console.warn(`No UI key found for requirement type: ${requirementType}`);
      return false;
    }
    return Boolean(requirements[uiKey]);
  };

  /**
   * Handle requirement checkbox changes
   */
  const handleRequirementChange = (key: keyof FrontendRequirements) => {
    console.log('Changing requirement:', key);
    setRequirements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Handle save operation
   */
  const handleSave = async () => {
    if (!name.trim()) {
      console.error('Name is required');
      return;
    }

    const hasRequirements = Object.values(requirements).some((value) => value);
    if (!hasRequirements) {
      console.error('At least one requirement must be selected');
      return;
    }

    const updatedProviderType: BackendProviderType = {
      id: providerType?.id || '',
      name: name.trim(),
      code: code || generateProviderTypeCode(name),
      requirements,
    };

    console.log('Saving provider type:', updatedProviderType);

    try {
      const result = await updateProviderType(updatedProviderType);
      console.log('Save successful:', result);
      onSave(result);
      onClose();
    } catch (error) {
      console.error('Error saving provider type:', error);
      // Handle error (show error message to user)
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    console.log('Closing dialog');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {providerType ? 'Edit Provider Type' : 'New Provider Type'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Code"
          type="text"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText="Unique identifier for this provider type"
        />
        <Typography variant="subtitle1" style={{ marginTop: '1rem' }}>
          Requirements
        </Typography>
        <FormGroup>
          {Object.entries(requirements).map(([key, value]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={value}
                  onChange={() => handleRequirementChange(key as keyof FrontendRequirements)}
                />
              }
              label={key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase())}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 