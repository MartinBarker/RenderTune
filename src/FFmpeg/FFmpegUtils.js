export function createBlurBackgroundCommand(inputFile, outputFile, bgWidth = 1920, bgHeight = 1080, blurStrength = 10) {
    return {
        cmdArgs: [
            '-i', inputFile,
            '-filter_complex',
            `[0:v]scale=${bgWidth}:${bgHeight},boxblur=${blurStrength}:${blurStrength}[bg];` +
            `[0:v]scale=-1:-1[fg];` +
            `[bg][fg]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2`,
            outputFile
        ]
    };
}

export function createFFmpegCommand(configs) {
    try {
        const {
            audioInputs = [], 
            imageInputs = [], 
            outputFilepath,  
            width = 2000,     
            height = 2000,    
            paddingCheckbox = false, 
            backgroundColor = 'black', 
            repeatLoop = true,         
            debugBypass = false        
        } = configs;

        console.log('FFmpeg Configurations:', configs);
        const cmdArgs = ['-y'];

        let outputDuration = 0;
        audioInputs.forEach(audio => {
            outputDuration += audio.duration;
        });

        const imgDuration = outputDuration / (imageInputs.length);
        console.log(`There are ${imageInputs.length} images, each will be displayed for ${imgDuration} seconds.`);

        audioInputs.forEach((audio) => {
            const startTime = audio.startTime || '00:00';
            const endTime = audio.endTime || audio.duration;
            const startTimeInSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const endTimeInSeconds = typeof endTime === 'string' ? endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0) : endTime;
            cmdArgs.push('-i', `${audio.filepath.replace(/\\/g, '/')}`);
            if (startTimeInSeconds !== 0 || endTimeInSeconds !== audio.duration) {
                cmdArgs.push('-ss', startTimeInSeconds.toString());
                cmdArgs.push('-to', endTimeInSeconds.toString());
            }
        });

        imageInputs.forEach((image) => {
            cmdArgs.push('-r', '2'); // Set frame rate to 2fps
            cmdArgs.push('-i', `${image.filepath.replace(/\\/g, '/')}`);
        });

        let filterComplexStr = '';

        filterComplexStr += audioInputs.map((_, index) => `[${index}:a]`).join('');
        filterComplexStr += `concat=n=${audioInputs.length}:v=0:a=1[a];`;

        imageInputs.forEach((image, index) => {
            const imgIndex = audioInputs.length + index;
            const imageAspectRatio = image.width / image.height;
            const outputAspectRatio = width / height;

            let scaleFilter;
            let padFilter = '';
            if (image.stretchImageToFit || imageAspectRatio === outputAspectRatio) {
                scaleFilter = `scale=w=${width}:h=${height}`;
            } else {
                scaleFilter = `scale=w=${width}:h=-1:force_original_aspect_ratio=decrease`;
                padFilter = `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${image.paddingColor || backgroundColor}`;
            }

            filterComplexStr += `[${imgIndex}:v]${scaleFilter}${padFilter},setsar=1,loop=${Math.round(imgDuration * 2)}:${Math.round(imgDuration * 2)}[v${index}];`;
        });

        const imageRefs = imageInputs.map((_, index) => `[v${index}]`).join('');
        filterComplexStr += `${imageRefs}concat=n=${imageInputs.length}:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]`;

        console.log('Generated filter complex:', filterComplexStr);

        cmdArgs.push('-filter_complex', filterComplexStr);
        cmdArgs.push('-map', '[v]');
        cmdArgs.push('-map', '[a]');

        const isMP4 = outputFilepath.toLowerCase().endsWith('.mp4');
        if (isMP4) {
            cmdArgs.push(
                '-c:a', 'aac',
                '-b:a', '320k',
                '-c:v', 'h264',
                '-movflags', '+faststart',
                '-profile:v', 'high',
                '-level:v', '4.2'
            );
        } else {
            cmdArgs.push(
                '-c:a', 'pcm_s32le',
                '-c:v', 'libx264'
            );
        }

        cmdArgs.push('-bufsize', '3M');
        cmdArgs.push('-crf', '18');
        cmdArgs.push('-pix_fmt', 'yuv420p');
        cmdArgs.push('-tune', 'stillimage');
        cmdArgs.push('-t', `${outputDuration}`);
        cmdArgs.push(`${outputFilepath}`);

        const commandString = cmdArgs.join(' ');
        console.log('\n\n Returning cmdArgs = ', cmdArgs, '\n\n');

        return { cmdArgs, outputDuration, commandString };
    } catch (error) {
        console.error('Error creating FFmpeg command:', error);
        return { error: error.message };
    }
}

