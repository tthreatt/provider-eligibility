import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NPISearch } from '../NPISearch'
import { useAuth } from '@clerk/nextjs'
import '@testing-library/jest-dom'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}))

// Enhanced mock data with complete provider information
const mockProviderWithBoardCert = {
  rawApiResponse: {
    'NPI Validation': {
      npi: '1104025329',
      providerName: 'William Martinez',
      updateDate: '2025-03-13',
      entityType: 'Individual',
      enumerationDate: '2006-05-23'
    },
    'Licenses': [
      {
        category: 'board_certification',
        details: {
          expirationDate: '2026-04-01',
          issuer: 'ABMS - American Board of Medical Specialties',
          number: '951561',
          status: 'Active',
          type: 'Internal Medicine Specialty Certificate',
          boardActions: [],
          hasBoardAction: false
        }
      },
      {
        category: 'state_license',
        details: {
          expirationDate: '2026-10-31',
          issuer: 'Tennessee',
          number: '50393',
          status: 'Active',
          type: 'Medical Doctor',
          boardActions: ['Warning issued on 2022-01-15'],
          hasBoardAction: true
        }
      }
    ],
    'Verifications': []
  },
  requirements: {
    providerType: 'Allopathic & Osteopathic Physicians'
  }
}

const mockProviderWithCPRCert = {
  rawApiResponse: {
    'NPI Validation': {
      npi: '1234567890',
      providerName: 'Jane Smith',
      updateDate: '2025-03-13',
      entityType: 'Individual',
      enumerationDate: '2010-06-15'
    },
    'Licenses': [
      {
        category: 'certification',
        details: {
          expirationDate: '2025-12-31',
          issuer: 'American Heart Association',
          number: 'CPR123',
          status: 'Active',
          type: 'CPR Certification',
          boardActions: [],
          hasBoardAction: false
        }
      }
    ],
    'Verifications': []
  },
  requirements: {
    providerType: 'Emergency Medical Service Providers'
  }
}

// Mock eligibility rules with detailed requirements
const mockEligibilityRules = [
  {
    id: 1,
    name: 'Allopathic & Osteopathic Physicians',
    requirements: [
      {
        id: 1,
        name: 'Board Certification',
        requirement_type: 'certification',
        description: 'Must have valid board certification',
        is_required: true,
        validation_rules: {
          type: ['Internal Medicine', 'Family Medicine', 'Pediatrics'],
          status: ['Active']
        }
      },
      {
        id: 2,
        name: 'State License',
        requirement_type: 'license',
        description: 'Must have valid state medical license',
        is_required: true,
        validation_rules: {
          status: ['Active'],
          type: ['Medical Doctor', 'Doctor of Osteopathy']
        }
      }
    ]
  },
  {
    id: 2,
    name: 'Emergency Medical Service Providers',
    requirements: [
      {
        id: 3,
        name: 'CPR Certification',
        requirement_type: 'certification',
        description: 'Must have valid CPR certification',
        is_required: true,
        validation_rules: {
          type: ['CPR Certification'],
          status: ['Active']
        }
      }
    ]
  }
]

// Mock fetch function
global.fetch = jest.fn()

describe('NPISearch Component', () => {
  beforeEach(() => {
    ;(useAuth as jest.Mock).mockReturnValue({
      getToken: jest.fn().mockResolvedValue('mock-token')
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders search input and button', () => {
    render(<NPISearch />)
    expect(screen.getByLabelText(/Provider NPI/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /check eligibility/i })).toBeInTheDocument()
  })

  it('handles provider with board certification correctly', async () => {
    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProviderWithBoardCert)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEligibilityRules)
      }))

    render(<NPISearch />)
    
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1104025329' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    await waitFor(() => {
      // Provider details
      expect(screen.getByRole('heading', { name: /Provider: William Martinez/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /NPI: 1104025329/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Provider Type: Allopathic & Osteopathic Physicians/i })).toBeInTheDocument()
      
      // Board certification details
      const issuerField = screen.getByTestId('detail-field-issuer-abms-american-board-of-medical-specialties')
      expect(issuerField).toHaveTextContent('ABMS - American Board of Medical Specialties')
      
      const typeField = screen.getByTestId('detail-field-type-internal-medicine-specialty-certificate')
      expect(typeField).toHaveTextContent('Internal Medicine Specialty Certificate')
      
      const numberField = screen.getByTestId('detail-field-number-951561')
      expect(numberField).toHaveTextContent('951561')
      
      // State license details
      const licenseIssuerField = screen.getByTestId('detail-field-issuer-tennessee')
      expect(licenseIssuerField).toHaveTextContent('Tennessee')
      
      const licenseNumberField = screen.getByTestId('detail-field-number-50393')
      expect(licenseNumberField).toHaveTextContent('50393')
      
      // Board Actions
      expect(screen.getByTestId('board-action-1-text')).toHaveTextContent('Warning issued on 2022-01-15')
      
      // Dates
      expect(screen.getByTestId('detail-field-expiration-date-2026-04-01')).toHaveTextContent('2026-04-01')
      expect(screen.getByTestId('detail-field-expiration-date-2026-10-31')).toHaveTextContent('2026-10-31')
    })
  })

  it('handles provider with CPR certification correctly', async () => {
    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProviderWithCPRCert)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEligibilityRules)
      }))

    render(<NPISearch />)
    
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1234567890' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    await waitFor(() => {
      // Provider details
      expect(screen.getByRole('heading', { name: /Provider: Jane Smith/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /NPI: 1234567890/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Provider Type: Emergency Medical Service Providers/i })).toBeInTheDocument()
      
      // CPR certification details
      const issuerField = screen.getByTestId('detail-field-issuer-american-heart-association')
      expect(issuerField).toHaveTextContent('American Heart Association')
      
      const typeField = screen.getByTestId('detail-field-type-cpr-certification')
      expect(typeField).toHaveTextContent('CPR Certification')
      
      const numberField = screen.getByTestId('detail-field-number-cpr123')
      expect(numberField).toHaveTextContent('CPR123')
      
      const expDateField = screen.getByTestId('detail-field-expiration-date-2025-12-31')
      expect(expDateField).toHaveTextContent('2025-12-31')
    })
  })

  it('handles invalid provider type', async () => {
    const mockInvalidProviderType = {
      ...mockProviderWithBoardCert,
      requirements: {
        providerType: 'Invalid Provider Type'
      }
    }

    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockInvalidProviderType)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEligibilityRules)
      }))

    render(<NPISearch />)
    
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1104025329' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    await waitFor(() => {
      expect(screen.getByText(/No matching provider type found/)).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('Failed to fetch provider data'))
    )

    render(<NPISearch />)
    
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1234567890' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch provider data')).toBeInTheDocument()
    })
  })

  it('validates NPI input before submission', () => {
    render(<NPISearch />)
    
    const submitButton = screen.getByRole('button', { name: /check eligibility/i })
    expect(submitButton).toBeDisabled()

    // Enter invalid NPI
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '123' }
    })
    expect(submitButton).toBeDisabled()

    // Enter valid NPI
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1104025329' }
    })
    expect(submitButton).not.toBeDisabled()
  })

  it('displays board actions when present', async () => {
    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProviderWithBoardCert)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockEligibilityRules)
      }))

    render(<NPISearch />)
    
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1104025329' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    await waitFor(() => {
      expect(screen.getByText('Board Actions History')).toBeInTheDocument()
      const boardActionElement = screen.getAllByText(/Warning issued on 2022-01-15/)[0]
      expect(boardActionElement).toBeInTheDocument()
      expect(boardActionElement.closest('.MuiListItemText-primary')).toHaveTextContent(/Warning issued on 2022-01-15/)
    })
  })
}) 