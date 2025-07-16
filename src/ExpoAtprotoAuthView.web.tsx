import * as React from 'react';

import { ExpoAtprotoAuthViewProps } from './ExpoAtprotoAuth.types';

export default function ExpoAtprotoAuthView(props: ExpoAtprotoAuthViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
