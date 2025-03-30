import React from 'react';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import { formatExpirationDate } from '../utils/eligibilityProcessor';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { generateDetailTestId } from '../utils/testUtils';

const isDEARequirement = (type: string, detail?: DetailType): boolean => {
  const normalizedType = type.toLowerCase();
  const isTypeMatch = normalizedType === 'controlled_substance_registration' || 
                     normalizedType === 'dea_registration' ||
                     normalizedType.includes('dea') ||
                     normalizedType === 'registration';

  if (!isTypeMatch) return false;

  // If we have a detail object, check additional fields
  if (detail) {
    const licenseDetail = detail as LicenseDetailType;
    return licenseDetail.issuer === 'DEA' || 
           licenseDetail.type?.includes('DEA') ||
           licenseDetail.type?.includes('Drug Enforcement Administration');
  }

  return isTypeMatch;
};

export interface BaseDetailType {
  type: string;
  issuer: string;
}

export interface BoardActionDetailType extends BaseDetailType {
  boardActions: string[];
  hasBoardAction: boolean;
}

export interface LicenseDetailType extends BoardActionDetailType {
  number: string;
  status: string;
  expirationDate: string | null;
  additionalInfo?: {
    deaSchedules?: string;
    licenseState?: string;
  };
}

export interface CertificationDetailType extends BoardActionDetailType {
  number: string;
  status: string;
  expirationDate: string | null;
}

export interface NPIDetailType {
  number: string;
  status: string;
  isNPI: boolean;
}

export type DetailType = LicenseDetailType | CertificationDetailType | NPIDetailType;

interface RequirementDetailProps {
  detail: DetailType;
  requirementType: string;
  isMultiple?: boolean;
  index?: number;
  totalItems?: number;
}

interface DetailFieldProps {
  label: string;
  value: string | null | undefined;
  isStatus?: boolean;
  isActive?: boolean;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, isStatus, isActive }) => {
  if (!value) return null;

  return (
    <Box 
      component="div" 
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: 1,
        width: '100%',
        mb: 0.5
      }}
      data-testid={generateDetailTestId(label, value)}
    >
      <Typography 
        component="span" 
        variant="body2" 
        sx={{ 
          fontWeight: 'medium',
          color: 'text.secondary',
          minWidth: '120px'
        }}
      >
        {label}:
      </Typography>
      {isStatus ? (
        <Box 
          component="span"
          sx={{ 
            color: isActive ? 'success.main' : 'error.main',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Typography 
            component="span" 
            variant="body2"
          >
            {value}
          </Typography>
          {isActive ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
        </Box>
      ) : (
        <Typography 
          component="span" 
          variant="body2"
        >
          {value}
        </Typography>
      )}
    </Box>
  );
};

const DetailWrapper: React.FC<{
  children: React.ReactNode;
  isMultiple?: boolean;
  index?: number;
  totalItems?: number;
}> = ({ children, isMultiple, index, totalItems }) => (
  <Box 
    component="div" 
    sx={{ 
      width: '100%',
      mb: 2,
      '&:last-child': { mb: 0 }
    }}
  >
    {children}
    {isMultiple && index !== undefined && totalItems !== undefined && index < totalItems - 1 && (
      <Divider sx={{ my: 2 }} />
    )}
  </Box>
);

const renderBoardActions = (actions?: string[]) => {
  // Debug logging
  console.group('Board Actions Debug');
  console.log('Received actions:', actions);
  console.groupEnd();

  if (!actions || actions.length === 0) {
    console.log('No board actions to render');
    return null;
  }

  return (
    <Box component="div" sx={{ mt: 2, width: '100%' }}>
      <MuiAccordion defaultExpanded disableGutters>
        <MuiAccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="board-actions-content"
          id="board-actions-header"
          sx={{ 
            bgcolor: 'white',
            '& .MuiAccordionSummary-content': {
              margin: '4px 0'
            },
            '&.Mui-expanded': {
              minHeight: '48px',
              bgcolor: 'white'
            },
            '&:hover': {
              bgcolor: 'white'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" fontSize="small" />
            <Typography 
              component="div" 
              variant="subtitle1"
              sx={{ color: 'warning.dark', fontWeight: 'medium' }}
              data-testid="board-actions-title"
            >
              Board Actions History
            </Typography>
          </Box>
        </MuiAccordionSummary>
        <MuiAccordionDetails sx={{ pt: 0, pb: 1 }}>
          <List sx={{ width: '100%', pl: 0 }}>
            {actions.map((action, idx) => (
              <ListItem 
                key={idx} 
                sx={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '8px 0',
                  width: '100%'
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={action}
                  data-testid={`board-action-${idx + 1}-text`}
                  sx={{ 
                    margin: 0,
                    '& .MuiTypography-root': {
                      wordBreak: 'break-word'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </MuiAccordionDetails>
      </MuiAccordion>
    </Box>
  );
};

export const RequirementDetail: React.FC<RequirementDetailProps> = ({
  detail,
  requirementType,
  isMultiple,
  index,
  totalItems
}) => {
  // Debug logging for the entire detail object
  console.group('RequirementDetail Debug');
  console.log('Detail:', detail);
  console.log('Is DEA:', isDEARequirement(requirementType, detail));
  console.log('Additional Info:', (detail as LicenseDetailType).additionalInfo);
  console.groupEnd();

  const normalizedType = (requirementType || '').toLowerCase().replace(/\s+/g, '_');
  const isNPIRequirement = normalizedType === 'national_provider_identifier' || normalizedType === 'npi';
  const isDEA = isDEARequirement(requirementType, detail);
  
  // Handle NPI display
  if ((detail as NPIDetailType).isNPI) {
    const npiDetail = detail as NPIDetailType;
    return (
      <DetailWrapper isMultiple={isMultiple} index={index} totalItems={totalItems}>
        <DetailField 
          label="Number" 
          value={npiDetail.number} 
        />
        <DetailField 
          label="Status" 
          value={npiDetail.status} 
          isStatus={true}
          isActive={npiDetail.status?.toLowerCase() === 'active'}
        />
      </DetailWrapper>
    );
  }

  if (normalizedType === 'board_certification') {
    const certDetail = detail as CertificationDetailType;
    return (
      <DetailWrapper isMultiple={isMultiple} index={index} totalItems={totalItems}>
        <DetailField label="Issuer" value={certDetail.issuer} />
        <DetailField label="Type" value={certDetail.type} />
        <DetailField label="Number" value={certDetail.number} />
        <DetailField 
          label="Status"
          value={certDetail.status}
          isStatus={true}
          isActive={certDetail.status?.toLowerCase() === 'active'}
        />
        <DetailField 
          label="Expiration Date"
          value={formatExpirationDate(certDetail.expirationDate)}
        />
        {renderBoardActions(certDetail.boardActions)}
      </DetailWrapper>
    );
  }

  const licenseDetail = detail as LicenseDetailType;
  const isActive = licenseDetail.status?.toLowerCase() === 'active';

  return (
    <DetailWrapper isMultiple={isMultiple} index={index} totalItems={totalItems}>
      <DetailField label="Issuer" value={licenseDetail.issuer} />
      <DetailField label="Type" value={licenseDetail.type} />
      <DetailField label="Number" value={licenseDetail.number} />
      <DetailField 
        label="Status"
        value={licenseDetail.status}
        isStatus={true}
        isActive={isActive}
      />
      {isDEA && licenseDetail.additionalInfo?.licenseState && (
        <DetailField 
          label="State"
          value={licenseDetail.additionalInfo.licenseState}
        />
      )}
      {isDEA && licenseDetail.additionalInfo?.deaSchedules && (
        <DetailField 
          label="Schedules"
          value={licenseDetail.additionalInfo.deaSchedules}
        />
      )}
      <DetailField 
        label="Expiration Date"
        value={formatExpirationDate(licenseDetail.expirationDate)}
      />
      {renderBoardActions(licenseDetail.boardActions)}
    </DetailWrapper>
  );
};

const shouldDisplayField = (value: string | number | null | undefined): boolean => {
  // Handle numeric values (including string numbers)
  if (typeof value === 'number' || !isNaN(Number(value))) {
    return value !== 0 && value !== '0';
  }

  // Handle null/undefined/empty
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;

  // Handle default values
  if (value === 'Unknown' || value === 'Not Available') return false;

  return true;
};

export default RequirementDetail; 