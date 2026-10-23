import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-2xl font-extrabold">Off the map</Text>
      <Text className="text-center text-muted-foreground">This screen doesn't exist.</Text>
      <Button onPress={() => router.replace('/')}>
        <Text>Take me home</Text>
      </Button>
    </View>
  );
}
