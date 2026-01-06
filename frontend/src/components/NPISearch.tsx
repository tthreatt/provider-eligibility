"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { SearchForm } from "./SearchForm";
import RequirementList from "./RequirementList";
import { ProcessedEligibility } from "../types/eligibility";
import { processEligibilityData } from "../utils/eligibilityProcessor";

// Provider service functions
const fetchProviderData = async (npi: string, token: string | null) => {
  console.log("fetchProviderData called with NPI:", npi);

  // Use Next.js API route instead of calling backend directly
  let response: Response;
  try {
    response = await fetch("/api/fetch-provider-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ npi }),
      credentials: "include", // Include cookies for Clerk auth
    });
  } catch (networkError: any) {
    console.error("Network error in fetchProviderData:", {
      error: networkError,
      message: networkError?.message,
      stack: networkError?.stack,
    });
    throw new Error(
      `Network error: ${networkError?.message || "Failed to connect to server"}`
    );
  }

  console.log(
    "fetchProviderData response status:",
    response.status,
    response.statusText
  );

  if (!response.ok) {
    // Read response as text first
    const responseText = await response.text();
    console.log(
      "fetchProviderData error response body:",
      responseText.substring(0, 500)
    );

    let errorData: any = {};
    try {
      const contentType = response.headers.get("content-type");
      console.log("fetchProviderData response content-type:", contentType);

      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = JSON.parse(responseText);
          console.log("fetchProviderData parsed error JSON:", errorData);
        } catch (jsonError) {
          console.warn(
            "fetchProviderData: Failed to parse JSON, using text:",
            jsonError
          );
          errorData = {
            error: responseText || "Failed to fetch provider data",
          };
        }
      } else {
        errorData = { error: responseText || "Failed to fetch provider data" };
      }
    } catch (parseError) {
      console.error(
        "Error parsing error response in fetchProviderData:",
        parseError
      );
      errorData = { error: responseText || "Failed to fetch provider data" };
    }

    const errorMessage =
      errorData.error ||
      errorData.detail ||
      errorData.message ||
      "Failed to fetch provider data";
    const errorDetails =
      errorData.details || errorData.error || responseText.substring(0, 200);

    console.error("fetchProviderData error:", {
      status: response.status,
      statusText: response.statusText,
      errorData,
      errorMessage,
      errorDetails,
      rawResponse: responseText.substring(0, 1000),
    });

    const fullError = new Error(errorMessage);
    (fullError as any).status = response.status;
    (fullError as any).details = errorDetails;
    throw fullError;
  }

  try {
    const data = await response.json();
    console.log("fetchProviderData success, data keys:", Object.keys(data));
    return data;
  } catch (jsonError) {
    console.error(
      "fetchProviderData: Failed to parse success response as JSON:",
      jsonError
    );
    throw new Error("Invalid response format from server");
  }
};

const fetchEligibilityRules = async (token: string | null) => {
  // Use Next.js API route instead of calling backend directly
  const response = await fetch("/api/eligibility/rules", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for Clerk auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch eligibility rules");
  }

  return response.json();
};

const REQUIREMENT_ORDER = [
  "National Provider Identifier",
  "Medical Degree",
  "Residency Program",
  "State License",
  "DEA Registration",
  "Board Certification",
  "Malpractice Insurance",
  "Background Check",
  "Work History",
  "Professional References",
];

interface NPISearchProps {
  loading?: boolean;
}

export function NPISearch({ loading = false }: NPISearchProps) {
  const [npi, setNpi] = useState("");
  const [searchResult, setSearchResult] = useState<ProcessedEligibility | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { getToken } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSearching(true);

    try {
      const token = await getToken();

      // First fetch provider data
      const rawProviderData = await fetchProviderData(npi, token);

      if (!rawProviderData) {
        throw new Error("No data received from API");
      }

      console.log("Raw provider data:", rawProviderData);
      console.log("Raw provider data keys:", Object.keys(rawProviderData));
      console.log(
        "Raw provider data rawApiResponse:",
        rawProviderData?.rawApiResponse
      );
      console.log(
        "Raw provider data rawApiResponse keys:",
        rawProviderData?.rawApiResponse
          ? Object.keys(rawProviderData.rawApiResponse)
          : "null"
      );

      // Then fetch eligibility rules
      const eligibilityRules = await fetchEligibilityRules(token);

      console.log("Eligibility rules:", eligibilityRules);

      // Use processEligibilityData to properly structure the data
      const processedResult = processEligibilityData(rawProviderData);
      console.log("Processed result:", processedResult);
      console.log(
        "Processed result requirements:",
        processedResult?.requirements
      );
      console.log("Processed result isEligible:", processedResult?.isEligible);

      if (!processedResult) {
        throw new Error("Failed to process eligibility data");
      }

      setSearchResult(processedResult);
    } catch (err) {
      console.error("Search error in NPISearch:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      // Extract error message with more detail
      let errorMessage = "An error occurred";
      let errorDetails: string | undefined;

      if (err instanceof Error) {
        errorMessage = err.message;
        errorDetails = (err as any).details;

        // If it's a generic message, try to get more details from the error
        if (errorMessage === "Failed to fetch provider data") {
          if (errorDetails) {
            errorMessage = `${errorMessage}: ${errorDetails}`;
          } else if ((err as any).cause) {
            errorMessage = `${errorMessage}: ${(err as any).cause}`;
          }
        }

        // Include status code if available
        if ((err as any).status) {
          errorMessage = `[${(err as any).status}] ${errorMessage}`;
        }
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as any).message);
        errorDetails = (err as any).details;
      }

      // Combine message and details
      const fullErrorMessage = errorDetails
        ? `${errorMessage}\n\nDetails: ${errorDetails}`
        : errorMessage;

      setError(fullErrorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  // Debug logging only in development
  useEffect(() => {
    if (
      process.env.NODE_ENV === "development" &&
      searchResult?.rawValidation?.npiDetails
    ) {
      console.group("Provider Data Structure");
      console.log("NPI Validation:", searchResult.rawValidation.npiDetails);
      console.log(
        "NPI Validation Licenses:",
        searchResult.rawValidation.npiDetails.licenses
      );
      console.groupEnd();
    }
  }, [searchResult]);

  return (
    <Box sx={{ p: 4, bgcolor: "background.paper", borderRadius: 1 }}>
      <SearchForm
        onSubmit={handleSearch}
        npi={npi}
        setNpi={setNpi}
        loading={loading || isSearching}
      />

      {searchResult && !error && (
        <Alert
          severity={searchResult.isEligible ? "success" : "error"}
          icon={searchResult.isEligible ? <CheckCircleIcon /> : <CancelIcon />}
          sx={{
            mt: 3,
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <AlertTitle sx={{ fontSize: "1.2rem", fontWeight: "medium" }}>
            {searchResult.isEligible
              ? "Provider is Eligible"
              : "Provider is Not Eligible"}
          </AlertTitle>

          {/* Provider Basic Info */}
          <Box sx={{ mb: 3 }}>
            {/* Helper to get nested NPI Validation data */}
            {(() => {
              const npiValidation =
                searchResult.rawValidation.rawApiResponse?.rawApiResponse?.[
                  "NPI Validation"
                ] ||
                searchResult.rawValidation.rawApiResponse?.["NPI Validation"] ||
                {};
              return (
                <>
                  <Typography
                    variant="h6"
                    sx={{ color: "text.primary", mb: 1, fontWeight: "medium" }}
                  >
                    Provider:{" "}
                    {searchResult.rawValidation.npiDetails?.providerName ||
                      searchResult.rawValidation.providerName ||
                      npiValidation.providerName ||
                      "N/A"}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ color: "text.secondary" }}
                  >
                    NPI:{" "}
                    {searchResult.rawValidation.npiDetails?.npi ||
                      searchResult.rawValidation.npi ||
                      npiValidation.npi ||
                      "N/A"}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ color: "text.secondary" }}
                  >
                    Provider Type:{" "}
                    {searchResult.rawValidation.npiDetails?.providerType ||
                      searchResult.rawValidation.providerType ||
                      npiValidation.licenses?.[0]?.code?.split(" - ")?.[1] ||
                      "N/A"}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ color: "text.secondary" }}
                  >
                    Entity Type:{" "}
                    {searchResult.rawValidation.npiDetails?.entityType ||
                      searchResult.rawValidation.entityType ||
                      npiValidation.entityType ||
                      "N/A"}
                  </Typography>
                </>
              );
            })()}
          </Box>

          {/* License Requirements */}
          <RequirementList
            requirements={searchResult.requirements}
            requirementOrder={REQUIREMENT_ORDER}
          />

          {/* Contact Information */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Contact Information
            </Typography>
            {(() => {
              // Handle nested rawApiResponse structure
              const innerRawApiResponse =
                searchResult.rawValidation.rawApiResponse?.rawApiResponse ||
                searchResult.rawValidation.rawApiResponse ||
                {};
              const npiValidation = innerRawApiResponse["NPI Validation"] || {};

              return (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "medium" }}
                    >
                      Mailing Address:
                    </Typography>
                    <Typography variant="body2">
                      {npiValidation.mailingAddress || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      Phone: {npiValidation.mailingPhone || "N/A"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "medium" }}
                    >
                      Practice Address:
                    </Typography>
                    <Typography variant="body2">
                      {npiValidation.practiceAddress || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      Phone: {npiValidation.practicePhone || "N/A"}
                    </Typography>
                  </Box>
                </>
              );
            })()}
          </Box>

          {/* Verification Status */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Verification Status
            </Typography>
            {(() => {
              // Handle nested rawApiResponse structure
              const innerRawApiResponse =
                searchResult.rawValidation.rawApiResponse?.rawApiResponse ||
                searchResult.rawValidation.rawApiResponse ||
                {};
              const exclusions = innerRawApiResponse.Exclusions || [];
              const preclusions =
                innerRawApiResponse["CMS Preclusion List"] || [];
              const optOut = innerRawApiResponse["Opt Out"] || {};

              return (
                <>
                  <Typography
                    variant="body2"
                    color={exclusions.length ? "error.main" : "success.main"}
                  >
                    Exclusions: {exclusions.length ? "Found" : "None"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={preclusions.length ? "error.main" : "success.main"}
                  >
                    Preclusions: {preclusions.length ? "Found" : "None"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      Object.keys(optOut).length ? "error.main" : "success.main"
                    }
                  >
                    Opt Out: {Object.keys(optOut).length ? "Yes" : "No"}
                  </Typography>
                </>
              );
            })()}
          </Box>

          {/* Last Updated */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "medium" }}>
              Last Updated:
            </Typography>
            <Typography variant="body2">
              {searchResult.rawValidation.npiDetails?.updateDate || "N/A"}
            </Typography>
          </Box>
        </Alert>
      )}

      {searchResult?.rawValidation && (
        <Accordion sx={{ mt: 4 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="raw-response-content"
            id="raw-response-header"
          >
            <Typography variant="h6">Raw API Response</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Paper
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                maxHeight: "400px",
                overflow: "auto",
                "& pre": {
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  overflowY: "auto",
                },
              }}
            >
              <pre>{JSON.stringify(searchResult.rawValidation, null, 2)}</pre>
            </Paper>
          </AccordionDetails>
        </Accordion>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
