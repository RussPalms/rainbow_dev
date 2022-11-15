import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { TopMoverCoinRow } from '@/components/coin-row';
import { initialChartExpandedStateSheetHeight } from '@/components/expanded-state/asset/ChartExpandedState';
import { Centered, Column, Flex } from '@/components/layout';
import { MarqueeList } from '@/components/list';
import { Text } from '@/components/text';
import EdgeFade from '@/components/EdgeFade';
import networkTypes from '@/helpers/networkTypes';
import { useAccountSettings, useTopMovers } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';

const ErrorMessage = ({ colors, children }) => (
  <Centered marginVertical={50}>
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.3)}
      size="large"
      weight="semibold"
    >
      {children}
    </Text>
  </Centered>
);

export default function TopMoversSection() {
  const { gainers = [], losers = [] } = useTopMovers() || {};
  const { navigate } = useNavigation();
  const { network } = useAccountSettings();
  const { colors } = useTheme();
  const handlePress = useCallback(
    asset => {
      const assetFormatted =
        ethereumUtils.getAccountAsset(asset.address) || asset;

      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: assetFormatted,
        fromDiscover: true,
        longFormHeight: initialChartExpandedStateSheetHeight,
        type: 'token',
      });
    },
    [navigate]
  );

  const formatItems = useCallback(
    asset => {
      const {
        name,
        native: { change },
        price: { relative_change_24h },
      } = asset;
      return {
        ...asset,
        change: `${relative_change_24h > 0 ? '+' : ''}${change}`,
        onPress: handlePress,
        // We’re truncating the coin name manually so the width of the text can be measured accurately
        truncatedName: `${
          name?.length > 15 ? name.substring(0, 15).trim() + '...' : name
        }`,
      };
    },
    [handlePress]
  );

  const gainerItems = useMemo(() => gainers.map(formatItems), [
    formatItems,
    gainers,
  ]);

  const loserItems = useMemo(() => losers.map(formatItems), [
    formatItems,
    losers,
  ]);

  const renderItem = useCallback(
    ({ item, index, onPressCancel, onPressStart, testID }) => (
      <TopMoverCoinRow
        {...item}
        key={`topmovercoinrow-${item?.address}`}
        onPressCancel={onPressCancel}
        onPressStart={onPressStart}
        testID={`${testID}-coin-row-${index}`}
      />
    ),
    []
  );

  return (
    <Column testID="top-movers-section">
      {(gainerItems?.length > 0 || loserItems?.length > 0) && (
        <Flex marginBottom={12} paddingHorizontal={19}>
          <Text size="larger" weight="heavy">
            {lang.t('discover.top_movers.top_movers_title')}
          </Text>
        </Flex>
      )}

      {network !== networkTypes.mainnet ? (
        <ErrorMessage colors={colors}>
          {lang.t('discover.top_movers.disabled_testnets')}
        </ErrorMessage>
      ) : (
        <Column>
          {gainerItems?.length !== 0 && (
            <MarqueeList
              height={53}
              items={gainerItems}
              renderItem={renderItem}
              speed={IS_TESTING !== 'true' ? 40 : 0}
              testID="top-gainers"
            />
          )}
          {loserItems?.length !== 0 && (
            <MarqueeList
              height={53}
              items={loserItems}
              renderItem={renderItem}
              speed={IS_TESTING !== 'true' ? -40 : 0}
              testID="top-losers"
            />
          )}
        </Column>
      )}

      <EdgeFade />
    </Column>
  );
}