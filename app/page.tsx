import { IconInfoCircle, IconMessage, IconPhoneCall, IconSettings } from '@tabler/icons-react';
import { Burger, Drawer, Flex, Text } from '@mantine/core';
import ClientMainMenu from './client/main_menu';
import { AudioPlayerSuite } from './client/audio_player_suite';
import { exampleTracks } from './utils';

const HomePage = () => {
  return (
    <Flex
      direction="column"
      justify="flex-start"
      p={20}
      style={{ height: '100vh' }}
    >
      <Flex direction="row" align="center" justify={'space-between'} style={{ width: '100%' }}>
        <Text ta={'center'} fw={800} fs={'italic'}>
          [ distiller ]
        </Text>
        <ClientMainMenu />
      </Flex>
      <Flex flex={1} direction="column" align="center" justify="center">
        <Flex direction="column" align="center" justify="center">
          <Text ta={'center'} fs={'xl'} fw={800}>
            Welcome to distiller
          </Text>
          <Text ta={'center'} fs={'lg'} mt={10}>
            A simple, modern, music building platform.
          </Text>
        </Flex>
        <AudioPlayerSuite tracks={exampleTracks}/>
      </Flex>
    </Flex>
  );
};

export default HomePage;
