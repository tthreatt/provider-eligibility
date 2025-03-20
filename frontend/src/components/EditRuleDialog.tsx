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
import { BackendProviderType, Requirements } from "@/types/providerTypes"
import { updateProviderType } from "@/services/eligibilityRules"

interface EditRuleDialogProps {
  providerType: BackendProviderType
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProviderType: BackendProviderType) => void
}

// Add the requirement order constant
const REQUIREMENT_ORDER = [
  "nationalProviderId",
  "stateLicense",
  "boardCertification",
  "backgroundCheck",
  "immunizationRecords",
  "professionalReferences",
  "continuingEducation",
  "malpracticeInsurance",
  "deaRegistration",
  "medicalDegree",
  "residency",
  "workHistory"
];

export function EditRuleDialog({ providerType, isOpen, onClose, onSave }: EditRuleDialogProps) {
  const [editedProviderType, setEditedProviderType] = useState<BackendProviderType>(providerType)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequirementChange = (requirement: keyof Requirements) => {
    setEditedProviderType((prev) => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [requirement]: !prev.requirements[requirement]
      }
    }))
  }

  const formatRequirementLabel = (key: string): string => {
    const labels: { [key: string]: string } = {
      nationalProviderId: "National Provider Identifier",
      stateLicense: "State License",
      boardCertification: "Board Certification",
      backgroundCheck: "Background Check",
      immunizationRecords: "Immunization Records",
      professionalReferences: "Professional References",
      continuingEducation: "Continuing Education",
      malpracticeInsurance: "Malpractice Insurance",
      deaRegistration: "DEA Registration",
      medicalDegree: "Medical Degree",
      residency: "Residency",
      workHistory: "Work History"
    };
    return labels[key] || key.replace(/([A-Z])/g, ' $1').trim();
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Saving provider type:', {
        id: editedProviderType.id,
        name: editedProviderType.name,
        requirements: editedProviderType.requirements
      })

      const updatedType = await updateProviderType(editedProviderType.id, editedProviderType)
      console.log('Successfully updated provider type:', updatedType)
      onSave(updatedType)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while saving changes'
      setError(`Failed to save changes: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Provider Type</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          {editedProviderType.name}
        </Typography>
        <FormGroup>
          {REQUIREMENT_ORDER.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={editedProviderType.requirements[key as keyof Requirements]}
                  onChange={() => handleRequirementChange(key as keyof Requirements)}
                />
              }
              label={`${formatRequirementLabel(key)} Required`}
            />
          ))}
        </FormGroup>
      </DialogContent>
      {error && (
        <Typography 
          color="error" 
          sx={{ 
            px: 3, 
            pb: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          {error}
        </Typography>
      )}
      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          sx={{ fontWeight: 700 }}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

