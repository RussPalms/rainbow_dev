import React from 'react';
import { RewardsTitle } from '@/screens/rewards/components/RewardsTitle';
import { RewardsTotalEarnings } from '@/screens/rewards/components/RewardsTotalEarnings';
import { RewardsResponseType } from '@/screens/rewards/types/RewardsResponseType';
import { RewardsPendingEarnings } from '@/screens/rewards/components/RewardsPendingEarnings';
import { RewardsStats } from './RewardsStats';

type Props = { data: RewardsResponseType };

export const RewardsContent: React.FC<Props> = ({ data }) => {
  return (
    <>
      <RewardsTitle text={data.meta.title} />
      <RewardsTotalEarnings
        totalEarningsUsd={data.earnings.total.usd}
        multiplier={data.earnings.multiplier.amount}
        totalEarningsToken={data.earnings.total.token}
        tokenImageUrl={data.meta.token.asset.icon_url}
        tokenSymbol={data.meta.token.asset.symbol}
      />
      <RewardsPendingEarnings
        pendingEarningsUsd={data.earnings.pending.usd}
        nextAirdropTimestamp={data.meta.next_distribution}
      />
      <RewardsStats
        position={data.stats.position.current}
        positionChange={data.stats.position.change['24h']}
        actions={data.stats.actions}
      />
    </>
  );
};
