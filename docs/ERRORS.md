###### This command works but some image are cropped

# ------- cmd start -------
ffmpeg -y 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/02 Inner Peace.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/01 Quiet the Senses.flac"
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/1_front.png" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/4_cdBook1.jpg" 
-filter_complex "
    [0:a][1:a]concat=n=2:v=0:a=1[a];
    [2:v]scale=w=5639:h=2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg0];
    [2:v]scale=w=5639:h=-1:force_original_aspect_ratio=decrease,setsar=1,loop=1206:1206[fg0];
    [bg0][fg0]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=1206:1206[v0];
    [3:v]scale=w=5639:h=2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg1];
    [3:v]scale=w=5639:h=-1:force_original_aspect_ratio=decrease,setsar=1,loop=1206:1206[fg1];
    [bg1][fg1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=1206:1206[v1];
    [v0][v1]concat=n=2:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]
    " 
-map [v] -map [a] -c:a aac -b:a 320k -c:v h264 -movflags +faststart -profile:v high -level:v 4.2 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 1206.1733333333332 "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease\1st_pass_cropped.mp4"
# ------- cmd end -------

where i want the output to be a rectangle 5639x2790, and a slideshow of two images, where the first image is a square with resolution 2819x2815, I want the first image to appear fully on screen, centered both vertically and horizontally, right now the first image is appearing zoomed in and cut off / cropped, fix this

give me the fixed ffmpeg command in one single line

###### Fixed: image has no crop/stretch, is centered with a black background. ######

# ------- cmd start -------
ffmpeg -y 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/02 Inner Peace.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/01 Quiet the Senses.flac" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/1_front.png" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/4_cdBook1.jpg" 
-filter_complex "
    [0:a][1:a]concat=n=2:v=0:a=1[a];
    [2:v]scale=5639:2790:force_original_aspect_ratio=decrease,setsar=1,pad=5639:2790:(ow-iw)/2:(oh-ih)/2[fg0];
    [2:v]scale=5639:2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg0];
    [bg0][fg0]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=1206:1206[v0];
    [3:v]scale=5639:2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg1];
    [3:v]scale=5639:-1:force_original_aspect_ratio=decrease,setsar=1,loop=1206:1206[fg1];
    [bg1][fg1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=1206:1206[v1];
    [v0][v1]concat=n=2:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]
    " 
-map "[v]" 
-map "[a]" 
-c:a aac 
-b:a 320k 
-c:v h264 
-movflags +faststart 
-profile:v high 
-level:v 4.2 
-bufsize 3M 
-crf 18 
-pix_fmt yuv420p 
-tune stillimage 
-t 1206.1733333333332 
"E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/2nd_pass_no_crop.mp4"

# Explanation:
To fix the issue where the first image is appearing zoomed in and cropped, you need to adjust the scaling and cropping logic for the first image (2:v) to ensure it fits within the desired output resolution (5639x2790) without being cut off. First Image Scaling and Padding: The first image (2:v) is scaled to fit within the output resolution (5639x2790) using scale=5639:2790:force_original_aspect_ratio=decrease. This ensures the image is not zoomed in. The pad filter is used to center the image both vertically and horizontally within the output resolution. The padding is calculated as (ow-iw)/2 for horizontal padding and (oh-ih)/2 for vertical padding. Background Blur for First Image: The blurred background for the first image is created by scaling the image to cover the output resolution (scale=5639:2790:force_original_aspect_ratio=increase) and then cropping it to the exact output resolution. Overlay and Looping: The centered image (fg0) is overlaid on top of the blurred background (bg0) using the overlay filter. The loop filter ensures the video loops for the specified duration. Second Image Processing: The second image (3:v) is processed similarly to the first image, but without the padding step since it is already being scaled to fit the output resolution.

###### Apply Fix To This Command

# ------- cmd start -------
ffmpeg -y 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/06 True Bliss.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/07 Natural Renewal.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/04 Balance.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/05 Gentle Ray of Sunshine.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/02 Inner Peace.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/03 Day Dreaming.flac" 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/01 Quiet the Senses.flac" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/1_front.png" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/4_cdBook1.jpg" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/5_cdBook2.jpg" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/6_cdBook3.jpg" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/7_cdBook4.jpg" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/3_cd.png" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/8_inletBack.png" 
-r 2 
-i "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/2_back.png" 
-filter_complex "
    [0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[a];
    [7:v]scale=5639:2790:force_original_aspect_ratio=decrease,setsar=1,pad=5639:2790:(ow-iw)/2:(oh-ih)/2[fg0];
    [7:v]scale=5639:2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg0];
    [bg0][fg0]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=871:871[v0];
    [8:v]scale=5639:2790:force_original_aspect_ratio=increase,boxblur=20:20,crop=5639:2790:(iw-5639)/2:(ih-2790)/2,setsar=1[bg1];
    [8:v]scale=5639:-1:force_original_aspect_ratio=decrease,setsar=1,loop=871:871[fg1];
    [bg1][fg1]overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:shortest=1,loop=871:871[v1];
    [v0][v1]concat=n=2:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v]
    " 
-map [v] -map [a] -c:a aac -b:a 320k -c:v h264 -movflags +faststart -profile:v high -level:v 4.2 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 3483.3599999999997 "E:/martinradio/rips/cd/pet music cds/Michael Maxwell & Dr. Lee R. Bartel/Dogease/broking.mp4"
# ------- cmd end -------
