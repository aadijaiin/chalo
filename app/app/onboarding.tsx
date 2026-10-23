import { Backdrop } from '@/components/backdrop';
import { LogoMark } from '@/components/logo';
import {
  CrewMapIllustration,
  ILLUSTRATION_SIZE,
  PrivacyIllustration,
  RouteIllustration,
} from '@/components/onboarding/illustrations';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { preferences } from '@/lib/preferences';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const SLIDES = [
  {
    title: 'Your whole crew,\non one map.',
    body: 'Spot every friend in real time, each with their own avatar. No more “where are you?” texts.',
    Illustration: CrewMapIllustration,
  },
  {
    title: 'Nobody gets\nleft behind.',
    body: 'Riding or road-tripping, see who is leading and who is trailing, even kilometres apart.',
    Illustration: RouteIllustration,
  },
  {
    title: 'Private by\ndesign.',
    body: 'Your location is shared only with your party, and only while you are in it. Leave, and it stops.',
    Illustration: PrivacyIllustration,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = React.useState(0);
  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  async function finish() {
    haptics.success();
    await preferences.setOnboarded();
    router.replace('/register');
  }

  function next() {
    if (isLast) return finish();
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  }

  return (
    <View className="flex-1 bg-background">
      <Backdrop />
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View className="flex-row items-center gap-2">
            <LogoMark size={28} />
            <Text className="text-xl font-extrabold tracking-tight">chalo</Text>
          </View>
          {!isLast ? (
            <Pressable onPress={finish} hitSlop={12}>
              <Text className="font-semibold text-muted-foreground">Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            if (i !== index) haptics.select();
            setIndex(i);
          }}
          className="flex-1">
          {SLIDES.map((slide, i) => (
            <Slide key={i} index={i} width={width} scrollX={scrollX} {...slide} />
          ))}
        </Animated.ScrollView>

        <View className="gap-8 px-6 pb-4">
          <View className="flex-row justify-center gap-2">
            {SLIDES.map((_, i) => (
              <Dot key={i} index={i} width={width} scrollX={scrollX} />
            ))}
          </View>
          <Button size="lg" onPress={next}>
            <Text>{isLast ? 'Get started' : 'Next'}</Text>
            <Icon as={ArrowRight} size={18} />
          </Button>
          <Pressable
            onPress={async () => {
              await preferences.setOnboarded();
              router.replace('/login');
            }}
            className="items-center">
            <Text className="text-sm text-muted-foreground">
              Already have an account? <Text className="text-sm font-bold text-primary">Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

type SlideProps = (typeof SLIDES)[number] & {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
};

function Slide({ title, body, Illustration, index, width, scrollX }: SlideProps) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  // Art drifts slower than the page and the copy trails behind it, for depth.
  const artStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(scrollX.value, range, [width * 0.35, 0, -width * 0.35]) },
      { scale: interpolate(scrollX.value, range, [0.85, 1, 0.85], Extrapolation.CLAMP) },
    ],
  }));
  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(scrollX.value, range, [width * 0.2, 0, -width * 0.2]) }],
  }));

  return (
    <View style={{ width }} className="flex-1 justify-center px-6">
      <Animated.View style={[artStyle, { height: ILLUSTRATION_SIZE }]} className="items-center">
        <Illustration />
      </Animated.View>
      <Animated.View style={copyStyle} className="mt-10 gap-3">
        <Text className="text-4xl font-extrabold leading-tight tracking-tight">{title}</Text>
        <Text className="text-base leading-6 text-muted-foreground">{body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, width, scrollX }: { index: number; width: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [8, 28, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, range, [0.35, 1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={style} className="h-2 rounded-full bg-primary" />;
}
