'use client';

import { useState } from 'react';
import { IconInfoCircle, IconMessage, IconPhoneCall, IconSettings } from '@tabler/icons-react';
import { ActionIcon, Burger, Button, Drawer, Flex, Text, Tooltip } from '@mantine/core';
import { ThemeToggler } from './components/theme_toggler';

const ClientMainMenu: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [showBurger, setShowBurger] = useState(false);
  return (
    <>
      {!showBurger && (
        <Flex align="center" gap="15">
          <ThemeToggler />
          <ActionIcon radius={100} variant="filled" color="black" size="lg">
            <IconInfoCircle size={20} />
          </ActionIcon>
          <ActionIcon radius={100} variant="filled" color="black" size="lg">
            <IconPhoneCall size={20} />
          </ActionIcon>
          <ActionIcon radius={100} variant="filled" color="black" size="lg">
            <IconSettings size={20} />
          </ActionIcon>
        </Flex>
      )}
      {showBurger && (
        <Flex direction="column" align="center" gap="15">
          <Burger opened={opened} onClick={() => setOpened((o) => !o)} size="sm" />
          <Drawer
            opened={opened}
            onClose={() => setOpened(false)}
            title="Menu"
            padding="xl"
            size="sm"
          >
            <Flex align="center" gap="50">
              <Flex align={'center'} gap="10">
                <IconInfoCircle size={20} />
                <Text ta={'center'}>about</Text>
              </Flex>
              <Flex align={'center'} gap="10">
                <IconMessage size={20} />
                <Text ta={'center'}>contact</Text>
              </Flex>
              <Flex align={'center'} gap="10">
                <IconSettings size={20} />
                <Text ta={'center'}>settings</Text>
              </Flex>
            </Flex>
          </Drawer>
        </Flex>
      )}
    </>
  );
};
export default ClientMainMenu;
