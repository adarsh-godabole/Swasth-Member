import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';

import { codeFromScan } from '../src/features/checkInHandoff';
import { Button, Card, ErrorNote, Screen } from '../src/ui/components';
import { colors, radius, spacing, type } from '../src/ui/theme';

/**
 * The in-app scanner.
 *
 * Strictly a convenience: the poster is readable by the phone's own camera
 * app, which is the path that needs no permission and no app open. This exists
 * because a member who opens Swasth first looks for a scan button rather than
 * backing out to their camera.
 *
 * It only reads — the check-in itself is handed to /check-in, so there is one
 * place where a visit gets recorded no matter which of the three ways in the
 * member used.
 */
export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [wrongCode, setWrongCode] = useState(false);

  // onBarcodeScanned fires continuously while a code is in frame. Without this
  // the member would be bounced to /check-in dozens of times per second.
  const handled = useRef(false);

  if (!permission) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (!permission.granted) {
    // `canAskAgain` false means they have said no permanently; the OS will not
    // show the prompt again, so the only way through is Settings.
    const blocked = !permission.canAskAgain;
    return (
      <Screen style={{ justifyContent: 'center', gap: spacing(2) }}>
        <View style={{ gap: spacing(1) }}>
          <Text style={type.title}>Scan the gym code</Text>
          <Text style={type.caption}>
            {blocked
              ? 'Camera access is turned off for Swasth. You can turn it on in Settings — or skip it entirely and type the code printed under the QR.'
              : 'We need the camera to read the QR at the gym door. It is used for nothing else.'}
          </Text>
        </View>

        {blocked ? (
          <Button label="Open settings" onPress={() => Linking.openSettings()} />
        ) : (
          <Button label="Allow camera" onPress={() => requestPermission()} />
        )}

        <Button
          label="Type the code instead"
          variant="ghost"
          onPress={() => router.replace('/check-in')}
        />
        <Button label="Back" variant="ghost" onPress={() => router.replace('/home')} />
      </Screen>
    );
  }

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;

    const code = codeFromScan(data);
    if (!code) {
      // Some other QR drifted through the frame. Say so and keep scanning
      // rather than sending nonsense to the server.
      setWrongCode(true);
      return;
    }

    handled.current = true;
    // replace, not push: coming back to a live camera after checking in is not
    // something anyone wants.
    router.replace(`/check-in?code=${encodeURIComponent(code)}`);
  };

  return (
    <Screen style={{ gap: spacing(2) }}>
      <View style={{ gap: spacing(0.5) }}>
        <Text style={type.title}>Scan to check in</Text>
        <Text style={type.caption}>Point the camera at the QR code at the gym door.</Text>
      </View>

      <View
        style={{
          flex: 1,
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.surface,
        }}
      >
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScan}
        />
      </View>

      {wrongCode ? (
        <ErrorNote message="That is not a Swasth check-in code. Look for the QR on the gym's own poster." />
      ) : null}

      <Card style={{ gap: spacing(1) }}>
        <Text style={type.caption}>
          Nothing happening? The code is printed under the QR and can be typed by hand.
        </Text>
        <Button
          label="Type the code instead"
          variant="ghost"
          onPress={() => router.replace('/check-in')}
        />
      </Card>
    </Screen>
  );
}
