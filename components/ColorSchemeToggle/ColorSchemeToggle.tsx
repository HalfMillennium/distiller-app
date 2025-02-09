'use client';

import { Button, Group, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <Group justify="center" mt="xl">
      {colorScheme === 'dark' && <Button onClick={() => setColorScheme('light')}>Light</Button>}
      {(colorScheme === 'light' || colorScheme === 'auto') && <Button onClick={() => setColorScheme('dark')}>Dark</Button>}
    </Group>
  );
}
