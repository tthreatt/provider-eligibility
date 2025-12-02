"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import type {
  BaseRequirement,
  FrontendRequirements,
} from "@/types/providerTypes";
import { requirementTypeToUIKey } from "@/types/providerTypes";
import {
  getBaseRequirements,
  createProviderType,
} from "@/services/eligibilityApi";

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
  "Professional References",
];

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
];

interface FormState {
  providerTypeName: string;
  baseRequirements: BaseRequirement[];
  selectedRequirements: Record<number, boolean>;
  error: string | null;
  success: boolean;
  loading: boolean;
}

export function AddRuleForm({ onRuleAdded }: { onRuleAdded: () => void }) {
  const [state, setState] = useState<FormState>({
    providerTypeName: "",
    baseRequirements: [],
    selectedRequirements: {},
    error: null,
    success: false,
    loading: false,
  });

  useEffect(() => {
    const fetchBaseRequirements = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const requirements = await getBaseRequirements();
        const initialSelectedState = requirements.reduce(
          (acc, req) => {
            acc[req.id] = false;
            return acc;
          },
          {} as Record<number, boolean>
        );

        setState((prev) => ({
          ...prev,
          baseRequirements: requirements,
          selectedRequirements: initialSelectedState,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: "Failed to fetch requirements",
          loading: false,
        }));
      }
    };

    fetchBaseRequirements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState((prev) => ({
      ...prev,
      error: null,
      success: false,
      loading: true,
    }));

    if (!state.providerTypeName) {
      setState((prev) => ({
        ...prev,
        error: "Please select a provider type",
        loading: false,
      }));
      return;
    }

    try {
      // Convert selected requirements to FrontendRequirements format
      const requirements = state.baseRequirements.reduce((acc, req) => {
        const uiKey = requirementTypeToUIKey[req.requirement_type];
        if (uiKey) {
          acc[uiKey] = state.selectedRequirements[req.id] || false;
        }
        return acc;
      }, {} as FrontendRequirements);

      await createProviderType({
        name: state.providerTypeName,
        code: state.providerTypeName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        requirements,
      });

      setState((prev) => ({
        ...prev,
        providerTypeName: "",
        selectedRequirements: prev.baseRequirements.reduce(
          (acc, req) => {
            acc[req.id] = false;
            return acc;
          },
          {} as Record<number, boolean>
        ),
        success: true,
        loading: false,
      }));

      onRuleAdded();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "An error occurred",
        loading: false,
      }));
    }
  };

  const getRequirementByName = (name: string): BaseRequirement | undefined => {
    return state.baseRequirements.find((req) => req.name === name);
  };

  if (state.loading && state.baseRequirements.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}
      {state.success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Provider type added successfully!
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Add New Provider Type
      </Typography>

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="provider-type-label">Provider Type Name</InputLabel>
          <Select
            labelId="provider-type-label"
            id="provider-type"
            value={state.providerTypeName}
            label="Provider Type Name"
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                providerTypeName: e.target.value,
              }))
            }
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
        <FormGroup sx={{ mb: 3 }}>
          {REQUIREMENT_ORDER.map((reqName) => {
            const requirement = getRequirementByName(reqName);
            if (!requirement) return null;

            return (
              <FormControlLabel
                key={requirement.id}
                control={
                  <Checkbox
                    checked={
                      state.selectedRequirements[requirement.id] || false
                    }
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        selectedRequirements: {
                          ...prev.selectedRequirements,
                          [requirement.id]: e.target.checked,
                        },
                      }))
                    }
                    disabled={state.loading}
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

        <Box>
          <Button
            type="submit"
            variant="contained"
            sx={{ fontWeight: 700 }}
            disabled={!state.providerTypeName || state.loading}
          >
            Add Provider Type
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
