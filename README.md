### RenderTune 2.0 Ffmpeg Command

cd C:\Users\martin\Documents\projects\rendertune\node_modules\ffmpeg-ffprobe-static

# Working win10 command: 

ffmpeg.exe -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\frankie knuckles mix.mp3" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\FRONT.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\BACK.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\side 1.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\side 2.jpg" -filter_complex " [0:a]concat=n=1:v=0:a=1[a]; [1:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v1]; [2:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v2]; [3:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v3]; [4:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v4]; [v1][v2][v3][v4]concat=n=4:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v] " -map [v] -map [a] -c:a pcm_s32le -c:v libx264 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 7200 "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\Equal_Slideshow_Time.mkv"

## Write command to render looping .mkv video

ffmpeg -loop 1 -i img\image1.jpg -loop 1 -i img\image2.jpg -loop 1 -i img\image3.jpg -filter_complex \
"[0:v]trim=duration=3,fade=t=out:st=2:d=1[v1]; \
 [1:v]trim=duration=3,fade=t=out:st=2:d=1[v2]; \
 [2:v]trim=duration=3,fade=t=out:st=2:d=1[v3]; \
 [v1][v2][v3]concat=n=3:v=1:a=0[v]" \
-map "[v]" -r 30 -c:v libx264 -pix_fmt yuv420p output\looping_output.mp4


## Write command to render for 240 seconds
## Write command to combine looping mkv with audio

## Take input from file (input.txt).
## And complex_filter from text file (filter.txt).

C:\Users\martin\Documents\projects\rendertune\node_modules\ffmpeg-ffprobe-static\ffmpeg.exe -f concat -safe 0 -i input.txt -filter_complex_script filter.txt -map "[v]" -map "[a]" -c:a pcm_s32le -c:v libx264 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 7200 "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\Equal_Slideshow_Time.mkv"

