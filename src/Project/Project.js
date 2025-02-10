import React, { useState, useEffect, useMemo } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';
import Table from '../Table/Table.js';
import { createFFmpegCommand } from '../FFmpeg/FFmpegUtils.js';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function formatDuration(duration) {
  if (!duration || duration === 'Loading...') return 'Loading...';
  const seconds = parseFloat(duration);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

function Project() {
  const [renders, setRenders] = useState(() => JSON.parse(localStorage.getItem('renders') || '[]'));

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);  // New state for tracking selected image index
  const [resolutionOptions, setResolutionOptions] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState('');
  const [alwaysUniqueFilenames, setAlwaysUniqueFilenames] = useState(localStorage.getItem('alwaysUniqueFilenames') === 'true');
  const [paddingColor, setPaddingColor] = useState(localStorage.getItem('paddingColor') || '#FFFFFF');
  const [stretchImageToFit, setStretchImageToFit] = useState(false);
  const [videoWidth, setVideoWidth] = useState('');
  const [videoHeight, setVideoHeight] = useState('');
  const [useBlurBackground, setUseBlurBackground] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const renderColumns = [
    { accessorKey: 'progress', header: 'Progress', cell: ({ row }) => {
      if (row.original.progress === 'Starting...') {
        return <span className={styles.startingAnimation}>Starting...</span>;
      }
      return `${row.original.progress}%`;
    }},
    { accessorKey: 'outputFilename', header: 'Output Filename', cell: ({ row }) => {
      const parts = row.original.outputFilename.split(pathSeparator);
      return parts[parts.length - 1];
    }},
    {
      accessorKey: 'openFolder',
      header: <span>Open Folder</span>,
      cell: ({ row }) => (
        <button onClick={() => alert('Placeholder for opening folder')} title="Open folder" className={styles.openFolderButton}>
          📂
        </button>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'stop',
      header: 'Stop',
      cell: ({ row }) => (
        <button
          className={styles.stopButton}
          onClick={(e) => {
            e.stopPropagation();
            window.api.send('stop-ffmpeg-render', { renderId: row.original.id });
          }}
          title="Stop this render"
        >
          ⏹️
        </button>
      ),
      enableSorting: false,
    },
  ];

  const getInitialState = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [pathSeparator, setPathSeparator] = useState(localStorage.getItem('pathSeparator') || '');

  useEffect(() => {
    const fetchPathSeparator = () => {
      window.api.send('get-path-separator');
      window.api.receive('path-separator-response', (separator) => {
        setPathSeparator(separator);
        localStorage.setItem('pathSeparator', separator); // Cache the separator
      });
    };

    if (!pathSeparator) {
      fetchPathSeparator();
    }

    window.api.receive('selected-folder', (folder) => {
      setOutputFolder(folder);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      window.api.removeAllListeners('selected-folder');
    };
  }, [pathSeparator]);

  useEffect(() => {
    localStorage.setItem('renders', JSON.stringify(renders));
  }, [renders]);

  const addRender = (render) => {
    setRenders(oldRenders => [...oldRenders, render]);
  };

  const updateRender = (id, update) => {
    
    //BUG when this runs, all the image thumbnails in my component are re-rendered, fix?
    setRenders(renders => renders.map(render => render.id === id ? { ...render, ...update } : render));
  };

  const removeRender = (id) => {
    const updatedRenders = renders.filter(render => render.id !== id);
    setRenders(updatedRenders);
  };

  const [audioFiles, setAudioFiles] = useState(() => getInitialState('audioFiles', []));
  const [imageFiles, setImageFiles] = useState(() => getInitialState('imageFiles', []));
  const [audioRowSelection, setAudioRowSelection] = useState(getInitialState('audioRowSelection', {}));
  const [imageRowSelection, setImageRowSelection] = useState(getInitialState('imageRowSelection', {}));
  const [ffmpegError, setFfmpegError] = useState(null);

  const [outputFolder, setOutputFolder] = useState(localStorage.getItem('outputFolder') || '');
  const [outputFilename, setOutputFilename] = useState(() => {
    const initialFilename = localStorage.getItem('outputFilename');
    if (initialFilename) return initialFilename;
    const initialImageFile = JSON.parse(localStorage.getItem('imageFiles') || '[]')[0];
    return initialImageFile ? initialImageFile.filename.split('.').slice(0, -1).join('.') : 'output-video';
  });
  const [outputFormat, setOutputFormat] = useState(localStorage.getItem('outputFormat') || 'mp4');
  const [backgroundColor, setBackgroundColor] = useState(localStorage.getItem('backgroundColor') || '#000000');
  const [usePadding, setUsePadding] = useState(localStorage.getItem('usePadding') === 'true');

  // Save audio files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    } catch (error) {
      console.error('Error saving audioFiles to localStorage:', error);
    }
  }, [audioFiles]);

  // Save image files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
    } catch (error) {
      console.error('Error saving imageFiles to localStorage:', error);
    }
  }, [imageFiles]);

  // Save row selections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('audioRowSelection', JSON.stringify(audioRowSelection));
      localStorage.setItem('imageRowSelection', JSON.stringify(imageRowSelection));
    } catch (error) {
      console.error('Error saving row selections to localStorage:', error);
    }
  }, [audioRowSelection, imageRowSelection]);

  useEffect(() => {
    localStorage.setItem('outputFolder', outputFolder);
    localStorage.setItem('outputFilename', outputFilename);
    localStorage.setItem('outputFormat', outputFormat);
    localStorage.setItem('videoWidth', videoWidth);
    localStorage.setItem('videoHeight', videoHeight);
    localStorage.setItem('backgroundColor', backgroundColor);
    localStorage.setItem('usePadding', usePadding);
  }, [outputFolder, outputFilename, outputFormat, videoWidth, videoHeight, backgroundColor, usePadding]);

  useEffect(() => {
    localStorage.setItem('alwaysUniqueFilenames', alwaysUniqueFilenames);
    localStorage.setItem('paddingColor', paddingColor);
    localStorage.setItem('stretchImageToFit', stretchImageToFit);
  }, [alwaysUniqueFilenames, paddingColor, stretchImageToFit]);

  useEffect(() => {
    window.api.receive('output-folder-set', (folderPath) => {
      setOutputFolder(folderPath);
      localStorage.setItem('outputFolder', folderPath);
    });
  
    return () => {
      window.api.removeAllListeners('output-folder-set');
    };
  }, []);

  const calculateResolution = (width, height, targetWidth) => {
    const aspectRatio = width / height;
    const targetHeight = Math.round(targetWidth / aspectRatio);
    return [targetWidth, targetHeight];
  };

  const getResolutionOptions = async (images) => {
    const options = [];
    for (const image of images) {
      const [width, height] = image.dimensions.split('x').map(Number);
      const resolutions = [
        ...[640, 1280].map(targetWidth => {
          const [resWidth, resHeight] = calculateResolution(width, height, targetWidth);
          return `${resWidth}x${resHeight}`;
        }),
        `${width}x${height}`,
        ...[1920, 2560].map(targetWidth => {
          const [resWidth, resHeight] = calculateResolution(width, height, targetWidth);
          return `${resWidth}x${resHeight}`;
        })
      ];
      options.push(resolutions);
    }
    return options;
  };

  useEffect(() => {
    if (imageFiles.length > 0) {
      getResolutionOptions(imageFiles).then(options => {
        setResolutionOptions(options);
        if (selectedResolution === '') {
          const defaultResolution = options[selectedImageIndex][2]; // Set default to original resolution
          setSelectedResolution(defaultResolution);
          const [width, height] = defaultResolution.split('x');
          setVideoWidth(width);
          setVideoHeight(height);
        }
      });
    }
  }, [imageFiles]);

  const handleImageSelectionChange = (e) => {
    const index = Number(e.target.value);
    setSelectedImageIndex(index);
    // Do not change the resolution options or selected resolution here
  };

  const handleResolutionChange = (e) => {
    const [width, height] = e.target.value.split('x');
    setVideoWidth(width);
    setVideoHeight(height);
    setSelectedResolution(e.target.value);
  };

  const handleOutputFolderChange = (e) => {
    setOutputFolder(e.target.value);
  };

  const handleFilesSelect = (audioData, imageData) => {
    if (audioData.length) {
      setAudioFiles(prev => {
        const updatedFiles = prev.map(file => ({ ...file }));
        audioData.forEach(newFile => {
          const index = updatedFiles.findIndex(f => f.filename === newFile.filename);
          if (index >= 0) {
            updatedFiles[index] = { ...updatedFiles[index], ...newFile };
          } else {
            updatedFiles.push({
              ...newFile,
              id: generateUniqueId(),
              duration: 'Loading...',
            });
          }
        });
        return updatedFiles;
      });
    }

    if (imageData.length) {
      setImageFiles(prev => {
        const updatedImages = prev.map(img => ({ ...img }));
        imageData.forEach(newImage => {
          const index = updatedImages.findIndex(img => img.filename === newImage.filename);
          if (index >= 0) {
            updatedImages[index] = { ...updatedImages[index], ...newImage };
          } else {
            updatedImages.push({
              ...newImage,
              id: generateUniqueId(),
            });
          }
        });
        return updatedImages;
      });
    }
  };

  const clearComponent = () => {
    setAudioFiles([]);
    setImageFiles([]);
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setUsePadding(false);
    setOutputFolder('');
    localStorage.removeItem('audioFiles');
    localStorage.removeItem('imageFiles');
    localStorage.removeItem('audioRowSelection');
    localStorage.removeItem('imageRowSelection');
    localStorage.removeItem('outputFilename');
    localStorage.removeItem('outputFormat');
    localStorage.removeItem('videoWidth');
    localStorage.removeItem('videoHeight');
    localStorage.removeItem('backgroundColor');
    localStorage.removeItem('usePadding');
    localStorage.removeItem('outputFolder');
  };

  const deleteLocalStorage = () => {
    localStorage.clear();
    setAudioFiles([]);
    setImageFiles([]);
    setRenders([]);
    setAudioRowSelection({});
    setImageRowSelection({});
    setOutputFolder('');
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setUsePadding(false);
    setAlwaysUniqueFilenames(false);
    setPaddingColor('#FFFFFF');
    setStretchImageToFit(false);
    setUseBlurBackground(false);
  };

  const getSelectedAudioRows = () => {
    const selectedRows = audioFiles.filter((file) => audioRowSelection[file.id]);

    alert(
      selectedRows
        .map((row) => `${row.filename} (${row.duration})`)
        .join('\n') || 'No audio rows selected'
    );
  };

  const getSelectedImageRows = () => {
    const selectedRows = imageFiles.filter((file) => imageRowSelection[file.id]);

    alert(
      selectedRows
        .map((row) => `${row.filename} (${row.dimensions || 'No dimensions'})`)
        .join('\n') || 'No image rows selected'
    );
  };

  const getUniqueFolderNames = (files) => {
    const folderNames = new Set();
    files.forEach(file => {
      const parts = file.filepath.split(pathSeparator);
      if (parts.length > 1) {
        folderNames.add(parts[parts.length - 2]);
      }
    });
    return Array.from(folderNames);
  };

  const generateOutputFilenameOptions = () => {
    const options = [];
    const uniqueFolderNames = getUniqueFolderNames([...audioFiles, ...imageFiles]);
    uniqueFolderNames.forEach(folderName => {
      options.push(folderName);
    });
    imageFiles.forEach(image => {
      options.push(image.filename.split('.').slice(0, -1).join('.'));
    });
    audioFiles.forEach(audio => {
      options.push(audio.filename.split('.').slice(0, -1).join('.'));
    });
    return options;
  };

  const audioColumns = [
    { accessorKey: 'filename', header: 'File Name' }, // Use `filename`
    { accessorKey: 'duration', header: 'Duration' },
  ];

  const imageColumns = [
    {
      accessorKey: 'thumbnail',
      header: 'Thumbnail',
      cell: ({ row }) => <Thumbnail src={row.original.filepath} />,
    },
    { accessorKey: 'filename', header: 'File Name' }, // Use `filename`
    { accessorKey: 'dimensions', header: 'Dimensions' },
  ];
  

  const handleChooseFolder = async () => {
    window.api.send('open-folder-dialog');
    window.api.receive('selected-folder', (folderPath) => {
      if (folderPath) {
        setOutputFolder(folderPath);
      }
    });
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageReorder = ({ active, over }) => {
    if (active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const Thumbnail = React.memo(({ src }) => {
    const [isLoaded, setIsLoaded] = useState(false);
  
    return (
      <div className={styles.thumbnailWrapper}>
        {!isLoaded && <div className={styles.placeholder}></div>}
        <img
          src={`thum:///${src}`}
          alt="Thumbnail"
          className={styles.thumbnail}
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>
    );
  }, (prevProps, nextProps) => prevProps.src === nextProps.src);
  


  const SortableImage = ({ file, setImageFiles }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  
    const handleStretchImageToFitChange = (e) => {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === file.id
            ? { ...img, stretchImageToFit: e.target.checked }
            : img
        )
      );
    };
  
    const handlePaddingColorChange = (e) => {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === file.id
            ? { ...img, paddingColor: e.target.value }
            : img
        )
      );
    };

    const handleBlurBackgroundChange = (e) => {
      setImageFiles((prev) =>
        prev.map((img) =>
          img.id === file.id
            ? { ...img, useBlurBackground: e.target.checked }
            : img
        )
      );
    };
  
    return (
      <div ref={setNodeRef} style={style} className={styles.imageItem} {...attributes} {...listeners}>
        <Thumbnail src={file.filepath} />
        <div className={styles.expandedContent}>
          <label>
            <input
              type="checkbox"
              checked={file.stretchImageToFit || false}
              onChange={handleStretchImageToFitChange}
            />
            Stretch Image to Fit
          </label>
          <label>
            Padding Color:
            <input
              type="text"
              value={file.paddingColor || "#FFFFFF"}
              onChange={handlePaddingColorChange}
              disabled={file.stretchImageToFit} // Disable when stretchImageToFit is checked
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={file.useBlurBackground || false}
              onChange={handleBlurBackgroundChange}
            />
            Use Blur Background
          </label>
        </div>
      </div>
    );
  };
  
  const copyImage = (imageId) => {
    const imageToCopy = imageFiles.find((img) => img.id === imageId);
    if (imageToCopy) {
      const newImage = { ...imageToCopy, id: generateUniqueId() };
      setImageFiles((prev) => {
        const index = prev.findIndex((img) => img.id === imageId);
        const updated = [...prev];
        updated.splice(index + 1, 0, newImage);
        return updated;
      });
    }
  };
  

  const handleAction = (action, renderId) => {
    switch (action) {
      case 'pause':
      case 'stop':
      case 'start':
      case 'restart':
      case 'delete':
        window.api.send(`ffmpeg-${action}`, { renderId });
        if (action === 'delete') {
          removeRender(renderId);
        }
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleSelectRow = (id) => {
    setImageRowSelection(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Ensure the image data is stable if not changed
  const stableImageFiles = useMemo(() => imageFiles.map(file => ({
    ...file,
    isSelected: !!imageRowSelection[file.id]
  })), [imageFiles, imageRowSelection]);

  const handleRender = () => {
    const renderId = generateUniqueId();
    const selectedAudio = audioFiles.filter((file) => audioRowSelection[file.id]);
    const selectedImages = imageFiles.filter((file) => imageRowSelection[file.id]);
  
    if (selectedAudio.length === 0 || selectedImages.length === 0) {
      alert('Please select at least one audio and one image file.');
      return;
    }
  
    console.log('Selected Audio Files:', selectedAudio);
    console.log('Selected Image Files:', selectedImages);
  
    let totalDuration = 0;
    selectedAudio.forEach(audio => {
      let lengthInSeconds = parseFloat(audio.duration);
  
      if (audio.startTime && audio.endTime && audio.length) {
        const [startMinutes, startSeconds] = audio.startTime.split(':').map(Number);
        const [endMinutes, endSeconds] = audio.endTime.split(':').map(Number);
        const [lengthMinutes, lengthSeconds] = audio.length.split(':').map(Number);
  
        const startTimeInSeconds = startMinutes * 60 + startSeconds;
        const endTimeInSeconds = endMinutes * 60 + endSeconds;
        lengthInSeconds = lengthMinutes * 60 + lengthSeconds; // Use the length field for duration
      }
  
      totalDuration += lengthInSeconds;
      console.log(`Audio File: ${audio.filename}, Duration: ${lengthInSeconds}, Length in Seconds: ${lengthInSeconds}`);
    });
  
    console.log('Total Duration:', totalDuration);
  
    let finalOutputFilename = outputFilename;
    if (alwaysUniqueFilenames) {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      finalOutputFilename = `${outputFilename}_${timestamp}`;
    }
  
    const outputFilePath = `${outputFolder}${pathSeparator}${finalOutputFilename}.${outputFormat}`;
  
    const ffmpegCommand = createFFmpegCommand({
      audioInputs: selectedAudio.map(audio => {
        const inputOptions = [];
        if (audio.startTime) inputOptions.push('-ss', audio.startTime);
        if (audio.endTime) inputOptions.push('-to', audio.endTime);
        inputOptions.push('-i', audio.filepath);
        return {
          ...audio,
          inputOptions,
          duration: audio.length ? audio.length.split(':').reduce((acc, time) => (60 * acc) + +time) : audio.duration // Ensure duration is defined
        };
      }),
      imageInputs: selectedImages.map(image => {
        const [width, height] = image.dimensions.split('x').map(Number);
        return {
          ...image,
          width: width, // Set to the actual image width
          height: height, // Set to the actual image height
          stretchImageToFit: image.stretchImageToFit,
          paddingColor: image.paddingColor || backgroundColor,
          useBlurBackground: image.useBlurBackground || false
        };
      }),
      outputFilepath: outputFilePath,
      width: parseInt(videoWidth),
      height: parseInt(videoHeight),
      paddingCheckbox: usePadding,
      backgroundColor: backgroundColor,
      stretchImageToFit: stretchImageToFit,
      repeatLoop: false,
    });
  
    console.log('FFmpeg Command:', ffmpegCommand.cmdArgs.join(" "));
    console.log('send duration:', ffmpegCommand.outputDuration);
  
    // Clean up old listeners
    window.api.removeAllListeners('ffmpeg-output');
    window.api.removeAllListeners('ffmpeg-error');
    window.api.removeAllListeners('ffmpeg-progress');
    window.api.removeAllListeners('ffmpeg-stop-response');
  
    window.api.send('run-ffmpeg-command', {
      renderId: renderId,
      cmdArgs: ffmpegCommand.cmdArgs,
      outputDuration: ffmpegCommand.outputDuration,
    });
  
    window.api.receive('ffmpeg-output', (data) => {
    });
  
    window.api.receive('ffmpeg-error', (data) => {
      console.log('FFmpeg Error:', data);
      setFfmpegError({
        lastOutput: data.lastOutput
      });

      /*
      setFfmpegError({
        ...data,
        fullCommand: `ffmpeg ${ffmpegCommand.cmdArgs.join(" ")}`
      });
      */

      updateRender(renderId, { progress: 'error' }); // Set progress to "error"
    });
  
    window.api.receive('ffmpeg-progress', ({ renderId, pid, progress }) => {
      updateRender(renderId, { pid, progress });
    });
  
    window.api.receive('ffmpeg-stop-response', ({ renderId, status }) => {
      updateRender(renderId, { progress: status });
      if (status === 'Stopped') {
        setFfmpegError(null); // Clear any existing error message
      }
    });
  
    addRender({
      id: renderId,
      pid: null,
      progress: 'Starting...', // Set initial progress to "Starting..."
      outputFolder: outputFolder, // Use the correct output folder
      outputFilename: finalOutputFilename, // Use the correct output filename
      ffmpegCommand: ffmpegCommand.commandString
    });
  
  };
  

  const handleFilesMetadata = (filesMetadata) => {

    if (!Array.isArray(filesMetadata)) {
      console.error('filesMetadata is not an array:', filesMetadata);
      return;
    }

    filesMetadata.forEach((file, index) => {
      // Set output folder to the first new input file's folder if it's empty
      if (index === 0 && file.filepath) {
        const fileFolder = file.filepath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
        setOutputFolder(fileFolder);
        localStorage.setItem('outputFolder', fileFolder);
      }
      
      if (file.filetype === 'audio') {
        setAudioFiles(prev => {
          const index = prev.findIndex(f => f.filepath === file.filepath);
          if (index >= 0) {
            const updatedFiles = [...prev];
            updatedFiles[index] = { ...updatedFiles[index], ...file };
            return updatedFiles;
          } else {
            return [...prev, {
              id: generateUniqueId(),
              filename: file.filename, // Use `filename`
              filepath: file.filepath,
              duration: file.duration || 'Loading...',
            }];
          }
        });
      } else if (file.filetype === 'image') {
        setImageFiles(prev => {
          const index = prev.findIndex(f => f.filepath === file.filepath);
          if (index >= 0) {
            const updatedImages = [...prev];
            updatedImages[index] = { ...updatedImages[index], ...file };
            return updatedImages;
          } else {
            return [...prev, {
              id: generateUniqueId(),
              filename: file.filename, // Use `filename`
              filepath: file.filepath,
              dimensions: file.dimensions || 'Unknown',
            }];
          }
        });
      }
    });
  };

  const updateAudioFiles = (newFile) => {
    console.log('updateAudioFiles()')
    setAudioFiles(prev => {
      const index = prev.findIndex(f => f.filepath === newFile.filepath);
      if (index >= 0) {
        const updatedFiles = [...prev];
        updatedFiles[index] = { ...updatedFiles[index], ...newFile };
        return updatedFiles;
      } else {
        return [...prev, { ...newFile, id: generateUniqueId() }];
      }
    });
  };

  const updateImageFiles = (newFile) => {
    setImageFiles(prev => {
      const index = prev.findIndex(f => f.filepath === newFile.filepath);
      if (index >= 0) {
        const updatedImages = [...prev];
        updatedImages[index] = { ...updatedImages[index], ...newFile };
        return updatedImages;
      } else {
        return [...prev, { ...newFile, id: generateUniqueId() }];
      }
    });
  };

  // Input validation helper functions
  const sanitizeFilename = (filename) => {
    // Allow alphanumeric characters, underscores, hyphens, and spaces
    return filename.replace(/[^a-zA-Z0-9_-\s]/g, '');
  };

  const sanitizeNumericInput = (value, min, max) => {
    // Remove any non-numeric characters
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    const numValue = parseInt(cleanValue, 10);

    if (isNaN(numValue)) return min;
    if (min !== undefined && numValue < min) return min;
    if (max !== undefined && numValue > max) return max;

    return numValue;
  };

  const validateHexColor = (color) => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    return hexPattern.test(color) ? color : '#000000';
  };

  const handleOutputFilenameChange = (e) => {
    const sanitizedFilename = sanitizeFilename(e.target.value);
    setOutputFilename(sanitizedFilename);
  };

  const handleVideoWidthChange = (e) => {
    const sanitizedWidth = sanitizeNumericInput(e.target.value, 1, 7680); // 8K max
    setVideoWidth(sanitizedWidth.toString());
  };

  const handleVideoHeightChange = (e) => {
    const sanitizedHeight = sanitizeNumericInput(e.target.value, 1, 4320); // 8K max
    setVideoHeight(sanitizedHeight.toString());
  };

  const handleBackgroundColorChange = (e) => {
    const sanitizedColor = validateHexColor(e.target.value);
    setBackgroundColor(sanitizedColor);
  };

  const handlePaddingColorChange = (e) => {
    setPaddingColor(e.target.value);
  };

  const handleStretchImageToFitChange = (e) => {
    setStretchImageToFit(e.target.checked);
  };

  const handleCloseError = () => {
    setFfmpegError(null);
  };

  const resetToDefault = () => {
    setAudioFiles([]);
    setImageFiles([]);
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setAlwaysUniqueFilenames(false);
    localStorage.clear();
  };

  const selectedImages = imageFiles.filter((file) => imageRowSelection[file.id]);
  const isHorizontal = windowWidth > 600; // Adjust this breakpoint as needed.


  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
        <button className={styles.deleteLocalStorageButton} onClick={deleteLocalStorage}>
          Delete Local Storage
        </button>
      </div>

      <FileUploader onFilesMetadata={handleFilesMetadata} />

      <h2>Audio Files</h2>
      <Table
        data={audioFiles}
        rowSelection={audioRowSelection}
        setRowSelection={setAudioRowSelection}
        setData={setAudioFiles}
        columns={audioColumns}
        setAudioFiles={setAudioFiles}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      <h2>Image Files</h2>
      <Table
        data={imageFiles}
        rowSelection={imageRowSelection}
        setRowSelection={setImageRowSelection}
        setData={setImageFiles}
        columns={imageColumns}
        isImageTable={true}
        setImageFiles={setImageFiles}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />

      <div className={styles.renderOptionsSection}>
        <h2 className={styles.renderOptionsTitle}>Render Options</h2>
        <button
          className={styles.resetButton}
          onClick={resetToDefault}
        >
          Reset to Default
        </button>
        <div className={styles.renderOptionsGrid}>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFolder" className={styles.renderOptionLabel}>
              Output Folder
            </label>
            <div className={styles.editableDropdownFolder}>
              <input
                type="text"
                id="outputFolder"
                value={outputFolder}
                onChange={handleOutputFolderChange}
                placeholder="Choose output folder"
                className={styles.renderOptionInput}
              />
              <button
                onClick={handleChooseFolder}
                className={styles.folderButton}
                title="Choose Folder"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={styles.folderIcon}
                >
                  <path d="M10 4H2v16h20V6H12l-2-2zM4 8h16v10H4V8z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFilename" className={styles.renderOptionLabel}>
              Output Filename
            </label>
            <div className={styles.editableDropdown}>
              <input
                type="text"
                id="outputFilename"
                value={outputFilename}
                onChange={handleOutputFilenameChange}
                placeholder="Enter filename (letters, numbers, spaces, - and _ only)"
                className={styles.renderOptionInput}
                maxLength={255}
              />
              <select
                id="outputFilenameOptions"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className={styles.renderOptionSelect}
              >
                {generateOutputFilenameOptions().map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFormat" className={styles.renderOptionLabel}>
              Output Format
            </label>
            <select
              id="outputFormat"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className={styles.renderOptionSelect}
            >
              <option value="mp4">MP4</option>
              <option value="mkv">MKV</option>
            </select>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="resolution" className={styles.renderOptionLabel}>
              Resolution
            </label>
            <div className={styles.resolutionBox}>
              <select
                id="imageSelection"
                value={selectedImageIndex}
                onChange={handleImageSelectionChange}
                className={styles.renderOptionSelect}
              >
                {imageFiles.map((image, index) => (
                  <option key={index} value={index}>
                    {image.filename}
                  </option>
                ))}
              </select>
              <select
                id="resolutionSelection"
                value={selectedResolution}
                onChange={handleResolutionChange}
                className={styles.renderOptionSelect}
              >
                {resolutionOptions[selectedImageIndex]?.map((resolution, index) => (
                  <option key={index} value={resolution}>
                    {resolution}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="videoWidth" className={styles.renderOptionLabel}>
              Width (px)
            </label>
            <input
              type="text"
              id="videoWidth"
              value={videoWidth}
              onChange={handleVideoWidthChange}
              className={styles.renderOptionInput}
              placeholder="Enter width (1-7680)"
              maxLength={4}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="videoHeight" className={styles.renderOptionLabel}>
              Height (px)
            </label>
            <input
              type="text"
              id="videoHeight"
              value={videoHeight}
              onChange={handleVideoHeightChange}
              className={styles.renderOptionInput}
              placeholder="Enter height (1-4320)"
              maxLength={4}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label className={styles.renderOptionCheckboxLabel}>
              <input
                type="checkbox"
                id="alwaysUniqueFilenames"
                checked={alwaysUniqueFilenames}
                onChange={(e) => setAlwaysUniqueFilenames(e.target.checked)}
                className={styles.renderOptionCheckbox}
              />
              Always Unique Filenames
            </label>
          </div>
        </div>


          {/* Image Timeline */}
          <div className={styles.renderOptionGroup}>

            <div id="imageTimelineBox">
              <h3 className={styles.blackText}>Image Timeline</h3>
              <DndContext id="imageTimelineContent" collisionDetection={closestCenter} onDragEnd={handleImageReorder}>
                <SortableContext items={selectedImages.map((file) => file.id)} strategy={horizontalListSortingStrategy}>
                  <div className={`${styles.imageTimeline}`}>
                    {selectedImages.length === 0 ? (
                      <p>No images selected</p>
                    ) : (
                      selectedImages.map((file) => (
                        <SortableImage key={file.id} file={file} setImageFiles={setImageFiles} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

        <button
          className={styles.renderButton}
          onClick={handleRender}
          disabled={audioFiles.filter((file) => audioRowSelection[file.id]).length === 0 || imageFiles.filter((file) => imageRowSelection[file.id]).length === 0}
        >
          Render
        </button>
      </div>

      {ffmpegError && (
        <div className={styles.errorContainer}>
          <button className={styles.closeButton} onClick={handleCloseError}>x</button>
          <h3>FFmpeg Error:</h3>
          <pre className={styles.errorPre}>{ffmpegError.lastOutput}</pre>
          {/* <pre className={styles.errorPre}>{ffmpegError.fullCommand}</pre> */}
        </div>
      )}

      <div className={styles.rendersSection}>
        <h2>Renders List</h2>
        <Table
          data={renders.map(render => {
            const parts = render.outputFilename.split(pathSeparator);
            const filename = parts[parts.length - 1];
            return {
              progress: render.progress,
              id: render.id,
              outputFilename: filename, // Display only the filename with extension
              ffmpegCommand: render.ffmpegCommand
            };
          })}
          columns={renderColumns}
          rowSelection={{}} // No row selection needed for this table
          setRowSelection={() => {}} // Dummy function
          setData={setRenders} // This table modifies renders
          isRenderTable={true}
          ffmpegCommand={renders.map(render => render.ffmpegCommand).join('\n')}
          removeRender={removeRender}
        />
        {/*
        {renders.map(render => (
          <div key={render.id} className={styles.renderItem}>
            <div>Render ID: {render.id}</div>
            <div>PID: {render.pid}</div>
            <div>Progress: {render.progress}%</div>
            <div>
              <button onClick={() => handleOpenFolder(render.outputFolder)}>Open Folder</button>
              <button onClick={() => handleAction('pause', render.id)}>Pause</button>
              <button onClick={() => handleAction('stop', render.id)}>Stop</button>
              <button onClick={() => handleAction('start', render.id)}>Start</button>
              <button onClick={() => handleAction('restart', render.id)}>Restart</button>
              <button onClick={() => handleAction('delete', render.id)}>Delete</button>
            </div>
          </div>
        ))}
        */}
      </div>
    </div>
  );
}

export default Project;

