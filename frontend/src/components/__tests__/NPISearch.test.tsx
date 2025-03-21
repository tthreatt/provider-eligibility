import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NPISearch } from '../NPISearch'
import { useAuth } from '@clerk/nextjs'
import '@testing-library/jest-dom'

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn()
}))

// Mock API responses
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
        expirationDate: '2026-04-01',
        issuer: 'ABMS - American Board of Medical Specialties',
        number: '951561',
        status: 'Active',
        type: 'Internal Medicine Specialty Certificate'
      },
      {
        category: 'state_license',
        expirationDate: '2026-10-31',
        issuer: 'Tennessee',
        number: '50393',
        status: 'Active',
        type: 'Medical Doctor'
      }
    ]
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
      updateDate: '2025-03-13'
    },
    'Licenses': [
      {
        category: 'certification',
        expirationDate: '2025-12-31',
        issuer: 'American Heart Association',
        number: 'CPR123',
        status: 'Active',
        type: 'CPR Certification'
      }
    ]
  },
  requirements: {
    providerType: 'Emergency Medical Service Providers'
  }
}

// Mock eligibility rules
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
        validation_rules: {}
      },
      {
        id: 2,
        name: 'State License',
        requirement_type: 'license',
        description: 'Must have valid state medical license',
        is_required: true,
        validation_rules: {}
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
        validation_rules: {}
      }
    ]
  }
];

// Mock fetch function
global.fetch = jest.fn()

describe('NPISearch Component', () => {
  beforeEach(() => {
    // Mock Clerk auth token
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
    // Mock API responses
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
    
    // Enter NPI and submit
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1104025329' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    // Wait for results with more flexible text matching
    await waitFor(() => {
      // Check board certification is displayed correctly
      const boardCertElements = screen.getAllByText(/board certification/i);
      expect(boardCertElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/valid board certification found/i, { selector: '.MuiTypography-body2' })).toBeInTheDocument();
      expect(screen.getByText(/ABMS - American Board of Medical Specialties/i, { selector: '.MuiTypography-body2' })).toBeInTheDocument();
    })
  })

  it('handles provider with CPR certification correctly', async () => {
    // Mock API responses
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
    
    // Enter NPI and submit
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1234567890' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    // Wait for results with more flexible text matching
    await waitFor(() => {
      // Check CPR certification is displayed correctly
      const cprCertElements = screen.getAllByText(/cpr certification/i);
      expect(cprCertElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/valid cpr certification found/i, { selector: '.MuiTypography-body2' })).toBeInTheDocument();
      expect(screen.getByText(/American Heart Association/i, { selector: '.MuiTypography-body2' })).toBeInTheDocument();
    })
  })

  it('handles API error gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('API Error')))

    render(<NPISearch />)
    
    // Enter NPI and submit
    fireEvent.change(screen.getByLabelText(/Provider NPI/i), {
      target: { value: '1234567890' }
    })
    fireEvent.click(screen.getByRole('button', { name: /check eligibility/i }))

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
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
}) 