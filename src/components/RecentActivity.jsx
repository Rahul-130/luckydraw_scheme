import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Skeleton,
  Box,
  Pagination,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getRecentActivity } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { EmojiEvents, Receipt } from '@mui/icons-material';

const RecentActivity = () => {
  const { token } = useAuth();
  const [activity, setActivity] = useState({
    items: [],
    loading: true,
    pagination: { page: 1, totalPages: 1 },
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActivity = async () => {
      if (!token) return;
      setActivity(prev => ({ ...prev, loading: true }));
      try {
        const response = await getRecentActivity(token, activity.pagination.page, 5); // Fetch 5 items per page
        setActivity(prev => ({
          ...prev,
          items: response.data.activities,
          pagination: { ...prev.pagination, totalPages: response.data.totalPages },
        }));
      } catch (err) {
        setError('Failed to load recent activity.');
      } finally {
        setActivity(prev => ({ ...prev, loading: false }));
      }
    };
    fetchActivity();
  }, [token, activity.pagination.page]);

  const renderActivityItem = (item, index) => {
    const isWinner = item.ACTIVITY_TYPE === 'winner';
    const title = isWinner
      ? `${item.CUSTOMER_NAME} won in ${item.BOOK_NAME}`
      : `Payment of ₹${item.AMOUNT.toLocaleString('en-IN')} from ${item.CUSTOMER_NAME}`;
    const subtitle = isWinner ? 'Lucky Draw Winner' : `Book: ${item.BOOK_NAME}`;

    return (
      <ListItem key={index} divider={index < activity.items.length - 1}>
        <Avatar sx={{ bgcolor: isWinner ? 'success.main' : 'primary.main', mr: 2 }}>
          {isWinner ? <EmojiEvents /> : <Receipt />}
        </Avatar>
        <ListItemText primary={title} secondary={subtitle} primaryTypographyProps={{ fontWeight: 'medium' }} />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
          {formatDistanceToNow(new Date(item.ACTIVITY_DATE), { addSuffix: true })}
        </Typography>
      </ListItem>
    );
  };

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2, mt: 4, fontWeight: '500', color: '#000' }}>
        Recent Activity
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        {activity.loading ? (
          <List>
            {[...Array(5)].map((_, i) => (
              <ListItem key={i}>
                <Skeleton variant="circular" sx={{ mr: 2 }}><Avatar /></Skeleton>
                <ListItemText primary={<Skeleton width="40%" />} secondary={<Skeleton width="25%" />} />
              </ListItem>
            ))}
          </List>
        ) : error ? (
          <Typography color="error" textAlign="center">{error}</Typography>
        ) : activity.items.length > 0 ? (
          <>
            <List disablePadding>{activity.items.map(renderActivityItem)}</List>
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Pagination count={activity.pagination.totalPages} page={activity.pagination.page} onChange={(e, value) => setActivity(prev => ({ ...prev, pagination: { ...prev.pagination, page: value } }))} />
            </Box>
          </>
        ) : (
          <Typography color="text.secondary" textAlign="center">No recent activity.</Typography>
        )}
      </Paper>
    </>
  );
};

export default RecentActivity;
