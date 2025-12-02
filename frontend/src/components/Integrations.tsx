"use client";

import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Switch,
  TextField,
  Button,
  Box,
  Alert,
} from "@mui/material";
import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
}

const defaultIntegrations: Integration[] = [
  {
    id: "npi",
    name: "NPI Registry",
    enabled: true,
    endpoint: "https://npiregistry.cms.hhs.gov/api/",
  },
  {
    id: "dea",
    name: "DEA Database",
    enabled: false,
    apiKey: "",
    endpoint: "https://api.dea.gov/",
  },
  {
    id: "state_boards",
    name: "State Medical Boards",
    enabled: false,
    apiKey: "",
    endpoint: "",
  },
];

export function Integrations() {
  const [integrations, setIntegrations] =
    useState<Integration[]>(defaultIntegrations);
  const [saved, setSaved] = useState(false);

  const handleToggle = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  const handleInputChange = (
    id: string,
    field: "apiKey" | "endpoint",
    value: string
  ) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id ? { ...integration, [field]: value } : integration
      )
    );
  };

  const handleSave = () => {
    // Here you would typically save to your backend
    console.log("Saving integrations:", integrations);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Data Integration Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure external data sources for provider eligibility checks.
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Integration settings saved successfully!
        </Alert>
      )}

      <List>
        {integrations.map((integration) => (
          <ListItem
            key={integration.id}
            sx={{
              flexDirection: "column",
              alignItems: "stretch",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              mb: 2,
              p: 2,
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <ListItemText
                primary={integration.name}
                secondary={`Status: ${integration.enabled ? "Active" : "Inactive"}`}
              />
              <Switch
                edge="end"
                checked={integration.enabled}
                onChange={() => handleToggle(integration.id)}
              />
            </Box>

            {integration.enabled && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {integration.apiKey !== undefined && (
                  <TextField
                    label="API Key"
                    type="password"
                    value={integration.apiKey}
                    onChange={(e) =>
                      handleInputChange(
                        integration.id,
                        "apiKey",
                        e.target.value
                      )
                    }
                    fullWidth
                  />
                )}
                <TextField
                  label="Endpoint URL"
                  value={integration.endpoint}
                  onChange={(e) =>
                    handleInputChange(
                      integration.id,
                      "endpoint",
                      e.target.value
                    )
                  }
                  fullWidth
                />
              </Box>
            )}
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Integration Settings
        </Button>
      </Box>
    </Paper>
  );
}
