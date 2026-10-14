import AppIcon from './AppIcon';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const tabs = [
  { label: 'Home', route: '/dashboard' as const, icon: 'home-5-line' },
  { label: 'Receive', route: '/receipt' as const, icon: 'recycle-line' },
  { label: 'Account', route: '/account' as const, icon: 'user-3-line' },
];

export default function FloatingTabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.dock} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = pathname === tab.route ||
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
            <AppIcon
              name={active ? tab.icon.replace('-line', '-fill') : tab.icon}
              size={23}
              color={active ? '#176B3A' : '#78867B'}
              fallback={null}
            />
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
    minHeight: 70,
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
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 17,
  },
  activeTab: {
    backgroundColor: '#EAF5EC',
  },
  pressed: {
    opacity: 0.72,
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
