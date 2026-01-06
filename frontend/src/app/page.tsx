"use client";

import { useState } from "react";
import {
  Container,
  Typography,
  Card as MuiCard,
  CardHeader as MuiCardHeader,
  CardContent as MuiCardContent,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { RuleList } from "@/components/RuleList";
import { AddRuleForm } from "@/components/AddRuleForm";
import { ViewToggle } from "@/components/ViewToggle";
import { NPISearch } from "@/components/NPISearch";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Integrations } from "@/components/Integrations";

// Add the interface for type safety
interface SearchResult {
  isEligible: boolean;
  requirements: {
    stateLicense: boolean;
    deaCds: boolean;
    boardCertification: boolean;
    providerType: string;
  };
  rawApiResponse: any;
}

interface NPIValidationResponse {
  "NPI Validation": any;
  Licenses: any;
  rawApiResponse: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Home() {
  const [currentView, setCurrentView] = useState<"admin" | "search">("admin");
  const [adminTabValue, setAdminTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setAdminTabValue(newValue);
  };

  const handleSearch = async (npi: string): Promise<NPIValidationResponse> => {
    setLoading(true);
    try {
      const response = await fetch("/api/fetch-provider-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ npi }),
        credentials: "include", // Add this to ensure cookies are sent
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { error: text || "Failed to fetch provider data" };
          }
        } catch (parseError) {
          console.error(
            "Error parsing error response in handleSearch:",
            parseError
          );
          errorData = { error: "Failed to fetch provider data" };
        }

        const errorMessage =
          errorData.error ||
          errorData.detail ||
          "Failed to fetch provider data";
        console.error("handleSearch error:", {
          status: response.status,
          errorData,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("API Response:", data);
      return {
        "NPI Validation": data["NPI Validation"],
        Licenses: data.Licenses,
        rawApiResponse: data.rawApiResponse,
      };
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const GoogleSignInButton = () => {
    const handleGoogleSignIn = () => {
      // Redirect to sign-in page, which will handle OAuth flow properly
      window.location.href = "/sign-in";
    };

    return (
      <button
        onClick={handleGoogleSignIn}
        className="group flex w-full items-center gap-3 rounded-md border border-gray-300 px-4 py-2.5 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <div className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Continue with Google
          </span>
        </div>
        <ArrowForward className="ml-auto h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SignedIn>
        <ViewToggle currentView={currentView} onToggle={setCurrentView} />

        {currentView === "admin" ? (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Admin Dashboard
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={adminTabValue}
                onChange={handleTabChange}
                aria-label="admin dashboard tabs"
              >
                <Tab label="Provider Rules" />
                <Tab label="Integrations" />
              </Tabs>
            </Box>

            <TabPanel value={adminTabValue} index={0}>
              <AddRuleForm
                onRuleAdded={() => {
                  // This will trigger a refresh of the RuleList
                  // You might want to use a more sophisticated state management solution
                  // like React Query for production
                }}
              />
              <RuleList />
            </TabPanel>

            <TabPanel value={adminTabValue} index={1}>
              <Integrations />
            </TabPanel>
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Provider Eligibility Search
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Check provider eligibility by entering their NPI number.
            </Typography>
            <NPISearch loading={loading} />
          </>
        )}
      </SignedIn>

      <SignedOut>
        <div className="flex justify-center bg-white pt-16">
          <Card className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl transition-shadow duration-300 hover:shadow-2xl">
            <div className="p-8">
              <div className="mb-6">
                <CardTitle className="mb-2 text-3xl font-semibold text-gray-900">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Sign in to continue to Provider Eligibility
                </CardDescription>
              </div>

              <div className="space-y-4">
                <GoogleSignInButton />
              </div>
            </div>
          </Card>
        </div>
      </SignedOut>
    </Container>
  );
}
