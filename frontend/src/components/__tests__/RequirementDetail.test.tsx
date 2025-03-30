import React from 'react';
import { render, screen } from '@testing-library/react';
import { RequirementDetail, NPIDetailType } from '../RequirementDetail';

describe('RequirementDetail', () => {
  describe('NPI Requirement', () => {
    const baseNPIDetail: NPIDetailType = {
      number: '1669437901',
      status: 'Active'
    };

    it('should render verified NPI correctly', () => {
      const verifiedNPI: NPIDetailType = {
        ...baseNPIDetail,
        verification_status: 'verified'
      };

      render(
        <RequirementDetail
          detail={verifiedNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText('NPI:')).toBeInTheDocument();
      expect(screen.getByText('1669437901')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.queryByText('Verification Required')).not.toBeInTheDocument();
      expect(screen.getByTestId('npi-status')).toHaveClass('MuiSvgIcon-colorSuccess');
    });

    it('should show verification required for unverified NPI', () => {
      const unverifiedNPI: NPIDetailType = {
        ...baseNPIDetail,
        verification_status: 'pending'
      };

      render(
        <RequirementDetail
          detail={unverifiedNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText('Verification Required')).toBeInTheDocument();
      expect(screen.getByTestId('npi-status')).not.toHaveClass('MuiSvgIcon-colorSuccess');
    });

    it('should show error state for failed verification', () => {
      const failedNPI: NPIDetailType = {
        ...baseNPIDetail,
        status: 'Inactive',
        verification_status: 'failed'
      };

      render(
        <RequirementDetail
          detail={failedNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByTestId('npi-status')).toHaveClass('MuiSvgIcon-colorError');
    });
  });
}); 