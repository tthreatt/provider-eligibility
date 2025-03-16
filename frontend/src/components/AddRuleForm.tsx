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
  Alert,
} from "@mui/material"
import type { ProviderType } from "@/types/defaultProviderTypes"

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

export function AddRuleForm({ onRuleAdded }: { onRuleAdded: () => void }) {
  const [providerTypeName, setProviderTypeName] = useState("")
  const [stateLicense, setStateLicense] = useState(false)
  const [deaCds, setDeaCds] = useState(false)
  const [boardCertification, setBoardCertification] = useState(false)
  const [degree, setDegree] = useState(false)
  const [residency, setResidency] = useState(false)
  const [malpracticeInsurance, setMalpracticeInsurance] = useState(false)
  const [backgroundCheck, setBackgroundCheck] = useState(false)
  const [workHistory, setWorkHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (providerTypeName) {
      try {
        const response = await fetch('/api/eligibility/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: providerTypeName.toLowerCase().replace(/\s+/g, '_'),
            name: providerTypeName,
            requirements: [
              {
                requirement_type: "license",
                name: "State License",
                description: "Current, unrestricted state license",
                is_required: stateLicense,
                validation_rules: {
                  must_be_active: true,
                  license_type: "state_license"
                }
              },
              {
                requirement_type: "registration",
                name: "DEA Registration",
                description: "DEA/CDS registration",
                is_required: deaCds,
                validation_rules: {
                  must_be_active: true,
                  registration_type: "controlled_substance_registration"
                }
              },
              {
                requirement_type: "certification",
                name: "Board Certification",
                description: "Board certification",
                is_required: boardCertification,
                validation_rules: {
                  must_be_active: true,
                  certification_type: "board_certification"
                }
              },
              {
                requirement_type: "degree",
                name: "Medical Degree",
                description: "Appropriate degree from an accredited institution",
                is_required: degree,
                validation_rules: {
                  must_be_active: true,
                  degree_type: "medical_degree"
                }
              },
              {
                requirement_type: "residency",
                name: "Residency",
                description: "Completion of residency program",
                is_required: residency,
                validation_rules: {
                  must_be_completed: true
                }
              },
              {
                requirement_type: "insurance",
                name: "Malpractice Insurance",
                description: "Current malpractice insurance coverage",
                is_required: malpracticeInsurance,
                validation_rules: {
                  must_be_active: true
                }
              },
              {
                requirement_type: "background_check",
                name: "Background Check",
                description: "Background check verification",
                is_required: backgroundCheck,
                validation_rules: {
                  must_be_completed: true
                }
              },
              {
                requirement_type: "work_history",
                name: "Work History",
                description: "Verification of work history",
                is_required: workHistory,
                validation_rules: {
                  must_be_verified: true
                }
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create provider type');
        }

        setSuccess(true);
        onRuleAdded(); // Refresh the list
        
        // Reset form
        setProviderTypeName("");
        setStateLicense(false);
        setDeaCds(false);
        setBoardCertification(false);
        setDegree(false);
        setResidency(false);
        setMalpracticeInsurance(false);
        setBackgroundCheck(false);
        setWorkHistory(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Provider type added successfully!</Alert>}
      
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
          <FormControlLabel
            control={<Checkbox checked={degree} onChange={(e) => setDegree(e.target.checked)} />}
            label="Degree Required"
          />
          <FormControlLabel
            control={<Checkbox checked={residency} onChange={(e) => setResidency(e.target.checked)} />}
            label="Residency Required"
          />
          <FormControlLabel
            control={<Checkbox checked={malpracticeInsurance} onChange={(e) => setMalpracticeInsurance(e.target.checked)} />}
            label="Malpractice Insurance Required"
          />
          <FormControlLabel
            control={<Checkbox checked={backgroundCheck} onChange={(e) => setBackgroundCheck(e.target.checked)} />}
            label="Background Check Required"
          />
          <FormControlLabel
            control={<Checkbox checked={workHistory} onChange={(e) => setWorkHistory(e.target.checked)} />}
            label="Work History Required"
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

