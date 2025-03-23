import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  Box,
  Typography,
  Chip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import { Requirement, ValidationDetail } from '../types/eligibility';
import { RequirementDetail } from './RequirementDetail';
import type { BaseDetailType, LicenseDetailType, CertificationDetailType, NPIDetailType, DetailType } from './RequirementDetail';

interface RequirementListProps {
  requirements: Requirement[];
  requirementOrder?: string[];
}

const RequirementList: React.FC<RequirementListProps> = ({ requirements, requirementOrder }) => {
  const getStatusIcon = (status: Requirement['status']) => {
    if (status === 'valid') {
      return <CheckIcon sx={{ color: 'success.main' }} />;
    }
    return <CloseIcon sx={{ color: status === 'required' ? 'error.main' : 'warning.main' }} />;
  };

  const getStatusChips = (requirement: Requirement) => {
    const chips: JSX.Element[] = [];

    // Board Actions chip
    const hasBoardActions = requirement.details?.some(detail => 
      (detail?.boardActions?.length ?? 0) > 0 || detail?.hasBoardAction
    );
    
    if (hasBoardActions) {
      chips.push(
        <Chip
          key="board-actions"
          label="Has Board Actions"
          color="warning"
          size="small"
          data-testid="board-actions-chip"
        />
      );
    }

    // Multiple Details chip
    if (requirement.details?.length > 1) {
      chips.push(
        <Chip
          key="multiple"
          label="Multiple"
          color="info"
          size="small"
          data-testid="multiple-details-chip"
        />
      );
    }

    // Verification Required chip
    if (requirement.status !== 'valid' && (!requirement.details || requirement.details.length === 0)) {
      chips.push(
        <Chip
          key="verification"
          label="Verification Required"
          color="warning"
          size="small"
          data-testid="verification-required-chip"
        />
      );
    }

    return chips;
  };

  const formatDetailForDisplay = (detail: ValidationDetail, requirementType: string): DetailType => {
    const normalizedType = requirementType.toLowerCase().replace(/\s+/g, '_');
    const detailData = detail.details || detail;

    if (normalizedType === 'national_provider_identifier' || normalizedType === 'npi') {
      return {
        number: detailData.number || 'Not Available',
        status: detailData.status || 'Unknown',
        type: 'NPI'
      } as NPIDetailType;
    }

    if (normalizedType === 'board_certification') {
      return {
        type: detailData.type || 'Unknown',
        issuer: detailData.issuer || 'Unknown',
        number: detailData.number || 'Not Available',
        status: detailData.status || 'Unknown',
        expirationDate: detailData.expirationDate || null,
        boardActions: detailData.boardActions || [],
        hasBoardAction: Boolean(detailData.hasBoardAction)
      } as CertificationDetailType;
    }

    // Handle licenses (State License, DEA)
    if (normalizedType === 'dea_registration' || normalizedType.includes('dea')) {
      return {
        issuer: detailData.issuer || 'Unknown',
        type: detailData.type || 'Unknown',
        number: detailData.number || 'Not Available',
        status: detailData.status || 'Unknown',
        expirationDate: detailData.expirationDate || null,
        boardActions: detailData.boardActions || [],
        hasBoardAction: Boolean(detailData.hasBoardAction),
        additionalInfo: {
          deaSchedules: detailData.additionalInfo?.deaSchedules,
          licenseState: detailData.additionalInfo?.licenseState
        }
      } as LicenseDetailType;
    }

    // Handle other licenses and certifications
    return {
      issuer: detailData.issuer || 'Unknown',
      type: detailData.type || 'Unknown',
      number: detailData.number || 'Not Available',
      status: detailData.status || 'Unknown',
      expirationDate: detailData.expirationDate || null,
      boardActions: detailData.boardActions || [],
      hasBoardAction: Boolean(detailData.hasBoardAction)
    } as LicenseDetailType;
  };

  // Sort requirements if requirementOrder is provided
  const sortedRequirements = requirementOrder 
    ? [...requirements].sort((a, b) => {
        const aIndex = requirementOrder.indexOf(a.name);
        const bIndex = requirementOrder.indexOf(b.name);
        return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
      })
    : requirements;

  return (
    <List>
      {sortedRequirements.map((requirement, index) => (
        <ListItem
          key={requirement.id || index}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            '& > .MuiBox-root': { flexGrow: 1 }
          }}
        >
          <Box component="div" sx={{ mt: 0.5, mr: 2 }}>
            {getStatusIcon(requirement.status)}
          </Box>
          <Box component="div" sx={{ flexGrow: 1 }}>
            <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography component="span" variant="body1">
                {requirement.name}
              </Typography>
              {getStatusChips(requirement)}
            </Box>
            <Box component="div" sx={{ mt: 1 }}>
              {requirement.details?.map((detail: ValidationDetail, detailIndex: number) => (
                <Box component="div" key={`${requirement.id}-${detailIndex}`}>
                  <RequirementDetail
                    detail={formatDetailForDisplay(detail, requirement.type)}
                    requirementType={requirement.type}
                    isMultiple={requirement.details?.length > 1}
                    index={detailIndex}
                    totalItems={requirement.details?.length || 0}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default RequirementList; 