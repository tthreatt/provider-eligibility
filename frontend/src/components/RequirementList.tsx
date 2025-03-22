import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import { Requirement } from '../types/eligibility';
import { RequirementDetail } from './RequirementDetail';
import type { BaseDetailType, LicenseDetailType, CertificationDetailType, NPIDetailType, DetailType } from './RequirementDetail';

interface RequirementListProps {
  requirements: Requirement[];
  requirementOrder: string[];
}

interface ValidationDetail {
  issuer?: string;
  type?: string;
  number?: string;
  status?: string;
  expirationDate?: string;
  boardActions?: string[];
  hasBoardAction?: boolean;
  additionalInfo?: {
    deaSchedules?: string;
    licenseState?: string;
  };
  multipleDetails?: ValidationDetail[];
}

export const RequirementList: React.FC<RequirementListProps> = ({
  requirements,
  requirementOrder
}) => {
  const sortedRequirements = [...requirements].sort((a, b) => {
    const aIndex = requirementOrder.indexOf(a.name);
    const bIndex = requirementOrder.indexOf(b.name);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  const getStatusIcon = (requirement: Requirement) => {
    if (requirement.is_valid) {
      return <CheckIcon sx={{ color: 'success.main' }} />;
    }
    return <CloseIcon sx={{ color: requirement.is_required ? 'error.main' : 'warning.main' }} />;
  };

  const getStatusChips = (requirement: Requirement) => {
    const chips = [];
    
    // Board Actions chip
    if (requirement.details?.boardActions?.length || 
        requirement.details?.multipleDetails?.some(d => d.boardActions?.length)) {
      chips.push(
        <Chip
          key="board-actions"
          icon={<WarningIcon />}
          label="Board Actions"
          color="warning"
          size="small"
        />
      );
    }
    
    // Verification Required chip
    const needsVerification = !requirement.is_valid && !requirement.details;
    if (needsVerification) {
      chips.push(
        <Chip
          key="verification"
          icon={<WarningIcon />}
          label="Verification Required"
          color="warning"
          size="small"
        />
      );
    }
    
    return chips;
  };

  const formatDetailForDisplay = (detail: ValidationDetail, requirementType: string): DetailType => {
    const normalizedType = requirementType.toLowerCase().replace(/\s+/g, '_');

    if (normalizedType === 'national_provider_identifier' || normalizedType === 'npi') {
      return {
        number: detail.number || 'Not Available',
        status: detail.status || 'Unknown'
      } as NPIDetailType;
    }

    if (normalizedType === 'board_certification') {
      return {
        type: detail.type || 'Unknown',
        issuer: detail.issuer || 'Unknown',
        number: detail.number || 'Not Available',
        status: detail.status || 'Unknown',
        expirationDate: detail.expirationDate || null,
        boardActions: Array.isArray(detail.boardActions) ? detail.boardActions : [],
        hasBoardAction: Boolean(detail.hasBoardAction)
      } as CertificationDetailType;
    }

    // Handle licenses (State License, DEA)
    if (normalizedType === 'dea_registration' || normalizedType.includes('dea')) {
      return {
        issuer: detail.issuer || 'Unknown',
        type: detail.type || 'Unknown',
        number: detail.number || 'Not Available',
        status: detail.status || 'Unknown',
        expirationDate: detail.expirationDate || null,
        boardActions: Array.isArray(detail.boardActions) ? detail.boardActions : [],
        hasBoardAction: Boolean(detail.hasBoardAction),
        additionalInfo: {
          deaSchedules: detail.additionalInfo?.deaSchedules,
          licenseState: detail.additionalInfo?.licenseState
        }
      } as LicenseDetailType;
    }

    // Handle licenses (State License, DEA)
    return {
      issuer: detail.issuer || 'Unknown',
      type: detail.type || 'Unknown',
      number: detail.number || 'Not Available',
      status: detail.status || 'Unknown',
      expirationDate: detail.expirationDate || null,
      boardActions: Array.isArray(detail.boardActions) ? detail.boardActions : [],
      hasBoardAction: Boolean(detail.hasBoardAction)
    } as LicenseDetailType;
  };

  return (
    <List sx={{ width: '100%' }}>
      {sortedRequirements.map((requirement) => (
        <ListItem key={requirement.id} sx={{ px: 0 }}>
          <ListItemIcon>
            {getStatusIcon(requirement)}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {requirement.name}
                {getStatusChips(requirement).map(chip => (
                  <Box key={chip.key} sx={{ ml: 1 }}>
                    {chip}
                  </Box>
                ))}
              </Box>
            }
            secondary={
              <Box component="div">
                <Typography component="div" variant="body2">
                  {requirement.description}
                </Typography>
                {requirement.details && (
                  <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                    {requirement.details.multipleDetails ? (
                      requirement.details.multipleDetails.map((detail, index) => (
                        <RequirementDetail
                          key={index}
                          detail={formatDetailForDisplay(detail, requirement.name)}
                          requirementType={requirement.name}
                          isMultiple
                          index={index}
                          totalItems={requirement.details?.multipleDetails?.length ?? 0}
                        />
                      ))
                    ) : (
                      <RequirementDetail 
                        detail={formatDetailForDisplay(requirement.details, requirement.name)}
                        requirementType={requirement.name}
                      />
                    )}
                  </Box>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}; 