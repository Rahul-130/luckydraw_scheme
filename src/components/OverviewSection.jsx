import React from 'react';
import { Typography } from '@mui/material';
import ComparisonStatCard from './ComparisonStatCard';
import SkeletonCard from './SkeletonCard';

const OverviewSection = ({ title, loading, stats, period }) => {
  const statKeys = ['all', 'online', 'cash', 'instore'];

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: '500', color: '#333' }}>
        {title}
      </Typography>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            {statKeys.map((key) => (
              <ComparisonStatCard
                key={`${key}-amount`}
                title={`${key.charAt(0).toUpperCase() + key.slice(1)} Amount`}
                value={stats?.[key]?.current?.amount || 0}
                prevValue={stats?.[key]?.previous?.amount || 0}
                period={period}
              />
            ))}
            {statKeys.map((key) => (
              <ComparisonStatCard
                key={`${key}-count`}
                title={`${key.charAt(0).toUpperCase() + key.slice(1)} Payments`}
                value={stats?.[key]?.current?.count || 0}
                prevValue={stats?.[key]?.previous?.count || 0}
                period={period}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default OverviewSection;
