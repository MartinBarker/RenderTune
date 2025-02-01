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
            
            if (startTimeInSeconds !== 0 || endTimeInSeconds !== audio.duration) {
                cmdArgs.push('-ss', startTimeInSeconds.toString());
                cmdArgs.push('-to', endTimeInSeconds.toString());
            }
            cmdArgs.push('-i', `${audio.filepath.replace(/\\/g, '/')}`);
        });

        imageInputs.forEach((image) => {
            cmdArgs.push('-r', '2'); // Set frame rate to 2fps
            cmdArgs.push('-i', `${image.filepath.replace(/\\/g, '/')}`);
        });

        let filterComplexStr = '';

        filterComplexStr += audioInputs.map((_, index) => `[${index}:a]`).join('');
        filterComplexStr += `concat=n=${audioInputs.length}:v=0:a=1[a];`;

        console.log('image inputs = ', imageInputs);

        imageInputs.forEach((image, index) => {
            console.log('\n---\nimage width = ', image.width);
            console.log('image height = ', image.height);
            console.log('output width = ', width);
            console.log('output height = ', height);
            const imgIndex = audioInputs.length + index;

            if (image.useBlurBackground) {
                
                // create blurred background and foreground from same image
                const blurBackground = [
                    `[${imgIndex}:v]scale=w=${width}:h=${height}:force_original_aspect_ratio=increase,boxblur=20:20,crop=${width}:${height}:(iw-${width})/2:(ih-${height})/2,setsar=1[bg${index}];`,
                    `[${imgIndex}:v]scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease,setsar=1,loop=${Math.round(imgDuration * 2)}:${Math.round(imgDuration * 2)}[fg${index}];`,
                    `[bg${index}][fg${index}]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=${Math.round(imgDuration * 2)}:${Math.round(imgDuration * 2)}[v${index}];`
                ].join('');
                filterComplexStr += blurBackground;
            
            } else {
                
                // stretch image to fit or use solid color background
                let scaleFilter;
                if (image.stretchImageToFit) {
                    
                    // stretch image to fit frame
                    scaleFilter = `scale=w=${width}:h=${height}`;
                } else {

                    // do not stretch image, keep aspect ratio and fit within frame
                    scaleFilter = `scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease`;
                }

                // Add solid color background padding
                const padFilter = image.stretchImageToFit ? '' : `,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=${image.paddingColor || backgroundColor}`;
                
                filterComplexStr += `[${imgIndex}:v]${scaleFilter}${padFilter},setsar=1,loop=${Math.round(imgDuration * 2)}:${Math.round(imgDuration * 2)}[v${index}];`;
            }
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