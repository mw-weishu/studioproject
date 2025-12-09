import { ColorPalette } from '@/constants/Colors';
import { memo, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
    interpolate,
    interpolateColor,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withTiming
} from 'react-native-reanimated';
import { ReText } from 'react-native-redash';

const content = [
  {
    title: "Routime",
    bg: ColorPalette.grey,
    fontColor: ColorPalette.yellow,
  },
  {
    title: "Plan your day",
    bg: ColorPalette.grey,
    fontColor: ColorPalette.sky,
  },
  {
    title: "Achieve more",
    bg: ColorPalette.grey,
    fontColor: ColorPalette.primary,
  },
  {
    title: "Stay focused",
    bg: ColorPalette.grey,
    fontColor: ColorPalette.orange,
  },
  {
    title: 'Your productivity partner',
    bg: ColorPalette.grey,
    fontColor: ColorPalette.pink,
  },
];

const AnimatedIntroWeb = () => {
  const { width, height } = useWindowDimensions();
  const [renderKey, setRenderKey] = useState(0);
  
  // Responsive sizing
  const isMobile = width < 768;
  const ballWidth = isMobile ? 30 : 50;
  const fontSize = isMobile ? 32 : 60;
  const maskHeight = isMobile ? 50 : 90;
  const topOffset = isMobile ? -5 : -10;
  const movementDivisor = isMobile ? 2.45 : 2.1;
  
  const half = width / 2 - ballWidth / 2;

  const currentX = useSharedValue(half);
  const currentIndex = useSharedValue(0);
  const isAtStart = useSharedValue(true);
  const labelWidth = useSharedValue(0);
  const canGoToNext = useSharedValue(false);
  const halfShared = useSharedValue(half);
  const lastIndexAnimated = useSharedValue(-1);
  const animationTrigger = useSharedValue(0);
  const entranceOpacity = useSharedValue(0);

  // Initialize with random title on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * content.length);
    currentIndex.value = randomIndex;
    lastIndexAnimated.value = randomIndex - 1; // Set to previous so first animation triggers
    // Animate entrance opacity
    entranceOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  // Update half value when width changes
  useEffect(() => {
    halfShared.value = width / 2 - ballWidth / 2;
    currentX.value = width / 2 - ballWidth / 2;
    // Re-initialize animation loop on resize
    isAtStart.value = true;
    canGoToNext.value = false;
    lastIndexAnimated.value = currentIndex.value - 1;
    labelWidth.value = 0;
    animationTrigger.value = animationTrigger.value + 1;
    setRenderKey((k) => k + 1); // force re-render so onLayout re-measures
  }, [width]);

  const newColorIndex = useDerivedValue(() => {
    if (!isAtStart.value) {
      return (currentIndex.value + 1) % content.length;
    }
    return currentIndex.value;
  }, [currentIndex]);

  const textStyle = useAnimatedStyle(() => {
    const h = halfShared.value;
    return {
      opacity: entranceOpacity.value,
      color: interpolateColor(
        currentX.value,
        [h, h + labelWidth.value / movementDivisor],
        [content[newColorIndex.value].fontColor, content[currentIndex.value].fontColor],
        'RGB'
      ),
      transform: [
        {
          translateX: interpolate(
            currentX.value,
            [h, h + labelWidth.value / movementDivisor],
            [h + 8, h - labelWidth.value / movementDivisor]
          ),
        },
      ],
    };
  });

  const ballStyle = useAnimatedStyle(() => {
    const h = halfShared.value;
    return {
      opacity: entranceOpacity.value,
      backgroundColor: interpolateColor(
        currentX.value,
        [h, h + labelWidth.value / movementDivisor],
        [content[newColorIndex.value].fontColor, content[currentIndex.value].fontColor],
        'RGB'
      ),
      transform: [{ translateX: currentX.value }],
    };
  });

  const mask = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        currentX.value,
        [halfShared.value, halfShared.value + labelWidth.value / movementDivisor],
        [content[newColorIndex.value].bg, content[currentIndex.value].bg],
        'RGB'
      ),
      transform: [{ translateX: currentX.value }],
      width: width / 1.3,
      height: maskHeight,
      borderTopLeftRadius: isMobile ? 20 : 30,
      borderBottomLeftRadius: isMobile ? 20 : 30,
    })
  );

  const style1 = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      currentX.value,
      [halfShared.value, halfShared.value + labelWidth.value / movementDivisor],
      [content[newColorIndex.value].bg, content[currentIndex.value].bg],
      'RGB'
    ),
  }));

  const text = useDerivedValue(() => {
    const index = currentIndex.value;
    return content[index].title;
  });

  useAnimatedReaction(
    () => animationTrigger.value,
    () => {
      if (labelWidth.value > 0 && isAtStart.value && lastIndexAnimated.value !== currentIndex.value) {
        lastIndexAnimated.value = currentIndex.value;
        const h = halfShared.value;
        currentX.value = withDelay(
          1500,
          withTiming(
            h + labelWidth.value / movementDivisor,
            {
              duration: 1000,
            },
            (finished) => {
              if (finished) {
                canGoToNext.value = true;
                isAtStart.value = false;
              }
            }
          )
        );
      }
    }
  );

  useAnimatedReaction(
    () => canGoToNext.value,
    (next) => {
      if (next) {
        canGoToNext.value = false;
        const h = halfShared.value;
        currentX.value = withDelay(
          1500,
          withTiming(
            h,
            {
              duration: 1000,
            },
            (finished) => {
              if (finished) {
                currentIndex.value = (currentIndex.value + 1) % content.length;
                isAtStart.value = true;
                animationTrigger.value = animationTrigger.value + 1; // Trigger next animation
              }
            }
          )
        );
      }
    }
  );


  return (
    <Animated.View style={[styles.wrapper, style1]}>
      <Animated.View style={[styles.content]}>
        <Animated.View style={[styles.ball, ballStyle, { width: ballWidth, height: ballWidth, borderRadius: ballWidth / 2 }]} />
        <Animated.View style={[styles.mask, mask]} />
        <ReText
          key={renderKey}
          onLayout={(e) => {
            labelWidth.value = e.nativeEvent.layout.width + 8;
            animationTrigger.value = animationTrigger.value + 1; // Trigger animation when text is measured
          }}
          style={[styles.title, textStyle, { fontSize }]}
          text={text}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    userSelect: 'none' as const,
    overflow: 'hidden' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    touchAction: 'none' as const,
  },
  mask: {
    zIndex: 1,
    position: 'absolute',
    left: '0%',
  },
  ball: {
    zIndex: 10,
    backgroundColor: '#000',
    position: 'absolute',
    left: '0%',
  },
  titleText: {
    flexDirection: 'row',
  },
  title: {
    fontWeight: '600',
    left: '0%',
    position: 'absolute',
    // Disable selection on web
    userSelect: 'none' as const,
    pointerEvents: 'none' as const,
  },
  content: {
    marginTop: '20%',
    justifyContent: 'center',
    userSelect: 'none' as const,
  },
});

export default memo(AnimatedIntroWeb);
