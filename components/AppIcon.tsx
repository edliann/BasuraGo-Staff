import { Text } from 'react-native';

type AppIconProps = {
  name: string;
  size?: number;
  color?: string;
  fallback?: unknown;
};

const glyphs: Record<string, string> = {
  'home-5-line': '⌂',
  'home-5-fill': '⌂',
  'recycle-line': '♻',
  'recycle-fill': '♻',
  'user-3-line': '●',
  'user-3-fill': '●',
  'settings-3-line': '⚙',
  'building-2-line': '▦',
  'logout-box-r-line': '⇥',
  'arrow-right-s-line': '›',
  'arrow-left-s-line': '‹',
  'sun-line': '☼',
  'shield-check-line': '✓',
};

export default function AppIcon({ name, size = 22, color = '#176B3A' }: AppIconProps) {
  return (
    <Text
      accessible={false}
      style={{
        color,
        fontSize: size,
        lineHeight: size + 4,
        fontWeight: '600',
        textAlign: 'center',
      }}
    >
      {glyphs[name] ?? '•'}
    </Text>
  );
}
