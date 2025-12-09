import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    GestureResponderEvent,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export interface HoldMenuAction {
  text: string;
  icon?: string;
  onPress: () => void;
}

interface HoldItemProps {
  children: React.ReactNode;
  items: HoldMenuAction[];
  activateOn?: 'tap' | 'longPress';
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const HoldItem = ({
  children,
  items,
  activateOn = 'longPress',
  onMenuOpen,
  onMenuClose,
}: HoldItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // keep overlay/menu during closing animation
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const blurAnimRef = useRef(new Animated.Value(0)).current;
  const scaleAnimRef = useRef(new Animated.Value(0)).current;
  const itemScaleRef = useRef(new Animated.Value(1)).current;
  const childrenRef = useRef<View>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (event: GestureResponderEvent) => {
    if (childrenRef.current) {
      childrenRef.current.measure((x, y, width, height, pageX, pageY) => {
        setMenuPosition({
          x: pageX + width / 2,
          y: pageY + height,
        });
        setIsVisible(true);
        setIsMenuOpen(true);
        onMenuOpen?.();

        // Animate backdrop, menu, and the pressed item
        Animated.parallel([
          Animated.timing(blurAnimRef, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.spring(scaleAnimRef, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 40,
          }),
          Animated.spring(itemScaleRef, {
            toValue: 1.05,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }),
        ]).start();
      });
    }
  };

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    onMenuClose?.();

    // Animate blur and menu/item scale back in sync
    Animated.parallel([
      Animated.timing(blurAnimRef, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnimRef, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(itemScaleRef, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  }, [onMenuClose, blurAnimRef, scaleAnimRef, itemScaleRef]);

  const handleMenuItemPress = (action: HoldMenuAction) => {
    action.onPress();
    closeMenu();
  };

  const handlePressIn = () => {
    if (activateOn === 'longPress') {
      holdTimeoutRef.current = setTimeout(() => {
        openMenu({ nativeEvent: {} } as GestureResponderEvent);
        holdTimeoutRef.current = null;
      }, 500);
    }
  };

  const handlePressOut = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const handlePress = () => {
    if (activateOn === 'tap' && !isMenuOpen) {
      openMenu({ nativeEvent: {} } as GestureResponderEvent);
    }
  };

  const menuScale = scaleAnimRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Close on navigation changes (screen blur) and unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        closeMenu();
      };
    }, [closeMenu])
  );

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      closeMenu();
    };
  }, [closeMenu]);

  return (
    <>
      {isVisible && (
        <>
          {/* Dark overlay backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.overlay,
              { opacity: blurAnimRef },
            ]}
          />
          {/* Tap catcher above overlay */}
          <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1000, opacity: blurAnimRef }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          </Animated.View>
        </>
      )}

      {/* Children always on top when menu is open */}
      <Animated.View
        style={[
          { transform: [{ scale: itemScaleRef }] },
          isVisible ? { zIndex: 1001 } : null,
        ]}
      >
        <Pressable
          ref={childrenRef}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          {children}
        </Pressable>
      </Animated.View>

      {isVisible && (
        <>
          {/* Menu below the item */}
          <Animated.View
            style={[
              styles.menuContainer,
              {
                left: menuPosition.x - 75, // Approximate menu width / 2
                top: menuPosition.y + 8,
                transform: [{ scale: menuScale }],
                zIndex: 1002,
              },
            ]}
          >
            {items.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.menuItem,
                  index !== items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuItemPress(item)}
              >
                <Text style={styles.menuItemText}>{item.text}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 998,
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    overflow: 'hidden',
    minWidth: 150,
    zIndex: 1000,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
