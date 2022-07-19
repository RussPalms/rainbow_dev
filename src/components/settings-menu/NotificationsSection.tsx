import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Switch } from 'react-native';
import { ContactAvatar } from '../contacts';
import Menu from './components/Menu';
import MenuContainer from './components/MenuContainer';
import MenuItem from './components/MenuItem';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';

const NotificationsSection = () => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const onPress = useCallback(
    name => {
      navigate(Routes.WALLET_NOTIFICATIONS_SETTINGS, {
        title: name,
      });
    },
    [navigate]
  );

  return (
    <MenuContainer>
      <Menu>
        <MenuItem
          rightComponent={<Switch />}
          size="medium"
          titleComponent={
            <MenuItem.Title
              text={lang.t('settings.notifications_section.my_wallets')}
              weight="bold"
            />
          }
        />
        <MenuItem
          hasRightArrow
          labelComponent={
            <MenuItem.Label
              text={lang.t('settings.notifications_section.all')}
            />
          }
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.appleBlue}
              marginRight={10}
              size="small"
              value="notben.eth"
            />
          }
          onPress={() => onPress('notben.eth')}
          size="medium"
          titleComponent={<MenuItem.Title text="notben.eth" />}
        />
        <MenuItem
          hasRightArrow
          labelComponent={
            <MenuItem.Label
              text={`${lang.t(
                'settings.notifications_section.received'
              )}, ${lang.t('settings.notifications_section.sold')}, ${lang.t(
                'settings.notifications_section.minted'
              )}, ${lang.t('settings.notifications_section.plus_n_more', {
                n: 4,
              })}`}
            />
          }
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.red}
              marginRight={10}
              size="small"
              value="pugson.eth"
            />
          }
          onPress={() => onPress('pugson.eth')}
          size="medium"
          titleComponent={<MenuItem.Title text="pugson.eth" />}
        />
      </Menu>
      <Menu>
        <MenuItem
          rightComponent={<Switch />}
          size="medium"
          titleComponent={
            <MenuItem.Title
              text={lang.t('settings.notifications_section.watched_wallets')}
              weight="bold"
            />
          }
        />
        <MenuItem
          hasRightArrow
          labelComponent={
            <MenuItem.Label
              text={lang.t('settings.notifications_section.off')}
            />
          }
          leftComponent={
            <ContactAvatar
              alignSelf="center"
              color={colors.red}
              marginRight={10}
              size="small"
              value="moxey.eth"
            />
          }
          onPress={() => onPress('moxey.eth')}
          size="medium"
          titleComponent={<MenuItem.Title text="moxey.eth" />}
        />
      </Menu>
    </MenuContainer>
  );
};

export default NotificationsSection;