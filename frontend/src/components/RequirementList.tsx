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

    // Verification Required chip - exclude NPI requirements
    const isNPIRequirement = 
      (requirement.requirement_type?.toLowerCase().includes('npi') || 
       requirement.type?.toLowerCase().includes('npi') ||
       requirement.name?.toLowerCase().includes('national provider identifier'));

    if (!isNPIRequirement && requirement.status !== 'valid' && (!requirement.details || requirement.details.length === 0)) {
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
    const normalizedType = (requirementType || '').toLowerCase().replace(/\s+/g, '_');
    const detailData = detail.details || detail;

    // Debug logging for all details
    console.group(`Formatting Detail for ${requirementType}`);
    console.log('Raw Detail:', detail);
    console.log('Detail Data:', detailData);
    console.log('Normalized Type:', normalizedType);
    console.log('Additional Info:', detailData.additionalInfo);
    console.groupEnd();

    if (normalizedType === 'national_provider_identifier' || normalizedType === 'npi') {
      return {
        number: detailData.number || 'Not Available',
        status: detailData.status || 'Unknown',
        isNPI: true
      } as NPIDetailType;
    }

    // Handle licenses (State License, DEA)
    if (normalizedType === 'dea_registration' || normalizedType.includes('dea')) {
      const deaDetail = {
        issuer: detailData.issuer || 'Unknown',
        type: detailData.type || 'Unknown',
        number: detailData.number || 'Not Available',
        status: detailData.status || 'Unknown',
        expirationDate: detailData.expirationDate || null,
        boardActions: detailData.boardActions || [],
        hasBoardAction: Boolean(detailData.hasBoardAction),
        additionalInfo: detailData.additionalInfo // Pass through additionalInfo directly
      } as LicenseDetailType;

      // Debug logging for DEA details
      console.group('DEA Detail Debug');
      console.log('DEA Detail:', deaDetail);
      console.log('Additional Info:', deaDetail.additionalInfo);
      console.groupEnd();

      return deaDetail;
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
    <List sx={{ 
      width: '100%',
      padding: 0,
      '& .MuiListItem-root': {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: '12px 0'
      }
    }}>
      {sortedRequirements.map((requirement, index) => (
        <ListItem
          key={requirement.id || index}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            width: '100%',
            gap: 2,
            '& > .MuiBox-root': { 
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }
          }}
        >
          <Box component="div" sx={{ 
            display: 'flex',
            justifyContent: 'center',
            minWidth: '24px',
            pt: '4px'
          }}>
            {getStatusIcon(requirement.status)}
          </Box>
          <Box component="div" sx={{ 
            flexGrow: 1,
            width: 'calc(100% - 40px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            <Box component="div" sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              gap: 1
            }}>
              <Typography 
                component="span" 
                variant="body1"
                sx={{ 
                  fontWeight: 'medium'
                }}
              >
                {requirement.name}
              </Typography>
              {getStatusChips(requirement)}
            </Box>
            <Box component="div" sx={{ 
              width: '100%',
              pl: 0
            }}>
              {requirement.details?.map((detail: ValidationDetail, detailIndex: number) => (
                <Box 
                  component="div" 
                  key={`${requirement.id}-${detailIndex}`}
                  sx={{ width: '100%' }}
                >
                  <RequirementDetail
                    detail={formatDetailForDisplay(detail, requirement.requirement_type || requirement.type || '')}
                    requirementType={requirement.requirement_type || requirement.type || ''}
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