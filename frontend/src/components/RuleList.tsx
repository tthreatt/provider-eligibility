"use client"

import { useState } from "react"
import { Paper, List, ListItem, IconButton, Typography, Grid, Chip, Box } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import type { ProviderType } from "@/types/providerTypes"
import { EditRuleDialog } from "./EditRuleDialog"

export function RuleList() {
  const [providerTypes, setProviderTypes] = useState<ProviderType[]>([
    {
      id: "1",
      name: "Allopathic & Osteopathic Physicians",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "2",
      name: "Behavioral Health & Social Service Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: true },
    },
    {
      id: "3",
      name: "Chiropractic Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: false },
    },
    {
      id: "4",
      name: "Dental Providers",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "5",
      name: "Dietary & Nutritional Service Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: false },
    },
    {
      id: "6",
      name: "Emergency Medical Service Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: false },
    },
    {
      id: "7",
      name: "Eye and Vision Services Providers",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "8",
      name: "Nursing Service Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: false },
    },
    {
      id: "9",
      name: "Pharmacy Service Providers",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "10",
      name: "Physician Assistants & Advanced Practice Nursing Providers",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "11",
      name: "Podiatric Medicine & Surgery Service Providers",
      requirements: { stateLicense: true, deaCds: true, boardCertification: true },
    },
    {
      id: "12",
      name: "Speech, Language and Hearing Service Providers",
      requirements: { stateLicense: true, deaCds: false, boardCertification: false },
    },
  ])

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

