#!/bin/bash

# If you get error `c compiler failed` run `sudo apt install libglfw3-dev libglew-dev`
# apt-get install build-essential
# apt-get build-dep ffmpeg
# when running this on mac, you need to install some libraries such as 'brew install opus'

set -e

CWD=$(pwd)
PACKAGES="$CWD/packages"
WORKSPACE="$CWD/workspace"
ADDITIONAL_CONFIGURE_OPTIONS=""


mkdir -p "$PACKAGES"
mkdir -p "$WORKSPACE"

FFMPEG_TAG="$1"
FFMPEG_URL="http://git.ffmpeg.org/gitweb/ffmpeg.git/snapshot/74c4c539538e36d8df02de2484b045010d292f2c.tar.gz"

FFMPEG_ARCHIVE="$PACKAGES/ffmpeg.tar.gz"

if [ ! -f "$FFMPEG_ARCHIVE" ]; then
    echo "Downloading tag ${FFMPEG_TAG}..."
    curl -L -o "$FFMPEG_ARCHIVE" "$FFMPEG_URL"
fi

EXTRACTED_DIR="$PACKAGES/extracted"

mkdir -p "$EXTRACTED_DIR"

echo "Extracting..."
tar -xf "$FFMPEG_ARCHIVE" --strip-components=1 -C "$EXTRACTED_DIR"

cd "$EXTRACTED_DIR"

echo "Building..."

# Min electron supported version
MACOS_MIN="10.10"

./configure $ADDITIONAL_CONFIGURE_OPTIONS \
    --pkgconfigdir="$WORKSPACE/lib/pkgconfig" \
    --prefix=${WORKSPACE} \
    --pkg-config-flags="--static" \
    --extra-cflags="-I$WORKSPACE/include -mmacosx-version-min=${MACOS_MIN}" \
    --extra-ldflags="-L$WORKSPACE/lib -mmacosx-version-min=${MACOS_MIN}" \
    --extra-libs="-lpthread -lm" \
    --enable-static \
    --disable-securetransport \
    --disable-debug \
    --disable-shared \
    --disable-ffplay \
    --disable-lzma \
    --disable-doc \
    --enable-version3 \
    --enable-pthreads \
    --enable-runtime-cpudetect \
    --enable-avfilter \
    --enable-filters \
    --disable-libxcb \
    --enable-gpl \
    --disable-libass \
    --enable-libmp3lame \
    --enable-libx264 \
    --enable-libopus

make -j 4
make install

otool -L "$WORKSPACE/bin/ffmpeg"
otool -L "$WORKSPACE/bin/ffprobe"

echo "Building done. The binaries can be found here: $WORKSPACE/bin/ffmpeg $WORKSPACE/bin/ffprobe"

mkdir ffmpeg-mac/
cp -r "$WORKSPACE/bin/" "$CWD/ffmpeg-mac/"

# Copy the libmp3lame library to the same directory as the ffmpeg executable
cp "$WORKSPACE/lib/libmp3lame.0.dylib" "$CWD/ffmpeg-mac/"

# Update the dynamic library path of the ffmpeg executable to include the lib
