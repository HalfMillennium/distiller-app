'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  IconArrowDown,
  IconArrowUp,
  IconGripVertical,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconSlash,
  IconUpload,
} from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionIcon, Button, Card, Flex, Group, Slider, Stack, Text } from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { Track } from '../types';
import { AppDispatch, RootState } from './store/store';
import { addTracks, setCurrentTrackId, setTracks } from './store/tracks/tracksSlice';

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

  // Audio player refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

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

    const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
    let audioContext = audioContextRef.current;
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      audioContextRef.current = audioContext;
    }

    const newAnalyser = audioContext.createAnalyser();
    newAnalyser.fftSize = 256;

    let source: MediaElementAudioSourceNode;
    try {
      if (sourceRef.current) {
        source = sourceRef.current;
      } else {
        source = audioContext.createMediaElementSource(audioRef.current);
        sourceRef.current = source;
      }

      source.connect(newAnalyser);
      newAnalyser.connect(audioContext.destination);
      newAnalyser.fftSize = 256;

      setAnalyser(newAnalyser);

      return () => {
        if (!sourceRef.current) {
          source.disconnect();
        }
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
      };
    } catch (e) {
      console.error('Error setting up audio context:', e);
      return;
    }
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
  initialTracks?: Track[];
}

export const AudioPlayerSuite = ({ initialTracks = [] }: AudioPlayerSuiteProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracks = useSelector((state: RootState) => state.tracks.tracks);
  const currentTrackIndex = useSelector((state: RootState) => state.tracks.currentTrackId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const [trackEndTimes, setTrackEndTimes] = useState<{ [key: string]: number }>({});
  const dispatch = useDispatch<AppDispatch>();
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (files.length === 0 || !isMounted) return;
    const newTracks: Track[] = files.map((file, i) => ({
      id: i,
      name: file.name,
      src: URL.createObjectURL(file),
      color: getRandomPastelColor(),
    }));
    dispatch(addTracks({ tracks: newTracks }));
  }, [files]);

  const getRandomPastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 90%)`;
  };

  useEffect(() => {
    if (
      audioRef.current &&
      currentTrackIndex !== null &&
      currentTrackIndex &&
      tracks[currentTrackIndex]
    ) {
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
      if (currentTrackIndex && !trackEndTimes[tracks[currentTrackIndex].id]) {
        setTrackEndTimes((prev) => ({
          ...prev,
          [tracks[currentTrackIndex].id]: audio.duration,
        }));
      }
    };

    const handleTimeUpdate = () => {
      if (
        currentTrackIndex !== null &&
        currentTrackIndex &&
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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedTrack(index);
    e.currentTarget.style.opacity = '0.5';
  };

  useEffect(() => {
    if (currentTrackIndex && draggedTrack) {
      let newCurrentIndex: number = currentTrackIndex;
      if (dragTarget && currentTrackIndex === draggedTrack) {
        newCurrentIndex = dragTarget;
      } else if (
        dragTarget &&
        currentTrackIndex > draggedTrack &&
        currentTrackIndex <= dragTarget
      ) {
        newCurrentIndex--;
      } else if (
        dragTarget &&
        currentTrackIndex < draggedTrack &&
        currentTrackIndex >= dragTarget
      ) {
        newCurrentIndex++;
      }
      dispatch(setCurrentTrackId({ id: newCurrentIndex }));
    }
  }, [tracks]);

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';

    if (draggedTrack !== null && dragTarget !== null && draggedTrack !== dragTarget) {
      const newTracks = [...tracks];
      const [draggedItem] = newTracks.splice(draggedTrack, 1);
      newTracks.splice(dragTarget, 0, draggedItem);

      // Update track IDs to ensure uniqueness
      const updatedTracks = newTracks.map((track, index) => ({
        ...track,
        id: index, // Reassign IDs based on new position
      }));

      dispatch(setTracks({ tracks: updatedTracks }));
    }

    setDraggedTrack(null);
    setDragTarget(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedTrack === null || draggedTrack === index) return;
    setDragTarget(index);
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
      <Stack style={{ width: '100%', overflowY: 'auto', maxHeight: 600, scrollbarWidth: 'none' }}>
        <Stack w="100%" gap="md" style={{ borderRadius: 10 }}>
          {tracks.map((track: Track, index: number) => (
            <Card
              key={index}
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
                opacity: draggedTrack === index ? 0.5 : 1,
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
                          dispatch(setCurrentTrackId({ id: index }));
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
                    <Text
                      fw={799}
                      style={{ color: 'white', filter: 'invert(1) grayscale(1)' }}
                    >
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
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <IconArrowUp size={24} color="gray" style={{ display: 'none' }} id="scroll-up-icon" />
          <IconArrowDown size={24} color="gray" style={{ display: 'none' }} id="scroll-down-icon" />
        </div>
      </Stack>

      <script>
        {`
        const container = document.querySelector('[style*="overflow-y: auto"]');
        const upIcon = document.getElementById('scroll-up-icon');
        const downIcon = document.getElementById('scroll-down-icon');

        container.addEventListener('scroll', () => {
        const midpoint = container.scrollHeight / 2;
        const scrollTop = container.scrollTop;
        const scrollBottom = container.scrollHeight - container.clientHeight - scrollTop;

        if (scrollTop > midpoint) {
          upIcon.style.display = 'block';
          downIcon.style.display = 'none';
        } else if (scrollBottom > midpoint) {
          upIcon.style.display = 'none';
          downIcon.style.display = 'block';
        } else {
          upIcon.style.display = 'none';
          downIcon.style.display = 'none';
        }
        });
      `}
      </script>
    </Stack>
  );
};
