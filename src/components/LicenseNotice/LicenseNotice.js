import React from 'react';
import { Linking } from 'react-native';
import { APPLE_MEDIA_TERMS_URL } from '../../config/urls';
export const LicenseNotice = ({ TextComponent, style, linkStyle, testID, notice, firstLink, appleTermsLabel, appleTermsTestID, }) => (<TextComponent testID={testID} style={style}>
    {notice}{' '}
    <TextComponent testID={firstLink.testID} accessibilityRole="link" style={linkStyle} onPress={() => Linking.openURL(firstLink.url)}>
      {firstLink.label}
    </TextComponent>
    {' · '}
    <TextComponent testID={appleTermsTestID} accessibilityRole="link" style={linkStyle} onPress={() => Linking.openURL(APPLE_MEDIA_TERMS_URL)}>
      {appleTermsLabel}
    </TextComponent>
  </TextComponent>);
