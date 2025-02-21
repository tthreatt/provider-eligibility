"use client"

import type React from "react"

import { useState } from "react"
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
} from "@mui/material"
import type { ProviderType } from "@/types/providerTypes"

const providerTypeOptions = [
  "Allopathic & Osteopathic Physicians",
  "Behavioral Health & Social Service Providers",
  "Chiropractic Providers",
  "Dental Providers",
  "Dietary & Nutritional Service Providers",
  "Emergency Medical Service Providers",
  "Eye and Vision Services Providers",
  "Nursing Service Providers",
  "Pharmacy Service Providers",
  "Physician Assistants & Advanced Practice Nursing Providers",
  "Podiatric Medicine & Surgery Service Providers",
  "Speech, Language and Hearing Service Providers",
]

export function AddRuleForm() {
  const [providerTypeName, setProviderTypeName] = useState("")
  const [stateLicense, setStateLicense] = useState(false)
  const [deaCds, setDeaCds] = useState(false)
  const [boardCertification, setBoardCertification] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (providerTypeName) {
      const newProviderType: ProviderType = {
        id: Date.now().toString(),
        name: providerTypeName,
        requirements: {
          stateLicense,
          deaCds,
          boardCertification,
        },
      }
      console.log(newProviderType)
      setProviderTypeName("")
      setStateLicense(false)
      setDeaCds(false)
      setBoardCertification(false)
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Add New Provider Type
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="provider-type-label">Provider Type Name</InputLabel>
          <Select
            labelId="provider-type-label"
            id="provider-type"
            value={providerTypeName}
            label="Provider Type Name"
            onChange={(e) => setProviderTypeName(e.target.value)}
            required
          >
            <MenuItem value="">
              <em>Select a provider type</em>
            </MenuItem>
            {providerTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" gutterBottom>
          Requirements
        </Typography>
        <FormGroup row sx={{ mb: 3 }}>
          <FormControlLabel
            control={<Checkbox checked={stateLicense} onChange={(e) => setStateLicense(e.target.checked)} />}
            label="State License"
          />
          <FormControlLabel
            control={<Checkbox checked={deaCds} onChange={(e) => setDeaCds(e.target.checked)} />}
            label="DEA/CDS"
          />
          <FormControlLabel
            control={
              <Checkbox checked={boardCertification} onChange={(e) => setBoardCertification(e.target.checked)} />
            }
            label="Board Certification"
          />
        </FormGroup>

        <Box>
          <Button type="submit" variant="contained" sx={{ fontWeight: 700 }}>
            Add Provider Type
          </Button>
        </Box>
      </form>
    </Paper>
  )
}

