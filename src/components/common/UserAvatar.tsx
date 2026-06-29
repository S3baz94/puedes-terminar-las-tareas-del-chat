interface UserAvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function UserAvatar({ name, src, size = 'md' }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (src) {
    return <img alt={name} className={`${sizeClass[size]} rounded-full object-cover`} src={src} />;
  }

  return (
    <span
      className={`${sizeClass[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white`}
    >
      {initials}
    </span>
  );
}
