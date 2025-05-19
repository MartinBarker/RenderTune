import React, { useState, useEffect, useMemo, useRef } from 'react'; // Import useRef
import { useLocation } from 'react-router-dom'; 
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
  const location = useLocation(); 
  const filesMetadata = location.state?.filesMetadata || []; 

  const [renders, setRenders] = useState(() => JSON.parse(localStorage.getItem('renders') || '[]'));

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);  
  const [resolutionOptions, setResolutionOptions] = useState([]);
  const [selectedResolution, setSelectedResolution] = useState('');
  const [alwaysUniqueFilenames, setAlwaysUniqueFilenames] = useState(localStorage.getItem('alwaysUniqueFilenames') === 'true');
  const [paddingColor, setPaddingColor] = useState(localStorage.getItem('paddingColor') || '#FFFFFF');
  const [stretchImageToFit, setStretchImageToFit] = useState(false);
  const [videoWidth, setVideoWidth] = useState('');
  const [videoHeight, setVideoHeight] = useState('');
  const [useBlurBackground, setUseBlurBackground] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFullErrorLog, setShowFullErrorLog] = useState(false);

  // Refs for Table components
  const audioTableRef = useRef(null);
  const imageTableRef = useRef(null);
  const rendersTableRef = useRef(null);


  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const handleOpenFolder = (renderId) => {
    const render = renders.find(r => r.id === renderId);
    if (render) {
      console.log('handleOpenFolder called with render:', render);
      console.log('Complete output folder filepath location:', render.outputFilepath);
      if (render.outputFilepath) {
        window.api.send('open-dir', render.outputFilepath);
      } else {
        console.error('Output folder path is undefined');
      }
    } else {
      console.error('Render not found for id:', renderId);
    }
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
        <button
          onClick={() => handleOpenFolder(row.original.id)}
          title="Open folder"
          className={styles.openFolderButton}
        >
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
          disabled={row.original.progress === 'error' || row.original.progress === 'Stopped' || row.original.progress === 100}
        >
          ⏹️
        </button>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'openFile',
      header: 'Open File',
      cell: ({ row }) => (
        <button
          className={styles.openFileButton}
          onClick={() => handleAction('open-file', row.original.id)}
          title="Open file"
          disabled={row.original.progress !== 100}
        >
          ▶️
        </button>
      ),
      enableSorting: false,
    },
{
  accessorKey: 'deleteFile',
  header: 'Delete File',
  cell: ({ row }) => (
    <button
      className={styles.deleteFileButton}
      onClick={() => handleAction('delete-file', row.original.id)}
      title="Delete file"
      disabled={typeof row.original.progress === 'number' && row.original.progress < 100 && row.original.progress !== 'error' && row.original.progress !== 'Stopped'}
    >
      🗑️
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
        localStorage.setItem('pathSeparator', separator); 
      });
    };

    if (!pathSeparator) {
      fetchPathSeparator();
    }

    window.api.receive('selected-folder', (folder) => {
      setOutputFolder(folder);
    });

    return () => {
      window.api.removeAllListeners('selected-folder');
      window.api.removeAllListeners('path-separator-response');
    };
  }, [pathSeparator]);

  useEffect(() => {
    localStorage.setItem('renders', JSON.stringify(renders));
  }, [renders]);

  const addRender = (render) => {
    setRenders(oldRenders => [...oldRenders, render]);
  };

  const updateRender = (id, update) => {
    setRenders(prevRenders => prevRenders.map(render => render.id === id ? { ...render, ...update } : render));
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

  useEffect(() => {
    try {
      localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    } catch (error) {
      console.error('Error saving audioFiles to localStorage:', error);
    }
  }, [audioFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
    } catch (error) {
      console.error('Error saving imageFiles to localStorage:', error);
    }
  }, [imageFiles]);

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
    localStorage.setItem('alwaysUniqueFilenames', alwaysUniqueFilenames.toString());
    localStorage.setItem('paddingColor', paddingColor);
    localStorage.setItem('stretchImageToFit', stretchImageToFit.toString());
    localStorage.setItem('useBlurBackground', useBlurBackground.toString());
  }, [alwaysUniqueFilenames, paddingColor, stretchImageToFit, useBlurBackground]);


  useEffect(() => {
    window.api.receive('output-folder-set', (folderPath) => {
      setOutputFolder(folderPath);
      localStorage.setItem('outputFolder', folderPath);
    });
  
    return () => {
      window.api.removeAllListeners('output-folder-set');
    };
  }, []);


  useEffect(() => {
    if (filesMetadata.length > 0) {
      handleFilesMetadata(filesMetadata); 
    }
  }, [filesMetadata]); // filesMetadata is the main dependency

  const calculateResolution = (width, height, targetWidth) => {
    const aspectRatio = width / height;
    const targetHeight = Math.round(targetWidth / aspectRatio);
    return [targetWidth, targetHeight];
  };

  const getResolutionOptions = async (images) => {
    const options = [];
    for (const image of images) {
      if (!image.dimensions || typeof image.dimensions !== 'string') { // Add guard clause
        console.warn('Image dimensions are invalid for image:', image);
        options.push([]); // Push empty array or default resolutions
        continue;
      }
      const [width, height] = image.dimensions.split('x').map(Number);
      if (isNaN(width) || isNaN(height) || height === 0) { // Add guard clause for division by zero
         console.warn('Parsed image dimensions are invalid for image:', image);
         options.push([]);
         continue;
      }
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
        // Only set default resolution if no resolution is currently selected
        // and we have valid options for the current image
        if (!selectedResolution && options[selectedImageIndex] && options[selectedImageIndex].length > 2) {
          const defaultResolution = options[selectedImageIndex][2];
          const [width, height] = defaultResolution.split('x');
          setVideoWidth(width);
          setVideoHeight(height);
          setSelectedResolution(defaultResolution);
        }
      });
    }
  }, [imageFiles, selectedImageIndex]); // Remove selectedResolution from dependencies

  const handleImageSelectionChange = (e) => {
    const index = Number(e.target.value);
    setSelectedImageIndex(index);
    // Only reset resolution if we have options for the new index
    if (resolutionOptions[index] && resolutionOptions[index].length > 2) {
      const defaultResolution = resolutionOptions[index][2];
      const [width, height] = defaultResolution.split('x');
      setVideoWidth(width);
      setVideoHeight(height);
      setSelectedResolution(defaultResolution);
    }
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


  const clearComponent = () => {
    setAudioFiles([]);
    setImageFiles([]);
    setAudioRowSelection({});
    setImageRowSelection({});
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setUsePadding(false);
    setOutputFolder('');
    setGlobalFilter(""); // Clear global filter
    // Clear relevant localStorage items
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
    // Reset other specific states if needed
    setAlwaysUniqueFilenames(false);
    localStorage.removeItem('alwaysUniqueFilenames');
    setPaddingColor('#FFFFFF');
    localStorage.removeItem('paddingColor');
    setStretchImageToFit(false);
    localStorage.removeItem('stretchImageToFit');
    setUseBlurBackground(false);
    localStorage.removeItem('useBlurBackground');
  };

  const deleteLocalStorage = () => {
    localStorage.clear();
    // Reset all state to default values
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
    setPathSeparator(''); // Reset path separator so it's fetched again
    setGlobalFilter("");
    setFfmpegError(null);
    setSelectedImageIndex(0);
    setResolutionOptions([]);
    setSelectedResolution('');
  };


  const getUniqueFolderNames = (files) => {
    const folderNames = new Set();
    files.forEach(file => {
      if (file.filepath && pathSeparator) { // Check for pathSeparator
        const parts = file.filepath.split(pathSeparator);
        if (parts.length > 1) {
          folderNames.add(parts[parts.length - 2]);
        }
      }
    });
    return Array.from(folderNames);
  };

  const generateOutputFilenameOptions = () => {
    const options = [];
    if (pathSeparator) { // Only generate if pathSeparator is available
        const uniqueFolderNames = getUniqueFolderNames([...audioFiles, ...imageFiles]);
        uniqueFolderNames.forEach(folderName => {
        options.push(folderName);
        });
    }
    imageFiles.forEach(image => {
      options.push(image.filename.split('.').slice(0, -1).join('.'));
    });
    audioFiles.forEach(audio => {
      options.push(audio.filename.split('.').slice(0, -1).join('.'));
    });
    // Add a default option if options array is empty
    if (options.length === 0) {
        options.push("output-video");
    }
    return Array.from(new Set(options)); // Ensure unique options
  };

  const audioColumns = [
    { accessorKey: 'filename', header: 'File Name' },
    { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => formatDuration(row.original.duration) },
  ];

  const imageColumns = [
    {
      accessorKey: 'thumbnail',
      header: 'Thumbnail',
      cell: ({ row }) => <Thumbnail src={row.original.filepath} />,
      enableSorting: false,
    },
    { accessorKey: 'filename', header: 'File Name' }, 
    { accessorKey: 'dimensions', header: 'Dimensions' },
  ];
  

  const handleChooseFolder = async () => {
    window.api.send('open-folder-dialog');
    // Listener for 'selected-folder' is in useEffect
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
          src={`thum:///${src}`} // Ensure thum protocol is handled by main process
          alt="Thumbnail"
          className={styles.thumbnail}
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
          onError={(e) => { // Basic error handling for image load
            console.error("Thumbnail load error:", src);
            e.target.style.display = 'none'; // Hide broken image icon
            // Optionally, show placeholder again or a specific error icon
            const placeholder = e.target.previousSibling;
            if (placeholder && placeholder.classList.contains(styles.placeholder)) {
                placeholder.style.display = 'block';
            }
          }}
        />
      </div>
    );
  }, (prevProps, nextProps) => prevProps.src === nextProps.src);
  
  const SortableImage = ({ file }) => { // Removed setImageFiles from props as it's in scope
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });
  
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
  
    const handlePropertyChange = (property, value) => {
        setImageFiles((prev) =>
          prev.map((img) =>
            img.id === file.id
              ? { ...img, [property]: value }
              : img
          )
        );
      };

    const handleCheckboxChange = (property, checked) => {
        setImageFiles((prev) =>
            prev.map((img) => {
                if (img.id === file.id) {
                    const newImg = { ...img, [property]: checked };
                    if (property === 'stretchImageToFit' && checked) {
                        newImg.useBlurBackground = false;
                        newImg.paddingColor = null;
                    } else if (property === 'useBlurBackground' && checked) {
                        newImg.stretchImageToFit = false;
                        newImg.paddingColor = null;
                    }
                    return newImg;
                }
                return img;
            })
        );
    };
  
    return (
      <div ref={setNodeRef} style={style} className={styles.imageItem} {...attributes} {...listeners}>
        <Thumbnail src={file.filepath} />
        <div className={styles.imageOptions}> {/* Changed class from expandedContent */}
          <label className={styles.renderOptionCheckboxLabel}>
            <input
              type="checkbox"
              checked={file.stretchImageToFit || false}
              onChange={(e) => handleCheckboxChange('stretchImageToFit', e.target.checked)}
              className={styles.renderOptionCheckbox}
            />
            Stretch
          </label>
          <label className={styles.renderOptionLabel}>
            Padding:
            <input
              type="color" // Changed to color picker for better UX
              value={file.paddingColor || "#FFFFFF"}
              onChange={(e) => {
                handlePropertyChange('paddingColor', e.target.value);
                // Uncheck other options when color is manually set
                handleCheckboxChange('stretchImageToFit', false);
                handleCheckboxChange('useBlurBackground', false);
              }}
              disabled={file.stretchImageToFit || file.useBlurBackground}
              className={styles.renderOptionColor}
            />
          </label>
          <label className={styles.renderOptionCheckboxLabel}>
            <input
              type="checkbox"
              checked={file.useBlurBackground || false}
              onChange={(e) => handleCheckboxChange('useBlurBackground', e.target.checked)}
              className={styles.renderOptionCheckbox}
            />
            Blur BG
          </label>
        </div>
      </div>
    );
  };
  
  const handleAction = (action, renderId) => {
    switch (action) {
      case 'pause': // Pause/resume might not be directly supported by simple ffmpeg stop/start
      case 'stop':
        window.api.send('stop-ffmpeg-render', { renderId }); // Corrected event name
        break;
      // 'start' and 'restart' would require re-issuing the command, more complex
      case 'delete': // This deletes the render entry, not the file.
        removeRender(renderId); // Assuming removeRender correctly updates state and localStorage
        break;
      case 'open-file':
        const render = renders.find(r => r.id === renderId);
        if (render && render.progress === 100 && render.outputFilepath) {
          window.api.send('open-file', render.outputFilepath);
        }
        break;
      case 'delete-file':
        const renderToDelete = renders.find(r => r.id === renderId);
        if (renderToDelete && renderToDelete.outputFilepath) {
          window.api.send('delete-render-file', { outputFilePath: renderToDelete.outputFilepath });
          // Optimistically remove from UI or wait for confirmation
          removeRender(renderId); 
        }
        break;
      default:
        console.error('Unknown action:', action);
    }
  };


  const handleRender = () => {
    const renderId = generateUniqueId();
    
    // Get selected audio and image files using the refs to ensure correct order
    const selectedAudio = audioTableRef.current?.getOrderedSelectedRows() || [];
    const selectedImagesFromTable = imageTableRef.current?.getOrderedSelectedRows() || [];

    if (selectedAudio.length === 0 || selectedImagesFromTable.length === 0) {
      alert('Please select at least one audio and one image file from the tables.');
      return;
    }
  
    console.log('Selected Audio Files (ordered for render):', selectedAudio);
    console.log('Selected Image Files (ordered from table for render):', selectedImagesFromTable);
  
    let totalDuration = 0;
    selectedAudio.forEach(audio => {
      let lengthInSeconds = parseFloat(audio.duration); // Default to full duration
  
      // If startTime, endTime, or length are specified in the audio object (e.g., from expanded row inputs)
      if (audio.length) { // Prioritize 'length' if set
        const parts = audio.length.split(':').map(Number);
        if (parts.length === 2) lengthInSeconds = parts[0] * 60 + parts[1];
        else if (parts.length === 3) lengthInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      // Note: startTime and endTime from expanded rows would affect individual segment processing in FFmpeg command
  
      totalDuration += lengthInSeconds;
      console.log(`Audio File: ${audio.filename}, Calculated Duration for concat: ${lengthInSeconds}`);
    });
  
    console.log('Total Calculated Duration for FFmpeg output:', totalDuration);
  
    let finalOutputFilename = outputFilename;
    if (alwaysUniqueFilenames) {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
      finalOutputFilename = `${outputFilename}_${timestamp}`;
    }
  
    const outputFilePath = `${outputFolder}${pathSeparator}${finalOutputFilename}.${outputFormat}`;
  
    const ffmpegCommand = createFFmpegCommand({
      audioInputs: selectedAudio.map(audio => {
        const inputOptions = [];
        // These options are for if FFmpeg should trim the input *before* concatenation/processing
        if (audio.startTime && audio.length) inputOptions.push('-ss', audio.startTime); // Start time for this segment
        if (audio.length) inputOptions.push('-t', audio.length);   // Duration for this segment
        inputOptions.push('-i', audio.filepath);
        return {
          ...audio,
          inputOptions,
          // Ensure duration passed to createFFmpegCommand is the one to be used for this segment
          duration: audio.length ? audio.length.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : parseFloat(audio.duration)
        };
      }),
      imageInputs: selectedImagesFromTable.map(image => { // Use images selected from table
        const [imgWidth, imgHeight] = image.dimensions.split('x').map(Number);
        return {
          ...image, // This includes stretchImageToFit, paddingColor, useBlurBackground from table row's expanded state
          width: imgWidth, 
          height: imgHeight,
        };
      }),
      outputFilepath: outputFilePath,
      width: parseInt(videoWidth),
      height: parseInt(videoHeight),
      paddingCheckbox: usePadding, // This seems like a global padding toggle, image-specific padding is in imageInputs
      backgroundColor: backgroundColor, // Global background, might be overridden by image-specific paddingColor
      // stretchImageToFit: stretchImageToFit, // This global one might conflict. Image-specific one is preferred.
      // repeatLoop: false, // Not currently used or set by UI
    });
  
    console.log('FFmpeg Command Args:', ffmpegCommand.cmdArgs.join(" "));
    console.log('FFmpeg Output Duration:', ffmpegCommand.outputDuration);
  
    window.api.removeAllListeners('ffmpeg-output');
    window.api.removeAllListeners('ffmpeg-error');
    window.api.removeAllListeners('ffmpeg-progress');
    window.api.removeAllListeners('ffmpeg-stop-response');
  
    window.api.send('run-ffmpeg-command', {
      renderId: renderId,
      cmdArgs: ffmpegCommand.cmdArgs,
      outputDuration: ffmpegCommand.outputDuration, // Pass the calculated total duration
    });
  
    window.api.receive('ffmpeg-output', (data) => {
        // console.log('FFmpeg Output:', data);
    });
  
    window.api.receive('ffmpeg-error', (data) => {
      console.error('FFmpeg Error Received:', data);
      setFfmpegError({
        lastOutput: data.lastOutput || "Unknown error (no last output).",
        fullErrorLog: data.fullErrorLog || "Unknown error (no full log)."
      });
      updateRender(renderId, { progress: 'error' });
    });
  
    window.api.receive('ffmpeg-progress', ({ renderId: progRenderId, pid, progress }) => {
      if (progRenderId === renderId) { // Ensure progress updates are for the correct render
        updateRender(progRenderId, { pid, progress });
      }
    });
  
    window.api.receive('ffmpeg-stop-response', ({ renderId: stopRenderId, status }) => {
      if (stopRenderId === renderId) {
        updateRender(stopRenderId, { progress: status });
        if (status === 'Stopped') {
          setFfmpegError(null); 
        }
      }
    });
  
    addRender({
      id: renderId,
      pid: null,
      progress: 'Starting...',
      outputFolder: outputFolder, 
      outputFilepath: outputFilePath, 
      outputFilename: finalOutputFilename, 
      ffmpegCommand: ffmpegCommand.cmdArgs.join(" "), // Store the command string for display
      videoWidth: videoWidth,
      videoHeight: videoHeight,
      backgroundColor: backgroundColor,
      usePadding: usePadding,
      // These might be redundant if image-specific settings are used primarily
      // stretchImageToFit: stretchImageToFit, 
      // paddingColor: paddingColor,
      // useBlurBackground: useBlurBackground,
      alwaysUniqueFilenames: alwaysUniqueFilenames
    });
  };
  

  const handleFilesMetadata = (receivedFilesMetadata) => {
    console.log('project.js: handleFilesMetadata() = ', receivedFilesMetadata)
    
    if (!Array.isArray(receivedFilesMetadata)) {
      console.error('receivedFilesMetadata is not an array:', receivedFilesMetadata);
      return;
    }

    const newAudioFiles = [];
    const newImageFiles = [];

    receivedFilesMetadata.forEach((file, index) => {
      if (index === 0 && file.filepath && !outputFolder && pathSeparator) {
        const fileFolder = file.filepath.substring(0, file.filepath.lastIndexOf(pathSeparator));
        setOutputFolder(fileFolder);
        localStorage.setItem('outputFolder', fileFolder);
      }
      
      const commonFileProps = {
        id: generateUniqueId(),
        filename: file.filename,
        filepath: file.filepath,
      };

      if (file.filetype === 'audio') {
        // For audio files, parse the duration if it exists
        let duration = 'Loading...';
        if (file.duration && !isNaN(parseFloat(file.duration))) {
          duration = parseFloat(file.duration).toString();
        }
        
        newAudioFiles.push({
          ...commonFileProps,
          duration,
          startTime: '', 
          length: '', 
          endTime: '',
        });

        // If duration is still loading, request it from the main process
        if (duration === 'Loading...') {
          window.api.send('get-audio-duration', { filepath: file.filepath, id: commonFileProps.id });
        }
      } else if (file.filetype === 'image') {
        newImageFiles.push({
          ...commonFileProps,
          dimensions: file.dimensions || 'Unknown',
          stretchImageToFit: false,
          paddingColor: null,
          useBlurBackground: true,
        });
      }
    });

    setAudioFiles(prev => {
      const combined = [...prev];
      newAudioFiles.forEach(newFile => {
        if (!combined.some(f => f.filepath === newFile.filepath)) {
          combined.push(newFile);
        }
      });
      return combined;
    });

    setImageFiles(prev => {
      const combined = [...prev];
      newImageFiles.forEach(newFile => {
        if (!combined.some(f => f.filepath === newFile.filepath)) {
          combined.push(newFile);
        }
      });
      return combined;
    });
  };

  useEffect(() => {
    const handleAudioDuration = (event, { id, duration }) => {
      setAudioFiles(prev => prev.map(file => {
        if (file.id === id) {
          return { ...file, duration: duration.toString() };
        }
        return file;
      }));
    };

    window.api.receive('audio-duration-response', handleAudioDuration);

    return () => {
      window.api.removeAllListeners('audio-duration-response');
    };
  }, []);

  // Input validation helper functions
  const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_-\s.]/g, '').substring(0, 255); // Allow periods for extensions if user types them
  };

  const sanitizeNumericInput = (value, min, max) => {
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    if (cleanValue === '') return ''; // Allow empty input temporarily
    const numValue = parseInt(cleanValue, 10);

    if (isNaN(numValue)) return String(min); // Default to min if parse fails
     // Don't clamp immediately, allow user to type. Validation can happen on blur or submit.
    // if (min !== undefined && numValue < min) return String(min);
    // if (max !== undefined && numValue > max) return String(max);
    return String(numValue);
  };

  const validateNumericInputOnBlur = (value, min, max, setter) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue) || (min !== undefined && numValue < min)) {
        numValue = min;
    } else if (max !== undefined && numValue > max) {
        numValue = max;
    }
    setter(String(numValue));
    localStorage.setItem(setter.name === 'setVideoWidth' ? 'videoWidth' : 'videoHeight', String(numValue));
  };


  const validateHexColor = (color) => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/i; // Case insensitive
    return hexPattern.test(color) ? color : '#000000'; // Default to black if invalid
  };

  const handleOutputFilenameChange = (e) => {
    const sanitizedFilename = sanitizeFilename(e.target.value);
    setOutputFilename(sanitizedFilename);
    // localStorage saving is handled by useEffect
  };

  const handleVideoWidthChange = (e) => {
    const sanitizedWidth = sanitizeNumericInput(e.target.value, 1, 7680);
    setVideoWidth(sanitizedWidth);
  };
  
  const handleVideoHeightChange = (e) => {
    const sanitizedHeight = sanitizeNumericInput(e.target.value, 1, 4320);
    setVideoHeight(sanitizedHeight);
  };

  const handleBackgroundColorChange = (e) => {
    // No immediate sanitization, color input type handles format mostly
    setBackgroundColor(e.target.value);
  };
  
  const handleBackgroundColorBlur = (e) => {
    const validatedColor = validateHexColor(e.target.value);
    setBackgroundColor(validatedColor);
    localStorage.setItem('backgroundColor', validatedColor);
  };


  const handleToggleErrorLog = () => {
    setShowFullErrorLog((prev) => !prev);
  };

  const handleCloseError = () => {
    setFfmpegError(null);
    setShowFullErrorLog(false);
  };

  const resetToDefault = () => {
    // Keep renders, pathSeparator, and globalFilter as they are user/system specific
    // Reset project-specific settings
    setAudioFiles([]);
    setImageFiles([]);
    setAudioRowSelection({});
    setImageRowSelection({});
    
    setOutputFolder(localStorage.getItem('outputFolder') || ''); // Keep last used output folder or default
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setUsePadding(false);
    setAlwaysUniqueFilenames(false);
    setPaddingColor('#FFFFFF'); // Default padding color if used
    setStretchImageToFit(false);
    setUseBlurBackground(true); // Default for new images often desired
    
    setFfmpegError(null);
    setSelectedImageIndex(0);
    setResolutionOptions([]);
    setSelectedResolution('');

    // Update localStorage for reset items
    localStorage.setItem('outputFilename', 'output-video');
    localStorage.setItem('outputFormat', 'mp4');
    localStorage.setItem('videoWidth', '1920');
    localStorage.setItem('videoHeight', '1080');
    localStorage.setItem('backgroundColor', '#000000');
    localStorage.setItem('usePadding', 'false');
    localStorage.setItem('alwaysUniqueFilenames', 'false');
    localStorage.setItem('paddingColor', '#FFFFFF');
    localStorage.setItem('stretchImageToFit', 'false');
    localStorage.setItem('useBlurBackground', 'true');
    localStorage.removeItem('audioFiles');
    localStorage.removeItem('imageFiles');
    localStorage.removeItem('audioRowSelection');
    localStorage.removeItem('imageRowSelection');
  };

  const selectedImagesForTimeline = useMemo(() => 
    imageFiles.filter((file) => imageRowSelection[file.id]),
    [imageFiles, imageRowSelection]
  );


  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent} title="Clear current project files and selections">
          Clear Project
        </button>
        <button className={styles.deleteLocalStorageButton} onClick={deleteLocalStorage} title="Clear all application data from local storage">
          Reset Application
        </button>
      </div>

      <FileUploader onFilesMetadata={handleFilesMetadata} />

      <h2>Audio Files</h2>
      <Table
        ref={audioTableRef}
        data={audioFiles}
        rowSelection={audioRowSelection}
        setRowSelection={setAudioRowSelection}
        setData={setAudioFiles} // For table-level operations like DND, remove
        columns={audioColumns}
        setAudioFiles={setAudioFiles} // For row-level operations in Row component
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isImageTable={false}
        isRenderTable={false}
      />

      <h2>Image Files</h2>
      <Table
        ref={imageTableRef}
        data={imageFiles}
        rowSelection={imageRowSelection}
        setRowSelection={setImageRowSelection}
        setData={setImageFiles} // For table-level operations
        columns={imageColumns}
        isImageTable={true}
        setImageFiles={setImageFiles} // For row-level operations in Row component
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isRenderTable={false}
      />

      <div className={styles.renderOptionsSection}>
        <h2 className={styles.renderOptionsTitle}>Render Options</h2>
        <button
          className={styles.resetButton}
          onClick={resetToDefault}
          title="Reset render options and file lists to default values"
        >
          Reset Options & Files
        </button>
        <div className={styles.renderOptionsGrid}>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFolder" className={styles.renderOptionLabel}>
              Output Folder
            </label>
            <div className={styles.folderInputWrapper}> {/* Changed from editableDropdownFolder */}
              <input
                type="text"
                id="outputFolder"
                value={outputFolder}
                onChange={handleOutputFolderChange}
                placeholder="Choose output folder"
                className={styles.folderInput} // Use folderInput style
                readOnly // Make it read-only, changed by button
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
                placeholder="Enter filename"
                className={styles.renderOptionInput}
                maxLength={255}
              />
              <select
                id="outputFilenameOptions"
                value={""} // Control with input, select just offers suggestions
                onChange={(e) => {
                    if(e.target.value) setOutputFilename(e.target.value);
                }}
                className={styles.renderOptionSelect}
              >
                <option value="" disabled>Suggest from names...</option>
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
              {/* Add more formats as needed */}
            </select>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="resolution" className={styles.renderOptionLabel}>
              Base Resolution on Image
            </label>
            <div className={styles.resolutionBox}> {/* Custom class for layout if needed */}
              <select
                id="imageSelection"
                value={selectedImageIndex}
                onChange={handleImageSelectionChange}
                className={styles.renderOptionSelect}
                title="Select an image to base resolution options on"
              >
                <option value="" disabled>Select image for resolution...</option>
                {imageFiles.map((image, index) => (
                  <option key={image.id || index} value={index}> {/* Use image.id if available and unique */}
                    {image.filename}
                  </option>
                ))}
              </select>
              <select
                id="resolutionSelection"
                value={selectedResolution}
                onChange={handleResolutionChange}
                className={styles.renderOptionSelect}
                disabled={!imageFiles[selectedImageIndex]} // Disable if no image is selected or available
                title="Select a resolution based on the chosen image"
              >
                <option value="" disabled>Select resolution...</option>
                {(resolutionOptions[selectedImageIndex] || []).map((resolution, index) => (
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
              type="text" // Keep as text to allow intermediate non-numeric states
              id="videoWidth"
              value={videoWidth}
              onChange={handleVideoWidthChange}
              onBlur={(e) => validateNumericInputOnBlur(e.target.value, 1, 7680, setVideoWidth)}
              className={styles.renderOptionInput}
              placeholder="e.g., 1920"
              maxLength={4}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="videoHeight" className={styles.renderOptionLabel}>
              Height (px)
            </label>
            <input
              type="text" // Keep as text
              id="videoHeight"
              value={videoHeight}
              onChange={handleVideoHeightChange}
              onBlur={(e) => validateNumericInputOnBlur(e.target.value, 1, 4320, setVideoHeight)}
              className={styles.renderOptionInput}
              placeholder="e.g., 1080"
              maxLength={4}
            />
          </div>
          
          <div className={styles.renderOptionGroup}>
            <label htmlFor="backgroundColor" className={styles.renderOptionLabel}>Background Color</label>
            <input
                type="color"
                id="backgroundColor"
                value={backgroundColor}
                onChange={handleBackgroundColorChange}
                onBlur={handleBackgroundColorBlur} // Validate on blur
                className={styles.renderOptionColor}
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


          {/* Image Timeline for selected images from the Image Table */}
          <div className={styles.renderOptionGroup} style={{ gridColumn: "1 / -1" }}> {/* Span full width */}
            <div id="imageTimelineBox" className={styles.imageTimelineBox}>
              <h3 className={styles.blackText} style={{ marginLeft: '0.5rem' }}>Image Sequence for Render</h3>
              <DndContext id="imageTimelineDndContext" collisionDetection={closestCenter} onDragEnd={handleImageReorder}>
                <SortableContext items={selectedImagesForTimeline.map((file) => file.id)} strategy={horizontalListSortingStrategy}>
                  <div id="imageTimelineContent" className={styles.imageTimeline}> {/* Content container for scrolling */}
                    {selectedImagesForTimeline.length === 0 ? (
                      <p style={{ marginLeft: '0.5rem', color: 'black' }}>No images selected in the table above, or selection is empty.</p>
                    ) : (
                      selectedImagesForTimeline.map((file) => (
                        <SortableImage key={file.id} file={file} />
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
          disabled={
            (audioTableRef.current?.getOrderedSelectedRows() || []).length === 0 || 
            (imageTableRef.current?.getOrderedSelectedRows() || []).length === 0 ||
            !outputFolder || !pathSeparator // Also disable if output folder or path separator isn't set
          }
          title={
            !outputFolder ? "Please select an output folder first" : 
            !pathSeparator ? "Path separator not loaded, please wait or restart" :
            "Render the video with selected files and options"
          }
        >
          Render
        </button>
      </div>

      {ffmpegError && (
        <div className={styles.errorContainer}>
          <button className={styles.closeButton} onClick={handleCloseError}>×</button>
          <h3>FFmpeg Error:</h3>
          <pre className={styles.errorPre}>
            {showFullErrorLog ? ffmpegError.fullErrorLog : ffmpegError.lastOutput}
          </pre>
          <button onClick={handleToggleErrorLog} className={styles.toggleErrorButton}>
            {showFullErrorLog ? 'Show summary' : 'Show full log'}
          </button>
        </div>
      )}

      <div className={styles.rendersSection}>
        <h2>Renders List</h2>
        <Table
          ref={rendersTableRef} // Add ref if needed for operations like getOrderedSelectedRows
          data={renders.map(render => {
            const parts = render.outputFilepath ? render.outputFilepath.split(pathSeparator) : [render.outputFilename];
            const filename = parts[parts.length - 1];
            return {
              ...render, // Pass full render object for all details
              outputFilenameDisplay: filename, // Specific for display
            };
          })}
          columns={renderColumns.map(col => { // Remap to use outputFilenameDisplay if that's the intent
              if (col.accessorKey === 'outputFilename') {
                  return { ...col, accessorKey: 'outputFilenameDisplay' };
              }
              return col;
          })}
          rowSelection={{}} 
          setRowSelection={() => {}} 
          setData={setRenders} 
          isRenderTable={true}
          removeRender={removeRender} // Pass removeRender for the "Remove" button in the Renders table
          // ffmpegCommand prop was used in Row for expanded content, ensure it uses the correct data
          // The ffmpegCommand to display should be per-row, so pass it down if needed or access from row.original
        />
      </div>
    </div>
  );
}

export default Project;