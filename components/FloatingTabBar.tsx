import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type TabItem = {
  label: string;
  route: '/dashboard' | '/receipt' | '/account';
  glyph: string;
};

const tabs: TabItem[] = [
  { label: 'Home', route: '/dashboard', glyph: '⌂' },
  { label: 'Receive', route: '/receipt', glyph: '▤' },
  { label: 'Account', route: '/account', glyph: '♙' },
];

export default function FloatingTabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.dock} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active =
          pathname === tab.route ||
          (tab.route === '/account' && pathname === '/settings');

        return (
          <Pressable
            key={tab.route}
            style={({ pressed }) => [
              styles.tab,
              active && styles.activeTab,
              pressed && styles.pressed,
            ]}
            onPress={() => router.replace(tab.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.glyph, active && styles.activeGlyph]}>
              {tab.glyph}
            </Text>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 12,
    minHeight: 68,
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E8E1',
    backgroundColor: '#FFFFFF',
    shadowColor: '#173C28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 17,
  },
  activeTab: {
    backgroundColor: '#EAF5EC',
  },
  pressed: {
    opacity: 0.72,
  },
  glyph: {
    color: '#78867B',
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '600',
  },
  activeGlyph: {
    color: '#176B3A',
  },
  label: {
    color: '#78867B',
    fontSize: 10,
    fontWeight: '700',
  },
  activeLabel: {
    color: '#176B3A',
  },
});
