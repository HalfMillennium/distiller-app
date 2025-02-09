'use client';

import React, { useEffect, useRef, useState } from 'react';
import { IconGripVertical, IconPlayerPauseFilled, IconPlayerPlayFilled, IconSlash } from '@tabler/icons-react';
import { ActionIcon, Card, Flex, Group, Slider, Stack, Text } from '@mantine/core';
import { Track } from '../types';

interface AudioPlayerSuiteProps {
  tracks: Track[];
}

export const AudioPlayerSuite = ({ tracks: initialTracks }: AudioPlayerSuiteProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState(initialTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);

  // Track length adjustments
  const [trackEndTimes, setTrackEndTimes] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (audioRef.current && currentTrackIndex !== null) {
      audioRef.current.src = tracks[currentTrackIndex].src;
      audioRef.current.load();
      setCurrentTime(0);
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, tracks, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Initialize end time for the track if not set
      if (currentTrackIndex !== null && !trackEndTimes[tracks[currentTrackIndex].id]) {
        setTrackEndTimes((prev) => ({
          ...prev,
          [tracks[currentTrackIndex].id]: audio.duration,
        }));
      }
    };

    const handleTimeUpdate = () => {
      if (
        currentTrackIndex !== null &&
        audio.currentTime >= trackEndTimes[tracks[currentTrackIndex].id]
      ) {
        audio.pause();
        setIsPlaying(false);
        setCurrentTime(trackEndTimes[tracks[currentTrackIndex].id]);
      } else {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, tracks, trackEndTimes]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.error(err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // Enhanced drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedTrack(index);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedTrack(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedTrack === null || draggedTrack === index) return;

    const newTracks = [...tracks];
    const draggedItem = newTracks[draggedTrack];
    newTracks.splice(draggedTrack, 1);
    newTracks.splice(index, 0, draggedItem);

    setTracks(newTracks);
    setDraggedTrack(index);

    if (currentTrackIndex === draggedTrack) {
      setCurrentTrackIndex(index);
    } else if (currentTrackIndex === index) {
      setCurrentTrackIndex(draggedTrack);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <Stack bg={'#00000010'} w={'50%'} p="md" gap="xl" style={{ borderRadius: 10 }}>
      {tracks.map((track: Track, index: number) => (
        <Card
          key={track.id || index}
          p="md"
          withBorder
          radius={10}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, index)}
          style={{
            marginBottom: 10,
            backgroundColor: track.color,
            cursor: 'move',
          }}
        >
          <Stack gap="sm">
            <Group p="apart" gap="xl">
              <Group gap="md">
                <ActionIcon variant="subtle">
                  <IconGripVertical color="gray" size={20} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTrackIndex === index) {
                      togglePlayPause();
                    } else {
                      setCurrentTrackIndex(index);
                      setIsPlaying(true);
                    }
                  }}
                >
                  {currentTrackIndex === index && isPlaying ? (
                    <IconPlayerPauseFilled color="gray" size={16} />
                  ) : (
                    <IconPlayerPlayFilled color="gray" size={16} />
                  )}
                </ActionIcon>
                <Text fw={799} c={'white'}>
                  {track.name}
                </Text>
              </Group>
              <Flex flex="1" align="center" justify="end">
                <Flex align={'center'} gap="sm">
                  <Text size="sm" c="white">
                    {currentTrackIndex === index ? formatTime(currentTime) : '00:00'}
                  </Text>
                  <IconSlash size={10} color="white" />
                  <Text size="sm" c="white">
                    {formatTime(trackEndTimes[track.id] || duration)}
                    </Text>
                </Flex>
              </Flex>
            </Group>

            {/* Track length adjustment slider */}
            {currentTrackIndex === index && (
              <Slider
                min={0}
                max={duration}
                value={trackEndTimes[track.id] || duration}
                onChange={(value) => {
                  setTrackEndTimes((prev) => ({
                    ...prev,
                    [track.id]: value,
                  }));
                }}
                label={formatTime}
                size="sm"
                color="blue"
                styles={{
                  track: { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                  thumb: { borderColor: 'white' },
                  bar: { backgroundColor: 'white' },
                }}
              />
            )}
          </Stack>
        </Card>
      ))}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </Stack>
  );
};
