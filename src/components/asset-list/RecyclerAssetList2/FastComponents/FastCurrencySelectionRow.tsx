import React from 'react';
import isEqual from 'react-fast-compare';
import { Text as RNText, StyleSheet, View } from 'react-native';
import {
  // @ts-ignore
  IS_TESTING,
} from 'react-native-dotenv';
// @ts-ignore
import { ContextMenuButton } from 'react-native-ios-context-menu';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../../../animations';
import { CoinRowHeight } from '../../../coin-row';
import { FloatingEmojis } from '../../../floating-emojis';
import FastCoinIcon from './FastCoinIcon';
import { Text } from '@rainbow-me/design-system';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import { useAccountAsset } from '@rainbow-me/hooks';
import { colors, fonts, fontWithWidth, getFontSize } from '@rainbow-me/styles';
import { deviceUtils, ethereumUtils } from '@rainbow-me/utils';

const SafeRadialGradient = (IS_TESTING === 'true'
  ? View
  : RadialGradient) as typeof RadialGradient;

interface FastCurrencySelectionRowProps {
  item: any;
}

interface FavStarProps {
  theme: any;
  favorite: boolean;
  toggleFavorite: (onNewEmoji?: () => void) => void;
}

function FavStar({ toggleFavorite, favorite, theme }: FavStarProps) {
  const { isDarkMode, colors } = theme;
  return (
    <ButtonPressAnimation onPress={toggleFavorite}>
      <SafeRadialGradient
        center={[0, 15]}
        colors={
          favorite
            ? [
                colors.alpha('#FFB200', isDarkMode ? 0.15 : 0),
                colors.alpha('#FFB200', isDarkMode ? 0.05 : 0.2),
              ]
            : colors.gradients.lightestGrey
        }
        style={[sx.gradient, sx.starGradient]}
      >
        <RNText
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            sx.star,
            {
              color: colors.alpha(colors.blueGreyDark, 0.2),
            },
            favorite && sx.starFavorite,
          ]}
        >
          􀋃
        </RNText>
      </SafeRadialGradient>
    </ButtonPressAnimation>
  );
}

const deviceWidth = deviceUtils.dimensions.width;

export default React.memo(function FastCurrencySelectionRow({
  item: {
    uniqueId,
    showBalance,
    showFavoriteButton,
    showAddButton,
    onPress,
    theme,
    nativeCurrency,
    nativeCurrencySymbol,
    favorite,
    toggleFavorite,
    onAddPress,
    contextMenuProps,
    symbol,
    address,
    name,
    testID,
    type,
  },
}: FastCurrencySelectionRowProps) {
  const { colors } = theme;

  // TODO https://github.com/rainbow-me/rainbow/pull/3313/files#r876259954
  const item = useAccountAsset(uniqueId, nativeCurrency);
  const network = ethereumUtils.getNetworkFromType(type);
  const rowTestID = testID + '-exchange-coin-row-' + (item?.symbol || symbol);

  const isInfoButtonVisible =
    !item?.isNativeAsset ||
    (isNativeAsset(item?.address, network) && !showBalance);

  return (
    <View style={sx.row}>
      <ButtonPressAnimation
        onPress={onPress}
        style={sx.flex}
        testID={rowTestID}
        wrapperStyle={sx.flex}
      >
        <View style={sx.rootContainer}>
          <FastCoinIcon
            address={item?.mainnet_address || item?.address || address}
            assetType={item?.type ?? item?.network}
            symbol={item?.symbol || symbol}
            theme={theme}
          />
          <View style={sx.innerContainer}>
            <View
              style={[
                sx.column,
                {
                  justifyContent: showBalance ? 'center' : 'space-between',
                },
              ]}
            >
              <RNText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[
                  sx.name,
                  { color: colors.dark },
                  showBalance && sx.nameWithBalances,
                ]}
              >
                {item?.name || name}
              </RNText>
              {!showBalance && (
                <RNText
                  ellipsizeMode="tail"
                  numberOfLines={1}
                  style={[
                    sx.symbol,
                    {
                      color: theme.colors.blueGreyDark50,
                    },
                  ]}
                >
                  {item?.symbol || symbol}
                </RNText>
              )}
            </View>
            {showBalance && (
              <View style={[sx.column, sx.balanceColumn]}>
                <Text align="right" size="16px">
                  {item?.native?.balance?.display ??
                    `${nativeCurrencySymbol}0.00`}
                </Text>
                <Text
                  align="right"
                  color={{ custom: theme.colors.blueGreyDark50 }}
                  size="14px"
                >
                  {item?.balance?.display ?? ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ButtonPressAnimation>
      {!showBalance && (
        <View style={sx.fav}>
          {isInfoButtonVisible && (
            <ContextMenuButton
              activeOpacity={0}
              isMenuPrimaryAction
              onPressMenuItem={contextMenuProps.handlePressMenuItem}
              useActionSheetFallback={false}
              wrapNativeComponent={false}
              {...contextMenuProps}
            >
              <ButtonPressAnimation>
                <SafeRadialGradient
                  center={[0, 15]}
                  colors={colors.gradients.lightestGrey}
                  style={[sx.gradient, sx.igradient]}
                >
                  <Text
                    color={{ custom: colors.alpha(colors.blueGreyDark, 0.3) }}
                    weight="bold"
                  >
                    􀅳
                  </Text>
                </SafeRadialGradient>
              </ButtonPressAnimation>
            </ContextMenuButton>
          )}
          {showFavoriteButton &&
            (ios ? (
              // @ts-ignore
              <FloatingEmojis
                centerVertically
                deviceWidth={deviceWidth}
                disableHorizontalMovement
                disableVerticalMovement
                distance={70}
                duration={400}
                emojis={['glowing_star']}
                fadeOut={false}
                marginTop={-4}
                range={[0, 0]}
                scaleTo={0}
                size={32}
                wiggleFactor={0}
              >
                {({ onNewEmoji }: { onNewEmoji: () => void }) => (
                  <FavStar
                    favorite={favorite}
                    theme={theme}
                    toggleFavorite={() => toggleFavorite(onNewEmoji)}
                  />
                )}
              </FloatingEmojis>
            ) : (
              <FavStar
                favorite={favorite}
                theme={theme}
                toggleFavorite={toggleFavorite}
              />
            ))}
          {showAddButton && (
            <ButtonPressAnimation onPress={onAddPress}>
              <SafeRadialGradient
                center={[0, 15]}
                colors={colors.gradients.lightestGrey}
                style={[sx.gradient, sx.addGradient]}
              >
                <RNText
                  style={[
                    sx.addText,
                    {
                      color: colors.alpha(colors.blueGreyDark, 0.3),
                    },
                  ]}
                >
                  +
                </RNText>
              </SafeRadialGradient>
            </ButtonPressAnimation>
          )}
        </View>
      )}
    </View>
  );
},
isEqual);

const sx = StyleSheet.create({
  addGradient: {
    paddingBottom: 3,
    paddingLeft: 1,
  },
  addText: {
    fontSize: 26,
    letterSpacing: 0,
    textAlign: 'center',
    ...fontWithWidth(fonts.weight.medium),
    height: 31,
    lineHeight: 30,
    width: '100%',
  },
  balanceColumn: {
    height: 34,
  },
  column: {
    flexDirection: 'column',
    height: 33,
    justifyContent: 'space-between',
  },
  fav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 17.5,
    width: 92,
  },
  flex: {
    flex: 1,
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginHorizontal: 2,
    overflow: 'hidden',
    width: 30,
  },
  igradient: {
    paddingBottom: ios ? 0 : 2.5,
    paddingLeft: 2.5,
    paddingTop: ios ? 1 : 0,
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    width: '100%',
  },
  name: {
    fontSize: getFontSize(fonts.size.lmedium),
    letterSpacing: 0.5,
    lineHeight: ios ? 16 : 17,
    ...fontWithWidth(fonts.weight.regular),
  },
  nameWithBalances: {
    lineHeight: 18.5,
  },
  rootContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: CoinRowHeight,
    paddingHorizontal: 19,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 13,
    ...fontWithWidth(fonts.weight.regular),
  },
  starFavorite: {
    color: colors.yellowFavorite,
  },
  starGradient: {
    paddingBottom: ios ? 3 : 5,
    paddingLeft: ios ? 1 : 0,
    paddingTop: 3,
    width: 30,
  },
  symbol: {
    fontSize: getFontSize(fonts.size.smedium),
    letterSpacing: 0.5,
    lineHeight: ios ? 13.5 : 16,
    paddingTop: 5.5,
    ...fontWithWidth(fonts.weight.regular),
  },
});
