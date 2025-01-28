## issue 1: if img res is smaller then output resolution, command errors

# Happens when trying to stretch an img to fit when its dimmensions already match

# Case 1: 
img:5938x5846 pixels
audio:208.1 seconds
output:5938x5846 pixels [no scaling]
padding:False
blurBkg:False
stretch:False

cmd: works
ffmpeg -y -i C:/Users/marti/Documents/martinradio/uploads/cocktail-harmony-ps1-soundtrack-ost/16.mp3 -r 2 -i C:/Users/marti/Documents/martinradio/uploads/cocktail-harmony-ps1-soundtrack-ost/Cocktail Harmony (Manual)(JP)(PlayStation)(PSX)-1.png -filter_complex [0:a]concat=n=1:v=0:a=1[a];[1:v]scale=w=5938:h=-1:force_original_aspect_ratio=decrease,pad=5938:5846:(ow-iw)/2:(oh-ih)/2:color=#000000,setsar=1,loop=416:416[v0];[v0]concat=n=1:v=1:a=0,pad=ceil(iw/2)*2:ceil(ih/2)*2[v] -map [v] -map [a] -c:a aac -b:a 320k -c:v h264 -movflags +faststart -profile:v high -level:v 4.2 -bufsize 3M -crf 18 -pix_fmt yuv420p -tune stillimage -t 208.11755102040817 C:\Users\marti\Documents\martinradio\uploads\cocktail-harmony-ps1-soundtrack-ost\output-video_20250124T164740026Z.mp4


