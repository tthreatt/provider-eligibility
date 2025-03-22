import React from 'react';
import {
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import { formatExpirationDate } from '../utils/eligibilityProcessor';

export interface BaseDetailType {
  type: string;
  issuer: string;
  boardActions?: string[];
  hasBoardAction?: boolean;
}

export interface LicenseDetailType extends BaseDetailType {
  number: string;
  status: string;
  expirationDate: string | null;
  additionalInfo?: {
    deaSchedules?: string;
    licenseState?: string;
  };
}

export interface CertificationDetailType extends BaseDetailType {
  number: string;
  status: string;
  expirationDate: string | null;
}

export interface NPIDetailType {
  number: string;
  status: string;
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
  if (!shouldDisplayField(value)) return null;

  return (
    <Typography 
      variant="body2"
      sx={isStatus ? { color: isActive ? 'success.main' : 'error.main' } : undefined}
    >
      <strong>{label}:</strong> {value}
      {isStatus && isActive && (
        <CheckIcon sx={{ ml: 1, fontSize: '1rem', color: 'success.main', verticalAlign: 'text-bottom' }} />
      )}
    </Typography>
  );
};

const DetailWrapper: React.FC<{
  children: React.ReactNode;
  isMultiple?: boolean;
  index?: number;
  totalItems?: number;
}> = ({ children, isMultiple, index, totalItems }) => (
  <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
    {children}
    {isMultiple && index !== undefined && totalItems !== undefined && index < totalItems - 1 && (
      <Divider sx={{ my: 2 }} />
    )}
  </Box>
);

export const RequirementDetail: React.FC<RequirementDetailProps> = ({
  detail,
  requirementType,
  isMultiple,
  index,
  totalItems
}) => {
  const normalizedType = requirementType.toLowerCase().replace(/\s+/g, '_');

  const isNPIRequirement = (type: string): boolean => 
    type === 'national_provider_identifier' || type === 'npi';

  const isDEARequirement = (type: string): boolean => 
    type === 'controlled_substance_registration' || type.includes('dea');

  if (isNPIRequirement(normalizedType)) {
    const npiDetail = detail as NPIDetailType;
    return (
      <DetailWrapper>
        <DetailField 
          label="NPI"
          value={npiDetail.number}
          isStatus={true}
          isActive={npiDetail.status === 'Active'}
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
      </DetailWrapper>
    );
  }

  const licenseDetail = detail as LicenseDetailType;
  const isActive = licenseDetail.status?.toLowerCase() === 'active';

  if (isDEARequirement(normalizedType)) {
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
        <DetailField 
          label="Expiration Date"
          value={formatExpirationDate(licenseDetail.expirationDate)}
        />
        <DetailField 
          label="DEA Schedules"
          value={licenseDetail.additionalInfo?.deaSchedules}
        />
        <DetailField 
          label="License State"
          value={licenseDetail.additionalInfo?.licenseState}
        />
      </DetailWrapper>
    );
  }

  // Handle State License
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
      <DetailField 
        label="Expiration Date"
        value={formatExpirationDate(licenseDetail.expirationDate)}
      />
      {renderBoardActions(licenseDetail)}
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

const renderBoardActions = (detail: BaseDetailType) => {
  const hasBoardActions = detail.boardActions?.length && detail.hasBoardAction;
  
  if (!hasBoardActions || !detail.boardActions) return null;
  
  return (
    <Accordion sx={{ mt: 1 }}>
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: 'background.paper',
          '&:hover': {
            backgroundColor: 'background.paper',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography color="warning.dark" fontWeight="medium">
            Board Actions History
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {detail.boardActions.map((action, actionIndex) => (
            <ListItem key={actionIndex} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ListItemIcon sx={{ mt: 0.5 }}>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary={action}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: 'medium',
                    color: 'text.primary'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}; 