'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  IconGripVertical,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconSlash,
  IconUpload,
} from '@tabler/icons-react';
import { ActionIcon, Button, Card, Flex, Group, Slider, Stack, Text } from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { Track } from '../types';

interface WaveformProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  color?: string;
  height?: number;
  onSeek?: (time: number) => void;
}

const Waveform: React.FC<WaveformProps> = ({
  audioRef,
  currentTime,
  duration,
  isPlaying,
  color = 'white',
  height = 60,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const waveformDataRef = useRef<number[]>([]);

  // Generate waveform data once on mount
  useEffect(() => {
    if (!waveformDataRef.current.length) {
      const points = 100;
      waveformDataRef.current = Array.from({ length: points }, (_, i) => {
        // Create a more natural-looking waveform shape
        const x = i / points;
        return 0.3 + 0.2 * Math.sin(x * Math.PI * 4);
      });
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const newAnalyser = audioContext.createAnalyser();
    console.log('audioContext state:', audioContext.state);

    let source: MediaElementAudioSourceNode;
    try {
      source = audioContext.createMediaElementSource(audioRef.current);
    } catch (e) {
      console.warn('MediaElementSource already exists, reusing the existing one.');
      source = audioContext.createMediaElementSource(audioRef.current);
    }

    source.connect(newAnalyser);
    newAnalyser.connect(audioContext.destination);

    newAnalyser.fftSize = 256;
    setAnalyser(newAnalyser);

    return () => {
      audioContext.close();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioRef]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const data = waveformDataRef.current;
      const barWidth = width / data.length;
      const playProgress = currentTime / duration;

      data.forEach((value, i) => {
        const x = i * barWidth;
        const barHeight = value * height;

        // Smooth color transition
        if (isPlaying) {
          const distanceFromPlayhead = Math.abs(x / width - playProgress);
          const alpha = Math.max(0.3, 1 - distanceFromPlayhead);
          ctx.fillStyle =
            x / width < playProgress
              ? color
              : `${color}${Math.floor(alpha * 50)
                  .toString(16)
                  .padStart(2, '0')}`;
        } else {
          ctx.fillStyle = x / width < playProgress ? color : `${color}50`;
        }

        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isPlaying, color, height, currentTime, duration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / rect.width) * duration;
    onSeek(seekTime);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      onClick={handleClick}
      style={{
        width: '100%',
        height: `${height}px`,
        cursor: 'pointer',
      }}
    />
  );
};

interface AudioPlayerSuiteProps {
  // You can pass in initial tracks if desired; otherwise, start empty.
  initialTracks?: Track[];
}

export const AudioPlayerSuite = ({ initialTracks = [] }: AudioPlayerSuiteProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [trackEndTimes, setTrackEndTimes] = useState<{ [key: string]: number }>({});

  const [files, setFiles] = useState<FileWithPath[]>([]); 
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // --- File Upload Handler ---
  useEffect(() => {
    if (files.length === 0 || !isMounted) return;
    setTracks((prevTracks) => {
      const newTracks: Track[] = files.map((file) => ({
        id: Math.random().toString(36).slice(2, 9),
        name: file.name,
        src: URL.createObjectURL(file),
        color: getRandomPastelColor(),
      }));
      const updatedTracks = [...prevTracks, ...newTracks];
      // If no track is currently selected, set the first uploaded track as current.
      if (prevTracks.length === 0 && newTracks.length > 0) {
        setCurrentTrackIndex(0);
      }
      return updatedTracks;
    });
  }, [files]);

  const getRandomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 90%)`;
  };

  // --- Audio Element Handling ---
  useEffect(() => {
    if (audioRef.current && currentTrackIndex !== null && tracks[currentTrackIndex]) {
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

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  // --- Drag and Drop Handlers ---
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
    <Stack w="50%" justify="center" align="center">
      <Flex direction="row" align="center" w="100%" justify="space-between">
        <Text style={{ fontSize: 28 }}>music builder</Text>
        <Dropzone onDrop={setFiles}>
          <Button color="purple" radius={100}>
            <Group>
              <IconUpload size={20} />
              <Text style={{ fontWeight: 400 }}>upload new file</Text>
            </Group>
          </Button>
        </Dropzone>
      </Flex>

      {/* Player Tracks */}
      <Stack bg="#00000010" w="100%" gap="xl" style={{ borderRadius: 10 }}>
        {tracks.map((track: Track, index: number) => (
          <Card
            key={track.id || index}
            p="md"
            withBorder
            radius={3}
            draggable
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
                        setIsPlaying(false);
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
                  <Text fw={799} c="white">
                    {track.name}
                  </Text>
                </Group>
                <Flex flex="1" align="center" justify="end">
                  <Flex align="center" gap="sm">
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

              {currentTrackIndex === index && (
                <Waveform
                  audioRef={audioRef}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  color="white"
                  height={60}
                  onSeek={handleSeek}
                />
              )}
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
    </Stack>
  );
};
