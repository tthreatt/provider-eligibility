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
          <FormControlLabel
            control={
              <Checkbox
                checked={editedProviderType.requirements.stateLicense}
                onChange={() => handleRequirementChange("stateLicense")}
              />
            }
            label="State License Required"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedProviderType.requirements.deaCds}
                onChange={() => handleRequirementChange("deaCds")}
              />
            }
            label="DEA/CDS Required"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedProviderType.requirements.boardCertification}
                onChange={() => handleRequirementChange("boardCertification")}
              />
            }
            label="Board Certification Required"
          />
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

