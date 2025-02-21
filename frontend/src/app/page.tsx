"use client"

import { useState } from "react"
import { Container, Typography } from "@mui/material"
import { RuleList } from "@/components/RuleList"
import { AddRuleForm } from "@/components/AddRuleForm"
import { ViewToggle } from "@/components/ViewToggle"
import { NPISearch } from "@/components/NPISearch"
import { SignedIn, SignedOut } from "@clerk/nextjs"

// Add the interface for type safety
interface SearchResult {
  isEligible: boolean
  requirements: {
    stateLicense: boolean
    deaCds: boolean
    boardCertification: boolean
    providerType: string
  }
}

export default function Home() {
  const [currentView, setCurrentView] = useState<"admin" | "search">("admin")
  const [loading, setLoading] = useState(false)

  const handleSearch = async (npi: string): Promise<SearchResult> => {
    setLoading(true)
    try {
      const response = await fetch('/api/fetch-provider-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npi }),
        credentials: 'include'  // Add this to ensure cookies are sent
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch provider data');
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;

    } catch (error) {
      console.error('Search error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <SignedIn>
        <ViewToggle currentView={currentView} onToggle={setCurrentView} />

        {currentView === "admin" ? (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Provider Credentialing Rules
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Manage provider types and their credentialing requirements.
            </Typography>
            <AddRuleForm />
            <RuleList />
          </>
        ) : (
          <>
            <Typography variant="h4" component="h1" gutterBottom>
              Provider Eligibility Search
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Check provider eligibility by entering their NPI number.
            </Typography>
            <NPISearch onSearch={handleSearch} loading={loading} />
          </>
        )}
      </SignedIn>

      <SignedOut>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Provider Credentialing
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Please sign in to access the application.
        </Typography>
      </SignedOut>
    </Container>
  )
}

