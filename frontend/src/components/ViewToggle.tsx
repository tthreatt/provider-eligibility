"use client";

import type React from "react";

import { ToggleButton, ToggleButtonGroup, styled } from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";

interface ViewToggleProps {
  currentView: "admin" | "search";
  onToggle: (view: "admin" | "search") => void;
}

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main,
    color: "#FFF",
    fontWeight: 700,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      color: "#FFF",
    },
  },
}));

export function ViewToggle({ currentView, onToggle }: ViewToggleProps) {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: "admin" | "search"
  ) => {
    if (newView !== null) {
      onToggle(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      aria-label="view toggle"
      sx={{ mb: 4 }}
    >
      <StyledToggleButton value="admin" aria-label="admin view">
        <AdminPanelSettingsIcon sx={{ mr: 1 }} />
        Admin View
      </StyledToggleButton>
      <StyledToggleButton value="search" aria-label="search view">
        <SearchIcon sx={{ mr: 1 }} />
        Search View
      </StyledToggleButton>
    </ToggleButtonGroup>
  );
}
