import { IconInfoCircle, IconMessage, IconPhoneCall, IconSettings } from '@tabler/icons-react';
import { Burger, Drawer, Flex, Text } from '@mantine/core';
import { AudioPlayerSuite } from './client/audio_player_suite';
import ClientMainMenu from './client/main_menu';
import { exampleTracks } from './utils';
import './pages/styles/globals.css';

const HomePage = () => {
  return (
    <Flex direction="column" justify="flex-start" p={20} style={{ height: '100vh' }}>
      <Flex direction="row" align="center" justify={'space-between'} style={{ width: '100%' }}>
        <Flex direction="row" align="center" justify="center" flex={1}>
          <Text ta={'center'} fw={800} fs={'italic'} w={'100%'}>
            [ distiller ]
          </Text>
        </Flex>
        <Flex direction="row" align="center" justify="center" w={'100%'} gap={45} flex={1} style={{ border: '1px solid #ffffff25', padding: 10 }}>
          <Text ta={'center'} fs={'xl'} fw={800}>
            Welcome to distiller.
          </Text>
          <Text ta={'center'} fs={'lg'}>
            A simple, modern, music building platform.
          </Text>
        </Flex>
        <Flex direction="row" align="center" justify="center" flex={1}>
          <ClientMainMenu />
        </Flex>
      </Flex>
      <Flex flex={1} direction="column" align="center" justify="center">
        <AudioPlayerSuite />
      </Flex>
    </Flex>
  );
};

export default HomePage;
