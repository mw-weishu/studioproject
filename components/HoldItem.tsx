import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { usePortal } from './PortalHost';

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
  hitSlop?: { top?: number; left?: number; right?: number; bottom?: number } | number;
}

export const HoldItem = ({
  children,
  items,
  activateOn = 'longPress',
  onMenuOpen,
  onMenuClose,
  hitSlop,
}: HoldItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [itemDimensions, setItemDimensions] = useState({ width: 0, height: 0 });
  const [itemPosition, setItemPosition] = useState({ x: 0, y: 0 });
  const blurAnimRef = useRef(new Animated.Value(0)).current;
  const scaleAnimRef = useRef(new Animated.Value(0)).current;
  const itemScaleRef = useRef(new Animated.Value(1)).current;
  const childrenRef = useRef<View>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addPortal, removePortal } = usePortal();
  const portalIdRef = useRef(`holditem-${Math.random()}`).current;

  const openMenu = (event: GestureResponderEvent) => {
    if (childrenRef.current) {
      childrenRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Store dimensions and position for menu and item copy positioning
        setItemDimensions({ width, height });
        setItemPosition({ x: pageX, y: pageY });
        
        // Get window height to detect if menu would go off-screen
        const windowHeight = Dimensions.get('window').height;
        const menuHeight = items.length * 48 + 8; // Approximate menu height (48px per item + padding)
        const spaceBelow = windowHeight - (pageY + height);
        const spaceAbove = pageY;
        
        // Position menu below by default, but above if not enough space
        let calculatedY = pageY + height + 4;
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
          calculatedY = pageY - menuHeight - 4; // Position above item
        }
        
        setMenuPosition({
          x: pageX + width / 2,
          y: calculatedY,
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
        removePortal(portalIdRef);
      }
    });
  }, [onMenuClose, blurAnimRef, scaleAnimRef, itemScaleRef, removePortal, portalIdRef]);

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

  // Update portal whenever menu state changes
  useEffect(() => {
    if (isVisible) {
      const menuScale = scaleAnimRef.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1],
      });

      const portalContent = (
        <>
          {/* Full-screen dark overlay backdrop */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.overlay,
              { opacity: blurAnimRef, zIndex: 998 },
            ]}
            pointerEvents="none"
          />
          {/* Tap catcher above overlay - full screen, tap closes menu */}
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { zIndex: 1000, opacity: blurAnimRef }
            ]}
            pointerEvents={isMenuOpen ? 'auto' : 'none'}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          </Animated.View>
          
          {/* Item copy positioned absolutely above overlay */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: itemPosition.x,
                top: itemPosition.y,
                width: itemDimensions.width,
                height: itemDimensions.height,
                transform: [{ scale: itemScaleRef }],
                zIndex: 1001,
              },
            ]}
            pointerEvents="none"
          >
            {children}
          </Animated.View>

          {/* Menu positioned absolutely relative to screen */}
          <Animated.View
            style={[
              styles.menuContainer,
              {
                left: menuPosition.x - 75,
                top: menuPosition.y,
                transform: [{ scale: menuScale }],
                zIndex: 1002,
              },
            ]}
            pointerEvents="box-none"
          >
            {items.map((item, index) => (
              <Pressable
                key={index}
                style={[
                  styles.menuItem,
                  index !== items.length - 1 && styles.menuItemBorder,
                ]}
                onPress={() => handleMenuItemPress(item)}
                pointerEvents="auto"
              >
                <Text style={styles.menuItemText}>{item.text}</Text>
              </Pressable>
            ))}
          </Animated.View>
        </>
      );

      addPortal(portalIdRef, portalContent);
    } else {
      removePortal(portalIdRef);
    }
  }, [isVisible, isMenuOpen, menuPosition, itemPosition, itemDimensions, blurAnimRef, scaleAnimRef, itemScaleRef, items, closeMenu, addPortal, removePortal, portalIdRef, children]);

  return (
    <>
      {/* Children wrapper - positioned normally within parent, NOT scaled */}
      <Animated.View
        style={[
          isVisible ? { opacity: 0 } : { opacity: 1 },
        ]}
      >
        <Pressable
          ref={childrenRef}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          hitSlop={hitSlop}
        >
          {children}
        </Pressable>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 998,
    position: 'absolute',
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
    zIndex: 1002,
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
