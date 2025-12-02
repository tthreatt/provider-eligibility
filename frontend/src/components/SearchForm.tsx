import React from "react";
import { Box, TextField, Button, CircularProgress } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface SearchFormProps {
  onSubmit: (e: React.FormEvent) => void;
  npi: string;
  setNpi: (value: string) => void;
  loading: boolean;
}

const isValidNPI = (npi: string): boolean => {
  return /^\d{10}$/.test(npi);
};

export const SearchForm: React.FC<SearchFormProps> = ({
  onSubmit,
  npi,
  setNpi,
  loading,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Provider NPI*"
          value={npi}
          onChange={(e) => setNpi(e.target.value)}
          disabled={loading}
          inputProps={{
            style: { fontSize: "1.2rem" },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading || !npi || !isValidNPI(npi)}
          sx={{
            minWidth: { xs: "48px", sm: "150px" },
            whiteSpace: "nowrap",
            textTransform: "uppercase",
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
            height: "56px",
            px: { xs: 2, sm: 4 },
            borderRadius: 1,
            boxShadow: 2,
            "&:hover": {
              boxShadow: 4,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <>
              <SearchIcon
                sx={{
                  mr: { xs: 0, sm: 1 },
                  fontSize: { xs: "1.2rem", sm: "1.4rem" },
                }}
              />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Check Eligibility
              </Box>
            </>
          )}
        </Button>
      </Box>
    </form>
  );
};
