"use client"

import { useState } from "react"
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
} from "@mui/material"
import type { ProviderType } from "@/types/providerTypes"

interface BackendProviderType {
  id: number;
  code: string;
  name: string;
  requirements: {
    requirement_type: string;
    name: string;
    description: string;
    is_required: boolean;
    validation_rules: {
      must_be_active: boolean;
      [key: string]: any;
    };
  }[];
}

const convertToFrontendType = (backendType: BackendProviderType): ProviderType => {
  return {
    id: backendType.id.toString(),
    name: backendType.name,
    requirements: {
      stateLicense: backendType.requirements.find(r => r.requirement_type === "license")?.is_required || false,
      deaCds: backendType.requirements.find(r => r.requirement_type === "registration")?.is_required || false,
      boardCertification: backendType.requirements.find(r => r.requirement_type === "certification")?.is_required || false,
      degree: backendType.requirements.find(r => r.requirement_type === "degree")?.is_required || false,
      residency: backendType.requirements.find(r => r.requirement_type === "residency")?.is_required || false,
      malpracticeInsurance: backendType.requirements.find(r => r.requirement_type === "insurance")?.is_required || false,
      backgroundCheck: backendType.requirements.find(r => r.requirement_type === "background_check")?.is_required || false,
      workHistory: backendType.requirements.find(r => r.requirement_type === "work_history")?.is_required || false
    }
  };
};

interface EditRuleDialogProps {
  providerType: ProviderType
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProviderType: ProviderType) => void
}

export function EditRuleDialog({ providerType, isOpen, onClose, onSave }: EditRuleDialogProps) {
  const [editedProviderType, setEditedProviderType] = useState<ProviderType>(providerType)

  const handleRequirementChange = (requirement: keyof ProviderType["requirements"]) => {
    setEditedProviderType((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [requirement]: !prev.requirements[requirement],
      },
    }))
  }

  const handleSave = () => {
    onSave(editedProviderType)
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Provider Type</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {editedProviderType.name}
        </Typography>
        <FormGroup>
          {Object.entries(editedProviderType.requirements).map(([key, value]) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={value}
                  onChange={() => handleRequirementChange(key as keyof ProviderType["requirements"])}
                />
              }
              label={`${key.replace(/([A-Z])/g, ' $1').trim()} Required`}
            />
          ))}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ fontWeight: 700 }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}

