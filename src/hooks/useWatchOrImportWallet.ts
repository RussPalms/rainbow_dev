import { isValidAddress } from 'ethereumjs-util';
import lang from 'i18n-js';
import { keys } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { fetchENSAvatar } from './useENSAvatar';
import useInitializeWallet from './useInitializeWallet';
import useIsWalletEthZero from './useIsWalletEthZero';
import useMagicAutofocus from './useMagicAutofocus';
import usePrevious from './usePrevious';
import useTimeout from './useTimeout';
import useWalletENSAvatar from './useWalletENSAvatar';
import useWallets from './useWallets';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { PROFILES, useExperimentalFlag } from '@/config';
import { fetchReverseRecord } from '@/handlers/ens';
import { resolveUnstoppableDomain, web3Provider } from '@/handlers/web3';
import {
  checkIsValidAddressOrDomainFormat,
  isENSAddressFormat,
  isUnstoppableAddressFormat,
  isValidSeed,
} from '@/helpers/validators';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { walletInit } from '@/model/wallet';
import { Navigation, useNavigation } from '@/navigation';
import { walletsLoadState } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, sanitizeSeedPhrase } from '@/utils';
import logger from '@/utils/logger';

export default function useImportingWallet({ showImportModal = true } = {}) {
  const { accountAddress } = useAccountSettings();
  const { selectedWallet, setIsWalletLoading, wallets } = useWallets();

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'replace' does not exist on type '{ dispa... Remove this comment to see the full error message
  const { goBack, navigate, replace, setParams } = useNavigation();
  const initializeWallet = useInitializeWallet();
  const isWalletEthZero = useIsWalletEthZero();
  const [isImporting, setImporting] = useState(false);
  const [input, setInput] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkedWallet, setCheckedWallet] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [startAnalyticsTimeout] = useTimeout();
  const wasImporting = usePrevious(isImporting);
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const inputRef = useRef(null);

  useEffect(() => {
    android &&
      setTimeout(() => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
        inputRef.current?.focus();
      }, 500);
  }, []);
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2-4 arguments, but got 1.
  const { handleFocus } = useMagicAutofocus(inputRef);

  const isWatchable = useMemo(() => {
    return input !== accountAddress && checkIsValidAddressOrDomainFormat(input);
  }, [accountAddress, input]);

  const isImportable = useMemo(() => {
    return input !== accountAddress && isValidSeed(input);
  }, [accountAddress, input]);

  const isInputValid = isWatchable || isImportable;

  const handleSetImporting = useCallback(
    newImportingState => {
      setImporting(newImportingState);
      setParams({ gesturesEnabled: !newImportingState });
    },
    [setParams]
  );

  const handleSetInput = useCallback(
    text => {
      if (isImporting) return null;
      return setInput(text);
    },
    [isImporting]
  );

  const startImportProfile = useCallback(
    (name, forceColor, address = null, avatarUrl) => {
      const importWallet = (color: string, name: string, image: string) =>
        InteractionManager.runAfterInteractions(() => {
          if (color !== null) setColor(color);
          if (name) setName(name);
          if (image) setImage(image);
          handleSetImporting(true);
        });

      if (showImportModal) {
        android && Keyboard.dismiss();
        navigate(Routes.MODAL_SCREEN, {
          actionType: 'Import',
          additionalPadding: true,
          address,
          asset: [],
          forceColor,
          isNewProfile: true,
          onCloseModal: ({
            color,
            name,
            image,
          }: {
            color: string;
            name: string;
            image: string;
          }) => {
            importWallet(color, name, image);
          },
          profile: { image: avatarUrl, name },
          type: 'wallet_profile',
          withoutStatusBar: true,
        });
      } else {
        importWallet(forceColor, name, avatarUrl);
      }
    },
    [handleSetImporting, navigate, showImportModal]
  );

  const handlePressWatchButton = useCallback(async () => {
    if (!isInputValid) return null;
    if (isImportable) {
      Alert.alert('importable');
      return;
    }
    if (isENSAddressFormat(input)) {
      try {
        const [address, avatar] = await Promise.all([
          web3Provider.resolveName(input),
          fetchENSAvatar(input, { swallowError: true }),
        ]);
        if (!address) {
          Alert.alert(lang.t('wallet.invalid_ens_name'));
          return;
        }
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
        setResolvedAddress(address);
        name = forceEmoji ? `${forceEmoji} ${input}` : input;
        avatarUrl = avatarUrl || avatar?.imageUrl;
        startImportProfile(name, guardedForceColor, address, avatarUrl);
        analytics.track('Show wallet profile modal for ENS address', {
          address,
          input,
        });
      } catch (e) {
        Alert.alert(lang.t('wallet.sorry_cannot_add_ens'));
        return;
      }
      // Look up ENS for 0x address
    } else if (isUnstoppableAddressFormat(input)) {
      try {
        const address = await resolveUnstoppableDomain(input);
        if (!address) {
          Alert.alert(lang.t('wallet.invalid_unstoppable_name'));
          return;
        }
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
        setResolvedAddress(address);
        name = forceEmoji ? `${forceEmoji} ${input}` : input;
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
        startImportProfile(name, guardedForceColor, address);
        analytics.track('Show wallet profile modal for Unstoppable address', {
          address,
          input,
        });
      } catch (e) {
        Alert.alert(lang.t('wallet.sorry_cannot_add_unstoppable'));
        return;
      }
    } else if (isValidAddress(input)) {
      try {
        const ens = await fetchReverseRecord(input);
        if (ens && ens !== input) {
          name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
          if (!avatarUrl && profilesEnabled) {
            const avatar = await fetchENSAvatar(name, { swallowError: true });
            avatarUrl = avatar?.imageUrl;
          }
        }
        analytics.track('Show wallet profile modal for read only wallet', {
          ens,
          input,
        });
      } catch (e) {
        logger.log(`Error resolving ENS during wallet import`, e);
      }
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
      startImportProfile(name, guardedForceColor, input);
    }
  }, []);

  const handlePressImportButton = useCallback(
    async (forceColor, forceAddress, forceEmoji = null, avatarUrl) => {
      analytics.track('Tapped "Import" button');
      // guard against pressEvent coming in as forceColor if
      // handlePressImportButton is used as onClick handler
      let guardedForceColor =
        typeof forceColor === 'string' || typeof forceColor === 'number'
          ? forceColor
          : null;
      if ((!isInputValid || !seedPhrase) && !forceAddress) return null;
      const input = sanitizeSeedPhrase(seedPhrase || forceAddress);
      let name: string | null = null;
      // Validate ENS
      if (isENSAddressFormat(input)) {
        try {
          const [address, avatar] = await Promise.all([
            web3Provider.resolveName(input),
            !avatarUrl &&
              profilesEnabled &&
              fetchENSAvatar(input, { swallowError: true }),
          ]);
          if (!address) {
            Alert.alert(lang.t('wallet.invalid_ens_name'));
            return;
          }
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          avatarUrl = avatarUrl || avatar?.imageUrl;
          startImportProfile(name, guardedForceColor, address, avatarUrl);
          analytics.track('Show wallet profile modal for ENS address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(lang.t('wallet.sorry_cannot_add_ens'));
          return;
        }
        // Look up ENS for 0x address
      } else if (isUnstoppableAddressFormat(input)) {
        try {
          const address = await resolveUnstoppableDomain(input);
          if (!address) {
            Alert.alert(lang.t('wallet.invalid_unstoppable_name'));
            return;
          }
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
          setResolvedAddress(address);
          name = forceEmoji ? `${forceEmoji} ${input}` : input;
          // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
          startImportProfile(name, guardedForceColor, address);
          analytics.track('Show wallet profile modal for Unstoppable address', {
            address,
            input,
          });
        } catch (e) {
          Alert.alert(lang.t('wallet.sorry_cannot_add_unstoppable'));
          return;
        }
      } else if (isValidAddress(input)) {
        try {
          const ens = await fetchReverseRecord(input);
          if (ens && ens !== input) {
            name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
            if (!avatarUrl && profilesEnabled) {
              const avatar = await fetchENSAvatar(name, { swallowError: true });
              avatarUrl = avatar?.imageUrl;
            }
          }
          analytics.track('Show wallet profile modal for read only wallet', {
            ens,
            input,
          });
        } catch (e) {
          logger.log(`Error resolving ENS during wallet import`, e);
        }
        // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
        startImportProfile(name, guardedForceColor, input);
      } else {
        try {
          setBusy(true);
          setTimeout(async () => {
            const walletResult = await ethereumUtils.deriveAccountFromWalletInput(
              input
            );
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ address: string; isHDWallet: b... Remove this comment to see the full error message
            setCheckedWallet(walletResult);
            const ens = await fetchReverseRecord(walletResult.address);
            if (ens && ens !== input) {
              name = forceEmoji ? `${forceEmoji} ${ens}` : ens;
              if (!avatarUrl && profilesEnabled) {
                const avatar = await fetchENSAvatar(name, {
                  swallowError: true,
                });
                avatarUrl = avatar?.imageUrl;
              }
            }
            setBusy(false);
            startImportProfile(
              name,
              guardedForceColor,
              walletResult.address,
              avatarUrl
            );
            analytics.track('Show wallet profile modal for imported wallet', {
              address: walletResult.address,
              type: walletResult.type,
            });
          }, 100);
        } catch (error) {
          logger.log('Error looking up ENS for imported HD type wallet', error);
          setBusy(false);
        }
      }
    },
    [isInputValid, profilesEnabled, seedPhrase, startImportProfile]
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!wasImporting && isImporting) {
      startAnalyticsTimeout(async () => {
        const input = resolvedAddress
          ? resolvedAddress
          : sanitizeSeedPhrase(seedPhrase);

        if (!showImportModal) {
          await walletInit(
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
            input,
            color,
            name ? name : '',
            false,
            checkedWallet,
            undefined,
            image,
            true
          );
          await dispatch(walletsLoadState(profilesEnabled));
          handleSetImporting(false);
        } else {
          const previousWalletCount = keys(wallets).length;
          initializeWallet(
            input,
            color,
            name ? name : '',
            false,
            false,
            checkedWallet,
            undefined,
            image
          )
            .then(success => {
              ios && handleSetImporting(false);
              if (success) {
                goBack();
                InteractionManager.runAfterInteractions(async () => {
                  if (previousWalletCount === 0) {
                    // on Android replacing is not working well, so we navigate and then remove the screen below
                    const action = ios ? replace : navigate;
                    action(Routes.SWIPE_LAYOUT, {
                      params: { initialized: true },
                      screen: Routes.WALLET_SCREEN,
                    });
                  } else {
                    navigate(Routes.WALLET_SCREEN, { initialized: true });
                  }
                  if (android) {
                    handleSetImporting(false);
                    InteractionManager.runAfterInteractions(() =>
                      setIsWalletLoading(null)
                    );
                  }

                  setTimeout(() => {
                    // If it's not read only, show the backup sheet
                    if (
                      !(
                        isENSAddressFormat(input) ||
                        isUnstoppableAddressFormat(input) ||
                        isValidAddress(input)
                      )
                    ) {
                      IS_TESTING !== 'true' &&
                        Navigation.handleAction(Routes.BACKUP_SHEET, {
                          single: true,
                          step: WalletBackupStepTypes.imported,
                        });
                    }
                  }, 1000);

                  analytics.track('Imported seed phrase', {
                    isWalletEthZero,
                  });
                });
              } else {
                if (android) {
                  setIsWalletLoading(null);
                  handleSetImporting(false);
                }
                // Wait for error messages then refocus
                setTimeout(() => {
                  // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                  inputRef.current?.focus();
                  // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                  initializeWallet();
                }, 100);
              }
            })
            .catch(error => {
              handleSetImporting(false);
              android && handleSetImporting(false);
              logger.error('error importing seed phrase: ', error);
              setTimeout(() => {
                // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
                inputRef.current?.focus();
                // @ts-expect-error ts-migrate(2554) FIXME: Expected 8-9 arguments, but got 0.
                initializeWallet();
              }, 100);
            });
        }
      }, 50);
    }
  }, [
    checkedWallet,
    color,
    isWalletEthZero,
    handleSetImporting,
    goBack,
    initializeWallet,
    isImporting,
    name,
    navigate,
    replace,
    resolvedAddress,
    seedPhrase,
    selectedWallet.id,
    selectedWallet.type,
    startAnalyticsTimeout,
    wallets,
    wasImporting,
    updateWalletENSAvatars,
    image,
    dispatch,
    showImportModal,
    profilesEnabled,
    setIsWalletLoading,
  ]);

  useEffect(() => {
    setIsWalletLoading(
      isImporting
        ? showImportModal
          ? WalletLoadingStates.IMPORTING_WALLET
          : WalletLoadingStates.IMPORTING_WALLET_SILENTLY
        : null
    );
  }, [isImporting, setIsWalletLoading, showImportModal]);

  return {
    busy,
    handleFocus,
    handlePressImportButton,
    handleSetSeedPhrase,
    inputRef,
    isImportable,
    isWatchable,
    isImporting,
    isInputValid,
    seedPhrase,
  };
}