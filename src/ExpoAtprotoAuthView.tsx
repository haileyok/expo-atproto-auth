import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoAtprotoAuthViewProps } from './ExpoAtprotoAuth.types';

const NativeView: React.ComponentType<ExpoAtprotoAuthViewProps> =
  requireNativeView('ExpoAtprotoAuth');

export default function ExpoAtprotoAuthView(props: ExpoAtprotoAuthViewProps) {
  return <NativeView {...props} />;
}
