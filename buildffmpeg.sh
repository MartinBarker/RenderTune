#!/bin/bash

set -e

CWD=$(pwd)
PACKAGES="$CWD/packages"
WORKSPACE="$CWD/workspace"
ADDITIONAL_CONFIGURE_OPTIONS=""


mkdir -p "$PACKAGES"
mkdir -p "$WORKSPACE"

FFMPEG_TAG="$1"
FFMPEG_URL="https://git.ffmpeg.org/gitweb/ffmpeg.git/snapshot/74c4c539538e36d8df02de2484b045010d292f2c.tar.gz"

FFMPEG_ARCHIVE="$PACKAGES/ffmpeg.tar.gz"

if [ ! -f "$FFMPEG_ARCHIVE" ]; then
	echo "Downloading tag ${FFMPEG_TAG}..."
	curl -L -k -o "$FFMPEG_ARCHIVE" "$FFMPEG_URL"
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
    --extra-cflags="-I$WORKSPACE/include -mmacosx-version-min=${MACOS_MIN} -I/usr/local/Cellar/lame/3.100/include" \
    --extra-ldflags="-L$WORKSPACE/lib -mmacosx-version-min=${MACOS_MIN} -L/usr/lib" \
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
    --enable-libmp3lame=static \
    --enable-libx264

make -j 4
make install

otool -L "$WORKSPACE/bin/ffmpeg"
otool -L "$WORKSPACE/bin/ffprobe"

echo "Building done. The binaries can be found here: $WORKSPACE/bin/ffmpeg $WORKSPACE/bin/ffprobe"

mkdir ffmpeg-mac/ 
cp -r "$WORKSPACE/bin/" "$CWD/ffmpeg-mac/"

rm -rf "$PACKAGES"
rm -rf "$WORKSPACE"

exit 0
