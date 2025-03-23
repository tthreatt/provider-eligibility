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
import { CheckCircle, Cancel } from '@mui/icons-material';
import { generateDetailTestId } from '../utils/testUtils';

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
  if (!value) return null;

  return (
    <Box 
      component="div" 
      sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        mt: 1,
        '& > *': { margin: 0 }
      }}
      data-testid={generateDetailTestId(label, value)}
    >
      <Typography 
        component="span" 
        variant="body1" 
        sx={{ 
          fontWeight: 'bold', 
          mr: 1,
          display: 'inline' 
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
            variant="body1" 
            sx={{ display: 'inline' }}
          >
            {value}
          </Typography>
          {isActive ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
        </Box>
      ) : (
        <Typography 
          component="span" 
          variant="body1" 
          sx={{ display: 'inline' }}
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
  <Box component="div" sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
    {children}
    {isMultiple && index !== undefined && totalItems !== undefined && index < totalItems - 1 && (
      <Divider sx={{ my: 2 }} />
    )}
  </Box>
);

const renderBoardActions = (actions?: string[]) => {
  if (!actions || actions.length === 0) return null;

  return (
    <Box component="div" sx={{ mt: 2 }}>
      <Typography 
        component="div" 
        variant="h6" 
        gutterBottom
        data-testid="board-actions-title"
      >
        Board Actions History
      </Typography>
      <List>
        {actions.map((action, idx) => (
          <ListItem key={idx}>
            <ListItemIcon>
              <WarningIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={action}
              data-testid={`board-action-${idx + 1}-text`}
            />
          </ListItem>
        ))}
      </List>
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
        {renderBoardActions(certDetail.boardActions)}
      </DetailWrapper>
    );
  }

  if (normalizedType === 'state_license') {
    const licenseDetail = detail as LicenseDetailType;
    return (
      <DetailWrapper isMultiple={isMultiple} index={index} totalItems={totalItems}>
        <DetailField label="Issuer" value={licenseDetail.issuer} />
        <DetailField label="Type" value={licenseDetail.type} />
        <DetailField label="Number" value={licenseDetail.number} />
        <DetailField 
          label="Status"
          value={licenseDetail.status}
          isStatus={true}
          isActive={licenseDetail.status?.toLowerCase() === 'active'}
        />
        <DetailField 
          label="Expiration Date"
          value={formatExpirationDate(licenseDetail.expirationDate)}
        />
        {renderBoardActions(licenseDetail.boardActions)}
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