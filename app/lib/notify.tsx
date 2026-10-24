import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheck, Info, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { toast } from 'sonner-native';

type Variant = 'success' | 'error' | 'info';

const VARIANTS: Record<Variant, { icon: LucideIcon; tint: string; bubble: string }> = {
  success: { icon: CircleCheck, tint: 'text-sage', bubble: 'bg-sage/15' },
  error: { icon: CircleAlert, tint: 'text-destructive', bubble: 'bg-destructive/15' },
  info: { icon: Info, tint: 'text-primary', bubble: 'bg-primary/15' },
};

function ToastCard({ variant, title, description }: { variant: Variant; title: string; description?: string }) {
  const v = VARIANTS[variant];
  return (
    <View className="mx-4 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-4 shadow-xl shadow-black/15">
      <View className={cn('h-10 w-10 items-center justify-center rounded-xl', v.bubble)}>
        <Icon as={v.icon} size={20} className={v.tint} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold">{title}</Text>
        {description ? <Text className="text-xs leading-4 text-muted-foreground">{description}</Text> : null}
      </View>
    </View>
  );
}

function show(variant: Variant, title: string, description?: string) {
  if (variant === 'error') haptics.error();
  else if (variant === 'success') haptics.success();
  return toast.custom(<ToastCard variant={variant} title={title} description={description} />, {
    duration: variant === 'error' ? 4500 : 3000,
  });
}

/** Branded toasts: sonner-native handles stacking, swipe-to-dismiss and motion; we own the look. */
export const notify = {
  success: (title: string, description?: string) => show('success', title, description),
  error: (title: string, description?: string) => show('error', title, description),
  info: (title: string, description?: string) => show('info', title, description),
};
