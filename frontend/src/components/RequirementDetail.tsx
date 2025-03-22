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
import { formatExpirationDate } from '../utils/eligibilityProcessor';

interface DetailType {
  issuer: string;
  type: string;
  number: string;
  status: string;
  expirationDate: string | null;
  boardActions: string[];
  hasBoardAction: boolean;
}

interface RequirementDetailProps {
  detail: DetailType;
  isMultiple?: boolean;
  index?: number;
  totalItems?: number;
}

export const RequirementDetail: React.FC<RequirementDetailProps> = ({
  detail,
  isMultiple,
  index,
  totalItems
}) => {
  const hasBoardActions = detail.boardActions?.length && detail.hasBoardAction;
  const isActive = detail.status?.toLowerCase() === 'active';

  const getStatusColor = () => {
    if (!detail.status) return 'text.primary';
    if (isActive) return 'success.main';
    return 'error.main';
  };

  const shouldDisplayField = (value: any): boolean => {
    // Handle numeric values (including string numbers)
    if (typeof value === 'number' || !isNaN(Number(value))) {
      return false;
    }

    // Handle null/undefined/empty
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;

    // Handle default values
    if (value === 'Unknown' || value === 'Not Available') return false;

    return true;
  };

  return (
    <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
      {hasBoardActions && (
        <Chip
          icon={<WarningIcon />}
          label="Board Actions Present"
          color="warning"
          size="small"
          sx={{ mb: 1 }}
        />
      )}

      {shouldDisplayField(detail.issuer) && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Issuer:</strong> {detail.issuer}
        </Typography>
      )}
      {shouldDisplayField(detail.type) && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Type:</strong> {detail.type}
        </Typography>
      )}
      {shouldDisplayField(detail.number) && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Number:</strong> {detail.number}
        </Typography>
      )}
      {shouldDisplayField(detail.status) && (
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 0.5,
            color: getStatusColor()
          }}
        >
          <strong>Status:</strong> {detail.status}
        </Typography>
      )}
      {detail.expirationDate && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Expiration Date:</strong> {formatExpirationDate(detail.expirationDate)}
        </Typography>
      )}
      
      {hasBoardActions && detail.boardActions && detail.boardActions.length > 0 && (
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
      )}
      
      {isMultiple && index !== undefined && totalItems !== undefined && index < totalItems - 1 && (
        <Divider sx={{ my: 2 }} />
      )}
    </Box>
  );
}; 