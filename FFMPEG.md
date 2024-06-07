## Extract / use image / thumbnail from audio file metadata (mp3,flac)
# Working 1 song 1 image 
ffmpeg 
-loop 1 
-framerate 2 -i "C:\Users\marti\Videos\ig_sf_6.5.24_highlights\apple image.jpg"  
-i "C:\Users\marti\Videos\ig_sf_6.5.24_highlights\FITNESSS - F20 ⧸ FAITH.mp3"  
-c:a pcm_s32le  
-filter_complex concat=n=1:v=0:a=1  
-vcodec libx264  
-filter:v "scale=w=1920:h=1882,pad=ceil(iw/2)*2:ceil(ih/2)*2" 
-crf 18 -pix_fmt yuv420p  
-shortest  
-tune stillimage  
-t 254 "C:\Users\marti\Videos\ig_sf_6.5.24_highlights\oneSongOneImg.mkv"


### NEW: SLIDESHOW ADD IMAGE PADDING
Files: E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo

# Working command to add red padding (f50000) to a single rectangle image (2158 x 1482) so that output video has resolution 1920 x 1080

ffmpeg 
-loop 1 
-framerate 2 
-i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\5_postcard2.jpg 
-i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\1. filename.flac 
-i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\2. filename.flac 
-i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\3. filename.flac 
-c:a pcm_s32le 
-filter_complex concat=n=3:v=0:a=1 
-vcodec libx264 
-filter:v format=rgb24,scale=w='if(gt(a,1.7777777777777777),1920,trunc(1080*a/2)*2)':h='if(lt(a,1.7777777777777777),1080,trunc(1920/a/2)*2)',pad=w=1920:h=1080:x='if(gt(a,1.7777777777777777),0,(1920-iw)/2)':y='if(lt(a,1.7777777777777777),0,(1080-ih)/2)':color=#f50000
-crf 18 
-pix_fmt yuv420p 
-shortest 
-tune stillimage 
-t 548 
E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\concatVideo-478765.mkv

# Working command to combine 3 images (1=square, 2=rectangle, 3=square) into slideshow video. [middle img stretched]

ffmpeg -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\1. filename.flac -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\2. filename.flac -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\3. filename.flac -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\1_front.jpg -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\4_postcard1.jpg -r 2 -i E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\2_back.jpg -filter_complex [0:a][1:a][2:a]concat=n=3:v=0:a=1[a];[3:v]scale=w=1000:h=1000,setsar=1,loop=365.84:365.84[v3];[4:v]scale=w=1000:h=1000,setsar=1,loop=365.84:365.84[v4];[5:v]scale=w=1000:h=1000,setsar=1,loop=365.84:365.84[v5];[v3][v4][v5]concat=n=3:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v] -map [v] -map [a] -c:a pcm_s32le -c:v libx264 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 548.76 E:\martinradio\rips\vinyl\parisplane\los pampas en montecarlo\los pampas en montecarlo_789.mkv 


##############################################################################################################################
### NEW: REEPEAT LOOPING COMMAND

cd C:\Users\martin\Documents\projects\rendertune\node_modules\ffmpeg-ffprobe-static

# Working win10 command: 

ffmpeg.exe -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\frankie knuckles mix.mp3" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\FRONT.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\BACK.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\side 1.jpg" -r 2 -i "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\side 2.jpg" -filter_complex " [0:a]concat=n=1:v=0:a=1[a]; [1:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v1]; [2:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v2]; [3:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v3]; [4:v]scale=w=2000:h=2000,setsar=1,loop=3615.91:3615.91[v4]; [v1][v2][v3][v4]concat=n=4:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v] " -map [v] -map [a] -c:a pcm_s32le -c:v libx264 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 7200 "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\Equal_Slideshow_Time.mkv"

## Write command to render looping .mkv video

..\node_modules\ffmpeg-ffprobe-static\ffmpeg.exe -loop 1 -i "img\image1.jpg" -loop 1 -i img\image2.jpg -loop 1 -i img\image3.jpg -filter_complex "[0:v]trim=duration=3,fade=t=out:st=2:d=1[v1];[1:v]trim=duration=3,fade=t=out:st=2:d=1[v2];[2:v]trim=duration=3,fade=t=out:st=2:d=1[v3];[v1][v2][v3]concat=n=3:v=1:a=0[v]" -map "[v]" -r 30 -c:v libx264 -pix_fmt yuv420p output\looping_output.mp4

## Write command to render for 240 seconds
## Write command to combine looping mkv with audio

## Take input from file (input.txt).
## And complex_filter from text file (filter.txt).

C:\Users\martin\Documents\projects\rendertune\node_modules\ffmpeg-ffprobe-static\ffmpeg.exe -f concat -safe 0 -i input.txt -filter_complex_script filter.txt -map "[v]" -map "[a]" -c:a pcm_s32le -c:v libx264 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 7200 "C:\Users\martin\Documents\projects\rendertune\test-files\mp3\Equal_Slideshow_Time.mkv"

