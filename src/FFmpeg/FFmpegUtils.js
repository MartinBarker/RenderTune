export function createFFmpegCommand(configs) {
    try {
        const {
            audioInputs = [], // Array of audio input files with file paths and optional start/end times.
            imageInputs = [], // Array of image input files with file paths and optional padding color.
            outputFilepath,   // Output file path for the generated video.
            width = 2000,     // Target width for the output video or scaled images.
            height = 2000,    // Target height for the output video or scaled images.
            paddingCheckbox = false, // Option to enable/disable padding.
            backgroundColor = 'black', // Background color used for padding.
            stretchImageToFit = false, // Option to stretch images to fit dimensions.
            repeatLoop = true,         // Option to enable/disable looping images.
            debugBypass = false        // Option to enable debug mode.
        } = configs;

        console.log('FFmpeg Configurations:', configs);
        const cmdArgs = ['-y']; // Overwrite output files without confirmation.

        // Calculate total output duration based on audio input durations.
        let outputDuration = 0;
        audioInputs.forEach(audio => {
            outputDuration += audio.duration; // Add the duration of each audio file.
            if (audio.startTime) {
                console.log(`Start Time for ${audio.filename}: ${audio.startTime}`);
            }
            if (audio.endTime) {
                console.log(`End Time for ${audio.filename}: ${audio.endTime}`);
            }
        });

        // Calculate the duration for each image to be displayed.
        const imgDuration = outputDuration / imageInputs.length; // Split evenly across images.
        console.log(`There are ${imageInputs.length} images, each will be displayed for ${imgDuration} seconds.`);

        // Add audio input files to the FFmpeg command.
        audioInputs.forEach((audio) => {
            cmdArgs.push('-i', `${audio.filepath.replace(/\\/g, '/')}`); // Add each audio file.
        });

        // Add image input files to the FFmpeg command.
        imageInputs.forEach((image) => {
            cmdArgs.push('-i', `${image.filepath.replace(/\\/g, '/')}`); // Add each image file.
        });

        // Initialize the filter complex string for FFmpeg processing.
        let filterComplexStr = '';

        // Step 1: Reference each audio input for concatenation.
        filterComplexStr += audioInputs.map((_, index) => `[${index}:a]`).join('');

        // Step 2: Concatenate all audio inputs into a single stream.
        filterComplexStr += `concat=n=${audioInputs.length}:v=0:a=1[a];`;

        // Step 3/4: Scale and process each image input.
        imageInputs.forEach((image, index) => {
            const imgIndex = audioInputs.length + index; // Adjust index for images after audio inputs.
            // Scaling logic based on stretchImageToFit.
            let scaleFilter = stretchImageToFit 
                ? `scale=w=${width}:h=${height}` 
                : `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`;

            // Padding logic based on stretchImageToFit.
            let padFilter = stretchImageToFit 
                ? '' 
                : `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${image.paddingColor || backgroundColor}`;

            // Add scale, aspect ratio correction, and optional loop for the image.
            filterComplexStr += `[${imgIndex}:v]${scaleFilter}${padFilter},setsar=1,loop=${Math.round(imgDuration * 25)}:1[v${imgIndex}];`;
        });

        // Step 5: Concatenate all processed images into a single video stream.
        const imageRefs = imageInputs.map((_, index) => `[v${audioInputs.length + index}]`).join('');
        filterComplexStr += `${imageRefs}concat=n=${imageInputs.length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`;

        console.log('Generated filter complex:', filterComplexStr);

        // Add the filter complex string to the FFmpeg command.
        cmdArgs.push('-filter_complex', filterComplexStr);

        // Map the processed video and audio streams to the output.
        cmdArgs.push('-map', '[v]'); // Map the video stream.
        cmdArgs.push('-map', '[a]'); // Map the audio stream.

        // Select codecs and options based on output format (e.g., MP4).
        const isMP4 = outputFilepath.toLowerCase().endsWith('.mp4');
        if (isMP4) {
            cmdArgs.push(
                '-c:a', 'aac',       // Use AAC codec for audio.
                '-b:a', '320k',      // Set audio bitrate to 320kbps.
                '-c:v', 'h264',      // Use H.264 codec for video.
                '-movflags', '+faststart', // Optimize for web streaming.
                '-profile:v', 'high',      // Set H.264 profile to High.
                '-level:v', '4.2'          // Set H.264 level to 4.2.
            );
        } else {
            cmdArgs.push(
                '-c:a', 'pcm_s32le',  // Use PCM codec for audio.
                '-c:v', 'libx264'    // Use libx264 codec for video.
            );
        }

        // Additional FFmpeg parameters.
        cmdArgs.push('-bufsize', '3M');     // Set buffer size.
        cmdArgs.push('-crf', '18');         // Set constant rate factor for quality.
        cmdArgs.push('-pix_fmt', 'yuv420p'); // Set pixel format.
        cmdArgs.push('-tune', 'stillimage'); // Optimize for still images.
        cmdArgs.push('-t', `${outputDuration}`); // Set output duration.

        // Specify the output file path.
        cmdArgs.push(`${outputFilepath}`);

        // Generate and return the FFmpeg command string.
        const commandString = cmdArgs.join(' ');
        console.log('\n\n Returning cmdArgs = ', cmdArgs, '\n\n');

        return { cmdArgs, outputDuration, commandString };
    } catch (error) {
        console.error('Error creating FFmpeg command:', error);
        return { error: error.message };
    }
}