# ffmpeg command:
```
ffmpeg -loop 1 -framerate 2 -i "E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\1_front.png" -i "E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\A1 Medley From Jesus Christ Super Star.flac" -c:a pcm_s32le -filter_complex concat=n=1:v=0:a=1 -vcodec libx264 -filter:v scale=w=7380:h=7383,pad=ceil(iw/2)*2:ceil(ih/2)*2 -crf 18 -pix_fmt yuv420p -shortest -tune stillimage -t 1162 "E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\concatVideo-819182zzzz.mkv"
```

# Command output:
```
ffmpeg version 4.4.1-essentials_build-www.gyan.dev Copyright (c) 2000-2021 the FFmpeg developers
  built with gcc 11.2.0 (Rev1, Built by MSYS2 project)
  configuration: --enable-gpl --enable-version3 --enable-static --disable-w32threads --disable-autodetect --enable-fontconfig --enable-iconv --enable-gnutls --enable-libxml2 --enable-gmp --enable-lzma --enable-zlib --enable-libsrt --enable-libssh --enable-libzmq --enable-avisynth --enable-sdl2 --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxvid --enable-libaom --enable-libopenjpeg --enable-libvpx --enable-libass --enable-libfreetype --enable-libfribidi --enable-libvidstab --enable-libvmaf --enable-libzimg --enable-amf --enable-cuda-llvm --enable-cuvid --enable-ffnvcodec --enable-nvdec --enable-nvenc --enable-d3d11va --enable-dxva2 --enable-libmfx --enable-libgme --enable-libopenmpt --enable-libopencore-amrwb --enable-libmp3lame --enable-libtheora --enable-libvo-amrwbenc --enable-libgsm --enable-libopencore-amrnb --enable-libopus --enable-libspeex --enable-libvorbis --enable-librubberband
  libavutil      56. 70.100 / 56. 70.100
  libavcodec     58.134.100 / 58.134.100
  libavformat    58. 76.100 / 58. 76.100
  libavdevice    58. 13.100 / 58. 13.100
  libavfilter     7.110.100 /  7.110.100
  libswscale      5.  9.100 /  5.  9.100
  libswresample   3.  9.100 /  3.  9.100
  libpostproc    55.  9.100 / 55.  9.100
[png_pipe @ 0000024d5b1fcec0] Stream #0: not enough frames to estimate rate; consider increasing probesize
Input #0, png_pipe, from 'E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\1_front.png':
  Duration: N/A, bitrate: N/A
  Stream #0:0: Video: png, rgba(pc), 7380x7383, 2 fps, 2 tbr, 2 tbn, 2 tbc
Input #1, flac, from 'E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\A1 Medley From Jesus Christ Super Star.flac':
  Metadata:
    DISCOGS_RELEASE_ID: 7567378
    CATALOGNUMBER   : 101769-70
    MEDIATYPE       : Vinyl (LP, Album)
    COUNTRY         : US
    WWW             : https://www.discogs.com/release/7567378-Bob-Allen-More-Bob-Allen-At-The-Christopher-Inn
    Title           : Medley From Jesus Christ Super Star
    ARTIST          : Bob Allen
    ALBUM           : More Bob Allen At The Christopher Inn
    GENRE           : Jazz
    ORGANIZATION    : Not On Label
    track           : A1
  Duration: 00:19:22.48, start: 0.000000, bitrate: 1510 kb/s
  Stream #1:0: Audio: flac, 48000 Hz, stereo, s32 (24 bit)
  Stream #1:1: Video: mjpeg (Baseline), yuvj444p(pc, bt470bg/unknown/unknown), 600x600, 90k tbr, 90k tbn, 90k tbc (attached pic)
    Metadata:
      comment         : Cover (front)
Stream mapping:
  Stream #1:0 (flac) -> concat (graph 0)
  concat (graph 0) -> Stream #0:0 (pcm_s32le)
  Stream #0:0 -> #0:1 (png (native) -> h264 (libx264))
Press [q] to stop, [?] for help
[libx264 @ 0000024d5b2400c0] frame MB size (462x462) > level limit (139264)
[libx264 @ 0000024d5b2400c0] DPB size (4 frames, 853776 mbs) > level limit (3 frames, 696320 mbs)
[libx264 @ 0000024d5b2400c0] using cpu capabilities: MMX2 SSE2Fast SSSE3 SSE4.2 AVX FMA3 BMI2 AVX2
[libx264 @ 0000024d5b2400c0] profile High, level 6.2, 4:2:0, 8-bit
[libx264 @ 0000024d5b2400c0] 264 - core 164 r3075 66a5bc1 - H.264/MPEG-4 AVC codec - Copyleft 2003-2021 - http://www.videolan.org/x264.html - options: cabac=1 ref=3 deblock=1:-3:-3 analyse=0x3:0x113 me=hex subme=7 psy=1 psy_rd=2.00:0.70 mixed_ref=1 me_range=16 chroma_me=1 trellis=1 8x8dct=1 cqm=0 deadzone=21,11 fast_pskip=1 chroma_qp_offset=-4 threads=36 lookahead_threads=6 sliced_threads=0 nr=0 decimate=1 interlaced=0 bluray_compat=0 constrained_intra=0 bframes=3 b_pyramid=2 b_adapt=1 b_bias=0 direct=1 weightb=1 open_gop=0 weightp=2 keyint=250 keyint_min=2 scenecut=40 intra_refresh=0 rc_lookahead=40 rc=crf mbtree=1 crf=18.0 qcomp=0.60 qpmin=0 qpmax=69 qpstep=4 ip_ratio=1.40 aq=1:1.20
Output #0, matroska, to 'E:\martinradio\rips\vinyl\More Bob Allen At The Christopher Inn\concatVideo-819182zzzz.mkv':
  Metadata:
    encoder         : Lavf58.76.100
  Stream #0:0: Audio: pcm_s32le ([1][0][0][0] / 0x0001), 48000 Hz, stereo, s32 (24 bit), 3072 kb/s
    Metadata:
      encoder         : Lavc58.134.100 pcm_s32le
  Stream #0:1: Video: h264 (H264 / 0x34363248), yuv420p(tv, progressive), 7380x7384, q=2-31, 2 fps, 1k tbn
    Metadata:
      encoder         : Lavc58.134.100 libx264
    Side data:
      cpb: bitrate max/min/avg: 0/0/0 buffer size: 0 vbv_delay: N/A
frame=   19 fps=0.4 q=0.0 size=       1kB time=00:00:00.00 bitrate=N/A speed=   0x
```

# Code to parse progress status from output using regex:
```
rl.on('line', (line) => {
    try {
      //console.log('line=',line)
      
      let match = line.match(/frame=\s*[^\s]+\s+fps=\s*[^\s]+\s+q=\s*[^\s]+\s+(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      
      //console.log('match=',match)
      
      // Audio only looks like this: "line size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x    "
      if (!match){
        match = line.match(/(?:size|Lsize)=\s*[^\s]+\s+time=\s*([^\s]+)\s+/);
      }
      
      let startOfLine = line.substring(0,6)
      //console.log(`startOfLine=${startOfLine}`)

      var displayProgress=0
      //if line begins with 'video:' then video has finished
      if(startOfLine.includes('video:')){
        //console.log('line starts with video: so it is finished')
        displayProgress=100
        for (var z = 0; z < renderList.length; z++) {
          //update render status to be 'done'
          if (renderList[z].renderStatusId == renderStatusId) {
            renderList[z].status = 'done'
          }
          //update render modal display
          updateRendersModal()
        }

      }else{
        if (!match){
          //console.log('no match 2, return')
          return
        }
        const str = match[1];
        //console.log('str=',str)
        const progressTime = Math.max(0, moment.duration(str).asSeconds());
        const progress = cutDuration ? progressTime / cutDuration : 0;
        displayProgress = parseInt(progress * 100)
      }

      //console.log('displayProgress=',displayProgress)
      //update table display
      document.getElementById(renderStatusId).innerText = `${displayProgress}%`;
      //if render has completed
      if (displayProgress >= 100) {
        //get render from renderList
        for (var z = 0; z < renderList.length; z++) {
          //update render status to be 'done'
          if (renderList[z].renderStatusId == renderStatusId) {
            renderList[z].status = 'done'
          }
          //update render modal display
          updateRendersModal()
        }
      }

      //onProgress(progress);
    } catch (err) {
      console.log('Failed to parse ffmpeg progress line', err);
    }
  });
```