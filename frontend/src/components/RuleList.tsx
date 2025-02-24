"use client"

import { useState } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import type { ProviderType } from "@/types/providerTypes"
import { EditRuleDialog } from "./EditRuleDialog"
import { providerTypes as initialProviderTypes } from "@/config/providerRules"

export function RuleList() {
  const [providerTypes, setProviderTypes] = useState(initialProviderTypes)

  const [editingProviderType, setEditingProviderType] = useState<ProviderType | null>(null)

  const deleteProviderType = (id: string) => {
    setProviderTypes(providerTypes.filter((type) => type.id !== id))
  }

  const openEditDialog = (providerType: ProviderType) => {
    setEditingProviderType(providerType)
  }

  const closeEditDialog = () => {
    setEditingProviderType(null)
  }

  const saveEditedProviderType = (updatedProviderType: ProviderType) => {
    setProviderTypes((prevTypes) =>
      prevTypes.map((type) => (type.id === updatedProviderType.id ? updatedProviderType : type)),
    )
  }

  return (
    <Paper elevation={3} sx={{ mt: 3 }}>
      <List>
        {providerTypes.map((type) => (
          <ListItem key={type.id} divider>
            <Box sx={{ flex: 1 }}>
              <Typography color="primary" variant="subtitle1">
                {type.name}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item>
                  <Chip
                    label={`State License: ${type.requirements.stateLicense ? "Required" : "Not Required"}`}
                    color={type.requirements.stateLicense ? "success" : "default"}
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label={`DEA/CDS: ${type.requirements.deaCds ? "Required" : "Not Required"}`}
                    color={type.requirements.deaCds ? "success" : "default"}
                    variant="outlined"
                  />
                </Grid>
                <Grid item>
                  <Chip
                    label={`Board Certification: ${type.requirements.boardCertification ? "Required" : "Not Required"}`}
                    color={type.requirements.boardCertification ? "success" : "default"}
                    variant="outlined"
                  />
                </Grid>
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

