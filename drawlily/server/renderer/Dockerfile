# syntax=docker/dockerfile:1.6
# Multi-stage build of LilyPond 2.26.0 (the current stable release
# branch) from source. Works on both linux/amd64 and linux/arm64 since
# LilyPond publishes no upstream linux-arm64 binary. Drops the previous
# lyp/lys dependency entirely; the in-process Scheme render server lives
# in lily-server.scm. The development branch (2.27.x) is built the same
# way in ../renderer-unstable.

#---------------------------------------------------------------------
# Stage 1: build LilyPond from source.
#---------------------------------------------------------------------
FROM debian:sid-slim AS builder

ARG LILYPOND_VERSION=2.26.0
ARG LILYPOND_TARBALL_URL=https://gitlab.com/lilypond/lilypond/-/releases/v${LILYPOND_VERSION}/downloads/lilypond-${LILYPOND_VERSION}.tar.gz
# Pinned checksum of the lilypond-2.26.0 release tarball. The build
# verifies this unconditionally (fail-closed); override it when bumping
# LILYPOND_VERSION. Leaving it blank now fails the build rather than
# silently compiling an unverified download.
ARG LILYPOND_TARBALL_SHA256=bbe82dbeba7f7f99ddcd8d1fa134a0d89cafa6e8f815fde5bb01f4208b06fe05

# Build dependencies (autotools-based). See INSTALL.txt sections
# 1.2.1 (runtime) and 1.2.2 (compile) for the canonical list.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        wget \
        autoconf \
        automake \
        pkg-config \
        bison \
        flex \
        libfl-dev \
        gettext \
        texinfo \
        texlive \
        texlive-fonts-recommended \
        texlive-metapost \
        t1utils \
        fontforge \
        ghostscript \
        python3 \
        guile-3.0-dev \
        libgmp-dev \
        libfontconfig1-dev \
        libfreetype6-dev \
        libharfbuzz-dev \
        libpango1.0-dev \
        libcairo2-dev \
        libglib2.0-dev \
        libpng-dev \
        libreadline-dev \
        libltdl-dev \
        && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN wget -q -O lilypond.tar.gz "${LILYPOND_TARBALL_URL}" && \
    echo "${LILYPOND_TARBALL_SHA256}  lilypond.tar.gz" | sha256sum -c - && \
    tar xzf lilypond.tar.gz && \
    rm lilypond.tar.gz

RUN mkdir -p /src/build && cd /src/build && \
    /src/lilypond-${LILYPOND_VERSION}/configure \
        --prefix=/usr/local \
        --disable-documentation && \
    make -j"$(nproc)" && \
    make install

# Smoke-test the freshly built binary.
RUN echo '{c4}' | lilypond - 2>/dev/null && ls -la /usr/local/bin/lilypond
