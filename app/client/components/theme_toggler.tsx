'use client';

import { IconMoon, IconSun } from '@tabler/icons-react';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { COLORS } from '@/app/utils';
import { useState, useEffect } from 'react';

export const ThemeToggler: React.FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
  }, []);


  return (
    <ActionIcon radius={100} variant="filled" color={COLORS.softGreen} size="lg">
      {colorScheme === 'dark' && <IconSun size={16} onClick={() => setColorScheme('light')} />}
      {colorScheme !== 'dark' && <IconMoon size={16} onClick={() => setColorScheme('dark')} />}
    </ActionIcon>
  );
};
